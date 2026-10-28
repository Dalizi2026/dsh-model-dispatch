/** User-owned routing, persisted before generation and checked again at dispatch. */
import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'
import type { Context } from '@deepseek-ai/cordis'
import { isAgentLoopRequest, type GenerateOptions, type LlmCallConfig } from '@deepseek-ai/dsh-llm'
import type {} from '@deepseek-ai/dsh-system-prompt'
import type {} from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/dsh-compaction'
import type { AgentOptions } from '@deepseek-ai/dsh-agent'
import { readRoute } from './config.ts'
import { sameSelection, type Config, type ModelSelectionConfig } from './shared.ts'
import { mergeAgentOptions } from './merge.ts'
import { delegationSelection } from './delegation-selection.ts'
import { type LockStore, validSelection } from './route-locks.ts'
import { PLUGIN_VERSION, ROUTE_POLICY_VERSION, type RouteLock, type RouteSource, type RouteStatus } from './route-contract.ts'

export class RouteBlocked extends Error {
  constructor(readonly code: string, message: string) { super(message); this.name = 'ModelRouteBlocked' }
}
export interface RoutingAgent {
  id: string
  options?: AgentOptions
  session: { header: { origin?: string; parentSession?: string }; requestHeader?(): { config: ModelSelectionConfig } | undefined }
}
export interface RouteDecision { selection: ModelSelectionConfig; source: RouteSource }
export type RouteAdmission = (route: ModelSelectionConfig) => Promise<ModelSelectionConfig>
interface Overrides { ready(): Promise<void>; get(id: string): ModelSelectionConfig | undefined }
interface Creation extends RouteDecision { parentId: string; conflict?: Partial<ModelSelectionConfig> }
export class RouteEnforcer {
  private state: 'loading' | 'ready' | 'blocked' = 'loading'
  private failure?: string
  private initialization?: Promise<void>
  private creation = new AsyncLocalStorage<Creation>()
  private compactions = new WeakMap<object, string>()
  private actual = new Map<string, ModelSelectionConfig>()
  private blocked = new Map<string, string>()
  private attached = new WeakSet<object>()
  private requestGuards = new WeakMap<object, () => unknown>()
  private conflicts = new Map<string, Partial<ModelSelectionConfig>>()
  constructor(private ctx: Context, private current: () => Config, private overrides: Overrides,
    readonly locks: LockStore, private admit: RouteAdmission) {}

  /** Call after installing guards. Errors are contained so guards stay mounted. */
  initialize(): Promise<void> {
    return this.initialization ??= Promise.all([this.overrides.ready(), this.locks.ready()]).then(() => {
      if (this.state !== 'blocked') this.state = 'ready'
    }).catch(cause => { this.fail(cause) })
  }
  fail(cause: unknown): void { this.state = 'blocked'; this.failure = cause instanceof Error ? cause.message : String(cause) }
  async ready(): Promise<void> {
    await this.initialize()
    if (this.state !== 'ready') throw new RouteBlocked('ROUTING_UNAVAILABLE', this.failure ?? 'Model routing is not ready')
  }
  async decision(parent: RoutingAgent): Promise<RouteDecision> {
    await this.ready()
    if (parent.session.header.origin === 'subagent') {
      const lock = this.requireLock(parent)
      return { selection: { ...lock.selection }, source: 'inherited-lock' }
    }
    const session = this.overrides.get(parent.id)
    if (session !== undefined) {
      if (!validSelection(session)) throw new RouteBlocked('INVALID_USER_SELECTION', 'The session child model is invalid')
      return { selection: { ...session }, source: 'session' }
    }
    const route = readRoute(this.current().subagent)
    if (route !== undefined && route.mode !== 'custom' && route.mode !== 'follow-main') throw new RouteBlocked('INVALID_USER_SELECTION', 'Unknown child model mode')
    if (route?.mode === 'custom') {
      if (!validSelection(route.selection)) throw new RouteBlocked('INVALID_USER_SELECTION', 'The configured child model is incomplete')
      return { selection: { ...route.selection }, source: 'default' }
    }
    const projections = this.ctx.get('sessionProjections') as { stateOf(session: unknown, key: string): { pending?: ModelSelectionConfig; lastUsed?: ModelSelectionConfig } | undefined } | undefined
    const state = projections?.stateOf(parent.session, 'modelSelection')
    const main = state?.pending ?? state?.lastUsed ?? parent.session.requestHeader?.()?.config ?? parent.options
    if (!validSelection(main)) throw new RouteBlocked('MAIN_MODEL_UNAVAILABLE', 'Cannot determine the current main model; delegation is blocked')
    return { selection: { provider: main.provider, model: main.model, ...main.reasoningEffort === undefined ? {} : { reasoningEffort: String(main.reasoningEffort) } }, source: 'follow-main' }
  }
  async resolve(parent: RoutingAgent): Promise<RouteDecision> {
    const decision = await this.decision(parent)
    return { ...decision, selection: await this.admit(decision.selection) }
  }
  async delegate<T>(providerName: string, parent: RoutingAgent, requested: AgentOptions | undefined,
    run: (options: AgentOptions) => Promise<T>): Promise<T> {
    const active = this.creation.getStore()
    const decision = active?.parentId === parent.id ? { selection: { ...active.selection }, source: active.source } : await this.resolve(parent)
    const runtime = this.ctx.subagents as unknown as { getProvider?(name: string): { prepareContinuable?: unknown } | undefined }
    const provider = runtime.getProvider?.(providerName)
    if (!provider || typeof provider.prepareContinuable !== 'function') throw new RouteBlocked('UNVERIFIABLE_BACKEND', 'This delegation backend cannot guarantee the selected child model')
    const supplied = delegationSelection.getStore()
    const candidate = supplied?.parent === parent ? supplied : requested
    const conflict = candidate && (['provider', 'model', 'reasoningEffort'] as const)
      .some(key => candidate[key] !== undefined && candidate[key] !== decision.selection[key])
      ? { ...candidate.provider === undefined ? {} : { provider: String(candidate.provider) }, ...candidate.model === undefined ? {} : { model: String(candidate.model) }, ...candidate.reasoningEffort === undefined ? {} : { reasoningEffort: String(candidate.reasoningEffort) } } : undefined
    return this.creation.run({ ...decision, parentId: parent.id, conflict: conflict ?? (active?.parentId === parent.id ? active.conflict : undefined) }, () => run(mergeAgentOptions(requested, decision.selection)))
  }
  async created(agent: RoutingAgent): Promise<void> {
    if (agent.session.header.origin !== 'subagent') return
    await this.ready()
    const existing = this.locks.get(agent.id)
    if (existing) { this.requireLock(agent); return }
    const pending = this.creation.getStore()
    if (!pending || pending.parentId !== agent.session.header.parentSession) {
      this.blocked.set(agent.id, 'Confirm the model for this historical subagent before continuing')
      return
    }
    await this.locks.set({ childId: agent.id, parentId: pending.parentId, selection: { ...pending.selection }, source: pending.source,
      policyVersion: 1, revision: randomUUID(), ...pending.conflict ? { conflict: pending.conflict } : {} })
    if (pending.conflict) this.conflicts.set(agent.id, pending.conflict)
  }
  requireLock(agent: RoutingAgent): RouteLock {
    const lock = this.locks.get(agent.id)
    if (!lock || lock.parentId !== agent.session.header.parentSession) throw new RouteBlocked('MODEL_CONFIRMATION_REQUIRED', 'Confirm the model for this historical subagent before continuing')
    return lock
  }
  async request(agent: RoutingAgent, seed: LlmCallConfig): Promise<LlmCallConfig> {
    await this.ready()
    const lock = this.requireLock(agent)
    const route = await this.admit(lock.selection)
    if (!sameSelection(route, lock.selection)) throw new RouteBlocked('LOCKED_MODEL_CHANGED', 'The provider changed the locked model or reasoning effort')
    const { reasoningEffort: _oldEffort, ...rest } = seed
    return { ...rest, provider: lock.selection.provider, model: lock.selection.model, ...lock.selection.reasoningEffort === undefined ? {} : { reasoningEffort: lock.selection.reasoningEffort as LlmCallConfig['reasoningEffort'] } }
  }
  async verify(options: { sessionId?: string; provider: string; model: string; reasoningEffort?: string; purpose?: string }): Promise<void> {
    const loop = isAgentLoopRequest(options as GenerateOptions)
    if (!options.sessionId) {
      if (loop || options.purpose === 'compaction') throw new RouteBlocked('MISSING_SESSION', 'A loop or compaction request without session identity cannot be verified')
      return
    }
    const agent = this.agent(options.sessionId)
    const lock = this.locks.get(options.sessionId)
    const header = agent?.session.header ?? await this.header(options.sessionId)
    if (!header) throw new RouteBlocked('UNKNOWN_SESSION', 'Cannot verify the owner of this loop request')
    const child = header?.origin === 'subagent' || lock !== undefined
    if (!child) return
    await this.ready()
    if (!lock || (header && lock.parentId !== header.parentSession)) throw new RouteBlocked('MODEL_CONFIRMATION_REQUIRED', 'A verified child model lock is required before dispatch')
    // Only the native, currently open compaction transaction may omit effort.
    // A public purpose string alone never relaxes the lock, nor does a loop
    // request carrying that string. Provider/model and ownership stay exact.
    const compactDefault = !loop && options.purpose === 'compaction' && options.reasoningEffort === undefined
      && agent !== undefined && this.compactions.has(agent.session)
    const fields = ['provider', 'model', 'reasoningEffort'] as const
    const mismatches = fields.filter(key => !(key === 'reasoningEffort' && compactDefault) && lock.selection[key] !== options[key])
    if (mismatches.length) {
      const reason = 'Blocked model mismatch: ' + mismatches.map(key =>
        `${key} expected ${JSON.stringify(lock.selection[key]) ?? '<default>'}, received ${JSON.stringify(options[key]) ?? '<default>'}`).join('; ')
      this.blocked.set(options.sessionId, reason)
      throw new RouteBlocked('MODEL_ROUTE_MISMATCH', reason)
    }
    this.blocked.delete(options.sessionId)
    this.actual.set(options.sessionId, { provider: options.provider, model: options.model,
      ...options.reasoningEffort === undefined ? {} : { reasoningEffort: options.reasoningEffort } })
  }

  /** Saved session override or settings default, without a live agent; not live-verified. */
  private savedRoute(id: string): { selection?: ModelSelectionConfig; source: RouteSource } {
    const session = this.overrides.get(id)
    if (session !== undefined) {
      if (!validSelection(session)) throw new RouteBlocked('INVALID_USER_SELECTION', 'The saved session child model is invalid')
      return { selection: { ...session }, source: 'session' }
    }
    const route = readRoute(this.current().subagent)
    if (route !== undefined && route.mode !== 'custom' && route.mode !== 'follow-main') throw new RouteBlocked('INVALID_USER_SELECTION', 'Unknown child model mode')
    if (route?.mode === 'custom') {
      if (!validSelection(route.selection)) throw new RouteBlocked('INVALID_USER_SELECTION', 'The configured child model is incomplete')
      return { selection: { ...route.selection }, source: 'default' }
    }
    return { source: 'follow-main' }
  }
  private agent(id: string): RoutingAgent | undefined {
    return (this.ctx.get('agents') as { get(id: string): RoutingAgent | undefined } | undefined)?.get(id)
  }
  async header(id: string): Promise<RoutingAgent['session']['header'] | undefined> {
    const live = this.agent(id)
    if (live) return live.session.header
    const persistence = this.ctx.get('sessionPersistence') as { stat(id: string): Promise<{ meta?: RoutingAgent['session']['header']; header?: RoutingAgent['session']['header'] } | undefined> } | undefined
    const stat = await persistence?.stat(id)
    return stat?.meta ?? stat?.header
  }
  async confirm(parentId: string, childId: string, selection: ModelSelectionConfig): Promise<RouteLock> {
    await this.ready()
    const parent = await this.header(parentId); const child = await this.header(childId)
    if (!parent || child?.origin !== 'subagent' || child.parentSession !== parentId) throw new RouteBlocked('INVALID_CHILD_OWNERSHIP', 'The child does not belong to this parent')
    if (this.locks.get(childId)) throw new RouteBlocked('ALREADY_LOCKED', 'This child already has a locked model')
    const lock: RouteLock = { childId, parentId, selection: await this.admit(selection), source: 'user-confirmed', policyVersion: 1, revision: randomUUID() }
    await this.locks.set(lock); this.blocked.delete(childId)
    return lock
  }
  async status(id: string): Promise<RouteStatus> {
    await this.initialize()
    const value: RouteStatus = { pluginVersion: PLUGIN_VERSION, policyVersion: ROUTE_POLICY_VERSION, health: this.state, state: this.state === 'ready' ? 'ready' : 'blocked', sessionId: id }
    try {
      await this.ready()
      const header = await this.header(id)
      if (!header) {
        value.state = 'missing'; value.error = 'Session does not exist or is unavailable'
        return value
      }
      if (header.origin === 'subagent' || this.locks.get(id)) {
        value.parentId = header?.parentSession ?? this.locks.get(id)?.parentId
        const lock = this.locks.get(id)
        if (!lock) { value.state = 'confirmation-required'; return value }
        if (header && lock.parentId !== header.parentSession) throw new RouteBlocked('INVALID_CHILD_OWNERSHIP', 'Child lock ownership does not match the session')
        value.expected = lock.selection; value.source = lock.source; value.revision = lock.revision; value.state = 'locked'
        value.actual = this.actual.get(id); value.conflict = this.conflicts.get(id) ?? lock.conflict
        const resolved = await this.admit(lock.selection)
        if (!sameSelection(resolved, lock.selection)) throw new RouteBlocked('LOCKED_MODEL_CHANGED', 'The locked route is no longer valid')
        if (this.blocked.has(id)) { value.state = 'blocked'; value.error = this.blocked.get(id) }
      } else {
        const agent = this.agent(id)
        if (!agent) {
          // Saved selection remains editable, but without live parent state it
          // is not a verified delegation route and must never receive a checkmark.
          const saved = this.savedRoute(id)
          value.source = saved.source; value.state = 'unverified'
          if (saved.selection) value.expected = await this.admit(saved.selection)
          return value
        }
        const decision = await this.resolve(agent); value.expected = decision.selection; value.source = decision.source
      }
    } catch (cause) { value.state = 'blocked'; value.error = cause instanceof Error ? cause.message : String(cause) }
    return value
  }
  private attachRequestGuard(agent: RoutingAgent & { ctx: Context }): void {
    if (agent.session.header.origin !== 'subagent' || this.attached.has(agent)) return
    this.attached.add(agent)
    const dispose = this.ctx.effect(() => agent.ctx.on('agent/request', async (_payload, next) => {
      try { return await this.request(agent, await next()) }
      catch (cause) { this.blocked.set(agent.id, cause instanceof Error ? cause.message : String(cause)); throw cause }
    }, { prepend: true }), 'model-switch: child request lock')
    this.requestGuards.set(agent, dispose)
  }
  installGuards(): void {
    this.ctx.on('session/event', (session, event): undefined => {
      if (event.type === 'compaction/start') this.compactions.set(session, event.data.compactionId)
      else if (event.type === 'compaction/end' && this.compactions.get(session) === event.data.compactionId) this.compactions.delete(session)
    }, { global: true })
    this.ctx.on('agent/created', async ({ agent }) => { await this.created(agent as unknown as RoutingAgent) })
    this.ctx.on('system-prompt/assemble', async (_assembly, context, next) => {
      const agent = context.agent
      if (agent?.session.header.origin !== 'subagent') return next()
      await this.ready(); const lock = this.requireLock(agent as unknown as RoutingAgent)
      const assembled = await next()
      return { ...assembled, variables: { ...assembled.variables, ...lock.selection } }
    }, { prepend: true })
    this.ctx.on('agent/created', ({ agent }): undefined => { this.attachRequestGuard(agent as unknown as RoutingAgent & { ctx: Context }) })
    this.ctx.on('agent/disposed', ({ agent }): undefined => {
      this.requestGuards.get(agent)?.()
      this.requestGuards.delete(agent)
    })
    // HMR may activate while existing children are idle or running. Attach to
    // their next request without cancelling a stream already in progress.
    const registry = this.ctx.get('agents') as { list?(): (RoutingAgent & { ctx: Context })[] } | undefined
    for (const agent of registry?.list?.() ?? []) this.attachRequestGuard(agent)
    const enforcer = this
    this.ctx.on('llm/stream', async function* (options, next) {
      await enforcer.verify(options)
      yield* next()
    }, { prepend: true })
  }
}

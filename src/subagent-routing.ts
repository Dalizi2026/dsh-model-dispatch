/** Validate and install the final child route before creating a child. */
import type { Context } from '@deepseek-ai/cordis'
import type { AgentOptions } from '@deepseek-ai/dsh-agent'
import type { SubagentRuntime } from '@deepseek-ai/dsh-subagent'
import { readRoute, resolveCustomSelection } from './config.ts'
import type { Config, ModelSelectionConfig } from './shared.ts'
import { mergeAgentOptions } from './merge.ts'
import type { RouteValidator } from './model-route.ts'
import type { SessionOverrideStore } from './session-overrides.ts'
import { delegationSelection } from './delegation-selection.ts'


/** One delegation request as the host hands it to a subagent entry point. */
interface SubagentStartRequest {
  parent: unknown
  agentOptions?: AgentOptions
  [key: string]: unknown
}

/** Activation / continuable specs carry the request one level down. */
interface SubagentStartSpec {
  request: SubagentStartRequest
  [key: string]: unknown
}

/**
 * Subagent entry points across DSH releases.
 *
 * DSH 0.2.0-rc.x exposes `start(name, request)` and `startContinuable(spec)`;
 * DSH 0.2.1-rc.1 merged them into `startActivation(spec)`. A plugin that only
 * wraps the old names assigns to properties the host no longer has, which fails
 * silently and leaves the child on the parent's route.
 */
interface SubagentStartRuntime {
  start?: (name: string, request: SubagentStartRequest) => Promise<unknown>
  startContinuable?: (spec: SubagentStartSpec) => Promise<unknown>
  startActivation?: (spec: SubagentStartSpec) => Promise<unknown>
}

type SubagentStartMethod = keyof SubagentStartRuntime

export function installSubagentRouting(ctx: Context, current: () => Config, overrides: SessionOverrideStore, validate: RouteValidator): void {
  const selectionFor = (parent: unknown): ModelSelectionConfig | undefined => {
    const id = (parent as { id?: unknown } | undefined)?.id
    return (typeof id === 'string' ? overrides.get(id) : undefined)
      ?? resolveCustomSelection(readRoute(current().subagent))
  }
  const optionsFor = async (parent: unknown, requested: AgentOptions | undefined): Promise<AgentOptions | undefined> => {
    const selection = selectionFor(parent)
    const explicit = delegationSelection.getStore()
    const toolSelection = explicit?.parent === parent ? explicit : undefined
    if (!selection && !toolSelection) {
      if (readRoute(current().subagent)?.mode === 'custom') ctx.logger.warn('dsh-model-dispatch: subagent selection is incomplete; following parent')
      return undefined
    }
    const options = selection ? mergeAgentOptions(requested, selection) : { ...requested }
    if (toolSelection?.provider !== undefined) {
      options.provider = toolSelection.provider
      options.model = toolSelection.model
      // Effort belongs to a route. Selecting a new route without an effort
      // uses its adapter default, rather than a configured default's effort.
      delete options.reasoningEffort
    }
    if (toolSelection?.reasoningEffort !== undefined) options.reasoningEffort = toolSelection.reasoningEffort as AgentOptions['reasoningEffort']
    if (toolSelection && (options.provider === undefined || options.model === undefined)) {
      const agent = parent as { options?: AgentOptions; session?: { requestHeader(): { config: AgentOptions } | undefined } }
      const parentOptions = agent.session?.requestHeader()?.config ?? agent.options
      options.provider ??= parentOptions?.provider
      options.model ??= parentOptions?.model
    }
    if (toolSelection && (options.provider === undefined || options.model === undefined)) throw new Error('Cannot determine the effective child model route')
    // Validate AFTER explicit request options win, so an obsolete default does
    // not block a valid explicit route. Native inheritance handles omitted pairs.
    if (options.provider !== undefined && options.model !== undefined) {
      await validate({ provider: options.provider, model: options.model, ...options.reasoningEffort === undefined ? {} : { reasoningEffort: String(options.reasoningEffort) } })
    }
    return options
  }
  const runtime = ctx.subagents as unknown as SubagentStartRuntime
  ctx.effect(() => {
    // Wrap every entry point this host exposes: start/startContinuable on 0.2.0
    // hosts, startActivation on 0.2.1 and later. Wrapping a missing method is a
    // no-op, so the same code covers both releases.
    const restores: Array<() => void> = []

    const wrapSpec = (method: 'startActivation' | 'startContinuable'): void => {
      const original = runtime[method]
      if (typeof original !== 'function') return
      const wrapped = async (spec: SubagentStartSpec): Promise<unknown> => {
        const request = spec?.request
        const agentOptions = await optionsFor(request?.parent, request?.agentOptions)
        return original.call(runtime, agentOptions === undefined ? spec : { ...spec, request: { ...request, agentOptions } })
      }
      runtime[method] = wrapped
      restores.push(() => { if (runtime[method] === wrapped) runtime[method] = original })
    }

    const wrapStart = (): void => {
      const original = runtime.start
      if (typeof original !== 'function') return
      const wrapped = async (name: string, request: SubagentStartRequest): Promise<unknown> => {
        const agentOptions = await optionsFor(request?.parent, request?.agentOptions)
        return original.call(runtime, name, agentOptions === undefined ? request : { ...request, agentOptions })
      }
      runtime.start = wrapped
      restores.push(() => { if (runtime.start === wrapped) runtime.start = original })
    }

    wrapSpec('startActivation')
    wrapSpec('startContinuable')
    wrapStart()
    return () => { for (const restore of restores) restore() }
  }, 'model-switch: validate and wrap subagent start')
}

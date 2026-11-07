import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { installModelSelection } from '@deepseek-ai/dsh-agent'
import { installPlanModelSwitch, type PlanMainStore } from '../src/plan-model.ts'
import { PLAN_BOUNDARY_KEY, planBoundaryDefinition } from '../src/plan-boundary.ts'
import { HostSeams, PLAN_APPROVED_SEAM } from '../src/host-seams.ts'
import type { Config, ModelSelectionConfig } from '../src/shared.ts'

const smart = { provider: 'step', model: 'step-model' }
const main = { provider: 'droid', model: 'sonnet', reasoningEffort: 'high' }
function setup(config: Config = { planPlanning: { mode: 'custom', selection: smart } }, isolated = false, store?: PlanMainStore) {
  const events = new Context()
  const session = { header: { id: 's1', origin: undefined as string | undefined } }
  const agent = { id: 's1', session, options: { ...main } }
  const plan = { active: false, wanted: null as boolean | null, pending: undefined as boolean | undefined }
  const projected = { lastUsed: main as ModelSelectionConfig | null, pending: null as ModelSelectionConfig | null }
  const selected = { current: main as ModelSelectionConfig, assembled: undefined as ModelSelectionConfig | undefined }
  const values = new Map<string, ModelSelectionConfig>()
  const mains = store ?? { get: (id: string) => values.get(id), async set(id: string, value: ModelSelectionConfig | undefined) { if (value) values.set(id, { ...value }); else values.delete(id) } }
  let boundary = planBoundaryDefinition.init()
  const calls: ModelSelectionConfig[] = []
  let admission: Promise<void> = Promise.resolve()
  installModelSelection(events, selected as never)
  events.on('agent/pre-step', async (_context, next) => {
    const decision = await next()
    if (decision.kind !== 'reject' && plan.pending !== undefined) { plan.active = plan.pending; plan.pending = undefined; plan.wanted = null }
    return decision
  })
  // The host services the switch reads; tests remove a method to model a changed DSH.
  const services: Record<string, Record<string, unknown>> = {
    sessionProjections: {
      register() {},
      stateOf(_session: unknown, key: string) { return key === 'plan' ? plan : key === PLAN_BOUNDARY_KEY ? boundary : projected },
    },
    sessionController: { async selectModel(request: ModelSelectionConfig) {
      await admission; calls.push(request); projected.pending = request; selected.current = request
    } },
    agentDefaultModel: { saveSelection() {} },
  }
  // Native /plan and exit tool stand-ins: like DSH 0.2.2 between turns, the
  // command commits plan state at once and approval queues the exit.
  const commands = { async execute(_agent: unknown, line: string) {
    if (line.trim() === '/plan') plan.active = true
    if (line.trim() === '/plan off') plan.active = false
    return { ok: true }
  } }
  const exitTool = { name: 'exit_plan_mode', async execute(args: { approve: boolean }) {
    if (args.approve) plan.pending = false
    return { approved: args.approve }
  } }
  const optional: Record<string, unknown> = { commands, tools: { get: (name: string) => name === 'exit_plan_mode' ? exitTool : undefined } }
  const lookup = (name: string) => name === 'planMode' ? (isolated ? undefined : { get: () => plan }) : optional[name] ?? services[name]
  const seams = new HostSeams({ get: lookup, logger: { warn() {}, info() {} } } as never)
  const disposers: (() => void)[] = []
  const scope: Record<string, unknown> = { on: events.on.bind(events), get: lookup, ...services, ...optional,
    logger: { warn() {}, info() {} },
    effect(install: () => () => void) { disposers.push(install()) },
    inject(deps: string[], apply: (ctx: unknown) => void) { if (deps.every(name => lookup(name) !== undefined)) apply(scope) } }
  installPlanModelSwitch(scope as never, () => config, mains, seams)
  return {
    session, agent, plan, projected, calls, mains, services, seams, commands, exitTool, optional,
    /** The route a host that fixes it before assembly (DSH 0.2.2) would use for the next step. */
    nextRoute: () => selected.current,
    dispose() { for (const dispose of disposers.splice(0).reverse()) dispose() },
    gate(promise: Promise<void>) { admission = promise },
    event(type: string, data: any) {
      boundary = planBoundaryDefinition.apply(boundary, { type, data })
      events.emit('session/event', session, { type, data })
    },
    approve() {
      boundary = planBoundaryDefinition.apply(boundary, { type: 'tool/call', data: { name: 'exit_plan_mode', callId: 'exit1' } })
      boundary = planBoundaryDefinition.apply(boundary, { type: 'tool/result', data: { message: { source: { callId: 'exit1' }, content: [{ type: 'text', text: 'Plan approved — plan mode exited; carry out the plan starting with your next step.' }] } } })
      plan.pending = false
    },
    select(value: ModelSelectionConfig) { selected.current = value; projected.pending = value },
    async reviewResult(approved: boolean, isError = false) {
      await events.emit('tools/result', { name: 'exit_plan_mode', agent }, { isError, value: { approved }, content: [] })
    },
    async reviewValue(value: unknown) {
      await events.emit('tools/result', { name: 'exit_plan_mode', agent }, { isError: false, value, content: [] })
    },
    async request() {
      await events.waterfall('system-prompt/assemble', { variables: {} }, { agent }, async () => ({ variables: {} }))
      return events.waterfall('agent/request', {}, async () => main)
    },
    consume() { projected.lastUsed = selected.current; projected.pending = null },
    async commit() {
      await events.waterfall('agent/pre-step', { agent, step: 1, messages: [], signal: new AbortController().signal }, async () => ({ kind: 'accept', messages: [] }))
      boundary = planBoundaryDefinition.apply(boundary, { type: 'plan/mode', data: { active: plan.active } })
    },
  }
}

describe('temporary planning models before native model snapshots', () => {
  it('blocks generation if plan recovery storage cannot load instead of silently disabling switching', async () => {
    const h = setup(undefined, false, { ready: async () => { throw new Error('corrupt recovery file') }, get: () => undefined, set: async () => {} })
    await expect(h.request()).rejects.toThrow('corrupt recovery file')
    expect(h.calls).toEqual([])
  })
  it('discards an earlier canonical approval when a new /plan intent supersedes it', async () => {
    const h = setup(undefined, true)
    await h.request(); h.plan.active = true
    expect((await h.request()).model).toBe(smart.model); h.consume()
    await h.reviewResult(true)
    h.event('command/run', { name: 'plan', args: '', commandId: 'plan-again' })
    expect((await h.request()).model).toBe(smart.model)
    expect(h.mains.get('s1')).toEqual(main)
  })
  it('uses the canonical approval value even if rendered approval text changes', async () => {
    const h = setup(undefined, true)
    await h.request(); h.plan.active = true
    expect((await h.request()).model).toBe(smart.model); h.consume()
    await h.reviewResult(true)
    expect(await h.request()).toMatchObject(main)
    expect(h.mains.get('s1')).toBeUndefined()
  })
  it('keeps the planning model after the new successful approved:false dismissal and after errors', async () => {
    const h = setup(undefined, true)
    await h.request(); h.plan.active = true
    expect((await h.request()).model).toBe(smart.model); h.consume()
    await h.reviewResult(false)
    expect((await h.request()).model).toBe(smart.model)
    await h.reviewResult(true, true)
    expect((await h.request()).model).toBe(smart.model)
    expect(h.mains.get('s1')).toEqual(main)
  })
  it('leaves ordinary chats and repeated assemblies untouched', async () => {
    const h = setup(); expect(await h.request()).toEqual(main); expect(await h.request()).toEqual(main); expect(h.calls).toEqual([])
  })
  it('drafts with STEP then restores original provider/model/effort on FIRST execution request', async () => {
    const h = setup(); await h.request(); h.plan.pending = true
    expect((await h.request()).model).toBe(smart.model); expect(h.mains.get('s1')).toEqual(main)
    h.consume(); h.plan.active = true; h.approve()
    expect(await h.request()).toMatchObject(main); expect(h.mains.get('s1')).toBeUndefined()
  })
  it('sees approved tool results before the isolated native planMode commits', async () => {
    const h = setup(undefined, true); await h.request(); h.plan.active = true
    expect((await h.request()).model).toBe(smart.model); h.consume(); h.approve()
    expect(await h.request()).toMatchObject(main)
    await h.commit(); h.consume(); h.plan.active = true
    expect((await h.request()).model).toBe(smart.model)
  })
  it('uses the planning model on the first next-step request when /plan is issued during an open turn with isolated planMode', async () => {
    const h = setup(undefined, true)
    expect(await h.request()).toEqual(main); h.consume()
    // Native command/done records wanted:true before pre-step commits active.
    // The parent service cannot see the isolated pending intent directly.
    h.plan.pending = true; h.plan.wanted = true
    expect(h.plan.active).toBe(false)
    expect((await h.request()).model).toBe(smart.model)
    await h.commit(); h.consume(); h.approve()
    expect(await h.request()).toMatchObject(main)
  })
  it('captures a changed main model on the next cycle', async () => {
    const h = setup(); await h.request(); h.plan.pending = true; await h.request(); h.consume(); h.plan.active = true; h.approve(); await h.request(); await h.commit(); h.consume()
    const next = { provider: 'other', model: 'main-2' }; h.select(next); h.plan.pending = true
    await h.request(); h.consume(); h.plan.active = true; h.approve()
    expect(await h.request()).toMatchObject(next)
  })
  it('restores even when the temporary selection has not been consumed', async () => {
    const h = setup(); h.plan.pending = true; await h.request(); h.plan.active = true; h.plan.pending = false
    expect(await h.request()).toMatchObject(main)
  })
  it('restores after direct /plan off instead of requiring review', async () => {
    const h = setup(undefined, true); h.plan.active = true; await h.request(); h.consume(); h.plan.active = false
    expect(await h.request()).toMatchObject(main)
  })
  for (const exit of ['approval', '/plan off']) {
    it(`restores when ${exit} is projected before pre-step, and retries failed admission`, async () => {
      const h = setup(undefined, true)
      await h.request(); h.plan.active = true
      expect((await h.request()).model).toBe(smart.model); h.consume()
      if (exit === 'approval') await h.reviewResult(true)
      h.plan.active = false
      h.event('plan/mode', { active: false })
      await h.commit()
      h.gate(Promise.reject(new Error('restore unavailable')))
      await expect(h.request()).rejects.toThrow('restore unavailable')
      expect(h.mains.get('s1')).toEqual(main)
      h.gate(Promise.resolve())
      expect(await h.request()).toMatchObject(main)
      expect(h.mains.get('s1')).toBeUndefined()
      h.consume(); expect(await h.request()).toMatchObject(main)
    })
  }
  it('preserves a durable original model across restart and direct exit', async () => {
    const first = setup(); first.plan.pending = true; await first.request()
    const resumed = setup(undefined, true, first.mains); resumed.select(smart); resumed.consume(); resumed.plan.active = true
    await resumed.request(); expect(resumed.mains.get('s1')).toEqual(main)
    resumed.plan.active = false; expect(await resumed.request()).toMatchObject(main)
  })
  it('uses agent options when a brand new plan has no model header', async () => {
    const h = setup(); h.projected.lastUsed = null; h.plan.pending = true; await h.request()
    expect(h.mains.get('s1')).toEqual(main)
  })
  it('waits for admission before native model snapshotting', async () => {
    const h = setup(); h.plan.pending = true; let release!: () => void
    h.gate(new Promise<void>(resolve => { release = resolve })); let finished = false
    const request = h.request().then(result => { finished = true; return result })
    await Promise.resolve(); expect(finished).toBe(false); release(); expect((await request).model).toBe(smart.model)
  })
  it('does not override manual picks during drafting or after execution', async () => {
    const h = setup(); h.plan.pending = true; await h.request(); h.consume()
    const manual = { provider: 'manual', model: 'draft' }; h.select(manual); expect(await h.request()).toMatchObject(manual)
    h.plan.active = true; h.approve(); await h.request(); await h.commit(); h.consume()
    h.select(manual); expect(await h.request()).toMatchObject(manual)
  })
  it('leaves subagents untouched and uses main for unconfigured planning', async () => {
    const h = setup(); h.session.header.origin = 'subagent'; h.plan.pending = true
    expect(await h.request()).toEqual(main); expect(h.mains.get('s1')).toBeUndefined()
    const follow = setup({}); follow.plan.pending = true; expect(await follow.request()).toEqual(main)
  })
  it('fails before switching when the original model cannot be persisted', async () => {
    const h = setup(undefined, false, { get: () => undefined, set: async () => { throw new Error('disk unavailable') } }); h.plan.pending = true
    await expect(h.request()).rejects.toThrow('disk unavailable'); expect(h.calls).toEqual([])
  })
  it('retries restore admission failures without forgetting the original', async () => {
    const h = setup(); h.plan.pending = true; await h.request(); h.consume(); h.plan.active = true; h.approve()
    h.gate(Promise.reject(new Error('unavailable'))); await expect(h.request()).rejects.toThrow('unavailable')
    expect(h.mains.get('s1')).toEqual(main); h.gate(Promise.resolve()); expect(await h.request()).toMatchObject(main)
  })
})

describe('switching when the plan intent happens', () => {
  it('records the planning model while /plan runs, before the next step fixes its route', async () => {
    const h = setup(undefined, true)
    await h.request(); h.consume()
    await h.commands.execute(h.agent, '/plan')
    expect(h.nextRoute()).toMatchObject(smart); expect(h.mains.get('s1')).toEqual(main)
    expect((await h.request()).model).toBe(smart.model); expect(h.calls).toHaveLength(1)
  })
  it('restores the main model while /plan off runs', async () => {
    const h = setup(undefined, true)
    await h.request(); h.consume(); await h.commands.execute(h.agent, '/plan'); h.consume()
    await h.commands.execute(h.agent, '/plan off')
    expect(h.nextRoute()).toMatchObject(main); expect(h.mains.get('s1')).toBeUndefined()
  })
  it('restores the main model inside an approved exit tool call, and keeps planning on a rejected one', async () => {
    const h = setup(undefined, true)
    await h.request(); h.consume(); await h.commands.execute(h.agent, '/plan'); h.consume()
    await h.request()
    await expect(h.exitTool.execute({ approve: false }, { agent: h.agent } as never)).resolves.toEqual({ approved: false })
    expect(h.nextRoute()).toMatchObject(smart)
    await expect(h.exitTool.execute({ approve: true }, { agent: h.agent } as never)).resolves.toEqual({ approved: true })
    expect(h.nextRoute()).toMatchObject(main); expect(h.mains.get('s1')).toBeUndefined()
  })
  it('restores the native command and tool on unload', async () => {
    const h = setup(undefined, true); const nativeExit = h.exitTool.execute
    await h.request(); expect(h.exitTool.execute).not.toBe(nativeExit)
    h.dispose(); expect(h.exitTool.execute).toBe(nativeExit)
    await h.commands.execute(h.agent, '/plan'); expect(h.calls).toEqual([])
  })
  it('falls back to switching at assembly when the host has no commands service', async () => {
    const h = setup(undefined, true)
    delete h.optional.commands
    await h.request(); h.consume(); h.plan.active = true
    expect(h.nextRoute()).toMatchObject(main)
    expect((await h.request()).model).toBe(smart.model)
  })
})

describe('plan auto-switch host seams', () => {
  it('keeps main requests on the main model while a plan seam is missing, and switches once it returns', async () => {
    const h = setup(); const controller = h.services.sessionController!; const select = controller.selectModel
    delete controller.selectModel
    h.plan.pending = true
    expect(await h.request()).toEqual(main); expect(h.calls).toEqual([]); expect(h.mains.get('s1')).toBeUndefined()
    expect(h.seams.check('plan-switch')).toEqual({ capability: 'plan-switch', missing: ['sessionController.selectModel'], mismatched: [] })
    controller.selectModel = select
    expect((await h.request()).model).toBe(smart.model)
    expect(h.seams.check('plan-switch')).toEqual({ capability: 'plan-switch', missing: [], mismatched: [] })
  })
  it('reports an approval result without a boolean approved and still restores on the plan exit', async () => {
    const h = setup(undefined, true)
    await h.request(); h.plan.active = true
    expect((await h.request()).model).toBe(smart.model); h.consume()
    await h.reviewValue({ status: 'approved' })
    expect(h.seams.check('plan-switch')).toEqual({ capability: 'plan-switch', missing: [], mismatched: [PLAN_APPROVED_SEAM] })
    expect((await h.request()).model).toBe(smart.model)
    h.plan.active = false; h.event('plan/mode', { active: false }); await h.commit()
    expect(await h.request()).toMatchObject(main)
    await h.reviewResult(false)
    expect(h.seams.check('plan-switch')).toEqual({ capability: 'plan-switch', missing: [], mismatched: [] })
  })
})

describe('approval intent projection', () => {
  const text = 'Plan approved — plan mode exited; carry out the plan starting with your next step.'
  it('rejects errors, unmatched calls and unrelated tools; resets after committed exit', () => {
    let state = planBoundaryDefinition.init()
    const result = (id: string, isError = false) => ({ type: 'tool/result', data: { message: { toolCallId: id, isError, content: [{ type: 'text', text }] } } })
    state = planBoundaryDefinition.apply(state, result('fake')); expect(state.approved).toBe(false)
    state = planBoundaryDefinition.apply(state, { type: 'tool/call', data: { name: 'other', callId: 'other' } })
    state = planBoundaryDefinition.apply(state, result('other')); expect(state.approved).toBe(false)
    state = planBoundaryDefinition.apply(state, { type: 'tool/call', data: { name: 'exit_plan_mode', callId: 'failed' } })
    state = planBoundaryDefinition.apply(state, result('failed', true)); expect(state.approved).toBe(false)
    state = planBoundaryDefinition.apply(state, { type: 'tool/call', data: { name: 'exit_plan_mode', callId: 'ok' } })
    state = planBoundaryDefinition.apply(state, result('ok')); expect(state.approved).toBe(true)
    state = planBoundaryDefinition.apply(state, { type: 'plan/mode', data: { active: false } }); expect(state.approved).toBe(false)
  })
})

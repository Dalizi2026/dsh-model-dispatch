import { describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { markAgentLoopRequest } from '@deepseek-ai/dsh-llm'
import { RouteEnforcer, type RoutingAgent } from '../src/route-enforcer.ts'
import { memoryLocks } from './route-fixture.ts'
import type { Config, ModelSelectionConfig } from '../src/shared.ts'
const glm = { provider: 'glm', model: 'flash', reasoningEffort: 'max' }
const opus = { provider: 'droid', model: 'opus', reasoningEffort: 'high' }
const step = { provider: 'step', model: 'preview' }
function setup() {
  const agents = new Map<string, RoutingAgent>()
  const headers = new Map<string, RoutingAgent['session']['header']>()
  const parent: RoutingAgent = { id: 'parent', session: { header: { origin: 'user' }, requestHeader: () => ({ config: step }) }, options: opus }
  agents.set(parent.id, parent)
  const locks = memoryLocks()
  const hooks = new Map<string, Function[]>()
  let config: Config = { subagent: { mode: 'custom', selection: glm } }
  const overrides = new Map<string, ModelSelectionConfig>()
  let projection: { pending?: ModelSelectionConfig; lastUsed?: ModelSelectionConfig } | undefined
  const admit = vi.fn(async (route: ModelSelectionConfig) => {
    if (route.model === 'invalid') throw new Error('Model unavailable')
    return { ...route }
  })
  const ctx = { subagents: { getProvider: (name: string) => name === 'local' ? { prepareContinuable() {} } : { start() {} } },
    get: (key: string) => key === 'agents' ? { get: (id: string) => agents.get(id), list: () => [...agents.values()] } : key === 'sessionProjections' ? { stateOf: () => projection } : key === 'sessionPersistence' ? { stat: async (id: string) => headers.has(id) ? { header: headers.get(id) } : undefined } : undefined,
    on: (name: string, fn: Function) => { const rows = hooks.get(name) ?? []; rows.push(fn); hooks.set(name, rows); return () => {} },
    effect: (fn: Function) => fn(),
  }
  const enforcer = new RouteEnforcer(ctx as never, () => config, { ready: async () => {}, get: id => overrides.get(id) }, locks, admit)
  const child = (id = 'child', parentId = parent.id): RoutingAgent => {
    const agent = { id, ctx: new Context(), session: { header: { origin: 'subagent', parentSession: parentId } } }
    agents.set(id, agent); return agent
  }
  const start = async (id = 'child', p = parent, requested = opus) => enforcer.delegate('local', p, requested, async options => {
    const agent = child(id, p.id); await enforcer.created(agent); return { agent, options }
  })
  return { ctx, parent, enforcer, locks, overrides, agents, headers, hooks, admit, child, start,
    setConfig: (value: Config) => { config = value }, setProjection: (value: typeof projection) => { projection = value } }
}
describe('user model authority across child lifetimes', () => {
  it('prioritizes session choice over defaults, machine route and preset effort', async () => {
    const h = setup(); h.overrides.set('parent', step)
    const { options } = await h.start()
    expect(options).toEqual(step); expect(h.locks.get('child')).toMatchObject({ selection: step, source: 'session', conflict: opus })
  })
  it('uses pending parent selection before last used and stale creation arguments', async () => {
    const h = setup(); h.setConfig({}); h.setProjection({ pending: glm, lastUsed: opus })
    expect((await h.start()).options).toEqual(glm)
    expect(h.locks.get('child')?.source).toBe('follow-main')
  })
  it('falls back only to confirmed header state, not the tool route', async () => {
    const h = setup(); h.setConfig({})
    expect((await h.start()).options).toEqual(step)
    delete h.parent.options; h.parent.session.requestHeader = () => undefined
    await expect(h.start('other')).rejects.toThrow('Cannot determine')
  })
  it('does not leak another model’s effort, and revalidates availability on each request', async () => {
    const h = setup(); h.overrides.set('parent', step); const { agent } = await h.start()
    expect(await h.enforcer.request(agent, opus as never)).toEqual(step)
    h.admit.mockRejectedValue(new Error('Removed from catalog'))
    await expect(h.enforcer.request(agent, opus as never)).rejects.toThrow('Removed')
  })
  it('keeps existing and nested children locked after the root selection changes', async () => {
    const h = setup(); const { agent } = await h.start(); h.overrides.set('parent', step)
    expect((await h.start('new')).options).toEqual(step)
    expect((await h.start('nested', agent)).options).toEqual(glm)
    expect(h.locks.get('nested')?.source).toBe('inherited-lock')
    expect(await h.enforcer.request(agent, opus as never)).toEqual(glm)
  })
  it('takes a detached selection snapshot across async admission and concurrent sessions', async () => {
    const h = setup(); const selection = { ...step }; h.overrides.set('parent', selection)
    let release!: () => void
    h.admit.mockImplementationOnce(route => new Promise(resolve => { release = () => resolve(route) }))
    const a = h.start('a'); await vi.waitFor(() => expect(release).toBeTypeOf('function'))
    selection.model = 'changed'; release(); await a
    expect(h.locks.get('a')?.selection).toEqual(step)
    const other = { ...h.parent, id: 'other' }; h.agents.set(other.id, other)
    await Promise.all([h.start('b'), h.start('c', other)])
    expect(h.locks.get('c')?.selection).toEqual(glm)
  })
  it('requires durable lock completion before any child request can be released', async () => {
    const h = setup(); const original = h.locks.set; let release!: () => void
    h.locks.set = async lock => { await new Promise<void>(r => { release = r }); await original(lock) }
    const running = h.start(); await vi.waitFor(() => expect(release).toBeTypeOf('function'))
    await expect(h.enforcer.verify({ sessionId: 'child', ...glm })).rejects.toThrow('lock is required')
    release(); await running; await h.enforcer.verify({ sessionId: 'child', ...glm })
  })
  it('stops creation on disk failure rather than running with inherited Opus', async () => {
    const h = setup(); h.locks.set = async () => { throw new Error('disk full') }
    await expect(h.start()).rejects.toThrow('disk full'); expect(h.locks.get('child')).toBeUndefined()
    await expect(h.enforcer.verify({ sessionId: 'child', ...opus })).rejects.toThrow()
  })
  it('keeps fail-closed guards installed when initialization fails', async () => {
    const h = setup(); h.locks.ready = async () => { throw new Error('Corrupt locks') }
    h.enforcer.installGuards(); await h.enforcer.initialize()
    expect(h.hooks.get('llm/stream')).toHaveLength(1)
    await expect(h.start()).rejects.toThrow('Corrupt locks')
    h.child(); await expect(h.enforcer.verify({ sessionId: 'child', ...opus })).rejects.toThrow('Corrupt locks')
    expect((await h.enforcer.status('child')).health).toBe('blocked')
  })
  it('rejects unverifiable external backends before launching them', async () => {
    const h = setup(); const launch = vi.fn()
    await expect(h.enforcer.delegate('external', h.parent, opus, launch)).rejects.toThrow('cannot guarantee')
    expect(launch).not.toHaveBeenCalled()
  })
  it('keeps one admission and conflict audit when a native entry delegates through another entry', async () => {
    const h = setup()
    await h.enforcer.delegate('local', h.parent, opus, async options => {
      h.overrides.set('parent', step)
      await h.enforcer.delegate('local', h.parent, options, async () => { await h.enforcer.created(h.child()) })
    })
    expect(h.locks.get('child')).toMatchObject({ selection: glm, conflict: opus })
    expect(h.admit).toHaveBeenCalledTimes(1)
  })
  it('rejects invalid user config and unknown modes without a machine fallback', async () => {
    const h = setup(); h.setConfig({ subagent: { mode: 'custom', selection: { provider: 'glm', model: 'invalid' } } })
    await expect(h.start()).rejects.toThrow('unavailable')
    h.setConfig({ subagent: { mode: 'custom' } }); await expect(h.start()).rejects.toThrow('incomplete')
    h.setConfig({ subagent: { mode: 'unknown' } } as never); await expect(h.start()).rejects.toThrow('Unknown')
  })
})
describe('cold and historical children', () => {
  it('attaches to already live historical children on HMR and keeps their context after confirmation', async () => {
    const h = setup(); const child = Object.assign(h.child(), { ctx: new Context() })
    h.enforcer.installGuards()
    await expect(child.ctx.waterfall('agent/request', {}, async () => opus)).rejects.toThrow('Confirm')
    await h.enforcer.confirm('parent', child.id, step)
    expect(await child.ctx.waterfall('agent/request', {}, async () => opus)).toEqual(step)
  })
  it('refuses a historical child until its human parent confirms a catalog model', async () => {
    const h = setup(); const agent = h.child(); await h.enforcer.created(agent)
    expect((await h.enforcer.status(agent.id)).state).toBe('confirmation-required')
    await expect(h.enforcer.request(agent, opus as never)).rejects.toThrow('Confirm')
    await expect(h.enforcer.confirm('wrong-parent', agent.id, step)).rejects.toThrow('does not belong')
    await h.enforcer.confirm('parent', agent.id, step)
    expect(await h.enforcer.request(agent, opus as never)).toEqual(step)
    expect((await h.enforcer.status(agent.id)).source).toBe('user-confirmed')
    await expect(h.enforcer.confirm('parent', agent.id, opus)).rejects.toThrow('already')
  })
  it('accepts confirmed cold ownership from native persistence and rejects lost identity', async () => {
    const h = setup(); h.headers.set('cold', { origin: 'subagent', parentSession: 'parent' })
    await h.enforcer.confirm('parent', 'cold', glm)
    await h.enforcer.verify({ sessionId: 'cold', ...glm })
    h.headers.set('cold', { origin: 'subagent', parentSession: 'other' })
    await expect(h.enforcer.verify({ sessionId: 'cold', ...glm })).rejects.toThrow('lock is required')
    expect((await h.enforcer.status('cold')).state).toBe('blocked')
  })
  it('uses persisted locks after a new authority starts, independent of current defaults', async () => {
    const h = setup(); await h.start()
    const fresh = new RouteEnforcer(h.ctx as never, () => ({ subagent: { mode: 'custom', selection: opus } }), { ready: async () => {}, get: () => undefined }, h.locks, h.admit)
    expect(await fresh.request(h.child(), opus as never)).toEqual(glm)
    await fresh.verify({ sessionId: 'child', ...glm })
  })
})
describe('immutable outgoing request boundary', () => {
  it('dispatches zero Opus requests after user locks GLM, including retries and continuation', async () => {
    const h = setup(); const { agent } = await h.start(); h.enforcer.installGuards()
    const guard = h.hooks.get('llm/stream')![0]!
    const calls = { glm: 0, opus: 0 }
    async function send(route: ModelSelectionConfig) {
      const options = Object.freeze(markAgentLoopRequest({ sessionId: agent.id, ...route } as never))
      const before = { ...options }
      const iterator = guard(options, async function* () { calls[route.model === 'opus' ? 'opus' : 'glm']++; yield { type: 'finish' } })
      for await (const _ of iterator) {}
      expect(options).toEqual(before)
    }
    for (let i = 0; i < 3; i++) {
      await send(await h.enforcer.request(agent, opus as never))
      await expect(send(opus)).rejects.toThrow('Blocked model mismatch')
    }
    expect(calls).toEqual({ glm: 3, opus: 0 })
    expect((await h.enforcer.status(agent.id)).state).toBe('blocked')
    await send(glm)
    expect((await h.enforcer.status(agent.id))).toMatchObject({ state: 'locked', actual: glm, conflict: opus })
  })
  it('refuses effort drift and verifies loop identity without changing the frozen object', async () => {
    const h = setup(); await h.start()
    await expect(h.enforcer.verify(Object.freeze({ sessionId: 'child', ...glm, reasoningEffort: 'high' }))).rejects.toThrow('mismatch')
    await expect(h.enforcer.verify(markAgentLoopRequest({ ...glm } as never))).rejects.toThrow('without session identity')
    await expect(h.enforcer.verify(markAgentLoopRequest({ sessionId: 'unknown', ...glm } as never))).rejects.toThrow('Cannot verify')
    await h.enforcer.verify({ sessionId: 'parent', ...opus })
  })
})

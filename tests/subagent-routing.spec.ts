import { describe, expect, it, vi } from 'vitest'
import { installSubagentRouting } from '../src/subagent-routing.ts'
import { START_PARENT_SEAM } from '../src/host-seams.ts'
import { modelRouteResolver } from '../src/model-route.ts'
import { authorityFor, hostServices } from './route-fixture.ts'
import type { Config, ModelSelectionConfig } from '../src/shared.ts'
const invalid = { provider: 'invalid', model: 'flash', reasoningEffort: 'high' }
const valid = { provider: 'glm', model: 'flash', reasoningEffort: 'high' }
const parent = { id: 's1', options: valid, session: { header: { origin: 'user' } } }
function setup(override: ModelSelectionConfig | undefined = valid, config: Config = {}) {
  const start = vi.fn(async (..._args: unknown[]) => 'started')
  const startContinuable = vi.fn(async (..._args: unknown[]) => 'continuable')
  const startActivation = vi.fn(async (..._args: unknown[]) => 'activation')
  const runtime = { start, startContinuable, startActivation, getProvider: () => ({ prepareContinuable() {} }) }
  const resolveCallConfig = vi.fn(async (next: ModelSelectionConfig) => {
    if (next.provider !== valid.provider || next.model !== valid.model) throw new Error('no configured model')
    if (next.reasoningEffort === 'wrong') throw new Error('unsupported reasoning effort')
    return { ...next, maxTokens: 1000 }
  })
  let dispose!: () => void
  const llm = { resolveCallConfig, listProviders: () => [], listModels: async () => [] }
  const scope: Record<string, unknown> = { subagents: runtime, get: hostServices({ llm, subagents: runtime }),
    inject(_deps: unknown, apply: (ctx: unknown) => void) { apply(scope) },
    effect(install: () => () => void) { dispose = install() } }
  const authority = authorityFor(scope, () => config, id => id === parent.id ? override : undefined, modelRouteResolver(scope as never))
  installSubagentRouting(scope as never, authority)
  return { authority, runtime, start, startContinuable, startActivation, resolveCallConfig, dispose: () => dispose() }
}
describe('user authority at every native startup entry', () => {
  it('rejects an invalid user route even when a valid machine route is supplied', async () => {
    const h = setup(invalid)
    await expect(h.runtime.start('standard', { parent, agentOptions: valid })).rejects.toThrow('Invalid model route')
    await expect(h.runtime.startContinuable({ provider: 'standard', request: { parent } })).rejects.toThrow('no configured model')
    await expect(h.runtime.startActivation({ provider: 'standard', request: { parent } })).rejects.toThrow()
    expect(h.start).not.toHaveBeenCalled(); expect(h.startContinuable).not.toHaveBeenCalled(); expect(h.startActivation).not.toHaveBeenCalled()
  })
  it('overwrites all conflicting route fields but preserves native parameters', async () => {
    const h = setup(); const signal = new AbortController().signal
    const request = { parent, cwd: '/test', maxDepth: 2, signal, agentOptions: { ...invalid, reasoningEffort: 'wrong', temperature: .5 } }
    await h.runtime.start('standard', request)
    expect(h.start).toHaveBeenCalledWith('standard', { ...request, agentOptions: { ...valid, temperature: .5 } })
    expect(h.resolveCallConfig).toHaveBeenCalledWith(valid)
  })
  it('waits for adapter admission before starting any child', async () => {
    const h = setup(); let release!: () => void
    h.resolveCallConfig.mockImplementation(() => new Promise(resolve => { release = () => resolve({ ...valid, maxTokens: 1000 }) }))
    const waiting = h.runtime.start('standard', { parent })
    await vi.waitFor(() => expect(release).toBeTypeOf('function'))
    expect(h.start).not.toHaveBeenCalled(); release(); await waiting
    expect(h.start.mock.calls[0]?.[1]).toMatchObject({ agentOptions: valid })
  })
  it('rejects unsupported human effort, never retries a fallback', async () => {
    const h = setup({ ...valid, reasoningEffort: 'wrong' })
    await expect(h.runtime.start('standard', { parent })).rejects.toThrow('unsupported reasoning effort')
    expect(h.start).not.toHaveBeenCalled()
  })
  it('strictly resolves the parent route and restores all present entry points on unload', async () => {
    const h = setup(undefined); const request = { parent: { ...parent, id: 'other' } }
    await h.runtime.start('standard', request)
    expect(h.start).toHaveBeenCalledWith('standard', { ...request, agentOptions: valid })
    h.dispose(); expect(h.runtime.start).toBe(h.start); expect(h.runtime.startContinuable).toBe(h.startContinuable); expect(h.runtime.startActivation).toBe(h.startActivation)
  })
  it('preserves reserved identity, delivery and native lifecycle on activation', async () => {
    const h = setup(); const spec = { provider: 'standard', childId: 'reserved', delivery: 'caller', label: 'test', request: { parent, outputSchema: { type: 'object' } } }
    await h.runtime.startActivation(spec)
    expect(h.startActivation).toHaveBeenCalledWith({ ...spec, request: { ...spec.request, agentOptions: valid } })
  })
})
describe('start request shapes across hosts', () => {
  it('routes the flat activation spec of DSH 0.2.2-rc.3 and hands it back flat', async () => {
    const h = setup(); const signal = new AbortController().signal
    const spec = { provider: 'standard', parent, childId: 'reserved', delivery: 'parent', label: 'test', cwd: '/test', maxDepth: 2, signal,
      agentOptions: { ...invalid, reasoningEffort: 'wrong', temperature: .5 } }
    await expect(h.runtime.startActivation(spec)).resolves.toBe('activation')
    expect(h.startActivation).toHaveBeenCalledExactlyOnceWith({ ...spec, agentOptions: { ...valid, temperature: .5 } })
    expect(h.startActivation.mock.calls[0]?.[0]).not.toHaveProperty('request')
  })
  it('applies the user route to a flat spec that names no model, and rejects an invalid one before the host starts', async () => {
    const h = setup(); await h.runtime.startActivation({ provider: 'standard', parent })
    expect(h.startActivation).toHaveBeenCalledExactlyOnceWith({ provider: 'standard', parent, agentOptions: valid })
    const bad = setup(invalid)
    await expect(bad.runtime.startActivation({ provider: 'standard', parent, agentOptions: valid })).rejects.toThrow('no configured model')
    expect(bad.startActivation).not.toHaveBeenCalled()
  })
  it('keeps the nested request of hosts up to 0.2.2-rc.1 nested', async () => {
    const h = setup(); const spec = { provider: 'standard', label: 'test', request: { parent, cwd: '/test' } }
    await h.runtime.startActivation(spec)
    expect(h.startActivation).toHaveBeenCalledExactlyOnceWith({ ...spec, request: { ...spec.request, agentOptions: valid } })
    expect(h.startActivation.mock.calls[0]?.[0]).not.toHaveProperty('agentOptions')
  })
  it('pauses dispatch and names the seam when a start request carries no parent, then recovers on a readable one', async () => {
    const h = setup(); const paused = /Subagent dispatch is paused.*subagents start request\.parent/
    await expect(h.runtime.startActivation({ provider: 'standard', task: { owner: parent } })).rejects.toThrow(paused)
    await expect(h.runtime.startContinuable({ provider: 'standard', request: {} })).rejects.toThrow(paused)
    await expect((h.runtime.start as (...args: unknown[]) => Promise<unknown>)('standard', undefined)).rejects.toThrow(paused)
    expect(h.startActivation).not.toHaveBeenCalled(); expect(h.startContinuable).not.toHaveBeenCalled(); expect(h.start).not.toHaveBeenCalled()
    expect((await h.authority.status('s1')).seams).toEqual([{ capability: 'model-lock', missing: [START_PARENT_SEAM], mismatched: [] }])
    await expect(h.runtime.startActivation({ provider: 'standard', parent })).resolves.toBe('activation')
    expect((await h.authority.status('s1')).seams).toBeUndefined()
    await expect(h.runtime.startContinuable({ provider: 'standard', request: { parent } })).resolves.toBe('continuable')
    await expect(h.runtime.start('standard', { parent })).resolves.toBe('started')
  })
})
describe('subagents service as a host seam', () => {
  function late(runtime: Record<string, unknown>) {
    let provide: ((ctx: unknown) => void) | undefined
    const services: Record<string, unknown> = { llm: { resolveCallConfig: async (route: unknown) => route, listProviders: () => [], listModels: async () => [] } }
    const scope = { get: hostServices(services), logger: { warn: vi.fn(), info: vi.fn() },
      inject(_deps: unknown, apply: (ctx: unknown) => void) { provide = apply },
      effect(install: () => () => void) { install() } }
    const authority = authorityFor(scope, () => ({}), () => valid, async route => route)
    installSubagentRouting(scope as never, authority)
    return { authority, offer() { services.subagents = runtime; provide!({ ...scope, subagents: runtime }) } }
  }
  it('installs without the service and routes every start once the host provides it', async () => {
    const start = vi.fn(async (..._args: unknown[]) => 'started')
    const runtime = { start, getProvider: () => ({ prepareContinuable() {} }) }
    const h = late(runtime)
    expect(runtime.start).toBe(start)
    h.offer()
    await (runtime.start as typeof start)('standard', { parent, agentOptions: invalid })
    expect(start).toHaveBeenCalledWith('standard', { parent, agentOptions: valid })
  })
  it('reports missing start entries as model-lock seams instead of failing the whole authority', async () => {
    const h = late({ getProvider: () => ({ prepareContinuable() {} }) }); h.offer()
    const status = await h.authority.status('s1')
    expect(status.health).toBe('ready')
    expect(status.seams).toEqual([{ capability: 'model-lock', missing: ['subagents.startActivation', 'subagents.startContinuable', 'subagents.start'], mismatched: [] }])
  })
})

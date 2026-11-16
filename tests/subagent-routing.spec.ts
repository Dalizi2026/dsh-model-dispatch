import { describe, expect, it, vi } from 'vitest'
import { installSubagentRouting } from '../src/subagent-routing.ts'
import { modelRouteResolver } from '../src/model-route.ts'
import { authorityFor } from './route-fixture.ts'
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
  const scope = { subagents: runtime, get: (name: string) => name === 'llm' ? { resolveCallConfig } : undefined,
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

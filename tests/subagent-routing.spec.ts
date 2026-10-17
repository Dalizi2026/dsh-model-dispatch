import { describe, expect, it, vi } from 'vitest'
import { installSubagentRouting } from '../src/subagent-routing.ts'
import { modelRouteValidator } from '../src/model-route.ts'
import type { Config, ModelSelectionConfig } from '../src/shared.ts'
const invalid = { provider: 'opencode-go', model: 'deepseek-v4.1-flash', reasoningEffort: 'high' }
const valid = { ...invalid, provider: 'opencode-go-completions' }
function setup(override: ModelSelectionConfig | undefined = invalid, config: Config = {}) {
  const start = vi.fn(async (..._args: unknown[]) => 'started')
  const startContinuable = vi.fn(async (..._args: unknown[]) => 'continuable')
  const runtime = { start, startContinuable }
  const resolveCallConfig = vi.fn(async (next: ModelSelectionConfig) => {
    if (next.provider !== valid.provider || next.model !== valid.model) throw new Error('pi-ai provider "opencode-go" has no configured model "deepseek-v4.1-flash"')
    if (next.reasoningEffort === 'wrong') throw new Error('unsupported reasoning effort')
    return { ...next, maxTokens: 1000 }
  })
  const validate = modelRouteValidator({ get: () => ({ resolveCallConfig }) } as never)
  let dispose!: () => void
  installSubagentRouting({ subagents: runtime, logger: { warn() {} }, effect(install: () => () => void) { dispose = install() } } as never, () => config, { get: (id: string) => id === 's1' ? override : undefined } as never, validate)
  return { runtime, start, startContinuable, resolveCallConfig, dispose: () => dispose() }
}
/** DSH 0.2.1-rc.1 exposes only startActivation, not start/startContinuable. */
function setupActivation(override: ModelSelectionConfig | undefined = valid, config: Config = {}) {
  const startActivation = vi.fn(async (..._args: unknown[]) => 'activated')
  const runtime: Record<string, unknown> = { startActivation }
  const resolveCallConfig = vi.fn(async (next: ModelSelectionConfig) => ({ ...next, maxTokens: 1000 }))
  const validate = modelRouteValidator({ get: () => ({ resolveCallConfig }) } as never)
  let dispose!: () => void
  installSubagentRouting({ subagents: runtime, logger: { warn() {} }, effect(install: () => () => void) { dispose = install() } } as never, () => config, { get: (id: string) => id === 's1' ? override : undefined } as never, validate)
  return { runtime, startActivation, resolveCallConfig, dispose: () => dispose() }
}

describe('startActivation-only hosts (DSH 0.2.1+)', () => {
  it('applies the route through startActivation when the older methods are absent', async () => {
    const h = setupActivation()
    await (h.runtime.startActivation as (spec: unknown) => Promise<unknown>)({ request: { parent: { id: 's1' } }, label: 'research' })
    expect(h.startActivation).toHaveBeenCalledWith({ request: { parent: { id: 's1' }, agentOptions: valid }, label: 'research' })
    expect(h.resolveCallConfig).toHaveBeenCalledWith(valid)
  })
  it('keeps native inheritance when unconfigured and restores startActivation on unload', async () => {
    const h = setupActivation(undefined)
    const spec = { request: { parent: { id: 'other' } } }
    await (h.runtime.startActivation as (spec: unknown) => Promise<unknown>)(spec)
    expect(h.startActivation).toHaveBeenCalledWith(spec)
    expect(h.resolveCallConfig).not.toHaveBeenCalled()
    h.dispose(); expect(h.runtime.startActivation).toBe(h.startActivation)
  })
  it('still validates a selected route before creating the child', async () => {
    const h = setupActivation()
    h.resolveCallConfig.mockImplementationOnce(async () => { throw new Error('no configured model') })
    await expect((h.runtime.startActivation as (spec: unknown) => Promise<unknown>)({ request: { parent: { id: 's1' } } })).rejects.toThrow('no configured model')
    expect(h.startActivation).not.toHaveBeenCalled()
  })
})

describe('child route validation before runtime creation', () => {
  it('rejects the reported invalid pair before foreground/background or continuable child creation', async () => {
    const h = setup()
    await expect(h.runtime.start('standard', { parent: { id: 's1' } })).rejects.toThrow('Invalid model route opencode-go/deepseek-v4.1-flash')
    await expect(h.runtime.startContinuable({ request: { parent: { id: 's1' } } })).rejects.toThrow('no configured model')
    expect(h.start).not.toHaveBeenCalled(); expect(h.startContinuable).not.toHaveBeenCalled()
  })
  it('validates final explicit request options instead of an obsolete override', async () => {
    const h = setup()
    await h.runtime.start('standard', { parent: { id: 's1' }, agentOptions: valid })
    expect(h.start).toHaveBeenCalledWith('standard', { parent: { id: 's1' }, agentOptions: valid })
    expect(h.resolveCallConfig).toHaveBeenCalledWith(valid)
  })
  it('awaits validation on both start paths and preserves request fields and effort', async () => {
    const h = setup(valid)
    let release!: () => void
    h.resolveCallConfig.mockImplementation(() => new Promise(resolve => { release = () => resolve({ ...valid, maxTokens: 1000 }) }))
    const waiting = h.runtime.start('standard', { parent: { id: 's1' }, agentOptions: { temperature: 0.5 } })
    await Promise.resolve(); expect(h.start).not.toHaveBeenCalled()
    release(); await waiting
    expect(h.start.mock.calls[0]?.[1]).toEqual({ parent: { id: 's1' }, agentOptions: { ...valid, temperature: 0.5 } })
    h.resolveCallConfig.mockResolvedValue({ ...valid, maxTokens: 1000 })
    await h.runtime.startContinuable({ request: { parent: { id: 's1' } }, label: 'research' })
    expect(h.startContinuable).toHaveBeenCalledWith({ request: { parent: { id: 's1' }, agentOptions: valid }, label: 'research' })
  })
  it('validates configured defaults and rejects unsupported explicit effort', async () => {
    const h = setup(undefined, { subagent: { mode: 'custom', selection: valid } })
    await expect(h.runtime.start('standard', { parent: { id: 'other' }, agentOptions: { reasoningEffort: 'wrong' } })).rejects.toThrow('unsupported reasoning effort')
    expect(h.start).not.toHaveBeenCalled()
  })
  it('keeps unconfigured native inheritance and restores methods on unload', async () => {
    const h = setup(undefined)
    const request = { parent: { id: 'other' } }
    await h.runtime.start('standard', request)
    expect(h.start).toHaveBeenCalledWith('standard', request)
    expect(h.resolveCallConfig).not.toHaveBeenCalled()
    h.dispose(); expect(h.runtime.start).toBe(h.start); expect(h.runtime.startContinuable).toBe(h.startContinuable)
  })
})

import { describe, expect, it, vi } from 'vitest'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { installSubagentCatalog, assertCatalogRoute } from '../src/subagent-catalog.ts'
import { installSubagentRouting } from '../src/subagent-routing.ts'

const step = { provider: 'step', model: 'step-5-preview' }
const droid = { provider: 'factory-g', model: 'glm-5.3-flash', reasoningEffort: 'max' }
function setup() {
  const parent = { id: 'old-session', options: droid }
  const other = { id: 'other-session', options: droid }
  const models: Record<string, string[]> = { step: [step.model], 'factory-g': [droid.model] }
  const resolveCallConfig = vi.fn(async (selection: Record<string, unknown>) => {
    if (selection.reasoningEffort === 'invalid') throw new Error('Unsupported reasoning effort')
  })
  const llm = {
    listProviders: () => Object.keys(models).map(id => ({ id, name: id })),
    listModels: async (id: string) => (models[id] ?? []).map(id => ({ id, name: id })),
    resolveModelInfo: async (_p: string, id: string) => ({ id, name: id, reasoning: { defaultEffort: 'max', efforts: [{ id: 'max', name: 'Max' }] } }),
    resolveCallConfig,
  }
  const start = vi.fn(async (_name: string, request: unknown) => request)
  const continuable = vi.fn(async (spec: unknown) => spec)
  const runtime = { start, startContinuable: continuable }
  const nativeArgs: unknown[] = []
  const definition = defineTool({ name: 'subagent', description: 'native', parameters: {
    provider: { type: 'string' }, model: { type: 'string' }, reasoning_effort: { type: 'string' },
    run_in_background: { type: 'boolean' },
  }, output: { schema: { type: 'json' }, render: () => [] }, async execute(args, exec) {
    nativeArgs.push(args)
    // Simulates rc.2's captured old-session policy: only Droid was allowed.
    if (args.provider && args.provider !== droid.provider) throw new Error('not allowed for this Session')
    const request = { parent: exec.agent, agentOptions: { temperature: 0.7, ...droid }, signal: exec.signal }
    return args.run_in_background ? runtime.startContinuable({ request }) : runtime.start('standard', request)
  } })
  const discovery = defineTool({ name: 'list_subagent_models', description: 'native list', parameters: {
    provider: { type: 'string' }, model: { type: 'string' },
  }, output: { schema: { type: 'string' }, render: () => [] }, async execute() { return 'factory-g only' } })
  const originals = [definition.execute, discovery.execute]
  let assemble!: (a: unknown, context: unknown, next: () => Promise<unknown>) => Promise<unknown>
  const disposers: (() => void)[] = []
  const scope = { tools: { get: (name: string) => name === 'subagent' ? definition : discovery },
    get: (name: string) => name === 'llm' ? llm : undefined,
    on(_name: string, hook: typeof assemble) { assemble = hook },
    effect(install: () => () => void) { disposers.push(install()) },
    logger: { warn() {} }, subagents: runtime,
  }
  installSubagentCatalog({ inject(_deps: unknown, apply: (scope: unknown) => void) { apply(scope) } } as never)
  installSubagentRouting(scope as never, () => ({ subagent: { mode: 'custom', selection: droid } }), { get: () => undefined } as never,
    async selection => { await assertCatalogRoute(scope as never, selection); await resolveCallConfig(selection as unknown as Record<string, unknown>) })
  const signal = new AbortController()
  const exec = (agent = parent) => ({ agent, signal: signal.signal }) as never
  return { parent, other, models, runtime, start, continuable, definition, discovery, originals, nativeArgs, resolveCallConfig, signal,
    assemble: () => assemble({}, { agent: parent }, async () => ({})),
    call: (args: unknown, agent = parent) => definition.execute(args, exec(agent)),
    discover: (args: unknown) => discovery.execute(args, exec()),
    dispose: () => { for (const dispose of disposers.reverse()) dispose() },
  }
}
describe('live catalog child authorization', () => {
  it('extends an old native session without editing its policy, schema or caller arguments', async () => {
    const h = setup(); const parameters = h.definition.parameters
    await expect(h.call(step)).rejects.toThrow('not allowed')
    await h.assemble()
    const args = Object.freeze({ ...step, reasoning_effort: 'max' })
    await h.call(args)
    expect(h.start.mock.calls[0]?.[1]).toMatchObject({ parent: h.parent, agentOptions: { ...step, reasoningEffort: 'max', temperature: 0.7 } })
    expect(args).toEqual({ ...step, reasoning_effort: 'max' })
    expect(h.definition.parameters).toBe(parameters)
    expect(h.nativeArgs.at(-1)).toEqual({})
  })
  it('discovers new providers/models immediately, and excludes removed routes', async () => {
    const h = setup(); await h.assemble()
    expect(await h.discover({ provider: 'step' })).toContain('step/step-5-preview')
    h.models.future = ['next-model']
    expect(await h.discover({})).toContain('future')
    await h.call({ provider: 'future', model: 'next-model' })
    expect(h.start.mock.calls[0]?.[1]).toMatchObject({ agentOptions: { provider: 'future', model: 'next-model' } })
    delete h.models.future
    await expect(h.call({ provider: 'future', model: 'next-model' })).rejects.toThrow('not in the current model catalog')
    expect(h.start).toHaveBeenCalledTimes(1)
  })
  it('uses provider default effort on a new explicit route rather than leaking the configured effort', async () => {
    const h = setup(); await h.assemble(); await h.call(step)
    expect(h.start.mock.calls[0]?.[1]).toMatchObject({ agentOptions: step })
    expect((h.start.mock.calls[0]?.[1] as { agentOptions: object }).agentOptions).not.toHaveProperty('reasoningEffort')
  })
  it('validates unsupported effort and unknown models before creating children', async () => {
    const h = setup(); await h.assemble()
    await expect(h.call({ ...step, reasoning_effort: 'invalid' })).rejects.toThrow('Unsupported reasoning effort')
    await expect(h.call({ ...step, model: 'missing' })).rejects.toThrow('not in the current model catalog')
    expect(h.start).not.toHaveBeenCalled()
  })
  it('preserves continuable background routing', async () => {
    const h = setup(); await h.assemble(); await h.call({ ...step, run_in_background: true })
    expect(h.continuable.mock.calls[0]?.[0]).toMatchObject({ request: { parent: h.parent, agentOptions: step } })
  })
  it('isolates concurrent explicit selections and leaves later default delegations unchanged', async () => {
    const h = setup(); await h.assemble()
    await Promise.all([h.call(step), h.call({ ...droid, reasoning_effort: 'max' }, h.other)])
    expect(h.start.mock.calls.map(call => (call[1] as { agentOptions: unknown }).agentOptions)).toEqual(expect.arrayContaining([
      { ...step, temperature: 0.7 }, { ...droid, temperature: 0.7 },
    ]))
    await h.call({})
    expect(h.start.mock.calls.at(-1)?.[1]).toMatchObject({ agentOptions: droid })
  })
  it('rejects incomplete route requests and observes cancellation', async () => {
    const h = setup(); await h.assemble()
    await expect(h.call({ provider: 'step' })).rejects.toThrow('must be supplied together')
    h.signal.abort(); await expect(h.call(step)).rejects.toThrow()
    expect(h.start).not.toHaveBeenCalled()
  })
  it('supports effort-only selections on the configured child route', async () => {
    const h = setup(); await h.assemble(); await h.call({ reasoning_effort: 'high' })
    expect(h.start.mock.calls[0]?.[1]).toMatchObject({ agentOptions: { ...droid, reasoningEffort: 'high' } })
  })
  it('restores native bodies and start methods on unload without double wrapping', async () => {
    const h = setup(); await h.assemble(); const wrapped = h.definition.execute
    await h.assemble(); expect(h.definition.execute).toBe(wrapped)
    h.dispose(); expect(h.definition.execute).toBe(h.originals[0]); expect(h.discovery.execute).toBe(h.originals[1])
    expect(h.runtime.start).toBe(h.start)
  })
})

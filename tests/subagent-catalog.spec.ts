import { describe, expect, it, vi } from 'vitest'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { installSubagentCatalog, assertCatalogRoute } from '../src/subagent-catalog.ts'
import { authorityFor } from './route-fixture.ts'
import { installSubagentRouting } from '../src/subagent-routing.ts'

const step = { provider: 'step', model: 'step-5-preview' }
const droid = { provider: 'factory-g', model: 'glm-5.3-flash', reasoningEffort: 'max' }
function setup() {
  const parent = { id: 'old-session', options: droid, session: { header: { origin: 'user' } } }
  const other = { id: 'other-session', options: droid, session: { header: { origin: 'user' } } }
  const models: Record<string, string[]> = { step: [step.model], 'factory-g': [droid.model] }
  const resolveCallConfig = vi.fn(async (selection: Record<string, unknown>) => {
    if (selection.reasoningEffort === 'invalid') throw new Error('Unsupported reasoning effort')
    return selection as unknown as typeof droid
  })
  const llm = {
    listProviders: () => Object.keys(models).map(id => ({ id, name: id })),
    listModels: async (id: string) => (models[id] ?? []).map(id => ({ id, name: id })),
    resolveModelInfo: async (_p: string, id: string) => ({ id, name: id, reasoning: { defaultEffort: 'max', efforts: [{ id: 'max', name: 'Max' }] } }),
    resolveCallConfig,
  }
  const start = vi.fn(async (_name: string, request: unknown) => request)
  const continuable = vi.fn(async (spec: unknown) => spec)
  const runtime = { start, startContinuable: continuable, getProvider: () => ({ prepareContinuable() {} }) }
  const nativeArgs: unknown[] = []
  const definition = defineTool({ name: 'subagent', description: 'native', parameters: {
    provider: { type: 'string' }, model: { type: 'string' }, reasoning_effort: { type: 'string' },
    run_in_background: { type: 'boolean' },
  }, output: { schema: { type: 'json' }, render: () => [] }, async execute(args, exec) {
    nativeArgs.push(args)
    // Simulates rc.2's captured old-session policy: only Droid was allowed.
    if (args.provider && args.provider !== droid.provider) throw new Error('not allowed for this Session')
    const request = { parent: exec.agent, agentOptions: { temperature: 0.7, ...droid }, signal: exec.signal }
    return args.run_in_background ? runtime.startContinuable({ provider: 'standard', request }) : runtime.start('standard', request)
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
  let selected: typeof step | typeof droid = droid
  const picks = new Map<string, typeof step | typeof droid>()
  const authority = authorityFor(scope, () => ({ subagent: { mode: 'custom', selection: selected } }), id => picks.get(id),
    async selection => { await assertCatalogRoute(scope as never, selection); return resolveCallConfig(selection as unknown as Record<string, unknown>) })
  installSubagentCatalog({ inject(_deps: unknown, apply: (scope: unknown) => void) { apply(scope) } } as never, authority)
  installSubagentRouting(scope as never, authority)
  const signal = new AbortController()
  const exec = (agent = parent) => ({ agent, signal: signal.signal }) as never
  return { setSelection: (value: typeof step | typeof droid) => { selected = value }, picks, parent, other, models, runtime, start, continuable, definition, discovery, originals, nativeArgs, resolveCallConfig, signal,
    assemble: () => assemble({}, { agent: parent }, async () => ({})),
    call: (args: unknown, agent = parent) => definition.execute(args, exec(agent)),
    discover: (args: unknown) => discovery.execute(args, exec()),
    dispose: () => { for (const dispose of disposers.reverse()) dispose() },
  }
}
describe('live catalog child authorization', () => {
  it('extends an old native session without editing its policy, schema or caller arguments', async () => {
    const h = setup(); h.setSelection(step); const parameters = h.definition.parameters
    await expect(h.call(step)).rejects.toThrow('not allowed')
    await h.assemble()
    const args = Object.freeze({ ...step, reasoning_effort: 'max' })
    await h.call(args)
    expect(h.start.mock.calls[0]?.[1]).toMatchObject({ parent: h.parent, agentOptions: { ...step, temperature: 0.7 } })
    expect(args).toEqual({ ...step, reasoning_effort: 'max' })
    expect(h.definition.parameters).toBe(parameters)
    expect(h.nativeArgs.at(-1)).toEqual({})
  })
  it('keeps human catalog additions available while model discovery exposes only the user route', async () => {
    const h = setup(); await h.assemble()
    expect(await h.discover({ provider: 'step' })).toContain('factory-g/glm-5.3-flash')
    h.models.future = ['next-model']; h.setSelection({ provider: 'future', model: 'next-model' })
    expect(await h.discover({})).toContain('future/next-model')
    await h.call({ provider: 'step', model: step.model })
    expect(h.start.mock.calls[0]?.[1]).toMatchObject({ agentOptions: { provider: 'future', model: 'next-model' } })
    delete h.models.future
    await expect(h.call({})).rejects.toThrow('not in the current model catalog')
    expect(h.start).toHaveBeenCalledTimes(1)
  })
  it('uses provider default effort on a new explicit route rather than leaking the configured effort', async () => {
    const h = setup(); h.setSelection(step); await h.assemble(); await h.call(droid)
    expect(h.start.mock.calls[0]?.[1]).toMatchObject({ agentOptions: step })
    expect((h.start.mock.calls[0]?.[1] as { agentOptions: object }).agentOptions).not.toHaveProperty('reasoningEffort')
  })
  it('validates user effort and user model before creating children', async () => {
    const h = setup(); await h.assemble()
    h.setSelection({ ...step, reasoningEffort: 'invalid' }); await expect(h.call({})).rejects.toThrow('Unsupported reasoning effort')
    h.setSelection({ ...step, model: 'missing' }); await expect(h.call({})).rejects.toThrow('not in the current model catalog')
    expect(h.start).not.toHaveBeenCalled()
  })
  it('preserves continuable background routing', async () => {
    const h = setup(); h.setSelection(step); await h.assemble(); await h.call({ ...droid, run_in_background: true })
    expect(h.continuable.mock.calls[0]?.[0]).toMatchObject({ request: { parent: h.parent, agentOptions: step } })
  })
  it('isolates concurrent human selections and leaves later default delegations unchanged', async () => {
    const h = setup(); await h.assemble()
    h.picks.set(h.parent.id, step)
    await Promise.all([h.call(droid), h.call({ ...droid, reasoning_effort: 'max' }, h.other)])
    expect(h.start.mock.calls.map(call => (call[1] as { agentOptions: unknown }).agentOptions)).toEqual(expect.arrayContaining([
      { ...step, temperature: 0.7 }, { ...droid, temperature: 0.7 },
    ]))
    h.picks.clear(); await h.call({})
    expect(h.start.mock.calls.at(-1)?.[1]).toMatchObject({ agentOptions: droid })
  })
  it('ignores incomplete machine preferences and observes cancellation', async () => {
    const h = setup(); await h.assemble()
    await h.call({ provider: 'step' })
    expect(h.start.mock.calls[0]?.[1]).toMatchObject({ agentOptions: droid })
    h.signal.abort(); await expect(h.call(step)).rejects.toThrow()
    expect(h.start).toHaveBeenCalledTimes(1)
  })
  it('ignores model-authored effort changes to the user tuple', async () => {
    const h = setup(); await h.assemble(); await h.call({ reasoning_effort: 'high' })
    expect(h.start.mock.calls[0]?.[1]).toMatchObject({ agentOptions: droid })
  })
  it('restores native bodies and start methods on unload without double wrapping', async () => {
    const h = setup(); await h.assemble(); const wrapped = h.definition.execute
    await h.assemble(); expect(h.definition.execute).toBe(wrapped)
    h.dispose(); expect(h.definition.execute).toBe(h.originals[0]); expect(h.discovery.execute).toBe(h.originals[1])
    expect(h.runtime.start).toBe(h.start)
  })
})

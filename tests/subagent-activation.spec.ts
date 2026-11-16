/** Compatibility against the shipped 0.2.1 native delegation tool, not a copy. */
import { describe, expect, it, vi } from 'vitest'
import { apply as applyNativeTool } from '@deepseek-ai/dsh-tool-subagent'
import { installSubagentCatalog, assertCatalogRoute } from '../src/subagent-catalog.ts'
import { authorityFor } from './route-fixture.ts'
import { installSubagentRouting } from '../src/subagent-routing.ts'
import type { ModelSelectionConfig } from '../src/shared.ts'

const main = { provider: 'droid', model: 'main', reasoningEffort: 'high' }
const step = { provider: 'step', model: 'planner', reasoningEffort: 'max' }
async function setup() {
  const definitions = new Map<string, any>()
  const hooks = new Map<string, any>()
  const cleanups: (() => void)[] = []
  const policy = [{ provider: main.provider, model: main.model }]
  const session = { firstLiveSeq: 20, header: { origin: 'user' }, requestHeader: () => ({ config: main }), eventAt() {} }
  const parent = { id: 'old-session', session, options: main }
  let override: ModelSelectionConfig | undefined = step
  const provider = { name: 'dsh', inheritsParentContext: false, capabilities: { agentOptions: true, depthLimit: true, agentPreset: true }, prepareContinuable() {} }
  const start = vi.fn(async (spec: unknown) => ({ childId: 'child', spec }))
  const runtime = { startActivation: start, getProvider: () => provider, resolveMaxDepth: () => 2 }
  const llm = { listProviders: () => [{ id: main.provider }, { id: step.provider }],
    listModels: async (provider: string) => [{ id: provider === main.provider ? main.model : step.model }],
    async resolveCallConfig(next: ModelSelectionConfig) { if (next.reasoningEffort === 'invalid') throw new Error('unsupported effort'); return next },
    async resolveModelInfo(_provider: string, model: string) { return { id: model, name: model } },
  }
  const scope = {
    subagents: runtime,
    tools: { get: (name: string) => definitions.get(name), register(tool: any) { definitions.set(tool.name, tool); return () => definitions.delete(tool.name) } },
    sessionProjections: { register() {}, stateOf: () => policy },
    systemPrompt: { section() {}, context() {}, getSectionOrder: () => 0, getContextOrder: () => 0 },
    logger: { warn() {}, info() {} },
    get(name: string) { return name === 'llm' ? llm : name === 'agentPresets' ? { readDocument: async () => ({ description: 'test preset' }) } : name === 'subagentModelSelection' ? { current: () => ({ enabled: true, allowedModels: policy }) } : undefined },
    on(name: string, fn: any) { hooks.set(name, fn) },
    inject(_deps: unknown, apply: (ctx: unknown) => void) { apply(scope) },
    effect(install: () => () => void) { const dispose = install(); cleanups.push(dispose); return dispose },
  }
  await applyNativeTool(scope as never, { provider: 'dsh', maxDepth: 2, modelSelectionSettings: true, allowedAgentPresets: ['standard', 'research'] } as never, session as never)
  const args = { description: 'route test', prompt: 'Reply OK', provider: step.provider, model: step.model, reasoning_effort: step.reasoningEffort, cwd: './child-dir', agent_preset: 'research' }
  const exec = { agent: parent, signal: new AbortController().signal }
  return { scope, parent, runtime, start, policy, args, exec,
    setOverride(value: ModelSelectionConfig | undefined) { override = value },
    call: (args: object) => definitions.get('subagent').execute(args, exec),
    async install() {
      const authority = authorityFor(scope, () => ({}), () => override, async route => { await assertCatalogRoute(scope as never, route); return llm.resolveCallConfig(route) })
      installSubagentCatalog(scope as never, authority)
      installSubagentRouting(scope as never, authority)
      await hooks.get('system-prompt/assemble')({}, { agent: parent }, async () => ({}))
    },
    dispose() { for (const cleanup of cleanups.reverse()) cleanup() },
  }
}
describe('DSH 0.2.1 native managed activations', () => {
  it('routes the user selection despite native tool choices and old durable policy, preserving cwd/preset/delivery/signal', async () => {
    const h = await setup()
    await expect(h.call(h.args)).rejects.toThrow('not allowed for this Session')
    await h.install(); const result = await h.call(h.args)
    expect(result).toEqual({ kind: 'activation', subagentId: 'child' })
    expect(h.start).toHaveBeenCalledExactlyOnceWith({ provider: 'dsh', label: h.args.description, delivery: 'parent', signal: h.exec.signal,
      request: { parent: h.parent, cwd: h.args.cwd, agentPreset: 'research', maxDepth: 2, prompt: [{ type: 'text', text: h.args.prompt }], agentOptions: step } })
    expect(h.policy).toEqual([{ provider: main.provider, model: main.model }])
    expect(h.runtime).not.toHaveProperty('start'); expect(h.runtime).not.toHaveProperty('startContinuable')
    h.dispose(); expect(h.runtime.startActivation).toBe(h.start)
  })
  it('applies a session override with no model fields and follows the main after clearing it', async () => {
    const h = await setup(); await h.install()
    const args = { description: 'default route', prompt: 'OK' }
    await h.call(args)
    expect(h.start.mock.calls[0]?.[0]).toMatchObject({ request: { agentOptions: step } })
    h.setOverride(undefined); await h.call(args)
    expect(h.start.mock.calls[1]?.[0]).toMatchObject({ request: { agentOptions: main } })
  })
  it('preserves the native preset restriction and validates invalid efforts before activation', async () => {
    const h = await setup(); await h.install()
    await expect(h.call({ ...h.args, agent_preset: 'forbidden' })).rejects.toThrow(/agent_preset.*must be one of/)
    h.setOverride({ ...step, reasoningEffort: 'invalid' }); await expect(h.call(h.args)).rejects.toThrow('unsupported effort')
    expect(h.start).not.toHaveBeenCalled()
  })
  it('ignores conflicting native tool fields without weakening native validation', async () => {
    const h = await setup(); await h.install()
    await h.call({ ...h.args, provider: main.provider, model: main.model, reasoning_effort: 'invalid' })
    expect(h.start.mock.calls[0]?.[0]).toMatchObject({ request: { agentOptions: step } })
  })
  it('preserves reserved child identity, output contract and custom delivery for non-tool callers', async () => {
    const h = await setup(); await h.install()
    const spec = { provider: 'dsh', childId: 'reserved-child', label: 'structured', delivery: 'caller', signal: h.exec.signal,
      request: { parent: h.parent, cwd: '/test', outputSchema: { type: 'object' }, maxDepth: 1 } }
    await (h.runtime.startActivation as (spec: unknown) => Promise<unknown>)(spec)
    expect(h.start).toHaveBeenCalledWith({ ...spec, request: { ...spec.request, agentOptions: step } })
  })
})

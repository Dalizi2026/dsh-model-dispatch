import { describe, expect, it, vi } from 'vitest'
import { SessionController } from '@deepseek-ai/dsh-api-session-controller'
// Pin this compatibility check to the actual rc.2 native command implementation.
import { SessionCommandController } from '../node_modules/@deepseek-ai/dsh-api-session-controller/lib/types/commands.js'
import { installSessionModelScope } from '../src/session-model-scope.ts'
import type { ModelSelectionConfig } from '../src/shared.ts'

const initial = { provider: 'p', model: 'default', reasoningEffort: 'max' }
function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>(done => { resolve = done })
  return { promise, resolve }
}
function setup() {
  let configured: ModelSelectionConfig = { ...initial }
  const selections = new Map<string, ModelSelectionConfig>()
  const chains = new Map<string, Promise<unknown>>()
  let admit = async (next: ModelSelectionConfig) => next
  const saveSelection = vi.fn(async (next: ModelSelectionConfig) => { configured = { ...next } })
  const defaults = { saveSelection, currentSelection: () => ({ ...configured }) }
  const nativeContext = {
    agentDefaultModel: defaults,
    llm: {
      listProviders: () => [{ id: 'p' }],
      listModels: async () => [{ id: 'default' }, { id: 'a' }, { id: 'b' }],
      resolveCallConfig: (next: ModelSelectionConfig) => admit(next),
    },
    logger: { warn: vi.fn() },
  }
  const agents = {
    resolveAgent: async (id: string) => ({ agent: { id } }),
    serializeImageAdmission(agent: { id: string }, operation: () => Promise<unknown>) {
      const result = (chains.get(agent.id) ?? Promise.resolve()).then(operation)
      chains.set(agent.id, result.catch(() => {}))
      return result
    },
    selectForNextRequest(agent: { id: string }, next: ModelSelectionConfig) { selections.set(agent.id, next) },
  }
  const commands = new SessionCommandController(nativeContext as never, agents as never, '.')
  const controller = Object.assign(Object.create(SessionController.prototype), { commands }) as SessionController
  const originalSelect = controller.selectModel
  let dispose!: () => void
  installSessionModelScope({ inject(_deps: unknown, apply: (scope: unknown) => void) {
    apply({ sessionController: controller, agentDefaultModel: defaults, effect(install: () => () => void) { dispose = install() } })
  } } as never)
  return { controller, defaults, saveSelection, selections, originalSelect,
    dispose: () => dispose(),
    configure(next: ModelSelectionConfig) { configured = { ...next } },
    admission(next: typeof admit) { admit = next },
    pick(id: string, model: string) { return controller.selectModel({ sessionId: id, provider: 'p', model, reasoningEffort: 'max' } as never) },
  }
}

describe('configured defaults independent from native session selections', () => {
  it('keeps concurrent native chat/plan selections local while new chats read the configured default', async () => {
    const h = setup()
    const [a, b] = await Promise.all([h.pick('s1', 'a'), h.pick('s2', 'b')])
    expect(a.selected.model).toBe('a'); expect(b.selected.model).toBe('b')
    expect(h.selections.get('s1')?.model).toBe('a'); expect(h.selections.get('s2')?.model).toBe('b')
    expect(h.defaults.currentSelection()).toEqual(initial)
    expect(h.saveSelection).not.toHaveBeenCalled()
    // The settings ConfigForm edits owning volatile fields directly.
    h.configure({ provider: 'p', model: 'b' })
    await h.pick('s1', 'a')
    expect(h.defaults.currentSelection()).toEqual({ provider: 'p', model: 'b' })
  })
  it('allows an unrelated default write while a session switch is awaiting admission', async () => {
    const h = setup(); const gate = deferred(); const entered = deferred()
    h.admission(async next => { entered.resolve(); await gate.promise; return next })
    const switching = h.pick('s1', 'a'); await entered.promise
    const nextDefault = { provider: 'p', model: 'b' }
    await h.defaults.saveSelection(nextDefault)
    gate.resolve(); await switching
    expect(h.saveSelection).toHaveBeenCalledExactlyOnceWith(nextDefault)
    expect(h.defaults.currentSelection()).toEqual(nextDefault)
  })
  it('preserves native model validation failures without changing the session or default', async () => {
    const h = setup()
    await expect(h.pick('s1', 'missing')).rejects.toThrow('available model')
    expect(h.selections.size).toBe(0)
    expect(h.defaults.currentSelection()).toEqual(initial)
    await h.pick('s1', 'a')
    expect(h.defaults.currentSelection()).toEqual(initial)
  })
  it('restores original service methods on unload', async () => {
    const h = setup(); h.dispose()
    expect(h.controller.selectModel).toBe(h.originalSelect)
    await h.pick('s1', 'a')
    expect(h.defaults.currentSelection().model).toBe('a')
    expect(h.saveSelection).toHaveBeenCalledTimes(1)
  })
})

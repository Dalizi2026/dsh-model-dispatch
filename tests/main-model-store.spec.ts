import { describe, expect, it } from 'vitest'
import type { ConfigForm, ConfigFormSnapshot } from '@deepseek-ai/dsh-client-ui-settings/client'
import { MainModelStore } from '../src/client/config-store.ts'
import type { ModelSelectionConfig } from '../src/shared.ts'

function mockForm(): ConfigForm<ModelSelectionConfig> & { value: ConfigFormSnapshot<ModelSelectionConfig> } {
  const snap: ConfigFormSnapshot<ModelSelectionConfig> = {
    status: 'ready',
    value: { provider: 'factory-g', model: 'glm-5.3-flash' },
    base: undefined,
    user: undefined,
    revision: 1,
    writable: true,
    mode: 'host',
  }
  return {
    get value() { return snap },
    getSnapshot: () => snap,
    subscribe: () => () => {},
    async mutate(ops) {
      for (const op of ops) {
        const [field] = op.path
        if (op.op === 'set') (snap.value as Record<string, unknown>)[String(field)] = op.value
        else delete (snap.value as Record<string, unknown>)[String(field)]
      }
      return true
    },
    async set(field, value) {
      ;(snap.value as Record<string, unknown>)[field] = value
      return true
    },
    async unset(field) {
      delete (snap.value as Record<string, unknown>)[field]
      return true
    },
  }
}

describe('MainModelStore', () => {
  it('save writes provider, model, and effort atomically', async () => {
    const form = mockForm()
    const store = new MainModelStore(form)
    await store.save({ provider: 'factory-a', model: 'claude-opus-5-5', reasoningEffort: 'max' })
    expect(form.value.value).toEqual({
      provider: 'factory-a',
      model: 'claude-opus-5-5',
      reasoningEffort: 'max',
    })
  })

  it('save without effort unsets the field', async () => {
    const form = mockForm()
    const store = new MainModelStore(form)
    await store.save({ provider: 'a', model: 'b', reasoningEffort: 'max' })
    await store.save({ provider: 'a', model: 'b' })
    expect(form.value.value).toEqual({ provider: 'a', model: 'b' })
  })

  it('rejected writes surface as errors', async () => {
    const form = mockForm()
    form.mutate = async () => false
    const store = new MainModelStore(form)
    await expect(store.save({ provider: 'a', model: 'b' })).rejects.toThrow('settings write rejected')
  })
})

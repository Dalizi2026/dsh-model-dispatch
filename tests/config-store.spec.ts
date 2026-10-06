import { describe, expect, it } from 'vitest'
import type { ConfigForm, ConfigFormSnapshot } from '@deepseek-ai/dsh-client-ui-settings/client'
import { ConfigStore } from '../src/client/config-store.ts'
import type { Config } from '../src/shared.ts'

function mockForm(initial: ConfigFormSnapshot<Config>): ConfigForm<Config> & {
  publish(next: ConfigFormSnapshot<Config>): void
} {
  let snap = initial
  const listeners = new Set<() => void>()
  const accept = (field: string, value: unknown): void => {
    snap = {
      ...snap,
      status: 'ready',
      value: { ...snap.value, [field]: value },
      user: { ...(snap.user as object | undefined), [field]: value },
      revision: (snap.revision ?? 0) + 1,
      writable: true,
    }
    for (const listener of listeners) listener()
  }
  return {
    getSnapshot: () => snap,
    subscribe(listener) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    async mutate(ops) {
      for (const op of ops) {
        if (op.op !== 'set') continue
        const [field] = op.path
        accept(String(field), op.value)
      }
      return true
    },
    async set(field, value) {
      accept(field, value)
      return true
    },
    async unset(field) {
      const nextValue = { ...snap.value }
      delete nextValue[field as keyof Config]
      snap = {
        ...snap,
        status: 'ready',
        value: nextValue,
        revision: (snap.revision ?? 0) + 1,
        writable: true,
      }
      for (const listener of listeners) listener()
      return true
    },
    publish(next) {
      snap = next
      for (const listener of listeners) listener()
    },
  }
}

const loading: ConfigFormSnapshot<Config> = {
  status: 'loading',
  value: undefined,
  base: undefined,
  user: undefined,
  revision: undefined,
  writable: false,
  mode: 'host',
}

describe('ConfigStore', () => {
  it('maps loading with no value to loading', () => {
    const store = new ConfigStore(mockForm(loading))
    expect(store.getSnapshot()).toEqual({ status: 'loading', value: {}, error: null })
  })

  it('maps a ready snapshot stably', () => {
    const store = new ConfigStore(mockForm({ ...loading, status: 'ready', value: {}, revision: 1, writable: true }))
    expect(store.getSnapshot()).toStrictEqual({ status: 'ready', value: {}, error: null })
  })

  it('maps unavailable to error', () => {
    const store = new ConfigStore(mockForm({ ...loading, status: 'unavailable' }))
    expect(store.getSnapshot()).toEqual({
      status: 'error',
      value: {},
      error: 'unavailable',
    })
  })

  it('writes one route field through the form', async () => {
    const scope = mockForm({
      ...loading,
      status: 'ready',
      value: { subagent: { mode: 'follow-main' }, planPlanning: { mode: 'follow-main' } },
      revision: 1,
      writable: true,
    })
    const store = new ConfigStore(scope)
    await store.saveRoute('subagent', {
      mode: 'custom',
      selection: { provider: 'p', model: 'm' },
    })
    expect(store.getSnapshot().value.subagent).toEqual({
      mode: 'custom',
      selection: { provider: 'p', model: 'm' },
    })
    expect(store.getSnapshot().value.planPlanning).toEqual({ mode: 'follow-main' })
  })

  it('drops explicit undefined members before writing (settings/mutate ops codec)', async () => {
    const seen: Array<unknown> = []
    const scope = mockForm(loading)
    const originalSet = scope.set.bind(scope)
    scope.set = async (field, value) => {
      seen.push(value)
      return originalSet(field, value)
    }
    const store = new ConfigStore(scope)
    // The settings UI sends `{ mode, selection: route.selection }`; with no
    // selection picked this carries an explicit `selection: undefined` member,
    // which the strict settings/mutate JSON codec rejects.
    await store.saveRoute('subagent', {
      mode: 'follow-main',
      selection: undefined,
    })
    expect(seen[0]).toEqual({ mode: 'follow-main' })
    expect(Object.hasOwn(seen[0] as object, 'selection')).toBe(false)
    // Defined selections must survive the round-trip untouched.
    await store.saveRoute('planPlanning', {
      mode: 'custom',
      selection: { provider: 'p', model: 'm' },
    })
    expect(seen[1]).toEqual({ mode: 'custom', selection: { provider: 'p', model: 'm' } })
  })
})

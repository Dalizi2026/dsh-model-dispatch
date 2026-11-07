import React from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
vi.mock('../src/client/ModelPicker.tsx', () => ({ ModelPicker: () => null }))
import { SettingsSection } from '../src/client/SettingsSection.tsx'
import { en } from '../src/client/locales.ts'
const subscribe = () => () => {}
let tree: ReactTestRenderer | undefined
afterEach(() => { if (tree) act(() => tree!.unmount()); tree = undefined })
// useSyncExternalStore needs identity-stable snapshots.
const settings = { status: 'ready', value: {}, error: null }
const main = { status: 'ready', value: undefined, error: null }
function props(seams: () => Promise<unknown>) {
  return { store: { subscribe, getSnapshot: () => settings },
    mainStore: { subscribe, getSnapshot: () => main },
    access: { currentSelection: () => undefined }, t: (key: keyof typeof en) => en[key], seams } as never
}
const text = () => JSON.stringify(tree!.toJSON())
describe('settings banner for degraded capabilities', () => {
  it('lists each degraded capability with its missing seams, read once per opening', async () => {
    const seams = vi.fn(async () => [
      { capability: 'plan-switch', missing: ['sessionController.selectModel'], mismatched: [] },
      { capability: 'subagent-catalog', missing: ['uiWorkspace'], mismatched: [] },
    ])
    await act(async () => { tree = create(React.createElement(SettingsSection, props(seams))) })
    for (const part of [en.seamPlanOff, 'sessionController.selectModel', en.seamCatalogOff, 'uiWorkspace', en.seamHint]) expect(text()).toContain(part)
    await act(async () => { tree!.update(React.createElement(SettingsSection, props(seams))) })
    expect(seams).toHaveBeenCalledTimes(1)
  })
  it('shows nothing when every seam is available and names a failed check', async () => {
    await act(async () => { tree = create(React.createElement(SettingsSection, props(async () => []))) })
    expect(text()).not.toContain(en.seamHint); expect(text()).not.toContain(en.seamsUnavailable)
    act(() => tree!.unmount())
    await act(async () => { tree = create(React.createElement(SettingsSection, props(async () => { throw new Error('HTTP 503') }))) })
    expect(text()).toContain(en.seamsUnavailable); expect(text()).toContain('HTTP 503')
  })
})

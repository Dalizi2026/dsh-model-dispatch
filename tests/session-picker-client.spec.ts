import React from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
vi.mock('../src/client/ModelPicker.tsx', () => ({ ModelPicker: (props: any) => React.createElement('button', { disabled: props.disabled, onClick: () => props.onChange({ provider: 'glm', model: 'flash' }) }, 'Select model') }))
import { SessionSubagentPicker } from '../src/client/SessionSubagentPicker.tsx'
import { en } from '../src/client/locales.ts'
const route = { provider: 'glm', model: 'flash' }
const subscribe = () => () => {}
let tree: ReactTestRenderer | undefined
afterEach(() => { if (tree) act(() => tree!.unmount()); tree = undefined })
function setup(state: string) {
  const status = { sessionId: 's1', health: 'ready', state, expected: route }
  const routeSnap = { value: status }
  const overrideSnap = { value: { s1: route } }
  const settings = { value: {} }
  const overrides = { subscribe, getSnapshot: () => overrideSnap, start() {}, stop() {}, set: vi.fn(async () => {}) }
  const props = { sessionId: 's1', overrides, routes: { subscribe, get: () => routeSnap, watch: () => () => {}, refresh: vi.fn(async () => status) },
    store: { subscribe, getSnapshot: () => settings }, access: { currentSelection: () => route },
    t: (key: keyof typeof en) => en[key], useSessions: (select: any) => select({ byId: { s1: {} }, projectionsBySession: {} }),
  }
  act(() => { tree = create(React.createElement(SessionSubagentPicker, props as never)) })
  return props
}
describe('saved selection without a live parent', () => {
  it('shows unverified without a checkmark and allows confirmed saving for historical sessions', async () => {
    const props = setup('unverified')
    expect(JSON.stringify(tree!.toJSON())).toContain('Unverified')
    expect(JSON.stringify(tree!.toJSON())).not.toContain('✓')
    expect(tree!.root.findByType('button').props.disabled).toBe(false)
    await act(async () => { await tree!.root.findByType('button').props.onClick() })
    expect(props.overrides.set).toHaveBeenCalledWith('s1', route)
    expect(props.routes.refresh).toHaveBeenCalledWith('s1')
  })
  it('only shows the ready checkmark after a verified live route', () => {
    setup('ready'); expect(JSON.stringify(tree!.toJSON())).toContain('✓')
  })
})

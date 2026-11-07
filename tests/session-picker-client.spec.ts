import React from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
vi.mock('../src/client/ModelPicker.tsx', () => ({ ModelPicker: (props: any) => React.createElement('button', { disabled: props.disabled, 'data-clear': String(props.onClear !== undefined), onClick: () => props.onChange({ provider: 'glm', model: 'flash' }) }, 'Select model') }))
import { SessionSubagentPicker } from '../src/client/SessionSubagentPicker.tsx'
import { en } from '../src/client/locales.ts'
const route = { provider: 'glm', model: 'flash' }
const subscribe = () => () => {}
let tree: ReactTestRenderer | undefined
afterEach(() => { if (tree) act(() => tree!.unmount()); tree = undefined })
function setup(state: string, extra: Record<string, unknown> = {}) {
  const status = { sessionId: 's1', health: 'ready', state, expected: route, ...extra }
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
  it('offers no separate restore action: picking a model in the list is the only way to change the chip', () => {
    setup('ready'); expect(tree!.root.findByType('button').props['data-clear']).toBe('false')
  })
})
describe('degraded capabilities on the chip', () => {
  const missing = ['subagents.startActivation', 'subagents.startContinuable', 'subagents.start']
  it('replaces the raw pause error with the localized impact and the missing seam names', () => {
    setup('blocked', { error: 'Subagent dispatch is paused: raw host text', seams: [{ capability: 'model-lock', missing, mismatched: [] }] })
    const text = JSON.stringify(tree!.toJSON())
    expect(text).toContain(en.seamLockPaused); expect(text).toContain(en.seamHint)
    for (const seam of missing) expect(text).toContain(seam)
    expect(text).not.toContain('raw host text')
  })
  it('keeps the ready mark when only plan auto-switch is degraded', () => {
    setup('ready', { seams: [{ capability: 'plan-switch', missing: [], mismatched: ['tools/result exit_plan_mode value.approved'] }] })
    const text = JSON.stringify(tree!.toJSON())
    expect(text).toContain('✓'); expect(text).toContain(en.seamPlanLate); expect(text).toContain('value.approved')
  })
})

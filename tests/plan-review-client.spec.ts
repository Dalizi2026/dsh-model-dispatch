import React from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => ({
  Button: ({ children, ...props }: any) => React.createElement('button', props, children),
  IconEditOutlineMedium: () => null,
  MarkdownText: ({ text }: any) => React.createElement('p', null, text),
}))
import { PlanReviewPanel } from '../src/client/PlanReviewPanel.tsx'
import { en } from '../src/client/locales.ts'
const props = {
  pending: { key: 'review1', sessionId: 's1', answer: vi.fn(), dismiss: vi.fn() },
  review: { id: 'r1', question: 'Review', plan: 'Plan body', approve: { label: 'Approve' } },
  access: { loadCatalog: async () => ({ groups: [] }) },
  t: (key: keyof typeof en) => en[key],
}
const text = (tree: ReactTestRenderer) => JSON.stringify(tree.toJSON(), (key, value) => key === 'icon' ? undefined : value)
let tree: ReactTestRenderer | undefined
afterEach(() => { if (tree) act(() => tree!.unmount()); tree = undefined; vi.unstubAllGlobals() })
describe('plan review original model loading', () => {
  it('distinguishes failure from loading, retries and keeps errors separate from approval', async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, value: { s1: { provider: 'droid', model: 'sonnet', reasoningEffort: 'high' } } })))
    vi.stubGlobal('fetch', fetch)
    await act(async () => { tree = create(React.createElement(PlanReviewPanel, props as never)) })
    expect(text(tree!)).toContain('Could not load the original main model')
    expect(text(tree!)).not.toContain('Loading…')
    const retry = tree!.root.findAllByType('button').find(node => node.children.includes('Retry'))!
    let release!: (response: Response) => void
    fetch.mockReset().mockImplementationOnce(() => new Promise(resolve => { release = resolve }))
    await act(async () => { retry.props.onClick() })
    expect(text(tree!)).toContain('Loading…'); expect(text(tree!)).not.toContain('offline')
    await act(async () => { release(new Response(JSON.stringify({ ok: true, value: { s1: { provider: 'droid', model: 'sonnet', reasoningEffort: 'high' } } }))) })
    expect(text(tree!)).toContain('sonnet · high'); expect(text(tree!)).not.toContain('Loading…')
    expect(fetch.mock.calls[0]![1]).toMatchObject({ credentials: 'same-origin', cache: 'no-store' })
  })
  it('ignores stale model loads after switching sessions', async () => {
    let release!: (response: Response) => void
    vi.stubGlobal('fetch', vi.fn().mockImplementationOnce(() => new Promise(resolve => { release = resolve }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, value: { s2: { provider: 'step', model: 'new-main' } } }))))
    await act(async () => { tree = create(React.createElement(PlanReviewPanel, props as never)) })
    await act(async () => { tree!.update(React.createElement(PlanReviewPanel, { ...props, pending: { ...props.pending, sessionId: 's2' } } as never)) })
    await act(async () => { release(new Response(JSON.stringify({ ok: true, value: { s1: { provider: 'droid', model: 'old-main' } } }))) })
    expect(text(tree!)).toContain('new-main'); expect(text(tree!)).not.toContain('old-main')
  })
})

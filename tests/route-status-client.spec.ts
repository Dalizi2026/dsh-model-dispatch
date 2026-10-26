import { afterEach, describe, expect, it, vi } from 'vitest'
import { RouteStatusStore } from '../src/client/route-status-store.ts'
const good = { pluginVersion: '1.2.0', policyVersion: 1, sessionId: 'child', health: 'ready', state: 'locked', expected: { provider: 'glm', model: 'flash' } }
const response = (value: unknown) => new Response(JSON.stringify({ ok: true, value }), { status: 200 })
afterEach(() => vi.unstubAllGlobals())
describe('host-acknowledged route UI', () => {
  it('never reports a lock on route failure or old host payload', async () => {
    const store = new RouteStatusStore(); vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 404 })))
    await expect(store.refresh('child')).rejects.toThrow(); expect(store.get('child').value).toBeUndefined()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ sessionId: 'child' })))
    await expect(store.refresh('child')).rejects.toThrow(); expect(store.get('child').value).toBeUndefined()
  })
  it('only shows confirmation after the authenticated host acknowledgement and ignores stale reads', async () => {
    const store = new RouteStatusStore(); let release!: (value: Response) => void
    const fetch = vi.fn().mockImplementationOnce(() => new Promise(resolve => { release = resolve })).mockResolvedValueOnce(response(good))
    vi.stubGlobal('fetch', fetch)
    const old = store.refresh('child')
    await store.confirm('parent', 'child', good.expected)
    expect(fetch.mock.calls[1]![1]).toMatchObject({ credentials: 'same-origin', method: 'POST' })
    release(response({ ...good, state: 'confirmation-required' })); await old
    expect(store.get('child').value?.state).toBe('locked')
  })
  it('clears a stale locked badge after a later health failure', async () => {
    const store = new RouteStatusStore(); vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response(good)).mockRejectedValueOnce(new Error('Disconnected')))
    await store.refresh('child'); await expect(store.refresh('child')).rejects.toThrow('Disconnected')
    expect(store.get('child').value).toBeUndefined(); expect(store.get('child').error).toBe('Disconnected')
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'
import { SessionOverrideStore } from '../src/client/session-overrides-store.ts'
const selection = { provider: 'p', model: 'm', reasoningEffort: 'max' }
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}
function response(value: unknown) { return new Response(JSON.stringify({ ok: true, value }), { status: 200 }) }
afterEach(() => vi.unstubAllGlobals())
describe('session override client races', () => {
  it('does not let a poll started before or during a save undo the accepted pick', async () => {
    for (const during of [false, true]) {
      const read = deferred<Response>(); const write = deferred<Response>()
      vi.stubGlobal('fetch', vi.fn((_url, init) => init?.method === 'POST' ? write.promise : read.promise))
      const store = new SessionOverrideStore()
      let poll: Promise<void> | undefined
      if (!during) poll = store.refresh()
      const save = store.set('s', selection)
      await Promise.resolve()
      if (during) poll = store.refresh()
      write.resolve(response({ s: selection })); await save
      read.resolve(response({})); await poll
      expect(store.get('s')).toEqual(selection)
    }
  })
  it('serializes saves across pickers and sends null when clearing', async () => {
    const first = deferred<Response>(); const calls: string[] = []
    vi.stubGlobal('fetch', vi.fn((_url, init) => {
      calls.push(init.body)
      return calls.length === 1 ? first.promise : Promise.resolve(response({}))
    }))
    const store = new SessionOverrideStore()
    const pick = store.set('s', selection); const clear = store.set('s', undefined)
    await Promise.resolve(); expect(calls).toHaveLength(1)
    first.resolve(response({ s: selection })); await pick; await clear
    expect(JSON.parse(calls[1])).toEqual({ sessionId: 's', selection: null })
    expect(store.get('s')).toBeUndefined()
  })
  it('shows the exact host validation error and preserves the previous snapshot', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: false, error: { message: 'Invalid model route opencode-go/deepseek-v4.1-flash: UNKNOWN_MODEL' } }), { status: 400 })))
    const store = new SessionOverrideStore()
    await expect(store.set('s', selection)).rejects.toThrow('UNKNOWN_MODEL')
    expect(store.getSnapshot().value).toEqual({})
  })
  it('a failed save does not block the next save or alter accepted state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('', { status: 500 })).mockResolvedValueOnce(response({ s: selection })))
    const store = new SessionOverrideStore()
    await expect(store.set('s', selection)).rejects.toThrow('HTTP 500')
    expect(store.getSnapshot().value).toEqual({})
    await store.set('s', selection)
    expect(store.get('s')).toEqual(selection)
  })
})

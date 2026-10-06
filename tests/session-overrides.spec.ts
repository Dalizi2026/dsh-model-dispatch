import { mkdtemp, readFile, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { EventEmitter } from 'node:events'
import { afterEach, describe, expect, it } from 'vitest'
import { SessionOverrideStore, installSessionOverridesHttp } from '../src/session-overrides.ts'
import type { RouteValidator } from '../src/model-route.ts'
const oldHome = process.env.DSH_HOME
afterEach(() => { if (oldHome === undefined) delete process.env.DSH_HOME; else process.env.DSH_HOME = oldHome })
async function setup() {
  const home = await mkdtemp(join(tmpdir(), 'model-switch-'))
  process.env.DSH_HOME = home
  return { home, store: new SessionOverrideStore() }
}
async function route(store: SessionOverrideStore, method: string, body?: unknown, validate?: RouteValidator) {
  let handler!: (req: unknown, res: unknown) => Promise<void>
  installSessionOverridesHttp({ get: () => ({ register: (row: { handler: typeof handler }) => { handler = row.handler; return () => {} } }), effect: (fn: () => unknown) => fn() } as never, store, validate)
  const req = Object.assign(new EventEmitter(), { method })
  const response = { status: 0, body: '', writeHead(status: number) { this.status = status }, end(bytes?: Buffer) { this.body = bytes?.toString() ?? '' } }
  const pending = handler(req, response)
  if (method === 'POST') { req.emit('data', Buffer.from(JSON.stringify(body))); req.emit('end') }
  await pending
  return response
}
describe('session overrides through the activation/HTTP lifecycle', () => {
  it('restores disk values before startup reads and the first GET', async () => {
    const { store } = await setup()
    await store.set('s1', { provider: 'p', model: 'm' })
    const fresh = new SessionOverrideStore(); await fresh.ready()
    expect(fresh.get('s1')).toEqual({ provider: 'p', model: 'm' })
    const http = await route(new SessionOverrideStore(), 'GET')
    expect(JSON.parse(http.body).value.s1.model).toBe('m')
  })
  it('stores pre-plan models independently and restores them from disk', async () => {
    const { store } = await setup()
    await store.set('s1', { provider: 'child', model: 'glm' })
    const plans = new SessionOverrideStore('plan-main-models.json')
    await plans.set('s1', { provider: 'droid', model: 'sonnet', reasoningEffort: 'high' })
    const restored = new SessionOverrideStore('plan-main-models.json'); await restored.ready()
    expect(restored.get('s1')).toEqual({ provider: 'droid', model: 'sonnet', reasoningEffort: 'high' })
    expect(store.get('s1')).toEqual({ provider: 'child', model: 'glm' })
  })
  it('accepts null through the real HTTP clear path, including after a restart', async () => {
    const { store } = await setup(); await store.set('s1', { provider: 'p', model: 'm' })
    const result = await route(new SessionOverrideStore(), 'POST', { sessionId: 's1', selection: null })
    expect(result.status).toBe(200); expect(JSON.parse(result.body).value).toEqual({})
    const fresh = new SessionOverrideStore(); await fresh.ready(); expect(fresh.snapshot()).toEqual({})
  })
  it('serializes concurrent initial saves without losing either entry', async () => {
    const { store } = await setup()
    await Promise.all([store.set('a', { provider: 'p', model: 'a' }), store.set('b', { provider: 'p', model: 'b' })])
    const fresh = new SessionOverrideStore(); await fresh.ready()
    expect(Object.keys(fresh.snapshot())).toEqual(['a', 'b'])
  })
  it('returns a save failure without acknowledging a non-durable value', async () => {
    const { home, store } = await setup(); await store.ready()
    await writeFile(join(home, 'storages'), 'blocks-directory')
    expect((await route(store, 'POST', { sessionId: 's1', selection: { provider: 'p', model: 'm' } })).status).toBe(500)
    expect(store.snapshot()).toEqual({})
  })
  it('rejects malformed selections and null request bodies without mutating data', async () => {
    const { store } = await setup()
    expect((await route(store, 'POST', { sessionId: 's1', selection: { model: 'm' } })).status).toBe(400)
    expect((await route(store, 'POST', null)).status).toBe(400)
    expect(store.snapshot()).toEqual({})
  })
  it('rejects unavailable routes before persistence, but clearing does not require a valid model', async () => {
    const { store } = await setup()
    const previous = { provider: 'factory-g', model: 'glm-5.3-flash', reasoningEffort: 'max' }
    await store.set('s1', previous)
    const reject = async () => { throw new Error('UNKNOWN_MODEL: opencode-go/deepseek-v4.1-flash') }
    const invalid = await route(store, 'POST', { sessionId: 's1', selection: { provider: 'opencode-go', model: 'deepseek-v4.1-flash' } }, reject)
    expect(invalid.status).toBe(400)
    expect(JSON.parse(invalid.body).error.message).toContain('UNKNOWN_MODEL')
    expect(store.get('s1')).toEqual(previous)
    const fresh = new SessionOverrideStore(); await fresh.ready(); expect(fresh.get('s1')).toEqual(previous)
    expect((await route(store, 'POST', { sessionId: 's1', selection: null }, reject)).status).toBe(200)
  })
  it('loads only valid entries and writes a readable persisted map', async () => {
    const { home } = await setup()
    const dir = join(home, 'storages', 'model-switch'); await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'session-overrides.json'), JSON.stringify({ good: { provider: 'p', model: 'm' }, bad: { model: 5 } }))
    const store = new SessionOverrideStore(); await store.ready()
    expect(Object.keys(store.snapshot())).toEqual(['good'])
    await store.set('other', { provider: 'p', model: 'other' })
    expect(JSON.parse(await readFile(join(dir, 'session-overrides.json'), 'utf8')).other.model).toBe('other')
  })
})

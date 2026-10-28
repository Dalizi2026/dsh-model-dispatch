import { mkdtemp, readFile, writeFile, mkdir, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { RouteLockStore } from '../src/route-locks.ts'
import type { RouteLock } from '../src/route-contract.ts'
const dirs: string[] = []
afterEach(async () => { await Promise.all(dirs.splice(0).map(dir => rm(dir, { recursive: true, force: true }))) })
const lock = (id: string): RouteLock => ({ childId: id, parentId: 'parent', selection: { provider: 'glm', model: 'flash' }, source: 'session', policyVersion: 1, revision: id })
async function setup() { const dir = await mkdtemp(join(tmpdir(), 'route-locks-')); dirs.push(dir); const path = join(dir, 'locks.json'); return { dir, path, store: new RouteLockStore(path) } }
describe('durable child route lock store', () => {
  it('atomically persists concurrent distinct locks and restores immutable snapshots', async () => {
    const h = await setup(); const a = lock('a')
    const first = h.store.set(a); a.selection.model = 'caller mutation'
    await Promise.all([first, h.store.set(lock('b'))])
    const fresh = new RouteLockStore(h.path); await fresh.ready()
    expect(fresh.get('a')?.selection.model).toBe('flash'); expect(fresh.get('b')).toEqual(lock('b'))
    fresh.get('a')!.selection.model = 'read mutation'; expect(fresh.get('a')?.selection.model).toBe('flash')
    if (process.platform !== 'win32') expect((await stat(h.path)).mode & 0o777).toBe(0o600)
    expect(Object.keys(JSON.parse(await readFile(h.path, 'utf8')).locks)).toEqual(['a', 'b'])
  })
  it('allows one winner during concurrent confirmation and never overwrites a child lock', async () => {
    const h = await setup(); const results = await Promise.allSettled([h.store.set(lock('a')), h.store.set({ ...lock('a'), selection: { provider: 'droid', model: 'opus' } })])
    expect(results.map(r => r.status)).toEqual(['fulfilled', 'rejected']); expect(h.store.get('a')).toEqual(lock('a'))
  })
  it.each(['{', 'null', '{}', '{"version":2,"locks":{}}', '{"version":1,"locks":{"a":{"childId":"b"}}}'])('refuses damaged or unrecognized lock data: %s', async text => {
    const h = await setup(); await writeFile(h.path, text)
    await expect(h.store.ready()).rejects.toThrow('corrupt')
    await expect(h.store.set(lock('a'))).rejects.toThrow('corrupt')
    expect(await readFile(h.path, 'utf8')).toBe(text)
  })
  it('does not expose an acknowledged value when the atomic write fails', async () => {
    const h = await setup(); await h.store.ready(); await mkdir(h.path)
    await expect(h.store.set(lock('a'))).rejects.toThrow(); expect(h.store.get('a')).toBeUndefined()
  })
})

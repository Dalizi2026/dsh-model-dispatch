import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, readdir, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const dirSyncError: { code?: string } = {}
vi.mock('node:fs/promises', async importOriginal => {
  const real = await importOriginal<typeof import('node:fs/promises')>()
  return { ...real, open: async (path: string, ...rest: unknown[]) => {
    const handle = await (real.open as Function)(path, ...rest)
    if (dirSyncError.code && !String(path).endsWith('.tmp')) {
      handle.sync = async () => { throw Object.assign(new Error(dirSyncError.code + ': fsync'), { code: dirSyncError.code }) }
    }
    return handle
  } }
})
const { writeAtomicJson } = await import('../src/atomic-json.ts')
afterEach(() => { delete dirSyncError.code })

describe('writeAtomicJson directory sync', () => {
  for (const code of ['EPERM', 'EINVAL', 'ENOTSUP', 'EISDIR']) {
    it(`succeeds when directory fsync throws ${code}`, async () => {
      const dir = await mkdtemp(join(tmpdir(), 'aj-')); const file = join(dir, 'a.json')
      dirSyncError.code = code
      await expect(writeAtomicJson(file, { ok: 1 })).resolves.toBeUndefined()
      expect(JSON.parse(await readFile(file, 'utf8'))).toEqual({ ok: 1 })
      expect(await readdir(dir)).toEqual(['a.json'])
    })
  }
  it('still fails on other directory sync errors, keeping renamed data', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'aj-')); const file = join(dir, 'a.json')
    dirSyncError.code = 'EIO'
    await expect(writeAtomicJson(file, { ok: 2 })).rejects.toMatchObject({ code: 'EIO' })
    expect(JSON.parse(await readFile(file, 'utf8'))).toEqual({ ok: 2 })
  })
})

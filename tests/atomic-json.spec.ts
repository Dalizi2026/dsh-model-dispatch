import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const faults: { directoryOpen?: string; directorySync?: string; fileOpen?: string; fileSync?: string; rename?: string } = {}
const error = (code: string) => Object.assign(new Error(code), { code })
vi.mock('node:fs/promises', async importOriginal => {
  const real = await importOriginal<typeof import('node:fs/promises')>()
  return { ...real,
    rename: async (...args: Parameters<typeof real.rename>) => { if (faults.rename) throw error(faults.rename); return real.rename(...args) },
    open: async (path: string, flags: string, ...rest: unknown[]) => {
      // Simulate Windows directory handles without opening a real directory,
      // so these tests also work on Windows where fs.open(dir) can fail first.
      if (flags === 'r') {
        if (faults.directoryOpen) throw error(faults.directoryOpen)
        return { sync: async () => { if (faults.directorySync) throw error(faults.directorySync) }, close: async () => {} }
      }
      if (faults.fileOpen) throw error(faults.fileOpen)
      const handle = await (real.open as Function)(path, flags, ...rest)
      if (faults.fileSync) handle.sync = async () => { throw error(faults.fileSync!) }
      return handle
    },
  }
})
const { writeAtomicJson } = await import('../src/atomic-json.ts')
const directories: string[] = []
async function temp() { const dir = await mkdtemp(join(tmpdir(), 'aj-')); directories.push(dir); return dir }
afterEach(async () => { for (const key of Object.keys(faults)) delete faults[key as keyof typeof faults]; await Promise.all(directories.splice(0).map(dir => rm(dir, { recursive: true, force: true }))) })

describe('writeAtomicJson Windows directory compatibility', () => {
  for (const stage of ['directoryOpen', 'directorySync'] as const) {
    for (const code of ['EPERM', 'EINVAL', 'ENOTSUP', 'EISDIR']) {
      it(`succeeds when ${stage} throws ${code}`, async () => {
        const dir = await temp(); const file = join(dir, 'a.json'); faults[stage] = code
        await expect(writeAtomicJson(file, { ok: 1 })).resolves.toBeUndefined()
        expect(JSON.parse(await readFile(file, 'utf8'))).toEqual({ ok: 1 })
        expect(await readdir(dir)).toEqual(['a.json'])
      })
    }
  }
  for (const stage of ['fileOpen', 'fileSync', 'rename'] as const) {
    it(`does not swallow ${stage} permission failures or claim a successful save`, async () => {
      const dir = await temp(); const file = join(dir, 'a.json'); await writeFile(file, '{"old":true}')
      faults[stage] = 'EPERM'
      await expect(writeAtomicJson(file, { new: true })).rejects.toMatchObject({ code: 'EPERM' })
      expect(JSON.parse(await readFile(file, 'utf8'))).toEqual({ old: true })
      expect(await readdir(dir)).toEqual(['a.json'])
    })
  }
  it('still fails on a real directory I/O error, keeping renamed data', async () => {
    const dir = await temp(); const file = join(dir, 'a.json'); faults.directorySync = 'EIO'
    await expect(writeAtomicJson(file, { ok: 2 })).rejects.toMatchObject({ code: 'EIO' })
    expect(JSON.parse(await readFile(file, 'utf8'))).toEqual({ ok: 2 })
  })
})

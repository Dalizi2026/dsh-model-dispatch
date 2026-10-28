/** Acknowledgements follow data sync, atomic rename and (where supported) directory sync. */
import { mkdir, open, rename, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
export async function writeAtomicJson(path, value) {
    const directory = dirname(path);
    await mkdir(directory, { recursive: true });
    const tmp = path + '.' + randomUUID() + '.tmp';
    try {
        const file = await open(tmp, 'wx', 0o600);
        try {
            await file.writeFile(JSON.stringify(value, null, 2));
            await file.sync();
        }
        finally {
            await file.close();
        }
        await rename(tmp, path);
    }
    catch (cause) {
        await unlink(tmp).catch(() => { });
        throw cause;
    }
    await syncDirectory(directory);
}
/** Windows (and some filesystems) cannot fsync a directory handle; data is already renamed. */
const UNSUPPORTED_DIR_SYNC = new Set(['EPERM', 'EINVAL', 'ENOTSUP', 'EISDIR']);
async function syncDirectory(directory) {
    try {
        const parent = await open(directory, 'r');
        try {
            await parent.sync();
        }
        finally {
            await parent.close();
        }
    }
    catch (cause) {
        if (UNSUPPORTED_DIR_SYNC.has(cause?.code ?? ''))
            return;
        throw cause;
    }
}

/** Acknowledgements follow data sync, atomic rename and directory sync. */
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
        const parent = await open(directory, 'r');
        try {
            await parent.sync();
        }
        finally {
            await parent.close();
        }
    }
    catch (cause) {
        await unlink(tmp).catch(() => { });
        throw cause;
    }
}

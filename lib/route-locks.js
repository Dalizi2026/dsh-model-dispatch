/** One durable authority per child; unknown/corrupt records never become defaults. */
import { readFile } from 'node:fs/promises';
import { writeAtomicJson } from "./atomic-json.js";
import { join } from 'node:path';
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths';
export function validSelection(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return false;
    const row = value;
    return typeof row.provider === 'string' && row.provider.trim().length > 0
        && typeof row.model === 'string' && row.model.trim().length > 0
        && (row.reasoningEffort === undefined || (typeof row.reasoningEffort === 'string' && row.reasoningEffort.trim().length > 0));
}
const sources = ['session', 'default', 'follow-main', 'inherited-lock', 'user-confirmed'];
function validLock(value, id) {
    if (!value || typeof value !== 'object')
        return false;
    const row = value;
    return row.childId === id && typeof row.parentId === 'string' && row.parentId.length > 0
        && row.policyVersion === 1 && typeof row.revision === 'string' && row.revision.length > 0
        && sources.includes(row.source) && validSelection(row.selection);
}
export class RouteLockStore {
    path;
    values = new Map();
    loading;
    writing = Promise.resolve();
    constructor(path = join(resolveDshHome(), 'storages/model-switch/child-route-locks.json')) {
        this.path = path;
    }
    ready() { return this.loading ??= this.load(); }
    get(id) {
        const value = this.values.get(id);
        return value === undefined ? undefined : structuredClone(value);
    }
    async set(lock) {
        if (!validLock(lock, lock.childId))
            throw new Error('Invalid child model lock');
        const detached = structuredClone(lock);
        await this.ready();
        const operation = this.writing.then(async () => {
            const existing = this.values.get(detached.childId);
            if (existing)
                throw new Error('The child model is already locked; changing it requires a new child');
            const next = new Map(this.values);
            next.set(detached.childId, detached);
            await writeAtomicJson(this.path, { version: 1, locks: Object.fromEntries(next) });
            this.values = next;
        });
        this.writing = operation.catch(() => { });
        await operation;
    }
    async load() {
        let text;
        try {
            text = await readFile(this.path, 'utf8');
        }
        catch (cause) {
            if (cause.code === 'ENOENT')
                return;
            throw new Error('Cannot read child model locks', { cause });
        }
        try {
            const data = JSON.parse(text);
            if (data?.version !== 1 || !data.locks || typeof data.locks !== 'object' || Array.isArray(data.locks))
                throw new Error('invalid lock document');
            const next = new Map();
            for (const [id, value] of Object.entries(data.locks)) {
                if (!validLock(value, id))
                    throw new Error('invalid lock entry');
                next.set(id, value);
            }
            this.values = next;
        }
        catch (cause) {
            throw new Error('Child model locks are corrupt; generation is blocked', { cause });
        }
    }
}

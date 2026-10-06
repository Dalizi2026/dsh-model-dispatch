/**
 * Browser mirror of the host `model-switch` settings namespace.
 *
 * DSH 0.2.x serves plugin namespaces through the `configForms` service
 * (dsh-client-ui-settings); this store is a stable snapshot wrapper over the
 * namespace's `ConfigForm` controller.
 */
const EMPTY = {};
/**
 * Strip own-properties whose value is `undefined`.
 *
 * The `settings/mutate` strict JSON codec rejects ops whose `value` contains
 * explicit `undefined` members (e.g. `{ mode: 'follow-main', selection:
 * undefined }` produced by the settings UI), failing with
 * `client api:settings/mutate rejected "ops"`. A JSON round-trip drops them.
 */
function toJsonValue(value) {
    return JSON.parse(JSON.stringify(value));
}
/** Reactive config store over the client `configForms` namespace controller. */
export class ConfigStore {
    form;
    lastRaw;
    lastView = { status: 'loading', value: EMPTY, error: null };
    constructor(form) {
        this.form = form;
    }
    getSnapshot() {
        const raw = this.form.getSnapshot();
        // useSyncExternalStore requires a referentially stable snapshot between
        // calls; the controller's raw snapshot is identity-stable until it changes.
        if (raw === this.lastRaw)
            return this.lastView;
        this.lastRaw = raw;
        if (raw.status === 'unavailable') {
            this.lastView = { status: 'error', value: raw.value ?? EMPTY, error: 'unavailable' };
        }
        else {
            this.lastView = { status: raw.status, value: raw.value ?? EMPTY, error: null };
        }
        return this.lastView;
    }
    subscribe(listener) {
        return this.form.subscribe(listener);
    }
    /**
     * Persist one route field. `ConfigForm.set` is one field per call and
     * fences the write with the latest known namespace revision.
     */
    async saveRoute(field, next) {
        const accepted = await this.form.set(field, toJsonValue(next));
        if (!accepted) {
            throw new Error('settings write rejected');
        }
    }
}
/** Reactive store over the native `agent-default-model` entry config. */
export class MainModelStore {
    form;
    lastRaw;
    lastView = { status: 'loading', value: undefined, error: null };
    constructor(form) {
        this.form = form;
    }
    getSnapshot() {
        const raw = this.form.getSnapshot();
        if (raw === this.lastRaw)
            return this.lastView;
        this.lastRaw = raw;
        if (raw.status === 'unavailable') {
            this.lastView = { status: 'error', value: raw.value, error: 'unavailable' };
        }
        else {
            this.lastView = { status: raw.status, value: raw.value, error: null };
        }
        return this.lastView;
    }
    subscribe(listener) {
        return this.form.subscribe(listener);
    }
    /**
     * Persist the whole default selection. The entry's volatile fields are flat
     * (`provider` / `model` / `reasoningEffort`), so one atomic mutate carries
     * all three; clearing the effort re-inherits the composition layer.
     */
    async save(next) {
        const ops = [
            { op: 'set', path: ['provider'], value: next.provider },
            { op: 'set', path: ['model'], value: next.model },
            next.reasoningEffort === undefined
                ? { op: 'unset', path: ['reasoningEffort'] }
                : { op: 'set', path: ['reasoningEffort'], value: next.reasoningEffort },
        ];
        const accepted = await this.form.mutate(ops);
        if (!accepted) {
            throw new Error('settings write rejected');
        }
    }
}

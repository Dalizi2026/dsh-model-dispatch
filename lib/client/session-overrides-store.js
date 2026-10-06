/**
 * Client mirror of the host per-session subagent-model override map.
 *
 * Reads and writes ride the plugin's loopback HTTP routes; the map is small
 * (one entry per overridden session) so a refresh-on-open + poll store keeps
 * the composer picker honest.
 */
import { SESSION_OVERRIDES_ROUTE } from "../label.js";
const INITIAL = { value: {}, error: null, unavailable: false, version: 0 };
/** Poll-backed store keyed by session id. */
export class SessionOverrideStore {
    snap = INITIAL;
    listeners = new Set();
    timer;
    refs = 0;
    refreshing;
    writeRevision = 0;
    writing = Promise.resolve();
    subscribe = (listener) => {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    };
    getSnapshot = () => this.snap;
    start(intervalMs = 4000) {
        this.refs += 1;
        if (this.refs > 1)
            return;
        void this.refresh();
        this.timer = window.setInterval(() => { void this.refresh(); }, intervalMs);
    }
    stop() {
        this.refs = Math.max(0, this.refs - 1);
        if (this.refs > 0 || this.timer === undefined)
            return;
        window.clearInterval(this.timer);
        this.timer = undefined;
    }
    /** Override for one session, from the latest snapshot. */
    get(sessionId) {
        return this.snap.value[sessionId];
    }
    /** Whether the host route is missing (host half predates the client). */
    get unavailable() {
        return this.snap.unavailable;
    }
    /** Write one session's override; `undefined` clears it. */
    async set(sessionId, selection) {
        const operation = this.writing.then(() => this.write(sessionId, selection));
        this.writing = operation.catch(() => { });
        await operation;
    }
    async write(sessionId, selection) {
        this.writeRevision += 1;
        try {
            const response = await fetch(SESSION_OVERRIDES_ROUTE, {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ sessionId, selection: selection ?? null }),
            });
            const body = await response.json().catch(() => undefined);
            if (!response.ok)
                throw new Error(body?.error?.message ?? `HTTP ${response.status}`);
            if (body?.ok !== true || body.value === undefined) {
                throw new Error('bad session-overrides payload');
            }
            this.snap = { value: body.value, error: null, unavailable: false, version: this.snap.version + 1 };
            this.emit();
        }
        finally {
            // Invalidate reads that began while the POST was in flight, too.
            this.writeRevision += 1;
        }
    }
    refresh() {
        return this.refreshing ??= this.fetchSnapshot().finally(() => { this.refreshing = undefined; });
    }
    async fetchSnapshot() {
        const revision = this.writeRevision;
        try {
            const response = await fetch(SESSION_OVERRIDES_ROUTE, { credentials: 'same-origin' });
            if (!response.ok)
                throw new Error(`HTTP ${response.status}`);
            const body = await response.json();
            if (body.ok !== true || body.value === undefined) {
                throw new Error('bad session-overrides payload');
            }
            if (revision !== this.writeRevision)
                return;
            this.snap = { value: body.value, error: null, unavailable: false, version: this.snap.version + 1 };
            this.emit();
        }
        catch (cause) {
            if (revision !== this.writeRevision)
                return;
            // A 404/405 means the running host half has no overrides route (it
            // predates this client): mark unavailable instead of erroring forever —
            // the picker hides itself until the host catches up.
            const message = cause instanceof Error ? cause.message : String(cause);
            const missing = message === 'HTTP 404' || message === 'HTTP 405';
            this.snap = {
                value: this.snap.value,
                error: missing ? null : message,
                unavailable: missing || this.snap.unavailable,
                version: this.snap.version + 1,
            };
            this.emit();
        }
    }
    emit() {
        for (const listener of this.listeners)
            listener();
    }
}

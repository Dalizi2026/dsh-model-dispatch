/** Host acknowledgements, never optimistic lock badges. */
import { ROUTE_CONFIRM_PATH, ROUTE_STATUS_PATH, ROUTE_POLICY_VERSION } from "../route-contract.js";
export class RouteStatusStore {
    snapshots = new Map();
    revisions = new Map();
    listeners = new Set();
    watched = new Map();
    empty = {};
    subscribe = (fn) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
    get = (id) => this.snapshots.get(id) ?? this.empty;
    watch(id) {
        const current = this.watched.get(id);
        if (current)
            current.refs++;
        else {
            void this.refresh(id).catch(() => { });
            this.watched.set(id, { refs: 1, timer: setInterval(() => { void this.refresh(id).catch(() => { }); }, 4000) });
        }
        return () => {
            const value = this.watched.get(id);
            if (value && --value.refs === 0) {
                clearInterval(value.timer);
                this.watched.delete(id);
            }
        };
    }
    publish(id, value) { this.snapshots.set(id, value); for (const fn of this.listeners)
        fn(); }
    async read(response, id) {
        const body = await response.json();
        const value = body.value;
        if (!response.ok || !body.ok || value?.sessionId !== id || value.policyVersion !== ROUTE_POLICY_VERSION)
            throw new Error(body.error?.message ?? `Routing protection unavailable (HTTP ${response.status})`);
        return value;
    }
    async refresh(id) {
        const revision = (this.revisions.get(id) ?? 0) + 1;
        this.revisions.set(id, revision);
        try {
            const value = await this.read(await fetch(`${ROUTE_STATUS_PATH}?sessionId=${encodeURIComponent(id)}`, { credentials: 'same-origin', cache: 'no-store' }), id);
            if (this.revisions.get(id) === revision)
                this.publish(id, { value });
            return value;
        }
        catch (cause) {
            if (this.revisions.get(id) === revision)
                this.publish(id, { error: cause instanceof Error ? cause.message : String(cause) });
            throw cause;
        }
    }
    async confirm(parentId, childId, selection) {
        // Invalidate any earlier GET; only this authenticated acknowledgement may unlock the UI.
        this.revisions.set(childId, (this.revisions.get(childId) ?? 0) + 1);
        const value = await this.read(await fetch(ROUTE_CONFIRM_PATH, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ parentId, childId, selection }) }), childId);
        this.revisions.set(childId, (this.revisions.get(childId) ?? 0) + 1);
        this.publish(childId, { value });
        if (value.health !== 'ready' || value.state !== 'locked')
            throw new Error(value.error ?? 'The host did not confirm model protection');
    }
}

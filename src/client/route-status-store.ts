/** Host acknowledgements, never optimistic lock badges. */
import { ROUTE_CONFIRM_PATH, ROUTE_STATUS_PATH, ROUTE_POLICY_VERSION, type RouteStatus } from '../route-contract.ts'
import type { ModelSelectionConfig } from '../shared.ts'
export interface RouteSnapshot { value?: RouteStatus; error?: string }
export class RouteStatusStore {
  private snapshots = new Map<string, RouteSnapshot>()
  private revisions = new Map<string, number>()
  private listeners = new Set<() => void>()
  private watched = new Map<string, { refs: number; timer: ReturnType<typeof setInterval> }>()
  private empty: RouteSnapshot = {}
  subscribe = (fn: () => void): (() => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn) } }
  get = (id: string): RouteSnapshot => this.snapshots.get(id) ?? this.empty
  watch(id: string): () => void {
    const current = this.watched.get(id)
    if (current) current.refs++
    else {
      void this.refresh(id).catch(() => {})
      this.watched.set(id, { refs: 1, timer: setInterval(() => { void this.refresh(id).catch(() => {}) }, 4000) })
    }
    return () => {
      const value = this.watched.get(id)
      if (value && --value.refs === 0) { clearInterval(value.timer); this.watched.delete(id) }
    }
  }
  private publish(id: string, value: RouteSnapshot): void { this.snapshots.set(id, value); for (const fn of this.listeners) fn() }
  private async read(response: Response, id: string): Promise<RouteStatus> {
    const body = await response.json() as { ok?: boolean; value?: RouteStatus; error?: { message?: string } }
    const value = body.value
    if (!response.ok || !body.ok || value?.sessionId !== id || value.policyVersion !== ROUTE_POLICY_VERSION) throw new Error(body.error?.message ?? `Routing protection unavailable (HTTP ${response.status})`)
    return value
  }
  async refresh(id: string): Promise<RouteStatus> {
    const revision = (this.revisions.get(id) ?? 0) + 1; this.revisions.set(id, revision)
    try {
      const value = await this.read(await fetch(`${ROUTE_STATUS_PATH}?sessionId=${encodeURIComponent(id)}`, { credentials: 'same-origin', cache: 'no-store' }), id)
      if (this.revisions.get(id) === revision) this.publish(id, { value })
      return value
    } catch (cause) {
      if (this.revisions.get(id) === revision) this.publish(id, { error: cause instanceof Error ? cause.message : String(cause) })
      throw cause
    }
  }
  async confirm(parentId: string, childId: string, selection: ModelSelectionConfig): Promise<void> {
    // Invalidate any earlier GET; only this authenticated acknowledgement may unlock the UI.
    this.revisions.set(childId, (this.revisions.get(childId) ?? 0) + 1)
    const value = await this.read(await fetch(ROUTE_CONFIRM_PATH, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ parentId, childId, selection }) }), childId)
    this.revisions.set(childId, (this.revisions.get(childId) ?? 0) + 1)
    this.publish(childId, { value })
    if (value.health !== 'ready' || value.state !== 'locked') throw new Error(value.error ?? 'The host did not confirm model protection')
  }
}

/**
 * Client mirror of the host per-session subagent-model override map.
 *
 * Reads and writes ride the plugin's loopback HTTP routes; the map is small
 * (one entry per overridden session) so a refresh-on-open + poll store keeps
 * the composer picker honest.
 */

import { SESSION_OVERRIDES_ROUTE } from '../label.ts'
import type { ModelSelectionConfig } from '../shared.ts'

export type SessionOverrideMap = Readonly<Record<string, ModelSelectionConfig>>

interface Snapshot {
  value: SessionOverrideMap
  error: string | null
  /** Set once the host route is known missing (host half older than the client). */
  unavailable: boolean
  version: number
}

const INITIAL: Snapshot = { value: {}, error: null, unavailable: false, version: 0 }

/** Poll-backed store keyed by session id. */
export class SessionOverrideStore {
  private snap: Snapshot = INITIAL
  private readonly listeners = new Set<() => void>()
  private timer: number | undefined
  private refs = 0
  private refreshing: Promise<void> | undefined
  private writeRevision = 0
  private writing = Promise.resolve()

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  getSnapshot = (): Snapshot => this.snap

  start(intervalMs = 4000): void {
    this.refs += 1
    if (this.refs > 1) return
    void this.refresh()
    this.timer = window.setInterval(() => { void this.refresh() }, intervalMs)
  }

  stop(): void {
    this.refs = Math.max(0, this.refs - 1)
    if (this.refs > 0 || this.timer === undefined) return
    window.clearInterval(this.timer)
    this.timer = undefined
  }

  /** Override for one session, from the latest snapshot. */
  get(sessionId: string): ModelSelectionConfig | undefined {
    return this.snap.value[sessionId]
  }

  /** Whether the host route is missing (host half predates the client). */
  get unavailable(): boolean {
    return this.snap.unavailable
  }

  /** Write one session's override; `undefined` clears it. */
  async set(sessionId: string, selection: ModelSelectionConfig | undefined): Promise<void> {
    const operation = this.writing.then(() => this.write(sessionId, selection))
    this.writing = operation.catch(() => {})
    await operation
  }

  private async write(sessionId: string, selection: ModelSelectionConfig | undefined): Promise<void> {
    this.writeRevision += 1
    try {
      const response = await fetch(SESSION_OVERRIDES_ROUTE, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId, selection: selection ?? null }),
      })
      const body = await response.json().catch(() => undefined) as { ok?: boolean; value?: SessionOverrideMap; error?: { message?: string } } | undefined
      if (!response.ok) throw new Error(body?.error?.message ?? `HTTP ${response.status}`)
      if (body?.ok !== true || body.value === undefined) {
        throw new Error('bad session-overrides payload')
      }
      this.snap = { value: body.value, error: null, unavailable: false, version: this.snap.version + 1 }
      this.emit()
    } finally {
      // Invalidate reads that began while the POST was in flight, too.
      this.writeRevision += 1
    }
  }

  refresh(): Promise<void> {
    return this.refreshing ??= this.fetchSnapshot().finally(() => { this.refreshing = undefined })
  }

  private async fetchSnapshot(): Promise<void> {
    const revision = this.writeRevision
    try {
      const response = await fetch(SESSION_OVERRIDES_ROUTE, { credentials: 'same-origin' })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const body = await response.json() as { ok?: boolean; value?: SessionOverrideMap }
      if (body.ok !== true || body.value === undefined) {
        throw new Error('bad session-overrides payload')
      }
      if (revision !== this.writeRevision) return
      this.snap = { value: body.value, error: null, unavailable: false, version: this.snap.version + 1 }
      this.emit()
    } catch (cause: unknown) {
      if (revision !== this.writeRevision) return
      // A 404/405 means the running host half has no overrides route (it
      // predates this client): mark unavailable instead of erroring forever —
      // the picker hides itself until the host catches up.
      const message = cause instanceof Error ? cause.message : String(cause)
      const missing = message === 'HTTP 404' || message === 'HTTP 405'
      this.snap = {
        value: this.snap.value,
        error: missing ? null : message,
        unavailable: missing || this.snap.unavailable,
        version: this.snap.version + 1,
      }
      this.emit()
    }
  }

  private emit(): void {
    for (const listener of this.listeners) listener()
  }
}

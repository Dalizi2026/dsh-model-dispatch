/** Public, browser-safe route enforcement vocabulary. */
import type { ModelSelectionConfig } from './shared.ts'
export const ROUTE_STATUS_PATH = '/_dsh/model-switch/route-status'
export const ROUTE_CONFIRM_PATH = '/_dsh/model-switch/confirm-child-route'
export const HOST_SEAMS_PATH = '/_dsh/model-switch/host-seams'
export const ROUTE_POLICY_VERSION = 1
export const PLUGIN_VERSION = '1.3.0'
export type RouteSource = 'session' | 'default' | 'follow-main' | 'inherited-lock' | 'user-confirmed'
/** Host-side capabilities; each UI entry degrades on its own in the client. */
export type CapabilityId = 'model-lock' | 'plan-switch'
/**
 * One degraded capability. `missing` seams switch the capability off or pause
 * it; `mismatched` seams carried event data of an unexpected shape, and the
 * capability keeps running in its conservative fallback.
 */
export interface CapabilityReport {
  capability: CapabilityId
  missing: string[]
  mismatched: string[]
}
export interface RouteLock {
  childId: string
  parentId: string
  selection: ModelSelectionConfig
  source: RouteSource
  policyVersion: 1
  revision: string
  conflict?: Partial<ModelSelectionConfig>
}
export interface RouteStatus {
  pluginVersion: string
  policyVersion: number
  health: 'loading' | 'ready' | 'blocked'
  state: 'ready' | 'locked' | 'confirmation-required' | 'blocked' | 'unverified' | 'missing'
  sessionId: string
  parentId?: string
  expected?: ModelSelectionConfig
  actual?: ModelSelectionConfig
  source?: RouteSource
  revision?: string
  error?: string
  conflict?: Partial<ModelSelectionConfig>
  /** Degraded capabilities only; absent when every host seam is available. */
  seams?: CapabilityReport[]
}

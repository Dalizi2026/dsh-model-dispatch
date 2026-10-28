/** Public, browser-safe route enforcement vocabulary. */
import type { ModelSelectionConfig } from './shared.ts'
export const ROUTE_STATUS_PATH = '/_dsh/model-switch/route-status'
export const ROUTE_CONFIRM_PATH = '/_dsh/model-switch/confirm-child-route'
export const ROUTE_POLICY_VERSION = 1
export const PLUGIN_VERSION = '1.2.1'
export type RouteSource = 'session' | 'default' | 'follow-main' | 'inherited-lock' | 'user-confirmed'
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
  state: 'ready' | 'locked' | 'confirmation-required' | 'blocked'
  sessionId: string
  parentId?: string
  expected?: ModelSelectionConfig
  actual?: ModelSelectionConfig
  source?: RouteSource
  revision?: string
  error?: string
  conflict?: Partial<ModelSelectionConfig>
}

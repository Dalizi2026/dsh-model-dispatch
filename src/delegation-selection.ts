/** Untrusted tool preferences travel only for conflict auditing, never authority. */
import { AsyncLocalStorage } from 'node:async_hooks'

export interface DelegationSelection {
  parent: object
  provider?: string
  model?: string
  reasoningEffort?: string
}
export const delegationSelection = new AsyncLocalStorage<DelegationSelection>()

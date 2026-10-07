/** Explicit child selections travel with one tool invocation, never globally. */
import { AsyncLocalStorage } from 'node:async_hooks'

export interface DelegationSelection {
  parent: object
  provider?: string
  model?: string
  reasoningEffort?: string
}
export const delegationSelection = new AsyncLocalStorage<DelegationSelection>()

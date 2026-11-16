/** Untrusted tool preferences travel only for conflict auditing, never authority. */
import { AsyncLocalStorage } from 'node:async_hooks';
export const delegationSelection = new AsyncLocalStorage();

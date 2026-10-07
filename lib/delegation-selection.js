/** Explicit child selections travel with one tool invocation, never globally. */
import { AsyncLocalStorage } from 'node:async_hooks';
export const delegationSelection = new AsyncLocalStorage();

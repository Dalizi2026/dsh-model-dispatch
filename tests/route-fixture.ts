import { RouteEnforcer } from '../src/route-enforcer.ts'
import type { RouteLock } from '../src/route-contract.ts'
import type { Config, ModelSelectionConfig } from '../src/shared.ts'
export function memoryLocks() {
  const data = new Map<string, RouteLock>()
  return { ready: async () => {}, get: (id: string) => data.has(id) ? structuredClone(data.get(id)!) : undefined,
    async set(lock: RouteLock) { if (data.has(lock.childId)) throw new Error('already locked'); data.set(lock.childId, structuredClone(lock)) }, data }
}
export function authorityFor(ctx: unknown, current: () => Config, get: (id: string) => ModelSelectionConfig | undefined,
  admit: (route: ModelSelectionConfig) => Promise<ModelSelectionConfig>) {
  return new RouteEnforcer(ctx as never, current, { ready: async () => {}, get }, memoryLocks(), admit)
}

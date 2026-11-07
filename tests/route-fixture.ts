import { RouteEnforcer } from '../src/route-enforcer.ts'
import { HostSeams } from '../src/host-seams.ts'
import type { RouteLock } from '../src/route-contract.ts'
import type { Config, ModelSelectionConfig } from '../src/shared.ts'
export function memoryLocks() {
  const data = new Map<string, RouteLock>()
  return { ready: async () => {}, get: (id: string) => data.has(id) ? structuredClone(data.get(id)!) : undefined,
    async set(lock: RouteLock) { if (data.has(lock.childId)) throw new Error('already locked'); data.set(lock.childId, structuredClone(lock)) }, data }
}
/** `ctx.get` for a host exposing every seam; a spec passes the services it exercises. */
export function hostServices(services: Record<string, unknown>): (name: string) => unknown {
  const defaults: Record<string, unknown> = {
    subagents: { startActivation() {}, getProvider: () => ({ prepareContinuable() {} }) },
    agents: { get: () => undefined, list: () => [] },
    sessionPersistence: { stat: async () => undefined },
    llm: { resolveCallConfig: async (route: unknown) => route, listProviders: () => [], listModels: async () => [] },
    sessionProjections: { stateOf: () => undefined, register() {} },
    sessionController: { selectModel() {} },
    agentDefaultModel: { saveSelection() {} },
  }
  return name => name in services ? services[name] : defaults[name]
}
export function authorityFor(ctx: unknown, current: () => Config, get: (id: string) => ModelSelectionConfig | undefined,
  admit: (route: ModelSelectionConfig) => Promise<ModelSelectionConfig>) {
  return new RouteEnforcer(ctx as never, current, { ready: async () => {}, get }, memoryLocks(), admit, new HostSeams(ctx as never))
}

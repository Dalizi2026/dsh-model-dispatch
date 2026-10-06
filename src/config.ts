/**
 * Host settings schema for dsh-model-dispatch.
 */

import z from '@deepseek-ai/schemastery'
import type { Config, ModelSelectionConfig, RouteSwitchConfig } from './shared.ts'

export type { Config, ModelSelectionConfig, RouteSwitchConfig } from './shared.ts'
export {
  MODEL_SWITCH_NS,
  resolveCustomSelection,
} from './shared.ts'

/** Persisted settings namespace (kebab-case literal validated by dsh-settings). */
export const MODEL_SWITCH_SETTINGS_NAMESPACE = 'model-switch'

const SelectionSchema: z<ModelSelectionConfig> = z.object({
  provider: z.string().required(),
  model: z.string().required(),
  reasoningEffort: z.string(),
})

const RouteSchema: z<RouteSwitchConfig> = z.object({
  mode: z.union(['follow-main', 'custom'] as const).default('follow-main'),
  selection: SelectionSchema.default(undefined as unknown as ModelSelectionConfig),
})

/**
 * Schemastery schema for the settings section / composition entry.
 *
 * DSH 0.2.x serves and mutates plugin settings exclusively through
 * `volatile`-marked fields of the plugin's Config schema (dsh-settings refuses
 * writes to entries without them), so both routes are volatile: settings-UI
 * edits apply live without restarting the plugin.
 */
export const ConfigSchema = z.object({
  subagent: RouteSchema.default({ mode: 'follow-main' }).volatile(),
  planPlanning: RouteSchema.default({ mode: 'follow-main' }).volatile(),
})

/**
 * Read a config value that may arrive as a volatile reference.
 *
 * With a volatile schema the resolved entry config hands the plugin stable
 * `Volatile<T>` references whose contents update in place; without one it is
 * plain data. Duck-typing the reference protocol avoids a hard dependency on
 * the cosmokit copy that ships inside the host.
 */
export function unwrapVolatile<T>(value: T | { get(): unknown } | undefined): T | undefined {
  if (value === undefined) return undefined
  if (typeof value === 'object' && value !== null && typeof (value as { get?: unknown }).get === 'function') {
    return (value as { get(): unknown }).get() as T
  }
  return value as T
}

/** Read the current route (volatile-aware) from live plugin config. */
export function readRoute(value: Config['subagent']): RouteSwitchConfig | undefined {
  return unwrapVolatile(value)
}

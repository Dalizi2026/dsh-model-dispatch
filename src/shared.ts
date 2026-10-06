/**
 * Shared types and pure helpers (host + client safe).
 */

/** One provider/model/(optional effort) selection. */
export interface ModelSelectionConfig {
  provider: string
  model: string
  reasoningEffort?: string
}

/** Follow the parent/main session model, or use an explicit selection. */
export interface RouteSwitchConfig {
  mode: 'follow-main' | 'custom'
  selection?: ModelSelectionConfig
}

/** Full plugin settings section. */
export interface Config {
  /** Model route for in-process subagents. */
  subagent?: RouteSwitchConfig
  /** Model route applied while plan mode is active (drafting the plan). */
  planPlanning?: RouteSwitchConfig
}

/** Settings namespace string (must match host registration). */
export const MODEL_SWITCH_NS = 'model-switch'

/** Resolve a route to an explicit selection, or undefined when following main. */
export function resolveCustomSelection(route: RouteSwitchConfig | undefined): ModelSelectionConfig | undefined {
  if (route?.mode !== 'custom') return undefined
  const selection = route.selection
  if (selection === undefined) return undefined
  const provider = selection.provider.trim()
  const model = selection.model.trim()
  if (provider.length === 0 || model.length === 0) return undefined
  const effort = selection.reasoningEffort?.trim()
  return {
    provider,
    model,
    ...effort !== undefined && effort.length > 0 ? { reasoningEffort: effort } : {},
  }
}

/** Route identity, including the explicit effort (undefined means provider default). */
export function sameSelection(a: ModelSelectionConfig | null | undefined, b: ModelSelectionConfig | null | undefined): boolean {
  return a === b || (a != null && b != null && a.provider === b.provider && a.model === b.model && a.reasoningEffort === b.reasoningEffort)
}

/**
 * Host half of dsh-model-dispatch: persist settings and inject subagent model routes.
 */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-agent'
import {
  ConfigSchema,
  MODEL_SWITCH_SETTINGS_NAMESPACE,
  readRoute,
  resolveCustomSelection,
} from './config.ts'
import type { Config as ModelSwitchConfig } from './shared.ts'
import {
  effortFromSelection,
  installSessionLabelTracking,
  installSessionLabelsHttp,
  SessionLabelRegistry,
} from './session-labels.ts'
import { installSessionOverridesHttp, SessionOverrideStore } from './session-overrides.ts'
import { installPlanMainsHttp } from './plan-main-http.ts'
import { installPlanModelSwitch } from './plan-model.ts'
import { installSessionModelScope } from './session-model-scope.ts'
import { modelRouteValidator } from './model-route.ts'
import { installSubagentRouting } from './subagent-routing.ts'
import { assertCatalogRoute, installSubagentCatalog } from './subagent-catalog.ts'

export {
  resolveCustomSelection,
} from './shared.ts'
export type { Config as ModelSwitchConfig } from './shared.ts'
export { ConfigSchema, MODEL_SWITCH_SETTINGS_NAMESPACE }
export { SESSION_LABELS_ROUTE } from './label.ts'
export { SESSION_OVERRIDES_ROUTE } from './session-overrides.ts'
export { formatModelLabel, formatContextWindow } from './label.ts'

/** Schemastery Config export expected by DSH plugin loaders. */
export const Config = ConfigSchema

export const name = 'model-switch'
export const inject = ['subagents']

/**
 * Wrap subagent start paths with model routes from live plugin config.
 *
 * DSH 0.2.x: settings persistence lives in the plugin's Config schema
 * (volatile fields in the profile entry); the resolved values arrive as
 * self-updating volatile references, so `current()` reads them lazily at
 * each call instead of tracking a separate settings source.
 *
 * Precedence for one delegation: the parent session's composer override
 * (per-thread pick) beats the settings default.
 *
 * @param ctx - host plugin context.
 * @param config - composition-entry defaults.
 */
export async function apply(ctx: Context, config: ModelSwitchConfig = {}): Promise<void> {
  const current = (): ModelSwitchConfig => config
  installSessionModelScope(ctx)
  installSubagentCatalog(ctx)

  const labels = new SessionLabelRegistry()
  installSessionLabelsHttp(ctx, labels)
  installSessionLabelTracking(ctx, labels, () => (
    effortFromSelection(resolveCustomSelection(readRoute(current().subagent)))
  ))

  const overrides = new SessionOverrideStore()
  await overrides.ready()
  const validateRoute = modelRouteValidator(ctx)
  installSessionOverridesHttp(ctx, overrides, validateRoute)
  const planMains = new SessionOverrideStore('plan-main-models.json')
  await planMains.ready()
  installPlanMainsHttp(ctx, planMains)
  installPlanModelSwitch(ctx, current, planMains)

  installSubagentRouting(ctx, current, overrides, async route => {
    await assertCatalogRoute(ctx, route)
    await validateRoute(route)
  })
}

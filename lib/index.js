/**
 * Host half of dsh-model-dispatch: persist settings and inject subagent model routes.
 */
import { ConfigSchema, MODEL_SWITCH_SETTINGS_NAMESPACE, readRoute, resolveCustomSelection, } from "./config.js";
import { effortFromSelection, installSessionLabelTracking, installSessionLabelsHttp, SessionLabelRegistry, } from "./session-labels.js";
import { installSessionOverridesHttp, SessionOverrideStore } from "./session-overrides.js";
import { installPlanMainsHttp } from "./plan-main-http.js";
import { installPlanModelSwitch } from "./plan-model.js";
import { installSessionModelScope } from "./session-model-scope.js";
import { modelRouteResolver } from "./model-route.js";
import { installSubagentRouting } from "./subagent-routing.js";
import { assertCatalogRoute, installSubagentCatalog } from "./subagent-catalog.js";
import { RouteLockStore } from "./route-locks.js";
import { RouteEnforcer } from "./route-enforcer.js";
import { installRouteHttp, ownerGate } from "./route-http.js";
export { resolveCustomSelection, } from "./shared.js";
export { ConfigSchema, MODEL_SWITCH_SETTINGS_NAMESPACE };
export { SESSION_LABELS_ROUTE } from "./label.js";
export { SESSION_OVERRIDES_ROUTE } from "./session-overrides.js";
export { formatModelLabel, formatContextWindow } from "./label.js";
/** Schemastery Config export expected by DSH plugin loaders. */
export const Config = ConfigSchema;
export const name = 'model-switch';
export const inject = ['subagents'];
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
export async function apply(ctx, config = {}) {
    const current = () => config;
    installSessionModelScope(ctx);
    const labels = new SessionLabelRegistry();
    installSessionLabelsHttp(ctx, labels);
    installSessionLabelTracking(ctx, labels, () => (effortFromSelection(resolveCustomSelection(readRoute(current().subagent)))));
    const overrides = new SessionOverrideStore();
    const resolver = modelRouteResolver(ctx);
    const admit = async (route) => {
        await assertCatalogRoute(ctx, route);
        return resolver(route);
    };
    const authority = new RouteEnforcer(ctx, current, overrides, new RouteLockStore(), admit);
    // Mount fail-closed boundaries before touching disk. Initialization failure
    // must not dispose the protection and leave native inheritance running.
    authority.installGuards();
    installSubagentRouting(ctx, authority);
    installSubagentCatalog(ctx, authority);
    installRouteHttp(ctx, authority);
    installSessionOverridesHttp(ctx, overrides, async (route) => { await admit(route); }, ownerGate(ctx));
    const planMains = new SessionOverrideStore('plan-main-models.json');
    // Keep plan storage failures visible at the request boundary, too.
    installPlanMainsHttp(ctx, planMains);
    installPlanModelSwitch(ctx, current, planMains);
    await authority.initialize();
    try {
        await planMains.ready();
    }
    catch (cause) {
        ctx.logger.error('Model switch: cannot initialize plan recovery storage', cause);
    }
}

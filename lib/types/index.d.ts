/**
 * Host half of dsh-model-dispatch: persist settings and inject subagent model routes.
 */
import type { Context } from '@deepseek-ai/cordis';
import { ConfigSchema, MODEL_SWITCH_SETTINGS_NAMESPACE } from './config.ts';
import type { Config as ModelSwitchConfig } from './shared.ts';
export { resolveCustomSelection, } from './shared.ts';
export type { Config as ModelSwitchConfig } from './shared.ts';
export { ConfigSchema, MODEL_SWITCH_SETTINGS_NAMESPACE };
export { SESSION_LABELS_ROUTE } from './label.ts';
export { SESSION_OVERRIDES_ROUTE } from './session-overrides.ts';
export { formatModelLabel, formatContextWindow } from './label.ts';
/** Schemastery Config export expected by DSH plugin loaders. */
export declare const Config: import("@deepseek-ai/schemastery").default<Schemastery.ObjectS<NoInfer<{
    subagent: import("@deepseek-ai/schemastery").default<NoInfer<import("./shared.ts").RouteSwitchConfig>, NoInfer<import("./shared.ts").RouteSwitchConfig>, "volatile-defined">;
    planPlanning: import("@deepseek-ai/schemastery").default<NoInfer<import("./shared.ts").RouteSwitchConfig>, NoInfer<import("./shared.ts").RouteSwitchConfig>, "volatile-defined">;
}>>, Schemastery.ObjectT<NoInfer<{
    subagent: import("@deepseek-ai/schemastery").default<NoInfer<import("./shared.ts").RouteSwitchConfig>, NoInfer<import("./shared.ts").RouteSwitchConfig>, "volatile-defined">;
    planPlanning: import("@deepseek-ai/schemastery").default<NoInfer<import("./shared.ts").RouteSwitchConfig>, NoInfer<import("./shared.ts").RouteSwitchConfig>, "volatile-defined">;
}>>, "plain">;
export declare const name = "model-switch";
export declare const inject: string[];
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
export declare function apply(ctx: Context, config?: ModelSwitchConfig): Promise<void>;

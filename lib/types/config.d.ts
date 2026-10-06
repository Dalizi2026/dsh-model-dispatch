/**
 * Host settings schema for dsh-model-dispatch.
 */
import z from '@deepseek-ai/schemastery';
import type { Config, RouteSwitchConfig } from './shared.ts';
export type { Config, ModelSelectionConfig, RouteSwitchConfig } from './shared.ts';
export { MODEL_SWITCH_NS, resolveCustomSelection, } from './shared.ts';
/** Persisted settings namespace (kebab-case literal validated by dsh-settings). */
export declare const MODEL_SWITCH_SETTINGS_NAMESPACE = "model-switch";
/**
 * Schemastery schema for the settings section / composition entry.
 *
 * DSH 0.2.x serves and mutates plugin settings exclusively through
 * `volatile`-marked fields of the plugin's Config schema (dsh-settings refuses
 * writes to entries without them), so both routes are volatile: settings-UI
 * edits apply live without restarting the plugin.
 */
export declare const ConfigSchema: z<Schemastery.ObjectS<NoInfer<{
    subagent: z<NoInfer<RouteSwitchConfig>, NoInfer<RouteSwitchConfig>, "volatile-defined">;
    planPlanning: z<NoInfer<RouteSwitchConfig>, NoInfer<RouteSwitchConfig>, "volatile-defined">;
}>>, Schemastery.ObjectT<NoInfer<{
    subagent: z<NoInfer<RouteSwitchConfig>, NoInfer<RouteSwitchConfig>, "volatile-defined">;
    planPlanning: z<NoInfer<RouteSwitchConfig>, NoInfer<RouteSwitchConfig>, "volatile-defined">;
}>>, "plain">;
/**
 * Read a config value that may arrive as a volatile reference.
 *
 * With a volatile schema the resolved entry config hands the plugin stable
 * `Volatile<T>` references whose contents update in place; without one it is
 * plain data. Duck-typing the reference protocol avoids a hard dependency on
 * the cosmokit copy that ships inside the host.
 */
export declare function unwrapVolatile<T>(value: T | {
    get(): unknown;
} | undefined): T | undefined;
/** Read the current route (volatile-aware) from live plugin config. */
export declare function readRoute(value: Config['subagent']): RouteSwitchConfig | undefined;

/**
 * Host settings schema for dsh-model-dispatch.
 */
import z from '@deepseek-ai/schemastery';
export { MODEL_SWITCH_NS, resolveCustomSelection, } from "./shared.js";
/** Persisted settings namespace (kebab-case literal validated by dsh-settings). */
export const MODEL_SWITCH_SETTINGS_NAMESPACE = 'model-switch';
const SelectionSchema = z.object({
    provider: z.string().required(),
    model: z.string().required(),
    reasoningEffort: z.string(),
});
const RouteSchema = z.object({
    mode: z.union(['follow-main', 'custom']).default('follow-main'),
    selection: SelectionSchema.default(undefined),
});
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
});
/**
 * Read a config value that may arrive as a volatile reference.
 *
 * With a volatile schema the resolved entry config hands the plugin stable
 * `Volatile<T>` references whose contents update in place; without one it is
 * plain data. Duck-typing the reference protocol avoids a hard dependency on
 * the cosmokit copy that ships inside the host.
 */
export function unwrapVolatile(value) {
    if (value === undefined)
        return undefined;
    if (typeof value === 'object' && value !== null && typeof value.get === 'function') {
        return value.get();
    }
    return value;
}
/** Read the current route (volatile-aware) from live plugin config. */
export function readRoute(value) {
    return unwrapVolatile(value);
}

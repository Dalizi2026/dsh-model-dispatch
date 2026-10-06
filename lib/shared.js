/**
 * Shared types and pure helpers (host + client safe).
 */
/** Settings namespace string (must match host registration). */
export const MODEL_SWITCH_NS = 'model-switch';
/** Resolve a route to an explicit selection, or undefined when following main. */
export function resolveCustomSelection(route) {
    if (route?.mode !== 'custom')
        return undefined;
    const selection = route.selection;
    if (selection === undefined)
        return undefined;
    const provider = selection.provider.trim();
    const model = selection.model.trim();
    if (provider.length === 0 || model.length === 0)
        return undefined;
    const effort = selection.reasoningEffort?.trim();
    return {
        provider,
        model,
        ...effort !== undefined && effort.length > 0 ? { reasoningEffort: effort } : {},
    };
}
/** Route identity, including the explicit effort (undefined means provider default). */
export function sameSelection(a, b) {
    return a === b || (a != null && b != null && a.provider === b.provider && a.model === b.model && a.reasoningEffort === b.reasoningEffort);
}

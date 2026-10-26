/**
 * Pure merge helpers for subagent agentOptions overrides.
 */
/**
 * Apply a user selection over existing request agentOptions.
 * Only non-route request fields survive; the user owns the complete route.
 */
export function mergeAgentOptions(requested, selection) {
    const { provider: _provider, model: _model, reasoningEffort: _effort, ...other } = requested ?? {};
    return {
        ...other,
        provider: selection.provider,
        model: selection.model,
        ...selection.reasoningEffort === undefined
            ? {}
            : { reasoningEffort: selection.reasoningEffort },
    };
}

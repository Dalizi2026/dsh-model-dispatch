/**
 * Pure merge helpers for subagent agentOptions overrides.
 */
/**
 * Merge a custom selection under an existing request agentOptions.
 * Explicit request fields win over the settings selection.
 */
export function mergeAgentOptions(requested, selection) {
    return {
        provider: selection.provider,
        model: selection.model,
        ...selection.reasoningEffort === undefined
            ? {}
            : { reasoningEffort: selection.reasoningEffort },
        ...requested,
    };
}

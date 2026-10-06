/**
 * Format subagent model readout: `ModelName Context Effort` e.g. `GPT-5.6 Sol 1M Max`.
 */
/** Browser-facing map of sessionId → formatted label. */
export declare const SESSION_LABELS_ROUTE = "/_dsh/model-switch/session-labels";
/** Browser-facing per-session subagent-model override map. */
export declare const SESSION_OVERRIDES_ROUTE = "/_dsh/model-switch/session-overrides";
export interface ModelLabelParts {
    modelName: string;
    contextWindow?: number;
    effortName?: string;
}
/** Compact context capacity: 128000 → 128K, 1000000 → 1M. */
export declare function formatContextWindow(tokens: number): string;
/** Join model name + optional context + optional effort with spaces. */
export declare function formatModelLabel(parts: ModelLabelParts): string;

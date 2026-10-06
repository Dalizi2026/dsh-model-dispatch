/**
 * Shared types and pure helpers (host + client safe).
 */
/** One provider/model/(optional effort) selection. */
export interface ModelSelectionConfig {
    provider: string;
    model: string;
    reasoningEffort?: string;
}
/** Follow the parent/main session model, or use an explicit selection. */
export interface RouteSwitchConfig {
    mode: 'follow-main' | 'custom';
    selection?: ModelSelectionConfig;
}
/** Full plugin settings section. */
export interface Config {
    /** Model route for in-process subagents. */
    subagent?: RouteSwitchConfig;
    /** Model route applied while plan mode is active (drafting the plan). */
    planPlanning?: RouteSwitchConfig;
}
/** Settings namespace string (must match host registration). */
export declare const MODEL_SWITCH_NS = "model-switch";
/** Resolve a route to an explicit selection, or undefined when following main. */
export declare function resolveCustomSelection(route: RouteSwitchConfig | undefined): ModelSelectionConfig | undefined;
/** Route identity, including the explicit effort (undefined means provider default). */
export declare function sameSelection(a: ModelSelectionConfig | null | undefined, b: ModelSelectionConfig | null | undefined): boolean;

/**
 * Host registry of subagent session → display label + HTTP readout.
 */
import type { Context } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import { SESSION_LABELS_ROUTE } from './label.ts';
import type { ModelSelectionConfig } from './shared.ts';
export { SESSION_LABELS_ROUTE };
/** In-memory labels keyed by child session id. */
export declare class SessionLabelRegistry {
    private readonly labels;
    get(sessionId: string): string | undefined;
    snapshot(): Record<string, string>;
    set(sessionId: string, label: string): void;
}
/**
 * Resolve a human label from agent route + optional effort override.
 * @param ctx - host context with optional llm service.
 * @param agent - newly created / live agent.
 * @param effortId - reasoning effort id when known.
 */
export declare function resolveAgentLabel(ctx: Context, agent: Agent, effortId: string | undefined): Promise<string | undefined>;
/**
 * Remember labels for every subagent agent that appears; update effort on request.
 * @param ctx - host context.
 * @param registry - label map.
 * @param currentEffort - live custom-selection effort reader.
 */
export declare function installSessionLabelTracking(ctx: Context, registry: SessionLabelRegistry, currentEffort: () => string | undefined): void;
/**
 * Mount GET session-labels when a web server is available.
 * @param ctx - host context.
 * @param registry - label map.
 */
export declare function installSessionLabelsHttp(ctx: Context, registry: SessionLabelRegistry): void;
/** Helper for tests / callers that already have a selection. */
export declare function effortFromSelection(selection: ModelSelectionConfig | undefined): string | undefined;

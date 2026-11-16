/**
 * Pure merge helpers for subagent agentOptions overrides.
 */
import type { AgentOptions } from '@deepseek-ai/dsh-agent';
import type { ModelSelectionConfig } from './shared.ts';
/**
 * Apply a user selection over existing request agentOptions.
 * Only non-route request fields survive; the user owns the complete route.
 */
export declare function mergeAgentOptions(requested: AgentOptions | undefined, selection: ModelSelectionConfig): AgentOptions;

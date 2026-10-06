/**
 * Pure merge helpers for subagent agentOptions overrides.
 */
import type { AgentOptions } from '@deepseek-ai/dsh-agent';
import type { ModelSelectionConfig } from './shared.ts';
/**
 * Merge a custom selection under an existing request agentOptions.
 * Explicit request fields win over the settings selection.
 */
export declare function mergeAgentOptions(requested: AgentOptions | undefined, selection: ModelSelectionConfig): AgentOptions;

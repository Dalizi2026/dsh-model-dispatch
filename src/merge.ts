/**
 * Pure merge helpers for subagent agentOptions overrides.
 */

import type { AgentOptions } from '@deepseek-ai/dsh-agent'
import type { ModelSelectionConfig } from './shared.ts'

/**
 * Merge a custom selection under an existing request agentOptions.
 * Explicit request fields win over the settings selection.
 */
export function mergeAgentOptions(
  requested: AgentOptions | undefined,
  selection: ModelSelectionConfig,
): AgentOptions {
  return {
    provider: selection.provider,
    model: selection.model,
    ...selection.reasoningEffort === undefined
      ? {}
      : { reasoningEffort: selection.reasoningEffort as AgentOptions['reasoningEffort'] },
    ...requested,
  }
}

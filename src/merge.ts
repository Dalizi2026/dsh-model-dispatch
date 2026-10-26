/**
 * Pure merge helpers for subagent agentOptions overrides.
 */

import type { AgentOptions } from '@deepseek-ai/dsh-agent'
import type { ModelSelectionConfig } from './shared.ts'

/**
 * Apply a user selection over existing request agentOptions.
 * Only non-route request fields survive; the user owns the complete route.
 */
export function mergeAgentOptions(
  requested: AgentOptions | undefined,
  selection: ModelSelectionConfig,
): AgentOptions {
  const { provider: _provider, model: _model, reasoningEffort: _effort, ...other } = requested ?? {}
  return {
    ...other,
    provider: selection.provider,
    model: selection.model,
    ...selection.reasoningEffort === undefined
      ? {}
      : { reasoningEffort: selection.reasoningEffort as AgentOptions['reasoningEffort'] },
  }
}

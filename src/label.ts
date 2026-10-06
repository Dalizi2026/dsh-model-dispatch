/**
 * Format subagent model readout: `ModelName Context Effort` e.g. `GPT-5.6 Sol 1M Max`.
 */

/** Browser-facing map of sessionId → formatted label. */
export const SESSION_LABELS_ROUTE = '/_dsh/model-switch/session-labels'

/** Browser-facing per-session subagent-model override map. */
export const SESSION_OVERRIDES_ROUTE = '/_dsh/model-switch/session-overrides'

export interface ModelLabelParts {
  modelName: string
  contextWindow?: number
  effortName?: string
}

/** Compact context capacity: 128000 → 128K, 1000000 → 1M. */
export function formatContextWindow(tokens: number): string {
  if (tokens < 1_000) return String(tokens)
  if (tokens < 1_000_000) {
    const k = tokens / 1_000
    return Number.isInteger(k) ? `${k}K` : `${Math.round(k * 10) / 10}K`
  }
  const m = tokens / 1_000_000
  return Number.isInteger(m) ? `${m}M` : `${Math.round(m * 10) / 10}M`
}

/** Join model name + optional context + optional effort with spaces. */
export function formatModelLabel(parts: ModelLabelParts): string {
  const bits = [parts.modelName.trim()].filter(Boolean)
  if (parts.contextWindow !== undefined && parts.contextWindow > 0) {
    bits.push(formatContextWindow(parts.contextWindow))
  }
  if (parts.effortName !== undefined && parts.effortName.length > 0) {
    bits.push(parts.effortName)
  }
  return bits.join(' ')
}

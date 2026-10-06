/** Validate the exact provider/model/effort through the host's owning adapter. */
import type { Context } from '@deepseek-ai/cordis'
import type { ModelSelectionConfig } from './shared.ts'
export type RouteValidator = (selection: ModelSelectionConfig) => Promise<void>
interface RouteResolver { resolveCallConfig(selection: ModelSelectionConfig): Promise<unknown> }

export function modelRouteValidator(ctx: Context): RouteValidator {
  return async selection => {
    const llm = ctx.get('llm') as RouteResolver | undefined
    if (!llm) throw new Error('Model route validation is unavailable: the host LLM service is missing')
    try {
      // Exact adapter resolution also checks explicit reasoning effort. Do not
      // infer aliases from matching model names or materialize defaults in storage.
      await llm.resolveCallConfig(selection)
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : String(cause)
      throw new Error(`Invalid model route ${selection.provider}/${selection.model}: ${reason}`, { cause })
    }
  }
}

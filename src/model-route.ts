/** Validate the exact provider/model/effort through the host's owning adapter. */
import type { Context } from '@deepseek-ai/cordis'
import type { ModelSelectionConfig } from './shared.ts'
export type RouteValidator = (selection: ModelSelectionConfig) => Promise<void>
interface RouteResolver { resolveCallConfig(selection: ModelSelectionConfig): Promise<ModelSelectionConfig> }

export function modelRouteResolver(ctx: Context): (selection: ModelSelectionConfig) => Promise<ModelSelectionConfig> {
  return async selection => {
    const llm = ctx.get('llm') as RouteResolver | undefined
    if (!llm) throw new Error('Model route validation is unavailable: the host LLM service is missing')
    try {
      // Exact adapter resolution also checks explicit reasoning effort. Do not
      // infer aliases from matching names. Pin the adapter’s effective effort.
      const resolved = await llm.resolveCallConfig(selection)
      if (resolved.provider !== selection.provider || resolved.model !== selection.model) throw new Error('The adapter resolved a different provider or model')
      return { provider: resolved.provider, model: resolved.model, ...resolved.reasoningEffort === undefined ? {} : { reasoningEffort: String(resolved.reasoningEffort) } }
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : String(cause)
      throw new Error(`Invalid model route ${selection.provider}/${selection.model}: ${reason}`, { cause })
    }
  }
}

export function modelRouteValidator(ctx: Context): RouteValidator {
  const resolve = modelRouteResolver(ctx)
  return async selection => { await resolve(selection) }
}

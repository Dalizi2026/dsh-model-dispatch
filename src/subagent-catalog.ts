/** Use the live configured catalog as the user's child-model selection authority.
 * rc.2 freezes its built-in tool's explicit-choice list at session creation.
 * Keep that native delegation body, but route the plugin-owned selection through
 * start/startContinuable after validating it against today's catalog. The original
 * tool arguments remain in the durable log and all native dispatch guards run.
 */
import type { Context } from '@deepseek-ai/cordis'
import type { ToolDefinition } from '@deepseek-ai/dsh-tools'
import type { ModelSelectionConfig } from './shared.ts'
import { delegationSelection } from './delegation-selection.ts'

interface CatalogModel {
  id: string
  name: string
  reasoning?: { defaultEffort?: string; efforts: { id: string; name: string }[] }
}
interface CatalogRuntime {
  listProviders(): { id: string; name: string }[]
  listModels(provider: string): Promise<CatalogModel[]>
  resolveModelInfo(provider: string, model: string, signal?: AbortSignal): Promise<CatalogModel>
}
function catalog(ctx: Context): CatalogRuntime {
  const llm = ctx.get('llm') as CatalogRuntime | undefined
  if (!llm) throw new Error('The host model catalog is unavailable')
  return llm
}

/** No stale cache: model additions/removals apply to the next delegation. */
export async function assertCatalogRoute(ctx: Context, selection: ModelSelectionConfig): Promise<void> {
  const llm = catalog(ctx)
  if (!llm.listProviders().some(provider => provider.id === selection.provider)
    || !(await llm.listModels(selection.provider)).some(model => model.id === selection.model)) {
    throw new Error(`Model route ${selection.provider}/${selection.model} is not in the current model catalog`)
  }
}

export async function listCatalogModels(ctx: Context, args: unknown, signal: AbortSignal): Promise<string> {
  const request = args as { provider?: string; model?: string }
  const llm = catalog(ctx)
  if (request.model !== undefined && request.provider === undefined) throw new Error('`model` requires `provider`')
  if (request.provider === undefined) return llm.listProviders().map(p => `${p.id} — ${p.name}`).join('\n') || '(no LLM providers)'
  if (!llm.listProviders().some(p => p.id === request.provider)) throw new Error(`Unknown model provider: ${request.provider}`)
  const models = await llm.listModels(request.provider)
  signal.throwIfAborted()
  if (request.model === undefined) return models.map(m => `${request.provider}/${m.id} — ${m.name}`).join('\n') || '(no models)'
  await assertCatalogRoute(ctx, { provider: request.provider, model: request.model })
  const model = await llm.resolveModelInfo(request.provider, request.model, signal)
  signal.throwIfAborted()
  return `${request.provider}/${model.id} — ${model.name}\nReasoning efforts:\n${model.reasoning?.efforts.map(e => `${e.id}${e.id === model.reasoning?.defaultEffort ? ' (default)' : ''} — ${e.name}`).join('\n') || '(no advertised reasoning efforts)'}`
}

/** Adapt visible native tool bodies before assembly; restore them on unload. */
export function installSubagentCatalog(ctx: Context): void {
  ctx.inject(['tools'], scope => {
    const restorations = new WeakMap<ToolDefinition, { original: ToolDefinition['execute']; wrapped: ToolDefinition['execute'] }>()
    const definitions = new Set<WeakRef<ToolDefinition>>()
    const adapt = (definition: ToolDefinition | undefined): void => {
      if (!definition || restorations.has(definition)) return
      const original = definition.execute
      const wrapped: ToolDefinition['execute'] = definition.name === 'list_subagent_models'
        ? (args, exec) => listCatalogModels(scope, args, exec.signal)
        : async (args, exec) => {
          const request = args as Record<string, unknown>
          const { provider, model, reasoning_effort, ...nativeArgs } = request
          if (provider === undefined && model === undefined && reasoning_effort === undefined) return original.call(definition, args, exec)
          if (!exec.agent) throw new Error('A child model selection requires a parent agent')
          if ((provider === undefined) !== (model === undefined)) throw new Error('Child provider and model must be supplied together')
          for (const [key, value] of Object.entries({ provider, model, reasoning_effort })) {
            if (value !== undefined && (typeof value !== 'string' || value.length === 0)) throw new Error(`Child ${key} must be a non-empty string`)
          }
          exec.signal.throwIfAborted()
          return delegationSelection.run({
            parent: exec.agent,
            ...provider === undefined ? {} : { provider: provider as string, model: model as string },
            ...reasoning_effort === undefined ? {} : { reasoningEffort: reasoning_effort as string },
          }, () => original.call(definition, nativeArgs, exec))
        }
      definition.execute = wrapped
      restorations.set(definition, { original, wrapped })
      definitions.add(new WeakRef(definition))
    }
    scope.on('system-prompt/assemble', async (_assembly, context, next) => {
      if (context.agent) {
        // The Agent is the native registry's scope key. Do not register a
        // shadow tool or change its schema, outputs, provider, or restrictions.
        adapt(scope.tools.get('subagent', context.agent))
        adapt(scope.tools.get('list_subagent_models', context.agent))
      }
      return next()
    }, { prepend: true })
    scope.effect(() => () => {
      for (const reference of definitions) {
        const definition = reference.deref()
        const saved = definition && restorations.get(definition)
        if (definition && saved && definition.execute === saved.wrapped) definition.execute = saved.original
      }
      definitions.clear()
    }, 'model-dispatch: live catalog child selection')
  })
}

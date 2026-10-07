/** Validate and install the final child route before creating a child. */
import type { Context } from '@deepseek-ai/cordis'
import type { AgentOptions } from '@deepseek-ai/dsh-agent'
import type { SubagentRuntime } from '@deepseek-ai/dsh-subagent'
import { readRoute, resolveCustomSelection } from './config.ts'
import type { Config, ModelSelectionConfig } from './shared.ts'
import { mergeAgentOptions } from './merge.ts'
import type { RouteValidator } from './model-route.ts'
import type { SessionOverrideStore } from './session-overrides.ts'
import { delegationSelection } from './delegation-selection.ts'

export function installSubagentRouting(ctx: Context, current: () => Config, overrides: SessionOverrideStore, validate: RouteValidator): void {
  const selectionFor = (parent: unknown): ModelSelectionConfig | undefined => {
    const id = (parent as { id?: unknown } | undefined)?.id
    return (typeof id === 'string' ? overrides.get(id) : undefined)
      ?? resolveCustomSelection(readRoute(current().subagent))
  }
  const optionsFor = async (parent: unknown, requested: AgentOptions | undefined): Promise<AgentOptions | undefined> => {
    const selection = selectionFor(parent)
    const explicit = delegationSelection.getStore()
    const toolSelection = explicit?.parent === parent ? explicit : undefined
    if (!selection && !toolSelection) {
      if (readRoute(current().subagent)?.mode === 'custom') ctx.logger.warn('dsh-model-dispatch: subagent selection is incomplete; following parent')
      return undefined
    }
    const options = selection ? mergeAgentOptions(requested, selection) : { ...requested }
    if (toolSelection?.provider !== undefined) {
      options.provider = toolSelection.provider
      options.model = toolSelection.model
      // Effort belongs to a route. Selecting a new route without an effort
      // uses its adapter default, rather than a configured default's effort.
      delete options.reasoningEffort
    }
    if (toolSelection?.reasoningEffort !== undefined) options.reasoningEffort = toolSelection.reasoningEffort as AgentOptions['reasoningEffort']
    if (toolSelection && (options.provider === undefined || options.model === undefined)) {
      const agent = parent as { options?: AgentOptions; session?: { requestHeader(): { config: AgentOptions } | undefined } }
      const parentOptions = agent.session?.requestHeader()?.config ?? agent.options
      options.provider ??= parentOptions?.provider
      options.model ??= parentOptions?.model
    }
    if (toolSelection && (options.provider === undefined || options.model === undefined)) throw new Error('Cannot determine the effective child model route')
    // Validate AFTER explicit request options win, so an obsolete default does
    // not block a valid explicit route. Native inheritance handles omitted pairs.
    if (options.provider !== undefined && options.model !== undefined) {
      await validate({ provider: options.provider, model: options.model, ...options.reasoningEffort === undefined ? {} : { reasoningEffort: String(options.reasoningEffort) } })
    }
    return options
  }
  const runtime = ctx.subagents as SubagentRuntime
  ctx.effect(() => {
    const start = runtime.start
    const continuable = runtime.startContinuable
    const wrappedStart: typeof start = async (name, request) => {
      const agentOptions = await optionsFor(request.parent, request.agentOptions)
      return start.call(runtime, name, agentOptions === undefined ? request : { ...request, agentOptions })
    }
    const wrappedContinuable: typeof continuable = async spec => {
      const agentOptions = await optionsFor(spec.request.parent, spec.request.agentOptions)
      return continuable.call(runtime, agentOptions === undefined ? spec : { ...spec, request: { ...spec.request, agentOptions } })
    }
    runtime.start = wrappedStart
    runtime.startContinuable = wrappedContinuable
    return () => {
      if (runtime.start === wrappedStart) runtime.start = start
      if (runtime.startContinuable === wrappedContinuable) runtime.startContinuable = continuable
    }
  }, 'model-switch: validate and wrap subagent start')
}

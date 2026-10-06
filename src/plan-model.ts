/** Temporarily draft with the planning model; restore main BEFORE execution. */
import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-session-projection'
import type {} from '@deepseek-ai/dsh-api-session-controller'
import { readRoute, resolveCustomSelection } from './config.ts'
import { sameSelection, type Config, type ModelSelectionConfig } from './shared.ts'
import { PLAN_BOUNDARY_KEY, planBoundaryDefinition, type BoundaryState } from './plan-boundary.ts'

interface PlanModeFace { get(agent: Agent): { active: boolean; pending?: boolean } }
interface ProjectionFace {
  stateOf(session: object, key: string): unknown
  register(definition: typeof planBoundaryDefinition): unknown
}
interface PlanState { active: boolean; wanted?: boolean | null }
interface SelectionState { pending?: ModelSelectionConfig | null; lastUsed?: ModelSelectionConfig | null }
export interface PlanMainStore {
  get(id: string): ModelSelectionConfig | undefined
  set(id: string, selection: ModelSelectionConfig | undefined): Promise<void>
}

export function installPlanModelSwitch(ctx: Context, current: () => Config, mains: PlanMainStore): void {
  ctx.inject(['sessionProjections', 'sessionController'], (scope) => {
    const modes = new WeakMap<object, boolean>()
    const projections = scope.sessionProjections as unknown as ProjectionFace
    projections.register(planBoundaryDefinition)
    scope.on('agent/pre-step', async ({ agent, signal }, next) => {
      const decision = await next()
      if (decision.kind === 'reject' || signal.aborted) return decision
      const logged = projections.stateOf(agent.session, 'plan') as PlanState | undefined
      if (modes.has(agent.session) && logged !== undefined) modes.set(agent.session, logged.active)
      return decision
    }, { prepend: true })
    scope.on('system-prompt/assemble', async (_assembly, context, next) => {
      const agent = context.agent
      if (agent === undefined || agent.session.header.origin === 'subagent') return next()
      const session = agent.session
      const logged = projections.stateOf(session, 'plan') as PlanState | undefined
      if (logged === undefined) return next()
      const boundary = projections.stateOf(session, PLAN_BOUNDARY_KEY) as BoundaryState | undefined
      const mode = (scope.get('planMode') as PlanModeFace | undefined)?.get(agent)
      // An approved native tool result precedes plan/mode:false. A projection
      // sees that result even when the preset isolates its planMode service.
      const active = mode?.pending ?? (boundary?.approved ? false : mode?.active ?? logged.wanted ?? logged.active)
      const previous = modes.get(session)
      if (previous === active) return next()
      const entering = active && previous !== true
      const leaving = !active && (previous === true || logged.active || mains.get(agent.id) !== undefined)
      if (!entering && !leaving) { modes.set(session, active); return next() }
      const selection = projections.stateOf(session, 'modelSelection') as SelectionState | undefined
      const selected = selection?.pending ?? selection?.lastUsed
      let route: ModelSelectionConfig | undefined
      if (entering) {
        // Resume an active plan with its durable original selection, never
        // overwrite it with the temporary planning model after a restart.
        const recovering = previous === undefined && logged.active
        const original = recovering ? mains.get(agent.id) ?? boundary?.main ?? selected : selected
        const options = agent.options
        const fallback = typeof options.provider === 'string' && typeof options.model === 'string'
          ? { provider: options.provider, model: options.model, ...options.reasoningEffort === undefined ? {} : { reasoningEffort: options.reasoningEffort } }
          : undefined
        const main = original ?? fallback
        if (main === undefined) throw new Error('Cannot determine the main model before planning')
        // Persist before admitting any temporary model; write failure is retryable.
        await mains.set(agent.id, main)
        route = resolveCustomSelection(readRoute(current().planPlanning))
      } else {
        route = mains.get(agent.id) ?? boundary?.main
        if (route === undefined) throw new Error('Cannot restore the main model: no saved pre-plan selection')
      }
      context.signal?.throwIfAborted()
      if (route !== undefined && !sameSelection(route, selected)) {
        await scope.sessionController.selectModel({
          sessionId: agent.id, provider: route.provider, model: route.model,
          ...route.reasoningEffort === undefined ? {} : { reasoningEffort: route.reasoningEffort },
        })
      }
      if (leaving) await mains.set(agent.id, undefined)
      // Record only after admission succeeds; a failed restore must retry.
      modes.set(session, active)
      context.signal?.throwIfAborted()
      return next()
    }, { prepend: true })
  })
}

import { readRoute, resolveCustomSelection } from "./config.js";
import { sameSelection } from "./shared.js";
import { PLAN_BOUNDARY_KEY, planBoundaryDefinition } from "./plan-boundary.js";
export function installPlanModelSwitch(ctx, current, mains) {
    ctx.inject(['sessionProjections', 'sessionController'], (scope) => {
        const modes = new WeakMap();
        const approvals = new WeakSet();
        const projections = scope.sessionProjections;
        projections.register(planBoundaryDefinition);
        // The canonical outcome is independent of translated/rendered tool copy.
        // In 0.2.1 dismissing a review succeeds with approved:false and ends the
        // turn, so success alone must never restore the main model.
        scope.on('tools/result', (exec, result) => {
            if (exec.name !== 'exit_plan_mode' || !exec.agent || result.isError)
                return;
            const value = result.value;
            if (typeof value === 'object' && value !== null && !Array.isArray(value) && value.approved === true)
                approvals.add(exec.agent.session);
        });
        scope.on('session/event', (session, event) => {
            // A fresh planning intent supersedes an approval received just before
            // the next request. Do not let that earlier approval end the new plan.
            if ((event.type === 'command/run' && event.data.name === 'plan' && event.data.args?.trim() !== 'off')
                || (event.type === 'plan/mode' && event.data.active))
                approvals.delete(session);
        }, { global: true });
        scope.on('agent/pre-step', async ({ agent, signal }, next) => {
            const decision = await next();
            if (decision.kind === 'reject' || signal.aborted)
                return decision;
            const logged = projections.stateOf(agent.session, 'plan');
            if (modes.has(agent.session) && logged !== undefined)
                modes.set(agent.session, logged.active);
            return decision;
        }, { prepend: true });
        scope.on('system-prompt/assemble', async (_assembly, context, next) => {
            const agent = context.agent;
            if (agent === undefined || agent.session.header.origin === 'subagent')
                return next();
            const session = agent.session;
            const logged = projections.stateOf(session, 'plan');
            if (logged === undefined)
                return next();
            await mains.ready?.();
            const boundary = projections.stateOf(session, PLAN_BOUNDARY_KEY);
            const mode = scope.get('planMode')?.get(agent);
            // An approved native tool result precedes plan/mode:false. A projection
            // sees that result even when the preset isolates its planMode service.
            const approved = approvals.has(session) || boundary?.approved === true;
            const active = mode?.pending ?? (approved ? false : mode?.active ?? logged.wanted ?? logged.active);
            const previous = modes.get(session);
            if (previous === active)
                return next();
            const entering = active && previous !== true;
            const leaving = !active && (previous === true || logged.active || mains.get(agent.id) !== undefined);
            if (!entering && !leaving) {
                modes.set(session, active);
                return next();
            }
            const selection = projections.stateOf(session, 'modelSelection');
            const selected = selection?.pending ?? selection?.lastUsed;
            let route;
            if (entering) {
                // Resume an active plan with its durable original selection, never
                // overwrite it with the temporary planning model after a restart.
                const recovering = previous === undefined && logged.active;
                const original = recovering ? mains.get(agent.id) ?? boundary?.main ?? selected : selected;
                const options = agent.options;
                const fallback = typeof options.provider === 'string' && typeof options.model === 'string'
                    ? { provider: options.provider, model: options.model, ...options.reasoningEffort === undefined ? {} : { reasoningEffort: options.reasoningEffort } }
                    : undefined;
                const main = original ?? fallback;
                if (main === undefined)
                    throw new Error('Cannot determine the main model before planning');
                // Persist before admitting any temporary model; write failure is retryable.
                await mains.set(agent.id, main);
                route = resolveCustomSelection(readRoute(current().planPlanning));
            }
            else {
                route = mains.get(agent.id) ?? boundary?.main;
                if (route === undefined)
                    throw new Error('Cannot restore the main model: no saved pre-plan selection');
            }
            context.signal?.throwIfAborted();
            if (route !== undefined && !sameSelection(route, selected)) {
                await scope.sessionController.selectModel({
                    sessionId: agent.id, provider: route.provider, model: route.model,
                    ...route.reasoningEffort === undefined ? {} : { reasoningEffort: route.reasoningEffort },
                });
            }
            if (leaving) {
                await mains.set(agent.id, undefined);
                approvals.delete(session);
            }
            // Record only after admission succeeds; a failed restore must retry.
            modes.set(session, active);
            context.signal?.throwIfAborted();
            return next();
        }, { prepend: true });
    });
}

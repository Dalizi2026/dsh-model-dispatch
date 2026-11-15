import { readRoute, resolveCustomSelection } from "./config.js";
import { sameSelection } from "./shared.js";
import { PLAN_BOUNDARY_KEY, planBoundaryDefinition } from "./plan-boundary.js";
import { PLAN_APPROVED_SEAM } from "./host-seams.js";
/** The canonical review outcome, or undefined when the result has no boolean `approved`. */
function approvalOf(value) {
    if (typeof value !== 'object' || value === null || Array.isArray(value))
        return undefined;
    const approved = value.approved;
    return typeof approved === 'boolean' ? approved : undefined;
}
/**
 * `agentDefaultModel` is required with the controller: without the default
 * protection the native selection would save the planning model as the
 * new-chat default, so the switch stays off whenever that protection is.
 *
 * Hosts differ in when a step's route is fixed: DSH 0.2.1 reads it during
 * prompt assembly, DSH 0.2.2 before it. So the switch also runs when the
 * intent happens, inside `/plan` and an approved exit tool call, which both
 * hosts await before the next step. Assembly remains the fallback for
 * recovery and for hosts without those optional seams.
 */
export function installPlanModelSwitch(ctx, current, mains, seams) {
    ctx.inject(['sessionProjections', 'sessionController', 'agentDefaultModel'], (scope) => {
        const modes = new WeakMap();
        const approvals = new WeakSet();
        const projections = scope.sessionProjections;
        if (typeof projections.register === 'function')
            projections.register(planBoundaryDefinition);
        // The canonical outcome is independent of translated/rendered tool copy.
        // In 0.2.1 dismissing a review succeeds with approved:false and ends the
        // turn, so success alone must never restore the main model. Without a
        // boolean value, restoration waits for the plan-mode exit instead.
        scope.on('tools/result', (exec, result) => {
            if (exec.name !== 'exit_plan_mode' || !exec.agent || result.isError)
                return;
            const approved = approvalOf(result.value);
            seams.observe('plan-switch', PLAN_APPROVED_SEAM, approved !== undefined);
            if (approved === true)
                approvals.add(exec.agent.session);
        });
        scope.on('session/event', (session, event) => {
            // A fresh planning intent supersedes an approval received just before
            // the next request. Do not let that earlier approval end the new plan.
            if ((event.type === 'command/run' && event.data.name === 'plan' && event.data.args?.trim() !== 'off')
                || (event.type === 'plan/mode' && event.data.active))
                approvals.delete(session);
        }, { global: true });
        // modes tracks the route transition we applied, not the native projection.
        // A pre-step may already observe plan/mode:false before this runs.
        const apply = async (agent, signal) => {
            if (agent.session.header.origin === 'subagent')
                return;
            // Switched off, not paused: the chat continues on its current model and
            // a pending transition is applied once the seams return.
            if (seams.check('plan-switch').missing.length)
                return;
            const session = agent.session;
            const logged = projections.stateOf(session, 'plan');
            if (logged === undefined)
                return;
            await mains.ready?.();
            const boundary = projections.stateOf(session, PLAN_BOUNDARY_KEY);
            const mode = scope.get('planMode')?.get(agent);
            // An approved native tool result precedes plan/mode:false. A projection
            // sees that result even when the preset isolates its planMode service.
            const approved = approvals.has(session) || boundary?.approved === true;
            const active = mode?.pending ?? (approved ? false : mode?.active ?? logged.wanted ?? logged.active);
            const previous = modes.get(session);
            if (previous === active && (active || mains.get(agent.id) === undefined))
                return;
            const entering = active && previous !== true;
            const leaving = !active && (previous === true || logged.active || mains.get(agent.id) !== undefined);
            if (!entering && !leaving) {
                modes.set(session, active);
                return;
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
            signal?.throwIfAborted();
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
        };
        // One transition at a time per session: a command, the exit tool and an
        // assembly may overlap, and each must see the previous one's result.
        const queue = new WeakMap();
        const sync = (agent, signal) => {
            const settled = (queue.get(agent.session) ?? Promise.resolve()).catch(() => { });
            const run = settled.then(() => apply(agent, signal));
            queue.set(agent.session, run);
            return run;
        };
        // At an intent the switch is an early start: a failure is logged and the
        // next assembly retries it, where an error reaches the request as before.
        const early = async (agent) => {
            try {
                await sync(agent);
            }
            catch (cause) {
                scope.logger?.warn('Model switch: plan model switch will retry at the next request', cause);
            }
        };
        // Optional seam `commands.execute`: /plan and /plan off commit or queue
        // the plan state, then switch before the caller sends the next message.
        scope.inject(['commands'], command => {
            const commands = command.commands;
            command.effect(() => {
                const execute = commands.execute;
                if (typeof execute !== 'function')
                    return () => { };
                const wrapped = async (agent, line, ...rest) => {
                    const result = await execute.call(commands, agent, line, ...rest);
                    if (typeof line === 'string' && /^\/plan(?:\s|$)/.test(line.trim()))
                        await early(agent);
                    return result;
                };
                commands.execute = wrapped;
                return () => { if (commands.execute === wrapped)
                    commands.execute = execute; };
            }, 'model-switch: plan switch at /plan');
        });
        // Optional seam `tools.get`: the exit tool is adapted once it is visible
        // to an agent, so an approval restores main before the next step.
        const exitTools = new WeakMap();
        const adapted = new Set();
        const adaptExitTool = (agent) => {
            const tools = scope.get('tools');
            const definition = typeof tools?.get === 'function' ? tools.get('exit_plan_mode', agent) : undefined;
            if (!definition || typeof definition.execute !== 'function' || exitTools.has(definition))
                return;
            const original = definition.execute;
            const wrapped = async (args, exec) => {
                const value = await original.call(definition, args, exec);
                if (exec?.agent && approvalOf(value) === true) {
                    approvals.add(exec.agent.session);
                    await early(exec.agent);
                }
                return value;
            };
            definition.execute = wrapped;
            exitTools.set(definition, { original, wrapped });
            adapted.add(new WeakRef(definition));
        };
        scope.effect(() => () => {
            for (const reference of adapted) {
                const definition = reference.deref();
                const saved = definition && exitTools.get(definition);
                if (definition && saved && definition.execute === saved.wrapped)
                    definition.execute = saved.original;
            }
            adapted.clear();
        }, 'model-switch: plan switch at approval');
        scope.on('system-prompt/assemble', async (_assembly, context, next) => {
            const agent = context.agent;
            if (agent === undefined || agent.session.header.origin === 'subagent')
                return next();
            await sync(agent, context.signal);
            adaptExitTool(agent);
            context.signal?.throwIfAborted();
            return next();
        }, { prepend: true });
    });
}

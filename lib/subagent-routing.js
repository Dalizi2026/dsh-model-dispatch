import { readRoute, resolveCustomSelection } from "./config.js";
import { mergeAgentOptions } from "./merge.js";
import { delegationSelection } from "./delegation-selection.js";
export function installSubagentRouting(ctx, current, overrides, validate) {
    const selectionFor = (parent) => {
        const id = parent?.id;
        return (typeof id === 'string' ? overrides.get(id) : undefined)
            ?? resolveCustomSelection(readRoute(current().subagent));
    };
    const optionsFor = async (parent, requested) => {
        const selection = selectionFor(parent);
        const explicit = delegationSelection.getStore();
        const toolSelection = explicit?.parent === parent ? explicit : undefined;
        if (!selection && !toolSelection) {
            if (readRoute(current().subagent)?.mode === 'custom')
                ctx.logger.warn('dsh-model-dispatch: subagent selection is incomplete; following parent');
            return undefined;
        }
        const options = selection ? mergeAgentOptions(requested, selection) : { ...requested };
        if (toolSelection?.provider !== undefined) {
            options.provider = toolSelection.provider;
            options.model = toolSelection.model;
            // Effort belongs to a route. Selecting a new route without an effort
            // uses its adapter default, rather than a configured default's effort.
            delete options.reasoningEffort;
        }
        if (toolSelection?.reasoningEffort !== undefined)
            options.reasoningEffort = toolSelection.reasoningEffort;
        if (toolSelection && (options.provider === undefined || options.model === undefined)) {
            const agent = parent;
            const parentOptions = agent.session?.requestHeader()?.config ?? agent.options;
            options.provider ??= parentOptions?.provider;
            options.model ??= parentOptions?.model;
        }
        if (toolSelection && (options.provider === undefined || options.model === undefined))
            throw new Error('Cannot determine the effective child model route');
        // Validate AFTER explicit request options win, so an obsolete default does
        // not block a valid explicit route. Native inheritance handles omitted pairs.
        if (options.provider !== undefined && options.model !== undefined) {
            await validate({ provider: options.provider, model: options.model, ...options.reasoningEffort === undefined ? {} : { reasoningEffort: String(options.reasoningEffort) } });
        }
        return options;
    };
    const runtime = ctx.subagents;
    ctx.effect(() => {
        const restorations = [];
        const withRoute = async (request) => {
            const agentOptions = await optionsFor(request.parent, request.agentOptions);
            return agentOptions === undefined ? request : { ...request, agentOptions };
        };
        for (const key of ['startActivation', 'startContinuable']) {
            const original = runtime[key];
            if (typeof original !== 'function')
                continue;
            const wrapped = async (spec) => original.call(runtime, { ...spec, request: await withRoute(spec.request) });
            runtime[key] = wrapped;
            restorations.push(() => { if (runtime[key] === wrapped)
                runtime[key] = original; });
        }
        const start = runtime.start;
        if (typeof start === 'function') {
            const wrapped = async (name, request) => start.call(runtime, name, await withRoute(request));
            runtime.start = wrapped;
            restorations.push(() => { if (runtime.start === wrapped)
                runtime.start = start; });
        }
        if (restorations.length === 0)
            throw new Error('Unsupported DSH subagent runtime: no activation or legacy start API');
        return () => {
            for (const restore of restorations.reverse())
                restore();
        };
    }, 'model-switch: validate and wrap subagent start');
}

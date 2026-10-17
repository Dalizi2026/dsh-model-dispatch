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
        // Wrap every entry point this host exposes: start/startContinuable on 0.2.0
        // hosts, startActivation on 0.2.1 and later. Wrapping a missing method is a
        // no-op, so the same code covers both releases.
        const restores = [];
        const wrapSpec = (method) => {
            const original = runtime[method];
            if (typeof original !== 'function')
                return;
            const wrapped = async (spec) => {
                const request = spec?.request;
                const agentOptions = await optionsFor(request?.parent, request?.agentOptions);
                return original.call(runtime, agentOptions === undefined ? spec : { ...spec, request: { ...request, agentOptions } });
            };
            runtime[method] = wrapped;
            restores.push(() => { if (runtime[method] === wrapped)
                runtime[method] = original; });
        };
        const wrapStart = () => {
            const original = runtime.start;
            if (typeof original !== 'function')
                return;
            const wrapped = async (name, request) => {
                const agentOptions = await optionsFor(request?.parent, request?.agentOptions);
                return original.call(runtime, name, agentOptions === undefined ? request : { ...request, agentOptions });
            };
            runtime.start = wrapped;
            restores.push(() => { if (runtime.start === wrapped)
                runtime.start = original; });
        };
        wrapSpec('startActivation');
        wrapSpec('startContinuable');
        wrapStart();
        return () => { for (const restore of restores)
            restore(); };
    }, 'model-switch: validate and wrap subagent start');
}

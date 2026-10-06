import { readRoute, resolveCustomSelection } from "./config.js";
import { mergeAgentOptions } from "./merge.js";
export function installSubagentRouting(ctx, current, overrides, validate) {
    const selectionFor = (parent) => {
        const id = parent?.id;
        return (typeof id === 'string' ? overrides.get(id) : undefined)
            ?? resolveCustomSelection(readRoute(current().subagent));
    };
    const optionsFor = async (parent, requested) => {
        const selection = selectionFor(parent);
        if (!selection) {
            if (readRoute(current().subagent)?.mode === 'custom')
                ctx.logger.warn('dsh-model-dispatch: subagent selection is incomplete; following parent');
            return undefined;
        }
        const options = mergeAgentOptions(requested, selection);
        // Validate AFTER explicit request options win, so an obsolete default does
        // not block a valid explicit route. Native inheritance handles omitted pairs.
        if (options.provider !== undefined && options.model !== undefined) {
            await validate({ provider: options.provider, model: options.model, ...options.reasoningEffort === undefined ? {} : { reasoningEffort: String(options.reasoningEffort) } });
        }
        return options;
    };
    const runtime = ctx.subagents;
    ctx.effect(() => {
        const start = runtime.start;
        const continuable = runtime.startContinuable;
        const wrappedStart = async (name, request) => {
            const agentOptions = await optionsFor(request.parent, request.agentOptions);
            return start.call(runtime, name, agentOptions === undefined ? request : { ...request, agentOptions });
        };
        const wrappedContinuable = async (spec) => {
            const agentOptions = await optionsFor(spec.request.parent, spec.request.agentOptions);
            return continuable.call(runtime, agentOptions === undefined ? spec : { ...spec, request: { ...spec.request, agentOptions } });
        };
        runtime.start = wrappedStart;
        runtime.startContinuable = wrappedContinuable;
        return () => {
            if (runtime.start === wrappedStart)
                runtime.start = start;
            if (runtime.startContinuable === wrappedContinuable)
                runtime.startContinuable = continuable;
        };
    }, 'model-switch: validate and wrap subagent start');
}

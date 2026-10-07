import { delegationSelection } from "./delegation-selection.js";
function catalog(ctx) {
    const llm = ctx.get('llm');
    if (!llm)
        throw new Error('The host model catalog is unavailable');
    return llm;
}
/** No stale cache: model additions/removals apply to the next delegation. */
export async function assertCatalogRoute(ctx, selection) {
    const llm = catalog(ctx);
    if (!llm.listProviders().some(provider => provider.id === selection.provider)
        || !(await llm.listModels(selection.provider)).some(model => model.id === selection.model)) {
        throw new Error(`Model route ${selection.provider}/${selection.model} is not in the current model catalog`);
    }
}
export async function listCatalogModels(ctx, args, signal) {
    const request = args;
    const llm = catalog(ctx);
    if (request.model !== undefined && request.provider === undefined)
        throw new Error('`model` requires `provider`');
    if (request.provider === undefined)
        return llm.listProviders().map(p => `${p.id} — ${p.name}`).join('\n') || '(no LLM providers)';
    if (!llm.listProviders().some(p => p.id === request.provider))
        throw new Error(`Unknown model provider: ${request.provider}`);
    const models = await llm.listModels(request.provider);
    signal.throwIfAborted();
    if (request.model === undefined)
        return models.map(m => `${request.provider}/${m.id} — ${m.name}`).join('\n') || '(no models)';
    await assertCatalogRoute(ctx, { provider: request.provider, model: request.model });
    const model = await llm.resolveModelInfo(request.provider, request.model, signal);
    signal.throwIfAborted();
    return `${request.provider}/${model.id} — ${model.name}\nReasoning efforts:\n${model.reasoning?.efforts.map(e => `${e.id}${e.id === model.reasoning?.defaultEffort ? ' (default)' : ''} — ${e.name}`).join('\n') || '(no advertised reasoning efforts)'}`;
}
/** Adapt visible native tool bodies before assembly; restore them on unload. */
export function installSubagentCatalog(ctx) {
    ctx.inject(['tools'], scope => {
        const restorations = new WeakMap();
        const definitions = new Set();
        const adapt = (definition) => {
            if (!definition || restorations.has(definition))
                return;
            const original = definition.execute;
            const wrapped = definition.name === 'list_subagent_models'
                ? (args, exec) => listCatalogModels(scope, args, exec.signal)
                : async (args, exec) => {
                    const request = args;
                    const { provider, model, reasoning_effort, ...nativeArgs } = request;
                    if (provider === undefined && model === undefined && reasoning_effort === undefined)
                        return original.call(definition, args, exec);
                    if (!exec.agent)
                        throw new Error('A child model selection requires a parent agent');
                    if ((provider === undefined) !== (model === undefined))
                        throw new Error('Child provider and model must be supplied together');
                    for (const [key, value] of Object.entries({ provider, model, reasoning_effort })) {
                        if (value !== undefined && (typeof value !== 'string' || value.length === 0))
                            throw new Error(`Child ${key} must be a non-empty string`);
                    }
                    exec.signal.throwIfAborted();
                    return delegationSelection.run({
                        parent: exec.agent,
                        ...provider === undefined ? {} : { provider: provider, model: model },
                        ...reasoning_effort === undefined ? {} : { reasoningEffort: reasoning_effort },
                    }, () => original.call(definition, nativeArgs, exec));
                };
            definition.execute = wrapped;
            restorations.set(definition, { original, wrapped });
            definitions.add(new WeakRef(definition));
        };
        scope.on('system-prompt/assemble', async (_assembly, context, next) => {
            if (context.agent) {
                // The Agent is the native registry's scope key. Do not register a
                // shadow tool or change its schema, outputs, provider, or restrictions.
                adapt(scope.tools.get('subagent', context.agent));
                adapt(scope.tools.get('list_subagent_models', context.agent));
            }
            return next();
        }, { prepend: true });
        scope.effect(() => () => {
            for (const reference of definitions) {
                const definition = reference.deref();
                const saved = definition && restorations.get(definition);
                if (definition && saved && definition.execute === saved.wrapped)
                    definition.execute = saved.original;
            }
            definitions.clear();
        }, 'model-dispatch: live catalog child selection');
    });
}

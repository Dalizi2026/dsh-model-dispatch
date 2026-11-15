function isChildRequest(value) {
    const parent = value?.parent;
    return typeof parent === 'object' && parent !== null && typeof parent.id === 'string';
}
/**
 * Installs whenever the host provides `subagents`, so the plugin itself never
 * waits on it. Missing start entries are reported by the model-lock seam check,
 * which pauses delegation until the host provides them; so is a start request
 * whose parent agent cannot be read.
 */
export function installSubagentRouting(ctx, authority) {
    ctx.inject(['subagents'], scope => {
        const runtime = scope.subagents;
        scope.effect(() => {
            const restore = [];
            for (const key of ['startActivation', 'startContinuable']) {
                const original = runtime[key];
                if (typeof original !== 'function')
                    continue;
                const wrapped = async (spec) => {
                    const nested = isChildRequest(spec?.request) ? spec.request : undefined;
                    const request = nested ?? (isChildRequest(spec) ? spec : undefined);
                    authority.admitStart(request !== undefined);
                    return authority.delegate(spec.provider, request.parent, request.agentOptions, agentOptions => original.call(runtime, nested ? { ...spec, request: { ...nested, agentOptions } } : { ...spec, agentOptions }));
                };
                runtime[key] = wrapped;
                restore.push(() => { if (runtime[key] === wrapped)
                    runtime[key] = original; });
            }
            const original = runtime.start;
            if (typeof original === 'function') {
                const wrapped = async (name, request) => {
                    authority.admitStart(isChildRequest(request));
                    return authority.delegate(name, request.parent, request.agentOptions, agentOptions => original.call(runtime, name, { ...request, agentOptions }));
                };
                runtime.start = wrapped;
                restore.push(() => { if (runtime.start === wrapped)
                    runtime.start = original; });
            }
            return () => { for (const dispose of restore.reverse())
                dispose(); };
        }, 'model-switch: enforce user routing at every native start');
    });
}

/**
 * Installs whenever the host provides `subagents`, so the plugin itself never
 * waits on it. Missing start entries are reported by the model-lock seam check,
 * which pauses delegation until the host provides them.
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
                const wrapped = spec => authority.delegate(spec.provider, spec.request.parent, spec.request.agentOptions, agentOptions => original.call(runtime, { ...spec, request: { ...spec.request, agentOptions } }));
                runtime[key] = wrapped;
                restore.push(() => { if (runtime[key] === wrapped)
                    runtime[key] = original; });
            }
            const original = runtime.start;
            if (typeof original === 'function') {
                const wrapped = (name, request) => authority.delegate(name, request.parent, request.agentOptions, agentOptions => original.call(runtime, name, { ...request, agentOptions }));
                runtime.start = wrapped;
                restore.push(() => { if (runtime.start === wrapped)
                    runtime.start = original; });
            }
            return () => { for (const dispose of restore.reverse())
                dispose(); };
        }, 'model-switch: enforce user routing at every native start');
    });
}

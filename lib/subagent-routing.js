/** Read parent and requested options from whichever spec shape this host uses. */
function childRequest(spec) {
    return spec.request === undefined
        ? { parent: spec.parent, agentOptions: spec.agentOptions }
        : { parent: spec.request.parent, agentOptions: spec.request.agentOptions };
}
/** Rebuild the spec in the same shape the host produced, so 0.2.2 never sees a stray `request`. */
function withChildOptions(spec, agentOptions) {
    return spec.request === undefined
        ? { ...spec, agentOptions }
        : { ...spec, request: { ...spec.request, agentOptions } };
}
export function installSubagentRouting(ctx, authority) {
    const runtime = ctx.subagents;
    ctx.effect(() => {
        const restore = [];
        for (const key of ['startActivation', 'startContinuable']) {
            const original = runtime[key];
            if (typeof original !== 'function')
                continue;
            const wrapped = spec => {
                const request = childRequest(spec);
                return authority.delegate(spec.provider, request.parent, request.agentOptions, agentOptions => original.call(runtime, withChildOptions(spec, agentOptions)));
            };
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
        if (!restore.length)
            authority.fail(new Error('Unsupported DSH subagent startup API; delegation is blocked'));
        return () => { for (const dispose of restore.reverse())
            dispose(); };
    }, 'model-switch: enforce user routing at every native start');
}

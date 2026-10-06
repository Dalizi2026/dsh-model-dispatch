export function modelRouteValidator(ctx) {
    return async (selection) => {
        const llm = ctx.get('llm');
        if (!llm)
            throw new Error('Model route validation is unavailable: the host LLM service is missing');
        try {
            // Exact adapter resolution also checks explicit reasoning effort. Do not
            // infer aliases from matching model names or materialize defaults in storage.
            await llm.resolveCallConfig(selection);
        }
        catch (cause) {
            const reason = cause instanceof Error ? cause.message : String(cause);
            throw new Error(`Invalid model route ${selection.provider}/${selection.model}: ${reason}`, { cause });
        }
    };
}

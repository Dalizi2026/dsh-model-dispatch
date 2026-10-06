/**
 * Per-session subagent-model overrides + HTTP readout.
 *
 * The composer picker writes one session's override; the subagent-start wrap
 * reads it back at delegation time (session override > settings default).
 * Overrides live in memory and persist to a JSON file under the DSH home so a
 * thread's pick survives host restarts.
 */
import type { Context } from '@deepseek-ai/cordis';
import { SESSION_OVERRIDES_ROUTE } from './label.ts';
import type { ModelSelectionConfig } from './shared.ts';
import type { RouteValidator } from './model-route.ts';
export { SESSION_OVERRIDES_ROUTE };
/** In-memory + on-disk map of sessionId → subagent selection. */
export declare class SessionOverrideStore {
    private readonly values;
    private readonly path;
    constructor(filename?: string);
    private loading;
    private writing;
    get(sessionId: string): ModelSelectionConfig | undefined;
    snapshot(): Record<string, ModelSelectionConfig>;
    /** Both host activation and HTTP reads wait for this shared initialization. */
    ready(): Promise<void>;
    set(sessionId: string, selection: ModelSelectionConfig | undefined): Promise<void>;
    private load;
    private writeOnce;
}
/**
 * Mount GET/POST session-overrides when a web server is available.
 * @param ctx - host context.
 * @param store - override map.
 */
export declare function installSessionOverridesHttp(ctx: Context, store: SessionOverrideStore, validate?: RouteValidator): void;

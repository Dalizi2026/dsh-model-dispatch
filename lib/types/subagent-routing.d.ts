/** Wrap only real host entry points; the authority owns every model field. */
import type { Context } from '@deepseek-ai/cordis';
import type { RouteEnforcer } from './route-enforcer.ts';
/**
 * Installs whenever the host provides `subagents`, so the plugin itself never
 * waits on it. Missing start entries are reported by the model-lock seam check,
 * which pauses delegation until the host provides them.
 */
export declare function installSubagentRouting(ctx: Context, authority: RouteEnforcer): void;

/** Wrap only real host entry points; the authority owns every model field. */
import type { Context } from '@deepseek-ai/cordis';
import type { RouteEnforcer } from './route-enforcer.ts';
export declare function installSubagentRouting(ctx: Context, authority: RouteEnforcer): void;

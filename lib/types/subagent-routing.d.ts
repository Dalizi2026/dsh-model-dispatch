/** Validate and install the final child route before creating a child. */
import type { Context } from '@deepseek-ai/cordis';
import type { Config } from './shared.ts';
import type { RouteValidator } from './model-route.ts';
import type { SessionOverrideStore } from './session-overrides.ts';
export declare function installSubagentRouting(ctx: Context, current: () => Config, overrides: SessionOverrideStore, validate: RouteValidator): void;

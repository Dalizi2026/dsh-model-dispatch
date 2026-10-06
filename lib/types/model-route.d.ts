/** Validate the exact provider/model/effort through the host's owning adapter. */
import type { Context } from '@deepseek-ai/cordis';
import type { ModelSelectionConfig } from './shared.ts';
export type RouteValidator = (selection: ModelSelectionConfig) => Promise<void>;
export declare function modelRouteValidator(ctx: Context): RouteValidator;

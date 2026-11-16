/** Validate the exact provider/model/effort through the host's owning adapter. */
import type { Context } from '@deepseek-ai/cordis';
import type { ModelSelectionConfig } from './shared.ts';
export type RouteValidator = (selection: ModelSelectionConfig) => Promise<void>;
export declare function modelRouteResolver(ctx: Context): (selection: ModelSelectionConfig) => Promise<ModelSelectionConfig>;
export declare function modelRouteValidator(ctx: Context): RouteValidator;

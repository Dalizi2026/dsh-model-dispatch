/** Use the live configured catalog as the user's child-model selection authority.
 * rc.2 freezes its built-in tool's explicit-choice list at session creation.
 * Keep that native delegation body, but route the plugin-owned selection through
 * start/startContinuable after validating it against today's catalog. The original
 * tool arguments remain in the durable log and all native dispatch guards run.
 */
import type { Context } from '@deepseek-ai/cordis';
import type { ModelSelectionConfig } from './shared.ts';
/** No stale cache: model additions/removals apply to the next delegation. */
export declare function assertCatalogRoute(ctx: Context, selection: ModelSelectionConfig): Promise<void>;
export declare function listCatalogModels(ctx: Context, args: unknown, signal: AbortSignal): Promise<string>;
/** Adapt visible native tool bodies before assembly; restore them on unload. */
export declare function installSubagentCatalog(ctx: Context): void;

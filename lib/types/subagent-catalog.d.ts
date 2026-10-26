/** Human menus use the live catalog. Model tools report only the user route.
 * Preserve native tool schemas/lifecycle and discard conflicting machine choices
 * before native allowlist validation; every start still passes the authority.
 */
import type { Context } from '@deepseek-ai/cordis';
import type { ToolDefinition } from '@deepseek-ai/dsh-tools';
import type { ModelSelectionConfig } from './shared.ts';
import type { RouteEnforcer } from './route-enforcer.ts';
/** No stale cache: model additions/removals apply to the next delegation. */
export declare function assertCatalogRoute(ctx: Context, selection: ModelSelectionConfig): Promise<void>;
export declare function listCatalogModels(ctx: Context, args: unknown, signal: AbortSignal): Promise<string>;
/** Adapt visible native tool bodies before assembly; restore them on unload. */
export declare function installSubagentCatalog(ctx: Context, authority: RouteEnforcer): void;
/** Native delegation's canonical output identifies aliases without matching prose. */
export declare function isDelegationTool(definition: ToolDefinition): boolean;

/**
 * Browser half of dsh-model-dispatch: settings, plan-review, subagent model badges.
 */
import type { Context } from '@deepseek-ai/cordis';
import { type LocaleKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        'model-switch': LocaleKey;
        /** Reuse stock ui-subagent dictionaries when replacing the catalog seat. */
        'subagent': string;
    }
}
/**
 * Base client seams: every entry renders localized text into a slot. Each
 * entry injects any further service it needs, so a missing service removes
 * only that entry and the native DSH entry stays (ADR 0001). The host half
 * enforces the model lock regardless of what the client shows.
 */
export declare const inject: string[];
export declare function apply(ctx: Context): void;

/** Impact first, then the likely cause, then the exact seam names to quote in an issue. */
import type { CapabilityId, CapabilityReport } from '../route-contract.ts';
import type { LocaleKey } from './locales.ts';
/** Host capabilities plus UI entries the client checks itself. */
export type UiCapability = CapabilityId | 'chat-controls' | 'subagent-catalog';
export interface UiCapabilityReport extends Omit<CapabilityReport, 'capability'> {
    capability: UiCapability;
}
/** Whether the model lock is paused, so a raw host error would repeat this notice. */
export declare function lockPaused(reports: readonly UiCapabilityReport[] | undefined): boolean;
export declare function SeamNotice({ reports, t, className }: {
    reports: readonly UiCapabilityReport[];
    t: (key: LocaleKey) => string;
    className?: string;
}): import("react").JSX.Element | null;

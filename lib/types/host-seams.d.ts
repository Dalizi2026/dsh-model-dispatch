/**
 * Host seams each capability depends on, checked when the capability is used
 * or when someone asks. Nothing is polled or cached: only the last logged
 * result per capability and observed event-shape mismatches stay in memory.
 * A service method a capability cannot run safely without belongs in
 * REQUIREMENTS; optional seams are checked at their call site instead.
 */
import type { Context } from '@deepseek-ai/cordis';
import type { CapabilityId, CapabilityReport } from './route-contract.ts';
/** Event data observed at runtime; a mismatch keeps the capability on its conservative path. */
export declare const COMPACTION_ID_SEAM = "session/event compaction/start data.compactionId";
export declare const PLAN_APPROVED_SEAM = "tools/result exit_plan_mode value.approved";
export declare function degraded(report: CapabilityReport): boolean;
/** The request-boundary error while the model lock cannot take effect. */
export declare function lockPausedMessage(missing: readonly string[]): string;
export declare class HostSeams {
    private ctx;
    private mismatches;
    private logged;
    constructor(ctx: Context);
    /** Check one capability against the live host now. */
    check(capability: CapabilityId): CapabilityReport;
    /** Every degraded capability, checked now. */
    report(): CapabilityReport[];
    /** Record whether the latest event carried the data shape a capability relies on. */
    observe(capability: CapabilityId, seam: string, matched: boolean): void;
    private has;
    /** One host log line per change, never one per check. */
    private log;
}

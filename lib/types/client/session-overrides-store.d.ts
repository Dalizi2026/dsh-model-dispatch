/**
 * Client mirror of the host per-session subagent-model override map.
 *
 * Reads and writes ride the plugin's loopback HTTP routes; the map is small
 * (one entry per overridden session) so a refresh-on-open + poll store keeps
 * the composer picker honest.
 */
import type { ModelSelectionConfig } from '../shared.ts';
export type SessionOverrideMap = Readonly<Record<string, ModelSelectionConfig>>;
interface Snapshot {
    value: SessionOverrideMap;
    error: string | null;
    /** Set once the host route is known missing (host half older than the client). */
    unavailable: boolean;
    version: number;
}
/** Poll-backed store keyed by session id. */
export declare class SessionOverrideStore {
    private snap;
    private readonly listeners;
    private timer;
    private refs;
    private refreshing;
    private writeRevision;
    private writing;
    subscribe: (listener: () => void) => (() => void);
    getSnapshot: () => Snapshot;
    start(intervalMs?: number): void;
    stop(): void;
    /** Override for one session, from the latest snapshot. */
    get(sessionId: string): ModelSelectionConfig | undefined;
    /** Whether the host route is missing (host half predates the client). */
    get unavailable(): boolean;
    /** Write one session's override; `undefined` clears it. */
    set(sessionId: string, selection: ModelSelectionConfig | undefined): Promise<void>;
    private write;
    refresh(): Promise<void>;
    private fetchSnapshot;
    private emit;
}
export {};

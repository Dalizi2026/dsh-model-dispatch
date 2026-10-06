/**
 * Client poll of host session-label map.
 */
export type SessionLabelMap = Readonly<Record<string, string>>;
interface Snapshot {
    value: SessionLabelMap;
    error: string | null;
    version: number;
}
/**
 * Poll `/_dsh/model-switch/session-labels` for catalog + header badges.
 */
export declare class SessionLabelStore {
    private snap;
    private readonly listeners;
    private timer;
    private refs;
    subscribe: (listener: () => void) => (() => void);
    getSnapshot: () => Snapshot;
    start(intervalMs?: number): void;
    stop(): void;
    refresh(): Promise<void>;
    private emit;
}
export {};

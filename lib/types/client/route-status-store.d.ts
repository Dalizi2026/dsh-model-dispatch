/** Host acknowledgements, never optimistic lock badges. */
import { type RouteStatus } from '../route-contract.ts';
import type { ModelSelectionConfig } from '../shared.ts';
export interface RouteSnapshot {
    value?: RouteStatus;
    error?: string;
}
export declare class RouteStatusStore {
    private snapshots;
    private revisions;
    private listeners;
    private watched;
    private empty;
    subscribe: (fn: () => void) => (() => void);
    get: (id: string) => RouteSnapshot;
    watch(id: string): () => void;
    private publish;
    private read;
    refresh(id: string): Promise<RouteStatus>;
    confirm(parentId: string, childId: string, selection: ModelSelectionConfig): Promise<void>;
}

import { type RouteLock } from './route-contract.ts';
import type { ModelSelectionConfig } from './shared.ts';
export declare function validSelection(value: unknown): value is ModelSelectionConfig;
export interface LockStore {
    ready(): Promise<void>;
    get(id: string): RouteLock | undefined;
    set(lock: RouteLock): Promise<void>;
}
export declare class RouteLockStore implements LockStore {
    private path;
    private values;
    private loading?;
    private writing;
    constructor(path?: string);
    ready(): Promise<void>;
    get(id: string): RouteLock | undefined;
    set(lock: RouteLock): Promise<void>;
    private load;
}

/**
 * Browser mirror of the host `model-switch` settings namespace.
 *
 * DSH 0.2.x serves plugin namespaces through the `configForms` service
 * (dsh-client-ui-settings); this store is a stable snapshot wrapper over the
 * namespace's `ConfigForm` controller.
 */
import type { ConfigForm } from '@deepseek-ai/dsh-client-ui-settings/client';
import type { Config, ModelSelectionConfig, RouteSwitchConfig } from '../shared.ts';
export interface ConfigStoreSnapshot {
    status: 'loading' | 'ready' | 'error';
    value: Config;
    error: string | null;
}
export interface MainModelSnapshot {
    status: 'loading' | 'ready' | 'error';
    value: ModelSelectionConfig | undefined;
    error: string | null;
}
/** Reactive config store over the client `configForms` namespace controller. */
export declare class ConfigStore {
    private readonly form;
    private lastRaw;
    private lastView;
    constructor(form: ConfigForm<Config>);
    getSnapshot(): ConfigStoreSnapshot;
    subscribe(listener: () => void): () => void;
    /**
     * Persist one route field. `ConfigForm.set` is one field per call and
     * fences the write with the latest known namespace revision.
     */
    saveRoute(field: 'subagent' | 'planPlanning', next: RouteSwitchConfig): Promise<void>;
}
/** Reactive store over the native `agent-default-model` entry config. */
export declare class MainModelStore {
    private readonly form;
    private lastRaw;
    private lastView;
    constructor(form: ConfigForm<ModelSelectionConfig>);
    getSnapshot(): MainModelSnapshot;
    subscribe(listener: () => void): () => void;
    /**
     * Persist the whole default selection. The entry's volatile fields are flat
     * (`provider` / `model` / `reasoningEffort`), so one atomic mutate carries
     * all three; clearing the effort re-inherits the composition layer.
     */
    save(next: ModelSelectionConfig): Promise<void>;
}

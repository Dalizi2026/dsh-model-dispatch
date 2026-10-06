/** Browser-local shortcuts; routes remain owned by host settings/session state. */
import type { ModelSelectionConfig } from '../shared.ts';
export interface ModelPreferences {
    favorites: readonly string[];
    recent: readonly string[];
}
export declare const modelKey: (value: Pick<ModelSelectionConfig, "provider" | "model">) => string;
export declare const modelPreferences: {
    getSnapshot: () => ModelPreferences;
    subscribe: (notify: () => void) => (() => void);
    toggleFavorite(value: ModelSelectionConfig): void;
    remember(value: ModelSelectionConfig): void;
};

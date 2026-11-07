/** Browser-local shortcuts; routes remain owned by host settings/session state. */
import type { ModelSelectionConfig } from '../shared.ts';
/** Saved reasoning effort; null keeps the provider default. */
export type Effort = string | null;
/** One favorited model + reasoning-effort combination. */
export interface FavoriteChoice {
    readonly provider: string;
    readonly model: string;
    readonly effort: Effort;
}
/** One applied model; effort is absent only for v1 recents that never recorded it. */
export interface HistoryChoice {
    readonly provider: string;
    readonly model: string;
    readonly effort?: Effort;
}
export interface ModelPreferences {
    readonly favorites: readonly FavoriteChoice[];
    /** Newest first, one entry per model; feeds both recents and the last applied effort. */
    readonly history: readonly HistoryChoice[];
}
/** The catalog facts these helpers need from one picker row. */
export interface PickerChoice {
    readonly provider: string;
    readonly model: string;
    readonly reasoning?: {
        readonly efforts: readonly {
            readonly id: string;
            readonly name: string;
        }[];
        readonly defaultEffort?: string;
    };
}
/** One effort shortcut inside a favorites or recents row. */
export interface ShortcutChip {
    readonly effort: Effort;
    readonly name: string;
    readonly stale: boolean;
}
export interface ShortcutRow<T> {
    readonly choice: T;
    readonly chips: readonly ShortcutChip[];
    /** Favorited with the provider default on a model that offers no efforts, so no chip can carry its star. */
    readonly modelFavorite?: boolean;
}
export declare const MAX_FAVORITES = 40;
export declare const modelKey: (value: Pick<ModelSelectionConfig, "provider" | "model">) => string;
export declare const choiceKey: (provider: string, model: string, effort: Effort) => string;
export declare const effortOf: (value: ModelSelectionConfig) => Effort;
export declare const modelPreferences: {
    getSnapshot: () => ModelPreferences;
    subscribe: (notify: () => void) => (() => void);
    /** Adds or removes one exact model + effort; returns false when a new favorite would exceed the limit. */
    toggleFavorite(value: ModelSelectionConfig): boolean;
    /** Records an applied selection: it becomes the newest recent and this model's last effort. */
    remember(value: ModelSelectionConfig): void;
};
export declare function hasFavorite(preferences: ModelPreferences, provider: string, model: string, effort: Effort): boolean;
export declare const isFavorite: (preferences: ModelPreferences, value: ModelSelectionConfig) => boolean;
/**
 * Effort for a model picked by name: the effort last applied with it when the
 * model still supports it, otherwise the adapter default. Undefined means the
 * provider default.
 */
export declare function startingEffort(preferences: ModelPreferences, choice: PickerChoice): string | undefined;
/** One row per favorited model, in catalog order; models absent from the catalog stay hidden but saved. */
export declare function favoriteRows<T extends PickerChoice>(preferences: ModelPreferences, choices: readonly T[], defaultName: string): ShortcutRow<T>[];
/** The last applied models with their efforts, skipping combinations already in favorites. */
export declare function recentRows<T extends PickerChoice>(preferences: ModelPreferences, choices: readonly T[], defaultName: string): ShortcutRow<T>[];

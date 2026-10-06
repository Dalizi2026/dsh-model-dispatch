import type { ModelCatalog, ModelSelection, SessionId } from '@deepseek-ai/dsh-api-remotes/client';
import type { ModelSelectionConfig } from '../shared.ts';
import type { LocaleKey } from './locales.ts';
export interface ModelCatalogAccess {
    loadCatalog: () => Promise<ModelCatalog>;
    currentSelection: (sessionId: SessionId) => ModelSelection | undefined;
}
export interface ModelPickerProps {
    sessionId: SessionId | undefined;
    access: ModelCatalogAccess;
    value: ModelSelectionConfig | undefined;
    onChange: (next: ModelSelectionConfig) => void | Promise<void>;
    t: (key: LocaleKey) => string;
    disabled?: boolean;
    className?: string;
    compact?: boolean;
    placement?: 'top' | 'bottom';
    fallbackLabel?: string;
    requireSession?: boolean;
    /** Retained for callers: opening a picker never persists an implicit seed. */
    seed?: boolean;
    /** Accessible control/menu label without another visible trigger prefix. */
    controlLabel?: string;
    /** Full-width setting control; chat chips keep their compact layout. */
    stretch?: boolean;
    roleLabel?: string;
    scopeHint?: string;
    sourceLabel?: string;
    onClear?: () => void | Promise<void>;
    clearLabel?: string;
}
export declare function ModelPicker({ sessionId, access, value, onChange, t, disabled, className, placement, fallbackLabel, requireSession, roleLabel, controlLabel, stretch, scopeHint, sourceLabel, onClear, clearLabel, compact }: ModelPickerProps): import("react").JSX.Element;

import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { ConfigStore, MainModelStore } from './config-store.ts';
import { type ModelCatalogAccess } from './ModelPicker.tsx';
import type { LocaleKey } from './locales.ts';
import { type UiCapabilityReport } from './SeamNotice.tsx';
export interface SettingsInjected {
    store: ConfigStore;
    mainStore: MainModelStore;
    access: ModelCatalogAccess;
    t: (key: LocaleKey) => string;
    /** Degraded capabilities, read once each time the section opens. */
    seams: () => Promise<UiCapabilityReport[]>;
}
export type SettingsSectionProps = PropsRuntime<'settings.section'> & Partial<SettingsInjected>;
export declare function SettingsSection(props: SettingsSectionProps): import("react").JSX.Element | null;

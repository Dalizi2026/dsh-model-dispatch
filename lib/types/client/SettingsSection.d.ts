import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { ConfigStore, MainModelStore } from './config-store.ts';
import { type ModelCatalogAccess } from './ModelPicker.tsx';
import type { LocaleKey } from './locales.ts';
export interface SettingsInjected {
    store: ConfigStore;
    mainStore: MainModelStore;
    access: ModelCatalogAccess;
    t: (key: LocaleKey) => string;
}
export type SettingsSectionProps = PropsRuntime<'settings.section'> & Partial<SettingsInjected>;
export declare function SettingsSection(props: SettingsSectionProps): import("react").JSX.Element | null;

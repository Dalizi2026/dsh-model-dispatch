import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client';
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { type ModelCatalogAccess } from './ModelPicker.tsx';
import type { MainModelStore } from './config-store.ts';
import type { LocaleKey } from './locales.ts';
export interface SessionModelPickerInjected {
    access: ModelCatalogAccess;
    remote: ClientRemote;
    mainStore: MainModelStore;
    t: (key: LocaleKey) => string;
    available: boolean;
}
export type SessionModelPickerProps = PropsRuntime<'conversation.input.model'> & Partial<SessionModelPickerInjected>;
export declare function SessionModelPicker(props: SessionModelPickerProps): import("react").JSX.Element | null;

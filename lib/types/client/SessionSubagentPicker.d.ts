import type { SessionId } from '@deepseek-ai/dsh-api-remotes/client';
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { type ModelCatalogAccess } from './ModelPicker.tsx';
import type { SessionOverrideStore } from './session-overrides-store.ts';
import type { ConfigStore } from './config-store.ts';
import type { LocaleKey } from './locales.ts';
export interface SessionSubagentPickerInjected {
    sessionId: SessionId;
    overrides: SessionOverrideStore;
    store: ConfigStore;
    access: ModelCatalogAccess;
    t: (key: LocaleKey) => string;
    locked?: boolean;
    available?: boolean;
}
export type SessionSubagentPickerProps = PropsRuntime<'conversation.input.right'> & Partial<SessionSubagentPickerInjected>;
export declare function SessionSubagentPicker(props: SessionSubagentPickerProps): import("react").JSX.Element | null;

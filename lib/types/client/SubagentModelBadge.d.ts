import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { type ModelCatalogAccess } from './ModelPicker.tsx';
import type { RouteStatusStore } from './route-status-store.ts';
import type { LocaleKey } from './locales.ts';
export interface SubagentModelBadgeInjected {
    routes: RouteStatusStore;
    access: ModelCatalogAccess;
    t: (key: LocaleKey) => string;
}
export type SubagentModelBadgeProps = PropsRuntime<'conversation.session.header.actions'> & Partial<SubagentModelBadgeInjected>;
export declare function SubagentModelBadge(props: SubagentModelBadgeProps): import("react").JSX.Element | null;

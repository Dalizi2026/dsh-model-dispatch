import type { SessionId, SubagentAddress } from '@deepseek-ai/dsh-api-remotes/client';
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { SessionLabelStore } from './session-label-store.ts';
/** Business actions supplied by the slot registration. */
export interface SubagentCatalogInjected {
    openChild: (address: SubagentAddress) => void;
    refresh: (parentSessionId: SessionId) => void;
    labels: SessionLabelStore;
}
/** Full props for the session-header catalog action. */
export type SubagentCatalogActionProps = PropsRuntime<'conversation.session.header.actions'> & SubagentCatalogInjected & PropsLocale<'subagent'>;
/**
 * Render the current session's direct catalog and lazily expanded descendants.
 * @param props - session standard props plus catalog navigation actions.
 * @returns The action while the catalog is pending or summaries establish descendants.
 */
export declare function SubagentCatalogAction(props: SubagentCatalogActionProps): import("react").JSX.Element | null;

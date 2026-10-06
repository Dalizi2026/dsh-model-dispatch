/**
 * Session-hierarchy neighbour: show the active subagent's model label.
 */
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { SessionLabelStore } from './session-label-store.ts';
export interface SubagentModelBadgeInjected {
    labels: SessionLabelStore;
}
export type SubagentModelBadgeProps = PropsRuntime<'conversation.session.header.actions'> & Partial<SubagentModelBadgeInjected>;
export declare function SubagentModelBadge(props: SubagentModelBadgeProps): import("react").JSX.Element | null;

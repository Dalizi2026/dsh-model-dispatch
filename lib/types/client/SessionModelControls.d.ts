/** One model seat keeps primary and delegated routes together and ordered. */
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { type SessionModelPickerInjected } from './SessionModelPicker.tsx';
import { type SessionSubagentPickerInjected } from './SessionSubagentPicker.tsx';
type Props = PropsRuntime<'conversation.input.model'> & SessionModelPickerInjected & Omit<SessionSubagentPickerInjected, 'sessionId'>;
export declare function SessionModelControls(props: Props): import("react").JSX.Element;
export {};

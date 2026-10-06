/** One model seat keeps primary and delegated routes together and ordered. */
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { SessionModelPicker, type SessionModelPickerInjected } from './SessionModelPicker.tsx'
import { SessionSubagentPicker, type SessionSubagentPickerInjected } from './SessionSubagentPicker.tsx'
import css from './SessionModelControls.module.css'

type Props = PropsRuntime<'conversation.input.model'> & SessionModelPickerInjected & Omit<SessionSubagentPickerInjected, 'sessionId'>
export function SessionModelControls(props: Props) {
  return <div className={css.bar}>
    <SessionModelPicker {...props} />
    <SessionSubagentPicker {...props} />
  </div>
}

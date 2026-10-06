/** The main-session chip uses native admission and live projection state. */
import { useSyncExternalStore } from 'react'
import type { ClientRemote } from '@deepseek-ai/dsh-api-remotes/client'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { ModelSelectionConfig } from '../shared.ts'
import { ModelPicker, type ModelCatalogAccess } from './ModelPicker.tsx'
import type { MainModelStore } from './config-store.ts'
import type { LocaleKey } from './locales.ts'

export interface SessionModelPickerInjected {
  access: ModelCatalogAccess
  remote: ClientRemote
  mainStore: MainModelStore
  t: (key: LocaleKey) => string
  available: boolean
}
export type SessionModelPickerProps = PropsRuntime<'conversation.input.model'> & Partial<SessionModelPickerInjected>
export function SessionModelPicker(props: SessionModelPickerProps) {
  if (!props.access || !props.remote || !props.mainStore || !props.t) return null
  return <SessionModelPickerLoaded {...props} access={props.access} remote={props.remote} mainStore={props.mainStore} t={props.t} available={props.available === true} />
}
function SessionModelPickerLoaded({ sessionId, useSessions, access, remote, mainStore, t, locked, available }: PropsRuntime<'conversation.input.model'> & SessionModelPickerInjected) {
  const projection = useSessions(state => state.projectionsBySession[sessionId]?.values.modelSelection ?? state.byId[sessionId]?.projectionValues?.modelSelection)
  const main = useSyncExternalStore(listener => mainStore.subscribe(listener), () => mainStore.getSnapshot())
  const value = projection?.next ?? projection?.lastUsed ?? main.value
  const save = async (selection: ModelSelectionConfig): Promise<void> => {
    const result = await remote.session.selectModel({ sessionId, ...selection })
    if (!result.ok) throw new Error(result.error.message)
  }
  return <ModelPicker compact sessionId={sessionId} access={access} value={value} onChange={save} t={t} placement="top" roleLabel={t('chatMainRole')} disabled={locked || !available} scopeHint={t('mainScope')} sourceLabel={t(projection?.next || projection?.lastUsed ? 'sessionSource' : 'defaultSource')} seed={false} />
}

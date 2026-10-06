/** A clearly labelled child route with an explicit inheritance action. */
import { useEffect, useSyncExternalStore } from 'react'
import type { SessionId } from '@deepseek-ai/dsh-api-remotes/client'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ModelSelectionConfig } from '../shared.ts'
import { resolveCustomSelection } from '../shared.ts'
import { ModelPicker, type ModelCatalogAccess } from './ModelPicker.tsx'
import type { SessionOverrideStore } from './session-overrides-store.ts'
import type { ConfigStore } from './config-store.ts'
import type { LocaleKey } from './locales.ts'
import css from './SessionSubagentPicker.module.css'

export interface SessionSubagentPickerInjected {
  sessionId: SessionId
  overrides: SessionOverrideStore
  store: ConfigStore
  access: ModelCatalogAccess
  t: (key: LocaleKey) => string
  locked?: boolean
  available?: boolean
}
export type SessionSubagentPickerProps = PropsRuntime<'conversation.input.right'> & Partial<SessionSubagentPickerInjected>
export function SessionSubagentPicker(props: SessionSubagentPickerProps) {
  if (!props.overrides || !props.access || !props.t || !props.store) return null
  return <SessionSubagentPickerLoaded {...props} overrides={props.overrides} store={props.store} access={props.access} t={props.t} />
}
function SessionSubagentPickerLoaded({ sessionId, overrides, store, access, t, useSessions, locked, available }: PropsRuntime<'conversation.input.right'> & Omit<SessionSubagentPickerInjected, 'sessionId'>) {
  const snap = useSyncExternalStore(overrides.subscribe, overrides.getSnapshot)
  const settings = useSyncExternalStore(listener => store.subscribe(listener), () => store.getSnapshot())
  const subagent = useSessions(state => state.byId[sessionId]?.origin === 'subagent')
  const mainSelection = useSessions(state => state.projectionsBySession[sessionId]?.values.modelSelection ?? state.byId[sessionId]?.projectionValues?.modelSelection)
  useEffect(() => {
    if (subagent) return
    overrides.start()
    return () => { overrides.stop() }
  }, [overrides, subagent])
  if (subagent || available === false || snap.unavailable) return null
  const override = snap.value[sessionId]
  const defaultRoute = resolveCustomSelection(settings.value.subagent)
  // Show the resolved inherited model, but never persist it implicitly.
  const inherited = defaultRoute ?? mainSelection?.next ?? mainSelection?.lastUsed ?? access.currentSelection(sessionId)
  const write = (selection: ModelSelectionConfig): Promise<void> => overrides.set(sessionId, selection)
  return <div className={css.wrap}>
    <ModelPicker compact disabled={locked} sessionId={sessionId} access={access} value={override ?? inherited} onChange={write} placement="top" roleLabel={t('chatSubagentRole')} sourceLabel={t(override ? 'sessionSource' : defaultRoute ? 'defaultSource' : 'followingMain')} scopeHint={t('subagentScope')} t={t} seed={false} onClear={override ? () => overrides.set(sessionId, undefined) : undefined} clearLabel={t('sessionPickerClear')} />
    {snap.error && <span className={css.error} role="status">{t('loadError')}: {snap.error}</span>}
  </div>
}

/** A clearly labelled child route with an explicit inheritance action. */
import { useEffect, useSyncExternalStore } from 'react'
import type { SessionId } from '@deepseek-ai/dsh-api-remotes/client'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ModelSelectionConfig } from '../shared.ts'
import { resolveCustomSelection } from '../shared.ts'
import { ModelPicker, type ModelCatalogAccess } from './ModelPicker.tsx'
import type { SessionOverrideStore } from './session-overrides-store.ts'
import type { ConfigStore } from './config-store.ts'
import type { RouteStatusStore } from './route-status-store.ts'
import type { LocaleKey } from './locales.ts'
import css from './SessionSubagentPicker.module.css'

export interface SessionSubagentPickerInjected {
  sessionId: SessionId
  routes: RouteStatusStore
  overrides: SessionOverrideStore
  store: ConfigStore
  access: ModelCatalogAccess
  t: (key: LocaleKey) => string
  locked?: boolean
  available?: boolean
}
export type SessionSubagentPickerProps = PropsRuntime<'conversation.input.right'> & Partial<SessionSubagentPickerInjected>
export function SessionSubagentPicker(props: SessionSubagentPickerProps) {
  if (!props.overrides || !props.access || !props.t || !props.store || !props.routes) return null
  return <SessionSubagentPickerLoaded {...props} overrides={props.overrides} store={props.store} routes={props.routes} access={props.access} t={props.t} />
}
function SessionSubagentPickerLoaded({ sessionId, overrides, store, routes, access, t, useSessions, locked, available }: PropsRuntime<'conversation.input.right'> & Omit<SessionSubagentPickerInjected, 'sessionId'>) {
  const routeSnap = useSyncExternalStore(routes.subscribe, () => routes.get(sessionId))
  useEffect(() => routes.watch(sessionId), [routes, sessionId])
  const snap = useSyncExternalStore(overrides.subscribe, overrides.getSnapshot)
  const settings = useSyncExternalStore(listener => store.subscribe(listener), () => store.getSnapshot())
  const subagent = useSessions(state => state.byId[sessionId]?.origin === 'subagent')
  const mainSelection = useSessions(state => state.projectionsBySession[sessionId]?.values.modelSelection ?? state.byId[sessionId]?.projectionValues?.modelSelection)
  useEffect(() => {
    if (subagent) return
    overrides.start()
    return () => { overrides.stop() }
  }, [overrides, subagent])
  if (subagent || available === false) return null
  const override = snap.value[sessionId]
  const defaultRoute = resolveCustomSelection(settings.value.subagent)
  // Show the resolved inherited model, but never persist it implicitly.
  const inherited = defaultRoute ?? mainSelection?.next ?? mainSelection?.lastUsed ?? access.currentSelection(sessionId)
  const state = routeSnap.value
  const problem = routeSnap.error ?? state?.error ?? snap.error
  const healthy = state?.health === 'ready' && state.state === 'ready' && !problem
  const unverified = state?.state === 'unverified'
  const statusLabel = healthy ? t('routeReady') : problem ? (state?.state === 'missing' ? t('routeSessionMissing') : state?.state === 'blocked' ? t('routeBlocked') : t('routeUnavailable')) : unverified ? t('routeUnverified') : t('statusLoading')
  const routeMessage = statusLabel
  const write = async (selection?: ModelSelectionConfig): Promise<void> => {
    await overrides.set(sessionId, selection)
    const confirmed = await routes.refresh(sessionId)
    if (confirmed.health !== 'ready' || !['ready', 'unverified'].includes(confirmed.state)) throw new Error(confirmed.error ?? t('routeBlocked'))
  }
  return <div className={css.wrap}>
    <ModelPicker compact disabled={locked || !state || state.health !== 'ready'} sessionId={sessionId} access={access} value={state?.expected ?? override ?? inherited} onChange={selection => write(selection)} placement="top" roleLabel={t('chatSubagentRole')} sourceLabel={t(override ? 'sessionSource' : defaultRoute ? 'defaultSource' : 'followingMain')} scopeHint={t('subagentScope')} t={t} seed={false} onClear={override ? () => write(undefined) : undefined} clearLabel={t('sessionPickerClear')} />
    <span className={problem ? css.error : css.status} role="status" aria-label={statusLabel} title={statusLabel}>{problem ? `${routeMessage}: ${problem}` : healthy ? '✓' : unverified ? t('routeUnverifiedShort') : '…'}</span>
  </div>
}

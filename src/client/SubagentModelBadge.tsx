/** Only host-acknowledged locks and admitted request facts are shown here. */
import { useEffect, useSyncExternalStore } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ModelSelectionConfig } from '../shared.ts'
import { ModelPicker, type ModelCatalogAccess } from './ModelPicker.tsx'
import type { RouteStatusStore } from './route-status-store.ts'
import type { LocaleKey } from './locales.ts'
import css from './SubagentModelBadge.module.css'
export interface SubagentModelBadgeInjected { routes: RouteStatusStore; access: ModelCatalogAccess; t: (key: LocaleKey) => string }
export type SubagentModelBadgeProps = PropsRuntime<'conversation.session.header.actions'> & Partial<SubagentModelBadgeInjected>
const describe = (value?: ModelSelectionConfig): string => value ? `${value.provider}/${value.model}${value.reasoningEffort ? ' · ' + value.reasoningEffort : ''}` : '—'
export function SubagentModelBadge(props: SubagentModelBadgeProps) {
  if (!props.routes || !props.access || !props.t) return null
  return <Loaded {...props} routes={props.routes} access={props.access} t={props.t} />
}
function Loaded({ sessionId, useSessions, routes, access, t }: PropsRuntime<'conversation.session.header.actions'> & SubagentModelBadgeInjected) {
  const origin = useSessions(state => state.byId[sessionId]?.origin)
  const snap = useSyncExternalStore(routes.subscribe, () => routes.get(sessionId))
  useEffect(() => origin === 'subagent' ? routes.watch(sessionId) : undefined, [routes, sessionId, origin])
  if (origin !== 'subagent') return null
  const status = snap.value
  const source = status?.source
  const sourceText = source ? t(source === 'session' ? 'sessionSource' : source === 'default' ? 'defaultSource' : source === 'follow-main' ? 'followingMain' : source === 'inherited-lock' ? 'routeInherited' : 'routeConfirmed') : '—'
  return <details className={css.details} data-model-switch-badge="">
    <summary className={css.badge}>{snap.error ? t('routeUnavailable') : status?.state === 'blocked' ? t('routeBlocked') : status?.state === 'confirmation-required' ? t('routeConfirmRequired') : status?.state === 'locked' ? `${t('routeLocked')} · ${status.expected?.model}` : t('statusLoading')}</summary>
    <div className={css.panel}>
      {(snap.error || status?.error) && <p role="alert">{snap.error ?? status?.error}</p>}
      {status?.state === 'confirmation-required' && status.parentId && <ModelPicker sessionId={sessionId} access={access} value={undefined} onChange={selection => routes.confirm(status.parentId!, sessionId, selection)} roleLabel={t('routeConfirm')} scopeHint={t('routeConfirmHint')} t={t} />}
      {status?.expected && <><p>{t('routeExpected')}: {describe(status.expected)}</p><p>{t('routeActual')}: {status.actual ? describe(status.actual) : t('routeNoRequest')}</p><p>{t('routeSource')}: {sourceText}</p></>}
      {status?.conflict && <p>{t('routeConflict')}: {describe(status.conflict as ModelSelectionConfig)}</p>}
    </div>
  </details>
}

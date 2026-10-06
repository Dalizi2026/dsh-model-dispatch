/** Three settings rows, with only the scope needed to choose a model. */
import { useId, useState, useSyncExternalStore, type ReactNode } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { resolveCustomSelection, type RouteSwitchConfig } from '../shared.ts'
import { ConfigStore, MainModelStore } from './config-store.ts'
import { ModelPicker, type ModelCatalogAccess } from './ModelPicker.tsx'
import type { LocaleKey } from './locales.ts'
import css from './styles.module.css'

export interface SettingsInjected {
  store: ConfigStore
  mainStore: MainModelStore
  access: ModelCatalogAccess
  t: (key: LocaleKey) => string
}
export type SettingsSectionProps = PropsRuntime<'settings.section'> & Partial<SettingsInjected>

function SettingRow({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  const id = useId()
  return <section className={css.settingRow} aria-labelledby={id}>
    <div className={css.settingCopy}>
      <h3 id={id} className={css.settingTitle}>{title}</h3>
      <p className={css.settingHint}>{hint}</p>
    </div>
    <div className={css.settingControl}>{children}</div>
  </section>
}

function RouteRow({ title, hint, route, save, access, t, busy }: {
  title: string; hint: string; route: RouteSwitchConfig; save: (next: RouteSwitchConfig) => Promise<void>
  access: ModelCatalogAccess; t: (key: LocaleKey) => string; busy: boolean
}) {
  const selection = resolveCustomSelection(route)
  return <SettingRow title={title} hint={hint}>
    <ModelPicker
      stretch sessionId={undefined} access={access} value={selection} disabled={busy} t={t}
      controlLabel={title}
      fallbackLabel={route.mode === 'custom' ? t('triggerFallback') : t('modeFollow')}
      onChange={selection => save({ mode: 'custom', selection })}
      onClear={route.mode === 'custom' ? () => save({ mode: 'follow-main', selection: route.selection }) : undefined}
      clearLabel={t('modeFollow')}
    />
  </SettingRow>
}

export function SettingsSection(props: SettingsSectionProps) {
  if (!props.store || !props.mainStore || !props.access || !props.t) return null
  return <SettingsSectionLoaded store={props.store} mainStore={props.mainStore} access={props.access} t={props.t} />
}

function SettingsSectionLoaded({ store, mainStore, access, t }: SettingsInjected) {
  const snap = useSyncExternalStore(listener => store.subscribe(listener), () => store.getSnapshot())
  const main = useSyncExternalStore(listener => mainStore.subscribe(listener), () => mainStore.getSnapshot())
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const save = async (write: () => Promise<void>): Promise<void> => {
    setSaving(true); setMessage(null); setError(null)
    try { await write(); setMessage(t('saved')) }
    catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); throw cause }
    finally { setSaving(false) }
  }
  const saveRoute = (field: 'subagent' | 'planPlanning') => (next: RouteSwitchConfig): Promise<void> => save(() => store.saveRoute(field, next))
  const busy = saving || snap.status !== 'ready'
  return <div className={css.section} data-model-switch-settings="">
    <header className={css.settingsHeader}>
      <h2 className={css.title}>{t('title')}</h2>
      <span className={css.saveStatus} role="status">{saving ? t('statusSaving') : message}</span>
    </header>
    {(error || snap.error) && <p className={css.error} role="alert">{t('saveError')}: {error ?? t('unavailable')}</p>}
    <div className={css.settingsList}>
      <SettingRow title={t('mainTitle')} hint={t('mainHint')}>
        {main.status === 'error' ? <p className={css.error}>{t('mainUnavailable')}</p> : <ModelPicker
          stretch sessionId={undefined} access={access} value={main.value}
          disabled={saving || main.status !== 'ready'} t={t} controlLabel={t('mainTitle')}
          fallbackLabel={main.status === 'loading' ? t('statusLoading') : undefined}
          onChange={next => save(() => mainStore.save(next))}
        />}
      </SettingRow>
      <RouteRow title={t('subagentTitle')} hint={t('subagentHint')} route={snap.value.subagent ?? { mode: 'follow-main' }} save={saveRoute('subagent')} access={access} t={t} busy={busy} />
      <RouteRow title={t('planPlanningTitle')} hint={t('planPlanningHint')} route={snap.value.planPlanning ?? { mode: 'follow-main' }} save={saveRoute('planPlanning')} access={access} t={t} busy={busy} />
    </div>
  </div>
}

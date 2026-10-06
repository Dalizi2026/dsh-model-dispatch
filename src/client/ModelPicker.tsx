/** One searchable, keyboard-accessible model menu shared by every surface. */
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import type { ModelCatalog, ModelSelection, SessionId } from '@deepseek-ai/dsh-api-remotes/client'
import { IconCheckOutlineMedium, IconChevronDownOutlineMedium } from '@deepseek-ai/dsh-client-ui-primitives'
import type { ModelSelectionConfig } from '../shared.ts'
import { modelKey, modelPreferences } from './model-preferences.ts'
import type { LocaleKey } from './locales.ts'
import css from './ModelPicker.module.css'

export interface ModelCatalogAccess {
  loadCatalog: () => Promise<ModelCatalog>
  currentSelection: (sessionId: SessionId) => ModelSelection | undefined
}
export interface ModelPickerProps {
  sessionId: SessionId | undefined
  access: ModelCatalogAccess
  value: ModelSelectionConfig | undefined
  onChange: (next: ModelSelectionConfig) => void | Promise<void>
  t: (key: LocaleKey) => string
  disabled?: boolean
  className?: string
  compact?: boolean
  placement?: 'top' | 'bottom'
  fallbackLabel?: string
  requireSession?: boolean
  /** Retained for callers: opening a picker never persists an implicit seed. */
  seed?: boolean
  /** Accessible control/menu label without another visible trigger prefix. */
  controlLabel?: string
  /** Full-width setting control; chat chips keep their compact layout. */
  stretch?: boolean
  roleLabel?: string
  scopeHint?: string
  sourceLabel?: string
  onClear?: () => void | Promise<void>
  clearLabel?: string
}
export function ModelPicker({ sessionId, access, value, onChange, t, disabled, className, placement = 'bottom', fallbackLabel, requireSession = false, roleLabel, controlLabel, stretch = false, scopeHint, sourceLabel, onClear, clearLabel, compact = false }: ModelPickerProps) {
  const [catalog, setCatalog] = useState<ModelCatalog | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState<ModelSelectionConfig | undefined>()
  const [inherit, setInherit] = useState(false)
  const savingRef = useRef(false)
  const [position, setPosition] = useState({ left: 0, top: 0, height: 480 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const loadRevision = useRef(0)
  const preferences = useSyncExternalStore(modelPreferences.subscribe, modelPreferences.getSnapshot)
  const id = useId()
  const blocked = disabled || saving
  const load = (): void => {
    const revision = ++loadRevision.current
    setLoading(true); setError(null)
    void access.loadCatalog().then(next => {
      if (revision === loadRevision.current) { setCatalog(next); setLoading(false) }
    }).catch((cause: unknown) => {
      if (revision === loadRevision.current) { setError(cause instanceof Error ? cause.message : String(cause)); setLoading(false) }
    })
  }
  useEffect(() => { load(); return () => { loadRevision.current += 1 } }, [access])
  const choices = useMemo(() => catalog?.groups.flatMap(group => group.models.map(model => ({
    ...model, provider: group.id, providerName: group.name, model: model.id,
  }))) ?? [], [catalog])
  const selected = choices.find(row => row.provider === value?.provider && row.model === value.model)
  const reasoning = selected?.reasoning
  const effectiveEffort = value?.reasoningEffort ?? reasoning?.defaultEffort
  const effortLabel = reasoning?.efforts.find(row => row.id === effectiveEffort)?.name ?? (effectiveEffort || undefined)
  const modelLabel = selected?.name ?? value?.model ?? fallbackLabel ?? t('triggerFallback')
  const fullLabel = [controlLabel ?? roleLabel, modelLabel, effortLabel].filter(Boolean).join(' · ')
  const draftModel = choices.find(row => row.provider === draft?.provider && row.model === draft.model)
  const draftReasoning = draftModel?.reasoning
  const close = (focus = false): void => {
    if (savingRef.current) return
    setOpen(false); if (focus) triggerRef.current?.focus()
  }
  useLayoutEffect(() => {
    if (!open) return
    const place = (): void => {
      const trigger = triggerRef.current?.getBoundingClientRect()
      if (trigger === undefined) return
      const width = Math.min(360, window.innerWidth - 24)
      const above = trigger.top - 12
      const below = window.innerHeight - trigger.bottom - 12
      const upwards = placement === 'top' ? above >= 240 || above > below : below < 240 && above > below
      const height = Math.min(520, upwards ? above : below)
      const left = Math.max(12, Math.min(placement === 'top' ? trigger.right - width : trigger.left, window.innerWidth - width - 12))
      // Menu occupies only its contents; translateY preserves bottom anchoring.
      setPosition({ left, top: upwards ? trigger.top - 8 : trigger.bottom + 8, height: Math.max(160, height) })
      if (menuRef.current) menuRef.current.dataset.upwards = String(upwards)
    }
    place(); searchRef.current?.focus()
    const outside = (event: PointerEvent): void => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target) && !triggerRef.current?.contains(event.target)) close()
    }
    const dismissOnScroll = (event: Event): void => { if (!(event.target instanceof Node) || !menuRef.current?.contains(event.target)) close() }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('scroll', dismissOnScroll, true)
    window.addEventListener('resize', place)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('scroll', dismissOnScroll, true); window.removeEventListener('resize', place) }
  }, [open, placement])
  useEffect(() => { if (disabled && !saving) close() }, [disabled, saving])
  const commit = (action: () => void | Promise<void>, next?: ModelSelectionConfig): void => {
    if (blocked || savingRef.current) return
    savingRef.current = true
    setSaving(true); setError(null)
    void Promise.resolve().then(action).then(() => {
      if (next) modelPreferences.remember(next)
      savingRef.current = false
      setSaving(false); close(true)
    }).catch((cause: unknown) => { savingRef.current = false; setSaving(false); setError(cause instanceof Error ? cause.message : String(cause)) })
  }
  const pick = (provider: string, model: string): void => {
    if (blocked) return
    const row = choices.find(item => item.provider === provider && item.model === model)
    // Re-selecting the same model keeps its explicit effort. A different
    // model starts with its own default, never an unsupported prior effort.
    const current = inherit ? value : draft
    const next = current?.provider === provider && current.model === model
      ? { ...current }
      : value?.provider === provider && value.model === model
        ? { ...value }
        : { provider, model, ...row?.reasoning?.defaultEffort === undefined ? {} : { reasoningEffort: row.reasoning.defaultEffort } }
    setDraft(next); setInherit(false)
  }
  const apply = (): void => {
    if (inherit && onClear !== undefined) commit(onClear)
    else if (draft !== undefined && draftModel !== undefined) commit(() => onChange(draft), draft)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') { event.preventDefault(); close(true); return }
    if (event.key === 'Tab') {
      const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('input, button:not(:disabled)') ?? [])
      const at = items.indexOf(document.activeElement as HTMLElement)
      if ((!event.shiftKey && at === items.length - 1) || (event.shiftKey && at === 0)) {
        event.preventDefault(); items[event.shiftKey ? items.length - 1 : 0]?.focus()
      }
      return
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    if (event.target === searchRef.current && ['Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[data-model-option]:not(:disabled)') ?? [])
    const at = items.indexOf(document.activeElement as HTMLButtonElement)
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : event.key === 'ArrowDown' ? (at + 1) % items.length : at <= 0 ? items.length - 1 : at - 1
    items[next]?.focus()
  }
  const normalized = query.trim().toLocaleLowerCase()
  const visible = choices.filter(row => `${row.name} ${row.model} ${row.providerName} ${row.provider}`.toLocaleLowerCase().includes(normalized))
  const groups = normalized ? [{ label: t('searchResults'), rows: visible }] : [
    { label: t('favorites'), rows: choices.filter(row => preferences.favorites.includes(modelKey(row))) },
    { label: t('recentModels'), rows: preferences.recent.flatMap(key => choices.filter(row => modelKey(row) === key)) },
    ...(catalog?.groups.map(group => ({ label: group.name, rows: choices.filter(row => row.provider === group.id) })) ?? []),
  ]
  if (requireSession && sessionId === undefined) return <p className={css.muted}>{t('noSession')}</p>
  return (
    <div className={[css.root, compact ? css.compact : undefined, stretch ? css.stretch : undefined, className].filter(Boolean).join(' ')}>
      <button ref={triggerRef} type="button" className={css.trigger} aria-label={fullLabel} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined} title={fullLabel} disabled={blocked} onClick={() => {
        if (open) close(); else { setQuery(''); setDraft(value === undefined ? undefined : { ...value }); setInherit(false); setError(null); setOpen(true); load() }
      }}>
        {roleLabel && <span className={css.role}>{roleLabel}</span>}
        <span className={css.triggerLabel}>{modelLabel}</span>
        {effortLabel && <span className={css.triggerEffort}>{effortLabel}</span>}
        <IconChevronDownOutlineMedium className={css.chevron} />
      </button>
      {open && createPortal(
        <div ref={menuRef} id={id} role="dialog" aria-modal="true" aria-label={controlLabel ?? roleLabel ?? t('menuAria')} className={css.menu} style={{ left: position.left, top: position.top, maxHeight: position.height }} onKeyDown={onKeyDown}>
          <header className={css.menuHeader}>
            <span>{controlLabel ?? roleLabel ?? t('menuAria')}</span>
            {sourceLabel && <span className={css.source}>{sourceLabel}</span>}
          </header>
          <input ref={searchRef} className={css.search} value={query} onChange={event => { setQuery(event.target.value) }} placeholder={t('searchPlaceholder')} aria-label={t('searchPlaceholder')} />
          {error && <div className={css.error} role="alert"><span>{error}</span><button type="button" className={css.retry} onClick={load}>{t('retry')}</button></div>}
          {catalog && value && !selected && !loading && <div className={css.warning} role="alert">{t('routeMissing')} ({value.provider}/{value.model})</div>}
          {catalog?.failures.length ? <div className={css.warning}>{t('catalogPartial')}: {catalog.failures.map(row => row.name).join(', ')}</div> : null}
          <div className={css.groups} aria-busy={loading || saving}>
            {loading && !catalog && <div className={css.status}>{t('statusLoading')}</div>}
            {groups.filter(group => group.rows.length).map(group => <section className={css.group} key={group.label} aria-label={group.label}>
              <h4 className={css.groupTitle}>{group.label}</h4>
              {group.rows.map(row => {
                const key = modelKey(row)
                const favorite = preferences.favorites.includes(key)
                const current = !inherit && row.provider === draft?.provider && row.model === draft.model
                return <div className={css.modelRow} key={key}>
                  <button type="button" data-model-option className={[css.option, current ? css.selected : ''].filter(Boolean).join(' ')} aria-pressed={current} disabled={blocked} title={`${row.name} · ${row.providerName}`} onClick={() => { pick(row.provider, row.model) }}>
                    <span className={css.optionCopy}><span className={css.modelName}>{row.name}</span><span className={css.description}>{normalized || group.label === t('favorites') || group.label === t('recentModels') ? `${row.providerName} · ` : ''}{row.description ?? row.model}</span></span>
                    {current && <IconCheckOutlineMedium className={css.check} />}
                  </button>
                  <button type="button" className={css.favorite} aria-label={`${t(favorite ? 'unfavoriteModel' : 'favoriteModel')}: ${row.name}`} aria-pressed={favorite} onClick={() => { modelPreferences.toggleFavorite(row) }}>{favorite ? '★' : '☆'}</button>
                </div>
              })}
            </section>)}
            {!loading && visible.length === 0 && <div className={css.empty}>{t(normalized ? 'noResults' : 'emptyModels')}</div>}
          </div>
          {onClear && <button className={css.clear} type="button" aria-pressed={inherit} disabled={blocked} onClick={() => { setInherit(true) }}>{clearLabel ?? t('sessionPickerClear')}{inherit && <IconCheckOutlineMedium className={css.check} />}</button>}
          <div className={css.selectionEditor}>
            <div className={css.draftSummary}>
              <span className={css.modelName}>{inherit ? clearLabel ?? t('sessionPickerClear') : draftModel?.name ?? draft?.model ?? t('triggerFallback')}</span>
              {!inherit && draftModel && <span className={css.description}>{draftModel.providerName}</span>}
            </div>
            {!inherit && draftModel && (draftReasoning && draftReasoning.efforts.length > 0 ? <section className={css.effortSection} aria-label={t('effortLabel')}>
              <span className={css.groupTitle}>{t('effortLabel')}</span>
              <div className={css.efforts}>
                {[{ id: undefined, name: t('effortDefault'), description: undefined }, ...draftReasoning.efforts].map(level => <button key={level.id ?? 'default'} type="button" className={css.effort} aria-pressed={draft?.reasoningEffort === level.id} disabled={blocked} title={level.description} onClick={() => {
                  if (draft === undefined) return
                  setDraft({ provider: draft.provider, model: draft.model, ...level.id === undefined ? {} : { reasoningEffort: level.id } })
                }}>{level.name}</button>)}
              </div>
            </section> : <p className={css.effortUnavailable}>{t('emptyEfforts')}</p>)}
            <div className={css.confirmActions}>
              <button type="button" className={css.cancel} disabled={saving} onClick={() => { close(true) }}>{t('cancel')}</button>
              <button type="button" className={css.apply} disabled={blocked || !(inherit ? onClear !== undefined : draftModel !== undefined)} onClick={apply}>{saving ? t('statusSaving') : t('applySelection')}</button>
            </div>
          </div>
          {scopeHint && <footer className={css.scopeHint}>{scopeHint}</footer>}
        </div>, document.body,
      )}
    </div>
  )
}

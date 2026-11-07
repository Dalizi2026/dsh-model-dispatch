/** One searchable, keyboard-accessible model menu shared by every surface. */
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import type { ModelCatalog, ModelSelection, SessionId } from '@deepseek-ai/dsh-api-remotes/client'
import { IconCheckOutlineMedium, IconChevronDownOutlineMedium } from '@deepseek-ai/dsh-client-ui-primitives'
import { sameSelection, type ModelSelectionConfig } from '../shared.ts'
import { effortOf, favoriteRows, hasFavorite, isFavorite, MAX_FAVORITES, modelKey, modelPreferences, recentRows, startingEffort, type Effort, type FavoriteChoice, type ModelPreferences, type ShortcutChip, type ShortcutRow } from './model-preferences.ts'
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
const withEffort = (provider: string, model: string, effort: string | undefined): ModelSelectionConfig => ({ provider, model, ...effort === undefined ? {} : { reasoningEffort: effort } })
/** Star lighting: a short critically damped settle, skipped under reduced motion. */
function settle(element: HTMLElement | null): void {
  if (element === null || typeof element.animate !== 'function') return
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  element.animate([{ transform: 'scale(0.85)' }, { transform: 'scale(1)' }], { duration: 250, easing: 'cubic-bezier(0.2, 0, 0, 1)' })
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
  const [notice, setNotice] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  // Favorites removed while this menu is open keep their place as hollow chips: one tap restores them.
  const [ghosts, setGhosts] = useState<readonly FavoriteChoice[]>([])
  const savingRef = useRef(false)
  const [position, setPosition] = useState({ left: 0, top: 0, height: 480 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const starRef = useRef<HTMLSpanElement>(null)
  const loadRevision = useRef(0)
  const preferences = useSyncExternalStore(modelPreferences.subscribe, modelPreferences.getSnapshot)
  const shown = useMemo<ModelPreferences>(() => {
    const kept = ghosts.filter(item => !hasFavorite(preferences, item.provider, item.model, item.effort))
    return kept.length === 0 ? preferences : { ...preferences, favorites: [...preferences.favorites, ...kept] }
  }, [preferences, ghosts])
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
  type Choice = (typeof choices)[number]
  const selected = choices.find(row => row.provider === value?.provider && row.model === value.model)
  const reasoning = selected?.reasoning
  const effectiveEffort = value?.reasoningEffort ?? reasoning?.defaultEffort
  const effortLabel = reasoning?.efforts.find(row => row.id === effectiveEffort)?.name ?? (effectiveEffort || undefined)
  const modelLabel = selected?.name ?? value?.model ?? fallbackLabel ?? t('triggerFallback')
  const fullLabel = [controlLabel ?? roleLabel, modelLabel, effortLabel].filter(Boolean).join(' · ')
  const draftModel = choices.find(row => row.provider === draft?.provider && row.model === draft.model)
  const draftReasoning = draftModel?.reasoning
  // The editor names the exact combination the star saves.
  const draftEffortName = draft !== undefined && draftReasoning !== undefined && draftReasoning.efforts.length > 0
    ? draftReasoning.efforts.find(level => level.id === draft.reasoningEffort)?.name ?? draft.reasoningEffort ?? t('effortDefault')
    : undefined
  const draftTitle = [draftModel?.name ?? draft?.model, draftEffortName].filter(Boolean).join(' · ')
  const draftFavorite = draft !== undefined && isFavorite(preferences, draft)
  const favoritesFull = !draftFavorite && preferences.favorites.length >= MAX_FAVORITES
  // Applying an untouched draft would silently pin an inherited route, so Apply waits for a change.
  const unchanged = !inherit && sameSelection(draft, value)
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
  /** A model name: keep the effort already chosen for it here, else its last applied effort, else the default. */
  const pick = (row: Choice): void => {
    if (blocked) return
    const current = inherit ? value : draft
    const next = current?.provider === row.provider && current.model === row.model
      ? { ...current }
      : value?.provider === row.provider && value.model === row.model
        ? { ...value }
        : withEffort(row.provider, row.model, startingEffort(preferences, row))
    setDraft(next); setInherit(false); setNotice(null)
  }
  /** An effort chip: exactly that combination, or the default when the saved effort is gone. */
  const pickChip = (row: Choice, chip: ShortcutChip): void => {
    if (blocked) return
    if (chip.stale) {
      setDraft(withEffort(row.provider, row.model, row.reasoning?.defaultEffort))
      setNotice(t('staleEffort').replace('{effort}', chip.name))
    } else {
      setDraft(withEffort(row.provider, row.model, chip.effort ?? undefined))
      setNotice(null)
    }
    setInherit(false)
  }
  /** One star toggle for the editor, chip badges, and model-only rows; a removal leaves a restorable placeholder. */
  const toggleChoice = (provider: string, model: string, effort: Effort, title: string, star: HTMLElement | null): void => {
    const adding = !hasFavorite(preferences, provider, model, effort)
    if (!modelPreferences.toggleFavorite(withEffort(provider, model, effort ?? undefined))) return
    const same = (item: FavoriteChoice): boolean => item.provider === provider && item.model === model && item.effort === effort
    setGhosts(current => adding ? current.filter(item => !same(item)) : [...current.filter(item => !same(item)), { provider, model, effort }])
    setAnnouncement(t(adding ? 'favoriteAdded' : 'favoriteRemoved').replace('{name}', title))
    if (adding) settle(star)
  }
  const toggleFavorite = (): void => {
    if (draft === undefined || draftModel === undefined) return
    toggleChoice(draft.provider, draft.model, effortOf(draft), draftTitle, starRef.current)
  }
  const apply = (): void => {
    if (inherit && onClear !== undefined) commit(onClear)
    else if (!unchanged && draft !== undefined && draftModel !== undefined) commit(() => onChange(draft), draft)
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
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const row = active?.closest('[data-model-row]')
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      // Left/right walks one row: its model name, then its effort chips.
      if (!row) return
      const items = Array.from(row.querySelectorAll<HTMLButtonElement>('[data-model-option]:not(:disabled), [data-effort-chip]:not(:disabled)'))
      const at = items.indexOf(active as HTMLButtonElement)
      if (at < 0) return
      event.preventDefault()
      items[event.key === 'ArrowRight' ? Math.min(at + 1, items.length - 1) : Math.max(at - 1, 0)]?.focus()
      return
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    if (event.target === searchRef.current && ['Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[data-model-option]:not(:disabled)') ?? [])
    const at = items.indexOf((row?.querySelector('[data-model-option]') ?? active) as HTMLButtonElement)
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : event.key === 'ArrowDown' ? (at + 1) % items.length : at <= 0 ? items.length - 1 : at - 1
    items[next]?.focus()
  }
  const normalized = query.trim().toLocaleLowerCase()
  const visible = choices.filter(row => `${row.name} ${row.model} ${row.providerName} ${row.provider}`.toLocaleLowerCase().includes(normalized))
  const plain = (rows: readonly Choice[]): ShortcutRow<Choice>[] => rows.map(choice => ({ choice, chips: [] }))
  const sections: { id: string; label: string; shortcut: boolean; rows: readonly ShortcutRow<Choice>[] }[] = normalized ? [{ id: 'search', label: t('searchResults'), shortcut: true, rows: plain(visible) }] : [
    { id: 'favorites', label: t('favorites'), shortcut: true, rows: favoriteRows(shown, choices, t('effortDefaultShort')) },
    { id: 'recent', label: t('recentModels'), shortcut: true, rows: recentRows(shown, choices, t('effortDefaultShort')) },
    ...(catalog?.groups.map(group => ({ id: `provider:${group.id}`, label: group.name, shortcut: false, rows: plain(choices.filter(row => row.provider === group.id)) })) ?? []),
  ]
  const draftEffort = draft === undefined ? undefined : effortOf(draft)
  if (requireSession && sessionId === undefined) return <p className={css.muted}>{t('noSession')}</p>
  return (
    <div className={[css.root, compact ? css.compact : undefined, stretch ? css.stretch : undefined, className].filter(Boolean).join(' ')}>
      <button ref={triggerRef} type="button" className={css.trigger} aria-label={fullLabel} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined} title={fullLabel} disabled={blocked} onClick={() => {
        if (open) close(); else { setQuery(''); setDraft(value === undefined ? undefined : { ...value }); setInherit(false); setError(null); setNotice(null); setAnnouncement(''); setGhosts([]); setOpen(true); load() }
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
            {sections.filter(section => section.rows.length).map(section => <section className={css.group} key={section.id} aria-label={section.label}>
              <h4 className={css.groupTitle}>{section.label}</h4>
              {section.rows.map(({ choice: row, chips, modelFavorite }) => {
                const current = !inherit && row.provider === draft?.provider && row.model === draft.model
                const favorites = section.id === 'favorites'
                /** The badge star for one saved combination: filled while saved, hollow once removed in this menu. */
                const star = (effort: Effort, title: string, className: string | undefined) => {
                  const saved = hasFavorite(preferences, row.provider, row.model, effort)
                  const label = t(saved ? 'unfavoriteChoice' : 'favoriteChoice').replace('{name}', title)
                  const full = !saved && preferences.favorites.length >= MAX_FAVORITES
                  return <button type="button" tabIndex={-1} data-favorite-star className={className} aria-pressed={saved} aria-label={label} title={full ? t('favoritesFull') : label} disabled={full} onClick={event => { toggleChoice(row.provider, row.model, effort, title, event.currentTarget.firstElementChild as HTMLElement | null) }}>
                    <span className={css.star} aria-hidden="true">{saved ? '★' : '☆'}</span>
                  </button>
                }
                // Delete or Backspace on a focused favorite toggles it, as in a macOS token field.
                const removeKey = (effort: Effort, title: string) => (event: KeyboardEvent<HTMLButtonElement>): void => {
                  if (!favorites || (event.key !== 'Delete' && event.key !== 'Backspace')) return
                  event.preventDefault()
                  toggleChoice(row.provider, row.model, effort, title, null)
                }
                const modelGhost = modelFavorite === true && !hasFavorite(preferences, row.provider, row.model, null)
                return <div className={css.modelRow} key={modelKey(row)} data-model-row data-ghost={favorites && modelGhost ? 'true' : undefined}>
                  <button type="button" data-model-option className={[css.option, current ? css.selected : ''].filter(Boolean).join(' ')} aria-pressed={current} disabled={blocked} title={`${row.name} · ${row.providerName}`} onClick={() => { pick(row) }} onKeyDown={favorites && modelFavorite ? removeKey(null, row.name) : undefined}>
                    <span className={css.optionCopy}><span className={css.modelName}>{row.name}</span><span className={css.description}>{section.shortcut ? `${row.providerName} · ` : ''}{row.description ?? row.model}</span></span>
                    {current && <IconCheckOutlineMedium className={css.check} />}
                  </button>
                  {favorites && modelFavorite && star(null, row.name, css.rowStar)}
                  {chips.length > 0 && <div className={css.rowChips}>
                    {chips.map(chip => {
                      const label = `${row.name} · ${chip.name}`
                      const ghost = favorites && !hasFavorite(preferences, row.provider, row.model, chip.effort)
                      return <span key={chip.effort ?? '\u0000default'} className={css.chipWrap} data-ghost={ghost ? 'true' : undefined}>
                        <button type="button" data-effort-chip data-stale={chip.stale ? 'true' : undefined} className={[css.effort, css.rowChip].join(' ')} aria-pressed={current && !chip.stale && draftEffort === chip.effort} aria-label={chip.stale ? `${label} · ${t('staleEffortChip')}` : label} aria-keyshortcuts={favorites ? 'Delete' : undefined} title={chip.stale ? t('staleEffortChip') : label} disabled={blocked} onClick={() => { pickChip(row, chip) }} onKeyDown={removeKey(chip.effort, label)}>{chip.name}</button>
                        {favorites && star(chip.effort, label, css.chipStar)}
                      </span>
                    })}
                  </div>}
                </div>
              })}
            </section>)}
            {!loading && visible.length === 0 && <div className={css.empty}>{t(normalized ? 'noResults' : 'emptyModels')}</div>}
          </div>
          {onClear && <button className={css.clear} type="button" aria-pressed={inherit} disabled={blocked} onClick={() => { setInherit(true); setNotice(null) }}>{clearLabel ?? t('modeFollow')}{inherit && <IconCheckOutlineMedium className={css.check} />}</button>}
          <div className={css.selectionEditor}>
            <div className={css.draftSummary}>
              <div className={css.draftCopy}>
                <span className={css.modelName}>{inherit ? clearLabel ?? t('modeFollow') : draft === undefined ? t('triggerFallback') : draftTitle}</span>
                {!inherit && draftModel && <span className={css.description}>{draftModel.providerName}</span>}
              </div>
              {!inherit && draft && draftModel && <button type="button" className={css.favoriteToggle} aria-pressed={draftFavorite} aria-label={t(draftFavorite ? 'unfavoriteChoice' : 'favoriteChoice').replace('{name}', draftTitle)} title={favoritesFull ? t('favoritesFull') : t(draftFavorite ? 'unfavoriteChoice' : 'favoriteChoice').replace('{name}', draftTitle)} disabled={favoritesFull} onClick={toggleFavorite}>
                <span ref={starRef} className={css.star} aria-hidden="true">{draftFavorite ? '★' : '☆'}</span>
              </button>}
            </div>
            {notice && !inherit && <p className={css.notice} role="status">{notice}</p>}
            {!inherit && draftModel && (draftReasoning && draftReasoning.efforts.length > 0 ? <section className={css.effortSection} aria-label={t('effortLabel')}>
              <span className={css.groupTitle}>{t('effortLabel')}</span>
              <div className={css.efforts}>
                {[{ id: undefined, name: t('effortDefault'), description: undefined }, ...draftReasoning.efforts].map(level => <button key={level.id ?? 'default'} type="button" className={css.effort} aria-pressed={draft?.reasoningEffort === level.id} disabled={blocked} title={level.description} onClick={() => {
                  if (draft === undefined) return
                  setDraft(withEffort(draft.provider, draft.model, level.id)); setNotice(null)
                }}>{level.name}</button>)}
              </div>
            </section> : <p className={css.effortUnavailable}>{t('emptyEfforts')}</p>)}
            <div className={css.confirmActions}>
              <button type="button" className={css.cancel} disabled={saving} onClick={() => { close(true) }}>{t('cancel')}</button>
              <button type="button" className={css.apply} disabled={blocked || unchanged || !(inherit ? onClear !== undefined : draftModel !== undefined)} onClick={apply}>{saving ? t('statusSaving') : t('applySelection')}</button>
            </div>
          </div>
          <span className={css.visuallyHidden} role="status" aria-live="polite">{announcement}</span>
          {scopeHint && <footer className={css.scopeHint}>{scopeHint}</footer>}
        </div>, document.body,
      )}
    </div>
  )
}

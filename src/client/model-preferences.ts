/** Browser-local shortcuts; routes remain owned by host settings/session state. */
import type { ModelSelectionConfig } from '../shared.ts'

/** Saved reasoning effort; null keeps the provider default. */
export type Effort = string | null
/** One favorited model + reasoning-effort combination. */
export interface FavoriteChoice { readonly provider: string; readonly model: string; readonly effort: Effort }
/** One applied model; effort is absent only for v1 recents that never recorded it. */
export interface HistoryChoice { readonly provider: string; readonly model: string; readonly effort?: Effort }
export interface ModelPreferences {
  readonly favorites: readonly FavoriteChoice[]
  /** Newest first, one entry per model; feeds both recents and the last applied effort. */
  readonly history: readonly HistoryChoice[]
}
/** The catalog facts these helpers need from one picker row. */
export interface PickerChoice {
  readonly provider: string
  readonly model: string
  readonly reasoning?: { readonly efforts: readonly { readonly id: string; readonly name: string }[]; readonly defaultEffort?: string }
}
/** One effort shortcut inside a favorites or recents row. */
export interface ShortcutChip { readonly effort: Effort; readonly name: string; readonly stale: boolean }
export interface ShortcutRow<T> {
  readonly choice: T
  readonly chips: readonly ShortcutChip[]
  /** Favorited with the provider default on a model that offers no efforts, so no chip can carry its star. */
  readonly modelFavorite?: boolean
}

const KEY = 'dsh-model-switch/picker-v2'
/** Read only to migrate; never written, so an older plugin keeps its own shortcuts. */
const LEGACY_KEY = 'dsh-model-switch/picker-v1'
export const MAX_FAVORITES = 40
const MAX_HISTORY = 100
const RECENT_LIMIT = 6
const EMPTY: ModelPreferences = { favorites: [], history: [] }

export const modelKey = (value: Pick<ModelSelectionConfig, 'provider' | 'model'>): string => JSON.stringify([value.provider, value.model])
export const choiceKey = (provider: string, model: string, effort: Effort): string => JSON.stringify([provider, model, effort])
export const effortOf = (value: ModelSelectionConfig): Effort => value.reasoningEffort ?? null
const sameModel = (a: Pick<PickerChoice, 'provider' | 'model'>, b: Pick<PickerChoice, 'provider' | 'model'>): boolean => a.provider === b.provider && a.model === b.model

function tuple(value: unknown): HistoryChoice | undefined {
  if (!Array.isArray(value) || value.length < 2 || value.length > 3) return undefined
  const [provider, model, effort] = value as unknown[]
  if (typeof provider !== 'string' || typeof model !== 'string' || provider.length === 0 || model.length === 0) return undefined
  if (value.length === 2) return { provider, model }
  if (effort !== null && (typeof effort !== 'string' || effort.length === 0)) return undefined
  return { provider, model, effort }
}
function normalize(favorites: readonly unknown[], history: readonly unknown[]): ModelPreferences {
  const combos = new Set<string>()
  const savedFavorites: FavoriteChoice[] = []
  for (const item of favorites) {
    const choice = tuple(item)
    if (choice?.effort === undefined || savedFavorites.length === MAX_FAVORITES) continue
    const key = choiceKey(choice.provider, choice.model, choice.effort)
    if (combos.has(key)) continue
    combos.add(key); savedFavorites.push({ provider: choice.provider, model: choice.model, effort: choice.effort })
  }
  const models = new Set<string>()
  const savedHistory: HistoryChoice[] = []
  for (const item of history) {
    const choice = tuple(item)
    if (choice === undefined || models.has(modelKey(choice)) || savedHistory.length === MAX_HISTORY) continue
    models.add(modelKey(choice)); savedHistory.push(choice)
  }
  return { favorites: savedFavorites, history: savedHistory }
}
const list = (value: unknown): readonly unknown[] => Array.isArray(value) ? value : []
/** v1 saved model keys only: favorites keep the provider default, recents keep no effort record. */
function migrate(raw: string | null): ModelPreferences {
  if (raw === null) return EMPTY
  const data = JSON.parse(raw) as { favorites?: unknown; recent?: unknown } | null
  const legacy = (value: unknown): unknown[][] => list(value).flatMap(item => {
    if (typeof item !== 'string') return []
    try {
      const parsed: unknown = JSON.parse(item)
      return Array.isArray(parsed) && parsed.length === 2 ? [parsed] : []
    } catch { return [] }
  })
  return normalize(legacy(data?.favorites).map(item => [...item, null]), legacy(data?.recent))
}
function read(): ModelPreferences {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === null) return migrate(localStorage.getItem(LEGACY_KEY))
    const data = JSON.parse(raw) as { favorites?: unknown; history?: unknown } | null
    return normalize(list(data?.favorites), list(data?.history))
  } catch { return EMPTY }
}
function serialize(value: ModelPreferences): string {
  return JSON.stringify({
    version: 2,
    favorites: value.favorites.map(item => [item.provider, item.model, item.effort]),
    history: value.history.map(item => item.effort === undefined ? [item.provider, item.model] : [item.provider, item.model, item.effort]),
  })
}

let snapshot: ModelPreferences = EMPTY
let initialized = false
const listeners = new Set<() => void>()
function initialize(): void {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  snapshot = read()
  window.addEventListener('storage', event => {
    if (event.key !== KEY && event.key !== null) return
    snapshot = read()
    for (const notify of listeners) notify()
  })
}
function publish(next: ModelPreferences): void {
  snapshot = next
  try { localStorage.setItem(KEY, serialize(next)) } catch { /* Optional shortcuts remain usable for this page. */ }
  for (const notify of listeners) notify()
}
export const modelPreferences = {
  getSnapshot: (): ModelPreferences => { initialize(); return snapshot },
  subscribe: (notify: () => void): (() => void) => { initialize(); listeners.add(notify); return () => { listeners.delete(notify) } },
  /** Adds or removes one exact model + effort; returns false when a new favorite would exceed the limit. */
  toggleFavorite(value: ModelSelectionConfig): boolean {
    initialize()
    const effort = effortOf(value)
    const key = choiceKey(value.provider, value.model, effort)
    const saved = snapshot.favorites.some(item => choiceKey(item.provider, item.model, item.effort) === key)
    if (!saved && snapshot.favorites.length >= MAX_FAVORITES) return false
    publish({
      ...snapshot,
      favorites: saved
        ? snapshot.favorites.filter(item => choiceKey(item.provider, item.model, item.effort) !== key)
        : [...snapshot.favorites, { provider: value.provider, model: value.model, effort }],
    })
    return true
  },
  /** Records an applied selection: it becomes the newest recent and this model's last effort. */
  remember(value: ModelSelectionConfig): void {
    initialize()
    publish({
      ...snapshot,
      history: [{ provider: value.provider, model: value.model, effort: effortOf(value) }, ...snapshot.history.filter(item => !sameModel(item, value))].slice(0, MAX_HISTORY),
    })
  },
}

export function hasFavorite(preferences: ModelPreferences, provider: string, model: string, effort: Effort): boolean {
  return preferences.favorites.some(item => item.provider === provider && item.model === model && item.effort === effort)
}
export const isFavorite = (preferences: ModelPreferences, value: ModelSelectionConfig): boolean => hasFavorite(preferences, value.provider, value.model, effortOf(value))
/**
 * Effort for a model picked by name: the effort last applied with it when the
 * model still supports it, otherwise the adapter default. Undefined means the
 * provider default.
 */
export function startingEffort(preferences: ModelPreferences, choice: PickerChoice): string | undefined {
  const last = preferences.history.find(item => sameModel(item, choice))?.effort
  if (last === null) return undefined
  if (last !== undefined && choice.reasoning?.efforts.some(level => level.id === last)) return last
  return choice.reasoning?.defaultEffort
}
/** Saved efforts in the model's own order; provider default first, unsupported ones last. */
function chips(choice: PickerChoice, efforts: readonly Effort[], defaultName: string): ShortcutChip[] {
  const supported = choice.reasoning?.efforts ?? []
  const result: ShortcutChip[] = []
  if (supported.length > 0 && efforts.includes(null)) result.push({ effort: null, name: defaultName, stale: false })
  for (const level of supported) if (efforts.includes(level.id)) result.push({ effort: level.id, name: level.name, stale: false })
  for (const effort of efforts) {
    if (effort !== null && !supported.some(level => level.id === effort)) result.push({ effort, name: effort, stale: true })
  }
  return result
}
/** One row per favorited model, in catalog order; models absent from the catalog stay hidden but saved. */
export function favoriteRows<T extends PickerChoice>(preferences: ModelPreferences, choices: readonly T[], defaultName: string): ShortcutRow<T>[] {
  return choices.flatMap(choice => {
    const saved = preferences.favorites.filter(item => sameModel(item, choice))
    if (saved.length === 0) return []
    const modelFavorite = (choice.reasoning?.efforts.length ?? 0) === 0 && saved.some(item => item.effort === null)
    return [{ choice, chips: chips(choice, saved.map(item => item.effort), defaultName), ...modelFavorite ? { modelFavorite } : {} }]
  })
}
/** The last applied models with their efforts, skipping combinations already in favorites. */
export function recentRows<T extends PickerChoice>(preferences: ModelPreferences, choices: readonly T[], defaultName: string): ShortcutRow<T>[] {
  return preferences.history.slice(0, RECENT_LIMIT).flatMap(entry => {
    if (entry.effort !== undefined && hasFavorite(preferences, entry.provider, entry.model, entry.effort)) return []
    const choice = choices.find(item => sameModel(item, entry))
    if (choice === undefined) return []
    return [{ choice, chips: entry.effort === undefined ? [] : chips(choice, [entry.effort], defaultName).filter(chip => !chip.stale) }]
  })
}

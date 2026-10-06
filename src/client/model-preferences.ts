/** Browser-local shortcuts; routes remain owned by host settings/session state. */
import type { ModelSelectionConfig } from '../shared.ts'
export interface ModelPreferences { favorites: readonly string[]; recent: readonly string[] }
const KEY = 'dsh-model-switch/picker-v1'
const EMPTY: ModelPreferences = { favorites: [], recent: [] }
export const modelKey = (value: Pick<ModelSelectionConfig, 'provider' | 'model'>): string => JSON.stringify([value.provider, value.model])
let snapshot: ModelPreferences = EMPTY
let initialized = false
const listeners = new Set<() => void>()
function read(): ModelPreferences {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<ModelPreferences>
    const strings = (value: unknown): string[] => Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === 'string'))] : []
    return { favorites: strings(data?.favorites).slice(0, 40), recent: strings(data?.recent).slice(0, 6) }
  } catch { return EMPTY }
}
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
  initialize()
  snapshot = next
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* Optional shortcuts remain usable for this page. */ }
  for (const notify of listeners) notify()
}
export const modelPreferences = {
  getSnapshot: (): ModelPreferences => { initialize(); return snapshot },
  subscribe: (notify: () => void): (() => void) => { initialize(); listeners.add(notify); return () => { listeners.delete(notify) } },
  toggleFavorite(value: ModelSelectionConfig): void {
    const key = modelKey(value)
    publish({ ...snapshot, favorites: snapshot.favorites.includes(key) ? snapshot.favorites.filter(item => item !== key) : [...snapshot.favorites, key] })
  },
  remember(value: ModelSelectionConfig): void {
    const key = modelKey(value)
    publish({ ...snapshot, recent: [key, ...snapshot.recent.filter(item => item !== key)].slice(0, 6) })
  },
}

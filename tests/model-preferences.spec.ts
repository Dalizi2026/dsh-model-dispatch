import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const V1 = 'dsh-model-switch/picker-v1'
const V2 = 'dsh-model-switch/picker-v2'
let storage: Map<string, string>
beforeEach(() => {
  storage = new Map()
  vi.stubGlobal('window', { addEventListener() {} })
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value) },
  })
  vi.resetModules()
})
afterEach(() => { vi.unstubAllGlobals() })
const load = () => import('../src/client/model-preferences.ts')

const efforts = [{ id: 'low', name: 'Low' }, { id: 'high', name: 'High' }, { id: 'max', name: 'Max' }]
const opus = { provider: 'factory', model: 'opus', reasoning: { efforts, defaultEffort: 'high' } }
const sonnet = { provider: 'factory', model: 'sonnet', reasoning: { efforts, defaultEffort: 'low' } }
const glm = { provider: 'go', model: 'glm' }
const catalog = [opus, sonnet, glm]

describe('favorites keep exact model + effort combinations', () => {
  it('saves several efforts of one model and removes only the toggled one', async () => {
    const { modelPreferences } = await load()
    modelPreferences.toggleFavorite({ provider: 'factory', model: 'opus', reasoningEffort: 'high' })
    modelPreferences.toggleFavorite({ provider: 'factory', model: 'opus', reasoningEffort: 'max' })
    modelPreferences.toggleFavorite({ provider: 'factory', model: 'opus' })
    expect(modelPreferences.getSnapshot().favorites.map(item => item.effort)).toEqual(['high', 'max', null])
    modelPreferences.toggleFavorite({ provider: 'factory', model: 'opus', reasoningEffort: 'max' })
    expect(modelPreferences.getSnapshot().favorites.map(item => item.effort)).toEqual(['high', null])
    expect(JSON.parse(storage.get(V2)!).favorites).toEqual([['factory', 'opus', 'high'], ['factory', 'opus', null]])
  })

  it('refuses a new favorite past the limit without dropping saved ones', async () => {
    const { modelPreferences, MAX_FAVORITES } = await load()
    for (let index = 0; index < MAX_FAVORITES; index++) expect(modelPreferences.toggleFavorite({ provider: 'p', model: `m${index}` })).toBe(true)
    expect(modelPreferences.toggleFavorite({ provider: 'p', model: 'extra' })).toBe(false)
    expect(modelPreferences.getSnapshot().favorites).toHaveLength(MAX_FAVORITES)
    expect(modelPreferences.toggleFavorite({ provider: 'p', model: 'm0' })).toBe(true)
    expect(modelPreferences.getSnapshot().favorites).toHaveLength(MAX_FAVORITES - 1)
  })
})

describe('v1 migration', () => {
  it('turns model favorites into provider-default favorites and keeps recents without an effort record', async () => {
    storage.set(V1, JSON.stringify({ favorites: [JSON.stringify(['factory', 'opus']), 'broken', 7], recent: [JSON.stringify(['factory', 'sonnet'])] }))
    const { modelPreferences, startingEffort, recentRows } = await load()
    const snapshot = modelPreferences.getSnapshot()
    expect(snapshot.favorites).toEqual([{ provider: 'factory', model: 'opus', effort: null }])
    expect(snapshot.history).toEqual([{ provider: 'factory', model: 'sonnet' }])
    expect(startingEffort(snapshot, sonnet)).toBe('low')
    expect(recentRows(snapshot, catalog, 'Default')).toEqual([{ choice: sonnet, chips: [] }])
    modelPreferences.remember({ provider: 'go', model: 'glm' })
    expect(storage.get(V1)).toBe(JSON.stringify({ favorites: [JSON.stringify(['factory', 'opus']), 'broken', 7], recent: [JSON.stringify(['factory', 'sonnet'])] }))
    expect(JSON.parse(storage.get(V2)!).history).toEqual([['go', 'glm', null], ['factory', 'sonnet']])
  })

  it('does not fall back to v1 once v2 exists, even when v2 is unreadable', async () => {
    storage.set(V1, JSON.stringify({ favorites: [JSON.stringify(['factory', 'opus'])] }))
    storage.set(V2, '{broken')
    const { modelPreferences } = await load()
    expect(modelPreferences.getSnapshot()).toEqual({ favorites: [], history: [] })
  })
})

describe('starting effort for a model picked by name', () => {
  it('uses the last applied effort, provider default when it was chosen, and the adapter default otherwise', async () => {
    const { modelPreferences, startingEffort } = await load()
    expect(startingEffort(modelPreferences.getSnapshot(), opus)).toBe('high')
    modelPreferences.remember({ provider: 'factory', model: 'opus', reasoningEffort: 'max' })
    expect(startingEffort(modelPreferences.getSnapshot(), opus)).toBe('max')
    modelPreferences.remember({ provider: 'factory', model: 'opus' })
    expect(startingEffort(modelPreferences.getSnapshot(), opus)).toBeUndefined()
    modelPreferences.remember({ provider: 'factory', model: 'opus', reasoningEffort: 'retired' })
    expect(startingEffort(modelPreferences.getSnapshot(), opus)).toBe('high')
    expect(modelPreferences.getSnapshot().history).toHaveLength(1)
  })
})

describe('shortcut rows', () => {
  it('groups favorites into one row per model with chips in the model order', async () => {
    const { modelPreferences, favoriteRows } = await load()
    for (const reasoningEffort of ['max', 'retired', undefined, 'low']) modelPreferences.toggleFavorite({ provider: 'factory', model: 'opus', ...reasoningEffort === undefined ? {} : { reasoningEffort } })
    modelPreferences.toggleFavorite({ provider: 'go', model: 'glm' })
    modelPreferences.toggleFavorite({ provider: 'gone', model: 'model', reasoningEffort: 'high' })
    const rows = favoriteRows(modelPreferences.getSnapshot(), catalog, 'Default')
    expect(rows.map(row => row.choice.model)).toEqual(['opus', 'glm'])
    expect(rows[0]!.chips).toEqual([
      { effort: null, name: 'Default', stale: false },
      { effort: 'low', name: 'Low', stale: false },
      { effort: 'max', name: 'Max', stale: false },
      { effort: 'retired', name: 'retired', stale: true },
    ])
    expect(rows[1]!.chips).toEqual([])
    expect(modelPreferences.getSnapshot().favorites).toHaveLength(6)
  })

  it('lists the six newest applied models and skips combinations already favorited', async () => {
    const { modelPreferences, recentRows } = await load()
    modelPreferences.remember({ provider: 'factory', model: 'sonnet', reasoningEffort: 'high' })
    modelPreferences.remember({ provider: 'go', model: 'glm' })
    modelPreferences.remember({ provider: 'factory', model: 'opus', reasoningEffort: 'max' })
    modelPreferences.toggleFavorite({ provider: 'factory', model: 'sonnet', reasoningEffort: 'high' })
    const rows = recentRows(modelPreferences.getSnapshot(), catalog, 'Default')
    expect(rows.map(row => [row.choice.model, row.chips.map(chip => chip.effort)])).toEqual([['opus', ['max']], ['glm', []]])
    for (let index = 0; index < 6; index++) modelPreferences.remember({ provider: 'other', model: `m${index}` })
    expect(recentRows(modelPreferences.getSnapshot(), catalog, 'Default')).toEqual([])
  })
})

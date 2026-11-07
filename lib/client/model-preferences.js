const KEY = 'dsh-model-switch/picker-v2';
/** Read only to migrate; never written, so an older plugin keeps its own shortcuts. */
const LEGACY_KEY = 'dsh-model-switch/picker-v1';
export const MAX_FAVORITES = 40;
const MAX_HISTORY = 100;
const RECENT_LIMIT = 6;
const EMPTY = { favorites: [], history: [] };
export const modelKey = (value) => JSON.stringify([value.provider, value.model]);
export const choiceKey = (provider, model, effort) => JSON.stringify([provider, model, effort]);
export const effortOf = (value) => value.reasoningEffort ?? null;
const sameModel = (a, b) => a.provider === b.provider && a.model === b.model;
function tuple(value) {
    if (!Array.isArray(value) || value.length < 2 || value.length > 3)
        return undefined;
    const [provider, model, effort] = value;
    if (typeof provider !== 'string' || typeof model !== 'string' || provider.length === 0 || model.length === 0)
        return undefined;
    if (value.length === 2)
        return { provider, model };
    if (effort !== null && (typeof effort !== 'string' || effort.length === 0))
        return undefined;
    return { provider, model, effort };
}
function normalize(favorites, history) {
    const combos = new Set();
    const savedFavorites = [];
    for (const item of favorites) {
        const choice = tuple(item);
        if (choice?.effort === undefined || savedFavorites.length === MAX_FAVORITES)
            continue;
        const key = choiceKey(choice.provider, choice.model, choice.effort);
        if (combos.has(key))
            continue;
        combos.add(key);
        savedFavorites.push({ provider: choice.provider, model: choice.model, effort: choice.effort });
    }
    const models = new Set();
    const savedHistory = [];
    for (const item of history) {
        const choice = tuple(item);
        if (choice === undefined || models.has(modelKey(choice)) || savedHistory.length === MAX_HISTORY)
            continue;
        models.add(modelKey(choice));
        savedHistory.push(choice);
    }
    return { favorites: savedFavorites, history: savedHistory };
}
const list = (value) => Array.isArray(value) ? value : [];
/** v1 saved model keys only: favorites keep the provider default, recents keep no effort record. */
function migrate(raw) {
    if (raw === null)
        return EMPTY;
    const data = JSON.parse(raw);
    const legacy = (value) => list(value).flatMap(item => {
        if (typeof item !== 'string')
            return [];
        try {
            const parsed = JSON.parse(item);
            return Array.isArray(parsed) && parsed.length === 2 ? [parsed] : [];
        }
        catch {
            return [];
        }
    });
    return normalize(legacy(data?.favorites).map(item => [...item, null]), legacy(data?.recent));
}
function read() {
    try {
        const raw = localStorage.getItem(KEY);
        if (raw === null)
            return migrate(localStorage.getItem(LEGACY_KEY));
        const data = JSON.parse(raw);
        return normalize(list(data?.favorites), list(data?.history));
    }
    catch {
        return EMPTY;
    }
}
function serialize(value) {
    return JSON.stringify({
        version: 2,
        favorites: value.favorites.map(item => [item.provider, item.model, item.effort]),
        history: value.history.map(item => item.effort === undefined ? [item.provider, item.model] : [item.provider, item.model, item.effort]),
    });
}
let snapshot = EMPTY;
let initialized = false;
const listeners = new Set();
function initialize() {
    if (initialized || typeof window === 'undefined')
        return;
    initialized = true;
    snapshot = read();
    window.addEventListener('storage', event => {
        if (event.key !== KEY && event.key !== null)
            return;
        snapshot = read();
        for (const notify of listeners)
            notify();
    });
}
function publish(next) {
    snapshot = next;
    try {
        localStorage.setItem(KEY, serialize(next));
    }
    catch { /* Optional shortcuts remain usable for this page. */ }
    for (const notify of listeners)
        notify();
}
export const modelPreferences = {
    getSnapshot: () => { initialize(); return snapshot; },
    subscribe: (notify) => { initialize(); listeners.add(notify); return () => { listeners.delete(notify); }; },
    /** Adds or removes one exact model + effort; returns false when a new favorite would exceed the limit. */
    toggleFavorite(value) {
        initialize();
        const effort = effortOf(value);
        const key = choiceKey(value.provider, value.model, effort);
        const saved = snapshot.favorites.some(item => choiceKey(item.provider, item.model, item.effort) === key);
        if (!saved && snapshot.favorites.length >= MAX_FAVORITES)
            return false;
        publish({
            ...snapshot,
            favorites: saved
                ? snapshot.favorites.filter(item => choiceKey(item.provider, item.model, item.effort) !== key)
                : [...snapshot.favorites, { provider: value.provider, model: value.model, effort }],
        });
        return true;
    },
    /** Records an applied selection: it becomes the newest recent and this model's last effort. */
    remember(value) {
        initialize();
        publish({
            ...snapshot,
            history: [{ provider: value.provider, model: value.model, effort: effortOf(value) }, ...snapshot.history.filter(item => !sameModel(item, value))].slice(0, MAX_HISTORY),
        });
    },
};
export function isFavorite(preferences, value) {
    const key = choiceKey(value.provider, value.model, effortOf(value));
    return preferences.favorites.some(item => choiceKey(item.provider, item.model, item.effort) === key);
}
/**
 * Effort for a model picked by name: the effort last applied with it when the
 * model still supports it, otherwise the adapter default. Undefined means the
 * provider default.
 */
export function startingEffort(preferences, choice) {
    const last = preferences.history.find(item => sameModel(item, choice))?.effort;
    if (last === null)
        return undefined;
    if (last !== undefined && choice.reasoning?.efforts.some(level => level.id === last))
        return last;
    return choice.reasoning?.defaultEffort;
}
/** Saved efforts in the model's own order; provider default first, unsupported ones last. */
function chips(choice, efforts, defaultName) {
    const supported = choice.reasoning?.efforts ?? [];
    const result = [];
    if (supported.length > 0 && efforts.includes(null))
        result.push({ effort: null, name: defaultName, stale: false });
    for (const level of supported)
        if (efforts.includes(level.id))
            result.push({ effort: level.id, name: level.name, stale: false });
    for (const effort of efforts) {
        if (effort !== null && !supported.some(level => level.id === effort))
            result.push({ effort, name: effort, stale: true });
    }
    return result;
}
/** One row per favorited model, in catalog order; models absent from the catalog stay hidden but saved. */
export function favoriteRows(preferences, choices, defaultName) {
    return choices.flatMap(choice => {
        const saved = preferences.favorites.filter(item => sameModel(item, choice));
        return saved.length === 0 ? [] : [{ choice, chips: chips(choice, saved.map(item => item.effort), defaultName) }];
    });
}
/** The last applied models with their efforts, skipping combinations already in favorites. */
export function recentRows(preferences, choices, defaultName) {
    return preferences.history.slice(0, RECENT_LIMIT).flatMap(entry => {
        if (entry.effort !== undefined && isFavorite(preferences, { provider: entry.provider, model: entry.model, ...entry.effort === null ? {} : { reasoningEffort: entry.effort } }))
            return [];
        const choice = choices.find(item => sameModel(item, entry));
        if (choice === undefined)
            return [];
        return [{ choice, chips: entry.effort === undefined ? [] : chips(choice, [entry.effort], defaultName).filter(chip => !chip.stale) }];
    });
}

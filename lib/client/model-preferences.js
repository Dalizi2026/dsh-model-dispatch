const KEY = 'dsh-model-switch/picker-v1';
const EMPTY = { favorites: [], recent: [] };
export const modelKey = (value) => JSON.stringify([value.provider, value.model]);
let snapshot = EMPTY;
let initialized = false;
const listeners = new Set();
function read() {
    try {
        const data = JSON.parse(localStorage.getItem(KEY) ?? '{}');
        const strings = (value) => Array.isArray(value) ? [...new Set(value.filter((item) => typeof item === 'string'))] : [];
        return { favorites: strings(data?.favorites).slice(0, 40), recent: strings(data?.recent).slice(0, 6) };
    }
    catch {
        return EMPTY;
    }
}
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
    initialize();
    snapshot = next;
    try {
        localStorage.setItem(KEY, JSON.stringify(next));
    }
    catch { /* Optional shortcuts remain usable for this page. */ }
    for (const notify of listeners)
        notify();
}
export const modelPreferences = {
    getSnapshot: () => { initialize(); return snapshot; },
    subscribe: (notify) => { initialize(); listeners.add(notify); return () => { listeners.delete(notify); }; },
    toggleFavorite(value) {
        const key = modelKey(value);
        publish({ ...snapshot, favorites: snapshot.favorites.includes(key) ? snapshot.favorites.filter(item => item !== key) : [...snapshot.favorites, key] });
    },
    remember(value) {
        const key = modelKey(value);
        publish({ ...snapshot, recent: [key, ...snapshot.recent.filter(item => item !== key)].slice(0, 6) });
    },
};

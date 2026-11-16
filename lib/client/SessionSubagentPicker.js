import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/** A clearly labelled child route with an explicit inheritance action. */
import { useEffect, useSyncExternalStore } from 'react';
import { resolveCustomSelection } from "../shared.js";
import { ModelPicker } from "./ModelPicker.js";
import css from './SessionSubagentPicker.module.css';
export function SessionSubagentPicker(props) {
    if (!props.overrides || !props.access || !props.t || !props.store || !props.routes)
        return null;
    return _jsx(SessionSubagentPickerLoaded, { ...props, overrides: props.overrides, store: props.store, routes: props.routes, access: props.access, t: props.t });
}
function SessionSubagentPickerLoaded({ sessionId, overrides, store, routes, access, t, useSessions, locked, available }) {
    const routeSnap = useSyncExternalStore(routes.subscribe, () => routes.get(sessionId));
    useEffect(() => routes.watch(sessionId), [routes, sessionId]);
    const snap = useSyncExternalStore(overrides.subscribe, overrides.getSnapshot);
    const settings = useSyncExternalStore(listener => store.subscribe(listener), () => store.getSnapshot());
    const subagent = useSessions(state => state.byId[sessionId]?.origin === 'subagent');
    const mainSelection = useSessions(state => state.projectionsBySession[sessionId]?.values.modelSelection ?? state.byId[sessionId]?.projectionValues?.modelSelection);
    useEffect(() => {
        if (subagent)
            return;
        overrides.start();
        return () => { overrides.stop(); };
    }, [overrides, subagent]);
    if (subagent || available === false)
        return null;
    const override = snap.value[sessionId];
    const defaultRoute = resolveCustomSelection(settings.value.subagent);
    // Show the resolved inherited model, but never persist it implicitly.
    const inherited = defaultRoute ?? mainSelection?.next ?? mainSelection?.lastUsed ?? access.currentSelection(sessionId);
    const state = routeSnap.value;
    const problem = routeSnap.error ?? state?.error ?? snap.error;
    const healthy = state?.health === 'ready' && state.state === 'ready' && !problem;
    const unverified = state?.state === 'unverified';
    const statusLabel = healthy ? t('routeReady') : problem ? (state?.state === 'missing' ? t('routeSessionMissing') : state?.state === 'blocked' ? t('routeBlocked') : t('routeUnavailable')) : unverified ? t('routeUnverified') : t('statusLoading');
    const routeMessage = statusLabel;
    const write = async (selection) => {
        await overrides.set(sessionId, selection);
        const confirmed = await routes.refresh(sessionId);
        if (confirmed.health !== 'ready' || !['ready', 'unverified'].includes(confirmed.state))
            throw new Error(confirmed.error ?? t('routeBlocked'));
    };
    return _jsxs("div", { className: css.wrap, children: [_jsx(ModelPicker, { compact: true, disabled: locked || !state || state.health !== 'ready', sessionId: sessionId, access: access, value: state?.expected ?? override ?? inherited, onChange: selection => write(selection), placement: "top", roleLabel: t('chatSubagentRole'), sourceLabel: t(override ? 'sessionSource' : defaultRoute ? 'defaultSource' : 'followingMain'), scopeHint: t('subagentScope'), t: t, seed: false, onClear: override ? () => write(undefined) : undefined, clearLabel: t('sessionPickerClear') }), _jsx("span", { className: problem ? css.error : css.status, role: "status", "aria-label": statusLabel, title: statusLabel, children: problem ? `${routeMessage}: ${problem}` : healthy ? '✓' : unverified ? t('routeUnverifiedShort') : '…' })] });
}

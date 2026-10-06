import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/** A clearly labelled child route with an explicit inheritance action. */
import { useEffect, useSyncExternalStore } from 'react';
import { resolveCustomSelection } from "../shared.js";
import { ModelPicker } from "./ModelPicker.js";
import css from './SessionSubagentPicker.module.css';
export function SessionSubagentPicker(props) {
    if (!props.overrides || !props.access || !props.t || !props.store)
        return null;
    return _jsx(SessionSubagentPickerLoaded, { ...props, overrides: props.overrides, store: props.store, access: props.access, t: props.t });
}
function SessionSubagentPickerLoaded({ sessionId, overrides, store, access, t, useSessions, locked, available }) {
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
    if (subagent || available === false || snap.unavailable)
        return null;
    const override = snap.value[sessionId];
    const defaultRoute = resolveCustomSelection(settings.value.subagent);
    // Show the resolved inherited model, but never persist it implicitly.
    const inherited = defaultRoute ?? mainSelection?.next ?? mainSelection?.lastUsed ?? access.currentSelection(sessionId);
    const write = (selection) => overrides.set(sessionId, selection);
    return _jsxs("div", { className: css.wrap, children: [_jsx(ModelPicker, { compact: true, disabled: locked, sessionId: sessionId, access: access, value: override ?? inherited, onChange: write, placement: "top", roleLabel: t('chatSubagentRole'), sourceLabel: t(override ? 'sessionSource' : defaultRoute ? 'defaultSource' : 'followingMain'), scopeHint: t('subagentScope'), t: t, seed: false, onClear: override ? () => overrides.set(sessionId, undefined) : undefined, clearLabel: t('sessionPickerClear') }), snap.error && _jsxs("span", { className: css.error, role: "status", children: [t('loadError'), ": ", snap.error] })] });
}

import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/** Only host-acknowledged locks and admitted request facts are shown here. */
import { useEffect, useSyncExternalStore } from 'react';
import { ModelPicker } from "./ModelPicker.js";
import css from './SubagentModelBadge.module.css';
const describe = (value) => value ? `${value.provider}/${value.model}${value.reasoningEffort ? ' · ' + value.reasoningEffort : ''}` : '—';
export function SubagentModelBadge(props) {
    if (!props.routes || !props.access || !props.t)
        return null;
    return _jsx(Loaded, { ...props, routes: props.routes, access: props.access, t: props.t });
}
function Loaded({ sessionId, useSessions, routes, access, t }) {
    const origin = useSessions(state => state.byId[sessionId]?.origin);
    const snap = useSyncExternalStore(routes.subscribe, () => routes.get(sessionId));
    useEffect(() => origin === 'subagent' ? routes.watch(sessionId) : undefined, [routes, sessionId, origin]);
    if (origin !== 'subagent')
        return null;
    const status = snap.value;
    const source = status?.source;
    const sourceText = source ? t(source === 'session' ? 'sessionSource' : source === 'default' ? 'defaultSource' : source === 'follow-main' ? 'followingMain' : source === 'inherited-lock' ? 'routeInherited' : 'routeConfirmed') : '—';
    return _jsxs("details", { className: css.details, "data-model-switch-badge": "", children: [_jsx("summary", { className: css.badge, children: snap.error ? t('routeUnavailable') : status?.state === 'blocked' ? t('routeBlocked') : status?.state === 'confirmation-required' ? t('routeConfirmRequired') : status?.state === 'locked' ? `${t('routeLocked')} · ${status.expected?.model}` : t('statusLoading') }), _jsxs("div", { className: css.panel, children: [(snap.error || status?.error) && _jsx("p", { role: "alert", children: snap.error ?? status?.error }), status?.state === 'confirmation-required' && status.parentId && _jsx(ModelPicker, { sessionId: sessionId, access: access, value: undefined, onChange: selection => routes.confirm(status.parentId, sessionId, selection), roleLabel: t('routeConfirm'), scopeHint: t('routeConfirmHint'), t: t }), status?.expected && _jsxs(_Fragment, { children: [_jsxs("p", { children: [t('routeExpected'), ": ", describe(status.expected)] }), _jsxs("p", { children: [t('routeActual'), ": ", status.actual ? describe(status.actual) : t('routeNoRequest')] }), _jsxs("p", { children: [t('routeSource'), ": ", sourceText] })] }), status?.conflict && _jsxs("p", { children: [t('routeConflict'), ": ", describe(status.conflict)] })] })] });
}

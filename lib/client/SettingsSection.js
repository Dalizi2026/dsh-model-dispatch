import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/** Three settings rows, with only the scope needed to choose a model. */
import { useId, useState, useSyncExternalStore } from 'react';
import { resolveCustomSelection } from "../shared.js";
import { ModelPicker } from "./ModelPicker.js";
import css from './styles.module.css';
function SettingRow({ title, hint, children }) {
    const id = useId();
    return _jsxs("section", { className: css.settingRow, "aria-labelledby": id, children: [_jsxs("div", { className: css.settingCopy, children: [_jsx("h3", { id: id, className: css.settingTitle, children: title }), _jsx("p", { className: css.settingHint, children: hint })] }), _jsx("div", { className: css.settingControl, children: children })] });
}
function RouteRow({ title, hint, route, save, access, t, busy }) {
    const selection = resolveCustomSelection(route);
    return _jsx(SettingRow, { title: title, hint: hint, children: _jsx(ModelPicker, { stretch: true, sessionId: undefined, access: access, value: selection, disabled: busy, t: t, controlLabel: title, fallbackLabel: route.mode === 'custom' ? t('triggerFallback') : t('modeFollow'), onChange: selection => save({ mode: 'custom', selection }), onClear: route.mode === 'custom' ? () => save({ mode: 'follow-main', selection: route.selection }) : undefined, clearLabel: t('modeFollow') }) });
}
export function SettingsSection(props) {
    if (!props.store || !props.mainStore || !props.access || !props.t)
        return null;
    return _jsx(SettingsSectionLoaded, { store: props.store, mainStore: props.mainStore, access: props.access, t: props.t });
}
function SettingsSectionLoaded({ store, mainStore, access, t }) {
    const snap = useSyncExternalStore(listener => store.subscribe(listener), () => store.getSnapshot());
    const main = useSyncExternalStore(listener => mainStore.subscribe(listener), () => mainStore.getSnapshot());
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const save = async (write) => {
        setSaving(true);
        setMessage(null);
        setError(null);
        try {
            await write();
            setMessage(t('saved'));
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
            throw cause;
        }
        finally {
            setSaving(false);
        }
    };
    const saveRoute = (field) => (next) => save(() => store.saveRoute(field, next));
    const busy = saving || snap.status !== 'ready';
    return _jsxs("div", { className: css.section, "data-model-switch-settings": "", children: [_jsxs("header", { className: css.settingsHeader, children: [_jsx("h2", { className: css.title, children: t('title') }), _jsx("span", { className: css.saveStatus, role: "status", children: saving ? t('statusSaving') : message })] }), (error || snap.error) && _jsxs("p", { className: css.error, role: "alert", children: [t('saveError'), ": ", error ?? t('unavailable')] }), _jsxs("div", { className: css.settingsList, children: [_jsx(SettingRow, { title: t('mainTitle'), hint: t('mainHint'), children: main.status === 'error' ? _jsx("p", { className: css.error, children: t('mainUnavailable') }) : _jsx(ModelPicker, { stretch: true, sessionId: undefined, access: access, value: main.value, disabled: saving || main.status !== 'ready', t: t, controlLabel: t('mainTitle'), fallbackLabel: main.status === 'loading' ? t('statusLoading') : undefined, onChange: next => save(() => mainStore.save(next)) }) }), _jsx(RouteRow, { title: t('subagentTitle'), hint: t('subagentHint'), route: snap.value.subagent ?? { mode: 'follow-main' }, save: saveRoute('subagent'), access: access, t: t, busy: busy }), _jsx(RouteRow, { title: t('planPlanningTitle'), hint: t('planPlanningHint'), route: snap.value.planPlanning ?? { mode: 'follow-main' }, save: saveRoute('planPlanning'), access: access, t: t, busy: busy })] })] });
}

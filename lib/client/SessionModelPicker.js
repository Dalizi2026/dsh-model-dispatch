import { jsx as _jsx } from "react/jsx-runtime";
/** The main-session chip uses native admission and live projection state. */
import { useSyncExternalStore } from 'react';
import { ModelPicker } from "./ModelPicker.js";
export function SessionModelPicker(props) {
    if (!props.access || !props.remote || !props.mainStore || !props.t)
        return null;
    return _jsx(SessionModelPickerLoaded, { ...props, access: props.access, remote: props.remote, mainStore: props.mainStore, t: props.t, available: props.available === true });
}
function SessionModelPickerLoaded({ sessionId, useSessions, access, remote, mainStore, t, locked, available }) {
    const projection = useSessions(state => state.projectionsBySession[sessionId]?.values.modelSelection ?? state.byId[sessionId]?.projectionValues?.modelSelection);
    const main = useSyncExternalStore(listener => mainStore.subscribe(listener), () => mainStore.getSnapshot());
    const value = projection?.next ?? projection?.lastUsed ?? main.value;
    const save = async (selection) => {
        const result = await remote.session.selectModel({ sessionId, ...selection });
        if (!result.ok)
            throw new Error(result.error.message);
    };
    return _jsx(ModelPicker, { compact: true, sessionId: sessionId, access: access, value: value, onChange: save, t: t, placement: "top", roleLabel: t('chatMainRole'), disabled: locked || !available, scopeHint: t('mainScope'), sourceLabel: t(projection?.next || projection?.lastUsed ? 'sessionSource' : 'defaultSource'), seed: false });
}

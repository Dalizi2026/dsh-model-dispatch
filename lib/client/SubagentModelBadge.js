import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Session-hierarchy neighbour: show the active subagent's model label.
 */
import { useEffect, useSyncExternalStore } from 'react';
import css from './SubagentModelBadge.module.css';
export function SubagentModelBadge(props) {
    const { sessionId, useSessions, labels } = props;
    if (labels === undefined)
        return null;
    const origin = useSessions((state) => state.byId[sessionId]?.origin);
    const snap = useSyncExternalStore(labels.subscribe, labels.getSnapshot);
    useEffect(() => {
        labels.start();
        return () => { labels.stop(); };
    }, [labels]);
    if (origin !== 'subagent')
        return null;
    const text = snap.value[sessionId];
    if (text === undefined || text.length === 0)
        return null;
    return (_jsx("span", { className: css.badge, title: text, "data-model-switch-badge": "", children: text }));
}

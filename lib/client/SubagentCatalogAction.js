import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, } from 'react';
import { IconChevronDownOutlineMedium, IconChevronRightOutlineMedium, IconRefreshOutlineMedium, StateDot, } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './SubagentCatalogAction.module.css';
/** Tally subagent-origin descendants (all depths) per parent session id. */
function indexSubagentDescendants(summaries) {
    const children = new Map();
    for (const summary of Object.values(summaries)) {
        if (summary.origin !== 'subagent' || summary.parentId === undefined)
            continue;
        const siblings = children.get(summary.parentId);
        if (siblings === undefined)
            children.set(summary.parentId, [summary]);
        else
            siblings.push(summary);
    }
    const index = new Map();
    for (const [rootId, roots] of children) {
        let count = 0;
        let runningCount = 0;
        const queue = [...roots];
        while (queue.length > 0) {
            const node = queue.pop();
            count += 1;
            if (node.running)
                runningCount += 1;
            const grandChildren = children.get(node.id);
            if (grandChildren !== undefined)
                queue.push(...grandChildren);
        }
        index.set(rootId, { count, runningCount });
    }
    return index;
}
function treeItems(root) {
    return root === null
        ? []
        : Array.from(root.querySelectorAll('[role="treeitem"]:not([aria-disabled="true"])'));
}
/** Compact token count shared in shape with the conversation stats strip. */
function formatTokens(value) {
    const scaled = (next) => next >= 100
        ? String(Math.round(next))
        : String(Math.round(next * 10) / 10);
    if (value < 1_000)
        return String(value);
    if (value < 1_000_000)
        return `${scaled(value / 1_000)}K`;
    return `${scaled(value / 1_000_000)}M`;
}
/** Sum the four disjoint durable provider-usage buckets. */
function tokenTotal(usage) {
    return usage === undefined
        ? undefined
        : usage.uncachedInputTokens + usage.outputTokens
            + usage.cacheReadTokens + usage.cacheWriteTokens;
}
/** Exact whole-second active-turn duration for one catalog row. */
function activityDuration(summary, activity, now) {
    if (summary === undefined)
        return undefined;
    const timing = summary.projectionValues?.subagentTiming;
    if (timing === undefined)
        return undefined;
    if (timing.active === undefined)
        return timing.settledMs;
    const end = activity === 'running'
        ? now
        : timing.active.through;
    return timing.settledMs + Math.max(0, end - timing.active.since);
}
function splitDuration(ms) {
    const totalSeconds = Math.floor(Math.max(0, ms) / 1_000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    return {
        seconds: totalSeconds % 60,
        minutes: totalMinutes % 60,
        hours: totalHours % 24,
        days: Math.floor(totalHours / 24),
        totalMinutes,
        totalHours,
    };
}
/** Format a duration with decreasing visual precision at larger scales. */
function formatDuration(ms, t) {
    const { seconds, minutes, hours, days, totalMinutes, totalHours } = splitDuration(ms);
    if (days >= 365) {
        const years = Math.floor(days / 365);
        const months = Math.floor((days % 365) / 30);
        return months === 0
            ? t('duration.years', { years })
            : t('duration.yearsMonths', { years, months });
    }
    if (days >= 30) {
        const months = Math.floor(days / 30);
        const remainingDays = days % 30;
        return remainingDays === 0
            ? t('duration.months', { months })
            : t('duration.monthsDays', { months, days: remainingDays });
    }
    if (days > 0) {
        return hours === 0
            ? t('duration.days', { days })
            : t('duration.daysHours', { days, hours });
    }
    if (totalHours > 0) {
        return t('duration.hours', {
            hours: totalHours,
            minutes: String(minutes).padStart(2, '0'),
            seconds: String(seconds).padStart(2, '0'),
        });
    }
    if (totalMinutes > 0) {
        return t('duration.minutes', {
            minutes: totalMinutes,
            seconds: String(seconds).padStart(2, '0'),
        });
    }
    return t('duration.seconds', { seconds });
}
/** Preserve exact whole seconds for hover and accessible naming. */
function formatExactDuration(ms, t) {
    const { seconds, minutes, hours, days } = splitDuration(ms);
    return days === 0
        ? formatDuration(ms, t)
        : t('duration.exactDays', {
            days,
            hours: String(hours).padStart(2, '0'),
            minutes: String(minutes).padStart(2, '0'),
            seconds: String(seconds).padStart(2, '0'),
        });
}
const NO_DESCENDANTS = { count: 0, runningCount: 0 };
/** A child becomes a known leaf only after its own catalog readies empty. */
function isKnownLeaf(catalog) {
    return catalog?.state === 'ready' && catalog.entries.length === 0;
}
/** Render one catalog level and recurse only through explicitly expanded rows. */
function CatalogRows({ parentSessionId, catalog, catalogs, summaries, expanded, level, now, openChild, refresh, toggleBranch, closeCatalog, modelLabels, t, }) {
    const emptyLoading = catalog.state === 'loading' && catalog.entries.length === 0;
    const reserveDisclosure = catalog.entries.some(entry => !isKnownLeaf(catalogs[entry.id]));
    return (_jsxs(_Fragment, { children: [emptyLoading && _jsx("div", { className: css.notice, children: t('loading.label') }), catalog.state === 'error' && (_jsxs("div", { className: css.error, children: [_jsx("span", { children: catalog.error?.message ?? t('load.error') }), _jsxs("button", { type: "button", className: css.refresh, onClick: () => { refresh(parentSessionId); }, children: [_jsx(IconRefreshOutlineMedium, {}), t('retry')] })] })), catalog.entries.map((entry) => {
                const childCatalog = catalogs[entry.id];
                const isExpanded = expanded.has(entry.id);
                const knownLeaf = !reserveDisclosure || isKnownLeaf(childCatalog);
                const childLoading = childCatalog === undefined
                    || (childCatalog.state === 'loading' && childCatalog.entries.length === 0);
                const summary = summaries[entry.id];
                const label = entry.label ?? entry.id;
                const mode = entry.mode === 'unknown'
                    ? t('mode.unknown')
                    : entry.mode === 'one-shot'
                        ? t('mode.oneShot')
                        : t('mode.continuable');
                const activity = entry.activity === 'running' ? t('activity.running') : t('activity.inactive');
                const secondary = [summary?.title, mode, activity]
                    .filter(value => value !== undefined)
                    .join(' · ');
                const projectionValues = summary?.projectionValues;
                const totalTokens = tokenTotal(projectionValues?.tokenUsage);
                const durationMs = activityDuration(summary, entry.activity, now);
                const modelMetric = modelLabels[entry.id];
                const tokenMetric = totalTokens === undefined
                    ? undefined
                    : `${formatTokens(totalTokens)} tok`;
                const durationMetric = durationMs === undefined
                    ? undefined
                    : {
                        compact: formatDuration(durationMs, t),
                        exact: formatExactDuration(durationMs, t),
                    };
                const metrics = [modelMetric, tokenMetric, durationMetric?.exact]
                    .filter(value => value !== undefined)
                    .join(' · ');
                const open = () => {
                    openChild({ parentSessionId, childSessionId: entry.id, mode: entry.mode });
                    closeCatalog();
                };
                const handleKey = (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        event.stopPropagation();
                        open();
                    }
                    else if ((event.key === 'ArrowRight' && !knownLeaf && !isExpanded)
                        || (event.key === 'ArrowLeft' && isExpanded)) {
                        event.preventDefault();
                        event.stopPropagation();
                        toggleBranch(entry.id);
                    }
                };
                const toggle = (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    toggleBranch(entry.id);
                };
                return (_jsxs("div", { className: css.node, children: [_jsxs("div", { role: "treeitem", tabIndex: 0, "aria-level": level, "aria-label": [label, secondary, metrics].filter(value => value !== '').join(' '), ...knownLeaf ? {} : { 'aria-expanded': isExpanded }, className: css.row, onClick: open, onKeyDown: handleKey, children: [knownLeaf
                                    ? reserveDisclosure && _jsx("span", { className: css.disclosureSpace })
                                    : (_jsx("button", { type: "button", tabIndex: -1, className: `${css.disclosure} ${isExpanded ? css.disclosureOpen : ''}`, "aria-label": t(isExpanded ? 'branch.collapse' : 'branch.expand', { label }), onClick: toggle, children: _jsx(IconChevronRightOutlineMedium, {}) })), _jsxs("div", { className: css.clickarea, children: [_jsx(StateDot, { state: entry.activity === 'running' ? 'ongoing' : 'done' }), _jsxs("span", { className: css.content, children: [_jsx("span", { className: css.label, children: label }), _jsx("span", { className: css.summary, children: secondary })] }), (modelMetric !== undefined || metrics !== '') && (_jsxs("span", { className: css.metrics, children: [modelMetric !== undefined && (_jsx("span", { className: css.metricModel, title: modelMetric, children: modelMetric })), tokenMetric !== undefined && _jsx("span", { className: css.metricToken, children: tokenMetric }), durationMetric !== undefined && (_jsx("span", { className: css.metricDuration, title: t('duration.exactTitle', { duration: durationMetric.exact }), children: durationMetric.compact }))] }))] })] }), isExpanded && !knownLeaf && (_jsx("div", { role: "group", className: css.children, "aria-busy": childLoading || undefined, children: childCatalog === undefined
                                ? _jsx("div", { className: css.notice, children: t('loading.label') })
                                : (_jsx(CatalogRows, { parentSessionId: entry.id, catalog: childCatalog, catalogs: catalogs, summaries: summaries, expanded: expanded, level: level + 1, now: now, openChild: openChild, refresh: refresh, toggleBranch: toggleBranch, closeCatalog: closeCatalog, modelLabels: modelLabels, t: t })) }))] }, entry.id));
            })] }));
}
/**
 * Render the current session's direct catalog and lazily expanded descendants.
 * @param props - session standard props plus catalog navigation actions.
 * @returns The action while the catalog is pending or summaries establish descendants.
 */
export function SubagentCatalogAction(props) {
    const { labels, openChild, refresh, t } = props;
    if (labels === undefined || openChild === undefined || refresh === undefined || t === undefined) {
        return null;
    }
    return (_jsx(SubagentCatalogActionLoaded, { ...props, labels: labels, openChild: openChild, refresh: refresh, t: t }));
}
function SubagentCatalogActionLoaded({ sessionId, useSessions, useSessionStatus, openChild, refresh, labels, t, }) {
    const summaries = useSessions((state) => state.byId);
    const projections = useSessions((state) => state.projectionsBySession);
    const statuses = useSessionStatus((value) => value);
    const labelSnap = useSyncExternalStore(labels.subscribe, labels.getSnapshot);
    const modelLabels = labelSnap.value;
    useEffect(() => {
        labels.start();
        return () => { labels.stop(); };
    }, [labels]);
    // Derive each level's catalog from the shared projections: entries gain a
    // running flag from the status map, falling back to summary rows.
    const catalogs = useMemo(() => Object.fromEntries(Object.entries(projections).map(([id, snapshot]) => [id, {
            state: snapshot.state === 'idle'
                ? (snapshot.values.subagentCatalog === undefined ? 'loading' : 'ready')
                : snapshot.state,
            error: snapshot.error,
            entries: (snapshot.values.subagentCatalog ?? []).map(entry => ({
                ...entry,
                activity: (statuses.get(entry.id)?.running ?? summaries[entry.id]?.running) === true
                    ? 'running'
                    : 'inactive',
            })),
        }])), [projections, summaries, statuses]);
    const catalog = catalogs[sessionId];
    const [open, setOpen] = useState(false);
    const [now, setNow] = useState(() => Date.now());
    const [expanded, setExpanded] = useState(() => new Set());
    const rootRef = useRef(null);
    const triggerRef = useRef(null);
    const descendants = useMemo(() => indexSubagentDescendants(summaries).get(sessionId) ?? NO_DESCENDANTS, [sessionId, summaries]);
    const healthy = catalog?.entries ?? [];
    // The catalog can arrive before the session-list baseline; never undercount
    // the already-visible direct rows during that short bootstrap window.
    const descendantCount = Math.max(healthy.length, descendants.count);
    const totalCountKey = descendantCount === 1 ? 'count.total.one' : 'count.total.other';
    const runningCountKey = descendants.runningCount === 1 ? 'count.running.one' : 'count.running.other';
    const closeAllCatalogs = () => {
        setExpanded(new Set());
    };
    const changeOpen = (next, restoreFocus = false) => {
        setOpen(next);
        if (next)
            setNow(Date.now());
        else
            closeAllCatalogs();
        if (restoreFocus)
            queueMicrotask(() => { triggerRef.current?.focus(); });
    };
    const closeBranch = (root) => {
        const closing = new Set();
        const visit = (parentSessionId) => {
            if (closing.has(parentSessionId) || !expanded.has(parentSessionId))
                return;
            closing.add(parentSessionId);
            for (const entry of catalogs[parentSessionId]?.entries ?? [])
                visit(entry.id);
        };
        visit(root);
        setExpanded(current => new Set([...current].filter(id => !closing.has(id))));
    };
    const toggleBranch = (childSessionId) => {
        if (expanded.has(childSessionId)) {
            closeBranch(childSessionId);
            return;
        }
        setExpanded(current => new Set(current).add(childSessionId));
    };
    useEffect(() => {
        if (!open)
            return;
        const closeOutside = (event) => {
            if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
                changeOpen(false);
            }
        };
        document.addEventListener('pointerdown', closeOutside);
        return () => { document.removeEventListener('pointerdown', closeOutside); };
    }, [open]);
    useEffect(() => {
        if (!open || descendants.runningCount === 0)
            return;
        const timer = setInterval(() => { setNow(Date.now()); }, 1_000);
        return () => { clearInterval(timer); };
    }, [open, descendants.runningCount]);
    // Visibility needs evidence of children (entries, summary-known descendants,
    // or a failed load worth retrying). A bare loading catalog is not evidence:
    // selecting any session schedules a refresh whose loading snapshot would
    // otherwise flash the action in and out on childless sessions.
    const visible = catalog !== undefined
        && (catalog.state === 'error' || catalog.entries.length > 0 || descendantCount > 0);
    useEffect(() => {
        if (visible || !open)
            return;
        setOpen(false);
        closeAllCatalogs();
    }, [visible, open]);
    if (!visible)
        return null;
    const focusAt = (index) => {
        const items = treeItems(rootRef.current);
        if (items.length === 0)
            return;
        items[(index + items.length) % items.length]?.focus();
    };
    const navigate = (event) => {
        const items = treeItems(rootRef.current);
        const index = items.indexOf(document.activeElement);
        if (event.key === 'Escape') {
            event.preventDefault();
            changeOpen(false, true);
        }
        else if (event.key === 'Home') {
            event.preventDefault();
            focusAt(0);
        }
        else if (event.key === 'End') {
            event.preventDefault();
            focusAt(items.length - 1);
        }
        else if (event.key === 'ArrowDown') {
            event.preventDefault();
            focusAt(index + 1);
        }
        else if (event.key === 'ArrowUp') {
            event.preventDefault();
            focusAt(index < 0 ? items.length - 1 : index - 1);
        }
    };
    return (_jsxs("div", { className: css.root, ref: rootRef, onKeyDown: navigate, children: [_jsxs("button", { ref: triggerRef, type: "button", className: css.trigger, "aria-haspopup": "tree", "aria-expanded": open, "aria-label": t(descendants.runningCount > 0 ? runningCountKey : totalCountKey, { count: descendants.runningCount > 0 ? descendants.runningCount : descendantCount }), onClick: () => { changeOpen(!open); }, onKeyDown: (event) => {
                    if (event.key !== 'ArrowDown')
                        return;
                    event.preventDefault();
                    if (!open)
                        changeOpen(true);
                    queueMicrotask(() => { focusAt(0); });
                }, children: [_jsx("span", { className: css.activitySlot, children: descendants.runningCount > 0 && _jsx(StateDot, { state: "ongoing" }) }), _jsx("span", { className: css.count, children: t(totalCountKey, { count: descendantCount }) }), _jsx(IconChevronDownOutlineMedium, { className: open ? css.triggerOpen : undefined })] }), open && (_jsx("div", { className: css.menu, role: "tree", "aria-label": t('tree.aria'), children: _jsx(CatalogRows, { parentSessionId: sessionId, catalog: catalog, catalogs: catalogs, summaries: summaries, expanded: expanded, level: 1, now: now, openChild: openChild, refresh: refresh, toggleBranch: toggleBranch, closeCatalog: () => { changeOpen(false); }, modelLabels: modelLabels, t: t }) }))] }));
}

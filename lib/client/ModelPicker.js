import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/** One searchable, keyboard-accessible model menu shared by every surface. */
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { IconCheckOutlineMedium, IconChevronDownOutlineMedium } from '@deepseek-ai/dsh-client-ui-primitives';
import { modelKey, modelPreferences } from "./model-preferences.js";
import css from './ModelPicker.module.css';
export function ModelPicker({ sessionId, access, value, onChange, t, disabled, className, placement = 'bottom', fallbackLabel, requireSession = false, roleLabel, controlLabel, stretch = false, scopeHint, sourceLabel, onClear, clearLabel, compact = false }) {
    const [catalog, setCatalog] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [draft, setDraft] = useState();
    const [inherit, setInherit] = useState(false);
    const savingRef = useRef(false);
    const [position, setPosition] = useState({ left: 0, top: 0, height: 480 });
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const searchRef = useRef(null);
    const loadRevision = useRef(0);
    const preferences = useSyncExternalStore(modelPreferences.subscribe, modelPreferences.getSnapshot);
    const id = useId();
    const blocked = disabled || saving;
    const load = () => {
        const revision = ++loadRevision.current;
        setLoading(true);
        setError(null);
        void access.loadCatalog().then(next => {
            if (revision === loadRevision.current) {
                setCatalog(next);
                setLoading(false);
            }
        }).catch((cause) => {
            if (revision === loadRevision.current) {
                setError(cause instanceof Error ? cause.message : String(cause));
                setLoading(false);
            }
        });
    };
    useEffect(() => { load(); return () => { loadRevision.current += 1; }; }, [access]);
    const choices = useMemo(() => catalog?.groups.flatMap(group => group.models.map(model => ({
        ...model, provider: group.id, providerName: group.name, model: model.id,
    }))) ?? [], [catalog]);
    const selected = choices.find(row => row.provider === value?.provider && row.model === value.model);
    const reasoning = selected?.reasoning;
    const effectiveEffort = value?.reasoningEffort ?? reasoning?.defaultEffort;
    const effortLabel = reasoning?.efforts.find(row => row.id === effectiveEffort)?.name ?? (effectiveEffort || undefined);
    const modelLabel = selected?.name ?? value?.model ?? fallbackLabel ?? t('triggerFallback');
    const fullLabel = [controlLabel ?? roleLabel, modelLabel, effortLabel].filter(Boolean).join(' · ');
    const draftModel = choices.find(row => row.provider === draft?.provider && row.model === draft.model);
    const draftReasoning = draftModel?.reasoning;
    const close = (focus = false) => {
        if (savingRef.current)
            return;
        setOpen(false);
        if (focus)
            triggerRef.current?.focus();
    };
    useLayoutEffect(() => {
        if (!open)
            return;
        const place = () => {
            const trigger = triggerRef.current?.getBoundingClientRect();
            if (trigger === undefined)
                return;
            const width = Math.min(360, window.innerWidth - 24);
            const above = trigger.top - 12;
            const below = window.innerHeight - trigger.bottom - 12;
            const upwards = placement === 'top' ? above >= 240 || above > below : below < 240 && above > below;
            const height = Math.min(520, upwards ? above : below);
            const left = Math.max(12, Math.min(placement === 'top' ? trigger.right - width : trigger.left, window.innerWidth - width - 12));
            // Menu occupies only its contents; translateY preserves bottom anchoring.
            setPosition({ left, top: upwards ? trigger.top - 8 : trigger.bottom + 8, height: Math.max(160, height) });
            if (menuRef.current)
                menuRef.current.dataset.upwards = String(upwards);
        };
        place();
        searchRef.current?.focus();
        const outside = (event) => {
            if (event.target instanceof Node && !menuRef.current?.contains(event.target) && !triggerRef.current?.contains(event.target))
                close();
        };
        const dismissOnScroll = (event) => { if (!(event.target instanceof Node) || !menuRef.current?.contains(event.target))
            close(); };
        document.addEventListener('pointerdown', outside);
        document.addEventListener('scroll', dismissOnScroll, true);
        window.addEventListener('resize', place);
        return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('scroll', dismissOnScroll, true); window.removeEventListener('resize', place); };
    }, [open, placement]);
    useEffect(() => { if (disabled && !saving)
        close(); }, [disabled, saving]);
    const commit = (action, next) => {
        if (blocked || savingRef.current)
            return;
        savingRef.current = true;
        setSaving(true);
        setError(null);
        void Promise.resolve().then(action).then(() => {
            if (next)
                modelPreferences.remember(next);
            savingRef.current = false;
            setSaving(false);
            close(true);
        }).catch((cause) => { savingRef.current = false; setSaving(false); setError(cause instanceof Error ? cause.message : String(cause)); });
    };
    const pick = (provider, model) => {
        if (blocked)
            return;
        const row = choices.find(item => item.provider === provider && item.model === model);
        // Re-selecting the same model keeps its explicit effort. A different
        // model starts with its own default, never an unsupported prior effort.
        const current = inherit ? value : draft;
        const next = current?.provider === provider && current.model === model
            ? { ...current }
            : value?.provider === provider && value.model === model
                ? { ...value }
                : { provider, model, ...row?.reasoning?.defaultEffort === undefined ? {} : { reasoningEffort: row.reasoning.defaultEffort } };
        setDraft(next);
        setInherit(false);
    };
    const apply = () => {
        if (inherit && onClear !== undefined)
            commit(onClear);
        else if (draft !== undefined && draftModel !== undefined)
            commit(() => onChange(draft), draft);
    };
    const onKeyDown = (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            close(true);
            return;
        }
        if (event.key === 'Tab') {
            const items = Array.from(menuRef.current?.querySelectorAll('input, button:not(:disabled)') ?? []);
            const at = items.indexOf(document.activeElement);
            if ((!event.shiftKey && at === items.length - 1) || (event.shiftKey && at === 0)) {
                event.preventDefault();
                items[event.shiftKey ? items.length - 1 : 0]?.focus();
            }
            return;
        }
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key))
            return;
        if (event.target === searchRef.current && ['Home', 'End'].includes(event.key))
            return;
        event.preventDefault();
        const items = Array.from(menuRef.current?.querySelectorAll('[data-model-option]:not(:disabled)') ?? []);
        const at = items.indexOf(document.activeElement);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : event.key === 'ArrowDown' ? (at + 1) % items.length : at <= 0 ? items.length - 1 : at - 1;
        items[next]?.focus();
    };
    const normalized = query.trim().toLocaleLowerCase();
    const visible = choices.filter(row => `${row.name} ${row.model} ${row.providerName} ${row.provider}`.toLocaleLowerCase().includes(normalized));
    const groups = normalized ? [{ label: t('searchResults'), rows: visible }] : [
        { label: t('favorites'), rows: choices.filter(row => preferences.favorites.includes(modelKey(row))) },
        { label: t('recentModels'), rows: preferences.recent.flatMap(key => choices.filter(row => modelKey(row) === key)) },
        ...(catalog?.groups.map(group => ({ label: group.name, rows: choices.filter(row => row.provider === group.id) })) ?? []),
    ];
    if (requireSession && sessionId === undefined)
        return _jsx("p", { className: css.muted, children: t('noSession') });
    return (_jsxs("div", { className: [css.root, compact ? css.compact : undefined, stretch ? css.stretch : undefined, className].filter(Boolean).join(' '), children: [_jsxs("button", { ref: triggerRef, type: "button", className: css.trigger, "aria-label": fullLabel, "aria-haspopup": "dialog", "aria-expanded": open, "aria-controls": open ? id : undefined, title: fullLabel, disabled: blocked, onClick: () => {
                    if (open)
                        close();
                    else {
                        setQuery('');
                        setDraft(value === undefined ? undefined : { ...value });
                        setInherit(false);
                        setError(null);
                        setOpen(true);
                        load();
                    }
                }, children: [roleLabel && _jsx("span", { className: css.role, children: roleLabel }), _jsx("span", { className: css.triggerLabel, children: modelLabel }), effortLabel && _jsx("span", { className: css.triggerEffort, children: effortLabel }), _jsx(IconChevronDownOutlineMedium, { className: css.chevron })] }), open && createPortal(_jsxs("div", { ref: menuRef, id: id, role: "dialog", "aria-modal": "true", "aria-label": controlLabel ?? roleLabel ?? t('menuAria'), className: css.menu, style: { left: position.left, top: position.top, maxHeight: position.height }, onKeyDown: onKeyDown, children: [_jsxs("header", { className: css.menuHeader, children: [_jsx("span", { children: controlLabel ?? roleLabel ?? t('menuAria') }), sourceLabel && _jsx("span", { className: css.source, children: sourceLabel })] }), _jsx("input", { ref: searchRef, className: css.search, value: query, onChange: event => { setQuery(event.target.value); }, placeholder: t('searchPlaceholder'), "aria-label": t('searchPlaceholder') }), error && _jsxs("div", { className: css.error, role: "alert", children: [_jsx("span", { children: error }), _jsx("button", { type: "button", className: css.retry, onClick: load, children: t('retry') })] }), catalog && value && !selected && !loading && _jsxs("div", { className: css.warning, role: "alert", children: [t('routeMissing'), " (", value.provider, "/", value.model, ")"] }), catalog?.failures.length ? _jsxs("div", { className: css.warning, children: [t('catalogPartial'), ": ", catalog.failures.map(row => row.name).join(', ')] }) : null, _jsxs("div", { className: css.groups, "aria-busy": loading || saving, children: [loading && !catalog && _jsx("div", { className: css.status, children: t('statusLoading') }), groups.filter(group => group.rows.length).map(group => _jsxs("section", { className: css.group, "aria-label": group.label, children: [_jsx("h4", { className: css.groupTitle, children: group.label }), group.rows.map(row => {
                                        const key = modelKey(row);
                                        const favorite = preferences.favorites.includes(key);
                                        const current = !inherit && row.provider === draft?.provider && row.model === draft.model;
                                        return _jsxs("div", { className: css.modelRow, children: [_jsxs("button", { type: "button", "data-model-option": true, className: [css.option, current ? css.selected : ''].filter(Boolean).join(' '), "aria-pressed": current, disabled: blocked, title: `${row.name} · ${row.providerName}`, onClick: () => { pick(row.provider, row.model); }, children: [_jsxs("span", { className: css.optionCopy, children: [_jsx("span", { className: css.modelName, children: row.name }), _jsxs("span", { className: css.description, children: [normalized || group.label === t('favorites') || group.label === t('recentModels') ? `${row.providerName} · ` : '', row.description ?? row.model] })] }), current && _jsx(IconCheckOutlineMedium, { className: css.check })] }), _jsx("button", { type: "button", className: css.favorite, "aria-label": `${t(favorite ? 'unfavoriteModel' : 'favoriteModel')}: ${row.name}`, "aria-pressed": favorite, onClick: () => { modelPreferences.toggleFavorite(row); }, children: favorite ? '★' : '☆' })] }, key);
                                    })] }, group.label)), !loading && visible.length === 0 && _jsx("div", { className: css.empty, children: t(normalized ? 'noResults' : 'emptyModels') })] }), onClear && _jsxs("button", { className: css.clear, type: "button", "aria-pressed": inherit, disabled: blocked, onClick: () => { setInherit(true); }, children: [clearLabel ?? t('sessionPickerClear'), inherit && _jsx(IconCheckOutlineMedium, { className: css.check })] }), _jsxs("div", { className: css.selectionEditor, children: [_jsxs("div", { className: css.draftSummary, children: [_jsx("span", { className: css.modelName, children: inherit ? clearLabel ?? t('sessionPickerClear') : draftModel?.name ?? draft?.model ?? t('triggerFallback') }), !inherit && draftModel && _jsx("span", { className: css.description, children: draftModel.providerName })] }), !inherit && draftModel && (draftReasoning && draftReasoning.efforts.length > 0 ? _jsxs("section", { className: css.effortSection, "aria-label": t('effortLabel'), children: [_jsx("span", { className: css.groupTitle, children: t('effortLabel') }), _jsx("div", { className: css.efforts, children: [{ id: undefined, name: t('effortDefault'), description: undefined }, ...draftReasoning.efforts].map(level => _jsx("button", { type: "button", className: css.effort, "aria-pressed": draft?.reasoningEffort === level.id, disabled: blocked, title: level.description, onClick: () => {
                                                if (draft === undefined)
                                                    return;
                                                setDraft({ provider: draft.provider, model: draft.model, ...level.id === undefined ? {} : { reasoningEffort: level.id } });
                                            }, children: level.name }, level.id ?? 'default')) })] }) : _jsx("p", { className: css.effortUnavailable, children: t('emptyEfforts') })), _jsxs("div", { className: css.confirmActions, children: [_jsx("button", { type: "button", className: css.cancel, disabled: saving, onClick: () => { close(true); }, children: t('cancel') }), _jsx("button", { type: "button", className: css.apply, disabled: blocked || !(inherit ? onClear !== undefined : draftModel !== undefined), onClick: apply, children: saving ? t('statusSaving') : t('applySelection') })] })] }), scopeHint && _jsx("footer", { className: css.scopeHint, children: scopeHint })] }), document.body)] }));
}

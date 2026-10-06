import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Plan review shows the original main model that execution will restore.
 */
import { useEffect, useMemo, useState } from 'react';
import { Button, IconEditOutlineMedium, MarkdownText } from '@deepseek-ai/dsh-client-ui-primitives';
import { PLAN_MAIN_MODELS_ROUTE } from "../plan-routes.js";
import css from './styles.module.css';
function tooltip(description) {
    return description === undefined ? {} : { title: description };
}
export function PlanReviewPanel({ pending, review, access, t, }) {
    const [mainLabel, setMainLabel] = useState();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const markdownLabels = useMemo(() => ({
        code: { copyLabel: t('codeCopy'), copiedLabel: t('codeCopied') },
        footnotes: t('footnotes'),
    }), [t]);
    useEffect(() => {
        let cancelled = false;
        void (async () => {
            const response = await fetch(PLAN_MAIN_MODELS_ROUTE);
            if (!response.ok)
                throw new Error(t('loadError'));
            const result = await response.json();
            const main = result.value[pending.sessionId];
            if (main === undefined)
                throw new Error(t('mainUnavailable'));
            let label = main.model;
            try {
                const catalog = await access.loadCatalog();
                const model = catalog.groups.find(group => group.id === main.provider)?.models.find(row => row.id === main.model);
                label = model?.name ?? label;
            }
            catch { /* Stored route remains valid when catalog metadata is unavailable. */ }
            if (main.reasoningEffort !== undefined)
                label += ` · ${main.reasoningEffort}`;
            if (!cancelled)
                setMainLabel(label);
        })().catch((cause) => {
            if (!cancelled)
                setError(cause instanceof Error ? cause.message : String(cause));
        });
        return () => { cancelled = true; };
    }, [pending.sessionId, access, t]);
    const settle = (send) => {
        setBusy(true);
        setError(null);
        void send().catch((cause) => {
            setBusy(false);
            setError(cause instanceof Error ? cause.message : String(cause));
        });
    };
    const decide = (label) => {
        settle(() => pending.answer({ answers: [{ id: review.id, selected: [label] }] }));
    };
    const decline = review.decline;
    return (_jsx("div", { className: css.frame, "data-plan-review-key": pending.key, "data-model-switch-plan": "", children: _jsxs("section", { className: css.card, "aria-label": review.question, children: [_jsxs("div", { className: css.strip, children: [_jsx("span", { className: css.dot }), t('planHeader')] }), _jsx("div", { className: css.body, "data-plan-review-scroll": true, children: _jsx(MarkdownText, { text: review.plan, labels: markdownLabels }) }), _jsxs("div", { className: css.footer, children: [_jsx("div", { className: css.feedback, role: "status", children: error }), _jsxs("div", { className: css.actions, children: [_jsx(Button, { variant: "ghost", icon: _jsx(IconEditOutlineMedium, { size: 14 }), disabled: busy, onClick: () => { settle(() => pending.dismiss()); }, children: t('planDiscuss') }), decline !== undefined && (_jsx(Button, { variant: "outline", ...tooltip(decline.description), disabled: busy, onClick: () => { decide(decline.label); }, children: t('planDecline') })), _jsxs("div", { className: css.planPicker, "aria-label": t('planModelLabel'), children: [t('planModelLabel'), "\uFF1A", mainLabel ?? t('statusLoading')] }), _jsx(Button, { variant: "primary", ...tooltip(review.approve.description), disabled: busy, onClick: () => { decide(review.approve.label); }, children: t('planApprove') })] })] })] }) }));
}

import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/** [missing seams: off or paused, unexpected data only: conservative fallback] */
const IMPACT = {
    'model-lock': ['seamLockPaused', 'seamLockStrict'],
    'plan-switch': ['seamPlanOff', 'seamPlanLate'],
    'chat-controls': ['seamChatOff', 'seamChatOff'],
    'subagent-catalog': ['seamCatalogOff', 'seamCatalogOff'],
};
/** Whether the model lock is paused, so a raw host error would repeat this notice. */
export function lockPaused(reports) {
    return reports?.some(report => report.capability === 'model-lock' && report.missing.length > 0) ?? false;
}
function Seams({ label, seams }) {
    if (!seams.length)
        return null;
    return _jsxs(_Fragment, { children: [_jsx("br", {}), label, seams.map((seam, index) => _jsxs("span", { children: [index > 0 ? ', ' : '', _jsx("code", { children: seam })] }, seam))] });
}
export function SeamNotice({ reports, t, className }) {
    if (!reports.length)
        return null;
    return _jsxs("div", { className: className, role: "alert", "data-model-switch-seams": "", children: [reports.map(report => _jsxs("p", { children: [t(IMPACT[report.capability][report.missing.length ? 0 : 1]), _jsx(Seams, { label: t('seamMissing'), seams: report.missing }), _jsx(Seams, { label: t('seamMismatched'), seams: report.mismatched })] }, report.capability)), _jsx("p", { children: t('seamHint') })] });
}

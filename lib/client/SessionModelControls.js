import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SessionModelPicker } from "./SessionModelPicker.js";
import { SessionSubagentPicker } from "./SessionSubagentPicker.js";
import css from './SessionModelControls.module.css';
export function SessionModelControls(props) {
    return _jsxs("div", { className: css.bar, children: [_jsx(SessionModelPicker, { ...props }), _jsx(SessionSubagentPicker, { ...props })] });
}

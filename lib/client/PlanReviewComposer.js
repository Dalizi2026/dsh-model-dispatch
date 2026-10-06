import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Composer-chain entry that claims plan-review waits (higher priority than stock).
 * The question carrier is the official ui-user-questions value; the plan-review
 * narrowing is local (plan-review.ts).
 */
import { useMemo } from 'react';
import { planReviewOf, isQuestionCarrier } from "./plan-review.js";
import { PlanReviewPanel } from "./PlanReviewPanel.js";
/** Select only plan-review question waits. */
export function selectPlanReview({ pendingInteraction }) {
    if (!isQuestionCarrier(pendingInteraction))
        return null;
    return planReviewOf(pendingInteraction.questions) !== undefined ? pendingInteraction : null;
}
export function PlanReviewComposer(props) {
    const { matched, access, t } = props;
    const review = useMemo(() => planReviewOf(matched.questions), [matched]);
    if (access === undefined
        || t === undefined
        || review === undefined) {
        return null;
    }
    return (_jsx(PlanReviewPanel, { pending: matched, review: review, access: access, t: t }, matched.key));
}

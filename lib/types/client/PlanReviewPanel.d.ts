/**
 * Plan review shows the original main model that execution will restore.
 */
import type { PlanReview, PendingQuestion } from '@deepseek-ai/dsh-client-ui-user-questions/client';
import type { ModelCatalogAccess } from './ModelPicker.tsx';
import type { LocaleKey } from './locales.ts';
export interface PlanReviewPanelProps {
    pending: PendingQuestion;
    review: PlanReview;
    access: ModelCatalogAccess;
    t: (key: LocaleKey) => string;
}
export declare function PlanReviewPanel({ pending, review, access, t, }: PlanReviewPanelProps): import("react").JSX.Element;

/**
 * Local plan-review narrowing over the official question carrier.
 * The carrier (PendingQuestion/answer protocol) is owned by ui-user-questions;
 * only this pure narrowing lives here.
 */
import type { QuestionWait } from '@deepseek-ai/dsh-client-ui-user-questions/client';
type QuestionItem = QuestionWait['questions'][number];
type QuestionOption = NonNullable<QuestionItem['options']>[number];
export interface PlanReview {
    id: string;
    question: string;
    plan: string;
    approve: QuestionOption;
    decline?: QuestionOption;
}
/** The carrier kind is `question` or `plan-review`; both arrive as QuestionWait. */
export declare function isQuestionCarrier(pendingInteraction: unknown): pendingInteraction is QuestionWait;
export declare function planReviewOf(questions: readonly QuestionItem[]): PlanReview | undefined;
export {};

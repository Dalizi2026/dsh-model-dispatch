/**
 * Local plan-review narrowing over the official question carrier.
 * The carrier (PendingQuestion/answer protocol) is owned by ui-user-questions;
 * only this pure narrowing lives here.
 */
/** The carrier kind is `question` or `plan-review`; both arrive as QuestionWait. */
export function isQuestionCarrier(pendingInteraction) {
    if (typeof pendingInteraction !== 'object' || pendingInteraction === null)
        return false;
    const kind = pendingInteraction.kind;
    return kind === 'question' || kind === 'plan-review';
}
export function planReviewOf(questions) {
    if (questions.length !== 1)
        return undefined;
    const question = questions[0];
    const intent = question.intent;
    if (intent?.kind !== 'plan-review' || question.detail === undefined)
        return undefined;
    if (question.multiSelect === true)
        return undefined;
    const options = question.options ?? [];
    if (options.length > 2)
        return undefined;
    const approve = options.find(option => option.label === intent.approve);
    if (approve === undefined)
        return undefined;
    const decline = options.find(option => option.label !== intent.approve);
    return {
        id: question.id,
        question: question.question,
        plan: question.detail,
        approve,
        ...decline === undefined ? {} : { decline },
    };
}

/**
 * Local plan-review narrowing over the official question carrier.
 * The carrier (PendingQuestion/answer protocol) is owned by ui-user-questions;
 * only this pure narrowing lives here.
 */

import type { QuestionWait } from '@deepseek-ai/dsh-client-ui-user-questions/client'

type QuestionItem = QuestionWait['questions'][number]
type QuestionOption = NonNullable<QuestionItem['options']>[number]

export interface PlanReview {
  id: string
  question: string
  plan: string
  approve: QuestionOption
  decline?: QuestionOption
}

/** The carrier kind is `question` or `plan-review`; both arrive as QuestionWait. */
export function isQuestionCarrier(
  pendingInteraction: unknown,
): pendingInteraction is QuestionWait {
  if (typeof pendingInteraction !== 'object' || pendingInteraction === null) return false
  const kind = (pendingInteraction as { kind?: unknown }).kind
  return kind === 'question' || kind === 'plan-review'
}

export function planReviewOf(questions: readonly QuestionItem[]): PlanReview | undefined {
  if (questions.length !== 1) return undefined
  const question = questions[0] as QuestionItem
  const intent = question.intent
  if (intent?.kind !== 'plan-review' || question.detail === undefined) return undefined
  if (question.multiSelect === true) return undefined
  const options = question.options ?? []
  if (options.length > 2) return undefined
  const approve = options.find(option => option.label === intent.approve)
  if (approve === undefined) return undefined
  const decline = options.find(option => option.label !== intent.approve)
  return {
    id: question.id,
    question: question.question,
    plan: question.detail,
    approve,
    ...decline === undefined ? {} : { decline },
  }
}

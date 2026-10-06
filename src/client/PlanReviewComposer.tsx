/**
 * Composer-chain entry that claims plan-review waits (higher priority than stock).
 * The question carrier is the official ui-user-questions value; the plan-review
 * narrowing is local (plan-review.ts).
 */

import { useMemo } from 'react'
import type { QuestionWait } from '@deepseek-ai/dsh-client-ui-user-questions/client'
import type { ComposerChainProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { LocaleKey } from './locales.ts'
import type { ModelCatalogAccess } from './ModelPicker.tsx'
import { planReviewOf, isQuestionCarrier } from './plan-review.ts'
import { PlanReviewPanel } from './PlanReviewPanel.tsx'

export interface PlanReviewComposerInjected {
  access: ModelCatalogAccess
  t: (key: LocaleKey) => string
}

export type PlanReviewComposerProps =
  PropsRuntime<'conversation.composer'>
  & { matched: QuestionWait }
  & PropsLocale<'model-switch'>
  & Partial<PlanReviewComposerInjected>

/** Select only plan-review question waits. */
export function selectPlanReview({ pendingInteraction }: ComposerChainProps): QuestionWait | null {
  if (!isQuestionCarrier(pendingInteraction)) return null
  return planReviewOf(pendingInteraction.questions) !== undefined ? pendingInteraction : null
}

export function PlanReviewComposer(props: PlanReviewComposerProps) {
  const { matched, access, t } = props
  const review = useMemo(() => planReviewOf(matched.questions), [matched])
  if (
    access === undefined
    || t === undefined
    || review === undefined
  ) {
    return null
  }
  return (
    <PlanReviewPanel
      key={matched.key}
      pending={matched}
      review={review}
      access={access}
      t={t}
    />
  )
}

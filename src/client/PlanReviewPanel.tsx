/**
 * Plan review shows the original main model that execution will restore.
 */

import { useEffect, useMemo, useState } from 'react'
import { Button, IconEditOutlineMedium, MarkdownText } from '@deepseek-ai/dsh-client-ui-primitives'
import type {
  PlanReview,
  PendingQuestion,
} from '@deepseek-ai/dsh-client-ui-user-questions/client'
import type { ModelSelectionConfig } from '../shared.ts'
import { PLAN_MAIN_MODELS_ROUTE } from '../plan-routes.ts'
import type { ModelCatalogAccess } from './ModelPicker.tsx'
import type { LocaleKey } from './locales.ts'
import css from './styles.module.css'

export interface PlanReviewPanelProps {
  pending: PendingQuestion
  review: PlanReview
  access: ModelCatalogAccess
  t: (key: LocaleKey) => string
}

function tooltip(description: string | undefined): { title?: string } {
  return description === undefined ? {} : { title: description }
}

export function PlanReviewPanel({
  pending, review, access, t,
}: PlanReviewPanelProps) {
  const [mainLabel, setMainLabel] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const markdownLabels = useMemo(() => ({
    code: { copyLabel: t('codeCopy'), copiedLabel: t('codeCopied') },
    footnotes: t('footnotes'),
  }), [t])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const response = await fetch(PLAN_MAIN_MODELS_ROUTE)
      if (!response.ok) throw new Error(t('loadError'))
      const result = await response.json() as { value: Record<string, ModelSelectionConfig> }
      const main = result.value[pending.sessionId]
      if (main === undefined) throw new Error(t('mainUnavailable'))
      let label = main.model
      try {
        const catalog = await access.loadCatalog()
        const model = catalog.groups.find(group => group.id === main.provider)?.models.find(row => row.id === main.model)
        label = model?.name ?? label
      } catch { /* Stored route remains valid when catalog metadata is unavailable. */ }
      if (main.reasoningEffort !== undefined) label += ` · ${main.reasoningEffort}`
      if (!cancelled) setMainLabel(label)
    })().catch((cause: unknown) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
    })
    return () => { cancelled = true }
  }, [pending.sessionId, access, t])

  const settle = (send: () => Promise<void>): void => {
    setBusy(true)
    setError(null)
    void send().catch((cause: unknown) => {
      setBusy(false)
      setError(cause instanceof Error ? cause.message : String(cause))
    })
  }

  const decide = (label: string): void => {
    settle(() => pending.answer({ answers: [{ id: review.id, selected: [label] }] }))
  }

  const decline = review.decline

  return (
    <div className={css.frame} data-plan-review-key={pending.key} data-model-switch-plan="">
      <section className={css.card} aria-label={review.question}>
        <div className={css.strip}>
          <span className={css.dot} />
          {t('planHeader')}
        </div>
        <div className={css.body} data-plan-review-scroll>
          <MarkdownText text={review.plan} labels={markdownLabels} />
        </div>
        <div className={css.footer}>
          <div className={css.feedback} role="status">{error}</div>
          <div className={css.actions}>
            <Button
              variant="ghost"
              icon={<IconEditOutlineMedium size={14} />}
              disabled={busy}
              onClick={() => { settle(() => pending.dismiss()) }}
            >
              {t('planDiscuss')}
            </Button>
            {decline !== undefined && (
              <Button
                variant="outline"
                {...tooltip(decline.description)}
                disabled={busy}
                onClick={() => { decide(decline.label) }}
              >
                {t('planDecline')}
              </Button>
            )}
            <div className={css.planPicker} aria-label={t('planModelLabel')}>
              {t('planModelLabel')}：{mainLabel ?? t('statusLoading')}
            </div>
            <Button
              variant="primary"
              {...tooltip(review.approve.description)}
              disabled={busy}
              onClick={() => { decide(review.approve.label) }}
            >
              {t('planApprove')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}


/**
 * Session-hierarchy neighbour: show the active subagent's model label.
 */

import { useEffect, useSyncExternalStore } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionListState } from '@deepseek-ai/dsh-api-session-controller/client'
import type { SessionLabelStore } from './session-label-store.ts'
import css from './SubagentModelBadge.module.css'

export interface SubagentModelBadgeInjected {
  labels: SessionLabelStore
}

export type SubagentModelBadgeProps =
  PropsRuntime<'conversation.session.header.actions'>
  & Partial<SubagentModelBadgeInjected>

export function SubagentModelBadge(props: SubagentModelBadgeProps) {
  const { sessionId, useSessions, labels } = props
  if (labels === undefined) return null

  const origin = useSessions((state: SessionListState) => state.byId[sessionId]?.origin)
  const snap = useSyncExternalStore(labels.subscribe, labels.getSnapshot)

  useEffect(() => {
    labels.start()
    return () => { labels.stop() }
  }, [labels])

  if (origin !== 'subagent') return null
  const text = snap.value[sessionId]
  if (text === undefined || text.length === 0) return null

  return (
    <span className={css.badge} title={text} data-model-switch-badge="">
      {text}
    </span>
  )
}

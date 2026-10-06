import {
  useEffect, useMemo, useRef, useState, useSyncExternalStore,
  type KeyboardEvent, type MouseEvent,
} from 'react'
import type {
  SessionListState,
  SessionSummary,
} from '@deepseek-ai/dsh-api-session-controller/client'
import type { SessionId, SubagentAddress } from '@deepseek-ai/dsh-api-remotes/client'
import type { SubagentCatalogEntry } from '@deepseek-ai/dsh-subagent/client'
import {
  IconChevronDownOutlineMedium, IconChevronRightOutlineMedium, IconRefreshOutlineMedium, StateDot,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { SessionLabelStore } from './session-label-store.ts'
import css from './SubagentCatalogAction.module.css'

/** One derived catalog level: the projection view plus running-state rows. */
interface CatalogView {
  state: 'loading' | 'ready' | 'error'
  error: { message: string } | null
  entries: readonly (SubagentCatalogEntry & { activity: 'running' | 'inactive' })[]
}

type Catalogs = Record<string, CatalogView>

interface SubagentDescendants {
  count: number
  runningCount: number
}

/** Tally subagent-origin descendants (all depths) per parent session id. */
function indexSubagentDescendants(
  summaries: Readonly<Record<SessionId, SessionSummary>>,
): Map<SessionId, SubagentDescendants> {
  const children = new Map<SessionId, SessionSummary[]>()
  for (const summary of Object.values(summaries)) {
    if (summary.origin !== 'subagent' || summary.parentId === undefined) continue
    const siblings = children.get(summary.parentId)
    if (siblings === undefined) children.set(summary.parentId, [summary])
    else siblings.push(summary)
  }
  const index = new Map<SessionId, SubagentDescendants>()
  for (const [rootId, roots] of children) {
    let count = 0
    let runningCount = 0
    const queue = [...roots]
    while (queue.length > 0) {
      const node = queue.pop()!
      count += 1
      if (node.running) runningCount += 1
      const grandChildren = children.get(node.id)
      if (grandChildren !== undefined) queue.push(...grandChildren)
    }
    index.set(rootId, { count, runningCount })
  }
  return index
}

interface TokenUsageBuckets {
  uncachedInputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
}

/** Business actions supplied by the slot registration. */
export interface SubagentCatalogInjected {
  openChild: (address: SubagentAddress) => void
  refresh: (parentSessionId: SessionId) => void
  labels: SessionLabelStore
}

/** Full props for the session-header catalog action. */
export type SubagentCatalogActionProps =
  PropsRuntime<'conversation.session.header.actions'> & SubagentCatalogInjected & PropsLocale<'subagent'>

interface CatalogRowsProps {
  parentSessionId: SessionId
  catalog: CatalogView
  catalogs: Catalogs
  summaries: Readonly<Record<SessionId, SessionSummary>>
  expanded: ReadonlySet<SessionId>
  level: number
  now: number
  openChild: (address: SubagentAddress) => void
  refresh: (parentSessionId: SessionId) => void
  toggleBranch: (childSessionId: SessionId) => void
  closeCatalog: () => void
  modelLabels: Readonly<Record<string, string>>
}

function treeItems(root: HTMLDivElement | null): HTMLElement[] {
  return root === null
    ? []
    : Array.from(root.querySelectorAll<HTMLElement>('[role="treeitem"]:not([aria-disabled="true"])'))
}

/** Compact token count shared in shape with the conversation stats strip. */
function formatTokens(value: number): string {
  const scaled = (next: number): string => next >= 100
    ? String(Math.round(next))
    : String(Math.round(next * 10) / 10)
  if (value < 1_000) return String(value)
  if (value < 1_000_000) return `${scaled(value / 1_000)}K`
  return `${scaled(value / 1_000_000)}M`
}

/** Sum the four disjoint durable provider-usage buckets. */
function tokenTotal(usage: TokenUsageBuckets | undefined): number | undefined {
  return usage === undefined
    ? undefined
    : usage.uncachedInputTokens + usage.outputTokens
      + usage.cacheReadTokens + usage.cacheWriteTokens
}

/** Exact whole-second active-turn duration for one catalog row. */
function activityDuration(
  summary: SessionSummary | undefined,
  activity: 'running' | 'inactive',
  now: number,
): number | undefined {
  if (summary === undefined) return undefined
  const timing = (summary.projectionValues as { subagentTiming?: {
    settledMs: number
    active?: { since: number; through: number }
  } } | undefined)?.subagentTiming
  if (timing === undefined) return undefined
  if (timing.active === undefined) return timing.settledMs
  const end = activity === 'running'
    ? now
    : timing.active.through
  return timing.settledMs + Math.max(0, end - timing.active.since)
}

interface DurationParts {
  seconds: number
  minutes: number
  hours: number
  days: number
  totalMinutes: number
  totalHours: number
}

function splitDuration(ms: number): DurationParts {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1_000)
  const totalMinutes = Math.floor(totalSeconds / 60)
  const totalHours = Math.floor(totalMinutes / 60)
  return {
    seconds: totalSeconds % 60,
    minutes: totalMinutes % 60,
    hours: totalHours % 24,
    days: Math.floor(totalHours / 24),
    totalMinutes,
    totalHours,
  }
}

/** Format a duration with decreasing visual precision at larger scales. */
function formatDuration(ms: number, t: TranslateNS<"subagent">): string {
  const { seconds, minutes, hours, days, totalMinutes, totalHours } = splitDuration(ms)
  if (days >= 365) {
    const years = Math.floor(days / 365)
    const months = Math.floor((days % 365) / 30)
    return months === 0
      ? t('duration.years', { years })
      : t('duration.yearsMonths', { years, months })
  }
  if (days >= 30) {
    const months = Math.floor(days / 30)
    const remainingDays = days % 30
    return remainingDays === 0
      ? t('duration.months', { months })
      : t('duration.monthsDays', { months, days: remainingDays })
  }
  if (days > 0) {
    return hours === 0
      ? t('duration.days', { days })
      : t('duration.daysHours', { days, hours })
  }
  if (totalHours > 0) {
    return t('duration.hours', {
      hours: totalHours,
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
    })
  }
  if (totalMinutes > 0) {
    return t('duration.minutes', {
      minutes: totalMinutes,
      seconds: String(seconds).padStart(2, '0'),
    })
  }
  return t('duration.seconds', { seconds })
}

/** Preserve exact whole seconds for hover and accessible naming. */
function formatExactDuration(ms: number, t: TranslateNS<"subagent">): string {
  const { seconds, minutes, hours, days } = splitDuration(ms)
  return days === 0
    ? formatDuration(ms, t)
    : t('duration.exactDays', {
      days,
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
    })
}

const NO_DESCENDANTS = { count: 0, runningCount: 0 } as const

/** A child becomes a known leaf only after its own catalog readies empty. */
function isKnownLeaf(catalog: CatalogView | undefined): boolean {
  return catalog?.state === 'ready' && catalog.entries.length === 0
}

/** Render one catalog level and recurse only through explicitly expanded rows. */
function CatalogRows({
  parentSessionId, catalog, catalogs, summaries, expanded, level, now,
  openChild, refresh, toggleBranch, closeCatalog, modelLabels, t,
}: CatalogRowsProps & { t: TranslateNS<"subagent"> }) {
  const emptyLoading = catalog.state === 'loading' && catalog.entries.length === 0
  const reserveDisclosure = catalog.entries.some(entry => !isKnownLeaf(catalogs[entry.id]))
  return (
    <>
      {emptyLoading && <div className={css.notice}>{t('loading.label')}</div>}
      {catalog.state === 'error' && (
        <div className={css.error}>
          <span>{catalog.error?.message ?? t('load.error')}</span>
          <button
            type="button"
            className={css.refresh}
            onClick={() => { refresh(parentSessionId) }}
          >
            <IconRefreshOutlineMedium />
            {t('retry')}
          </button>
        </div>
      )}
      {catalog.entries.map((entry) => {
        const childCatalog = catalogs[entry.id]
        const isExpanded = expanded.has(entry.id)
        const knownLeaf = !reserveDisclosure || isKnownLeaf(childCatalog)
        const childLoading = childCatalog === undefined
          || (childCatalog.state === 'loading' && childCatalog.entries.length === 0)
        const summary = summaries[entry.id]
        const label = entry.label ?? entry.id
        const mode = entry.mode === 'unknown'
          ? t('mode.unknown')
          : entry.mode === 'one-shot'
            ? t('mode.oneShot')
            : t('mode.continuable')
        const activity = entry.activity === 'running' ? t('activity.running') : t('activity.inactive')
        const secondary = [summary?.title, mode, activity]
          .filter(value => value !== undefined)
          .join(' · ')
        const projectionValues = summary?.projectionValues as
          | { tokenUsage?: TokenUsageBuckets }
          | undefined
        const totalTokens = tokenTotal(projectionValues?.tokenUsage)
        const durationMs = activityDuration(summary, entry.activity, now)
        const modelMetric = modelLabels[entry.id]
        const tokenMetric = totalTokens === undefined
          ? undefined
          : `${formatTokens(totalTokens)} tok`
        const durationMetric = durationMs === undefined
          ? undefined
          : {
            compact: formatDuration(durationMs, t),
            exact: formatExactDuration(durationMs, t),
          }
        const metrics = [modelMetric, tokenMetric, durationMetric?.exact]
          .filter(value => value !== undefined)
          .join(' · ')

        const open = (): void => {
          openChild({ parentSessionId, childSessionId: entry.id, mode: entry.mode })
          closeCatalog()
        }
        const handleKey = (event: KeyboardEvent<HTMLDivElement>): void => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            event.stopPropagation()
            open()
          } else if (
            (event.key === 'ArrowRight' && !knownLeaf && !isExpanded)
            || (event.key === 'ArrowLeft' && isExpanded)
          ) {
            event.preventDefault()
            event.stopPropagation()
            toggleBranch(entry.id)
          }
        }
        const toggle = (event: MouseEvent<HTMLButtonElement>): void => {
          event.preventDefault()
          event.stopPropagation()
          toggleBranch(entry.id)
        }

        return (
          <div key={entry.id} className={css.node}>
            <div
              role="treeitem"
              tabIndex={0}
              aria-level={level}
              aria-label={[label, secondary, metrics].filter(value => value !== '').join(' ')}
              {...knownLeaf ? {} : { 'aria-expanded': isExpanded }}
              className={css.row}
              onClick={open}
              onKeyDown={handleKey}
            >
              {knownLeaf
                ? reserveDisclosure && <span className={css.disclosureSpace} />
                : (
                  <button
                    type="button"
                    tabIndex={-1}
                    className={`${css.disclosure} ${isExpanded ? css.disclosureOpen : ''}`}
                    aria-label={t(isExpanded ? 'branch.collapse' : 'branch.expand', { label })}
                    onClick={toggle}
                  >
                    <IconChevronRightOutlineMedium />
                  </button>
                )}
              <div className={css.clickarea}>
                <StateDot state={entry.activity === 'running' ? 'ongoing' : 'done'} />
                <span className={css.content}>
                  <span className={css.label}>{label}</span>
                  <span className={css.summary}>{secondary}</span>
                </span>
                {(modelMetric !== undefined || metrics !== '') && (
                  <span className={css.metrics}>
                    {modelMetric !== undefined && (
                      <span className={css.metricModel} title={modelMetric}>{modelMetric}</span>
                    )}
                    {tokenMetric !== undefined && <span className={css.metricToken}>{tokenMetric}</span>}
                    {durationMetric !== undefined && (
                      <span
                        className={css.metricDuration}
                        title={t('duration.exactTitle', { duration: durationMetric.exact })}
                      >
                        {durationMetric.compact}
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
            {isExpanded && !knownLeaf && (
              <div
                role="group"
                className={css.children}
                aria-busy={childLoading || undefined}
              >
                {childCatalog === undefined
                  ? <div className={css.notice}>{t('loading.label')}</div>
                  : (
                    <CatalogRows
                      parentSessionId={entry.id}
                      catalog={childCatalog}
                      catalogs={catalogs}
                      summaries={summaries}
                      expanded={expanded}
                      level={level + 1}
                      now={now}
                      openChild={openChild}
                      refresh={refresh}
                      toggleBranch={toggleBranch}
                      closeCatalog={closeCatalog}
                      modelLabels={modelLabels}
                      t={t}
                    />
                  )}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

/**
 * Render the current session's direct catalog and lazily expanded descendants.
 * @param props - session standard props plus catalog navigation actions.
 * @returns The action while the catalog is pending or summaries establish descendants.
 */
export function SubagentCatalogAction(props: SubagentCatalogActionProps) {
  const { labels, openChild, refresh, t } = props
  if (labels === undefined || openChild === undefined || refresh === undefined || t === undefined) {
    return null
  }
  return (
    <SubagentCatalogActionLoaded
      {...props}
      labels={labels}
      openChild={openChild}
      refresh={refresh}
      t={t}
    />
  )
}

type LoadedProps = Omit<SubagentCatalogActionProps, keyof SubagentCatalogInjected | 't'>
  & SubagentCatalogInjected
  & { t: TranslateNS<'subagent'> }

function SubagentCatalogActionLoaded({
  sessionId, useSessions, useSessionStatus, openChild, refresh, labels, t,
}: LoadedProps) {
  const summaries = useSessions((state: SessionListState) => state.byId)
  const projections = useSessions((state: SessionListState) => state.projectionsBySession)
  const statuses = useSessionStatus((value) => value)
  const labelSnap = useSyncExternalStore(labels.subscribe, labels.getSnapshot)
  const modelLabels = labelSnap.value

  useEffect(() => {
    labels.start()
    return () => { labels.stop() }
  }, [labels])

  // Derive each level's catalog from the shared projections: entries gain a
  // running flag from the status map, falling back to summary rows.
  const catalogs = useMemo<Catalogs>(() => Object.fromEntries(Object.entries(projections).map(([id, snapshot]) => [id, {
    state: snapshot.state === 'idle'
      ? (snapshot.values.subagentCatalog === undefined ? 'loading' : 'ready')
      : snapshot.state,
    error: snapshot.error,
    entries: (snapshot.values.subagentCatalog ?? []).map(entry => ({
      ...entry,
      activity: (statuses.get(entry.id)?.running ?? summaries[entry.id]?.running) === true
        ? 'running'
        : 'inactive',
    })),
  }])), [projections, summaries, statuses])

  const catalog = catalogs[sessionId]
  const [open, setOpen] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [expanded, setExpanded] = useState<ReadonlySet<SessionId>>(() => new Set())
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const descendants = useMemo(
    () => indexSubagentDescendants(summaries).get(sessionId) ?? NO_DESCENDANTS,
    [sessionId, summaries],
  )
  const healthy = catalog?.entries ?? []
  // The catalog can arrive before the session-list baseline; never undercount
  // the already-visible direct rows during that short bootstrap window.
  const descendantCount = Math.max(healthy.length, descendants.count)
  const totalCountKey = descendantCount === 1 ? 'count.total.one' : 'count.total.other'
  const runningCountKey = descendants.runningCount === 1 ? 'count.running.one' : 'count.running.other'

  const closeAllCatalogs = (): void => {
    setExpanded(new Set())
  }

  const changeOpen = (next: boolean, restoreFocus = false): void => {
    setOpen(next)
    if (next) setNow(Date.now())
    else closeAllCatalogs()
    if (restoreFocus) queueMicrotask(() => { triggerRef.current?.focus() })
  }

  const closeBranch = (root: SessionId): void => {
    const closing = new Set<SessionId>()
    const visit = (parentSessionId: SessionId): void => {
      if (closing.has(parentSessionId) || !expanded.has(parentSessionId)) return
      closing.add(parentSessionId)
      for (const entry of catalogs[parentSessionId]?.entries ?? []) visit(entry.id)
    }
    visit(root)
    setExpanded(current => new Set([...current].filter(id => !closing.has(id))))
  }

  const toggleBranch = (childSessionId: SessionId): void => {
    if (expanded.has(childSessionId)) {
      closeBranch(childSessionId)
      return
    }
    setExpanded(current => new Set(current).add(childSessionId))
  }

  useEffect(() => {
    if (!open) return
    const closeOutside = (event: PointerEvent): void => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        changeOpen(false)
      }
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => { document.removeEventListener('pointerdown', closeOutside) }
  }, [open])

  useEffect(() => {
    if (!open || descendants.runningCount === 0) return
    const timer = setInterval(() => { setNow(Date.now()) }, 1_000)
    return () => { clearInterval(timer) }
  }, [open, descendants.runningCount])

  // Visibility needs evidence of children (entries, summary-known descendants,
  // or a failed load worth retrying). A bare loading catalog is not evidence:
  // selecting any session schedules a refresh whose loading snapshot would
  // otherwise flash the action in and out on childless sessions.
  const visible = catalog !== undefined
    && (catalog.state === 'error' || catalog.entries.length > 0 || descendantCount > 0)
  useEffect(() => {
    if (visible || !open) return
    setOpen(false)
    closeAllCatalogs()
  }, [visible, open])

  if (!visible) return null

  const focusAt = (index: number): void => {
    const items = treeItems(rootRef.current)
    if (items.length === 0) return
    items[(index + items.length) % items.length]?.focus()
  }

  const navigate = (event: KeyboardEvent<HTMLDivElement>): void => {
    const items = treeItems(rootRef.current)
    const index = items.indexOf(document.activeElement as HTMLElement)
    if (event.key === 'Escape') {
      event.preventDefault()
      changeOpen(false, true)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusAt(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusAt(items.length - 1)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusAt(index + 1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusAt(index < 0 ? items.length - 1 : index - 1)
    }
  }

  return (
    <div className={css.root} ref={rootRef} onKeyDown={navigate}>
      <button
        ref={triggerRef}
        type="button"
        className={css.trigger}
        aria-haspopup="tree"
        aria-expanded={open}
        aria-label={t(
          descendants.runningCount > 0 ? runningCountKey : totalCountKey,
          { count: descendants.runningCount > 0 ? descendants.runningCount : descendantCount },
        )}
        onClick={() => { changeOpen(!open) }}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowDown') return
          event.preventDefault()
          if (!open) changeOpen(true)
          queueMicrotask(() => { focusAt(0) })
        }}
      >
        <span className={css.activitySlot}>
          {descendants.runningCount > 0 && <StateDot state="ongoing" />}
        </span>
        <span className={css.count}>{t(totalCountKey, { count: descendantCount })}</span>
        <IconChevronDownOutlineMedium className={open ? css.triggerOpen : undefined} />
      </button>
      {open && (
        <div className={css.menu} role="tree" aria-label={t('tree.aria')}>
          <CatalogRows
            parentSessionId={sessionId}
            catalog={catalog}
            catalogs={catalogs}
            summaries={summaries}
            expanded={expanded}
            level={1}
            now={now}
            openChild={openChild}
            refresh={refresh}
            toggleBranch={toggleBranch}
            closeCatalog={() => { changeOpen(false) }}
            modelLabels={modelLabels}
            t={t}
          />
        </div>
      )}
    </div>
  )
}

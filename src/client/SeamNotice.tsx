/** Impact first, then the likely cause, then the exact seam names to quote in an issue. */
import type { CapabilityId, CapabilityReport } from '../route-contract.ts'
import type { LocaleKey } from './locales.ts'

/** Host capabilities plus UI entries the client checks itself. */
export type UiCapability = CapabilityId | 'chat-controls' | 'subagent-catalog'
export interface UiCapabilityReport extends Omit<CapabilityReport, 'capability'> { capability: UiCapability }

/** [missing seams: off or paused, unexpected data only: conservative fallback] */
const IMPACT: Record<UiCapability, readonly [LocaleKey, LocaleKey]> = {
  'model-lock': ['seamLockPaused', 'seamLockStrict'],
  'plan-switch': ['seamPlanOff', 'seamPlanLate'],
  'chat-controls': ['seamChatOff', 'seamChatOff'],
  'subagent-catalog': ['seamCatalogOff', 'seamCatalogOff'],
}

/** Whether the model lock is paused, so a raw host error would repeat this notice. */
export function lockPaused(reports: readonly UiCapabilityReport[] | undefined): boolean {
  return reports?.some(report => report.capability === 'model-lock' && report.missing.length > 0) ?? false
}

function Seams({ label, seams }: { label: string; seams: readonly string[] }) {
  if (!seams.length) return null
  return <><br />{label}{seams.map((seam, index) => <span key={seam}>{index > 0 ? ', ' : ''}<code>{seam}</code></span>)}</>
}

export function SeamNotice({ reports, t, className }: { reports: readonly UiCapabilityReport[]; t: (key: LocaleKey) => string; className?: string }) {
  if (!reports.length) return null
  return <div className={className} role="alert" data-model-switch-seams="">
    {reports.map(report => <p key={report.capability}>
      {t(IMPACT[report.capability][report.missing.length ? 0 : 1])}
      <Seams label={t('seamMissing')} seams={report.missing} />
      <Seams label={t('seamMismatched')} seams={report.mismatched} />
    </p>)}
    <p>{t('seamHint')}</p>
  </div>
}

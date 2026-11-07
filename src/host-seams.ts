/**
 * Host seams each capability depends on, checked when the capability is used
 * or when someone asks. Nothing is polled or cached: only the last logged
 * result per capability and observed event-shape mismatches stay in memory.
 * A service method a capability cannot run safely without belongs in
 * REQUIREMENTS; optional seams are checked at their call site instead.
 */
import type { Context } from '@deepseek-ai/cordis'
import type { CapabilityId, CapabilityReport } from './route-contract.ts'

/** Event data observed at runtime; a mismatch keeps the capability on its conservative path. */
export const COMPACTION_ID_SEAM = 'session/event compaction/start data.compactionId'
export const PLAN_APPROVED_SEAM = 'tools/result exit_plan_mode value.approved'

/** `service.method` requirements; one is met when any of its alternatives exists. */
const REQUIREMENTS: Record<CapabilityId, readonly (readonly string[])[]> = {
  'model-lock': [
    ['subagents.startActivation', 'subagents.startContinuable', 'subagents.start'],
    ['subagents.getProvider'],
    ['agents.get'],
    ['sessionPersistence.stat'],
    ['llm.resolveCallConfig'],
    ['llm.listProviders'],
    ['llm.listModels'],
  ],
  // Default protection must be available whenever the planning model is applied.
  'plan-switch': [
    ['sessionController.selectModel'],
    ['agentDefaultModel.saveSelection'],
    ['sessionProjections.stateOf'],
    ['sessionProjections.register'],
  ],
}
const CAPABILITIES = Object.keys(REQUIREMENTS) as CapabilityId[]

export function degraded(report: CapabilityReport): boolean {
  return report.missing.length > 0 || report.mismatched.length > 0
}

/** The request-boundary error while the model lock cannot take effect. */
export function lockPausedMessage(missing: readonly string[]): string {
  return `Subagent dispatch is paused: DSH is missing host seams required by the model lock (${missing.join(', ')}). `
    + 'A DSH update may have changed these interfaces; update the plugin or report an issue.'
}

export class HostSeams {
  private mismatches = new Map<string, CapabilityId>()
  private logged = new Map<CapabilityId, string>()
  constructor(private ctx: Context) {}

  /** Check one capability against the live host now. */
  check(capability: CapabilityId): CapabilityReport {
    const missing = REQUIREMENTS[capability].filter(options => !options.some(seam => this.has(seam))).flat()
    const mismatched = [...this.mismatches].filter(([, owner]) => owner === capability).map(([seam]) => seam)
    const report: CapabilityReport = { capability, missing, mismatched }
    this.log(report)
    return report
  }

  /** Every degraded capability, checked now. */
  report(): CapabilityReport[] {
    return CAPABILITIES.map(capability => this.check(capability)).filter(degraded)
  }

  /** Record whether the latest event carried the data shape a capability relies on. */
  observe(capability: CapabilityId, seam: string, matched: boolean): void {
    // Only a change is recorded and logged: matched with no mismatch, or a repeated mismatch, is a no-op.
    if (matched !== this.mismatches.has(seam)) return
    if (matched) this.mismatches.delete(seam)
    else this.mismatches.set(seam, capability)
    this.check(capability)
  }

  private has(seam: string): boolean {
    const dot = seam.indexOf('.')
    const service = this.ctx.get(seam.slice(0, dot)) as Record<string, unknown> | undefined
    return typeof service?.[seam.slice(dot + 1)] === 'function'
  }

  /** One host log line per change, never one per check. */
  private log(report: CapabilityReport): void {
    const signature = degraded(report) ? JSON.stringify([report.missing, report.mismatched]) : ''
    if ((this.logged.get(report.capability) ?? '') === signature) return
    this.logged.set(report.capability, signature)
    if (signature) {
      this.ctx.logger?.warn(`Model switch: ${report.capability} is degraded; missing host seams: ${report.missing.join(', ') || 'none'}; `
        + `unexpected event data: ${report.mismatched.join(', ') || 'none'}`)
    } else {
      this.ctx.logger?.info(`Model switch: ${report.capability} host seams are available again`)
    }
  }
}

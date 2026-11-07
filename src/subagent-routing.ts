/** Wrap only real host entry points; the authority owns every model field. */
import type { Context } from '@deepseek-ai/cordis'
import type { AgentOptions } from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-subagent'
import type { RouteEnforcer, RoutingAgent } from './route-enforcer.ts'
interface ChildRequest { parent: RoutingAgent; agentOptions?: AgentOptions; [key: string]: unknown }
interface ActivationSpec { provider: string; request: ChildRequest; [key: string]: unknown }
interface Runtime {
  startActivation?: (spec: ActivationSpec) => Promise<unknown>
  startContinuable?: (spec: ActivationSpec) => Promise<unknown>
  start?: (name: string, request: ChildRequest) => Promise<unknown>
}
/**
 * Installs whenever the host provides `subagents`, so the plugin itself never
 * waits on it. Missing start entries are reported by the model-lock seam check,
 * which pauses delegation until the host provides them.
 */
export function installSubagentRouting(ctx: Context, authority: RouteEnforcer): void {
  ctx.inject(['subagents'], scope => {
    const runtime = scope.subagents as unknown as Runtime
    scope.effect(() => {
      const restore: (() => void)[] = []
      for (const key of ['startActivation', 'startContinuable'] as const) {
        const original = runtime[key]
        if (typeof original !== 'function') continue
        const wrapped: typeof original = spec => authority.delegate(spec.provider, spec.request.parent, spec.request.agentOptions,
          agentOptions => original.call(runtime, { ...spec, request: { ...spec.request, agentOptions } }))
        runtime[key] = wrapped
        restore.push(() => { if (runtime[key] === wrapped) runtime[key] = original })
      }
      const original = runtime.start
      if (typeof original === 'function') {
        const wrapped: typeof original = (name, request) => authority.delegate(name, request.parent, request.agentOptions,
          agentOptions => original.call(runtime, name, { ...request, agentOptions }))
        runtime.start = wrapped
        restore.push(() => { if (runtime.start === wrapped) runtime.start = original })
      }
      return () => { for (const dispose of restore.reverse()) dispose() }
    }, 'model-switch: enforce user routing at every native start')
  })
}

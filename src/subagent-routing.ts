/** Wrap only real host entry points; the authority owns every model field. */
import type { Context } from '@deepseek-ai/cordis'
import type { AgentOptions } from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-subagent'
import type { RouteEnforcer, RoutingAgent } from './route-enforcer.ts'

/** DSH 0.2.0–0.2.1 nest the child request under `request`. */
interface NestedChildRequest { parent: RoutingAgent; agentOptions?: AgentOptions; [key: string]: unknown }
/** DSH 0.2.2 and later pass one flat spec: `parent` and `agentOptions` sit on it. */
interface FlatActivationSpec { provider: string; parent: RoutingAgent; agentOptions?: AgentOptions; [key: string]: unknown }
type ActivationSpec = FlatActivationSpec & { request?: NestedChildRequest }
interface Runtime {
  startActivation?: (spec: ActivationSpec) => Promise<unknown>
  startContinuable?: (spec: ActivationSpec) => Promise<unknown>
  start?: (name: string, request: NestedChildRequest) => Promise<unknown>
}

/** Read parent and requested options from whichever spec shape this host uses. */
function childRequest(spec: ActivationSpec): { parent: RoutingAgent; agentOptions?: AgentOptions } {
  return spec.request === undefined
    ? { parent: spec.parent, agentOptions: spec.agentOptions }
    : { parent: spec.request.parent, agentOptions: spec.request.agentOptions }
}

/** Rebuild the spec in the same shape the host produced, so 0.2.2 never sees a stray `request`. */
function withChildOptions(spec: ActivationSpec, agentOptions: AgentOptions): ActivationSpec {
  return spec.request === undefined
    ? { ...spec, agentOptions }
    : { ...spec, request: { ...spec.request, agentOptions } }
}

export function installSubagentRouting(ctx: Context, authority: RouteEnforcer): void {
  const runtime = ctx.subagents as unknown as Runtime
  ctx.effect(() => {
    const restore: (() => void)[] = []
    for (const key of ['startActivation', 'startContinuable'] as const) {
      const original = runtime[key]
      if (typeof original !== 'function') continue
      const wrapped: typeof original = spec => {
        const request = childRequest(spec)
        return authority.delegate(spec.provider, request.parent, request.agentOptions,
          agentOptions => original.call(runtime, withChildOptions(spec, agentOptions)))
      }
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
    if (!restore.length) authority.fail(new Error('Unsupported DSH subagent startup API; delegation is blocked'))
    return () => { for (const dispose of restore.reverse()) dispose() }
  }, 'model-switch: enforce user routing at every native start')
}

/**
 * Host registry of subagent session → display label + HTTP readout.
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-host-webserver'
import { formatModelLabel, SESSION_LABELS_ROUTE, type ModelLabelParts } from './label.ts'
import type { ModelSelectionConfig } from './shared.ts'

export { SESSION_LABELS_ROUTE }

interface WebRouteHost {
  register(route: {
    kind: 'exact' | 'prefix'
    path: string
    handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
  }): () => void
}

function json(res: ServerResponse, status: number, body: unknown): void {
  const bytes = Buffer.from(JSON.stringify(body))
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': String(bytes.length),
  })
  res.end(bytes)
}

/** In-memory labels keyed by child session id. */
export class SessionLabelRegistry {
  private readonly labels = new Map<string, string>()

  get(sessionId: string): string | undefined {
    return this.labels.get(sessionId)
  }

  snapshot(): Record<string, string> {
    return Object.fromEntries(this.labels)
  }

  set(sessionId: string, label: string): void {
    if (label.length === 0) {
      this.labels.delete(sessionId)
      return
    }
    this.labels.set(sessionId, label)
  }
}

/**
 * Resolve a human label from agent route + optional effort override.
 * @param ctx - host context with optional llm service.
 * @param agent - newly created / live agent.
 * @param effortId - reasoning effort id when known.
 */
export async function resolveAgentLabel(
  ctx: Context,
  agent: Agent,
  effortId: string | undefined,
): Promise<string | undefined> {
  const provider = agent.options.provider
  const model = agent.options.model
  if (provider === undefined || model === undefined) return undefined

  const parts: ModelLabelParts = { modelName: model }
  const llm = ctx.get('llm') as {
    resolveModelInfo?: (provider: string, model: string) => Promise<{
      name?: string
      context?: { contextWindow: number }
      reasoning?: {
        efforts: readonly { id: string; name: string }[]
        defaultEffort?: string
      }
    }>
  } | undefined

  if (llm?.resolveModelInfo !== undefined) {
    try {
      const info = await llm.resolveModelInfo(provider, model)
      if (info.name !== undefined && info.name.length > 0) parts.modelName = info.name
      if (info.context?.contextWindow !== undefined) {
        parts.contextWindow = info.context.contextWindow
      }
      const effort = effortId ?? info.reasoning?.defaultEffort
      if (effort !== undefined && info.reasoning !== undefined) {
        parts.effortName = info.reasoning.efforts.find(row => row.id === effort)?.name ?? effort
      } else if (effort !== undefined) {
        parts.effortName = effort
      }
    } catch {
      if (effortId !== undefined) parts.effortName = effortId
    }
  } else if (effortId !== undefined) {
    parts.effortName = effortId
  }

  return formatModelLabel(parts)
}

/**
 * Remember labels for every subagent agent that appears; update effort on request.
 * @param ctx - host context.
 * @param registry - label map.
 * @param currentEffort - live custom-selection effort reader.
 */
export function installSessionLabelTracking(
  ctx: Context,
  registry: SessionLabelRegistry,
  currentEffort: () => string | undefined,
): void {
  ctx.on('agent/created', ({ agent }): undefined => {
    if (agent.session.header.origin !== 'subagent') return
    const sessionId = String(agent.session.header.id)
    void resolveAgentLabel(ctx, agent, currentEffort()).then((label) => {
      if (label !== undefined) registry.set(sessionId, label)
    })

    agent.ctx.on('agent/request', async (_payload, next) => {
      const seed = await next()
      void (async () => {
        const effortRaw = seed.reasoningEffort ?? currentEffort()
        const effort = effortRaw === undefined ? undefined : String(effortRaw)
        const patched = {
          ...agent,
          options: {
            ...agent.options,
            provider: seed.provider ?? agent.options.provider,
            model: seed.model ?? agent.options.model,
          },
        } as Agent
        const label = await resolveAgentLabel(ctx, patched, effort)
        if (label !== undefined) registry.set(sessionId, label)
      })()
      return seed
    })
  })
}

/**
 * Mount GET session-labels when a web server is available.
 * @param ctx - host context.
 * @param registry - label map.
 */
export function installSessionLabelsHttp(ctx: Context, registry: SessionLabelRegistry): void {
  let registered = false
  const mount = (web: WebRouteHost): void => {
    if (registered) return
    registered = true
    ctx.effect(() => web.register({
      kind: 'exact',
      path: SESSION_LABELS_ROUTE,
      handler: (req, res) => {
        if (req.method !== 'GET') {
          res.writeHead(405, { allow: 'GET' })
          res.end()
          return
        }
        json(res, 200, { ok: true, value: registry.snapshot() })
      },
    }), 'model-switch: session-labels route')
  }

  const tryMount = (): void => {
    const web = ctx.get('webServer') as WebRouteHost | undefined
    if (web !== undefined) mount(web)
  }

  tryMount()
  ctx.inject(['webServer'], (webCtx) => {
    mount(webCtx.webServer as unknown as WebRouteHost)
  })
}

/** Helper for tests / callers that already have a selection. */
export function effortFromSelection(
  selection: ModelSelectionConfig | undefined,
): string | undefined {
  const effort = selection?.reasoningEffort
  return effort !== undefined && effort.length > 0 ? effort : undefined
}

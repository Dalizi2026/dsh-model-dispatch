/**
 * Per-session subagent-model overrides + HTTP readout.
 *
 * The composer picker writes one session's override; the subagent-start wrap
 * reads it back at delegation time (session override > settings default).
 * Overrides live in memory and persist to a JSON file under the DSH home so a
 * thread's pick survives host restarts.
 */

import { readFile } from 'node:fs/promises'
import { writeAtomicJson } from './atomic-json.ts'
import { join } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'
import { SESSION_OVERRIDES_ROUTE } from './label.ts'
import type { ModelSelectionConfig } from './shared.ts'
import type { RouteValidator } from './model-route.ts'
import type { HttpGate } from './route-http.ts'

export { SESSION_OVERRIDES_ROUTE }

/** In-memory + on-disk map of sessionId → subagent selection. */
export class SessionOverrideStore {
  private readonly values = new Map<string, ModelSelectionConfig>()
  private readonly path: string

  constructor(filename = 'session-overrides.json') {
    this.path = join(resolveDshHome(), 'storages', 'model-switch', filename)
  }
  private loading: Promise<void> | undefined
  private writing = Promise.resolve()

  get(sessionId: string): ModelSelectionConfig | undefined {
    const value = this.values.get(sessionId)
    return value === undefined ? undefined : { ...value }
  }

  snapshot(): Record<string, ModelSelectionConfig> {
    return Object.fromEntries([...this.values].map(([id, value]) => [id, { ...value }]))
  }

  /** Both host activation and HTTP reads wait for this shared initialization. */
  ready(): Promise<void> {
    return this.loading ??= this.load()
  }

  async set(sessionId: string, selection: ModelSelectionConfig | undefined): Promise<void> {
    if (selection !== undefined && !isSelection(selection)) throw new Error('Invalid model selection')
    const detached = selection === undefined ? undefined : { ...selection }
    await this.ready()
    const operation = this.writing.then(async () => {
      const next = new Map(this.values)
      if (detached === undefined) next.delete(sessionId)
      else next.set(sessionId, detached)
      // Commit in memory only after durable write succeeds. A failed save is
      // reported to the caller and does not poison subsequent writes.
      await this.writeOnce(Object.fromEntries(next))
      this.values.clear()
      for (const [id, value] of next) this.values.set(id, value)
    })
    this.writing = operation.catch(() => {})
    await operation
  }

  private async load(): Promise<void> {
    let text: string
    try {
      text = await readFile(this.path, 'utf8')
    } catch (cause) {
      if ((cause as NodeJS.ErrnoException).code === 'ENOENT') return
      throw cause
    }
    let raw: unknown
    try { raw = JSON.parse(text) } catch (cause) { throw new Error('Session model selections are corrupt; delegation is blocked', { cause }) }
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Invalid session model selections')
    if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
      for (const [id, value] of Object.entries(raw)) {
        if (!isSelection(value)) throw new Error('Invalid saved model selection for session ' + id)
        this.values.set(id, value)
      }
    }
  }

  private async writeOnce(value: Record<string, ModelSelectionConfig>): Promise<void> {
    await writeAtomicJson(this.path, value)
  }

}

function isSelection(value: unknown): value is ModelSelectionConfig {
  if (value === null || typeof value !== 'object') return false
  const row = value as { provider?: unknown; model?: unknown; reasoningEffort?: unknown }
  return typeof row.provider === 'string' && row.provider.trim().length > 0
    && typeof row.model === 'string' && row.model.trim().length > 0
    && (row.reasoningEffort === undefined || (typeof row.reasoningEffort === 'string' && row.reasoningEffort.trim().length > 0))
}

/** Minimal face of the host web-server route registry. */
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

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolveBody, rejectBody) => {
    let data = ''
    req.on('data', (chunk: Buffer) => { data += chunk })
    req.on('end', () => { resolveBody(data) })
    req.on('error', rejectBody)
  })
}

/**
 * Mount GET/POST session-overrides when a web server is available.
 * @param ctx - host context.
 * @param store - override map.
 */
export function installSessionOverridesHttp(ctx: Context, store: SessionOverrideStore, validate?: RouteValidator, gate?: HttpGate): void {
  let registered = false
  const mount = (web: WebRouteHost): void => {
    if (registered) return
    registered = true
    ctx.effect(() => web.register({
      kind: 'exact',
      path: SESSION_OVERRIDES_ROUTE,
      handler: async (req: IncomingMessage, res: ServerResponse) => {
        const denied = gate?.(req)
        if (denied) { json(res, denied, { ok: false, error: { message: 'Owner authentication required' } }); return }
        if (req.method === 'GET') {
          try {
            await store.ready()
          } catch {
            json(res, 500, { ok: false, error: { message: 'Cannot load session overrides' } })
            return
          }
          json(res, 200, { ok: true, value: store.snapshot() })
          return
        }
        if (req.method === 'POST') {
          try {
            const body = JSON.parse(await readBody(req)) as {
              sessionId?: unknown
              selection?: ModelSelectionConfig | null
            }
            if (body === null || typeof body !== 'object' || typeof body.sessionId !== 'string' || body.sessionId.length === 0) {
              json(res, 400, { ok: false, error: { message: 'sessionId required' } })
              return
            }
            const selection = body.selection === null || body.selection === undefined
              ? undefined
              : body.selection
            if (selection !== undefined && !isSelection(selection)) {
              json(res, 400, { ok: false, error: { message: 'invalid selection' } })
              return
            }
            if (selection !== undefined && validate !== undefined) {
              try { await validate(selection) } catch (cause) {
                json(res, 400, { ok: false, error: { code: 'invalid-model-route', message: cause instanceof Error ? cause.message : String(cause) } })
                return
              }
            }
            try {
              await store.set(body.sessionId, selection)
            } catch {
              json(res, 500, { ok: false, error: { message: 'Cannot save session overrides' } })
              return
            }
            json(res, 200, { ok: true, value: store.snapshot() })
          } catch (cause) {
            json(res, 400, {
              ok: false,
              error: { message: cause instanceof Error ? cause.message : String(cause) },
            })
          }
          return
        }
        res.writeHead(405, { allow: 'GET, POST' })
        res.end()
      },
    }), 'model-switch: session-overrides route')
  }
  const web = ctx.get('webServer') as WebRouteHost | undefined
  if (web !== undefined) {
    mount(web)
    return
  }
  ctx.inject(['webServer'], (webCtx) => {
    mount(webCtx.webServer)
  })
}

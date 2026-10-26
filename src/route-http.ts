/** Authenticated UI-only controls; model-facing tools never call confirmation. */
import type { Context } from '@deepseek-ai/cordis'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { ROUTE_CONFIRM_PATH, ROUTE_STATUS_PATH } from './route-contract.ts'
import { RouteEnforcer } from './route-enforcer.ts'
import { validSelection } from './route-locks.ts'
export type HttpGate = (req: IncomingMessage) => number | undefined
export function ownerGate(ctx: Context): HttpGate {
  return req => {
    const connection = ctx.get('connection') as { operator?: unknown; admit(req: IncomingMessage): { rejection?: number; peer?: { principal?: { kind: string } } } } | undefined
    if (!connection || typeof connection.admit !== 'function') return 503
    const admission = connection.admit(req)
    if (admission.rejection) return admission.rejection
    // New hosts admit scoped Peers too; authentication alone is not ownership.
    // 0.2.0 has a single public operator identity instead of principals.
    return admission.peer?.principal?.kind === 'owner' || (connection.operator !== undefined && admission.peer === connection.operator) ? undefined : 403
  }
}
function json(res: ServerResponse, status: number, value: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(value))
}
async function body(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []; let length = 0
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk); length += buffer.length
    if (length > 8192) throw new Error('Request too large')
    chunks.push(buffer)
  }
  return JSON.parse(Buffer.concat(chunks).toString())
}
export function installRouteHttp(ctx: Context, authority: RouteEnforcer): void {
  ctx.inject(['webServer'], scope => {
    const gate = ownerGate(ctx)
    scope.effect(() => scope.webServer.register({ kind: 'exact', path: ROUTE_STATUS_PATH, handler: async (req, res) => {
      const denied = gate(req); if (denied) { json(res, denied, { ok: false }); return }
      if (req.method !== 'GET') { json(res, 405, { ok: false }); return }
      const id = new URL(req.url ?? '/', 'http://localhost').searchParams.get('sessionId') ?? ''
      json(res, 200, { ok: true, value: await authority.status(id) })
    } }), 'model-switch: protected route status')
    scope.effect(() => scope.webServer.register({ kind: 'exact', path: ROUTE_CONFIRM_PATH, handler: async (req, res) => {
      const denied = gate(req); if (denied) { json(res, denied, { ok: false }); return }
      if (req.method !== 'POST') { json(res, 405, { ok: false }); return }
      try {
        const data = await body(req) as { parentId?: unknown; childId?: unknown; selection?: unknown }
        if (!data || typeof data.parentId !== 'string' || typeof data.childId !== 'string' || !validSelection(data.selection)) throw new Error('Parent, child and a valid model selection are required')
        await authority.confirm(data.parentId, data.childId, data.selection)
        json(res, 200, { ok: true, value: await authority.status(data.childId) })
      } catch (cause) { json(res, 409, { ok: false, error: { message: cause instanceof Error ? cause.message : String(cause) } }) }
    } }), 'model-switch: owner-confirmed historical route')
  })
}

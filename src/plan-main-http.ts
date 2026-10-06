/** Read-only pre-plan selections for the review panel. */
import type { Context } from '@deepseek-ai/cordis'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { SessionOverrideStore } from './session-overrides.ts'
import { PLAN_MAIN_MODELS_ROUTE } from './plan-routes.ts'
interface WebFace { register(route: { kind: 'exact'; path: string; handler(req: IncomingMessage, res: ServerResponse): void }): () => void }
export function installPlanMainsHttp(ctx: Context, store: SessionOverrideStore): void {
  let mounted = false
  const mount = (web: WebFace): void => {
    if (mounted) return
    mounted = true
    ctx.effect(() => web.register({ kind: 'exact', path: PLAN_MAIN_MODELS_ROUTE, handler(req, res) {
      if (req.method !== 'GET') { res.writeHead(405, { allow: 'GET' }); res.end(); return }
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
      res.end(JSON.stringify({ ok: true, value: store.snapshot() }))
    } }), 'model-switch: pre-plan models')
  }
  const web = ctx.get('webServer') as WebFace | undefined
  if (web !== undefined) mount(web)
  else ctx.inject(['webServer'], scope => mount(scope.webServer))
}

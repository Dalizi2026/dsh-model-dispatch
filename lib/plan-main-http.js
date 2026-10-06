import { PLAN_MAIN_MODELS_ROUTE } from "./plan-routes.js";
export function installPlanMainsHttp(ctx, store) {
    let mounted = false;
    const mount = (web) => {
        if (mounted)
            return;
        mounted = true;
        ctx.effect(() => web.register({ kind: 'exact', path: PLAN_MAIN_MODELS_ROUTE, handler(req, res) {
                if (req.method !== 'GET') {
                    res.writeHead(405, { allow: 'GET' });
                    res.end();
                    return;
                }
                res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
                res.end(JSON.stringify({ ok: true, value: store.snapshot() }));
            } }), 'model-switch: pre-plan models');
    };
    const web = ctx.get('webServer');
    if (web !== undefined)
        mount(web);
    else
        ctx.inject(['webServer'], scope => mount(scope.webServer));
}

import { describe, it, expect, vi } from 'vitest'
import { installPlanMainsHttp } from '../src/plan-main-http.ts'
import { PLAN_MAIN_MODELS_ROUTE } from '../src/plan-routes.ts'
const response = () => ({ status: 0, body: '', writeHead(value: number) { this.status = value }, end(value = '') { this.body = value } })
function setup(ready = async () => {}) {
  let route: any
  const snapshot = vi.fn(() => ({ s1: { provider: 'droid', model: 'sonnet', reasoningEffort: 'high' } }))
  installPlanMainsHttp({ get: () => ({ register: (value: any) => { route = value; return () => {} } }), effect: (fn: () => unknown) => fn() } as never, { ready, snapshot } as never)
  return { route, snapshot }
}
describe('review model readout', () => {
  it('serves the stored original model and refuses writes', async () => {
    const { route } = setup()
    expect(route.path).toBe(PLAN_MAIN_MODELS_ROUTE)
    const read = response(); await route.handler({ method: 'GET' }, read)
    expect(read.status).toBe(200); expect(JSON.parse(read.body).value.s1.model).toBe('sonnet')
    const write = response(); await route.handler({ method: 'POST' }, write); expect(write.status).toBe(405)
  })
  it('does not send an empty snapshot while initialization is pending', async () => {
    let release!: () => void
    const { route, snapshot } = setup(() => new Promise(resolve => { release = resolve }))
    const read = response(); const pending = route.handler({ method: 'GET' }, read)
    expect(read.status).toBe(0); expect(snapshot).not.toHaveBeenCalled()
    release(); await pending; expect(read.status).toBe(200); expect(snapshot).toHaveBeenCalledOnce()
  })
  it('reports failed initialization explicitly instead of claiming an empty saved model', async () => {
    const { route, snapshot } = setup(async () => { throw new Error('corrupt storage') })
    const read = response(); await route.handler({ method: 'GET' }, read)
    expect(read.status).toBe(503); expect(JSON.parse(read.body)).toMatchObject({ ok: false, error: { message: expect.any(String) } })
    expect(snapshot).not.toHaveBeenCalled()
  })
})

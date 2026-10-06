import { describe, it, expect } from 'vitest'
import { installPlanMainsHttp } from '../src/plan-main-http.ts'
import { PLAN_MAIN_MODELS_ROUTE } from '../src/plan-routes.ts'

describe('review model readout', () => {
  it('serves the stored original model and refuses writes', () => {
    let route: any
    installPlanMainsHttp({ get: () => ({ register: (value: any) => { route = value; return () => {} } }), effect: (fn: () => unknown) => fn() } as never, { snapshot: () => ({ s1: { provider: 'droid', model: 'sonnet', reasoningEffort: 'high' } }) } as never)
    expect(route.path).toBe(PLAN_MAIN_MODELS_ROUTE)
    const response = () => ({ status: 0, body: '', writeHead(value: number) { this.status = value }, end(value = '') { this.body = value } })
    const read = response(); route.handler({ method: 'GET' }, read)
    expect(read.status).toBe(200); expect(JSON.parse(read.body).value.s1.model).toBe('sonnet')
    const write = response(); route.handler({ method: 'POST' }, write); expect(write.status).toBe(405)
  })
})

import { Readable } from 'node:stream'
import { describe, expect, it, vi } from 'vitest'
import { installRouteHttp, ownerGate } from '../src/route-http.ts'
import { HOST_SEAMS_PATH, ROUTE_CONFIRM_PATH, ROUTE_STATUS_PATH } from '../src/route-contract.ts'
const report = [{ capability: 'plan-switch', missing: ['sessionController.selectModel'], mismatched: [] }]
function setup(authenticated = true, connected = true) {
  const handlers = new Map<string, Function>()
  const authority = { status: vi.fn(async (sessionId: string) => ({ sessionId, state: 'locked' })), confirm: vi.fn(async () => {}) }
  const seams = { report: vi.fn(() => report) }
  const ctx = { get: () => connected ? ({ admit: () => authenticated ? { peer: { principal: { kind: 'owner' } } } : { rejection: 401 } }) : undefined,
    inject: (_deps: unknown, fn: Function) => fn(ctx), effect: (fn: Function) => fn(),
    webServer: { register: ({ path, handler }: any) => { handlers.set(path, handler); return () => {} } } }
  installRouteHttp(ctx as never, authority as never, seams as never)
  async function call(path: string, method: string, body?: unknown) {
    const req = Object.assign(Readable.from(body === undefined ? [] : [JSON.stringify(body)]), { method, url: path + '?sessionId=child' })
    const res = { status: 0, value: undefined as any, writeHead(status: number) { this.status = status }, end(text: string) { this.value = JSON.parse(text) } }
    await handlers.get(path)!(req, res); return res
  }
  return { call, authority, seams }
}
describe('authenticated human route confirmation', () => {
  it('rejects authenticated non-owner Peers and recognizes only the legacy operator identity', () => {
    expect(ownerGate({ get: () => ({ admit: () => ({ peer: { principal: { kind: 'agent' } } }) }) } as never)({} as never)).toBe(403)
    const operator = {}
    expect(ownerGate({ get: () => ({ operator, admit: () => ({ peer: operator }) }) } as never)({} as never)).toBeUndefined()
    expect(ownerGate({ get: () => ({ operator, admit: () => ({ peer: {} }) }) } as never)({} as never)).toBe(403)
  })
  it('requires native owner admission even for read and fails closed without the connection service', async () => {
    const h = setup(false)
    expect((await h.call(ROUTE_STATUS_PATH, 'GET')).status).toBe(401)
    expect((await h.call(ROUTE_CONFIRM_PATH, 'POST', {})).status).toBe(401)
    expect(h.authority.status).not.toHaveBeenCalled(); expect(h.authority.confirm).not.toHaveBeenCalled()
    expect(ownerGate({ get: () => undefined } as never)({} as never)).toBe(503)
  })
  it('accepts only valid UI confirmation data and delegates ownership checking to the authority', async () => {
    const h = setup(); const body = { parentId: 'parent', childId: 'child', selection: { provider: 'glm', model: 'flash' } }
    expect((await h.call(ROUTE_CONFIRM_PATH, 'POST', body)).status).toBe(200)
    expect(h.authority.confirm).toHaveBeenCalledWith('parent', 'child', body.selection)
    h.authority.confirm.mockRejectedValueOnce(new Error('The child does not belong to this parent'))
    expect((await h.call(ROUTE_CONFIRM_PATH, 'POST', { ...body, parentId: 'other' })).status).toBe(409)
    expect((await h.call(ROUTE_CONFIRM_PATH, 'GET')).status).toBe(405)
    expect((await h.call(ROUTE_CONFIRM_PATH, 'POST', null)).status).toBe(409)
    expect((await h.call(ROUTE_CONFIRM_PATH, 'POST', { ...body, selection: { model: 'opus' } })).status).toBe(409)
  })
  it('serves the host seam report to the owner only, checked on each read', async () => {
    const h = setup()
    const read = await h.call(HOST_SEAMS_PATH, 'GET')
    expect(read).toMatchObject({ status: 200, value: { ok: true, value: report } })
    await h.call(HOST_SEAMS_PATH, 'GET'); expect(h.seams.report).toHaveBeenCalledTimes(2)
    expect((await h.call(HOST_SEAMS_PATH, 'POST', {})).status).toBe(405)
    const denied = setup(false); expect((await denied.call(HOST_SEAMS_PATH, 'GET')).status).toBe(401)
    expect(denied.seams.report).not.toHaveBeenCalled()
  })
  it('names the missing authentication seam instead of an anonymous 503', async () => {
    const h = setup(true, false)
    for (const path of [ROUTE_STATUS_PATH, HOST_SEAMS_PATH]) {
      const res = await h.call(path, 'GET')
      expect(res.status).toBe(503); expect(res.value.error.message).toContain('connection.admit')
    }
  })
})

import { Readable } from 'node:stream'
import { describe, expect, it, vi } from 'vitest'
import { installRouteHttp, ownerGate } from '../src/route-http.ts'
import { ROUTE_CONFIRM_PATH, ROUTE_STATUS_PATH } from '../src/route-contract.ts'
function setup(authenticated = true) {
  const handlers = new Map<string, Function>()
  const authority = { status: vi.fn(async (sessionId: string) => ({ sessionId, state: 'locked' })), confirm: vi.fn(async () => {}) }
  const ctx = { get: () => ({ admit: () => authenticated ? { peer: { principal: { kind: 'owner' } } } : { rejection: 401 } }),
    inject: (_deps: unknown, fn: Function) => fn(ctx), effect: (fn: Function) => fn(),
    webServer: { register: ({ path, handler }: any) => { handlers.set(path, handler); return () => {} } } }
  installRouteHttp(ctx as never, authority as never)
  async function call(path: string, method: string, body?: unknown) {
    const req = Object.assign(Readable.from(body === undefined ? [] : [JSON.stringify(body)]), { method, url: path + '?sessionId=child' })
    const res = { status: 0, value: undefined as any, writeHead(status: number) { this.status = status }, end(text: string) { this.value = JSON.parse(text) } }
    await handlers.get(path)!(req, res); return res
  }
  return { call, authority }
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
})

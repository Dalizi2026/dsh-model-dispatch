/** Isolated native-host regression. DSH_TEST_MODULE_ROOT must contain official DSH packages. */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
import { pathToFileURL, fileURLToPath } from 'node:url'
import YAML from 'yaml'
const root = process.env.DSH_TEST_MODULE_ROOT
if (!root || !path.isAbsolute(root)) throw new Error('Set DSH_TEST_MODULE_ROOT to an absolute native node_modules directory')
const repo = process.env.DSH_TEST_PLUGIN_ROOT ?? fileURLToPath(new URL('..', import.meta.url))
if (!path.isAbsolute(repo) || !fs.existsSync(path.join(repo, 'package.json'))) throw new Error('Invalid test plugin directory')
const pluginVersion = JSON.parse(fs.readFileSync(path.join(repo, 'package.json'), 'utf8')).version
const home = process.env.DSH_TEST_HOME ?? fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-route-' + pluginVersion + '-'))
const phase = process.env.DSH_TEST_PHASE
if (phase && !['resume', 'historical'].includes(phase)) throw new Error('Unknown verification phase')
const marker = path.join(home, '.dsh-route-test-home')
if (fs.existsSync(home) && fs.readdirSync(home).length && !fs.existsSync(marker)) throw new Error('Refusing a non-test DSH home; choose a fresh test directory')
fs.mkdirSync(home, { recursive: true }); fs.writeFileSync(marker, 'isolated model routing verification\n')
const previous = phase ? JSON.parse(fs.readFileSync(process.env.DSH_TEST_PREVIOUS_REPORT, 'utf8')) : undefined
const previousChild = previous?.headers.find(h => h.origin === 'subagent')
if (phase && !previousChild?.parentId) throw new Error('Previous native-host report has no child address')
if (phase === 'historical') {
  const file = path.join(home, 'storages/model-switch/child-route-locks.json')
  const document = JSON.parse(fs.readFileSync(file, 'utf8'))
  delete document.locks[previousChild.sessionId]
  fs.writeFileSync(file, JSON.stringify(document), { mode: 0o600 })
}
const profile = path.join(home, 'profiles/route-test')
fs.mkdirSync(path.join(profile, 'node_modules'), { recursive: true })
fs.mkdirSync(path.join(home, 'workspace'), { recursive: true })
if (!fs.existsSync(path.join(profile, 'node_modules/dsh-model-dispatch'))) fs.symlinkSync(repo, path.join(profile, 'node_modules/dsh-model-dispatch'), process.platform === 'win32' ? 'junction' : 'dir')
fs.writeFileSync(path.join(profile, 'cordis.yml'), '[]\n')
const GLM = { provider: 'test-glm', model: 'glm-flash', reasoningEffort: 'max' }
const OPUS = { provider: 'test-opus', model: 'opus', reasoningEffort: 'high' }
const MAIN = { provider: 'test-main', model: 'sonnet', reasoningEffort: 'high' }
const PLAN = { provider: 'test-plan', model: 'step', reasoningEffort: 'max' }
fs.writeFileSync(path.join(profile, 'cordis.patch.yml'), YAML.stringify([
  { id: 'agent-default-model', config: OPUS },
  { id: 'model-switch', config: { subagent: { mode: 'custom', selection: phase ? PLAN : GLM }, planPlanning: { mode: 'custom', selection: PLAN } } },
  { id: 'session-title-llm', disabled: true },
  { id: 'subagent', config: { maxDepth: 3, maxActiveSubagents: 8 } },
  { id: 'tool-subagent', config: { provider: 'spawn', toolName: 'subagent', maxDepth: 3 } },
]))
fs.writeFileSync(path.join(profile, 'package.json'), JSON.stringify({ name: 'dsh-route-test', private: true, dependencies: { 'dsh-model-dispatch': 'link:' + repo }, dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', 'dsh-model-dispatch'] } } }))
process.env.DSH_HOME = home
process.env.DSH_TELEMETRY_DISABLED = '1'
const native = async name => import(pathToFileURL(path.join(root, '@deepseek-ai', name, 'lib/index.js')).href)
const { runProfile } = await import(pathToFileURL(path.join(root, '@deepseek-ai/dsh/lib/profile-boot.js')).href)
const { loadLayeredEnv } = await native('dsh-app-boot')
const { LlmAdapter, createUserMessage } = await native('dsh-llm')
// Observe the native engine selected by each preset without replacing its work.
// Services inside preset groups are intentionally invisible to the root ctx.
const nativeCompactors = new WeakMap()
const { BasicCompactionEngine } = await native('dsh-compaction-basic')
const compactNative = BasicCompactionEngine.prototype.compactIfNeeded
BasicCompactionEngine.prototype.compactIfNeeded = function (agent, ...args) {
  nativeCompactors.set(agent, this)
  return compactNative.call(this, agent, ...args)
}
const runtime = await runProfile({ profile: 'route-test', patchFiles: [], environment: loadLayeredEnv('dsh'), args: ['--host', '127.0.0.1', '--port', '0', '--no-open'] })
const ctx = runtime.ctx
const version = JSON.parse(fs.readFileSync(path.join(root, '@deepseek-ai/dsh/package.json'))).version
const evidence = { host: version, phase: phase ?? 'initial', plugin: pluginVersion, paidRequests: 0, calls: [], auxiliaryEnvelopes: [], headers: [], results: [], cases: [] }
const finish = () => { if (process.env.DSH_TEST_REPORT) fs.writeFileSync(process.env.DSH_TEST_REPORT, JSON.stringify(evidence, null, 2)) }
let cookie = ''
try {
  const seen = new Map()
  const roots = new Set()
  let draftOnly = false
  class MockAdapter extends LlmAdapter {
    providerInfo(provider) { return { id: provider, name: provider } }
    async listModels(provider) { return [{ provider, id: ({ 'test-main': 'sonnet', 'test-opus': 'opus', 'test-glm': 'glm-flash', 'test-plan': 'step' })[provider], name: provider }] }
    async resolveModel(provider, model) { return { provider, id: model, name: model, context: { contextWindow: 200000 }, maxTokens: 1000, reasoning: { defaultEffort: provider === 'test-main' || provider === 'test-opus' ? 'high' : 'max', efforts: [{ id: 'high', name: 'High' }, { id: 'max', name: 'Max' }] } } }
    async *stream(options) {
      const route = { provider: options.provider, model: options.model, reasoningEffort: options.reasoningEffort }
      evidence.calls.push({ sessionId: options.sessionId, ...route, ...options.purpose ? { purpose: options.purpose } : {} })
      const count = (seen.get(options.sessionId) ?? 0) + 1; seen.set(options.sessionId, count)
      if (count > 12) throw new Error('Verification exceeded the request budget')
      const activePlan = roots.has(options.sessionId) && options.provider === PLAN.provider
      const text = options.messages.flatMap(m => m.content ?? []).filter(p => p.type === 'text').map(p => p.text).join('\n')
      if (phase && options.sessionId === previousChild.sessionId) evidence.historyRetained = text.includes('NESTED_TEST')
      let tool
      if (!phase && roots.has(options.sessionId) && activePlan && !draftOnly && options.purpose !== 'compaction') tool = { name: 'exit_plan_mode', args: { plan: '# Verification plan\nAfter approval, reply EXEC_OK without tools.' } }
      else if (!phase && options.purpose !== 'compaction' && ((roots.has(options.sessionId) && count === 1) || (!roots.has(options.sessionId) && text.includes('NESTED_TEST') && count === 1))) tool = { name: 'subagent', args: { description: 'conflicting machine Opus preference', prompt: roots.has(options.sessionId) ? 'NESTED_TEST. Reply CHILD_OK.' : 'Reply LEAF_OK. No tools.', provider: OPUS.provider, model: OPUS.model, reasoning_effort: OPUS.reasoningEffort } }
      if (tool) {
        const block = { type: 'tool-call', id: 'call-' + options.sessionId + '-' + count, name: tool.name, arguments: JSON.stringify(tool.args) }
        yield { type: 'block-start', index: 0, blockType: 'tool-call' }; yield { type: 'block-end', index: 0, block }; yield { type: 'finish', reason: { kind: 'tool-calls' } }
      } else {
        const block = { type: 'text', text: 'ROUTE_TEST_OK' }
        yield { type: 'block-start', index: 0, blockType: 'text' }; yield { type: 'text-delta', index: 0, text: block.text }; yield { type: 'block-end', index: 0, block }; yield { type: 'finish', reason: { kind: 'stop' } }
      }
    }
  }
  ctx.llm.registerAdapter(['test-main', 'test-opus', 'test-glm', 'test-plan'], new MockAdapter())
  ctx.on('llm/stream', async function* (options, next) {
    if (options.purpose === 'compaction' && options.provider === GLM.provider && options.model === GLM.model && options.reasoningEffort === undefined) {
      evidence.auxiliaryEnvelopes.push({ sessionId: options.sessionId, provider: options.provider, model: options.model, reasoningEffort: options.reasoningEffort })
      for (const wrong of [{ provider: OPUS.provider }, { model: OPUS.model }, { reasoningEffort: 'high' }]) {
        await assert.rejects(async () => { for await (const _ of ctx.llm.stream(Object.freeze({ ...options, ...wrong }))) {} }, /Blocked model mismatch/)
      }
    }
    yield* next()
  }, { prepend: true })
  const compactedChildren = new Set()
  if (!phase) ctx.on('agent/created', ({ agent }) => {
    if (agent.session.header.origin !== 'subagent') return
    agent.ctx.on('agent/pre-step', async ({ signal }, next) => {
    const decision = await next()
    if (decision.kind === 'reject' || signal.aborted || agent.session.header.origin !== 'subagent'
      || !agent.session.requestHeader() || compactedChildren.size) return decision
    const compactor = nativeCompactors.get(agent)
    if (!compactor) { evidence.compactionError = 'native compaction service missing'; throw new Error(evidence.compactionError) }
    compactedChildren.add(agent.id)
    try {
      const result = await compactor.compactIfNeeded(agent, 'context-overflow', signal)
      assert(result, 'native compaction did not summarize')
    } catch (cause) { evidence.compactionError = cause.stack; throw cause }
    return decision
    }, { prepend: true })
  })
  ctx.on('session/event', (session, event) => {
    if (event.type === 'tool/result') evidence.results.push({ sessionId: session.header.id, error: event.data.message.isError, text: event.data.message.content?.filter(p => p.type === 'text').map(p => p.text).join('') })
    if (event.type === 'request/header') evidence.headers.push({ sessionId: session.header.id, parentId: session.header.parentSession, origin: session.header.origin, route: event.data.header.config })
  }, { global: true })
  ctx.on('user-questions/request', async (request, next) => {
    const q = request.questions?.[0]
    if (q?.intent?.kind !== 'plan-review' || !roots.has(request.agent?.id)) return next()
    return { answers: [{ id: q.id, selected: [q.intent.approve] }] }
  }, { global: true, prepend: true })
  const origin = ctx.webServer.getOrigin?.() ?? `http://${ctx.webServer.host}:${ctx.webServer.port}`
  const connection = ctx.get('connection')
  const login = await fetch(connection.authenticatedUrl(origin), { redirect: 'manual' })
  cookie = login.headers.get('set-cookie')?.split(';')[0] ?? ''
  assert(cookie, 'native browser authentication unavailable')
  const request = async (route, data) => {
    const response = await fetch(origin + '/_dsh/model-switch/' + route, { method: data ? 'POST' : 'GET', headers: { cookie, ...(data ? { 'content-type': 'application/json' } : {}) }, ...(data ? { body: JSON.stringify(data) } : {}) })
    const result = await response.json(); assert(response.ok, JSON.stringify(result)); return result.value
  }
  if (phase) {
    const parentId = previousChild.parentId, childId = previousChild.sessionId
    const { agent } = await ctx.sessionController.resolveAgent(parentId); roots.add(agent.id)
    const settle = async () => {
      for (let i = 0, stable = 0; i < 16 && stable < 2; i++) {
        const count = evidence.calls.length
        await Promise.all(ctx.agents.list().map(a => a.whenIdle()))
        await new Promise(resolve => setImmediate(resolve))
        stable = evidence.calls.length === count ? stable + 1 : 0
      }
    }
    if (phase === 'historical') {
      assert.equal((await request('route-status?sessionId=' + childId)).state, 'confirmation-required')
      await ctx.subagents.sendMessage(agent, childId, [{ type: 'text', text: 'This request must pause for human confirmation.' }], { signal: new AbortController().signal })
      await settle()
      assert.equal(evidence.calls.filter(c => c.sessionId === childId).length, 0, 'historical child dispatched before confirmation')
      const rejected = await fetch(origin + '/_dsh/model-switch/confirm-child-route', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ parentId, childId, selection: PLAN }) })
      assert.equal(rejected.status, 401, 'unauthenticated confirmation was accepted')
      const foreign = await fetch(origin + '/_dsh/model-switch/confirm-child-route', { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ parentId: 'other-parent', childId, selection: PLAN }) })
      assert.equal(foreign.status, 409, 'foreign-parent confirmation was accepted')
      await request('confirm-child-route', { parentId, childId, selection: PLAN })
      evidence.cases.push({ name: 'historical child stops before dispatch; owner authentication and parent relationship required', pass: true, requestsBeforeConfirmation: 0 })
    }
    await ctx.subagents.sendMessage(agent, childId, [{ type: 'text', text: 'Continue with the existing context. Reply VERIFIED.' }], { signal: new AbortController().signal })
    await settle()
    const calls = evidence.calls.filter(c => c.sessionId === childId)
    const expected = phase === 'historical' ? PLAN : GLM
    assert(calls.length > 0, 'resumed child did not dispatch')
    for (const call of calls) { assert.equal(call.provider, expected.provider); assert.equal(call.model, expected.model) }
    const status = await request('route-status?sessionId=' + childId)
    assert.equal(status.pluginVersion, pluginVersion); assert.equal(status.policyVersion, 1); evidence.runtimePluginVersion = status.pluginVersion
    assert.equal(status.state, 'locked'); assert.deepEqual(status.expected, expected); assert.deepEqual(status.actual, expected)
    assert(evidence.historyRetained, 'original context was not retained after resume')
    assert.equal(evidence.calls.filter(c => c.provider === OPUS.provider).length, 0)
    evidence.cases.push({ name: phase === 'historical' ? 'human-confirmed model resumes with original context' : 'new process restores the child lock despite changed defaults', pass: true, route: expected, opusDispatches: 0 })
  } else {
    const { sessionId } = await ctx.sessionController.create({ cwd: path.join(home, 'workspace') })
    const { agent } = await ctx.sessionController.resolveAgent(sessionId); roots.add(agent.id)
    await ctx.sessionController.selectModel({ sessionId, ...MAIN })
    async function message(text) {
      agent.followup(createUserMessage({ content: [{ type: 'text', text }], source: { kind: 'user' } }))
      await Promise.race([agent.whenIdle(), new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error('Host test timeout')), 45000); timer.unref() })])
      if (ctx.subagents.waitForChildren) {
        for (let i = 0; i < 12; i++) { if (!(await ctx.subagents.waitForChildren(agent))) break; await agent.whenIdle() }
      } else {
        // 0.2.0 exposes idle Agents but no forest join API.
        for (let i = 0, stable = 0; i < 16 && stable < 2; i++) {
          const count = evidence.calls.length
          await Promise.all(ctx.agents.list().map(a => a.whenIdle()))
          await new Promise(resolve => setImmediate(resolve))
          stable = evidence.calls.length === count ? stable + 1 : 0
        }
      }
    }
    await request('session-overrides', { sessionId, selection: GLM })
    await message('Delegate once, using the test subagent. No file changes.')
    const locksPath = path.join(home, 'storages/model-switch/child-route-locks.json')
    const locks = JSON.parse(fs.readFileSync(locksPath)).locks
    const childHeaders = evidence.headers.filter(h => h.origin === 'subagent')
    assert(childHeaders.length >= 2, 'expected child and nested delegation request headers')
    for (const header of childHeaders) {
      assert.equal(header.route.provider, GLM.provider); assert.equal(header.route.model, GLM.model)
      assert.deepEqual(locks[header.sessionId].selection, GLM)
    }
    assert.equal(evidence.calls.filter(c => c.provider === OPUS.provider).length, 0, 'Opus adapter must never dispatch')
    evidence.cases.push({ name: 'native tool conflict + managed creation + nested child + headers + adapter dispatch', pass: true, childRequests: childHeaders.length, opusDispatches: 0 })
    const child = childHeaders[0].sessionId
    const status = await request('route-status?sessionId=' + child)
    assert.equal(status.pluginVersion, pluginVersion); assert.equal(status.policyVersion, 1); evidence.runtimePluginVersion = status.pluginVersion
    assert.equal(status.state, 'locked'); assert.deepEqual(status.expected, GLM); assert.deepEqual(status.actual, GLM)
    evidence.cases.push({ name: 'authenticated host-acknowledged status', pass: true })
    // Exercise the real BasicCompactionEngine, not a synthetic purpose bypass.
    const compactCalls = evidence.calls.filter(c => c.purpose === 'compaction')
    assert(compactCalls.length > 0, 'missing native compaction adapter call')
    for (const call of compactCalls) {
      assert.equal(call.provider, GLM.provider); assert.equal(call.model, GLM.model)
      assert.equal(call.reasoningEffort, GLM.reasoningEffort, 'adapter should apply the target model default effort')
    }
    assert(evidence.auxiliaryEnvelopes.length > 0)
    for (const envelope of evidence.auxiliaryEnvelopes) assert.equal(envelope.reasoningEffort, undefined)
    const auxiliary = { provider: GLM.provider, model: GLM.model, sessionId: child, messages: [], purpose: 'compaction' }
    await assert.rejects(async () => { for await (const _ of ctx.llm.stream(Object.freeze(auxiliary))) {} }, /reasoningEffort/)
    evidence.cases.push({ name: 'native compaction omits effort without breaking the child lock; purpose alone cannot bypass effort', pass: true })
    const unknown = await request('route-status?sessionId=missing-test-session')
    assert.equal(unknown.state, 'missing')
    const dormantHandle = await ctx.agents.create({ sessionId: 'session-dormant-test', meta: { cwd: path.join(home, 'workspace') }, agentOptions: MAIN })
    const dormant = { sessionId: dormantHandle.agent.id }
    await ctx.sessions.flush(dormantHandle.agent.session)
    await dormantHandle.dispose()
    assert(!ctx.agents.get(dormant.sessionId), 'dormant session is still live')
    const dormantStatus = await request('route-status?sessionId=' + dormant.sessionId)
    assert.equal(dormantStatus.state, 'unverified')
    await request('session-overrides', { sessionId: dormant.sessionId, selection: GLM })
    assert.equal((await request('route-status?sessionId=' + dormant.sessionId)).state, 'unverified')
    evidence.cases.push({ name: 'missing and dormant sessions never claim ready; saved choices remain editable', pass: true })
    if (typeof ctx.subagents.start === 'function') {
      const run = await ctx.subagents.start('spawn', { parent: agent, label: 'legacy direct conflict', signal: new AbortController().signal,
        prompt: [{ type: 'text', text: 'Reply LEGACY_OK. No tools.' }], agentOptions: OPUS, maxDepth: 3 })
      const result = await run.result
      assert.equal(result.stopReason, 'completed')
      const calls = evidence.calls.filter(c => c.sessionId === run.id)
      assert(calls.length > 0)
      for (const call of calls) assert.equal(call.provider, GLM.provider)
      assert.deepEqual((await request('route-status?sessionId=' + run.id)).expected, GLM)
      await run.dispose()
      evidence.cases.push({ name: 'legacy foreground start rejects machine Opus preference', pass: true, opusDispatches: 0 })
    }
    // Plan activation in an existing conversation, then approval before execution.
    await ctx.commands.execute(agent, '/plan', [], new AbortController().signal)
    const before = evidence.headers.length
    await message('Submit a one-line plan and, after approval, reply EXEC_OK.')
    const phase = evidence.headers.slice(before).filter(h => h.sessionId === sessionId).map(h => h.route)
    assert(phase.some(c => c.provider === PLAN.provider), 'planning provider missing after mid-chat /plan')
    assert.equal(phase.at(-1)?.provider, MAIN.provider, 'approval did not restore original main')
    evidence.cases.push({ name: 'mid-chat planning and approval restore', pass: true, routes: phase })
    draftOnly = true
    await ctx.commands.execute(agent, '/plan', [], new AbortController().signal)
    await message('Draft without requesting approval. Reply DRAFT_OK.')
    assert.equal(evidence.headers.filter(h => h.sessionId === sessionId).at(-1).route.provider, PLAN.provider)
    // Idle /plan off commits plan/mode:false before the next native pre-step.
    await ctx.commands.execute(agent, '/plan off', [], new AbortController().signal)
    await message('Execute with the original main model. Reply EXEC_OK.')
    assert.equal(evidence.headers.filter(h => h.sessionId === sessionId).at(-1).route.provider, MAIN.provider)
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(home, 'storages/model-switch/plan-main-models.json'))), {})
    draftOnly = false
    evidence.cases.push({ name: 'idle /plan off projection precedes next pre-step and restores main on first request', pass: true })
    await request('session-overrides', { sessionId, selection: PLAN })
    const unchanged = await request('route-status?sessionId=' + child)
    assert.deepEqual(unchanged.expected, GLM, 'later chat selection changed an existing child')
    evidence.cases.push({ name: 'existing lock survives later root pick', pass: true })
    // Final boundary rejects a frozen, deliberately wrong request before any adapter call.
    const beforeOpus = evidence.calls.filter(c => c.provider === OPUS.provider).length
    await assert.rejects(async () => {
      for await (const _ of ctx.llm.stream(Object.freeze({ ...OPUS, sessionId: child, messages: [], signal: new AbortController().signal }))) {}
    }, /Blocked model mismatch/)
    assert.equal(evidence.calls.filter(c => c.provider === OPUS.provider).length, beforeOpus)
    evidence.cases.push({ name: 'native llm stream rejects frozen wrong-model request', pass: true, opusDispatches: 0 })
    if (ctx.subagents.drainChildren && ctx.subagents.sendMessage) {
      await ctx.subagents.drainChildren(agent, [child])
      assert(!ctx.agents.get(child), 'child should be cold after native drain')
      const count = evidence.calls.length
      await ctx.subagents.sendMessage(agent, child, [{ type: 'text', text: 'Reply CONTINUED_OK. No tools.' }], { signal: new AbortController().signal })
      await ctx.subagents.waitForChildren(agent); await agent.whenIdle()
      const resumed = evidence.calls.slice(count).filter(c => c.sessionId === child)
      assert(resumed.length > 0, 'cold child did not dispatch')
      for (const call of resumed) assert.equal(call.provider, GLM.provider)
      evidence.cases.push({ name: 'native cold resume retains lock after root selection changed', pass: true })
    }
    const settings = YAML.parse(fs.readFileSync(path.join(profile, 'cordis.patch.yml'), 'utf8'))
    assert.deepEqual(settings.find(row => row.id === 'agent-default-model').config, OPUS, 'session/plan selection changed the new-session default')
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(home, 'storages/model-switch/plan-main-models.json'))), {})
    evidence.cases.push({ name: 'independent default and cleared plan recovery', pass: true })
  }
  evidence.pass = true
} catch (cause) {
  evidence.pass = false
  evidence.failure = cause instanceof Error ? cause.message : String(cause)
  process.exitCode = 1
  console.error('HOST_FAILURE', evidence.failure)
} finally {
  finish()
  await ctx.fiber.dispose()
  BasicCompactionEngine.prototype.compactIfNeeded = compactNative
}
console.log('HOST_VERIFICATION', JSON.stringify({ host: version, plugin: pluginVersion, pass: evidence.pass, cases: evidence.cases.length, opusDispatches: evidence.calls.filter(c => c.provider === 'test-opus').length }))

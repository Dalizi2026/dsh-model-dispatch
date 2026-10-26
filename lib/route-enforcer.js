/** User-owned routing, persisted before generation and checked again at dispatch. */
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { isAgentLoopRequest } from '@deepseek-ai/dsh-llm';
import { readRoute } from "./config.js";
import { sameSelection } from "./shared.js";
import { mergeAgentOptions } from "./merge.js";
import { delegationSelection } from "./delegation-selection.js";
import { validSelection } from "./route-locks.js";
import { PLUGIN_VERSION, ROUTE_POLICY_VERSION } from "./route-contract.js";
export class RouteBlocked extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'ModelRouteBlocked';
    }
}
export class RouteEnforcer {
    ctx;
    current;
    overrides;
    locks;
    admit;
    state = 'loading';
    failure;
    initialization;
    creation = new AsyncLocalStorage();
    actual = new Map();
    blocked = new Map();
    attached = new WeakSet();
    requestGuards = new WeakMap();
    conflicts = new Map();
    constructor(ctx, current, overrides, locks, admit) {
        this.ctx = ctx;
        this.current = current;
        this.overrides = overrides;
        this.locks = locks;
        this.admit = admit;
    }
    /** Call after installing guards. Errors are contained so guards stay mounted. */
    initialize() {
        return this.initialization ??= Promise.all([this.overrides.ready(), this.locks.ready()]).then(() => {
            if (this.state !== 'blocked')
                this.state = 'ready';
        }).catch(cause => { this.fail(cause); });
    }
    fail(cause) { this.state = 'blocked'; this.failure = cause instanceof Error ? cause.message : String(cause); }
    async ready() {
        await this.initialize();
        if (this.state !== 'ready')
            throw new RouteBlocked('ROUTING_UNAVAILABLE', this.failure ?? 'Model routing is not ready');
    }
    async decision(parent) {
        await this.ready();
        if (parent.session.header.origin === 'subagent') {
            const lock = this.requireLock(parent);
            return { selection: { ...lock.selection }, source: 'inherited-lock' };
        }
        const session = this.overrides.get(parent.id);
        if (session !== undefined) {
            if (!validSelection(session))
                throw new RouteBlocked('INVALID_USER_SELECTION', 'The session child model is invalid');
            return { selection: { ...session }, source: 'session' };
        }
        const route = readRoute(this.current().subagent);
        if (route !== undefined && route.mode !== 'custom' && route.mode !== 'follow-main')
            throw new RouteBlocked('INVALID_USER_SELECTION', 'Unknown child model mode');
        if (route?.mode === 'custom') {
            if (!validSelection(route.selection))
                throw new RouteBlocked('INVALID_USER_SELECTION', 'The configured child model is incomplete');
            return { selection: { ...route.selection }, source: 'default' };
        }
        const projections = this.ctx.get('sessionProjections');
        const state = projections?.stateOf(parent.session, 'modelSelection');
        const main = state?.pending ?? state?.lastUsed ?? parent.session.requestHeader?.()?.config ?? parent.options;
        if (!validSelection(main))
            throw new RouteBlocked('MAIN_MODEL_UNAVAILABLE', 'Cannot determine the current main model; delegation is blocked');
        return { selection: { provider: main.provider, model: main.model, ...main.reasoningEffort === undefined ? {} : { reasoningEffort: String(main.reasoningEffort) } }, source: 'follow-main' };
    }
    async resolve(parent) {
        const decision = await this.decision(parent);
        return { ...decision, selection: await this.admit(decision.selection) };
    }
    async delegate(providerName, parent, requested, run) {
        const active = this.creation.getStore();
        const decision = active?.parentId === parent.id ? { selection: { ...active.selection }, source: active.source } : await this.resolve(parent);
        const runtime = this.ctx.subagents;
        const provider = runtime.getProvider?.(providerName);
        if (!provider || typeof provider.prepareContinuable !== 'function')
            throw new RouteBlocked('UNVERIFIABLE_BACKEND', 'This delegation backend cannot guarantee the selected child model');
        const supplied = delegationSelection.getStore();
        const candidate = supplied?.parent === parent ? supplied : requested;
        const conflict = candidate && ['provider', 'model', 'reasoningEffort']
            .some(key => candidate[key] !== undefined && candidate[key] !== decision.selection[key])
            ? { ...candidate.provider === undefined ? {} : { provider: String(candidate.provider) }, ...candidate.model === undefined ? {} : { model: String(candidate.model) }, ...candidate.reasoningEffort === undefined ? {} : { reasoningEffort: String(candidate.reasoningEffort) } } : undefined;
        return this.creation.run({ ...decision, parentId: parent.id, conflict: conflict ?? (active?.parentId === parent.id ? active.conflict : undefined) }, () => run(mergeAgentOptions(requested, decision.selection)));
    }
    async created(agent) {
        if (agent.session.header.origin !== 'subagent')
            return;
        await this.ready();
        const existing = this.locks.get(agent.id);
        if (existing) {
            this.requireLock(agent);
            return;
        }
        const pending = this.creation.getStore();
        if (!pending || pending.parentId !== agent.session.header.parentSession) {
            this.blocked.set(agent.id, 'Confirm the model for this historical subagent before continuing');
            return;
        }
        await this.locks.set({ childId: agent.id, parentId: pending.parentId, selection: { ...pending.selection }, source: pending.source,
            policyVersion: 1, revision: randomUUID(), ...pending.conflict ? { conflict: pending.conflict } : {} });
        if (pending.conflict)
            this.conflicts.set(agent.id, pending.conflict);
    }
    requireLock(agent) {
        const lock = this.locks.get(agent.id);
        if (!lock || lock.parentId !== agent.session.header.parentSession)
            throw new RouteBlocked('MODEL_CONFIRMATION_REQUIRED', 'Confirm the model for this historical subagent before continuing');
        return lock;
    }
    async request(agent, seed) {
        await this.ready();
        const lock = this.requireLock(agent);
        const route = await this.admit(lock.selection);
        if (!sameSelection(route, lock.selection))
            throw new RouteBlocked('LOCKED_MODEL_CHANGED', 'The provider changed the locked model or reasoning effort');
        const { reasoningEffort: _oldEffort, ...rest } = seed;
        return { ...rest, provider: lock.selection.provider, model: lock.selection.model, ...lock.selection.reasoningEffort === undefined ? {} : { reasoningEffort: lock.selection.reasoningEffort } };
    }
    async verify(options) {
        const loop = isAgentLoopRequest(options);
        if (!options.sessionId) {
            if (loop)
                throw new RouteBlocked('MISSING_SESSION', 'A loop request without session identity cannot be verified');
            return;
        }
        const agent = this.agent(options.sessionId);
        const lock = this.locks.get(options.sessionId);
        const header = agent?.session.header ?? await this.header(options.sessionId);
        if (!header)
            throw new RouteBlocked('UNKNOWN_SESSION', 'Cannot verify the owner of this loop request');
        const child = header?.origin === 'subagent' || lock !== undefined;
        if (!child)
            return;
        await this.ready();
        if (!lock || (header && lock.parentId !== header.parentSession))
            throw new RouteBlocked('MODEL_CONFIRMATION_REQUIRED', 'A verified child model lock is required before dispatch');
        if (!sameSelection(lock.selection, options)) {
            const reason = `Blocked model mismatch: expected ${lock.selection.provider}/${lock.selection.model}, received ${options.provider}/${options.model}`;
            this.blocked.set(options.sessionId, reason);
            throw new RouteBlocked('MODEL_ROUTE_MISMATCH', reason);
        }
        this.blocked.delete(options.sessionId);
        this.actual.set(options.sessionId, { ...lock.selection });
    }
    agent(id) {
        return this.ctx.get('agents')?.get(id);
    }
    async header(id) {
        const live = this.agent(id);
        if (live)
            return live.session.header;
        const persistence = this.ctx.get('sessionPersistence');
        const stat = await persistence?.stat(id);
        return stat?.meta ?? stat?.header;
    }
    async confirm(parentId, childId, selection) {
        await this.ready();
        const parent = await this.header(parentId);
        const child = await this.header(childId);
        if (!parent || child?.origin !== 'subagent' || child.parentSession !== parentId)
            throw new RouteBlocked('INVALID_CHILD_OWNERSHIP', 'The child does not belong to this parent');
        if (this.locks.get(childId))
            throw new RouteBlocked('ALREADY_LOCKED', 'This child already has a locked model');
        const lock = { childId, parentId, selection: await this.admit(selection), source: 'user-confirmed', policyVersion: 1, revision: randomUUID() };
        await this.locks.set(lock);
        this.blocked.delete(childId);
        return lock;
    }
    async status(id) {
        await this.initialize();
        const value = { pluginVersion: PLUGIN_VERSION, policyVersion: ROUTE_POLICY_VERSION, health: this.state, state: this.state === 'ready' ? 'ready' : 'blocked', sessionId: id };
        try {
            await this.ready();
            const header = await this.header(id);
            if (header?.origin === 'subagent' || this.locks.get(id)) {
                value.parentId = header?.parentSession ?? this.locks.get(id)?.parentId;
                const lock = this.locks.get(id);
                if (!lock) {
                    value.state = 'confirmation-required';
                    return value;
                }
                if (header && lock.parentId !== header.parentSession)
                    throw new RouteBlocked('INVALID_CHILD_OWNERSHIP', 'Child lock ownership does not match the session');
                value.expected = lock.selection;
                value.source = lock.source;
                value.revision = lock.revision;
                value.state = 'locked';
                value.actual = this.actual.get(id);
                value.conflict = this.conflicts.get(id) ?? lock.conflict;
                const resolved = await this.admit(lock.selection);
                if (!sameSelection(resolved, lock.selection))
                    throw new RouteBlocked('LOCKED_MODEL_CHANGED', 'The locked route is no longer valid');
                if (this.blocked.has(id)) {
                    value.state = 'blocked';
                    value.error = this.blocked.get(id);
                }
            }
            else {
                const agent = this.agent(id);
                if (!agent)
                    throw new RouteBlocked('SESSION_UNAVAILABLE', 'Open the session to verify the child route');
                const decision = await this.resolve(agent);
                value.expected = decision.selection;
                value.source = decision.source;
            }
        }
        catch (cause) {
            value.state = 'blocked';
            value.error = cause instanceof Error ? cause.message : String(cause);
        }
        return value;
    }
    attachRequestGuard(agent) {
        if (agent.session.header.origin !== 'subagent' || this.attached.has(agent))
            return;
        this.attached.add(agent);
        const dispose = this.ctx.effect(() => agent.ctx.on('agent/request', async (_payload, next) => {
            try {
                return await this.request(agent, await next());
            }
            catch (cause) {
                this.blocked.set(agent.id, cause instanceof Error ? cause.message : String(cause));
                throw cause;
            }
        }, { prepend: true }), 'model-switch: child request lock');
        this.requestGuards.set(agent, dispose);
    }
    installGuards() {
        this.ctx.on('agent/created', async ({ agent }) => { await this.created(agent); });
        this.ctx.on('system-prompt/assemble', async (_assembly, context, next) => {
            const agent = context.agent;
            if (agent?.session.header.origin !== 'subagent')
                return next();
            await this.ready();
            const lock = this.requireLock(agent);
            const assembled = await next();
            return { ...assembled, variables: { ...assembled.variables, ...lock.selection } };
        }, { prepend: true });
        this.ctx.on('agent/created', ({ agent }) => { this.attachRequestGuard(agent); });
        this.ctx.on('agent/disposed', ({ agent }) => {
            this.requestGuards.get(agent)?.();
            this.requestGuards.delete(agent);
        });
        // HMR may activate while existing children are idle or running. Attach to
        // their next request without cancelling a stream already in progress.
        const registry = this.ctx.get('agents');
        for (const agent of registry?.list?.() ?? [])
            this.attachRequestGuard(agent);
        const enforcer = this;
        this.ctx.on('llm/stream', async function* (options, next) {
            await enforcer.verify(options);
            yield* next();
        }, { prepend: true });
    }
}

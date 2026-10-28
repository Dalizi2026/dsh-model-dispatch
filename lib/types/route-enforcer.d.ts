import type { Context } from '@deepseek-ai/cordis';
import { type LlmCallConfig } from '@deepseek-ai/dsh-llm';
import type { AgentOptions } from '@deepseek-ai/dsh-agent';
import { type Config, type ModelSelectionConfig } from './shared.ts';
import { type LockStore } from './route-locks.ts';
import { type RouteLock, type RouteSource, type RouteStatus } from './route-contract.ts';
export declare class RouteBlocked extends Error {
    readonly code: string;
    constructor(code: string, message: string);
}
export interface RoutingAgent {
    id: string;
    options?: AgentOptions;
    session: {
        header: {
            origin?: string;
            parentSession?: string;
        };
        requestHeader?(): {
            config: ModelSelectionConfig;
        } | undefined;
    };
}
export interface RouteDecision {
    selection: ModelSelectionConfig;
    source: RouteSource;
}
export type RouteAdmission = (route: ModelSelectionConfig) => Promise<ModelSelectionConfig>;
interface Overrides {
    ready(): Promise<void>;
    get(id: string): ModelSelectionConfig | undefined;
}
export declare class RouteEnforcer {
    private ctx;
    private current;
    private overrides;
    readonly locks: LockStore;
    private admit;
    private state;
    private failure?;
    private initialization?;
    private creation;
    private actual;
    private blocked;
    private attached;
    private requestGuards;
    private conflicts;
    constructor(ctx: Context, current: () => Config, overrides: Overrides, locks: LockStore, admit: RouteAdmission);
    /** Call after installing guards. Errors are contained so guards stay mounted. */
    initialize(): Promise<void>;
    fail(cause: unknown): void;
    ready(): Promise<void>;
    decision(parent: RoutingAgent): Promise<RouteDecision>;
    resolve(parent: RoutingAgent): Promise<RouteDecision>;
    delegate<T>(providerName: string, parent: RoutingAgent, requested: AgentOptions | undefined, run: (options: AgentOptions) => Promise<T>): Promise<T>;
    created(agent: RoutingAgent): Promise<void>;
    requireLock(agent: RoutingAgent): RouteLock;
    request(agent: RoutingAgent, seed: LlmCallConfig): Promise<LlmCallConfig>;
    verify(options: {
        sessionId?: string;
        provider: string;
        model: string;
        reasoningEffort?: string;
    }): Promise<void>;
    /** Saved session override or settings default, without a live agent; not live-verified. */
    private savedRoute;
    private agent;
    header(id: string): Promise<RoutingAgent['session']['header'] | undefined>;
    confirm(parentId: string, childId: string, selection: ModelSelectionConfig): Promise<RouteLock>;
    status(id: string): Promise<RouteStatus>;
    private attachRequestGuard;
    installGuards(): void;
}
export {};

/** Authenticated UI-only controls; model-facing tools never call confirmation. */
import type { Context } from '@deepseek-ai/cordis';
import type { IncomingMessage } from 'node:http';
import { RouteEnforcer } from './route-enforcer.ts';
export type HttpGate = (req: IncomingMessage) => number | undefined;
export declare function ownerGate(ctx: Context): HttpGate;
export declare function installRouteHttp(ctx: Context, authority: RouteEnforcer): void;

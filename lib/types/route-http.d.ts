/** Authenticated UI-only controls; model-facing tools never call confirmation. */
import type { Context } from '@deepseek-ai/cordis';
import type { IncomingMessage } from 'node:http';
import { RouteEnforcer } from './route-enforcer.ts';
import type { HostSeams } from './host-seams.ts';
export type HttpGate = (req: IncomingMessage) => number | undefined;
export declare function ownerGate(ctx: Context): HttpGate;
export declare function installRouteHttp(ctx: Context, authority: RouteEnforcer, seams: Pick<HostSeams, 'report'>): void;

/** Temporarily draft with the planning model; restore main BEFORE execution. */
import type { Context } from '@deepseek-ai/cordis';
import { type Config, type ModelSelectionConfig } from './shared.ts';
import { type HostSeams } from './host-seams.ts';
export interface PlanMainStore {
    ready?(): Promise<void>;
    get(id: string): ModelSelectionConfig | undefined;
    set(id: string, selection: ModelSelectionConfig | undefined): Promise<void>;
}
/**
 * `agentDefaultModel` is required with the controller: without the default
 * protection the native selection would save the planning model as the
 * new-chat default, so the switch stays off whenever that protection is.
 *
 * Hosts differ in when a step's route is fixed: DSH 0.2.1 reads it during
 * prompt assembly, DSH 0.2.2 before it. So the switch also runs when the
 * intent happens, inside `/plan` and an approved exit tool call, which both
 * hosts await before the next step. Assembly remains the fallback for
 * recovery and for hosts without those optional seams.
 */
export declare function installPlanModelSwitch(ctx: Context, current: () => Config, mains: PlanMainStore, seams: HostSeams): void;

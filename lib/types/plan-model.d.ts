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
 */
export declare function installPlanModelSwitch(ctx: Context, current: () => Config, mains: PlanMainStore, seams: HostSeams): void;

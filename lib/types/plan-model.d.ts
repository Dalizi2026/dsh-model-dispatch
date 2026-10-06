/** Temporarily draft with the planning model; restore main BEFORE execution. */
import type { Context } from '@deepseek-ai/cordis';
import { type Config, type ModelSelectionConfig } from './shared.ts';
export interface PlanMainStore {
    get(id: string): ModelSelectionConfig | undefined;
    set(id: string, selection: ModelSelectionConfig | undefined): Promise<void>;
}
export declare function installPlanModelSwitch(ctx: Context, current: () => Config, mains: PlanMainStore): void;

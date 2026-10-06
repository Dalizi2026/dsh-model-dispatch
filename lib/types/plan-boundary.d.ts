/** Replayable approval intent, visible before native isolated planMode commits. */
import { z } from 'zod';
import type { ModelSelectionConfig } from './shared.ts';
export declare const PLAN_BOUNDARY_KEY = "modelSwitchPlanBoundary";
export interface BoundaryState {
    active: boolean;
    approved: boolean;
    calls: string[];
    current?: ModelSelectionConfig;
    main?: ModelSelectionConfig;
}
interface BoundaryEvent {
    type: string;
    data: any;
}
export declare const planBoundaryDefinition: {
    key: string;
    stateVersion: number;
    stateSchema: z.ZodObject<{
        active: z.ZodBoolean;
        approved: z.ZodBoolean;
        calls: z.ZodArray<z.ZodString>;
        current: z.ZodOptional<z.ZodObject<{
            provider: z.ZodString;
            model: z.ZodString;
            reasoningEffort: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        main: z.ZodOptional<z.ZodObject<{
            provider: z.ZodString;
            model: z.ZodString;
            reasoningEffort: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    init: () => BoundaryState;
    apply(state: BoundaryState, event: BoundaryEvent): BoundaryState;
};
export {};

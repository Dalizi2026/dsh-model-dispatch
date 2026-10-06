/** Replayable approval intent, visible before native isolated planMode commits. */
import { z } from 'zod';
export const PLAN_BOUNDARY_KEY = 'modelSwitchPlanBoundary';
const selectionSchema = z.object({ provider: z.string(), model: z.string(), reasoningEffort: z.string().optional() });
const APPROVED = 'Plan approved — plan mode exited; carry out the plan starting with your next step.';
export const planBoundaryDefinition = {
    key: PLAN_BOUNDARY_KEY,
    stateVersion: 1,
    stateSchema: z.object({ active: z.boolean(), approved: z.boolean(), calls: z.array(z.string()), current: selectionSchema.optional(), main: selectionSchema.optional() }),
    init: () => ({ active: false, approved: false, calls: [] }),
    apply(state, event) {
        if (event.type === 'plan/mode')
            return {
                ...state, active: event.data.active, approved: false, calls: [],
                ...event.data.active && !state.active ? { main: state.current } : {},
            };
        if (event.type === 'command/run' && event.data.name === 'plan' && event.data.args?.trim() !== 'off')
            return { ...state, approved: false, calls: [] };
        if (event.type === 'model/selection' || event.type === 'request/header') {
            const value = event.type === 'model/selection' ? event.data : event.data.header?.config;
            if (typeof value?.provider !== 'string' || typeof value?.model !== 'string')
                return state;
            return { ...state, current: { provider: value.provider, model: value.model, ...typeof value.reasoningEffort === 'string' ? { reasoningEffort: value.reasoningEffort } : {} } };
        }
        if (event.type === 'tool/call' && event.data.name === 'exit_plan_mode')
            return { ...state, calls: [...state.calls.slice(-31), event.data.callId] };
        if (event.type === 'tool/result') {
            const message = event.data.message;
            const id = message?.source?.callId ?? message?.toolCallId;
            if (!state.calls.includes(id))
                return state;
            return {
                ...state, calls: state.calls.filter(call => call !== id),
                approved: state.approved || (message.isError !== true && message.content?.some((part) => part.type === 'text' && part.text === APPROVED) === true),
            };
        }
        return state;
    },
};

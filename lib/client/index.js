/**
 * Browser half of dsh-model-dispatch: settings, plan-review, subagent model badges.
 */
import { MODEL_SWITCH_NS } from "../shared.js";
import { en, zh } from "./locales.js";
import { ConfigStore, MainModelStore } from "./config-store.js";
import { SettingsSection } from "./SettingsSection.js";
import { SessionOverrideStore } from "./session-overrides-store.js";
import { SessionModelControls } from "./SessionModelControls.js";
import { PlanReviewComposer, selectPlanReview, } from "./PlanReviewComposer.js";
import { SubagentModelBadge } from "./SubagentModelBadge.js";
import { SubagentCatalogAction, } from "./SubagentCatalogAction.js";
import { SessionLabelStore } from "./session-label-store.js";
const NS = 'model-switch';
export const inject = [
    'slots',
    'locale',
    'sessions',
    'remote',
    'remote.session',
    'uiWorkspace',
    'configForms',
];
/** Native entry id owning the deployment main-model default. */
const AGENT_DEFAULT_MODEL_NS = 'agent-default-model';
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'model-switch: dictionaries');
    const t = ctx.locale.bind(NS);
    // The host `dsh-session` augmentation wins the Context.sessions interface
    // merge (it loads first through workspace types); the runtime service here is
    // the client ISessions implementation, so retype at the single access point.
    const sessions = ctx.sessions;
    // DSH 0.2.x settings transport: one ConfigForm controller per Host entry id.
    const store = new ConfigStore(ctx.configForms.get(MODEL_SWITCH_NS));
    const mainStore = new MainModelStore(ctx.configForms.get(AGENT_DEFAULT_MODEL_NS));
    const labels = new SessionLabelStore();
    const overrides = new SessionOverrideStore();
    const remote = ctx.remote;
    const currentSelection = (sessionId) => {
        const row = sessions.list.getSnapshot().byId[sessionId];
        const selection = sessions.list.getSnapshot().projectionsBySession[sessionId]?.values.modelSelection ?? row?.projectionValues?.modelSelection;
        return selection?.next ?? selection?.lastUsed ?? mainStore.getSnapshot().value;
    };
    let catalogRequest;
    let catalogExpires = 0;
    const access = {
        loadCatalog() {
            if (catalogRequest && Date.now() < catalogExpires)
                return catalogRequest;
            catalogExpires = Date.now() + 15_000;
            catalogRequest = remote.session.modelCatalog().then(result => {
                if (!result.ok)
                    throw new Error(result.error.message);
                return result.value;
            }).catch(cause => { catalogRequest = undefined; throw cause; });
            return catalogRequest;
        },
        currentSelection,
    };
    const settingsInject = () => ({
        store,
        mainStore,
        access,
        t,
    });
    ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'model-switch',
        order: 80,
        label: () => t('nav'),
        inject: settingsInject,
    }, SettingsSection));
    const planInject = () => ({
        access,
        t,
    });
    ctx.slots.inject('conversation.composer', () => ctx.slots.register({
        name: 'conversation.composer',
        select: selectPlanReview,
        priority: -10,
        locale: NS,
        inject: planInject,
    }, PlanReviewComposer));
    const badgeInject = () => ({ labels });
    // Sits beside the hierarchy crumbs (header.actions is the neighbour of 会话层级).
    ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
        name: 'conversation.session.header.actions',
        id: 'model-switch-badge',
        order: 5,
        inject: badgeInject,
    }, SubagentModelBadge));
    const catalogInject = () => ({
        openChild(address) {
            ctx.uiWorkspace.openSession(address);
        },
        refresh(parentSessionId) {
            void sessions.refreshProjections(parentSessionId);
        },
        labels,
    });
    // Same id as the stock ui-subagent catalog entry; lower priority shadows it.
    ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
        name: 'conversation.session.header.actions',
        id: 'subagent-catalog',
        order: 10,
        priority: -1,
        locale: 'subagent',
        inject: catalogInject,
    }, SubagentCatalogAction));
    // A single seat contains the main route followed by its child route.
    ctx.slots.inject('conversation.input.model', () => ctx.slots.register({
        name: 'conversation.input.model',
        priority: -1,
        locale: NS,
        inject: (sessionId) => ({
            access, remote, mainStore, t, overrides, store,
            available: sessions.subagentAddress(sessionId) === undefined,
        }),
    }, SessionModelControls));
}

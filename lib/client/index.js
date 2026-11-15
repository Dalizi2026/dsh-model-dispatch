/**
 * Browser half of dsh-model-dispatch: settings, plan-review, subagent model badges.
 */
import { MODEL_SWITCH_NS } from "../shared.js";
import { en, zh } from "./locales.js";
import { ConfigStore, MainModelStore } from "./config-store.js";
import { SettingsSection } from "./SettingsSection.js";
import { fetchHostSeams, RouteStatusStore } from "./route-status-store.js";
import { SessionOverrideStore } from "./session-overrides-store.js";
import { SessionModelControls } from "./SessionModelControls.js";
import { PlanReviewComposer, selectPlanReview, } from "./PlanReviewComposer.js";
import { SubagentModelBadge } from "./SubagentModelBadge.js";
import { SubagentCatalogAction, } from "./SubagentCatalogAction.js";
import { SessionLabelStore } from "./session-label-store.js";
const NS = 'model-switch';
/**
 * Base client seams: every entry renders localized text into a slot. Each
 * entry injects any further service it needs, so a missing service removes
 * only that entry and the native DSH entry stays (ADR 0001). The host half
 * enforces the model lock regardless of what the client shows.
 */
export const inject = ['slots', 'locale'];
/** Native entry id owning the deployment main-model default. */
const AGENT_DEFAULT_MODEL_NS = 'agent-default-model';
/** Client services each replaceable entry injects; the settings banner reports the same lists. */
const CHAT_CONTROLS_SEAMS = ['configForms', 'remote', 'remote.session', 'sessions'];
const CATALOG_SEAMS = ['sessions', 'uiWorkspace'];
const ENTRY_SEAMS = [
    ['chat-controls', CHAT_CONTROLS_SEAMS],
    ['subagent-catalog', CATALOG_SEAMS],
];
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'model-switch: dictionaries');
    const t = ctx.locale.bind(NS);
    const labels = new SessionLabelStore();
    const overrides = new SessionOverrideStore();
    const routes = new RouteStatusStore();
    // `remote.session` is its own service: reading `.session` through the
    // `remote` proxy would require injecting it, so read it by name.
    const remoteSession = () => ctx.get('remote.session');
    const present = (seam) => ctx.get(seam) !== undefined;
    const clientSeams = () => ENTRY_SEAMS
        .map(([capability, seams]) => ({ capability, missing: seams.filter(seam => !present(seam)), mismatched: [] }))
        .filter(report => report.missing.length > 0);
    // Host and client reports together, read once each time the settings section opens.
    const seams = async () => [...await fetchHostSeams(), ...clientSeams()];
    // Set while the configForms service exists; only a last-resort display fallback.
    let defaults;
    // Services are read when used, so the shared picker names a missing seam
    // in its load error instead of taking every entry down with it.
    const currentSelection = (sessionId) => {
        // The host `dsh-session` augmentation wins the Context.sessions interface
        // merge; the runtime service here is the client ISessions implementation.
        const list = ctx.get('sessions')?.list.getSnapshot();
        const selection = list?.projectionsBySession[sessionId]?.values.modelSelection ?? list?.byId[sessionId]?.projectionValues?.modelSelection;
        return selection?.next ?? selection?.lastUsed ?? defaults?.getSnapshot().value;
    };
    let catalogRequest;
    let catalogExpires = 0;
    const access = {
        loadCatalog() {
            if (catalogRequest && Date.now() < catalogExpires)
                return catalogRequest;
            const session = remoteSession();
            if (!session)
                return Promise.reject(new Error('DSH is missing the host seam remote.session'));
            catalogExpires = Date.now() + 15_000;
            catalogRequest = session.modelCatalog().then(result => {
                if (!result.ok)
                    throw new Error(result.error.message);
                return result.value;
            }).catch(cause => { catalogRequest = undefined; throw cause; });
            return catalogRequest;
        },
        currentSelection,
    };
    // DSH 0.2.x settings transport: one shared ConfigForm per Host entry id.
    ctx.inject(['configForms'], scope => {
        const store = new ConfigStore(scope.configForms.get(MODEL_SWITCH_NS));
        const mainStore = new MainModelStore(scope.configForms.get(AGENT_DEFAULT_MODEL_NS));
        scope.effect(() => {
            defaults = mainStore;
            return () => { if (defaults === mainStore)
                defaults = undefined; };
        }, 'model-switch: main default fallback');
        const settingsInject = () => ({ store, mainStore, access, t, seams });
        scope.slots.inject('settings.section', () => scope.slots.register({
            name: 'settings.section',
            id: 'model-switch',
            order: 80,
            label: () => t('nav'),
            inject: settingsInject,
        }, SettingsSection));
        // A single seat contains the main route followed by its child route.
        scope.inject(CHAT_CONTROLS_SEAMS, seat => {
            const remote = seat.remote;
            const sessions = seat.sessions;
            seat.slots.inject('conversation.input.model', () => seat.slots.register({
                name: 'conversation.input.model',
                priority: -1,
                locale: NS,
                inject: (sessionId) => ({
                    access, remote, mainStore, t, overrides, store, routes,
                    available: sessions.subagentAddress(sessionId) === undefined,
                }),
            }, SessionModelControls));
        });
    });
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
    const badgeInject = () => ({ routes, access, t });
    // Sits beside the hierarchy crumbs (header.actions is the neighbour of 会话层级).
    ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
        name: 'conversation.session.header.actions',
        id: 'model-switch-badge',
        order: 5,
        inject: badgeInject,
    }, SubagentModelBadge));
    ctx.inject(CATALOG_SEAMS, scope => {
        const sessions = scope.sessions;
        const catalogInject = () => ({
            openChild(address) {
                scope.uiWorkspace.openSession(address);
            },
            refresh(parentSessionId) {
                void sessions.refreshProjections(parentSessionId);
            },
            labels,
        });
        // Same id as the stock ui-subagent catalog entry; lower priority shadows it.
        scope.slots.inject('conversation.session.header.actions', () => scope.slots.register({
            name: 'conversation.session.header.actions',
            id: 'subagent-catalog',
            order: 10,
            priority: -1,
            locale: 'subagent',
            inject: catalogInject,
        }, SubagentCatalogAction));
    });
}

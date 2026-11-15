/**
 * Browser half of dsh-model-dispatch: settings, plan-review, subagent model badges.
 */

import type { Context } from '@deepseek-ai/cordis'
import type { ClientRemote, SessionId, SubagentAddress } from '@deepseek-ai/dsh-api-remotes/client'
import type { ISessions } from '@deepseek-ai/dsh-api-session-controller/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import type { ModelSelection } from '@deepseek-ai/dsh-api-remotes/client'
import { MODEL_SWITCH_NS, type Config, type ModelSelectionConfig } from '../shared.ts'
import { en, zh, type LocaleKey } from './locales.ts'
import { ConfigStore, MainModelStore } from './config-store.ts'
import { SettingsSection, type SettingsInjected } from './SettingsSection.tsx'
import { fetchHostSeams, RouteStatusStore } from './route-status-store.ts'
import { SessionOverrideStore } from './session-overrides-store.ts'
import { SessionModelControls } from './SessionModelControls.tsx'
import {
  PlanReviewComposer,
  selectPlanReview,
  type PlanReviewComposerInjected,
} from './PlanReviewComposer.tsx'
import { SubagentModelBadge, type SubagentModelBadgeInjected } from './SubagentModelBadge.tsx'
import {
  SubagentCatalogAction,
  type SubagentCatalogInjected,
} from './SubagentCatalogAction.tsx'
import { SessionLabelStore } from './session-label-store.ts'
import type { ModelCatalogAccess } from './ModelPicker.tsx'
import type { UiCapability, UiCapabilityReport } from './SeamNotice.tsx'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'model-switch': LocaleKey
    /** Reuse stock ui-subagent dictionaries when replacing the catalog seat. */
    'subagent': string
  }
}

const NS = 'model-switch'

/**
 * Base client seams: every entry renders localized text into a slot. Each
 * entry injects any further service it needs, so a missing service removes
 * only that entry and the native DSH entry stays (ADR 0001). The host half
 * enforces the model lock regardless of what the client shows.
 */
export const inject = ['slots', 'locale']

/** Native entry id owning the deployment main-model default. */
const AGENT_DEFAULT_MODEL_NS = 'agent-default-model'
/** Client services each replaceable entry injects; the settings banner reports the same lists. */
const CHAT_CONTROLS_SEAMS = ['configForms', 'remote', 'remote.session', 'sessions']
const CATALOG_SEAMS = ['sessions', 'uiWorkspace']
const ENTRY_SEAMS: readonly (readonly [UiCapability, readonly string[]])[] = [
  ['chat-controls', CHAT_CONTROLS_SEAMS],
  ['subagent-catalog', CATALOG_SEAMS],
]

export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'model-switch: dictionaries')

  const t = ctx.locale.bind(NS) as (key: LocaleKey) => string
  const labels = new SessionLabelStore()
  const overrides = new SessionOverrideStore()
  const routes = new RouteStatusStore()

  // `remote.session` is its own service: reading `.session` through the
  // `remote` proxy would require injecting it, so read it by name.
  const remoteSession = (): ClientRemote['session'] | undefined => ctx.get('remote.session') as ClientRemote['session'] | undefined
  const present = (seam: string): boolean => ctx.get(seam) !== undefined
  const clientSeams = (): UiCapabilityReport[] => ENTRY_SEAMS
    .map(([capability, seams]) => ({ capability, missing: seams.filter(seam => !present(seam)), mismatched: [] }))
    .filter(report => report.missing.length > 0)
  // Host and client reports together, read once each time the settings section opens.
  const seams = async (): Promise<UiCapabilityReport[]> => [...await fetchHostSeams(), ...clientSeams()]

  // Set while the configForms service exists; only a last-resort display fallback.
  let defaults: MainModelStore | undefined
  // Services are read when used, so the shared picker names a missing seam
  // in its load error instead of taking every entry down with it.
  const currentSelection = (sessionId: SessionId): ModelSelection | undefined => {
    // The host `dsh-session` augmentation wins the Context.sessions interface
    // merge; the runtime service here is the client ISessions implementation.
    const list = (ctx.get('sessions') as ISessions | undefined)?.list.getSnapshot()
    const selection = list?.projectionsBySession[sessionId]?.values.modelSelection ?? list?.byId[sessionId]?.projectionValues?.modelSelection
    return selection?.next ?? selection?.lastUsed ?? defaults?.getSnapshot().value
  }
  let catalogRequest: ReturnType<ModelCatalogAccess['loadCatalog']> | undefined
  let catalogExpires = 0
  const access: ModelCatalogAccess = {
    loadCatalog() {
      if (catalogRequest && Date.now() < catalogExpires) return catalogRequest
      const session = remoteSession()
      if (!session) return Promise.reject(new Error('DSH is missing the host seam remote.session'))
      catalogExpires = Date.now() + 15_000
      catalogRequest = session.modelCatalog().then(result => {
        if (!result.ok) throw new Error(result.error.message)
        return result.value
      }).catch(cause => { catalogRequest = undefined; throw cause })
      return catalogRequest
    },
    currentSelection,
  }

  // DSH 0.2.x settings transport: one shared ConfigForm per Host entry id.
  ctx.inject(['configForms'], scope => {
    const store = new ConfigStore(scope.configForms.get<Config>(MODEL_SWITCH_NS))
    const mainStore = new MainModelStore(scope.configForms.get<ModelSelectionConfig>(AGENT_DEFAULT_MODEL_NS))
    scope.effect(() => {
      defaults = mainStore
      return () => { if (defaults === mainStore) defaults = undefined }
    }, 'model-switch: main default fallback')

    const settingsInject = (): SettingsInjected => ({ store, mainStore, access, t, seams })
    scope.slots.inject('settings.section', () => scope.slots.register({
      name: 'settings.section',
      id: 'model-switch',
      order: 80,
      label: () => t('nav'),
      inject: settingsInject,
    }, SettingsSection))

    // A single seat contains the main route followed by its child route.
    scope.inject(CHAT_CONTROLS_SEAMS, seat => {
      const remote = seat.remote as ClientRemote
      const sessions = seat.sessions as unknown as ISessions
      seat.slots.inject('conversation.input.model', () => seat.slots.register({
        name: 'conversation.input.model',
        priority: -1,
        locale: NS,
        inject: (sessionId) => ({
          access, remote, mainStore, t, overrides, store, routes,
          available: sessions.subagentAddress(sessionId) === undefined,
        }),
      }, SessionModelControls))
    })
  })

  const planInject = (): PlanReviewComposerInjected => ({
    access,
    t,
  })

  ctx.slots.inject('conversation.composer', () => ctx.slots.register({
    name: 'conversation.composer',
    select: selectPlanReview,
    priority: -10,
    locale: NS,
    inject: planInject,
  }, PlanReviewComposer))

  const badgeInject = (): SubagentModelBadgeInjected => ({ routes, access, t })

  // Sits beside the hierarchy crumbs (header.actions is the neighbour of 会话层级).
  ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
    name: 'conversation.session.header.actions',
    id: 'model-switch-badge',
    order: 5,
    inject: badgeInject,
  }, SubagentModelBadge))

  ctx.inject(CATALOG_SEAMS, scope => {
    const sessions = scope.sessions as unknown as ISessions
    const catalogInject = (): SubagentCatalogInjected => ({
      openChild(address: SubagentAddress) {
        scope.uiWorkspace.openSession(address)
      },
      refresh(parentSessionId: SessionId) {
        void sessions.refreshProjections(parentSessionId)
      },
      labels,
    })

    // Same id as the stock ui-subagent catalog entry; lower priority shadows it.
    scope.slots.inject('conversation.session.header.actions', () => scope.slots.register({
      name: 'conversation.session.header.actions',
      id: 'subagent-catalog',
      order: 10,
      priority: -1,
      locale: 'subagent',
      inject: catalogInject,
    }, SubagentCatalogAction))
  })
}

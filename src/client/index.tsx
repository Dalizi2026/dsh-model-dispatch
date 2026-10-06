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

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'model-switch': LocaleKey
    /** Reuse stock ui-subagent dictionaries when replacing the catalog seat. */
    'subagent': string
  }
}

const NS = 'model-switch'

export const inject = [
  'slots',
  'locale',
  'sessions',
  'remote',
  'remote.session',
  'uiWorkspace',
  'configForms',
]

/** Native entry id owning the deployment main-model default. */
const AGENT_DEFAULT_MODEL_NS = 'agent-default-model'

export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'model-switch: dictionaries')

  const t = ctx.locale.bind(NS) as (key: LocaleKey) => string
  // The host `dsh-session` augmentation wins the Context.sessions interface
  // merge (it loads first through workspace types); the runtime service here is
  // the client ISessions implementation, so retype at the single access point.
  const sessions = ctx.sessions as unknown as ISessions
  // DSH 0.2.x settings transport: one ConfigForm controller per Host entry id.
  const store = new ConfigStore(ctx.configForms.get<Config>(MODEL_SWITCH_NS))
  const mainStore = new MainModelStore(ctx.configForms.get<ModelSelectionConfig>(AGENT_DEFAULT_MODEL_NS))
  const labels = new SessionLabelStore()
  const overrides = new SessionOverrideStore()

  const remote = ctx.remote as ClientRemote
  const currentSelection = (sessionId: SessionId): ModelSelection | undefined => {
    const row = sessions.list.getSnapshot().byId[sessionId]
    const selection = sessions.list.getSnapshot().projectionsBySession[sessionId]?.values.modelSelection ?? row?.projectionValues?.modelSelection
    return selection?.next ?? selection?.lastUsed ?? mainStore.getSnapshot().value
  }
  let catalogRequest: ReturnType<ModelCatalogAccess['loadCatalog']> | undefined
  let catalogExpires = 0
  const access: ModelCatalogAccess = {
    loadCatalog() {
      if (catalogRequest && Date.now() < catalogExpires) return catalogRequest
      catalogExpires = Date.now() + 15_000
      catalogRequest = remote.session.modelCatalog().then(result => {
        if (!result.ok) throw new Error(result.error.message)
        return result.value
      }).catch(cause => { catalogRequest = undefined; throw cause })
      return catalogRequest
    },
    currentSelection,
  }

  const settingsInject = (): SettingsInjected => ({
    store,
    mainStore,
    access,
    t,
  })

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'model-switch',
    order: 80,
    label: () => t('nav'),
    inject: settingsInject,
  }, SettingsSection))

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

  const badgeInject = (): SubagentModelBadgeInjected => ({ labels })

  // Sits beside the hierarchy crumbs (header.actions is the neighbour of 会话层级).
  ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
    name: 'conversation.session.header.actions',
    id: 'model-switch-badge',
    order: 5,
    inject: badgeInject,
  }, SubagentModelBadge))

  const catalogInject = (): SubagentCatalogInjected => ({
    openChild(address: SubagentAddress) {
      ctx.uiWorkspace.openSession(address)
    },
    refresh(parentSessionId: SessionId) {
      void sessions.refreshProjections(parentSessionId)
    },
    labels,
  })

  // Same id as the stock ui-subagent catalog entry; lower priority shadows it.
  ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
    name: 'conversation.session.header.actions',
    id: 'subagent-catalog',
    order: 10,
    priority: -1,
    locale: 'subagent',
    inject: catalogInject,
  }, SubagentCatalogAction))

  // A single seat contains the main route followed by its child route.
  ctx.slots.inject('conversation.input.model', () => ctx.slots.register({
    name: 'conversation.input.model',
    priority: -1,
    locale: NS,
    inject: (sessionId) => ({
      access, remote, mainStore, t, overrides, store,
      available: sessions.subagentAddress(sessionId) === undefined,
    }),
  }, SessionModelControls))
}

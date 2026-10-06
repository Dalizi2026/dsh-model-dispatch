/** Keep native session selections from rewriting the configured new-chat default. */
import { AsyncLocalStorage } from 'node:async_hooks'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-session-controller'
import type {} from '@deepseek-ai/dsh-agent-default-model'

export function installSessionModelScope(ctx: Context): void {
  ctx.inject(['sessionController', 'agentDefaultModel'], scope => {
    const controller = scope.sessionController
    const defaults = scope.agentDefaultModel
    // A per-async-call scope preserves unrelated default writes and concurrent
    // sessions. Never temporarily disable a process-wide saver around an await.
    const sessionOnly = new AsyncLocalStorage<boolean>()
    scope.effect(() => {
      const select = controller.selectModel
      const save = defaults.saveSelection
      const selectSession: typeof select = request => sessionOnly.run(true, () => select.call(controller, request))
      const saveDefault: typeof save = next => sessionOnly.getStore() === true
        ? Promise.resolve()
        : save.call(defaults, next)
      defaults.saveSelection = saveDefault
      controller.selectModel = selectSession
      return () => {
        if (controller.selectModel === selectSession) controller.selectModel = select
        if (defaults.saveSelection === saveDefault) defaults.saveSelection = save
      }
    }, 'model-switch: session-only model changes')
  })
}

# dsh-model-dispatch

English | [中文](README.zh.md)

Pick separate models and reasoning efforts for the main session, subagents, and plan mode in DeepSeek Harness (DSH).

> This plugin is based on [lincong1987/dsh-model-switch](https://github.com/lincong1987/dsh-model-switch) — its original design and code, adapted and heavily optimized for **DSH 0.2.0-rc.2**: it follows the 0.2.x settings system (volatile Config + configForms), the subagent projections, and the session model-selection APIs, and adds plan-mode auto switching, per-session overrides, route validation, and a new UI. The upstream only supports 0.1.x.

> Version 1.0.1: main, planning, and child models share the live host catalog. Explicit child selections and `list_subagent_models` work in existing sessions even when rc.2 captured an older allowlist. Model additions are available on the next delegation; removed routes and unsupported reasoning efforts are rejected before creating a child. Native delegation guards and lifecycle still apply.

## Features

- **Two chat-bar controls**: the input bar shows separate **Main** and **Subagent** chips. The main chip uses the native DSH switching API; the subagent pick only affects subagents started later in the current session.
- **One unified model menu**: search, provider groups, favorites, recent models, and reasoning effort. Picking a model keeps the menu open so you can adjust the effort, then a single **Apply** saves. Cancel, Escape, or clicking outside discards the draft — nothing is written.
- **Three settings rows**: new-session default model, subagent default model, and planning model. One scope hint per row.
- **Plan-mode auto switching**: entering plan mode switches to the planning model; approving the plan or `/plan off` restores the pre-plan main model and effort before the first execution request. The review panel shows the model that will be restored.
- **Per-session subagent overrides**: the chat-bar subagent pick is stored as a durable session override and never changes the settings default; restore to the settings default in one click.
- **Route validation before saving**: overrides and child creation validate the exact provider/model/effort through the host's `resolveCallConfig`; invalid combos fail immediately with the real reason instead of failing inside a run.

## Routing rules

- **Subagents**: session override > settings default > native parent-model inheritance. Explicit start options still win through the native API.
- **Plan mode**: the current session provider/model/effort is saved atomically on entry → the planning model is used temporarily → restored before the first execution request after approval or `/plan off`. A failed restore is retryable and never strands the session on the planning model.
- **Defaults are independent of sessions**: the settings page stores the new-session defaults; chat picks and plan switches only affect the current session. The host adapter isolates the native `selectModel` "save as deployment default" side effect with `AsyncLocalStorage`, blocking only that call chain.

## Install

Requires **DeepSeek Harness 0.2.0-rc.2** (other 0.2.x versions need compatibility checks).

```bash
dsh plugin --profile desktop add github:Dalizi2026/dsh-model-dispatch
```

Replace `desktop` with the profile you actually use. After installing, **fully quit and reopen DSH** — the host half needs a recomposition; refreshing the page only reloads the client half.

> `lib/` in the repository holds prebuilt artifacts, so installing straight from GitHub works without a local build.

## Persistence

| Data | Location |
|---|---|
| Settings defaults (subagent default / planning model) | DSH profile config (volatile fields; editable from the settings page or the config file) |
| New-session main-model default | The native `agent-default-model` entry |
| Session subagent overrides | `$DSH_HOME/storages/model-switch/session-overrides.json` |
| Pre-plan main model | `$DSH_HOME/storages/model-switch/plan-main-models.json` (cleared after a successful restore) |
| Menu favorites / recents | Browser localStorage (not synced) |

## Build and test

```bash
pnpm install
pnpm test        # vitest
pnpm build       # tsc (two projects) + tsdown client bundle
```

Coverage: route-merge precedence, session-override storage and concurrent writes, plan-boundary enter/restore/restart/reject paths, session-vs-default selection isolation, route validation rejections, client save races.

## Known limitations

- Tightly coupled to DSH 0.2.0-rc.2 internals (configForms, sessionProjections, sessionController, planMode); re-run the suite after a DSH upgrade.
- Plan-boundary detection depends on the native `exit_plan_mode` result wording; a DSH wording change delays the restore (the `plan/mode` event is the fallback).
- Subagent sessions intentionally do not participate in plan switching or subagent overrides.

## Credits

- Original design and the 0.1.x implementation: [lincong1987/dsh-model-switch](https://github.com/lincong1987/dsh-model-switch) (MIT) — this plugin builds on that work.
- The 0.2.x adaptation, plan-mode switching, session overrides, route validation, and the new UI were rewritten/extended in this repository.

## License

[MIT](LICENSE)

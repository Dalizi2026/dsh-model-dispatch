# dsh-model-dispatch

English | [中文](README.zh.md)

Pick separate models and reasoning efforts for the main session, subagents, and plan mode in DeepSeek Harness (DSH).

> This plugin is based on [lincong1987/dsh-model-switch](https://github.com/lincong1987/dsh-model-switch) — its original design and code, adapted and heavily optimized for **DSH 0.2.0-rc.2 / 0.2.1-rc.1–rc.3**: it follows the 0.2.x settings system (volatile Config + configForms), the subagent projections, and the session model-selection APIs, and adds plan-mode auto switching, per-session overrides, route validation, and a new UI. The upstream only supports 0.1.x.

> **1.2.0: user-selected subagent routes are enforced for the child's lifetime.** Tool arguments and preset model preferences cannot override the session pick or settings default. Missing or invalid locks block requests instead of falling back. Historical children require human model confirmation before continuing. See [upgrade notes](docs/1.2.0-route-locking.md).

## Features

- **Two chat-bar controls**: the input bar shows separate **Main** and **Subagent** chips. The main chip uses the native DSH switching API; the subagent pick only affects subagents started later in the current session.
- **One unified model menu**: search, provider groups, favorites, recent models, and reasoning effort. Picking a model keeps the menu open so you can adjust the effort, then a single **Apply** saves. Cancel, Escape, or clicking outside discards the draft — nothing is written.
- **Three settings rows**: new-session default model, subagent default model, and planning model. One scope hint per row.
- **Plan-mode auto switching**: entering plan mode switches to the planning model; approving the plan or `/plan off` restores the pre-plan main model and effort before the first execution request. The review panel shows the model that will be restored.
- **Per-session subagent overrides**: the chat-bar subagent pick is stored as a durable session override and never changes the settings default; restore to the settings default in one click.
- **Route validation before saving**: overrides and child creation validate the exact provider/model/effort through the host's `resolveCallConfig`; invalid combos fail immediately with the real reason instead of failing inside a run.

## Routing rules

- **Subagents**: session override > settings default > the confirmed current/pending parent selection. Provider, model and effort form one locked choice; tool/start parameters cannot override it. Nested children inherit the parent child’s lock. Later chat picks affect only newly created children.
- **Plan mode**: the current session provider/model/effort is saved atomically on entry → the planning model is used temporarily → restored before the first execution request after approval or `/plan off`. A failed restore is retryable and never strands the session on the planning model.
- **Defaults are independent of sessions**: the settings page stores the new-session defaults; chat picks and plan switches only affect the current session. The host adapter isolates the native `selectModel` "save as deployment default" side effect with `AsyncLocalStorage`, blocking only that call chain.

## Install

Targets **DeepSeek Harness 0.2.1-rc.3**, with native entry-point regression coverage for rc.2, rc.1 and 0.2.0-rc.2. Other versions require compatibility checks.

```bash
dsh plugin --profile desktop add github:Dalizi2026/dsh-model-dispatch
```

Replace `desktop` with the profile you actually use. Wait for active tasks to finish. After installing, **fully quit and reopen DSH** — the host half needs a recomposition; refreshing the page only reloads the client half.

> `lib/` in the repository holds prebuilt artifacts, so installing straight from GitHub works without a local build.

## Persistence

| Data | Location |
|---|---|
| Settings defaults (subagent default / planning model) | DSH profile config (volatile fields; editable from the settings page or the config file) |
| New-session main-model default | The native `agent-default-model` entry |
| Session subagent overrides | `$DSH_HOME/storages/model-switch/session-overrides.json` |
| Immutable child routes | `$DSH_HOME/storages/model-switch/child-route-locks.json` |
| Pre-plan main model | `$DSH_HOME/storages/model-switch/plan-main-models.json` (cleared after a successful restore) |
| Menu favorites / recents | Browser localStorage (not synced) |

## Build and test

```bash
npm ci
npm test        # vitest
npm run build       # tsc (two projects) + tsdown client bundle
```

Coverage includes conflicting tool/native routes, immutable child locks, concurrent saves, corruption/write failure rejection, cold historical confirmation with authentication and ownership checks, nested delegation, request-boundary rejection, plan restoration, independent defaults and client acknowledgement races.

For an isolated native-host test with simulated models (no paid requests):

```bash
DSH_TEST_MODULE_ROOT=/absolute/path/to/dsh/node_modules node scripts/verify-host.mjs
```

The script creates a separate temporary profile, checks native tool execution, nested locks, request headers and adapter dispatch, and asserts zero Opus dispatches. It leaves the active desktop profile untouched.

## Known limitations

- Tightly coupled to DSH 0.2.x internals (configForms, sessionProjections, sessionController, planMode); re-run the suite after a DSH upgrade.
- Live plan approval uses the canonical `approved` value. Recovering an approval across a process restart also uses the durable tool result and `plan/mode` events; native event changes require regression checks.
- Child sessions do not switch models in plan mode. They keep their own immutable lock; nested delegation inherits it.
- External backends that cannot prove the dispatch route are rejected. Missing/corrupt locks or unavailable models require repair or explicit historical confirmation; there is no automatic model fallback.
- “Last admitted request” shows the route allowed through the final guard, not proof of provider success or billing.

## Credits

- Original design and the 0.1.x implementation: [lincong1987/dsh-model-switch](https://github.com/lincong1987/dsh-model-switch) (MIT) — this plugin builds on that work.
- [PR #1](https://github.com/Dalizi2026/dsh-model-dispatch/pull/1) identified the `startActivation` entry-point migration; native-entry regression tests retain coverage of that report.
- The 0.2.x adaptation, plan-mode switching, session overrides, route validation, and the new UI were rewritten/extended in this repository.

## License

[MIT](LICENSE)

# dsh-model-dispatch

English | [中文](README.zh.md)

**Give the main chat, subagents, and plan mode in DeepSeek Harness (DSH) each their own model.**

Without the plugin, subagents inherit the main model and plan mode uses it too. With it you can choose them separately: a fast, cheap model for everyday chat, your strongest model for planning, and a third one for the subagents that do the work. You choose once, and the plugin makes sure each of them really runs on the model you chose.

> Based on the design and code of [lincong1987/dsh-model-switch](https://github.com/lincong1987/dsh-model-switch) (DSH 0.1.x only), rewritten and extended for DSH 0.2.x. See [Credits](#credits).

## Three roles, three choices

| Role | When it is working | Where you choose it |
|---|---|---|
| **Main model** | Your everyday conversation with DSH | The **Main** chip in the chat input (this session only); **New session default** in settings |
| **Subagent** | Subagents the main agent sends off to do work | The **Subagent** chip in the chat input (this session only); **Subagent default** in settings |
| **Planning model** | The planning phase of plan mode (`/plan`) | **Planning model** in settings |

Each choice includes a reasoning effort. Every model configured in DSH is available, and newly added models show up in the menu automatically.

## What the plugin guarantees

- **A choice is a lock.** A subagent's model and reasoning effort are locked when it is created, and stay the same through follow-ups, retries, and restarts. If the main agent asks for a different model in its tool call, your choice still wins.
- **Planning ends, your model comes back.** Entering plan mode switches to the planning model for the time being. After you approve the plan or run `/plan off`, the first execution request already uses your original main model and effort.
- **Chat choices leave the defaults alone.** Changes made in the chat bar affect the current session only. What a new session uses is decided by the settings page alone.
- **It stops instead of switching models behind your back.** If a model is unavailable, the configuration is damaged, or a save fails, the request stops and tells you why. Nothing falls back to another model.

## Install

It installs on any DSH version, with no local build.

1. Wait for running DSH tasks to finish.
2. Run the install command, replacing `desktop` with the profile you use:

   ```bash
   dsh plugin --profile desktop add github:hina1016/dsh-model-dispatch
   ```

3. **Fully quit DSH and open it again.** Refreshing the page is not enough: that reloads only the interface, and the host part that enforces the model lock needs a restart.

## Usage

### 1. Set the defaults in settings

Open **Model switch** in DSH settings. It has three rows:

| Setting | What it does | When unset |
|---|---|---|
| New session default | New sessions start on it | DSH's own default |
| Subagent default | Subagents use it by default | Follows the main model |
| Planning model | Used in plan mode | Follows the main model, so nothing switches |

### 2. Change models in the chat

The chat input shows a **Main** chip and a **Subagent** chip, each naming its current model and reasoning effort (narrow windows show the model only). Both open the same menu:

1. Search, or pick a model from favorites, recently used, or a provider group.
2. The menu stays open, so you can adjust the reasoning effort at the bottom.
3. Click **Apply** to save. Cancel, Escape, or a click outside the menu saves nothing.

What each chip affects:

- The **Main** chip changes the current session only.
- The **Subagent** chip always shows the model new subagents will use. Changing it affects subagents created afterwards; running subagents keep their model. To go back to the default, pick the default model from the list.

### 3. What happens in plan mode

```text
Everyday chat (main model)
   │  /plan
   ▼
Planning (planning model) ── plan declined ──▶ stays in plan mode on the planning model
   │  plan approved, or /plan off
   ▼
Execution (the main model and effort from before planning)
```

The review panel names the model that execution will restore. Subagents take no part in this switch and keep their own locked model.

### 4. Favorite the combinations you use

The ★ in the menu saves a model together with a reasoning effort. Several efforts of one model share a single row of chips, one click each. Picking a model by its name starts from the effort you last used with it. The full rules are in [favorites and reasoning effort](docs/favorite-efforts.md).

## Which model does a subagent use?

The first of these that has a value:

1. the model you picked on this session's **Subagent** chip;
2. **Subagent default** in settings;
3. the main session's current model.

Model and reasoning effort are locked as one choice. A subagent's own subagents inherit the same lock. The full rules are in [1.2.0 route locking](docs/releases/1.2.0-route-locking.md).

## FAQ

**Nothing changed after installing?**
Fully quit DSH and open it again. Refreshing the page is not enough.

**A ⚠ on the chip, or a "Degraded" banner at the top of settings?**
The DSH you are running lacks an interface the plugin needs, usually after a DSH upgrade. The notice names the affected function and the missing interface; everything else keeps working. Update the plugin, or paste the notice into an issue. [1.3.0 notes](docs/releases/1.3.0-host-seams.md) explain each degraded state.

**A subagent header says "Model confirmation required; requests paused"?**
This is an older subagent with no lock record, typically one created before upgrading to 1.2.0. Open it, expand the notice in its header, pick a model and effort, and click **Apply**. It continues with its original context.

**The main agent named another model in its tool call. Why was it ignored?**
By design: you decide which model a subagent uses, not the model. The interface shows "Conflicting tool or preset selection ignored".

**I changed the subagent model, but a running subagent did not change.**
Existing subagents stay locked. A new choice applies to subagents created afterwards; to run a task on another model, start a new subagent.

**Saving says the model is invalid?**
Before saving, the plugin asks DSH whether that exact provider, model, and effort combination is usable. Providers with similar names are not interchangeable, so pick the model again from the correct provider group.

**Favorites and recent models are gone on another computer?**
They live in the browser's local storage and do not sync. Model settings and locks are not affected.

**Which DSH versions are supported?**
It installs on any version; which functions run depends on the interfaces that DSH provides. Versions where the full test suite passed are listed in [verified versions](docs/verified-versions.md), as a reference and not as an install condition.

## Release history

| Version | Main changes |
|---|---|
| 1.3.0 | No DSH version gate; when DSH lacks an interface, only the affected function is switched off, with the reason shown; adapts to DSH 0.2.2; favorites keep the reasoning effort. [Notes](docs/releases/1.3.0-host-seams.md) |
| 1.2.3 | Aligned with DSH Desktop 0.2.1-rc.5. [Notes](docs/releases/1.2.3-compatibility.md) |
| 1.2.2 | Refines the checks on subagent compaction requests, the route status display, and restoring the main model after planning. [Notes](docs/releases/1.2.2-fixes.md) |
| 1.2.0 | Subagent models are locked at creation; errors stop the request instead of switching models; older subagents continue only after you confirm a model. [Notes](docs/releases/1.2.0-route-locking.md) |

Earlier versions and verification reports are in the [documentation index](docs/README.md). Everything under `docs/` is written in Chinese.

## Where data is stored

| Data | Location |
|---|---|
| Subagent default, planning model | DSH profile config, editable from the settings page or the config file |
| New session default | DSH's native `agent-default-model` entry |
| Per-session subagent choices | `$DSH_HOME/storages/model-switch/session-overrides.json` |
| Subagent model locks | `$DSH_HOME/storages/model-switch/child-route-locks.json` |
| Main model saved before planning | `$DSH_HOME/storages/model-switch/plan-main-models.json`, cleared after a successful restore |
| Favorites, recent models, last efforts | Browser localStorage `dsh-model-switch/picker-v2`, not synced |

Upgrading the plugin needs no data migration.

## Development and verification

```bash
npm ci
npm test            # vitest
npm run typecheck   # host and client projects
npm run build       # outputs to lib/
npm run preview     # interactive model-menu preview at http://127.0.0.1:5179/
```

`lib/` holds build output committed to the repository, because users install straight from GitHub. After changing `src/`, rebuild and commit `lib/` together with the source.

To run the contract suite on a full DSH host, with simulated models and no paid requests:

```bash
DSH_TEST_MODULE_ROOT=/absolute/path/to/dsh/node_modules node scripts/verify-host.mjs
```

The script uses its own temporary profile and leaves your desktop profile untouched. It checks native tool execution, nested delegation, request headers, and adapter dispatch, and asserts that the model the tool arguments asked for (a simulated Opus in the tests) is never dispatched and that the host seam report is empty. CI (`.github/workflows/regression.yml`) runs it on each listed DSH version and can be triggered manually with any version; [verified versions](docs/verified-versions.md) describes how to record a result.

How it works, in brief:

- Before a choice is saved or a subagent is created, the exact provider, model, and effort combination is validated through the host's `resolveCallConfig`; an invalid combination fails immediately.
- The model lock is written atomically when a subagent is created and checked before every request is assembled and dispatched. The final `llm/stream` guard only admits or rejects; it never rewrites a request.
- The model discovery tool reports only the route the user locked and cannot pick another.
- `AsyncLocalStorage` isolates the native `selectModel` side effect of saving the model as the deployment default, blocking only that call chain, so neither chat picks nor plan switches change the new-session default.

More documentation: the [documentation index](docs/README.md), the [glossary](GLOSSARY.md), and [ADR 0001](docs/adr/0001-host-seams-not-versions.md). Agents working in this repository should read [AGENTS.md](AGENTS.md) first.

## Known limitations

- The plugin can confirm that DSH provides an interface it needs, not that the interface still behaves the same. Renamed events and timing changes are caught only by the contract suite, so it has to run on each new DSH version.
- Recognizing an approved plan depends on DSH's event format; a format change in DSH requires re-verification.
- Subagents take no part in plan switching and keep their own lock; their subagents inherit it.
- Some external backends cannot guarantee which model actually runs, and subagents on those backends are refused. A damaged configuration or lock needs you to repair or confirm it; there is no automatic model fallback.
- "Last admitted request" in the interface means the plugin let a request on that route through. It is not proof that the provider answered or billed.

## Credits

- Original design and the 0.1.x implementation: [lincong1987/dsh-model-switch](https://github.com/lincong1987/dsh-model-switch) (MIT).
- [PR #1](https://github.com/Dalizi2026/dsh-model-dispatch/pull/1) identified the `startActivation` entry-point change; the native-entry tests for it are still in the suite.
- The DSH 0.2.x adaptation (settings system, subagent projections, session model-selection APIs), plan-mode switching, session overrides, route validation, and the new interface were rewritten and extended in this repository.

## License

[MIT](LICENSE)

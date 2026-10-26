# DSH 0.2.1-rc.1 compatibility — plugin 1.1.0

> 历史版本验证记录：其中“显式工具参数优先”的行为已在 1.2.0 移除。当前行为见 [1.2.0 路由锁定](1.2.0-route-locking.md)。

Tested on DeepSeek Harness Desktop 0.2.1-rc.1 (2026-10-17), using the installed application's source and a separate native profile for live requests.

## Incompatibility

DSH 0.2.1 replaces `SubagentRuntime.start` / `startContinuable` with `startActivation`. Native delegation now returns a managed activation ID immediately; result delivery and cleanup belong to the runtime. Plugin 1.0.1 only wrapped the removed methods. A menu selection could therefore appear correct while the native activation bypassed the plugin route, including the per-call explicit route passed by its catalog adapter.

## Changes

- Detect and wrap `startActivation`; wrap legacy start methods only when present. Do not create missing methods. Preserve native activation ID, reserved child identity, parent authority, signal, working directory, preset, output schema, depth limit, and delivery configuration.
- Keep route precedence and live catalog validation: explicit tool selection > session override > plugin default > native inheritance. Route changes clear an omitted old-route effort. New catalog models remain available without a hardcoded child-model list.
- Render external tasks as non-openable entries. Keep migration-required state distinct; open a legacy child through native navigation before attempting to expand its descendants.
- Read the canonical `exit_plan_mode` result's `approved` boolean for live approval boundaries. A successful `approved:false` dismissal keeps the planning model; approval or `/plan off` restores the saved main model before the first execution request. Durable boundary projections continue to cover restart recovery.
- Compile against pinned 0.2.1-rc.1 development dependencies, with peer ranges retaining 0.2.0-rc.2 support. Refresh the npm lockfile and prebuilt artifacts.

## Validation

- 70 tests pass, including direct use of the 0.2.1-rc.1 native delegation tool.
- Both TypeScript projects and the browser bundle build pass.
- The original 0.2.0-rc.2 native tool compatibility probe still passes foreground and legacy continuable routing.
- An isolated full 0.2.1-rc.1 host loads the plugin and performs real streamed requests. Each test first runs ordinary conversation, then enters plan mode in the same conversation.

| Case | Main model | Planning model | Child model | First execution request |
|---|---|---|---|---|
| A | Droid GLM-5.3 Flash · Max | STEP 5 Preview · Max | Droid Sonnet 5.5 · Xhigh | Droid GLM-5.3 Flash · Max |
| B | STEP 5 Preview · Max | Droid GLM-5.3 Flash · Max | Droid GLM-5.3 Flash · Max | STEP 5 Preview · Max |
| C | Droid Sonnet 5.5 · Xhigh | STEP 5 Preview · Max | STEP 5 Preview · Max | Droid Sonnet 5.5 · Xhigh |

All three children generate the requested unique marker. Native request-header events confirm provider/model/effort. All three approved plans restore the original main route on the first execution request and return the requested execution marker. Case B omits model arguments and verifies the stored session child selection. A separate real dismissal test keeps the planning model, then `/plan off` restores the original main route.

Raw session evidence stays in local verification outputs and is not distributed in this repository. The user's active Desktop sessions and default model settings are not modified by these isolated tests. Restart Desktop after its running work finishes to load the rebuilt host plugin; a client-page refresh alone is insufficient.

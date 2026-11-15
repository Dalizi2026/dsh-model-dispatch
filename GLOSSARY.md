# dsh-model-dispatch

A DSH plugin that lets users choose the models used by the main session, subagents and plan mode, and holds DSH to those choices. The terms below describe how the plugin relates to the DSH host.

## Host compatibility

**Host seam**（宿主接缝）:
A named point where the plugin attaches to DSH: a service, a method, an event, the shape of an event's data, a UI slot, or a module export. Host seams, not version numbers, decide whether the plugin can run on a host.
_Avoid_: interface, API, adaptation baseline（适配基线）, version adaptation（版本适配）

**Capability**（能力）:
A user-facing function of the plugin that depends on a set of host seams and is enabled, switched off or paused as a whole. This plugin's capabilities are the model lock, plan auto-switch (together with new-chat default protection), and each UI entry.
_Avoid_: feature module（功能模块）, feature（特性）

**Degraded**（降级）:
The state of a capability with at least one missing host seam: it is switched off or paused, and the user is told which seams are missing.
_Avoid_: broken, unsupported（不支持）

**Verified version**（已验证版本）:
A DSH version on which the full contract test suite passed, with its report kept. It is evidence, never an install condition.
_Avoid_: compatible version（兼容版本）, supported version（支持版本）, adaptation baseline（适配基线）

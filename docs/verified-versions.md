# 已验证版本

[已验证版本](../GLOSSARY.md)是完整契约测试跑通、并留有报告的 DSH 版本。它只是证据，不是安装条件：插件能不能运行由宿主接缝决定，见 [1.3.0 说明](1.3.0-host-seams.md)。本文件是唯一记录。

完整契约测试是指用 `scripts/verify-host.mjs` 在隔离的原生宿主上依次跑初始、`resume`、`historical` 三个阶段。测试使用模拟模型，不产生付费请求，最后要求接缝报告为空。

## 记录

### 0.2.2-rc.1：通过

- 插件 1.3.0，2026-11-07，macOS 本地运行。
- 初始阶段 11 个用例、`resume` 2 个、`historical` 3 个全部通过。接缝报告为空，付费请求 0，模拟 Opus 派发 0。
- 插件 1.2.3 在这个版本上不通过，且同样的问题在 1.3.0 修复前也存在。0.2.2 在步骤准备时就从会话记录里读定本步的模型，比 rc.5 更早，并且不允许 `agent/request` 再改模型，由此带来两个问题：
  - 计划自动换模晚一次请求生效：对话中途 `/plan` 后，计划阶段的第一次请求仍用主模型；批准后的第一次执行请求仍用计划模型。
  - 确认历史子代理时选了另一个模型，确认后子代理被宿主拒绝，无法继续。
- 修复方式见 [1.3.0 说明](1.3.0-host-seams.md#宿主时序差异)。

### 0.2.1-rc.5：通过

- 插件 1.3.0，2026-11-07，macOS 本地运行。
- 初始阶段 11 个用例、`resume` 2 个、`historical` 3 个全部通过。接缝报告为空，付费请求 0，模拟 Opus 派发 0。
- 此前插件 1.2.3 也在这个版本上通过，见 [1.2.3 兼容说明](1.2.3-compatibility.md)。

### 0.2.1-rc.3：通过（插件 1.2.3）

- 插件 1.2.3 的初始 10 个场景全部通过，见 [1.2.3 兼容说明](1.2.3-compatibility.md)。1.3.0 尚未在本地重跑，由 CI 矩阵覆盖。

### 更早的版本

插件 1.2.2 及更早的版本还在 0.2.0-rc.2、0.2.1-rc.1、0.2.1-rc.2 上做过适配验证，记录见 [1.2.0 路由锁定](1.2.0-route-locking.md) 和 [DSH 0.2.1 兼容说明](dsh-021-compatibility.md)。这些记录不再更新。

## 新增一条记录

- **CI**：手动触发 `Regression` workflow，在 `dsh_version` 里输入版本号，例如 `0.2.3-rc.1`。只跑初始阶段。
- **本地**：把官方运行时装进临时目录，然后依次跑三个阶段。`DSH_TEST_HOME` 必须是新的空目录，`resume` 和 `historical` 两个阶段要沿用同一个目录：

```bash
npm install --prefix /tmp/dsh-host --ignore-scripts @deepseek-ai/dsh@<版本> @deepseek-ai/dsh-web-app@<版本>
npm run build
export DSH_TEST_MODULE_ROOT=/tmp/dsh-host/node_modules DSH_TEST_HOME=/tmp/dsh-route-home
DSH_TEST_REPORT=/tmp/initial.json node scripts/verify-host.mjs
DSH_TEST_PHASE=resume DSH_TEST_PREVIOUS_REPORT=/tmp/initial.json DSH_TEST_REPORT=/tmp/resume.json node scripts/verify-host.mjs
DSH_TEST_PHASE=historical DSH_TEST_PREVIOUS_REPORT=/tmp/initial.json DSH_TEST_REPORT=/tmp/historical.json node scripts/verify-host.mjs
```

三个阶段都输出 `"pass":true` 后，在上面按同样格式补一条记录，写明插件版本、日期、平台、各阶段的用例数和接缝报告。未通过也要记下来，并写明停在哪个用例、根因和影响。

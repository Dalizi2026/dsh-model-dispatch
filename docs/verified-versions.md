# 已验证版本

[已验证版本](../GLOSSARY.md)是完整契约测试跑通、并留有报告的 DSH 版本。它只是证据，不是安装条件：插件能不能运行由宿主接缝决定，见 [1.3.0 说明](1.3.0-host-seams.md)。本文件是唯一记录。

完整契约测试是指用 `scripts/verify-host.mjs` 在隔离的原生宿主上依次跑初始、`resume`、`historical` 三个阶段。测试使用模拟模型，不产生付费请求，最后要求接缝报告为空。

## 记录

### 0.2.1-rc.5：通过

- 插件 1.3.0，2026-11-07，macOS 本地运行。
- 初始阶段 11 个用例、`resume` 2 个、`historical` 3 个全部通过。接缝报告为空，付费请求 0，模拟 Opus 派发 0。
- 此前插件 1.2.3 也在这个版本上通过，见 [1.2.3 兼容说明](1.2.3-compatibility.md)。

### 0.2.1-rc.3：通过（插件 1.2.3）

- 插件 1.2.3 的初始 10 个场景全部通过，见 [1.2.3 兼容说明](1.2.3-compatibility.md)。1.3.0 尚未在本地重跑，由 CI 矩阵覆盖。

### 0.2.2-rc.1：未通过

- 插件 1.3.0 和 1.2.3 在 2026-11-07 都停在同一个用例上：对话中途执行 `/plan` 后，计划阶段的请求仍然使用主模型。前面 4 个用例通过，接缝报告为空。
- 根因：0.2.2 把模型选择从 `system-prompt/assemble` 挪到了更早的 `agent/pre-step`。插件在组装阶段调用 `selectModel`，要到下一次请求才生效，所以切换计划模型和恢复主模型都会晚一次请求。这是宿主时序的变化，运行时的接缝检查查不出来，由契约测试发现。
- 影响：在 0.2.2-rc.1 上，计划自动换模晚一次请求生效。模型锁、子代理锁定、会话覆盖和最终请求守卫的用例都已通过。

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

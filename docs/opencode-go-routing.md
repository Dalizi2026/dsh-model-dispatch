# 子代理 OpenCode Go 失败：根因与 0.10.2 修复

已完成排查、修复并加载本地插件 0.10.2。宿主仍为 DeepSeek Harness Desktop 0.2.0-rc.2。

## 根因已确认

四个失败 child 的 `turn/end` 都记录了同一个错误：

```text
pi-ai provider "opencode-go" has no configured model "deepseek-v4.1-flash"
code: UNKNOWN_MODEL
```

失败组合是 `opencode-go / deepseek-v4.1-flash / high`。当前 DSH profile 中，`opencode-go` 配置了 GLM 与 Muse 模型；DeepSeek V4.1 Flash 配置在另一个 provider ID **`opencode-go-completions`** 下。

正确的 DSH 路由是：

```json
{
  "provider": "opencode-go-completions",
  "model": "deepseek-v4.1-flash",
  "reasoningEffort": "high"
}
```

两条路由属于同一个上游渠道，并不代表 provider ID 可互换。直连 `/chat/completions` 成功只能验证端点与模型可用，不能验证 `opencode-go/deepseek-v4.1-flash` 在 DSH 配置中存在。

路由注入确实生效，但组合无效，插件此前缺少提前校验，直到 child 的模型解析时才失败；工具把它汇总成通用的 `subagent run failed`。

## 直接证据

1. 对四个失败文件按原生 `scanZstdFrames` 的逻辑逐帧解压，每个文件有 4 帧、11 个事件加 session header。四个错误一致；首个文件修改时间仍为 17:52:21。
2. 原生 pi-ai 适配器的 `modelOf()` 对错误组合抛 `UNKNOWN_MODEL`；这是 credential 解析和 upstream streaming 之前的校验。
3. 加载从实际 app.asar 提取的原生 PiAiAdapter 和 pi-ai 代码，以当前配置做本地复现：错误组合失败且 fetch 次数为 0；正确 provider 能解析并通过模拟 SSE 完成流式读取。
4. 重启实际 Desktop 后，通过插件 HTTP 路由验证：错误组合返回 400，错误正文包含真实原因；正确组合返回 200。

证据文件：

- [四个 child 的原始错误摘要](/Users/lizi/Documents/Codex/2026-10-06/she/outputs/dsh-model-switch-child-errors.txt)
- [原生适配器本地流式复现](/Users/lizi/Documents/Codex/2026-10-06/she/outputs/dsh-model-switch-pi-route-repro.txt)
- [真实宿主保存校验](/Users/lizi/Documents/Codex/2026-10-06/she/outputs/dsh-model-switch-route-live.txt)

## 对排查简报的核对

| 假设 | 此次结论 |
| --- | --- |
| SSE 断流或流式被拦截 | 不是这四次失败的原因；错误组合还未发请求 |
| reasoning effort 映射异常 | 不是这四次失败的原因。实际 deepseek 分支在 high 下构造 `thinking: {type: "enabled"}` 和 `reasoning_effort: "high"` |
| 完整提示词或工具被内容检测拒绝 | 这四次失败未到上游，无法以它们证明渠道有内容拦截 |
| 并发/会话指纹风控 | 同样不解释本地 UNKNOWN_MODEL |
| 插件计划中间件导致 child 失败 | 计划逻辑明确跳过 origin=subagent；四个日志错误来自模型解析 |
| child 日志只有 header，所以尚未执行/尚未 checkpoint | 当前文件实际含多个 zstd 帧及完整失败事件。只解压首帧会只看到 header，不能据此推断生命周期 |
| 必须终端启动或加文件探针才能获得错误 | 本次不需要，真实错误已保存在 turn/end 中 |

原生 tool-subagent 其实支持 `result.diagnostic`，但 stopReason=error 的标题是通用文案；本次运行结果没有把 turn/end 的具体模型错误带入可见工具结果。

## 插件修复

- 新增 `src/model-route.ts`：通过宿主 `llm.resolveCallConfig` 验证精确 provider/model 与显式 effort；不猜别名、不自动改成其他提供方。
- 子代理路由包装移至 `src/subagent-routing.ts`：one-shot 与 continuable 都在创建 child 之前等待校验；先合并明确请求参数，再验证最终生效组合。无插件路由时保留原生继承。
- `src/session-overrides.ts`：会话覆盖 POST 在保存前验证。无效模型返回 400，并保留原内存与磁盘；清除不需要模型仍有效。
- `src/client/session-overrides-store.ts`：展示宿主具体错误正文，不再只显示 HTTP 400。
- `src/client/ModelPicker.tsx` 与 locales：保存的组合不在已加载提供方目录时，显示警告及完整 provider/model，提示从正确分组重新选择。
- 版本升级为 0.10.2，保留 0.10.1 的会话模型/新会话默认分离行为。

## 验证与当前状态

**48/48 测试通过**，宿主/客户端 TypeScript 编译与 bundle 构建通过。新增覆盖错误组合在 child 创建前被拒绝、两条启动路径等待校验、明确请求优先、默认与 effort 校验、HTTP 无效保存不落盘和客户端显示具体错误。

实际 Desktop 已重启加载。按用户简报要求，原主会话的子代理覆盖已恢复为 **`factory-g / glm-5.3-flash / max`**；其他覆盖保持一致，临时校验记录已清除。主模型默认分离未撤回。

本次没有使用真实凭据向上游生成模型回复。流式复现使用原生 SDK 和模拟 SSE；真实宿主验证的是模型/档位解析及持久化，不是完整子代理联网生成。正确路由消除了已证实的 UNKNOWN_MODEL，其他上游问题需在使用正确组合后凭新错误判断。

如果继续用 OpenCode Go 的 DeepSeek，请在子代理菜单里选择 **OpenCode Go (Completions) → DeepSeek V4.1 Flash**，或使用上述正确 JSON。插件不会把相似渠道 ID 自动互换。

## 维护与交接

工作副本：`/Users/lizi/Documents/dsh/dsh-model-switch`；desktop profile 仍通过现有链接安装。修复前备份在 `/Users/lizi/Documents/Codex/2026-10-06/she/work/subagent-route-backup`。

本地原生复现脚本 `work/pi-route-repro.mjs`、多帧读取辅助 `work/zstd-frames.mjs` 和真实宿主校验脚本 `work/live-route-validation.mjs` 位于本次 Codex 工作目录，不是插件运行依赖。

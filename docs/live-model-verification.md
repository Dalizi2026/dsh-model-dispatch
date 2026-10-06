# dsh-model-switch 真实请求验证与交接

2026-10-06，DeepSeek Harness Desktop 0.2.0-rc.2；本地插件最终版本 0.10.3。

## 结论

子代理 DeepSeek 路由、STEP 制定计划、审批后 DeepSeek 执行均通过真实流式请求验证。补测发现重复进入计划模式不切回 STEP 的问题，已修复，并在同一会话重新验证通过。直接 `/plan off` 后的第一条请求也自动使用 DeepSeek。设置页的新会话默认仍是 Factory GLM，没有被计划切换或对话选模改写。

## 方法与证据

在实际 Desktop 新建专用 standard 会话，经聊天 UI 发出请求，调用原生 subagent、/plan、exit_plan_mode 和审批面板。没有手动切换主模型来代替自动路由，也没有使用模拟上游响应。任务只输出唯一验证串，禁止读写项目、运行命令与额外委派。

父会话：``测试会话``。

子会话：`79071e4c-7852-4a20-ae24-1b7be78f742e`，origin=subagent、delegationDepth=1、agentPreset=standard。

取证读取各会话 `session.v4.jsonl.zstd` 的全部完整 zstd 帧；以 request/header、assistant/message 的实际 provider/model、上游 responseId、用量与 turn/end 为依据。仅保存测试会话的必要事件，不包含凭据和推理文本。

| 验证 | 真实路由 | 结果与事件证据 |
|---|---|---|
| 主会话初始生成 | factory-g / glm-5.3-flash | 请求 seq 13；启动一个前台子代理，工具参数没有 provider/model/reasoningEffort |
| 子代理默认 | opencode-go-completions / deepseek-v4.1-flash | 请求 seq 13，回复 seq 16：DSH_CHILD_LIVE_OK；结束 seq 18=completed；父工具结果 isError=false |
| 首次制定计划 | step / step-5-preview | 父请求 seq 39；STEP 回复 seq 41 调用 exit_plan_mode，审批面板默认执行模型为 DeepSeek |
| 首次审批执行 | opencode-go-completions / deepseek-v4.1-flash | 请求 seq 50，回复 seq 52：DSH_EXEC_LIVE_OK；第 2 轮 completed |
| 最终修复后制定计划 | step / step-5-preview | 请求 seq 149，回复 seq 151 调用 exit_plan_mode；第 7 轮第 1 步 |
| 最终修复后审批执行 | opencode-go-completions / deepseek-v4.1-flash | 请求 seq 160，回复 seq 162：DSH_FINAL_APPROVED_OK；第 7 轮 completed |
| 同一进程、同一会话再次进入计划 | step / step-5-preview | 请求 seq 178，回复 seq 180：DSH_FINAL_PLAN_REPEAT_OK；第 8 轮 completed |
| 直接退出计划后的首次请求 | opencode-go-completions / deepseek-v4.1-flash | 原生 plan off seq 183–186；自动选模 seq 191；请求 seq 197；回复 seq 199：DSH_FINAL_DIRECT_EXEC_OK；第 9 轮 completed |

当前保存的三条路由未指定 reasoningEffort，本次按这些真实设置验证。后台任务、长任务和所有推理档位的组合未逐一测试。

## 本次发现并修复的问题

插件 0.10.2 第一次计划审批正常，但审批退出后，插件内部阶段记录仍可能停留在 active=true。第二次 `/plan` 被认为没有阶段变化，因此实际请求仍用 DeepSeek。该错误在父会话第 3 轮 seq 66/67 被真实复现。

宿主 standard 预设的 `planning` 分组设置 `isolate: { planMode: true }`，全局插件和 Agent 根上下文都不能直接读取该控制器的 pending exit。审批面板预先选择执行模型，让执行请求正确，却掩盖了插件阶段记录未更新的问题。

最终修改 `src/plan-model.ts`：加入 prepend 的 agent/pre-step waterfall，在 await next() 后、确认步骤被接受且未取消时，读取已提交的原生 plan projection，同步已有路由记录。保持审批手动选模优先，不在阶段中反复覆盖用户选择。没有修改宿主源码或凭据；临时文件诊断代码已移除。

`tests/plan-model.spec.ts` 新增隔离 planMode、审批退出、再进入计划的回归用例。插件 package.json 升至 0.10.3，README 中的验证范围已更新，源码和构建产物均已更新，Desktop 已重启加载最终修复代码。

检查结果：9 个测试文件、49 项回归全部通过；宿主与客户端 TypeScript 检查通过；客户端构建通过。

## 设置与结束状态

再次读取 profile 并对照断言，以下配置与测试开始时一致：

- 新会话默认：factory-g / glm-5.3-flash。
- 子代理默认：opencode-go-completions / deepseek-v4.1-flash。
- 制定计划：step / step-5-preview。
- 执行计划：opencode-go-completions / deepseek-v4.1-flash。

在测试会话已使用 DeepSeek 后，再点“新建会话”，UI 主模型仍显示 Factory GLM，子代理仍显示 DeepSeek。随后返回专用测试会话；该会话已退出计划模式、处于空闲，主模型保留 DeepSeek。没有修改旧工作会话的子代理覆盖或用户保存的默认策略。

## DSH 接手位置

工作副本：`/Users/lizi/Documents/dsh/dsh-model-switch`，desktop profile 的 link 安装保持原样。

本次关键新增改动只有 `src/plan-model.ts` 的已提交阶段同步、对应回归用例、版本与验证文档。此前 0.10.2 的错误路由校验继续保留：DeepSeek 必须使用真实 catalog 中的 provider `opencode-go-completions`。

同目录证据：`dsh-model-switch-real-request-evidence.json`、`dsh-model-switch-settings-verified.json`。可据上表的会话 id、seq、responseId 回查宿主原始事件。

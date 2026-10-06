# DSH 计划完成后恢复主代理模型：实现与真实验证

2026-10-06，插件本地副本 0.11.0，宿主 DeepSeek Harness Desktop 0.2.0-rc.2。

## 最终行为

聊天栏选 Sonnet → 进入计划模式临时使用 STEP → 批准计划后第一条执行请求自动恢复 Sonnet。保存并恢复的是进入计划前的会话 provider、model、reasoningEffort，独立于设置页的新会话默认。恢复后保持该主模型，后续手动切换正常生效。

设置页保留新会话主模型、子代理默认、制定计划三个选择器；执行区域仅说明自动恢复原主代理模型。审批面板只显示将恢复的模型，移除了执行模型下拉菜单。旧 planExecute 字段从类型、schema、客户端和路由中移除，当前 desktop profile 的该字段也已清除。

## 实现交接

工作副本：`/Users/lizi/Documents/dsh/dsh-model-switch`，desktop profile 通过现有本地链接加载。已构建并重启实际 Desktop，当前生效版本 0.11.0。

- `src/plan-model.ts`：进入计划前原子保存当前模型；恢复成功后清除记录；所有切换等待 native selectModel 完成，再进入原生 assembly，保证边界第一条请求正确。恢复失败不标记成功，可以重试。子代理不参与计划切换。
- `src/plan-boundary.ts`：注册可重放的 `modelSwitchPlanBoundary` 投影，匹配原生 exit_plan_mode 的 callId 与成功批准工具结果。解决 Desktop 将 planMode 隔离在 planning 分组、其退出状态晚于下一次 assembly 才提交的问题。拒绝或工具错误不会触发恢复。
- `src/session-overrides.ts`：支持独立存储文件；计划前模型保存于 `$DSH_HOME/storages/model-switch/plan-main-models.json`，与子代理覆盖分开。重启时先加载，防止把 STEP 当成原主模型。
- `src/plan-main-http.ts`、`src/plan-routes.ts`：只读 GET `/_dsh/model-switch/plan-main-models` 给审批面板展示原主模型；POST 返回 405。
- `src/client/PlanReviewPanel.tsx`、`PlanReviewComposer.tsx`、`SettingsSection.tsx`、`config-store.ts`、`locales.ts`、`index.tsx`：移除独立执行选模，展示恢复目标及新规则。
- `src/shared.ts`、`src/config.ts`、`src/index.ts`：删除 planExecute 配置和旧审批优先解析函数，接入新存储、投影及只读路由。
- `package.json`、README、测试同步更新。保留已有 AsyncLocalStorage 会话选模隔离，自动切换不会保存为新会话默认。

## 真实联网验证

使用既有专门测试会话 ``测试会话``。仅执行合成文本回复和原生计划审批工具，没有让模型读写项目、运行命令或委派。证据取自完整多帧 zstd 会话日志，包含 request/header、模型响应来源、响应 ID、工具结果及完成事件；不是仅凭 UI 标签或直接 HTTP 探针判断。

| 场景 | 制定计划实际请求 | 第一条执行实际请求 | 结果 |
|---|---|---|---|
| 正常审批，第 13 轮 | seq263：step / step-5-preview | seq274：factory-a / claude-sonnet-5-5 | seq276：RESTORE_A_SONNET_OK，completed |
| 计划中空闲重启后审批，第 14–15 轮 | seq292、303：step / step-5-preview | seq313：factory-a / claude-sonnet-5-5 | seq315：RESTORE_RESTART_SONNET_OK，completed |
| /plan off 后继续，第 16–17 轮 | seq331：step / step-5-preview | seq350：factory-a / claude-sonnet-5-5 | seq352：RESTORE_OFF_SONNET_OK，completed |

正常审批事件顺序为：seq267 原生批准结果 → seq269 选择 Sonnet → seq270 原生 plan/mode:false → seq274 执行请求。这证明第一步执行使用原主模型。

重启前持久化文件记录 factory-a / claude-sonnet-5-5；重启后审批面板仍显示 Sonnet，未误记 STEP。三种场景后存储为空，普通聊天不会被旧恢复记录影响。

设置页实机确认只有三个模型选择器。测试前后保存设置完全一致（移除旧执行字段后的基线）：新会话默认 factory-g / glm-5.3-flash，子代理默认 opencode-go-completions / deepseek-v4.1-flash，制定计划 step / step-5-preview，均无显式推理档位。测试会话原主模型 Sonnet 没有显式档位；显式 high 档位恢复由回归测试覆盖。

用户原工作聊天没有发送新消息，未发送草稿“把版本号调整成1.0”保留，界面已返回原聊天。

## 检查

10 个测试文件、53 项测试通过。覆盖第一请求、重复计划、新主模型、直接退出、重启、档位、持久化失败、恢复失败重试、审批错误/无关工具隔离、只读接口与已有会话默认分离。宿主与客户端 TypeScript 检查通过，构建通过。

完整安全证据：`dsh-plan-main-restoration-evidence.json`。本次真实任务是短文本合成验证，没有运行长时间项目执行。

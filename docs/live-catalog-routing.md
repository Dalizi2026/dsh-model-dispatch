# 模型目录统一路由修复（1.0.1）

2026-10-07，运行宿主：DeepSeek Harness Desktop 0.2.0-rc.2。
插件：`dsh-model-dispatch`（原 dsh-model-switch 已改名）。本地链接安装已构建，并重启 Desktop 加载。

## 原因与结果

失败会话的第 3 个事件把显式子代理允许列表固定为 `factory-g/glm-5.3-flash`。主模型、计划模型和插件子代理菜单读取全局模型目录，原生子代理工具却读取会话创建时捕获的旧列表。因此显式指定 STEP 在创建子代理之前就被拒绝。

1.0.1 将插件的显式委派授权绑定到宿主当前模型目录。主代理、计划模型继续使用原生全局选模接口；子代理默认、会话覆盖、工具显式选模均可使用同一目录中的路由。目录新增模型在下一次委派时即可使用；移除路由或传入不支持的思考档位会在创建子代理前被拒绝。

## 实现与边界

- 新增 `subagent-catalog.ts`：请求组装前适配当前 Agent 可见的原生 `subagent` 与 `list_subagent_models` 工具执行函数，目录发现读取实时 LLM 服务。
- 新增 `delegation-selection.ts`：使用 AsyncLocalStorage 保存一次工具调用的显式 provider/model/effort；匹配父 Agent 身份，防止并发与嵌套委派串路由。
- `subagent-routing.ts`：显式工具选择优先于会话覆盖和默认；新路由没有指定思考强度时清除旧路由的强度，交由所选模型的原生规则确定。仅改变对应 `start/startContinuable` 的 agentOptions。
- 委派时验证模型目录成员资格与原生 `resolveCallConfig`；没有硬编码 STEP 特例或模型清单。
- 由于 rc.2 不支持修改已有会话的冻结允许列表，插件接管选模层：原始工具参数继续写入会话日志；原生委派执行体收到移除选模字段后的参数，显式选择通过上述调用上下文传入启动层。工具 schema、输出、审批/权限、取消、委派深度、前后台生命周期继续使用原生实现。原会话的历史允许列表保持原样，不编辑或伪造历史事件。
- 插件卸载恢复执行函数和启动方法；使用 WeakMap/WeakRef，避免持有已销毁 Agent 的工具定义。
- 适配固定于 rc.2 的原生 `subagent`/`list_subagent_models`；宿主升级需重新验证。旧会话若本来没有显式选模工具字段，仍可使用聊天栏的子代理覆盖；本次失败会话已经具备这些字段。

## 验证

- Vitest：11 个文件、63/63 测试通过。
- 宿主及客户端 TypeScript 检查通过，产物构建通过。
- 安装包原生 `dsh-tool-subagent` 兼容探针：旧列表下修复前显式 STEP 被拒绝；安装适配后前台及后台 continuable 路由正确。
- 模拟目录变更：增加新 provider/model 后立即发现并启动；删除后拒绝新建。未来模型未进行真实上游请求测试。
- 同一个旧会话真实请求验证（主代理 Droid GLM-5.3 Flash / Max）：

| 子代理真实请求路由 | 思考档位 | 原文结果 |
|---|---|---|
| `step/step-5-preview` | `max` | `STEP_CHILD_OK` |
| `opencode-go-completions/deepseek-v4.1-flash` | `high` | `CATALOG_DEEPSEEK_OK` |
| `factory-a/claude-sonnet-5-5` | `xhigh` | `CATALOG_SONNET_OK` |

三个 child 的 `request/header` 均确认以上路由和档位，`assistant/message` 确认真实返回；主会话工具结果均 `isError: false`。后两项在同一助手消息中并发派发。STEP 的 `list_subagent_models` 返回全套思考档位。原始会话证据保留在本地验证产物中，不随公开仓库发布。

本轮没有修改用户的模型默认、会话覆盖或计划设置。主代理/计划切换的原有实现未改；本次新增真实请求测试针对子代理路由，不能视为对所有目录模型、所有角色和上游可用性的穷举测试。

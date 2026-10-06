# 三组真实模型切换验证

2026-10-06。插件 0.11.0，DSH Desktop 0.2.0-rc.2。

三组全部通过。使用既有专门测试会话 ``测试会话``，按实际设置发起宿主流式请求。检查完整多帧会话日志中的模型来源、响应 ID、request/header、审批工具结果和 turn/end。

| 组别 | 主代理实际模型 | 制定计划实际模型 | 批准后的第一条执行请求 | 返回结果 |
|---|---|---|---|---|
| A | Droid Sonnet 5.5 | STEP 5 Preview | Droid Sonnet 5.5 | MID_A_EXEC_OK，完成 |
| B | OpenCode DeepSeek V4.1 Flash | Droid GLM 5.3 Flash | OpenCode DeepSeek V4.1 Flash | MID_B_EXEC_OK，完成 |
| C | Droid GLM 5.3 Flash | Droid Sonnet 5.5 | Droid GLM 5.3 Flash | MID_C_EXEC_OK，完成 |

A、B 均先完成普通对话，再在同一个既有会话中发送 `/plan`，没有新开会话。制定计划设置从 STEP 实时改为 GLM、再改为 Sonnet，期间没有重启宿主，三种策略均实时生效。

## 运行中开启计划：C 组

C 组让主代理 GLM 实际调用 Bash，仅运行无文件副作用的 `sleep 20`。在该工具仍运行时发送 `/plan`，让下一步制定一个批准后只回复标记的极简计划。

真实事件顺序：

1. seq442：GLM 请求；seq444：GLM 响应调用 Bash；seq445：开始 sleep 20。
2. seq446：用户 `/plan`，seq448：命令成功，宿主明确返回“从下一步生效”。命令时间位于 seq445 工具开始和 seq449 工具结束之间。
3. seq449：原 GLM 工具完成；seq452：切到 Sonnet；seq453：原生计划模式提交；**seq459：下一条请求立即使用 Sonnet**。
4. seq461：Sonnet 真实响应调用 exit_plan_mode 提交计划；seq462：等待审批。
5. seq463：用户批准成功；seq465：恢复 GLM；seq466：退出计划；**seq470：第一条执行请求立即使用 GLM**。
6. seq472：GLM 返回 MID_C_EXEC_OK；seq474：本轮 completed。

因此，运行中开启计划也按设置切换：当前正在进行的请求/工具完成后，从下一条请求开始使用计划模型。批准后从第一条执行请求恢复进入计划前的主模型。

## 其余请求证据

A：Sonnet 普通对话响应 seq360（MID_A_MAIN_OK）；STEP 计划请求 seq376、提交计划响应 seq378；Sonnet 执行请求 seq387、回复 seq389；seq391 completed。

B：DeepSeek 普通请求 seq400、回复 seq402（MID_B_MAIN_OK）；GLM 计划请求 seq418、提交计划响应 seq420；DeepSeek 执行请求 seq429、回复 seq431；seq433 completed。

完整 provider/model：Sonnet 为 `factory-a / claude-sonnet-5-5`，STEP 为 `step / step-5-preview`，DeepSeek 为 `opencode-go-completions / deepseek-v4.1-flash`，Droid GLM 为 `factory-g / glm-5.3-flash`。本轮均使用提供方默认推理档位。

## 清理与回归

测试后恢复并比对设置，与测试前完全一致：新会话主默认 Droid GLM，子代理默认 OpenCode DeepSeek，制定计划 STEP。专门测试会话恢复原 Sonnet，计划模式关闭，计划原模型临时记录为空。用户工作聊天未发送新消息，原草稿保留，已返回原工作聊天。

新增一项针对“隔离 planMode 下，在开放轮次中发出 /plan 后第一步使用计划模型”的回归测试。10 个测试文件、54 项全部通过。本轮没有修改运行时代码；真实请求验证了已实现的 0.11.0 切换逻辑。

机器可核对证据：`dsh-three-plan-switch-evidence.json`。短合成任务的三组结果不等同于对所有未来长任务的穷尽验证。

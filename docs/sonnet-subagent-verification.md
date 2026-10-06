# Sonnet 5.5 主代理 × 三种子代理渠道：真实请求验证

2026-10-06，DSH Desktop 0.2.0-rc.2，本地插件 0.10.3。三组全部成功，本次无需修改插件代码。

主代理全程使用 Droid / Factory Claude Sonnet 5.5（factory-a / claude-sonnet-5-5）。在专用会话里依次使用设置页的 DeepSeek 子代理默认和聊天栏的两种 GLM 会话覆盖。Sonnet 的 subagent 调用都没有显式传 provider、model 或 reasoningEffort，路由由插件注入。每组均等待一个前台 standard 子代理真实完成，Sonnet 再回传结果。

| 子代理渠道与模型 | 真实请求路由 | 子代理与 Sonnet 最终回复 | 结果 |
|---|---|---|---|
| OpenCode DeepSeek V4.1 Flash | opencode-go-completions / deepseek-v4.1-flash | SONNET_DS_CHILD_OK | 通过 |
| OpenCode GLM-5.3 Flash | opencode-go / glm-5.3-flash | SONNET_OC_GLM_CHILD_OK | 通过 |
| Droid GLM-5.3 Flash | factory-g / glm-5.3-flash | SONNET_DROID_GLM_CHILD_OK | 通过 |

父会话：`测试会话`。

- OpenCode DeepSeek V4.1 Flash：子会话 32ffce10-0b3a-4be3-bc42-357cef2edf8b；2026/10/6 18:55:21；child request/header seq 13、assistant/message seq 16、turn/end seq 18=completed；主会话第 10 轮，工具结果 seq 215 isError=false，Sonnet 回传 seq 218。上游 responseId：chatcmpl-RwSOX5wMkkry1JqnjH826epU。
- OpenCode GLM-5.3 Flash：子会话 bd0eb870-a589-4b1c-983a-02af586b7b50；2026/10/6 18:56:27；child request/header seq 13、assistant/message seq 16、turn/end seq 18=completed；主会话第 11 轮，工具结果 seq 229 isError=false，Sonnet 回传 seq 232。上游 responseId：chatcmpl-RQyhBrwuHq9gQ81IGwSTnCHE。
- Droid GLM-5.3 Flash：子会话 2fcd8e0d-b18a-4d5b-913f-f67360c0643c；2026/10/6 18:57:14；child request/header seq 13、assistant/message seq 16、turn/end seq 18=completed；主会话第 12 轮，工具结果 seq 243 isError=false，Sonnet 回传 seq 246。上游 responseId：chatcmpl-b444777e。

主代理的委派请求与最终回传消息均有 factory-a / claude-sonnet-5-5 的实际 assistant/message source 和上游 responseId；各子代理都有真实 request/header、流式响应、token 用量与 completed 结束事件。三轮父工具结果均 isError=false，父 turn/end 均 completed。核对的是宿主真实生成记录，而非仅界面标签。

原始证据：同目录 dsh-model-switch-sonnet-matrix-evidence.json。会话日志按全部完整 zstd 帧读取，导出不含凭据和推理文本。

结束状态：已清除测试会话临时子代理覆盖，恢复设置页默认 DeepSeek；专用测试会话主模型保留 Sonnet 5.5，处于空闲。设置页的新会话默认仍为 Factory GLM，子代理默认 DeepSeek、制定计划 STEP、执行计划 DeepSeek 均与测试前一致；其他会话覆盖保持原样。

本次范围：每个组合一个前台子代理，提供方默认推理档位，任务为输出验证串；禁止项目读写、命令及额外委派。并发与长任务不在本次测试范围。

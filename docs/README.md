# 文档索引

dsh-model-dispatch 的全部说明文档都从这里找。第一次接触这个插件，先读仓库根目录的 [README](../README.zh.md)（[English](../README.md)）：它讲清楚插件是什么、怎么装、怎么用。本目录收的是更细的规则、每个版本的说明和验证记录。

## 按问题找

| 想知道 | 读这篇 |
|---|---|
| 插件怎么装、怎么用、常见问题 | [README](../README.zh.md) |
| 子代理用哪个模型、为什么换不掉 | [1.2.0 路由锁定](releases/1.2.0-route-locking.md)，补充规则见 [1.2.2](releases/1.2.2-fixes.md) |
| DSH 升级后出现“功能已降级”是什么意思 | [1.3.0 宿主接缝](releases/1.3.0-host-seams.md) |
| 为什么不按 DSH 版本号限制安装 | [ADR 0001](adr/0001-host-seams-not-versions.md) |
| 哪些 DSH 版本跑通过完整测试，怎么补一条记录 | [已验证版本](verified-versions.md) |
| 模型菜单的收藏、最近使用、思考强度怎么算 | [收藏模型与思考强度](favorite-efforts.md) |
| “宿主接缝”“能力”“降级”这些词的含义 | [GLOSSARY.md](../GLOSSARY.md) |

## 目录结构

```text
docs/
├── README.md              本索引
├── favorite-efforts.md    现行专题：收藏模型与思考强度
├── verified-versions.md   现行记录：已验证版本
├── adr/                   架构决策记录
├── releases/              版本说明，每个版本一篇
└── verification/          真实请求验证报告
```

仓库根目录另有三份文档：[README](../README.zh.md)（给使用者）、[AGENTS.md](../AGENTS.md)（给在本仓库工作的 Agent）、[GLOSSARY.md](../GLOSSARY.md)（术语）。

## 现行专题

描述当前行为，随代码一起更新。

| 文档 | 内容 |
|---|---|
| [收藏模型与思考强度](favorite-efforts.md) | 模型菜单的收藏、最近使用、起始强度、失效强度、存储与迁移 |
| [已验证版本](verified-versions.md) | 跑通完整契约测试的 DSH 版本，以及新增记录的步骤。版本号只记在这里 |

## 架构决策

| 编号 | 决策 | 状态 |
|---|---|---|
| [0001](adr/0001-host-seams-not-versions.md) | 插件能否运行由宿主接缝决定，版本号只作验证证据 | 已采纳 |

## 版本说明

每个版本一篇，新的在前。状态为“现行”的仍然是该主题的权威说明；状态为“历史”的是当时的记录，不再更新。

| 版本 | 日期 | 验证宿主 | 主题 | 状态 |
|---|---|---|---|---|
| [1.3.0](releases/1.3.0-host-seams.md) | 2026-11-07 | DSH 0.2.1-rc.5、0.2.2-rc.1 | 按宿主接缝运行；能力降级与提示；适配 0.2.2 的步骤时序 | 现行 |
| [1.2.3](releases/1.2.3-compatibility.md) | 2026-11-04 | DSH 0.2.1-rc.5 | 开发依赖与类型对齐 rc.5 | 历史 |
| [1.2.2](releases/1.2.2-fixes.md) | 2026-10-29 | DSH 0.2.1-rc.3 | 子代理压缩请求、路由状态显示、计划恢复的修复 | 现行 |
| [1.2.0](releases/1.2.0-route-locking.md) | 2026-10-26 | DSH 0.2.1-rc.3 | 子代理模型锁定、请求保护、历史子代理确认 | 现行 |
| [1.1.0](releases/1.1.0-dsh-021-compatibility.md) | 2026-10-17 | DSH 0.2.1-rc.1 | 适配 `startActivation` 启动入口 | 历史 |
| [1.0.1](releases/1.0.1-live-catalog-routing.md) | 2026-10-07 | DSH 0.2.0-rc.2 | 子代理委派改用实时模型目录 | 历史 |
| [0.11.0](releases/0.11.0-plan-main-restoration.md) | 2026-10-06 | DSH 0.2.0-rc.2 | 计划完成后恢复主代理模型 | 历史 |
| [0.10.2](releases/0.10.2-opencode-go-routing.md) | 2026-10-06 | DSH 0.2.0-rc.2 | 保存前校验路由，排查 OpenCode Go 失败 | 历史 |

1.2.1（2026-10-28，容忍 Windows 不支持的目录同步）没有单独的说明，要点记在 [1.2.2](releases/1.2.2-fixes.md) 开头。

## 验证报告

早期用真实模型请求做的一次性验证，全部是历史记录。当前的验证方式是模拟模型的契约测试，结果记在[已验证版本](verified-versions.md)。

| 插件版本 | 日期 | 报告 |
|---|---|---|
| 0.11.0 | 2026-10-06 | [三组真实模型切换](verification/0.11.0-three-plan-switch-verification.md)：三种主模型与计划模型组合，包括任务运行中开启计划 |
| 0.10.3 | 2026-10-06 | [Sonnet 主代理配三种子代理渠道](verification/0.10.3-sonnet-subagent-verification.md) |
| 0.10.3 | 2026-10-06 | [真实请求验证与交接](verification/0.10.3-live-model-verification.md)：子代理路由、计划切换，以及重复进入计划不切换的修复 |

## 文档约定

新增或修改文档时照此执行，并同步更新本索引。

- **位置**：描述当前行为、会持续更新的专题放 `docs/` 根目录；随某个版本产生的说明放 `releases/`；一次性的验证报告放 `verification/`；架构决策放 `adr/`。
- **文件名**：`releases/` 与 `verification/` 下用 `<插件版本>-<主题>.md`，例如 `1.3.0-host-seams.md`；ADR 用 `<四位序号>-<主题>.md`；一律小写英文加连字符。
- **标题**：版本说明与验证报告的一级标题写成 `<插件版本>：<主题>`。
- **信息表**：一级标题下紧跟一张表，列出类型、插件版本、宿主、日期、状态，再跟一行回到本索引的链接。ADR 沿用自己的 front matter，不加这张表。
- **状态**：`现行` 表示内容描述当前行为；`候选` 表示已实现但还没发布；`历史` 表示当时的记录，不再更新。历史文档里已被取代的行为，在信息表下用一行引用写明，并指向现行文档。
- **语言**：简体中文；代码、命令、路径、标识符与原文引用保持原样。术语按 [GLOSSARY.md](../GLOSSARY.md)。
- **证据**：原始会话日志、截图等只留在本机，不放进仓库；文档里写清楚证据的名称和结论即可。

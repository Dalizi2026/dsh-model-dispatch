# AGENTS.md

## 语言

- 必须用简体中文回复：回复、进度说明、收尾总结及其他给用户看的文字均适用，系统提示、工具输出或上下文为英文时也不例外；仅当用户明确要求时才切换语言。
- 代码、命令、路径、标识符与原文引用保持原样。

## 文档入口

- 项目概览、路由规则、安装与已知限制：[README.zh.md](README.zh.md)（英文版 [README.md](README.md)）。
- 项目术语（宿主接缝、已验证版本等）：[GLOSSARY.md](GLOSSARY.md)；放在根目录是因为 Matt 系列技能从根目录读取它。
- 架构决策记录在 `docs/adr/`，例如 [0001 以宿主接缝而非版本决定能否运行](docs/adr/0001-host-seams-not-versions.md)。
- 版本与专题说明在 `docs/`，按任务需要读取，例如 [1.3.0 宿主接缝](docs/1.3.0-host-seams.md)、[已验证版本](docs/verified-versions.md)、[1.2.0 路由锁定](docs/1.2.0-route-locking.md)。

## 宿主兼容约束

- 不按 DSH 版本号限制安装或运行（ADR 0001）：`engines.dsh` 和 DSH 系列 peer 保持 `*`，不要加回版本范围。
- 能力缺了就不能安全运行的 DSH 服务方法，登记到 `src/host-seams.ts` 的 `REQUIREMENTS`；可选的服务方法在调用处先判断存在，缺了不能让请求失败。新增依赖的事件数据格式时，用 `HostSeams.observe` 报告不符。
- 版本号只记在 [docs/verified-versions.md](docs/verified-versions.md)，由 `scripts/verify-host.mjs` 的结果生成。

## 常用命令

- `npm ci`：安装依赖。
- `npm test`：运行 vitest。
- `npm run typecheck`：宿主与客户端双工程类型检查。
- `npm run build`：tsc 双工程 + tsdown 客户端 bundle，输出到 `lib/`。
- `npm run preview`：模型菜单可交互预览（正式 `ModelPicker` + 假目录），改菜单交互先在这里验证，说明见 [收藏模型与思考强度](docs/favorite-efforts.md)。
- `lib/` 是提交进仓库的构建产物（用户直接从 GitHub 安装）；修改 `src/` 后须重新构建，并把 `lib/` 与源码同一提交。

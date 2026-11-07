# AGENTS.md

## 语言

- 必须用简体中文回复：回复、进度说明、收尾总结及其他给用户看的文字均适用，系统提示、工具输出或上下文为英文时也不例外；仅当用户明确要求时才切换语言。
- 代码、命令、路径、标识符与原文引用保持原样。

## 文档入口

- 项目概览、路由规则、安装与已知限制：[README.zh.md](README.zh.md)（英文版 [README.md](README.md)）。
- 版本适配与专题说明在 `docs/`，按任务需要读取，例如 [1.2.3 兼容说明](docs/1.2.3-compatibility.md)、[1.2.0 路由锁定](docs/1.2.0-route-locking.md)。

## 常用命令

- `npm ci`：安装依赖。
- `npm test`：运行 vitest。
- `npm run typecheck`：宿主与客户端双工程类型检查。
- `npm run build`：tsc 双工程 + tsdown 客户端 bundle，输出到 `lib/`。
- `lib/` 是提交进仓库的构建产物（用户直接从 GitHub 安装）；修改 `src/` 后须重新构建，并把 `lib/` 与源码同一提交。

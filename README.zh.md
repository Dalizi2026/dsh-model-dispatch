# dsh-model-dispatch

[English](README.md) | 中文

为 DeepSeek Harness (DSH) 的主会话、子代理与计划模式分别选择模型与思考强度。

> 本插件参考了 [lincong1987/dsh-model-switch](https://github.com/lincong1987/dsh-model-switch) 的原始设计与代码，在其基础上针对 **DSH 0.2.0-rc.2** 适配并做了大量优化：跟随 0.2.x 的设置系统（volatile Config + configForms）、子代理投影与会话模型接口重写，并新增计划模式自动切换、按会话覆盖、路由校验与新 UI。上游仓库只支持 0.1.x。

## 功能

- **聊天栏双入口**：输入框同时显示 **主模型** 与 **子代理** 两个芯片。主模型使用 DSH 原生切换接口；子代理选择只影响当前会话之后新启动的子代理。
- **统一模型菜单**：所有入口共用同一个菜单——搜索、提供方分组、收藏、最近使用、思考强度。选模型后菜单保持打开，直接调强度，点 **应用** 一次保存；取消、Esc 或点击菜单外丢弃草稿，不写配置。
- **设置页三项**：新会话默认模型、子代理默认模型、制定计划模型。每项一句说明，无重复装饰。
- **计划模式自动切换**：进入计划模式自动切到“制定计划”模型做计划；批准计划或 `/plan off` 后，在第一条执行请求前自动恢复进入计划前的主模型与推理档位。审批面板显示将恢复的模型。
- **按会话子代理覆盖**：聊天栏的子代理选择保存为会话覆盖（持久化），不改设置默认；可一键恢复为设置默认。
- **保存前路由校验**：保存覆盖与创建子代理前，通过宿主 `resolveCallConfig` 校验 provider/model/effort 的真实组合；无效组合直接给出具体错误，不会等子代理运行失败。

## 路由规则

- **子代理**：本会话覆盖 > 设置里的子代理默认 > 原生父模型继承。工具调用里显式指定的启动参数仍然优先。
- **计划**：进入计划前原子保存当前会话的 provider/model/effort → 临时使用“制定计划”模型 → 批准或退出计划后、第一条执行请求组装前恢复。恢复失败可重试，不会卡死在计划模型上。
- **默认与会话独立**：设置页保存的是新会话默认；聊天栏选择、计划自动切换只改当前会话。宿主适配层用 `AsyncLocalStorage` 隔离原生 `selectModel` 的“写部署默认”副作用，只拦这一条调用链，不影响独立的默认设置写入。

## 安装

要求 **DeepSeek Harness 0.2.0-rc.2**（其他 0.2.x 版本需重新验证接口）。

```bash
dsh plugin --profile desktop add github:Dalizi2026/dsh-model-dispatch
```

把 `OWNER` 换成本仓库的实际所有者；`desktop` 换成你实际使用的 profile。安装完成后**完全退出并重新打开 DSH**（宿主半边需要重组合；只刷新页面只会加载新的客户端半边）。

> 仓库内 `lib/` 是已构建的产物，直接从 GitHub 安装即可使用，无需本地构建。

## 持久化

| 数据 | 位置 |
|---|---|
| 设置默认（子代理默认 / 制定计划模型） | DSH profile 配置（volatile 字段，经设置页或 `打开配置文件` 均可改） |
| 新会话主模型默认 | 原生 `agent-default-model` 配置项 |
| 会话子代理覆盖 | `$DSH_HOME/storages/model-switch/session-overrides.json` |
| 计划前主模型暂存 | `$DSH_HOME/storages/model-switch/plan-main-models.json`（恢复成功后清除） |
| 菜单收藏 / 最近使用 | 浏览器 localStorage（不同步设备） |

## 构建与测试

```bash
pnpm install
pnpm test        # vitest
pnpm build       # tsc（双工程）+ tsdown 客户端 bundle
```

测试覆盖：路由合并优先级、会话覆盖存取与并发写入、计划边界的进入/恢复/重启恢复/拒绝回退、会话选模与默认写入隔离、路由校验拒绝无效组合、客户端保存竞态。

## 已知限制

- 与 DSH 0.2.0-rc.2 的内部接口（configForms、sessionProjections、sessionController、planMode）强耦合；DSH 升级需回归测试。
- 对计划边界的识别依赖原生 `exit_plan_mode` 的结果文案；DSH 修改该文案会影响“批准后恢复”的及时性（有 `plan/mode` 事件兜底）。
- 子代理会话内部不参与计划切换与子代理覆盖（按设计）。

## 致谢

- 原始设计与 0.1.x 实现：[lincong1987/dsh-model-switch](https://github.com/lincong1987/dsh-model-switch)（MIT）——本插件在其基础上参考并优化。
- 0.2.x 适配、计划模型切换、会话覆盖、路由校验与全部新 UI 由本仓库重写/扩展。

## License

[MIT](LICENSE)

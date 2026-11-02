# Agent 沙箱、实时行情与宣传页：发布交接

分支：`feat/agent-sandbox`（从 `collab/frontend` 的 `ad86555` 切出）。
当前正式部署：`dpl_Et1z8Sp9pokw8YbaLPw2MMHVub5X`（Ready）；对应精确源码 `7830294d09869f4d0e5a872e07da40295eeab088`，已推送标签 `v2026.10.30.1`。`rollback/pre-agent-sandbox-20261102` 指向后续文档提交 `ad86555`；该基线包含正式版本功能，但不是部署的精确源码提交。
发布流程照 [RELEASE_WORKFLOW.md](RELEASE_WORKFLOW.md)；本文只写这一轮特有的步骤和注意事项。

## 改了什么

| 区域 | 内容 |
|---|---|
| 宣传页 `/` | 原来 `/` 直接跳 `/login`，现在是宣传页：四层结构（叙事噪音 / 实时行情 / Chainlink 预言机网络 / 3D 心脏）。心率由实时 VIX 推算。旧 `/about` 跳到 `/`，组件文件保留。 |
| Agent | 新增 `analyze_drivers`、`draft_strategy` 两个工具；流式协议加了工具事件；系统提示词去掉含虚构数字的示范；`AGENT_LIMITS` 调为 4 轮 8 次工具调用。 |
| 沙箱执行 | `POST /api/sandbox`：实时报价撮合、Chainlink 校验、写 Supabase。迁移未执行时自动退回浏览器本地账本。 |
| 交易所 | 深色终端风格；页签收为「全球市场」「模拟组合」；K 线最后一根随实时报价更新，沙箱成交标在 K 线上；去掉了虚构的 AI 预测线、AI 胜率和署名新闻。 |
| 学习室 | 三节真实数据短课；四个历史复盘（2020、2022、2008、可口可乐 1998）。巴菲特导师保留；¥39 内部价卡片下线；旧漫画练习保留入口。 |
| 登录页 | 左侧房子场景与实时行情带，右侧表单；接口与校验逻辑未改。 |

## 上线前必须做

1. **数据库迁移**：`supabase/migrations/20261102090000_sandbox.sql`。只新增 3 张表、1 个视图、2 个函数，不改已有表。先在 staging 执行并跑 `tests/sandbox.test.ts` 里的同类检查，再执行到生产。
   - 不执行也能上线：`/api/sandbox` 检测到表不存在时返回 `mode: local`，成交记在浏览器本地；但 Supabase 里看不到订单，数据库演示会缺这一块。
2. **环境变量**：无新增必填项。可选 `ARB_RPC_URL`（Chainlink 读取用的 Arbitrum RPC，默认 publicnode）。
3. **静态数据**：`public/data/history/*.json` 是 2026-11-02 的 Yahoo 复权日线快照，约 90 KB。需要更新时运行 `node node_modules/tsx/dist/cli.mjs scripts/build-history-data.ts`。

## 免费额度

| 资源 | 控制方式 |
|---|---|
| 行情 `GET /api/market/quotes` | 固定一个 CDN 缓存键，`s-maxage=5`。有人在看时，每个区域最多每 5 秒触发一次函数，与访客数无关；标签页隐藏时前端停止轮询，失败时退避。 |
| 预言机 `GET /api/market/oracle` | `s-maxage=30`，一次 JSON-RPC batch 读 14 个喂价。 |
| 学习室历史数据 | 静态文件，CDN 缓存 7 天，不触发函数。 |
| 对话 | 沿用 `begin_chat` 配额：每人每分钟 5 次、每天 30 次。一轮策略对话通常 2–4 次模型调用。 |
| 沙箱 | 每人每 24 小时 40 次执行，每次最多 8 笔订单；接口另有每分钟 10 次限流。 |
| 宣传页 3D | three.js 按需加载，首屏 JS 约 129 KB；离开视口或标签页隐藏即停止渲染。 |

## 验证记录（2026-11-02，本地）

- `npm test`：43/43 通过。新增 `tests/sandbox.test.ts`、`tests/replay.test.ts`；迁移在 PGlite 中验证了跨用户隔离、幂等重放、算术与滑点校验、现金与持仓不足拒单、重置保留历史、匿名无权限。
- `tsc --noEmit`、`next lint`、`next build`：通过。
- 真实数据：31 个行情品种、14 个 Chainlink 喂价、两年回测、驱动分析均跑通。
- `npm run eval`：30/30 通过。
- 真实 DeepSeek（deepseek-chat）三个问题都完成：
  - 「10 万美元配策略」：一轮内调用工具并生成策略书。
  - 「什么在推动英伟达」：调用 `analyze_drivers`，引用的数字与工具结果一致，并说明相关不等于因果。
  - 「保守的港股 + 黄金」：生成并回测策略书。
  - 工具失败时，模型如实说明数据不可用，没有编造。
  - 测试中发现模型把现金比例算错，已改为在工具结果里直接返回 `cashWeight`。
- 浏览器：`playwright test --project=desktop` 通过（`.last-run.json` 为 passed）。需要真实账号的 live 用例按设计跳过。用例已改为断言新界面：宣传页、研究画布、两个交易所页签、新短课与复盘。

## 已知限制

- 美股闭市时，按最后报价模拟成交并加 3bp 滑点，执行面板会明确提示。
- Yahoo Finance 与公共 RPC 没有服务等级保证；不可用时，界面显示「行情源暂不可用」，执行接口拒单，不会用旧数字代替。
- 沙箱成交价由服务端计算。用户若直接调用 RPC，也只能在函数的校验范围内影响自己的模拟账户。
- `tests/browser/appearance.spec.ts` 会重写 `docs/collab/visual-restoration/*.png`；跑完测试请确认是否要提交这些截图。

## 回滚

- 应用：按 RELEASE_WORKFLOW 用 `vercel rollback <上一版 deployment id>`；源码重建使用正式标签 `v2026.10.30.1`；`rollback/pre-agent-sandbox-20261102` 保留本分支修改前的完整 Git 基线。
- 数据库：新表不影响旧版应用，回滚时不需要删除；按原则只做向前修复。

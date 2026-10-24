# Next.js 安全修复：v2026.10.24.2

用户授权：先在免费独立 staging 验证真实登录、恢复和页面，再发布至现有正式域名；保留正式用户和回滚部署，全部改动推送 GitHub。

## 修复范围

- Next.js `14.2.35` → **`15.5.28`**，使用精确版本和锁文件；对应 eslint-config-next 同步升级。
- 官方 15.x 分支已有补丁，不需要为了本次漏洞迁移到 16.x。参考 [15.5.28 发布说明](https://github.com/vercel/next.js/releases/tag/v15.5.28)、[SVG 图像处理 RCE](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw)、[Server Actions DoS](https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r)。
- Next 实际解析到 Sharp **0.35.5**。PostCSS 升至 **8.5.31**，通过限定在 Next 下的 override 覆盖其固定旧版本；不是只升级顶层而遗留内部副本。
- 移除 Next 15 已不支持的 swcMinify 配置，继续使用默认压缩。
- 首轮页面回归发现旧 Fiber 8 与 Next 15 App Router 的 React 运行时不兼容，捕获到 `ReactCurrentBatchConfig` 错误并退回备用卡片。修复采用 React 19.3.1、Fiber 9.8.2、Drei 10.7.9；Three.js 只从 0.158 升到兼容要求的 0.159，并更新类型、动画和图标库的 React 19 支持。参考 [Fiber v9 迁移指南](https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide)。真实登录测试追加场景就绪断言，防止“登录成功但小屋消失”被误判为通过。
- 新增 `npm run audit:next` 并接入 GitHub Actions：Next、React、React DOM、@next、Sharp、@img、PostCSS 任一已知漏洞或审计查询失败都会失败。报告同时保留全项目告警总数，避免误称所有依赖均已修复。
- 测试运行器新增 `pages`，显式设置 staging Cookie 项目标识；真实 Auth 验收与 UI 模拟测试分别报告。

## 数据与环境

- 正式 Supabase：`bofqqjgdkubmjdnpalqq`；测试 Supabase：`sscjolfuydqmskqzfppn`，没有创建新付费资源。
- 本次不对正式数据库执行迁移、用户导入或数据写入；A/B/C 仅在原独立 staging 使用。测试聊天只在 staging 正常保存。
- 本轮开始时正式数据已有 7 用户 / 7 资料 / 4 会话 / 8 消息 / 1 学习进度；比前次发布新增的数据同样保留，不能用前次的 6 用户基线覆盖。
- 回滚目标：`dpl_3ugg8Vs23PktDmXuaQA3ZrnG3vZf`，对应源码 tag `v2026.10.24.1`，已确认 Ready。

```powershell
vercel rollback dpl_3ugg8Vs23PktDmXuaQA3ZrnG3vZf --yes --scope 123lkflhdskjfs-projects
```

回滚只切换应用，保留 Supabase 数据。旧版包含本次修复前的依赖漏洞，只能作为紧急可用性恢复目标，随后应尽快修复向前发布。未通过删除旧版来掩盖回滚风险。

## 验证与发布记录

上线前实际通过：

- `npm run audit:next`：Next / React / Sharp / PostCSS 链已知告警 **0**，全项目 critical **0**；[审计 JSON](2026-10-24-next-security-audit.json)。
- 干净安装验证：PostCSS override 在 `npm ci` 后仍解析为 8.5.31；React/3D 兼容修复后清空旧依赖目录重新安装，`npm ls` 确认 React/Three 依赖关系有效。旧 React Spring 依赖已经移除。Framer Motion 与 motion-dom 对齐为 12.43.0，修复内部导出不匹配。
- 隔离 production build、类型检查、lint 通过；单元/本地 PostgreSQL 测试 **27/27**；离线检索/拒答评测 **30/30**，无付费模型调用。
- `node scripts/learning-staging.cjs verify`：真实 Supabase Auth 和 REST 的 A/B/C 登录、数据恢复、余额/权限拒写、幂等检查通过。
- 最终 `pages`：**9/9 通过，44.7 秒**。覆盖真实 3D 小屋渲染、三入口、AI 字符动画和暂停、行情图表、五导航、学习室、双语、访客、PWA 与 WebGL 失败时备用入口；该组使用 UI fixture，不冒充真实账户验收。中文小屋和英文 AI 截图也已人工查看。
- 最终增强 `test`：真实 A/B/C 浏览器验收 **1/1 通过，59.1 秒，0 模拟请求，0 浏览器运行错误**。每次登录后新增 3D 就绪检查；A 刷新/新浏览器重登恢复场景 03、40 份、9,180 及会话；B 完成记录 13,760 和 demo 权益正常；C 仍无历史/权益。跨账号读写 404、未解锁内容 403、伪造字段 400、退出后个人接口 401，跨标签退出清空旧账号状态。
- 正式只读验收脚本也新增小屋就绪检查，发布后将执行。

证据：[真实 Auth/REST](../collab/learning-live-validation/auth-rest-result.json)、[真实浏览器](../collab/learning-live-validation/browser-result.json)、[中文小屋](../collab/visual-restoration/house-zh.png)、[英文 AI](../collab/visual-restoration/agent-en.png)。失败的首轮 3D 检查未发布，也没有删除或降低断言来让测试通过。

最终源码 SHA、部署 ID、生产验收及数据比较将在发布完成后补充。

全项目仍有与本次 Next 依赖链无关的 **18 项**历史告警（11 high、7 moderate），例如 MCP SDK 和部分工具依赖。本次未声称整个依赖树零漏洞；没有关闭审计。真实模型质量与付费调用不在本次验证范围。

# v2026.10.28.1 — 四幕漫画角色模拟

本次仅发布用户确认的黑白卡通可口可乐案例。继续使用现有 Supabase Auth、LearningProvider、状态机、脚本版本及账户金额；没有数据库迁移，没有导入测试账号，也没有修改已有学习记录。

## 页面

- 原公仔展示换为同一原创研究员的四种卡通状态，黑白画面配少量紫色；素材与提示词见 ../collab/comic-simulation/ASSETS.md。
- SVG 教学 K 线逐根回放，包含均线、成交量、建仓参考线。支持暂停、重播、跳至决策点；回放不是实时行情、历史行情或 AI 预测。
- 对白逐句出现，可直接显示全文。选择顺序按文档统一为 A 分支结束 / B 继续研究；继续使用原 action ID 和服务端校验。
- 保留真实账户结果、场景进度、研究员手记、理由、错误重试和历史尝试。场景 3 总值为 9,180，终局为 13,760；不复用原稿不一致的 10,000 总值。
- 完成复盘后弹窗确认；弹窗外仍保留已保存内容。系统或应用减少动画偏好下直接显示最终帧和完整对白。

## 验证

类型与 lint、隔离生产构建、27 项单元/数据库测试通过。

9/9 页面回归通过。最终布局调整后单独重跑漫画验收 1/1 通过（15.9 秒测试用时），包含逐根动画/暂停/重播、三条失败分支、完整通关、复盘弹窗、幂等重试、刷新恢复、双语、减少动画偏好及画面不裁切的检查。UI 测试使用 PGlite 与浏览器 fixture；独立 staging 的真实 A/B/C 浏览器验收 1/1 通过，0 模拟请求、0 浏览器错误，登录、刷新、新浏览器重登、账号隔离和学习数据恢复均正常。

## 发布与回滚

沿用免费 Vercel/Supabase 项目。候选部署先使用 --prod --skip-domain，检查后才 promote 到 https://omniaihello.com。

上线前旧正式部署 dpl_6CzYjeEB4mjVh6ma5EWUKNzbVZy5 已确认 Ready，源码 tag v2026.10.24.2。应急回滚：

```powershell
vercel rollback dpl_6CzYjeEB4mjVh6ma5EWUKNzbVZy5 --yes --scope 123lkflhdskjfs-projects
```

本次不改变数据库结构，应用回滚不会重置用户数据。旧版本没有未发布的 AI 额度保护；上一轮额度/依赖改动留在原工作区，本次从已上线源码隔离构建。

既有依赖的历史告警仍需在独立安全发布中处理；这次没有声称全项目无漏洞。没有付费模型调用，没有新增付费服务。发布版本 SHA、部署 ID、数据摘要比较与线上只读验收将在验证完成后补充。

## 已完成发布

- 2026-10-28 20:08（Asia/Taipei）完成发布及线上验收，域名 https://omniaihello.com。
- 发布源码 `e9ebd4d15cd6c30c840e6c34ad1413aa9fe363d7`，版本标签 `v2026.10.28.1`。
- Vercel `dpl_4q1NzjRSEY5pprB9AUT6Uti3azsy` / https://infent-agent-e0j7odhw2-123lkflhdskjfs-projects.vercel.app。已核对 Ready、releaseCommit 和 releaseVersion，再 promote。
- GitHub Actions regression 全部通过：[运行 40684805933](https://github.com/ninglinLiu/infent-agent/actions/runs/40684805933)。Linux 干净安装、Next 依赖链审计、typecheck、lint、27 项测试、30 项离线评测和生产构建成功；付费模型任务按条件跳过。
- 线上真实只读检查：登录/注册入口、访客、真实 3D 房子、生产数据库指向、5 个个人接口未登录 401、测试文件 URL 404、www 308，0 浏览器错误。
- 额外生产 UI 探针仅在 Playwright 内模拟 Auth 与学习数据，用来验证已部署的漫画客户端和动画，不冒充真实生产用户登录。素材 SHA256 与本地相同，K 线可播放、到达决策点，0 浏览器错误。真实 Auth/账号隔离已由独立 staging 验证。
- 正式数据发布前后 9 组数量及摘要完全一致：8 用户、8 资料、5 会话、14 消息、2 学习进度、1 次尝试、2 条选择；无迁移、无生产数据写入。[比较结果](../collab/comic-simulation/data-check.json)。
- 漫画素材 270 KB，SVG 图表、对白、按钮及账户数字为应用元素。没有将整张效果图当作网页。
- [真实 staging 验收](../collab/comic-simulation/real-auth-result.json)、[生产 UI 探针](../collab/comic-simulation/production-smoke.json)、[中文实装截图](../collab/comic-simulation/scene-03-zh.png)、[英文完成状态](../collab/comic-simulation/completed-en.png)。
- 旧部署 `dpl_6CzYjeEB4mjVh6ma5EWUKNzbVZy5` 保留 Ready，旧标签不移动；本轮没有切换正式流量做回滚演练。

测试更新保留原有业务断言，将已删除的公仔打招呼断言换为漫画人物/动态 K 线断言，并补充房子真正就绪后才操作的等待，未削弱登录和数据检查。代码沿用 collab/frontend 和 PR #2，不合并 main。

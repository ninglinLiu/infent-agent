# 免费隔离环境与三账号真实验收

2026-10-24 已完成。本次使用真实 Supabase Auth、PostgreSQL、PostgREST、Next.js API 和浏览器 Cookie；没有拦截或模拟认证/数据接口。生产项目、Vercel 发布和生产数据均未修改。

## 环境

| 项目 | 配置 |
| --- | --- |
| 名称 | `infent-agent-staging` |
| 测试项目 ID | `sscjolfuydqmskqzfppn` |
| 组织 | 用户已指定的 `2046999639@qq.com's Org` |
| 套餐/创建报价 | Free，$0/月；未升级、未创建收费分支 |
| 区域 | Singapore / `ap-southeast-1` |
| 管理入口 | [测试项目后台](https://supabase.com/dashboard/project/sscjolfuydqmskqzfppn) |
| 网页 | 本机 [http://localhost:3107/login](http://localhost:3107/login)，连接上述云端测试库；未做公开网页部署 |
| 生产隔离 | 生产项目 `bofqqjgdkubmjdnpalqq` 不参与这些读写测试；测试运行器锁定测试项目 ID |
| 登录 | 邮箱＋密码，关闭测试项目 Confirm email，未发送确认邮件 |
| 构建 | `.next-staging`，与通常的 `.next` 分开 |

Supabase 后台把独立项目默认分支标记为 `main / PRODUCTION`，这是该测试项目自己的默认分支标签，不是把现有生产站点切换到了测试库。免费报价对应当前 Free 配额；本轮没有任何套餐升级或付款操作。

三份迁移已实际应用到测试库：accounts、function_permissions、learning_attempts。基础案例正文与 v1 规则保持既有代码。只在该测试库开启 `learning_private.environment.allow_demo`，通过管理者函数给 B 授予 demo 权益，没有伪造付款记录。

## 实际验证结果

| 账号 | 真实状态与结果 |
| --- | --- |
| A / Demo A | 正常 signUp、密码登录、退出后新客户端重登通过。网页刷新及关闭浏览器会话后重登，仍为场景 03：现金 6,000、40 份、总资产 9,180、浮亏 820；研究/建仓选择与三条手记恢复。自己的历史会话自动恢复。 |
| B / Demo B | 正常注册、登录和重新登录通过；基础案例 completed，复盘及完成时间存在，总资产 13,760。能读取内部测试课程；权益来源为 demo。无 A 的会话。 |
| C / Demo C | 正常注册、登录和重新登录通过；学习进度表无记录，尝试/对话/权益均为 0，界面历史为空。 |

具体拒绝结果：

- B/C 从网页 API 请求 A 的尝试和会话：**404**。
- C 对 A 尝试提交卖出操作：**404**；伪造所有者或余额字段：**400**。
- A/C 请求内部受限课程正文：**403**；B 请求成功。
- 从真实 PostgREST 直接修改余额或授予权益：**42501 permission denied**。
- 学员请求 `learning_private.mentor_summary`：**PGRST106**，私有 schema 未暴露到 REST。
- 原买入 operation ID 通过真实 RPC 重放，只返回原结果，仍为 40 份/总资产 9,180；换新 ID 重复提交旧 revision 则被拒绝。
- 另一标签页退出 A 时，仍停留在旧标签页的个人聊天组件被移除，登录入口重新显示；随后登录 B 不出现 A 的数据。
- 退出后 `/api/learning` 和 `/api/conversations` 返回 **401**。
- 普通页面访问前后 `lastSignInAt` 一致，没有伪造登录时间。

实际执行：

1. `node scripts/learning-staging.cjs prepare`：创建正常 Auth 账号，走真实 RPC 准备 A/B 状态。
2. 管理者 SQL 授予 B 测试权益。
3. `node scripts/learning-staging.cjs verify`：A/B/C 全部通过，包括重登恢复、RLS、权益、余额拒写、私有视图和真实幂等请求。
4. `node scripts/learning-staging.cjs build`：独立 staging 生产模式构建通过。
5. `node scripts/learning-staging.cjs start`：本地测试服务启动。
6. `node scripts/learning-staging.cjs test`：真实浏览器综合验收 **1/1 通过，48.4 秒，浏览器运行错误 0，模拟请求 0**。首次退出断言把“组件已卸载”误当成失败，已改成检查组件数量为 0 和登录入口出现，保留了原缓存清理验证目的。
7. 新增脚本与配置完成后，`npm run typecheck`、`npm run lint` 和 `git diff --check` 均通过；Lint 无警告或错误。

证据：[Auth/REST 结果](learning-live-validation/auth-rest-result.json)、[浏览器结果](learning-live-validation/browser-result.json)。截图：[A 场景 03](learning-live-validation/A-scene-03.png)、[B 完成页](learning-live-validation/B-completed.png)、[C 空历史](learning-live-validation/C-empty.png)。

测试后台的 Free 标记、独立项目名与已关闭的邮件确认设置：[配置截图](learning-live-validation/staging-auth.png)。

导师私有汇总通过管理者 SQL 实际查询：A 有 3 个会话、1 次尝试/0 次完成；B 有 1 次尝试/1 次完成和 demo 权益；C 全为 0。A 的会话包括一条明确标记的准备记录及两轮真实 API 拒答记录，后续重跑会增加会话数量。未展示私人聊天全文。

## 后续如何打开和复验

在仓库根目录运行：

```powershell
node scripts/learning-staging.cjs start
```

然后打开本机 `http://localhost:3107/login`。测试账号及随机密码保存在仅本机使用、已 gitignore 的 `.learning-live-accounts.json`，按 A/B/C 取对应账号正常登录，不要把该文件提交或分享。测试公共配置保存在 `.env.staging.public.local`；不需要 service-role key。

服务运行时另开终端：

```powershell
node scripts/learning-staging.cjs verify
node scripts/learning-staging.cjs test
```

源码改动后先运行 `node scripts/learning-staging.cjs build` 再启动。运行器显式覆盖测试数据库配置，清空模型密钥变量并拒绝其他项目，默认生产命令不启用 `INFENT_STAGING`。本次保留原生产环境文件，没有改写 Vercel 环境变量。

测试会正常退出账号，因此不要在自己正在操作这三个测试账号时同时重跑验证。若手动推进 A 或重置 B，准备脚本会发现状态不匹配而失败，不会删除旧历史来“修复”测试。需要初始样本时应另建测试账号。

## 已审查的限制

- 本轮没有调用付费模型。真实聊天保存使用应用已有的确定性范围拒答验证；不声称验证了真实模型生成质量。
- 真实 Auth 的 `email_confirmed_at` 会在自动确认模式下存在；这里的标记不代表验证了邮箱实际所有权，也未发送测试邮件。
- Supabase 安全检查有 1 条现有 `public.begin_chat` SECURITY DEFINER 可由 authenticated 执行的警告。该函数用于原子创建所属用户会话并执行配额，内部检查 `auth.uid()` 和会话所有权，anon 无执行权限；本次真实越权测试通过。该警告已审查为刻意开放的已验证接口，未声称告警为零。[官方说明](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
- 性能检查提示 3 条复合外键索引建议和新索引尚未使用；当前仅三个测试账号，不做无关索引变更。[索引建议说明](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys)
- 构建提示浏览器兼容数据版本较旧；原功能未因此跳过检查。行情网络偶有失败，本轮不把行情可用性纳入账号验收结果。
- 未发布生产，未提交或推送仓库中混合的既有改动。

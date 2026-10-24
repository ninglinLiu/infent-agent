# 账号学习持久化交付（2026-10-24）

**后续状态更新：** 用户授权创建免费隔离环境后，已建立 `infent-agent-staging`，完成真实 A/B/C Auth、REST 和浏览器验收。详见 [真实测试环境验收](STAGING_VALIDATION.md)。下文保留首次交付时的检查记录，其中“待验证”不再代表最新状态。

本轮为现有项目的增量开发，未发布、未向生产数据库执行迁移或写入演示账号。当前连接的 Supabase 项目 `bofqqjgdkubmjdnpalqq` 是线上项目；本机 Docker daemon 未运行，也没有已确认的隔离测试项目。以下严格区分本地 PostgreSQL 验证、浏览器夹具验证和待执行的真实 Auth 联调。

## 现有实现与复用

- Next.js 14.2.35 / React 18 / TypeScript；保留原目录、路由、五栏导航、街角、学习屋和 3D 导师。
- 沿用 Supabase Auth 的注册、密码登录、退出、会话 Cookie；服务端 `accountAuth.require` 使用 `getUser()` 确认身份。浏览器不提交记录所有者，数据库 RLS 再检查归属。
- 沿用 PostgreSQL、`supabase/migrations`、`profiles`、`conversations`、`messages`、`learning_progress`、`watchlist_items`、`usage_events`，以及已有 `begin_chat`、学习进度 RPC。不替换 Agent 工具、流协议、检索或 MCP。
- 原学习进度主要是单份 step 状态，缺少可追溯尝试、课程版本和权益。原订单、真实支付集成不存在；本轮不新增假订单。
- 原会话已关联用户。本轮增加更新时间排序、最近会话自动恢复；账户身份变化时重建整个个人状态子树，清掉对话、学习进度和权益缓存。
- 认证注册时间和最近登录时间直接取 Auth 用户字段；普通页面访问不写入登录时间。

## 本轮功能与主要文件

| 文件 | 用途 |
| --- | --- |
| `supabase/migrations/20261024121053_learning_attempts.sql` | 版本化课程、尝试、选择、权益、RLS、事务状态机、幂等日志、只读导师视图、会话更新时间 |
| `content/courses/coca-cola-v1.json` | 中英文四场景稿；与迁移中的种子内容有一致性测试，不直接打包进客户端 |
| `lib/account/learning.ts` | 严格操作输入 schema、状态类型、金额格式 |
| `lib/account/learning-context.ts`、`app/api/chat/route.ts` | 从当前用户数据库记录补充 Agent 学习上下文；空记录不生成回忆 |
| `app/api/learning/route.ts` | 登录校验后的课程、尝试、选择记录读取与动作 RPC；受限内容无权益时拒绝 |
| `components/academy/LearningProvider.tsx`、`app/providers.tsx` | 个人状态加载、恢复、重试；网络失败保留同一个操作 ID |
| `components/academy/SimulationView.tsx`、`app/academy.css` | 在原舞台、对话、账户、按钮、手记容器内接入四场景、历史尝试、复盘与反馈 |
| `components/dash/views/WorkspaceView.tsx`、`LeftRail.tsx`、`TopBar.tsx`、`views/SettingsView.tsx` | 原卡片上的学习状态、免费/解锁/筹备标记及个人进度 |
| `components/account/AccountProvider.tsx`、`AccountAccess.tsx`、`AccountPanel.tsx` | 切换身份清空缓存、账号昵称、真实认证时间、折叠课程权益入口 |
| `app/api/profile/route.ts`、`app/api/progress/route.ts` | 昵称与旧学习资料兼容，同步 profiles 中的名字 |
| `app/api/conversations/route.ts`、`components/dash/AgentChat.tsx` | 恢复自己的最近会话，按更新时间排列 |
| `lib/academy.ts`、`lib/academy-content.ts`、`components/academy/LearningView.tsx` | 原短课与引导中的案例名称、40% 建仓规则保持一致；保留旧进度格式 |
| `tests/learning.test.ts`、`tests/browser/learning.spec.ts` | PostgreSQL 权限/分支/幂等验证与原界面完整流程回归 |
| `scripts/prepare-learning-demo.ts` | 独立测试环境 A/B/C 正常注册、密码登录、准备、退出重登和隔离验证流程 |

仓库开始时已存在前几轮大量未提交改动。本轮没有重置、批量暂存、提交或推送这些混合内容。可直接审阅上述文件；不应把当前全部 git diff 都当成本轮变更。

## 数据和状态规则

- 课程与尝试通过 `(course_id, script_version)` 关联。已发布正文禁止 update/delete；新稿使用新版本。`v1` 动作规则在数据库函数中固定，未来规则升级必须显式按版本分派，保留旧版本行为。
- 金额以整数分保存。`total_cents`、`unrealized_cents` 是数据库生成列。UI、Agent 和导师视图使用同一记录，不各算一套。
- 用户只能 SELECT 自己的尝试、选择、权益。余额、跳关、权益来源等不接受前端写入。
- `learning_act` 在单个事务内使用每用户锁、期望 revision 和操作 UUID。相同 UUID/载荷返回原结果；不同载荷复用 UUID 拒绝。买入、卖出和复盘不能跨场景重复执行。
- 重置创建关联旧尝试的新记录。相同父尝试重复重置只得到同一个子尝试；旧完成状态与复盘保留，正在进行的旧尝试标为 abandoned。
- 场景 01 研究 → 02；只看季度观望 → stopped，无交易。场景 02 买 80 → stopped，无交易；买 40 → 现金 6,000、份额 40，并进入 79.50 报价的场景 03，总资产 9,180、浮亏 820。
- 场景 03 持有 → 场景 04，价格 194、总资产 13,760、浮盈 3,760、已实现盈亏 0。卖出 → 现金 9,180、份额 0、浮盈亏 0、已实现亏损 820、stopped。
- 第四场景提交非空复盘才 completed 并保存完成时间。上述金额均为教学模拟；无手续费、税费、分红、利息、年化或真实交易。
- `demo` 与 `payment` 权益分开。进阶案例筹备中；¥39 仅内部测试价，没有购买或假成功按钮。付款权益本轮没有任何客户端授予路径；未来必须接入服务端验证后的真实支付。
- `learning_private` 不加入 PostgREST exposed schemas。导师视图仅数据库管理者查询，普通 authenticated/anon 无 SELECT 权限；没有公开汇总接口。
- 查询尝试列表目前最多返回最近 100 次；明确 attempt ID 仍可访问自己的旧记录。若长期使用需要浏览全部历史，再补分页。

## 隔离测试环境迁移与三账号准备

### 1. 准备独立环境

仅对已确认的本地或 staging Supabase 运行。不要复用线上连接、生产环境文件或生产 project ref。先取得该环境的 URL、publishable key 和数据库连接，由环境负责人在本地安全配置，不发到聊天/截图/日志。

本仓库尚无 `supabase/config.toml`。本地方式先启动 Docker，再在隔离工作目录执行 `supabase init`，复制本仓库 `supabase/migrations/`，执行 `supabase start` 和 `supabase migration up --local`。新 staging 方式可先 `supabase db push --db-url "$env:LEARNING_TEST_DB_URL" --dry-run` 检查，再去掉 `--dry-run` 执行。连接变量只能指向隔离测试库。

按时间顺序应用：

1. `202610230001_accounts.sql`
2. `202610230002_function_permissions.sql`
3. `20261024121053_learning_attempts.sql`

已有前两份迁移的环境只补第三份，不重新手动执行旧迁移。迁移缺失时学习 API 明确返回不可用，不会切回 localStorage 假装保存。Agent 会保留现有能力，并明确没有可用的学习上下文。

### 2. 正常创建 A/B/C

在项目目录，通过环境变量提供：

```powershell
$env:LEARNING_TEST_URL = 'https://<isolated-test-project>.supabase.co'
$env:LEARNING_TEST_PUBLISHABLE_KEY = '<test publishable key>'
$env:LEARNING_TEST_CONFIRM = 'isolated-test-database'
$env:LEARNING_TEST_ALLOWED_HOST = '<isolated-test-project>.supabase.co'
# 可选：可收信的测试邮箱域。默认 example.test 仅适合无需邮件确认的本地 Auth。
$env:LEARNING_TEST_EMAIL_DOMAIN = '<test email domain>'
npx tsx scripts/prepare-learning-demo.ts
```

脚本硬性拒绝已知生产项目；外部主机还需显式 allowlist。通过 `signUp` 和 `signInWithPassword` 创建正常 Auth 用户，不插入假认证用户。若测试环境要求确认邮件，按其正常流程完成确认后重跑；脚本不会绕过验证。

账号凭据写入本机已 gitignore 的 `.learning-live-accounts.json`，不打印密码或 token，不上传该文件。它用于之后在隔离站点手动登录；不用生产应用连接这些账号。该文件由本机账号保护，Windows 上 `mode: 0600` 不能代替 NTFS ACL。

- A：一个真实持久化会话，基础案例场景 03。准备消息明确标记没有调用模型；助手消息状态为 failed，不能作为真实模型答复演示。
- B：基础案例完成并保存复盘。
- C：有注册昵称，无学习进度、案例尝试、会话或权益；第一次进入时保留原新手引导。A/B 仅完成进入案例所需的引导，不伪造知识短课的完成记录。

脚本可重跑；若手动改变了预定演示状态，验证会失败，不悄悄覆盖历史。

### 3. 只在测试库受控授权 B

在已确认的测试库 SQL Editor，以数据库管理者身份运行，替换为脚本输出的 B 用户 UUID：

```sql
update learning_private.environment set allow_demo = true where singleton;
select learning_private.grant_demo('<B user UUID>'::uuid);
```

然后执行：

```powershell
npx tsx scripts/prepare-learning-demo.ts --verify
```

这会正常退出/重登，检查 A/B/C 状态恢复、跨账号记录隔离、拒绝用户自行授予权益，以及只有 B 能读内部测试正文。内部关卡是标明用途的基础剧本副本，仅测试环境开放，不代表进阶成品。不要在生产开启 `allow_demo`。

### 4. 导师后台只读查询

在同一个测试库 SQL Editor 中执行：

```sql
select * from learning_private.mentor_summary
order by registered_at;

select * from learning_private.choice_timeline
where user_id = '<A user UUID>'::uuid
order by created_at;
```

汇总提供真实认证时间、脱敏邮箱、会话数量、尝试与完成数量、最近场景和选择、复盘标记、模拟账户及权益来源；不返回私人聊天正文。

## 向导师演示的顺序

1. 将本地应用的 Supabase 公共配置指向隔离测试库，重新 build/start；不使用生产配置跑测试账号。正常登录 A，展示昵称、自己的历史会话及学习室“继续学习”。进入场景 03，核对现金 6,000、40 份、总资产 9,180、三条手记。刷新、退出重登，再核对。
2. 退出 A，登录 B，观察切换过程中不闪出 A 的状态；基础案例显示完成，复盘可读、总资产 13,760，进阶卡片标“演示权益”。进入内部解锁测试，说明正式进阶内容尚在筹备。
3. 退出 B，登录 C。展示空会话、无案例尝试、开始学习和需要解锁。直接请求 A 的 attempt ID 应 404；受限课程正文应 403，数据库直接读取被 RLS 过滤。
4. 后台展示 `mentor_summary` 的三种状态和 A 的选择时间线。学员身份不能读该视图或修改权益。
5. 在 A 的当前尝试演示卖出，总资产/现金 9,180、份额 0、已实现亏损 820；重置得到新尝试，旧记录仍在历史下拉中。新尝试走持有分支并提交复盘；重复点击/网络重试不能重复生效。
6. 演示会改变 A/C 的状态。需要恢复最初三账号状态时，在新的隔离测试库重新准备，或使用新的正常测试账号；不要删改已完成历史冒充未操作。

## 素材检查

- 项目没有现成的视频/音频媒体容器或案例 mp4/mp3/srt；沿用 `ImmersiveScene` / `AcademyScene` / `MentorScene` / `StudyWorld` 的 3D 与文字，不重排页面。
- 找到已安装 `C:/Users/20469/.codex/skills/script-to-video/SKILL.md`，实际工程位于 `C:/Users/20469/OneDrive/Desktop/Claudebao/video-week1`。遵守视频长期问题记忆与该工程 AGENTS；没有把工程可运行等同于作品已达标。
- 实际看到 `decision-frequency-20261023/工程/render.ps1`、`anchor-chapter-20261024/voice.py`、其 `assets/voice.mp3` / `voice-track.wav` / `source/script.json`，以及 `content-lab-20261021/out/{spatial,pixel,editorial}.srt` 和配音素材。可供后续制作参考的是真实存在的脚本、字幕与配音流程。
- 没有发现可直接对应林澈/可口可乐四场景的已审定开场片、导师配音或双语成片，因此本轮未复制、上传或播放这些无关/私人素材，也未生成新视频。案例专用脚本配音、授权、字幕对齐和最终审看仍是素材缺口。

## 实际验证与限制

| 检查 | 实际结果及证据边界 |
| --- | --- |
| `npm run typecheck` | 通过 |
| `npm run lint` | 通过，无 ESLint 警告或错误 |
| `npm run build` | 通过，含 `/api/learning`；提示浏览器兼容数据较旧，本轮未升级无关依赖 |
| `npm test` | 27/27 通过。包括 PGlite PostgreSQL 引擎执行全部迁移、跨用户读取/写入拒绝、受限正文和导师视图权限、幂等买卖/完成/重置、空白复盘拒绝、旧完成尝试保留 |
| `npm run eval` | 离线检索与拒答路由 30/30；没有调用模型 |
| 桌面 Playwright | `app.spec.ts`、`entry.spec.ts`、`appearance.spec.ts`、`immersive.spec.ts`、`learning.spec.ts` 共 9 项均已通过；最后变更后重跑 app + learning 5/5。最初两项测试定位问题已修正：旧导师问候预期和 Next.js 自带 alert 的选择器冲突，未删除断言 |
| 学习 UI 故障恢复 | 数据库提交买入后故意丢失 HTTP 响应，重试沿用同一个 UUID；只扣一次，刷新恢复场景 03。核对三条手记、选择记录、最终复盘、卖出分支和旧尝试 |
| 桌面视觉 | 已查看 [中文场景 03](learning-validation/scene-03-zh.png) 与 [英文完成页](learning-validation/completed-en.png)，原导航、双栏舞台/对话、3D、账户与手记容器保留；截图使用明确的测试账号夹具 |
| `git diff --check` | 通过；构建生成的知识索引时间戳已恢复，不纳入业务改动 |
| 真实注册、密码登录、退出重登 A/B/C | **待验证**：本轮未运行 `prepare-learning-demo.ts` / `--verify`，未在任何远程库创建演示账号 |
| 真实 Auth Cookie + PostgREST + 学习 API | **待验证**：仅有生产连接，尚无隔离测试环境，本机 Docker daemon 未启动 |
| 真实账号切换与 Agent 历史恢复 | **待验证**端到端；已有服务端归属校验、数据库隔离测试与客户端身份重置代码，不能把 UI 夹具当作真实登录证明 |
| 真实模型的学习上下文回答 | **未运行**；格式与空记录行为已单测，不宣称真实模型回答验收通过 |
| 外部实时行情 | **未验证**；本地浏览器回归期间行情网络请求受到环境限制，未把失败结果当作实时行情成功 |
| 支付、案例专用视频 | 未接入真实支付；未制作/发布新视频，文字加现有 3D 流程完整 |

本地 PostgreSQL 测试中的 `auth.users` 和 `auth.uid()` 是明确的数据库测试夹具；浏览器认证和 API 传输也是拦截夹具。测试实际执行数据库规则，但不替代真实 Supabase Auth + PostgREST 三账号联调。未调用付费模型、未做真实支付、未运行生产批量测试，未部署线上。

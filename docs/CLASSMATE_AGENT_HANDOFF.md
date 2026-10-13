# omniAI 前端协作交接方案

给接手同学的 Agent：你负责本仓库的前端体验迭代。完成后把代码推到独立协作分支，通过 PR 通知项目负责人审核；主分支、Agent 核心与生产部署由负责人掌握。

| 项目 | 约定 |
|---|---|
| 仓库 | https://github.com/ninglinLiu/infent-agent |
| 协作分支 | `collab/frontend` |
| 合并目标 | `main`，只由负责人合并 |
| 负责人 | `@ninglinLiu` |
| 当前正式演示 | https://infent-agent.vercel.app/dashboard |
| 在线 Agent | https://infent-agent.vercel.app/#live-agent |
| 交接起点 | `032789c`：已上线前端与面向 Agent / RAG 的 README；开工仍需检查最新主分支 |
| 本分支初始交付 | `AGENTS.md` 与本说明；没有修改主分支、业务代码、密钥或部署设置 |

## 1. 先确认任务，再改前端

阅读根目录 `AGENTS.md`、本说明和当前代码。说明你准备改哪个界面、哪些文件、如何验证，然后实施同学本次提出的任务。这里规定工作范围，不授权你自行设计一套全新产品。

保留这些已经确认的行为：

- 品牌是 **omniAI**，仓库名是 `infent-agent`。README 以研究 Agent、RAG、工具调用、MCP 与评测为主；前端是演示载体。
- `/dashboard` 首屏只有桌面 3D 雨夜街角，支持拖动旋转和滚轮缩放；保留屋顶圣诞树。
- **omniAI** → 研究工作台；**学習室 / READ & THINK** → 学习室；**CASE FILES** → 案例练习；**LESSONS** → 课程；**GitHub** → 作者主页；**ABOUT** → 原宣传页。
- 工作台、学习室、课程、引导页及宣传页能通过明显的「返回街角 / Back to street」回到房子，不依赖浏览器后退。
- 保留中文 / English 切换；切换、退出与重进不能清空学习进度或个人昵称。
- 不恢复已删掉的背景楼群、路面日语和多余日语招牌。功能招牌以英文为主，原学习室招牌保留。
- 不新增手机端、晴天版或新部署站点；现有宣传页内容与入口继续保留。

## 2. 哪些可以改，哪些必须保护

### 默认允许的前端范围

仅为完成具体前端任务修改下列文件；不要进行无关清理。受保护清单优先，允许改外观不等于允许改数据或协议。

| 范围 | 允许内容 |
|---|---|
| `components/academy/NightWorld.tsx`、`NightDistrict.tsx`、`night-parts.tsx`、`night-textures.ts` | 场景几何、灯光、材质、动画、实体交互的视觉反馈 |
| `components/academy/NightStudy.tsx`、`night-navigation.ts`、`BackToStreet.tsx` | 入口与返回的前端体验；保持目的地、既有功能和键盘操作兼容 |
| `components/academy/AcademyConsole.tsx`、`AcademyGate.tsx`、`LearningView.tsx`、`SimulationView.tsx`、`ExperienceMotion.tsx`、`ImmersiveScene.tsx`、`MentorScene.tsx`、`StudyWorld.tsx`、`LanguageSwitch.tsx` | 学习界面呈现；保留 Provider 调用、进度更新规则与原教学内容 |
| `components/dash/TopBar.tsx`、`LeftRail.tsx`；`components/dash/repository/TopBar.tsx`、`LeftRail.tsx` | 导航与样式；保留 Agent 入口和返回行为 |
| `components/showcase/**`，**不含 `LiveAgentSection.tsx`** | 宣传页外观与导航；不修改技术能力、业务指标或项目归属等事实性文案 |
| `app/night-study.css`、`app/academy.css`、`app/immersive.css` | 相应界面的样式；避免全局选择器影响工作台或聊天 |
| `public/collab/` | 新增有明确使用权的图片、模型、纹理；记录来源，避免不必要的大文件 |
| `tests/browser/`、`docs/collab/` | 与本次改动对应的前端回归及验收记录；不得削弱现有断言 |

### 默认禁止修改的范围

| 受保护对象 | 路径或内容 |
|---|---|
| 仓库对外介绍 | `README.md`、仓库 About / Website / Topics、项目归属和技术栈声明 |
| Agent / RAG / MCP | `lib/ai/**`、`app/api/**`、`content/knowledge/**`、`eval/**`、`scripts/**` |
| Agent 的前端协议与证据展示 | `components/agent/**`、`components/dash/AgentChat.tsx`、`components/dash/views/AgentView.tsx`、`components/showcase/LiveAgentSection.tsx` |
| 共享状态与接口 | `lib/dash-store.tsx`、`lib/market/**`、`lib/mock/**`、`lib/academy.ts`、`lib/academy-content.ts`、`lib/i18n.tsx`、`lib/brand.ts`、`components/academy/AcademyProvider.tsx`、`components/academy/useAcademyLocale.ts`、各 `view-context.tsx` |
| 应用装配 | `app/layout.tsx`、`app/providers.tsx`、`app/page.tsx`、`app/dashboard/page.tsx`、`components/dash/AppShell.tsx`、`components/dash/repository/RepositoryConsole.tsx`、`app/globals.css` |
| 依赖与部署 | `package.json`、`package-lock.json`、`next.config.js`、`tsconfig.json`、Tailwind / PostCSS / ESLint / Playwright 配置、`vercel.json`、`.github/**`、`.gitignore`、manifest、Service Worker |
| 核心测试与协作规则 | `tests/agent.test.ts`、`tests/route.test.ts`、`tests/mcp.test.ts`、`tests/academy.test.ts`、`AGENTS.md`、本交接说明 |

未列入允许范围的文件默认不改。例如需要增加共享中英文词条或更改路由时，先向负责人说明具体路径和最小修改方案，获得明确授权后再处理。不要为引入一个视觉组件而升级依赖、重写 Provider 或替换聊天实现。

`AGENTS.md` 与本说明是负责人预先放入协作分支的交接文件，可以随 PR 保留；同学不要修改它们，也不要把这两份初始文档当作自己新增的业务改动。

当前 Agent 编排采用原生 TypeScript。不要把 LangChain / LangGraph 写成已使用依赖，也不要在本次前端任务中擅自引入它们。

## 3. 分支与本地启动

新电脑使用独立 clone，不复制负责人的工作目录、`.env.local`、`.vercel` 或登录凭据。

```bash
git clone --branch collab/frontend https://github.com/ninglinLiu/infent-agent.git
cd infent-agent
git remote -v
git branch --show-current
git status --short
npm ci
npm run dev
```

需要 Node.js 22。打开 `http://localhost:3000/dashboard`。先确认当前分支为 `collab/frontend`，不是 `main`；已有本地修改必须先识别归属，不能 reset 或覆盖。

开始新一轮工作时，工作区干净后再同步：

```bash
git fetch origin
git switch collab/frontend
git pull --ff-only origin collab/frontend
git merge origin/main
```

这里是把负责人已发布的 `main` 更新带入协作分支，不是把协作分支合入 `main`。共享分支不用 rebase / force push 改写同学的历史。受保护文件出现冲突时停止处理该冲突，向负责人报告，不选 `ours` / `theirs` 整批覆盖。

## 4. DeepSeek 与其他凭据

前端迭代默认**不需要任何模型密钥**。项目无密钥时仍可运行场景、导航、学习界面、离线评测与测试；Agent 明确显示配置缺失，这是正常状态。

- 可以阅读 `.env.example` 的变量名；不向负责人索取真实 DeepSeek / OpenAI / embedding key，不读取其 `.env.local`、系统凭据库或 Vercel 环境变量。
- 不将 key 放进源代码、`NEXT_PUBLIC_*`、URL、截图、日志、PR、聊天或测试夹具，不在浏览器直接请求模型供应商。
- 不执行 `vercel link`、`vercel pull`、`vercel env pull` 或访问 Secrets 配置；不复制 Vercel token、GitHub token 或 `.vercel/project.json`。
- 不运行 `npm run eval:live`、`npm run test:live`，不触发 Actions 的 `run_live`，不做生产 Agent 的批量压测。真实模型联调由负责人统一执行。
- 需要聊天加载、失败、停止等 UI 状态时，只在浏览器测试中使用明确标识的测试夹具；不能把假回答接进生产逻辑。
- Git 的 ignore 规则不是密钥保险。提交前只检查拟提交文件；如果发现疑似真实凭据，立即停止 push，私下提醒负责人处理，不复制秘密到报告、不自行删除历史或扩大传播。

## 5. 格式与兼容性

- 沿用被修改文件的缩进、引号、分号与换行风格；UTF-8 编码，避免中文乱码。不要对全仓运行自动格式化。
- 复用已有组件、CSS 命名和颜色变量。不要批量重命名文件、移动目录或换 UI 库。
- 桌面中英文布局均需验证：英文长文案不截断主要按钮，导航和「返回街角」可见，布局无意外横向溢出。
- 点击与拖动要区分：旋转或拖动模型不能误触跳转；保留焦点、键盘与减少动画偏好支持。
- 模型文本保持现有安全渲染，不引入 `dangerouslySetInnerHTML`；保留查询来源、时间、错误和模拟数据标识。
- 不改请求体、流式元数据、工具参数、策略卡 ID、语言 storage key 或学习状态结构。

## 6. 验收与提交

按改动运行检查，失败如实记录。不要删除测试或改受保护代码来“修绿”。

```bash
npm run typecheck
npm run lint
npm test
npm run eval
npm run build
git diff --check
git diff --name-only origin/main...HEAD
git status --short
```

`npm run eval` 不调用模型。`npm run eval` / `npm run build` 会重写知识索引，包括生成时间；这是构建副产物，不纳入前端提交。先核对 diff，只恢复自己本轮命令产生的改动，不覆盖其他人的工作。`git diff origin/main...HEAD` 只显示已提交内容，暂存和未暂存内容还需分别检查。

至少手动验证本次影响的桌面入口、返回、中英文和进度保留，保留改前 / 改后截图及浏览器控制台结论。如果运行浏览器自动测试，沿用项目工具和当前 Agent 的浏览器操作规则；未运行就写明未运行。

提交前查看 `git diff`、`git diff --cached` 和 `git diff --cached --name-only`，只暂存明确的前端文件；不要用 `git add .`、`git add -A`，不要提交 `.env*`、`.vercel/`、`node_modules/`、`.next/`、知识索引、聊天日志或无关格式变化。

确认当前分支后，只推到约定分支：

```bash
git branch --show-current
git commit -m "feat(frontend): describe the UI change"
git push origin HEAD:collab/frontend
```

上面的 commit 命令以已明确暂存本次文件为前提；提交信息按实际修改填写。没有写权限时，交付本地 commit / patch 并报告，不请求负责人的个人 token，不创建额外仓库绕开约定。

## 7. PR 与提醒模板

完成后新建或更新 `collab/frontend` → `main` 的 PR。未完成的工作标 Draft；完成后供负责人审核，不自动合并、不设置 auto-merge。若已有同分支 PR，更新它而不是重复创建。

PR 标题：`[frontend] 具体界面与行为变化`。正文按实际结果填写：

```text
@ninglinLiu 前端修改已推送到 collab/frontend，请你审核；合并和 Vercel 部署由你处理。

改动：
- 修改了哪些界面，原来是什么行为，现在是什么行为。

范围自查：
- 本次改动文件列表：
- README、Agent/RAG/MCP、API、知识库、共享状态与部署配置：未修改 / 已获授权的例外说明。
- 未读取或提交真实密钥；未调用付费评测；未执行合并或部署。

验证：
- typecheck / lint / test / eval / build：各自结果，未运行的明确标注。
- 桌面中文、英文截图：
- 场景点击、旋转缩放、返回和学习进度：
- 已知问题或需负责人确认的内容：

分支：collab/frontend
Commit：填写 SHA
```

提醒发在 PR 正文或本次完成评论即可，不重复刷通知。向同学交付时同时给出 PR 链接和 commit；到这里停止发布流程。

## 8. 仅供负责人：审核与 Vercel 发布

**以下不是同学 Agent 的操作授权。** 负责人审核 diff、实际页面、测试与 API 兼容性后，再决定合并和发布；同学不能自行执行这一节。

1. 审核 `main...collab/frontend` 的文件范围，确认没有混入 README、核心逻辑、密钥、生成物或配置修改。
2. 检查 PR 的 GitHub Actions 与桌面验收结果；需要真实模型联调时，在负责人控制的环境执行。
3. 由负责人合并 PR。发布前确认 Vercel 是否开启 Git 自动部署：若已开启，合并 Production Branch 就可能自动发布；若希望严格手动发布，应先由负责人调整发布策略，再合并。不要把“没有运行 CLI”误当成“不会上线”。[Vercel Git 集成说明](https://vercel.com/docs/git/vercel-for-github)
4. 手动发布时，使用现有 `infent-agent` Vercel 项目和经过审核的 `main` commit，核对 `.vercel/project.json` 的项目指向；运行既有生产部署流程，不新建项目、不改域名。服务端环境变量继续留在负责人控制的 Vercel 环境中。
5. 核对 `https://infent-agent.vercel.app/dashboard` 的招牌、返回、原宣传页和学习进度，再用少量真实请求验证 Agent 的回答、证据与错误状态。记录发布 commit，出现问题由负责人回滚到已知正常部署。

### 负责人需要另行确认的权限边界

本次只交付文档和分支，**没有修改 GitHub / Vercel 设置，也没有确认生产密钥的实际存放范围**。

- `AGENTS.md`、分支命名和 `.gitignore` 都不构成平台权限隔离。建议由负责人配置 `main` 的 PR 审核和必要检查，限制同学的合并 / 发布权限。
- 现有 Actions 的手动真实模型任务引用 `secrets.LLM_API_KEY`。若配置的是 repository secret，同仓库分支工作流不是独立的秘密隔离区；不要仅依靠“同学不改 workflow”保护生产 key。纯前端 CI 不需要模型 key；如需 Actions 使用真实凭据，由负责人评估受保护 environment、分支限制和人工审批，并相应调整 workflow。[GitHub Secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets) · [GitHub Environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
- 生产 DeepSeek key 不应提供给未经审核的 Preview / Development 环境。负责人检查 Vercel 的 Production、Preview 与 Development 变量范围；若平台自动生成协作分支 Preview，它也不是批准上线。需要带凭据的预览时，先审核代码，由负责人使用隔离、限额的测试凭据。[Vercel 环境变量](https://vercel.com/docs/environment-variables)

把权限设置与代码协作规则配合起来，才能落实“同学负责前端，你负责核心、密钥与发布”的分工。

# 同学前端协作 Agent 规则

本文件用于 `ninglinLiu/infent-agent` 的 `collab/frontend` 协作分支。接手前必须阅读 [完整交接方案](docs/CLASSMATE_AGENT_HANDOFF.md)。项目负责人是 `@ninglinLiu`。

## 工作边界

- 只实施同学本次明确提出的前端任务；没有具体任务时先询问需求，不自行重做网站。
- 开始前检查 remote、当前分支、工作区和 diff。只在 `collab/frontend` 上工作、提交和 push；不能 push `main`、合并 PR、修改默认分支或 force push。
- 核心定位是 Financial Research Agent。保留 README 的 Agent / RAG / MCP 定位、在线链接、架构与评测说明。当前编排是原生 TypeScript，不能虚写已使用 LangChain / LangGraph。
- 允许的前端文件与受保护路径以交接方案中的清单为准。未列为允许的文件默认不修改；受保护规则优先。超出范围时向负责人说明拟改文件、原因和影响，获得明确授权后再做。
- 不修改 `README.md`、`lib/ai/**`、`app/api/**`、`content/knowledge/**`、`eval/**`、`scripts/**`、`.github/**`、依赖、构建或部署配置，不改变聊天协议、工具能力、知识库、学习进度格式。
- 不读取、索取、输出或转发真实密钥。不读取负责人的 `.env.local`、`.vercel` 或登录凭据；只读 `.env.example` 了解变量名。前端开发默认无模型密钥，不运行付费模型评测。
- 不运行 `vercel link`、`vercel pull`、`vercel env pull`、`vercel deploy`、promote、rollback 或任何发布操作；不连接或创建 Vercel 项目。审核、合并和发布都由负责人处理。

## 实施与交付

- 保留桌面雨夜房子、旋转缩放、现有招牌入口、宣传页与「返回街角」。不新增手机端或晴天版。
- 保持中英文文案、布局、状态一致；沿用所在文件的缩进、引号、组件和 CSS 风格，不全仓格式化。
- 运行与改动对应的检查。不能以删除测试、关闭检查、伪造后端结果或修改受保护文件来让前端通过。
- 只暂存本次改动的明确文件，不使用 `git add .` / `git add -A` 混入其他内容。构建产生的知识索引等副产物不进入提交。
- 完成后 push 到 `collab/frontend`，新建或更新以 `main` 为目标的 PR，附改动说明、桌面中英文截图、测试结果、风险和自查记录；在 PR 中提醒 `@ninglinLiu` 审核。不要自行点击 Merge 或 Deploy。
- 如果本轮没有仓库写权限，交付本地 commit / patch 并报告阻塞，不索取负责人的 GitHub token、DeepSeek key 或 Vercel 登录。

本文件是协作约定，不代表 GitHub 分支保护或密钥权限已配置。不得删除或放宽本文件以绕过工作边界。

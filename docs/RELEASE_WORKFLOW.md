# 版本与发布约定

适用项目：`ninglinLiu/infent-agent`；正式站点：<https://omniaihello.com>。

用户在 2026-10-24 明确授权将已通过隔离验收的当前版本发布到现有项目，并要求保存正式用户、隔离测试账号、保留回滚和将改动推送 GitHub。本次授权包含后端、迁移和发布；不改变仓库对其他前端协作者的默认权限，也不自动授权未来生产发布。

## 每次完成改动

1. 先 fetch，检查当前分支、工作区和远端差异。默认使用 `collab/frontend`，不 force push，不直接推 main。
2. 按完整、可解释的功能或修复提交，提交前检查 diff 和明确文件清单；每个验证完成的逻辑改动及时 push。不要把每次键盘编辑都制造成提交。
3. 提交源码、数据库迁移、锁文件、测试与必要说明。密钥、真实用户导出、测试密码、`.env*`（已跟踪的空值 `.env.example` 除外）、`.vercel`、构建缓存不进 Git。
4. 运行对应测试；涉及账户或持久化时，真实 A/B/C 测试只能使用独立 staging 数据库。正式站点验收不创建测试用户。
5. 创建或更新到 main 的 PR，由负责人审核合并。代码推送与生产发布分开；截至本次检查，Vercel 项目没有关联 Git 自动部署。

## 发布一个版本

1. 保存当前正式 deployment ID/URL、已有迁移和用户/业务表的数量及摘要。记录不会包含聊天内容或密码。
2. 数据库只执行已在 staging 验证的增量迁移；不复制测试数据库、Auth 用户、demo 权益或 fixtures。保持生产 `allow_demo=false`。
3. 先提交并 push；以完整 commit SHA 标记部署。使用现有 Vercel 项目生产环境创建 `--prod --skip-domain` 候选版本。
4. 检查候选版本 Ready、登录页面、访客入口、生产 Supabase 配置和未登录 API 权限；应用必要增量迁移并核对数据保持情况，再 promote 到正式域名。
5. 对已发布源码 commit 创建不可变的 annotated tag（例如 `v2026.10.24.1`），push tag。补充 `docs/releases/` 发布记录：源码 SHA、deployment ID、迁移、验证、前版回滚目标。记录补充另行 commit/push，不更改已发 tag。
6. 后续改动重复上述流程，不覆盖已有版本 tag。不要在同一个版本名下悄悄换代码。

## 回滚

使用发布记录中的上一版部署：

```powershell
vercel rollback <previous-deployment-id> --yes --scope 123lkflhdskjfs-projects
```

回滚后检查主域名、www 跳转、登录及受保护接口，并记录事故原因和修复 commit。回滚应用时保留数据库与新增用户数据；不得通过清库、删除新表或恢复旧数据库来“撤销”功能。数据库采用向前修复迁移。旧应用兼容本次新增的学习表和 `conversations.updated_at`。

前版部署存在且 Ready 才能作为即时回滚目标。托管平台历史部署有保留限制；每次发布重新确认目标仍可用。GitHub 的源码/tag 提供长期重建依据，但并不包含密钥，也不是数据库备份；本次不声称启用了付费数据库备份或 PITR。

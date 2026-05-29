# Codex 任务日志

## 2026-05-20

- 创建并整理 `chuyi-video-content-system` 仓库结构。
- 明确个人品牌名：初一。
- 明确账号定位：设计策略与产品观察。
- 明确表达风格：专业、清晰、有判断，但不端着。
- 建立重点栏目：空调设计观察、趋势翻译室、设计策略观察、产品经理学习笔记。
- 更新 README、docs、templates、input、data 和 scripts。
- 实现 `scripts/generate_content_package.py` 第一版：读取本地观点和模板，在 `output/` 下生成内容包，不调用外部 AI API。

## 2026-05-29

- 增加每日图文内容生产流程，覆盖分页脚本、图片 prompt、发布准备和复盘字段。
- 新增 `input/graphic_outline_template.md` 作为每日图文大纲输入模板。
- 新增 `templates/graphic_content_package_template.md` 作为结构化图文内容生产包模板。
- 新增 `scripts/generate_graphic_content_package.py`，支持从本地大纲生成 `graphic_content_package.md`。
- 更新 README，补充图文内容包使用步骤和目录说明。

## 2026-05-29 云端社媒发布流程补充

- 增加云端 OAuth redirect URI 校验，禁止 `localhost`、`127.0.0.1` 和 `[::1]`。
- 新增 `ContentStorage` 抽象及 filesystem / cloud mock 两种模式，避免发布流程写死本地 `/content` 路径。
- 新增 `PublishRecordStorage` mock 抽象，用于后续替换为数据库实现。
- 新增 `POST /api/social/publish/execute` 云端半自动发布执行逻辑，官方发布 API 未启用时返回 `manual_publish_ready`。
- 新增云端人工发布清单、发布记录和 analytics snapshot 模板生成逻辑。
- 新增 Node 测试覆盖确认状态、缺失 topic、不完整内容包、cloud mock、手动发布就绪和 localhost redirect URI 报错。

## 2026-05-29 Vercel 部署准备

- 补齐 Next.js `dev`、`build`、`start` 脚本和依赖声明，方便 Vercel 识别并构建项目。
- 新增首页 `app/page.js`，用于云端部署后的基础健康说明。
- 新增抖音和小红书 OAuth callback route handler，直接访问缺少 `code` / `state` 时返回明确错误。
- 新增 `vercel.json`，声明 Next.js framework 和 build command。
- 更新 README，补充 Vercel 部署检查、Root Directory、Build Command、API Routes 和必须配置的环境变量。

## 2026-05-29 Vercel 404 修复

- 将 Next.js App Router 从仓库根 `app/` 迁移到 `src/app/`，并补齐 `src/app/layout.js`，避免 Vercel 构建时缺少 Root Layout。
- 将首页更新为 `Chuyi Content System is running`，用于部署后快速确认页面路由已生效。
- 新增 `/api/social/config/check`，用于部署后检查云端 OAuth 和存储配置。
- 新增 `/api/social/douyin/start` 与 `/api/social/xiaohongshu/start` 授权入口占位 route，避免部署后访问 OAuth start 返回 404。
- 更新 README，明确 Vercel Root Directory 应为仓库根目录，App Directory 为 `src/app/`，并列出部署后应测试的真实 URL。

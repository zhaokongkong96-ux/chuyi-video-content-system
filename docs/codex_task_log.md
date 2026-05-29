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

## 2026-05-29 Next.js dependency detection fix

- 将 `next`、`react`、`react-dom` 依赖版本改为 `latest`，确保 Vercel 能从仓库根目录的 `package.json` 检测 Next.js 版本。
- 将 `src/app` 路由文件改为 Next.js / TypeScript 常用结构：`layout.tsx`、`page.tsx`、`route.ts`。
- 新增 `tsconfig.json` 和 `next-env.d.ts`，让 Vercel/Next.js 构建 TypeScript App Router 路由时有明确配置。

## 2026-05-29 ESM module format fix

- 将 `package.json` 的模块类型从 CommonJS 调整为 ESM，避免 Next.js App Router `route.ts` 与包级 CommonJS 类型冲突。
- 将 `src/social/*` 从 `require` / `module.exports` 改为 `import` / `export`。
- 将 `src/app/api/social/**/route.ts` 改为直接使用命名 ESM import。
- 将 Node 测试改为 ESM import，保持测试与运行时代码模块格式一致。

## 2026-05-29 Conflict resolution verification

- 检查冲突文件未残留 Git conflict markers。
- 确认 `package.json` 已移除 `type: commonjs` 并使用 ESM，保留 Next.js 依赖与 `dev` / `build` / `start` 脚本。
- 确认 `src/app` 路由结构、OAuth callback、config check 和 publish execute route 均保留。
- 确认 `src/social/*` 与测试均使用 ESM import/export，避免 App Router route 与 CommonJS 冲突。

## 2026-05-29 GitHub PR conflict resolution pass

- 以当前 PR 代码为基线重新检查 GitHub 标记的冲突文件：README、任务日志、package.json、`src/social/*` 和测试文件均未残留 conflict markers。
- 确认 `package.json` 不包含 `type: commonjs`，当前统一为 ESM，并保留 Next.js / TypeScript 构建依赖与 `dev`、`build`、`start` 脚本。
- 确认 `src/app/api/social/**/route.ts` 使用 App Router 标准 ESM `export async function GET/POST` 写法。
- 确认被 route.ts 引用的 `src/social/*.js` 已统一为 ESM import/export，避免 CommonJS 与 Turbopack 构建冲突。
- 确认 README 保留 Vercel 部署、真实云端域名、OAuth callback、半自动发布、npm registry 403 环境限制和 Vercel 构建验证说明。

## 2026-05-29 package build script verification

- 重新确认仓库根目录 `package.json` 包含 `dev`、`build`、`start`、`test` scripts，其中 `build` 为 `next build`。
- 确认 `package.json` 未使用 `type: commonjs`，当前为 ESM。
- 确认 Next.js、React 和 TypeScript 相关依赖仍保留。
- 确认 `src/app/layout.tsx`、`src/app/page.tsx` 和 `src/app/api/social/config/check/route.ts` 仍存在。

## 2026-05-29 Vercel checklist final pass

- 按 Vercel 部署检查表补齐 `@types/react-dom` 开发依赖。
- 再次确认 `package.json` 包含 `dev`、`build`、`start`、`test` scripts，且不包含 `type: commonjs`。
- 再次确认 `src/app/layout.tsx`、`src/app/page.tsx`、`src/app/api/social/config/check/route.ts` 存在。
- 再次确认 `src/app/api/**/route.ts` 和 `src/social/*.js` 未使用 CommonJS 写法。

## 2026-05-29 social module import verification

- 新增模块导入静态测试，防止 `src/app/api/**/route.ts` 从 `src/social/*.js` 使用 default import。
- 测试同时验证 route handler 不使用 `require`、`module.exports` 或 `exports.*`，并保留 `export async function GET/POST` 写法。
- 测试验证 `src/social/*.js` 继续使用 named ESM export，避免 Vercel/Turbopack 再次出现 default export 不存在的构建错误。

## 2026-05-29 legacy root app import guard

- 扩展模块导入静态测试，覆盖旧路径 `app/api/social/**/route.js`，防止旧 root app route 在冲突解决后重新出现并使用 default import。
- 针对 Vercel 报错中的 `app/api/social/publish/execute/route.js` 增加专项断言：如该文件存在，必须使用 `import { getOAuthRedirectUris } ...` 与 `import { executePublish } ...`，且不能再通过 `const { ... } = oauthConfig/publishExecute` 解构 default import。
- 当前仓库 canonical route 位于 `src/app/api/social/publish/execute/route.ts`，已经使用 named import。

## 2026-05-29 route tree unification verification

- 检查项目不存在旧的根目录 `app/api/social/**` 路由。
- 确认当前唯一 App Router 路由树位于 `src/app/**`。
- 确认保留 `src/app/layout.tsx`、`src/app/page.tsx` 和所有 `src/app/api/social/**/route.ts`，避免 Vercel 构建到旧的 `route.js`。

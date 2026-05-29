# chuyi-video-content-system

`chuyi-video-content-system` 是个人品牌「初一」的内容生产仓库，用来把一个原始观点或每日内容大纲整理成可拍摄、可剪辑、可发布的视频 / 图文内容包。

账号定位：设计策略与产品观察。

表达风格：专业、清晰、有判断，但不端着。

## 重点栏目

- 空调设计观察
- 趋势翻译室
- 设计策略观察
- 产品经理学习笔记

## 文件结构

```text
chuyi-video-content-system/
├── README.md
├── input/
│   ├── viewpoint_template.md
│   └── graphic_outline_template.md
├── output/
│   └── YYYY-MM-DD_english-slug/
│       ├── content_package.md
│       ├── graphic_content_package.md
│       ├── voiceover_30s.md
│       ├── voiceover_60s.md
│       ├── storyboard.md
│       ├── image_prompts.md
│       ├── cover_copy.md
│       └── publish_copy.md
├── templates/
│   ├── content_package_template.md
│   ├── graphic_content_package_template.md
│   ├── storyboard_template.md
│   ├── image_prompt_template.md
│   ├── cover_template.md
│   └── publish_template.md
├── scripts/
│   ├── generate_content_package.py
│   └── generate_graphic_content_package.py
├── docs/
│   ├── brand_style_guide.md
│   ├── content_columns.md
│   ├── video_workflow.md
│   ├── graphic_workflow.md
│   └── codex_task_log.md
└── data/
    └── viewpoint_library.csv
```

## 目录用途

| 文件夹 | 作用 |
| --- | --- |
| `input/` | 填写原始观点、视频 brief 或每日图文内容大纲 |
| `output/` | 每条视频内容包的最终结果 |
| `templates/` | 视频内容包、图文内容包、分镜、提示词、封面和发布文案模板 |
| `scripts/` | 自动生成内容包的脚本 |
| `docs/` | 品牌风格、栏目、流程和任务记录 |
| `data/` | 观点库、选题库、发布记录 |

## 视频内容包使用步骤

1. 打开 `input/viewpoint_template.md`，填写栏目、原始观点、核心观点、平台、时长和视觉风格。
2. 在 `data/viewpoint_library.csv` 中记录选题，方便后续复盘。
3. 运行脚本生成内容包：

```bash
python scripts/generate_content_package.py --date 2026-05-20 --slug health-ac-user-feeling
```

也可以省略参数，脚本会使用当天日期和默认 slug：

```bash
python scripts/generate_content_package.py
```

4. 在 `output/YYYY-MM-DD_slug/` 下查看生成结果。
5. 人工润色 `voiceover_30s.md`、`voiceover_60s.md`、`storyboard.md`、`image_prompts.md`、`cover_copy.md` 和 `publish_copy.md`。

## 脚本说明

`scripts/generate_content_package.py` 第一版只做稳定的模板生成：

- 读取 `input/viewpoint_template.md`
- 读取 `templates/` 下的模板
- 在 `output/` 下创建 `日期_英文slug` 文件夹
- 生成完整内容包文件
- 不调用任何外部 AI API
- 不覆盖已存在文件，避免误删人工修改


## 图文内容包使用步骤

1. 打开 `input/graphic_outline_template.md`，填写主题名称、目标读者、核心观点、主要知识点、页数建议和视觉风格方向。
2. 运行脚本生成图文内容生产包：

```bash
python scripts/generate_graphic_content_package.py --date 2026-05-29 --slug demand-priority
```

3. 在 `output/YYYY-MM-DD_slug/graphic_content_package.md` 下查看结构化执行 prompt。
4. 将该内容包交给 AI / 设计自动化流程，继续生成分页图文脚本、每页图片生成 prompt、小红书 / 抖音发布文案、发布前检查清单和数据复盘字段。

## 图文脚本说明

`scripts/generate_graphic_content_package.py` 第一版只做稳定的模板生成：

- 读取 `input/graphic_outline_template.md`
- 读取 `templates/graphic_content_package_template.md`
- 在 `output/` 下创建 `日期_英文slug` 文件夹
- 生成 `graphic_content_package.md`
- 不调用任何外部 AI API
- 不覆盖已存在文件，避免误删人工修改

## 云端社媒发布流程

当前项目按云端运行设计，不使用 `localhost` 作为 OAuth 或发布流程地址，也不假设本地持久化文件系统或固定 `/content` 目录一定可用。社媒发布相关代码通过存储适配层读取内容包和保存发布记录。


### Vercel 部署检查

当前仓库已按 Vercel 的 Next.js 项目形态补齐基础结构：

- 项目类型：Next.js App Router 应用。
- Root Directory：仓库根目录，无需额外配置子目录。Vercel 中不要选择 `input/`、`docs/`、`scripts/` 或其他子目录。
- App Directory：`src/app/`。
- `package.json` 位于仓库根目录，并声明 `next`、`react`、`react-dom` 依赖。
- 模块格式：项目使用 ESM（`package.json` 中为 `"type": "module"`），`src/app/api/**/route.ts` 和 `src/social/*` 均使用 `import` / `export`，避免 App Router route 与 CommonJS 冲突。
- 首页路由：`src/app/page.tsx`。
- Root Layout：`src/app/layout.tsx`。
- Build Command：`npm run build`。
- Start Command：`npm run start`。
- 必须配置的云端环境变量：`NEXT_PUBLIC_APP_URL`、`DOUYIN_REDIRECT_URI`、`XHS_REDIRECT_URI`、`CONTENT_STORAGE_MODE`、`SOCIAL_PUBLISH_API_ENABLED`。
- 已提供 API Route Handler：
  - `/api/social/config/check`
  - `/api/social/douyin/start`
  - `/api/social/douyin/callback`
  - `/api/social/xiaohongshu/start`
  - `/api/social/xiaohongshu/callback`
  - `/api/social/publish/execute`
- 关键 route 文件：`src/app/api/social/config/check/route.ts`、`src/app/api/social/douyin/callback/route.ts`、`src/app/api/social/xiaohongshu/callback/route.ts`。

当前 Vercel 真实域名为 `https://chuyi-video-content-system.vercel.app`。请使用该域名更新 `NEXT_PUBLIC_APP_URL`，再生成抖音和小红书 redirect URI。GitHub 只作为代码仓库，不是 OAuth callback 的云端运行服务。

### 云端环境变量

```bash
NEXT_PUBLIC_APP_URL=https://chuyi-video-content-system.vercel.app
DOUYIN_REDIRECT_URI=https://chuyi-video-content-system.vercel.app/api/social/douyin/callback
XHS_REDIRECT_URI=https://chuyi-video-content-system.vercel.app/api/social/xiaohongshu/callback
### 云端环境变量

```bash
NEXT_PUBLIC_APP_URL=https://<YOUR_CLOUD_DOMAIN>
DOUYIN_REDIRECT_URI=https://<YOUR_CLOUD_DOMAIN>/api/social/douyin/callback
XHS_REDIRECT_URI=https://<YOUR_CLOUD_DOMAIN>/api/social/xiaohongshu/callback
CONTENT_STORAGE_MODE=cloud
SOCIAL_PUBLISH_API_ENABLED=false
```

说明：

- `NEXT_PUBLIC_APP_URL`：云端公开访问域名，不能是 `localhost`、`127.0.0.1` 或 `[::1]`。
- 当前 Vercel 真实公网域名是 `https://chuyi-video-content-system.vercel.app`；如果未来更换项目或自定义域名，需要同步更新这里的三个 URL。
- `<YOUR_CLOUD_DOMAIN>` 必须替换成当前云端项目的真实公网域名，例如 Vercel / Netlify / Railway / Render 提供的正式访问域名。
- `DOUYIN_REDIRECT_URI`：本项目提供给抖音平台回调的 OAuth callback 接口地址，建议为 `${NEXT_PUBLIC_APP_URL}/api/social/douyin/callback`。
- `XHS_REDIRECT_URI`：本项目提供给小红书平台回调的 OAuth callback 接口地址，建议为 `${NEXT_PUBLIC_APP_URL}/api/social/xiaohongshu/callback`。
- `CONTENT_STORAGE_MODE`：`cloud` 为正式云端模式，当前提供 mock 实现；`filesystem` 仅用于开发 / 临时测试。
- `SOCIAL_PUBLISH_API_ENABLED`：当前应保持 `false`，真实自动发布需等待平台官方发布 API 和权限接入。

### 平台后台配置事项

请在小红书 / 抖音开放平台后台，将 redirect URI 配置为本项目的云端 callback 接口地址：

- 抖音：`https://chuyi-video-content-system.vercel.app/api/social/douyin/callback`
- 小红书：`https://chuyi-video-content-system.vercel.app/api/social/xiaohongshu/callback`

注意：

- callback URL 不是抖音 / 小红书后台地址，而是本项目提供给平台 OAuth 回调的接口地址。
- 用户不能通过直接打开 callback URL 完成平台配置；它需要由平台在授权完成后携带 `code` / `state` 参数访问。
- 当前应使用 Vercel 已生成的真实公网域名：`https://chuyi-video-content-system.vercel.app`。
- 如果系统检测到 redirect URI 使用 `localhost`，会直接报错并提示改成云端公开地址。

操作步骤：

1. 找到当前云端项目的真实公网域名，本项目当前为 `https://chuyi-video-content-system.vercel.app`。
2. 在云端环境变量中配置 `NEXT_PUBLIC_APP_URL=https://chuyi-video-content-system.vercel.app`。
3. 基于 `NEXT_PUBLIC_APP_URL` 生成 `DOUYIN_REDIRECT_URI=https://chuyi-video-content-system.vercel.app/api/social/douyin/callback` 和 `XHS_REDIRECT_URI=https://chuyi-video-content-system.vercel.app/api/social/xiaohongshu/callback`。
4. 登录抖音开放平台 / 小红书开放平台。
5. 进入对应应用的 OAuth、授权回调或安全设置页面。
6. 将对应平台的 redirect URI 填入平台后台，并确保它与云端 `.env` 环境变量完全一致。
7. 回到本项目后台点击“绑定账号”，由平台授权页跳转回本项目 callback 接口完成绑定。

常见错误说明：

- 如果直接打开 `/api/social/douyin/callback` 或 `/api/social/xiaohongshu/callback` 返回错误，是正常的，因为 callback 需要平台携带 `code` / `state` 参数访问。
- 如果平台提示 `redirect_uri` 不一致，说明平台后台配置的 redirect URI 和云端 `.env` 中的 `DOUYIN_REDIRECT_URI` / `XHS_REDIRECT_URI` 不一致，请逐字符核对协议、域名、路径和末尾斜杠。


### npm install 环境说明

Codex 当前执行环境访问 npm registry 可能返回 `403 Forbidden`，这属于执行环境网络限制，不代表仓库缺少 Next.js 依赖或一定无法部署。请以仓库根目录 `package.json` 为准：其中已经声明 `next`、`react`、`react-dom`、`typescript`、`@types/react`、`@types/node`，并且模块格式已统一为 ESM。Vercel 重新部署时会在自己的构建环境中执行依赖安装和 `npm run build`。

### 部署后测试 URL

Vercel 部署完成后，请测试以下 URL：

- 首页：`https://chuyi-video-content-system.vercel.app/`
- 配置检查：`https://chuyi-video-content-system.vercel.app/api/social/config/check`
- 抖音授权入口占位：`https://chuyi-video-content-system.vercel.app/api/social/douyin/start`
- 小红书授权入口占位：`https://chuyi-video-content-system.vercel.app/api/social/xiaohongshu/start`
- 抖音 callback：`https://chuyi-video-content-system.vercel.app/api/social/douyin/callback`（直接打开缺少 `code` / `state` 返回 400 属于正常现象）
- 小红书 callback：`https://chuyi-video-content-system.vercel.app/api/social/xiaohongshu/callback`（直接打开缺少 `code` / `state` 返回 400 属于正常现象）
- 发布执行：`POST https://chuyi-video-content-system.vercel.app/api/social/publish/execute`

### 半自动发布模式

当前发布流程不是直接调用平台 API 发帖，而是半自动模式：

1. 系统生成内容包。
2. 系统生成云端人工发布清单。
3. 用户手动下载 / 上传图片，并复制小红书 / 抖音文案发布。
4. 用户发布后回填曝光、完读、收藏、评论、转发和涨粉等数据。
5. 系统根据数据优化下一次内容。

真实自动发布需要等待小红书 / 抖音官方发布 API、发布权限和审核接入。

### 发布执行接口

`POST /api/social/publish/execute` 请求示例：

```json
{
  "topic": "cloud-ready-demo",
  "confirmed": true
}
```

当官方发布 API 未启用时，成功响应会返回 `manual_publish_ready`，并提供 `manual_publish_guide_url`、云端图片 URL、文案就绪状态和下一步操作提示。

更多细节见 `docs/cloud_social_publish_workflow.md`。

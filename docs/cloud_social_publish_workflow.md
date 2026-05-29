# 云端社媒发布流程

当前项目按云端运行设计，不再假设 `localhost`、本地持久化文件系统或固定 `/content` 目录一定可用。

## 1. 云端 OAuth 配置

必须配置云端公开地址：

```bash
NEXT_PUBLIC_APP_URL=https://your-cloud-domain.example.com
DOUYIN_REDIRECT_URI=https://your-cloud-domain.example.com/api/social/douyin/callback
XHS_REDIRECT_URI=https://your-cloud-domain.example.com/api/social/xiaohongshu/callback
```

如果未显式配置 `DOUYIN_REDIRECT_URI` 或 `XHS_REDIRECT_URI`，系统会基于 `NEXT_PUBLIC_APP_URL` 生成默认 callback：

- `${NEXT_PUBLIC_APP_URL}/api/social/douyin/callback`
- `${NEXT_PUBLIC_APP_URL}/api/social/xiaohongshu/callback`

任何 redirect URI 中出现 `localhost`、`127.0.0.1` 或 `[::1]` 都会被直接拒绝，并提示需要改成云端公开地址。

## 2. ContentStorage 适配层

社媒发布执行不直接读取写死的本地路径，而是通过 `ContentStorage` 抽象访问内容包。

### filesystem 模式

仅用于早期开发 / 临时测试。默认读取：

```text
/content/{topic}/
├── page_script.json
├── xiaohongshu_caption.md
├── douyin_caption.md
└── images/
    ├── page_01.png
    ├── page_02.png
    └── ...
```

如果没有配置 `ASSET_PUBLIC_BASE_URL`，filesystem 模式下的图片只会被标记为 `not_uploaded_to_cloud_storage`，不会伪装成本地可访问 URL。

### cloud 模式

正式云端运行模式。当前仓库先提供 mock 实现，后续可替换为数据库 + 对象存储。抽象方法包括：

- `getContentPackage(topic)`
- `getPageScripts(topic)`
- `getCaptions(topic)`
- `getImageAssets(topic)`
- `saveManualPublishGuide(topic, data)`
- `savePublishRecord(topic, data)`
- `saveAnalyticsSnapshot(topic, data)`

## 3. PublishRecordStorage 适配层

发布记录通过 `PublishRecordStorage` 抽象管理，当前提供 mock 实现。后续接入数据库时保持接口不变。

接口：

- `createPublishRecord()`
- `updatePublishStatus()`
- `getPublishRecord()`

记录字段：

- `topic`
- `mode: manual | api`
- `status`
- `platforms.xiaohongshu.status`
- `platforms.douyin.status`
- `image_count`
- `created_at`
- `updated_at`

## 4. POST /api/social/publish/execute

请求：

```json
{
  "topic": "cloud-ready-demo",
  "confirmed": true
}
```

执行逻辑：

1. 校验 `confirmed` 必须为 `true`。
2. 通过 `ContentStorage` 读取内容包。
3. 检查 topic、分页脚本、小红书文案、抖音文案、图片资源、图片数量与页数、图片 URL。
4. 官方发布 API 未启用时不真实发布，而是生成人工发布清单、发布记录和数据回填模板。
5. 返回 `manual_publish_ready`。

成功响应：

```json
{
  "status": "manual_publish_ready",
  "topic": "cloud-ready-demo",
  "content_source": "cloud",
  "manual_publish_guide_url": "https://mock-storage.example.com/content/cloud-ready-demo/manual_publish_guide.json",
  "image_assets": [
    {
      "page": 1,
      "url": "https://mock-storage.example.com/content/cloud-ready-demo/images/page_01.png"
    }
  ],
  "xiaohongshu_caption_ready": true,
  "douyin_caption_ready": true,
  "next_step": "请手动下载/上传图片，并复制文案发布"
}
```

## 5. 云端人工发布清单

`manual_publish_guide` 面向云端运行，必须提供可访问 URL 或明确标记图片尚未上传云端存储。内容包括：

- 图片预览 URL
- 图片下载链接
- 小红书标题复制区
- 小红书正文复制区
- 小红书标签复制区
- 抖音标题复制区
- 抖音正文复制区
- 抖音标签复制区
- 发布后数据回填入口说明

## 6. 当前半自动发布模式

当前流程为半自动模式：

1. 系统生成内容包。
2. 系统生成云端人工发布清单。
3. 用户手动下载 / 上传图片并复制文案发布。
4. 用户回填发布数据。
5. 系统根据数据优化下一次内容。

真实自动发布需要等待小红书 / 抖音官方发布 API、权限和审核接入。

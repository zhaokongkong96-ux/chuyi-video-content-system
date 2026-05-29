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

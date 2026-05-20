# 视频内容生产流程

## 1. 填写观点

在 `input/viewpoint_template.md` 中填写：

- 栏目
- 原始观点
- 核心观点
- 目标平台
- 视频时长
- 视觉风格

## 2. 记录选题

在 `data/viewpoint_library.csv` 中记录选题状态，方便追踪从观点到发布的全过程。

## 3. 生成内容包

运行：

```bash
python scripts/generate_content_package.py --date 2026-05-20 --slug health-ac-user-feeling
```

脚本会在 `output/` 下创建新文件夹，并生成 7 个文件：

- `content_package.md`
- `voiceover_30s.md`
- `voiceover_60s.md`
- `storyboard.md`
- `image_prompts.md`
- `cover_copy.md`
- `publish_copy.md`

## 4. 人工润色

重点检查：

- 开头 3 秒是否有清晰钩子。
- 核心观点是否有判断。
- 是否符合「初一」的表达风格。
- 是否把行业语言翻译成用户能理解的体验语言。

## 5. 制作与发布

根据 `storyboard.md` 和 `image_prompts.md` 制作画面，再使用 `cover_copy.md` 和 `publish_copy.md` 完成发布。

## 6. 复盘

发布后把表现数据、评论反馈和复盘结论补回 `data/viewpoint_library.csv` 或后续发布记录表。

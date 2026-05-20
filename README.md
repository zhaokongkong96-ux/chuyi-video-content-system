# chuyi-video-content-system

`chuyi-video-content-system` 是个人品牌「初一」的短视频内容生产仓库，用来把一个原始观点整理成可拍摄、可剪辑、可发布的视频内容包。

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
│   └── viewpoint_template.md
├── output/
│   └── YYYY-MM-DD_english-slug/
│       ├── content_package.md
│       ├── voiceover_30s.md
│       ├── voiceover_60s.md
│       ├── storyboard.md
│       ├── image_prompts.md
│       ├── cover_copy.md
│       └── publish_copy.md
├── templates/
│   ├── content_package_template.md
│   ├── storyboard_template.md
│   ├── image_prompt_template.md
│   ├── cover_template.md
│   └── publish_template.md
├── scripts/
│   └── generate_content_package.py
├── docs/
│   ├── brand_style_guide.md
│   ├── content_columns.md
│   ├── video_workflow.md
│   └── codex_task_log.md
└── data/
    └── viewpoint_library.csv
```

## 目录用途

| 文件夹 | 作用 |
| --- | --- |
| `input/` | 填写原始观点和本次视频 brief |
| `output/` | 每条视频内容包的最终结果 |
| `templates/` | 内容包、分镜、提示词、封面和发布文案模板 |
| `scripts/` | 自动生成内容包的脚本 |
| `docs/` | 品牌风格、栏目、流程和任务记录 |
| `data/` | 观点库、选题库、发布记录 |

## 使用步骤

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

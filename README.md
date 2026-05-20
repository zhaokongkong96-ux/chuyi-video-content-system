# chuyi-video-content-system

短视频内容生产系统，用于把一个原始观点转化为完整的视频内容包，包括口播稿、分镜、AI 图像提示词、封面文案和发布文案。

## 目录说明

| 文件夹 | 作用 |
| --- | --- |
| `input/` | 填写原始观点和内容 brief |
| `output/` | 每条视频内容包的最终结果 |
| `templates/` | 固定模板 |
| `scripts/` | 自动生成文件的脚本 |
| `docs/` | 品牌风格、栏目、流程说明 |
| `data/` | 观点库、选题库、发布记录 |

## 快速开始

1. 在 `input/viewpoint_template.md` 中填写原始观点。
2. 将观点同步记录到 `data/viewpoint_library.csv`。
3. 运行脚本生成内容包：

```bash
python scripts/generate_content_package.py \
  --topic "health-ac-user-feeling" \
  --date "2026-05-20" \
  --viewpoint-file input/viewpoint_template.md
```

4. 在 `output/YYYY-MM-DD_topic/` 中检查并润色各项内容。

## 内容包文件

每条视频建议包含：

- `content_package.md`：内容总包
- `voiceover_30s.md`：30 秒口播稿
- `voiceover_60s.md`：60 秒口播稿
- `storyboard.md`：分镜脚本
- `image_prompts.md`：AI 配图提示词
- `cover_copy.md`：封面文案
- `publish_copy.md`：发布文案

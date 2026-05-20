# 短视频生产流程

## 1. 输入观点

在 `input/viewpoint_template.md` 填写原始观点、用户痛点、核心表达和证据素材。

## 2. 生成内容包

运行：

```bash
python scripts/generate_content_package.py --topic "health-ac-user-feeling" --date "2026-05-20"
```

## 3. 人工润色

重点检查：

- 开头 3 秒是否有具体痛点。
- 技术表达是否转换成用户利益。
- 是否存在夸大或医疗化表述。

## 4. 生成素材

根据 `storyboard.md` 和 `image_prompts.md` 生成画面、拍摄清单或剪辑素材。

## 5. 发布复盘

将标题、发布时间、播放量、完播率、互动评论记录回 `data/viewpoint_library.csv` 或后续发布记录表。

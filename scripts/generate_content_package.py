#!/usr/bin/env python3
"""Generate a short-video content package skeleton from a viewpoint file."""

from __future__ import annotations

import argparse
from pathlib import Path


PACKAGE_FILES = {
    "content_package.md": "# 内容总包\n\n## 原始观点\n\n{viewpoint}\n\n## 核心方向\n\n- 开头：用用户熟悉的体感问题切入。\n- 中段：解释产品体验如何解决问题。\n- 结尾：回到家庭场景和品牌信任。\n",
    "voiceover_30s.md": "# 30 秒口播稿\n\n{viewpoint}\n\n请在这里压缩成 90-120 字的短口播。\n",
    "voiceover_60s.md": "# 60 秒口播稿\n\n{viewpoint}\n\n请在这里扩展成 180-240 字的完整口播。\n",
    "storyboard.md": "# 分镜脚本\n\n| 镜头 | 时长 | 画面 | 口播 / 字幕 | 备注 |\n| --- | --- | --- | --- | --- |\n| 1 | 0-3s | 用户痛点场景 | 开头钩子 | 快速抓住注意力 |\n| 2 | 3-15s | 产品体验场景 | 观点展开 | 生活化表达 |\n| 3 | 15-30s | 家庭舒适场景 | 结尾收束 | 避免夸大承诺 |\n",
    "image_prompts.md": "# AI 图像提示词\n\n## 镜头 1\n\n真实家庭客厅，夏天午后，家人感到空气闷热但画面自然克制，9:16，生活方式摄影。\n\n## 镜头 2\n\n健康空调运行中的现代客厅，空气流动柔和，人物表情舒适放松，9:16，真实摄影风格。\n",
    "cover_copy.md": "# 封面文案\n\n## 主标题\n\n好空调，看体感\n\n## 副标题\n\n不是只看温度数字\n",
    "publish_copy.md": "# 发布文案\n\n## 标题\n\n为什么好空调更应该看体感？\n\n## 正文\n\n真正舒服的空气，不只是温度合适，还要不直吹、不闷、不忽冷忽热。\n\n## 标签\n\n#健康空调 #舒适家居 #空气体验\n",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate a video content package skeleton.")
    parser.add_argument("--topic", required=True, help="Topic slug, e.g. health-ac-user-feeling")
    parser.add_argument("--date", required=True, help="Date in YYYY-MM-DD format")
    parser.add_argument("--viewpoint-file", default="input/viewpoint_template.md", help="Path to viewpoint markdown")
    parser.add_argument("--output-root", default="output", help="Output directory root")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    viewpoint_path = Path(args.viewpoint_file)
    viewpoint = viewpoint_path.read_text(encoding="utf-8").strip()

    package_dir = Path(args.output_root) / f"{args.date}_{args.topic}"
    package_dir.mkdir(parents=True, exist_ok=True)

    for filename, template in PACKAGE_FILES.items():
        target = package_dir / filename
        if target.exists():
            continue
        target.write_text(template.format(viewpoint=viewpoint), encoding="utf-8")

    print(f"Generated content package: {package_dir}")


if __name__ == "__main__":
    main()

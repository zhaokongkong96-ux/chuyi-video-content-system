#!/usr/bin/env python3
"""Generate a short-video content package from local markdown templates."""

from __future__ import annotations

import argparse
from datetime import date
from pathlib import Path
from string import Template

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_VIEWPOINT_FILE = ROOT / "input" / "viewpoint_template.md"
DEFAULT_TEMPLATE_DIR = ROOT / "templates"
DEFAULT_OUTPUT_DIR = ROOT / "output"

TEMPLATE_TO_OUTPUT = {
    "content_package_template.md": "content_package.md",
    "storyboard_template.md": "storyboard.md",
    "image_prompt_template.md": "image_prompts.md",
    "cover_template.md": "cover_copy.md",
    "publish_template.md": "publish_copy.md",
}

VOICEOVER_TEMPLATES = {
    "voiceover_30s.md": """# 30 秒口播稿

## 生成说明

请基于以下观点，整理成 30 秒左右的口播稿。语气要专业、清晰、有判断，但不端着。

## 原始信息

$viewpoint_text

## 占位稿

开头用一个用户能立刻理解的问题切入：$core_viewpoint

中段解释为什么这个判断重要，并用真实体验替代参数堆叠。

结尾回到「初一」的观察：好的产品表达，应该让用户更快理解价值。
""",
    "voiceover_60s.md": """# 60 秒口播稿

## 生成说明

请基于以下观点，整理成 45-60 秒的完整口播稿。适合小红书 / 抖音，表达要有判断，但不要端着。

## 原始信息

$viewpoint_text

## 占位稿

很多产品在讲价值时，会先讲技术、参数和功能。但用户真正关心的，往往是这些东西最后能不能变成一种更安心的体验。

这条内容的核心判断是：$core_viewpoint

所以视频可以从「行业怎么说」和「用户怎么感受」的错位切入，再回到设计策略：把复杂能力翻译成用户听得懂、感受得到、愿意相信的表达。

这也是「初一」想持续观察的方向：产品不只是被制造出来，也要被正确地理解。
""",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate a local video content package.")
    parser.add_argument("--date", default=date.today().isoformat(), help="Date for output folder, e.g. 2026-05-20")
    parser.add_argument("--slug", default="health-ac-user-feeling", help="English slug for output folder")
    parser.add_argument("--viewpoint-file", default=str(DEFAULT_VIEWPOINT_FILE), help="Path to input viewpoint markdown")
    parser.add_argument("--template-dir", default=str(DEFAULT_TEMPLATE_DIR), help="Path to templates directory")
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR), help="Path to output directory")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing generated files")
    return parser.parse_args()


def extract_field(markdown: str, field_name: str, fallback: str = "待填写") -> str:
    prefix = f"- {field_name}："
    for line in markdown.splitlines():
        stripped = line.strip()
        if stripped.startswith(prefix):
            return stripped.removeprefix(prefix).strip() or fallback
    return fallback


def render_template(template_text: str, values: dict[str, str]) -> str:
    return Template(template_text).safe_substitute(values)


def write_file(path: Path, content: str, overwrite: bool) -> bool:
    if path.exists() and not overwrite:
        return False
    path.write_text(content.rstrip() + "\n", encoding="utf-8")
    return True


def main() -> None:
    args = parse_args()
    viewpoint_path = Path(args.viewpoint_file)
    template_dir = Path(args.template_dir)
    output_root = Path(args.output_dir)

    viewpoint_text = viewpoint_path.read_text(encoding="utf-8").strip()
    values = {
        "brand_name": "初一",
        "account_positioning": "设计策略与产品观察",
        "tone": "专业、清晰、有判断，但不端着",
        "date": args.date,
        "slug": args.slug,
        "column": extract_field(viewpoint_text, "栏目"),
        "platform": extract_field(viewpoint_text, "目标平台"),
        "duration": extract_field(viewpoint_text, "视频时长"),
        "visual_style": extract_field(viewpoint_text, "视觉风格"),
        "core_viewpoint": extract_field(viewpoint_text, "核心观点"),
        "viewpoint_text": viewpoint_text,
    }

    package_dir = output_root / f"{args.date}_{args.slug}"
    package_dir.mkdir(parents=True, exist_ok=True)

    created = []
    skipped = []

    for template_name, output_name in TEMPLATE_TO_OUTPUT.items():
        template_path = template_dir / template_name
        output_path = package_dir / output_name
        rendered = render_template(template_path.read_text(encoding="utf-8"), values)
        if write_file(output_path, rendered, args.overwrite):
            created.append(output_path.name)
        else:
            skipped.append(output_path.name)

    for output_name, template_text in VOICEOVER_TEMPLATES.items():
        output_path = package_dir / output_name
        rendered = render_template(template_text, values)
        if write_file(output_path, rendered, args.overwrite):
            created.append(output_path.name)
        else:
            skipped.append(output_path.name)

    print(f"Output folder: {package_dir}")
    if created:
        print("Created: " + ", ".join(created))
    if skipped:
        print("Skipped existing files: " + ", ".join(skipped))


if __name__ == "__main__":
    main()

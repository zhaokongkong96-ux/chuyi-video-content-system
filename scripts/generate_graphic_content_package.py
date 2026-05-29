#!/usr/bin/env python3
"""Generate a daily graphic-content production prompt/package from a local outline."""

from __future__ import annotations

import argparse
from datetime import date
from pathlib import Path
from string import Template

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTLINE_FILE = ROOT / "input" / "graphic_outline_template.md"
DEFAULT_TEMPLATE_FILE = ROOT / "templates" / "graphic_content_package_template.md"
DEFAULT_OUTPUT_DIR = ROOT / "output"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate a local daily graphic content package.")
    parser.add_argument("--date", default=date.today().isoformat(), help="Date for output folder, e.g. 2026-05-29")
    parser.add_argument("--slug", default="daily-graphic-content", help="English slug for output folder")
    parser.add_argument("--outline-file", default=str(DEFAULT_OUTLINE_FILE), help="Path to input graphic outline markdown")
    parser.add_argument("--template-file", default=str(DEFAULT_TEMPLATE_FILE), help="Path to graphic package template")
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
    outline_path = Path(args.outline_file)
    template_path = Path(args.template_file)
    output_root = Path(args.output_dir)

    outline_text = outline_path.read_text(encoding="utf-8").strip()
    values = {
        "brand_name": "初一",
        "account_positioning": "设计策略、产品方法、用户研究、趋势洞察",
        "tone": "专业、清晰、严谨、有方法论、有设计感",
        "date": args.date,
        "slug": args.slug,
        "topic_name": extract_field(outline_text, "主题名称"),
        "target_reader": extract_field(outline_text, "目标读者", "产品经理、设计师、运营、用户体验从业者、职场学习者"),
        "core_viewpoint": extract_field(outline_text, "核心观点"),
        "page_count": extract_field(outline_text, "页数建议", "7–9 页"),
        "visual_style": extract_field(outline_text, "视觉风格方向", "蓝色严谨专业风"),
        "interaction_required": extract_field(outline_text, "是否需要互动引导", "是"),
        "continue_previous_style": extract_field(outline_text, "是否需要延续上一期风格", "是"),
        "outline_text": outline_text,
    }

    package_dir = output_root / f"{args.date}_{args.slug}"
    package_dir.mkdir(parents=True, exist_ok=True)

    output_path = package_dir / "graphic_content_package.md"
    rendered = render_template(template_path.read_text(encoding="utf-8"), values)
    created = write_file(output_path, rendered, args.overwrite)

    print(f"Output folder: {package_dir}")
    if created:
        print(f"Created: {output_path.name}")
    else:
        print(f"Skipped existing file: {output_path.name}")


if __name__ == "__main__":
    main()

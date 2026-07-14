#!/usr/bin/env python3
"""Create and validate a BakaMusic theme@2.1 source folder."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path


SLUG_PATTERN = re.compile(r"^[A-Za-z0-9_-]+$")


def find_repo_root() -> Path:
    for candidate in Path(__file__).resolve().parents:
        if (candidate / "theme-contract.json").is_file() and (candidate / "themes").is_dir():
            return candidate
    raise SystemExit("Run this skill from a BakaThemePacks checkout")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--slug", required=True, help="themes/<slug> folder name")
    parser.add_argument("--name", required=True, help="display name")
    parser.add_argument("--author", required=True)
    parser.add_argument("--author-url")
    parser.add_argument("--description")
    parser.add_argument("--scheme", choices=("light", "dark"), default="light")
    parser.add_argument("--primary", default="#f17d34")
    parser.add_argument("--background")
    parser.add_argument("--text")
    parser.add_argument("--preview", help="hex colour or @/imgs/... path; defaults to primary")
    parser.add_argument("--tags", help="comma-separated labels; defaults to scheme + 简约")
    parser.add_argument("--no-validate", action="store_true")
    return parser.parse_args()


def run(command: list[str], cwd: Path) -> None:
    subprocess.run(command, cwd=cwd, check=True)


def main() -> None:
    args = parse_args()
    root = find_repo_root()

    if not SLUG_PATTERN.fullmatch(args.slug):
        raise SystemExit("--slug may only contain letters, digits, _ and -")

    theme_dir = root / "themes" / args.slug
    if theme_dir.exists():
        raise SystemExit(f"Refusing to overwrite existing theme: {theme_dir}")

    tags_data = json.loads((root / "tags.json").read_text(encoding="utf-8"))
    valid_tags = {item["label"] for item in tags_data["tags"]}
    tags = (
        [tag.strip() for tag in args.tags.split(",") if tag.strip()]
        if args.tags
        else (["暗色", "简约"] if args.scheme == "dark" else ["亮色", "简约"])
    )
    invalid_tags = [tag for tag in tags if tag not in valid_tags]
    if not 1 <= len(tags) <= 5 or invalid_tags:
        raise SystemExit(f"Invalid tags: {invalid_tags or tags}; choose 1-5 labels from tags.json")

    background = args.background or ("#17191f" if args.scheme == "dark" else "#fdfdfd")
    text = args.text or ("#f5f5f5" if args.scheme == "dark" else "#333333")
    preview = args.preview or args.primary

    config = {
        "spec": "bakamusic-theme@2",
        "name": args.name,
        "author": args.author,
        "version": "2.1.1",
        "preview": preview,
        "description": args.description or f"{args.name} 主题",
        "tags": tags,
        "scheme": args.scheme,
    }
    if args.author_url:
        config["authorUrl"] = args.author_url

    css = f"""/* bakamusic-theme@2.1 — semantic token pack */
:root {{
    --theme-primary: {args.primary};
    --theme-bg: {background};
    --theme-text: {text};
    --theme-scheme: {args.scheme};
    --theme-text-secondary: color-mix(in srgb, var(--theme-text) 72%, transparent);
    --theme-header-text: var(--theme-text);
    --theme-link: var(--theme-primary);
    --theme-divider: color-mix(in srgb, var(--theme-text) 12%, transparent);
    --theme-mask: rgba(0, 0, 0, 0.42);
    --theme-placeholder: color-mix(in srgb, var(--theme-text) 8%, var(--theme-bg));
    --theme-surface-alpha: 0.9;
    --theme-blur: 14px;
    --theme-bg-image: none;
    --theme-scrollbar-thumb: var(--theme-primary);
}}
"""

    theme_dir.mkdir(parents=False)
    (theme_dir / "config.json").write_text(
        json.dumps(config, ensure_ascii=False, indent=4) + "\n",
        encoding="utf-8",
    )
    (theme_dir / "index.css").write_text(css, encoding="utf-8")

    try:
        run(["node", ".scripts/upgrade-semantic-v2.mjs", "--themes", args.slug], root)
        if not args.no_validate:
            run(["node", ".scripts/validate.mjs", "--themes", args.slug], root)
    except (OSError, subprocess.CalledProcessError) as error:
        raise SystemExit(f"Theme created at {theme_dir}, but validation failed: {error}") from error

    print(f"Created BakaMusic theme: {theme_dir}")


if __name__ == "__main__":
    main()

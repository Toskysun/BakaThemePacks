---
name: create-baka-theme
description: Create, customize, migrate, and validate BakaMusic bakamusic-theme@2 / V2.1 theme packs in the BakaThemePacks repository. Use when asked to make a new BakaMusic theme, scaffold a theme source folder, turn a palette or wallpaper into a theme, prepare a .mftheme pack, or fix a theme until repository validation passes.
---

# Create Baka Theme

Create themes on `v2/source`; never edit generated `v2/prod` artifacts or add `id` to source `config.json`.

## Quick start

Run the deterministic scaffold command from the repository root:

```bash
python .agents/skills/create-baka-theme/scripts/create_theme.py \
  --slug aurora-night \
  --name "Aurora Night" \
  --author "Author" \
  --scheme dark \
  --primary "#65e7d2"
```

The command creates `themes/<slug>/`, expands the full V2.1 semantic coverage layer, and validates only the new theme. It refuses to overwrite an existing folder.

Useful options:

- `--background`, `--text`, `--preview`
- `--description`, `--author-url`
- `--tags "暗色,渐变"`
- `--no-validate` only when dependencies are intentionally unavailable

## Workflow

1. Read `docs/theme-spec-v2.md` for the normative client/theme boundary.
2. Read `docs/THEME_TOKENS.md` for every customizable token and its intended region.
3. Read `docs/theme-coverage-v2.md` when checking client coverage boundaries.
4. Read `docs/THEME_GUIDE.md` for images, iframe video backgrounds, packaging, size limits, and publishing.
5. Infer a stable slug, scheme, accessible palette, and 1–5 labels from `tags.json`.
6. Run the scaffold script rather than hand-copying another theme.
7. Customize only `config.json`, `index.css`, and pack assets under the new theme folder.
8. Run `node .scripts/validate.mjs --themes <slug>` after every substantial edit.
9. Smoke-test both glass and flat client styles before publishing.

## Contract rules

- Keep `index.css` to exactly one `:root` block containing public `--theme-*` declarations.
- Never use client selectors, private variables, `!important`, `@import`, layout overrides, or hidden scrollbars.
- Never declare any `--theme-detail-*` token; they are accepted only to load old packs and are rejected for new source themes.
- Treat the complete playback detail page and glass MusicBar artwork palette as client-owned behavior.
- Keep wallpaper transparency in `--theme-bg`; use high-opacity tinted `surface-*` values for every text-bearing region.
- Choose text and surface colors that remain readable over the intended wallpaper; visual judgment belongs to the theme author.
- Use `@/imgs/...` for pack assets and only `iframe.app` for dynamic backgrounds.
- Keep images at most 500 KB, videos at most 5 MB, and the whole theme at most 10 MB.
- Do not edit `meta.json` for a normal theme addition; publishing owns `id` and `createdAt`.

## Packaging

After validation, zip the contents of `themes/<slug>/` so `config.json` and `index.css` are at the archive root, then rename the archive to `.mftheme`. Do not package the outer `themes/<slug>` directory as an extra wrapper unless the client root finder is explicitly being tested.

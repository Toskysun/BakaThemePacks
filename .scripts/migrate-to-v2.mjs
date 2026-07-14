/**
 * Migrate all themes from MusicFree Desktop v2 tokens → bakamusic-theme@2
 *
 * Usage: node .scripts/migrate-to-v2.mjs
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const THEMES_DIR = path.join(ROOT, 'themes');
const SPEC = 'bakamusic-theme@2';

function extractVar(css, name) {
    const re = new RegExp(`--${name}\\s*:\\s*([^;]+);`);
    const m = css.match(re);
    return m ? m[1].trim() : null;
}

function parseRgbChannels(value) {
    if (!value) return null;
    const m = value.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
    if (!m) return null;
    return {
        r: Number(m[1]),
        g: Number(m[2]),
        b: Number(m[3]),
    };
}

function relativeLuminance({ r, g, b }) {
    const lin = [r, g, b].map((c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function guessScheme(textColor, bgColor) {
    const text = parseRgbChannels(textColor);
    if (text) {
        return relativeLuminance(text) > 0.55 ? 'dark' : 'light';
    }
    const bg = parseRgbChannels(bgColor);
    if (bg) {
        return relativeLuminance(bg) > 0.55 ? 'light' : 'dark';
    }
    return 'dark';
}

function withAlpha(rgbValue, alpha) {
    const ch = parseRgbChannels(rgbValue);
    if (!ch) return rgbValue;
    return `rgba(${ch.r}, ${ch.g}, ${ch.b}, ${alpha})`;
}

function bumpVersion(version) {
    if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
        return '2.0.0';
    }
    const [major] = version.split('.').map(Number);
    if (major >= 2) return version;
    return '2.0.0';
}

function buildIndexCss(tokens) {
    const lines = [
        '/* bakamusic-theme@2 — token-only pack (client owns chrome) */',
        ':root {',
        `    --theme-primary: ${tokens.primary};`,
        `    --theme-bg: ${tokens.bg};`,
        `    --theme-text: ${tokens.text};`,
        `    --theme-scheme: ${tokens.scheme};`,
    ];
    if (tokens.textSecondary) {
        lines.push(`    --theme-text-secondary: ${tokens.textSecondary};`);
    }
    if (tokens.textOnPrimary) {
        lines.push(`    --theme-text-on-primary: ${tokens.textOnPrimary};`);
    }
    if (tokens.headerText) {
        lines.push(`    --theme-header-text: ${tokens.headerText};`);
    }
    if (tokens.link) {
        lines.push(`    --theme-link: ${tokens.link};`);
    }
    if (tokens.divider) {
        lines.push(`    --theme-divider: ${tokens.divider};`);
    }
    if (tokens.mask) {
        lines.push(`    --theme-mask: ${tokens.mask};`);
    }
    if (tokens.placeholder) {
        lines.push(`    --theme-placeholder: ${tokens.placeholder};`);
    }
    if (tokens.surfaceAlpha != null) {
        lines.push(`    --theme-surface-alpha: ${tokens.surfaceAlpha};`);
    }
    if (tokens.blur) {
        lines.push(`    --theme-blur: ${tokens.blur};`);
    }
    if (tokens.bgImage && tokens.bgImage !== 'none') {
        lines.push(`    --theme-bg-image: ${tokens.bgImage};`);
    }
    if (tokens.scrollbarThumb) {
        lines.push(`    --theme-scrollbar-thumb: ${tokens.scrollbarThumb};`);
    }
    lines.push('}');
    lines.push('');
    return lines.join('\n');
}

async function migrateTheme(folderName) {
    const dir = path.join(THEMES_DIR, folderName);
    const cssPath = path.join(dir, 'index.css');
    const configPath = path.join(dir, 'config.json');

    const css = await fs.readFile(cssPath, 'utf-8');
    const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

    // Already V2?
    if (config.spec === SPEC && css.includes('--theme-primary')) {
        return { name: folderName, status: 'skip' };
    }

    const primary =
        extractVar(css, 'color-fill-brand') ||
        extractVar(css, 'theme-primary') ||
        extractVar(css, 'primaryColor') ||
        'rgb(241, 125, 52)';

    const bgBase =
        extractVar(css, 'color-bg-base') ||
        extractVar(css, 'theme-bg') ||
        extractVar(css, 'backgroundColor') ||
        'rgb(253, 253, 253)';

    const text =
        extractVar(css, 'color-text-primary') ||
        extractVar(css, 'theme-text') ||
        extractVar(css, 'textColor') ||
        'rgb(51, 51, 51)';

    const textSecondary =
        extractVar(css, 'color-text-secondary') ||
        extractVar(css, 'color-text-muted') ||
        null;

    const textOnPrimary =
        extractVar(css, 'color-text-on-brand') || 'rgb(18, 18, 18)';

    const mask = extractVar(css, 'color-bg-overlay') || null;
    const placeholder = extractVar(css, 'color-bg-placeholder') || null;
    const divider = extractVar(css, 'color-border-default') || null;

    let bgImage = extractVar(css, 'bg-image') || extractVar(css, 'theme-bg-image');
    if (bgImage === 'none') bgImage = null;

    // Prefer translucent bg so iframe/wallpaper can show through
    const hasIframe = Boolean(config.iframe?.app);
    const bg = hasIframe || bgImage
        ? withAlpha(bgBase, 0.42)
        : bgBase;

    const scheme = config.scheme === 'light' || config.scheme === 'dark'
        ? config.scheme
        : guessScheme(text, bgBase);

    const tokens = {
        primary,
        bg,
        text,
        scheme,
        textSecondary,
        textOnPrimary,
        headerText: text,
        link: primary,
        divider,
        mask,
        placeholder,
        surfaceAlpha: hasIframe || bgImage ? 0.42 : 0.88,
        blur: hasIframe || bgImage ? '14px' : '10px',
        bgImage,
        scrollbarThumb: primary,
    };

    await fs.writeFile(cssPath, buildIndexCss(tokens), 'utf-8');

    const nextConfig = {
        spec: SPEC,
        name: config.name,
        author: config.author,
        version: bumpVersion(config.version),
        preview: config.preview,
        description: config.description || config.name,
        tags: config.tags || ['其他'],
        scheme,
    };
    if (config.authorUrl) nextConfig.authorUrl = config.authorUrl;
    if (config.iframe) nextConfig.iframe = { app: config.iframe.app };
    // Drop unknown legacy fields intentionally

    await fs.writeFile(configPath, `${JSON.stringify(nextConfig, null, 4)}\n`, 'utf-8');
    return { name: folderName, status: 'migrated', scheme };
}

async function main() {
    const entries = await fs.readdir(THEMES_DIR, { withFileTypes: true });
    const folders = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();

    console.log(`Migrating ${folders.length} themes → ${SPEC}\n`);
    let migrated = 0;
    let skipped = 0;

    for (const folder of folders) {
        try {
            const result = await migrateTheme(folder);
            if (result.status === 'skip') {
                skipped++;
                console.log(`  · skip  ${folder}`);
            } else {
                migrated++;
                console.log(`  ✓ ${folder} (${result.scheme})`);
            }
        } catch (e) {
            console.error(`  ✗ ${folder}: ${e.message}`);
            process.exitCode = 1;
        }
    }

    console.log(`\nDone. migrated=${migrated} skipped=${skipped}`);
}

main();

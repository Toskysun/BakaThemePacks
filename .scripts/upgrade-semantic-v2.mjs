/**
 * Fill the semantic coverage layer introduced by theme@2.1.
 * Safe to run repeatedly. Author values win except retired client-owned detail
 * tokens and the old translucent popover default, which are migrated.
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    CLIENT_OWNED_COMPATIBILITY_TOKENS,
    parseThemeCss,
} from './theme-contract.mjs';
import {
    chooseReadableText,
    createReadableSemanticLayer,
} from './theme-contrast.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const THEMES_DIR = path.join(ROOT, 'themes');

const SEMANTIC_DEFAULTS = new Map([
    ['--theme-primary-hover', 'color-mix(in srgb, var(--theme-primary) 84%, black)'],
    ['--theme-primary-active', 'color-mix(in srgb, var(--theme-primary) 72%, black)'],
    ['--theme-text-secondary', 'color-mix(in srgb, var(--theme-text) 72%, transparent)'],
    ['--theme-text-muted', 'color-mix(in srgb, var(--theme-text) 52%, transparent)'],
    ['--theme-header-text', 'var(--theme-text)'],
    ['--theme-link', 'var(--theme-primary)'],
    ['--theme-success', '#08a34c'],
    ['--theme-warning', '#d97706'],
    ['--theme-danger', '#fc5f5f'],
    ['--theme-info', '#0a95c8'],
    ['--theme-divider', 'color-mix(in srgb, var(--theme-text) 12%, transparent)'],
    ['--theme-mask', 'rgba(0, 0, 0, 0.42)'],
    ['--theme-placeholder', 'color-mix(in srgb, var(--theme-text) 8%, var(--theme-bg))'],
    ['--theme-surface-alpha', '0.9'],
    ['--theme-surface-border', 'var(--theme-divider)'],
    ['--theme-surface-border-strong', 'color-mix(in srgb, var(--theme-text) 22%, transparent)'],
    ['--theme-shadow', '0 22px 48px color-mix(in srgb, black 22%, transparent)'],
    ['--theme-shadow-soft', '0 12px 28px color-mix(in srgb, black 14%, transparent)'],
    ['--theme-interactive', 'color-mix(in srgb, var(--theme-text) 8%, transparent)'],
    ['--theme-interactive-hover', 'color-mix(in srgb, var(--theme-primary) 14%, transparent)'],
    ['--theme-interactive-active', 'color-mix(in srgb, var(--theme-primary) 22%, transparent)'],
    ['--theme-page-bg', 'transparent'],
    ['--theme-card-bg', 'var(--theme-surface)'],
    ['--theme-card-bg-hover', 'var(--theme-surface-strong)'],
    ['--theme-card-border', 'var(--theme-surface-border)'],
    ['--theme-header-bg', 'var(--theme-surface-strong)'],
    ['--theme-header-border', 'var(--theme-surface-border)'],
    ['--theme-header-control-bg', 'var(--theme-interactive)'],
    ['--theme-header-control-hover-bg', 'var(--theme-interactive-hover)'],
    ['--theme-header-search-bg', 'var(--theme-surface-strong)'],
    ['--theme-header-search-border', 'var(--theme-surface-border)'],
    ['--theme-sidebar-bg', 'var(--theme-surface)'],
    ['--theme-sidebar-text', 'var(--theme-text)'],
    ['--theme-sidebar-text-secondary', 'var(--theme-text-secondary)'],
    ['--theme-sidebar-text-muted', 'var(--theme-text-muted)'],
    ['--theme-sidebar-border', 'var(--theme-surface-border)'],
    ['--theme-sidebar-item-hover', 'var(--theme-interactive-hover)'],
    ['--theme-sidebar-item-active', 'var(--theme-interactive-active)'],
    ['--theme-sidebar-item-active-border', 'color-mix(in srgb, var(--theme-primary) 42%, transparent)'],
    ['--theme-player-bg', 'var(--theme-surface)'],
    ['--theme-player-bg-alt', 'var(--theme-surface-strong)'],
    ['--theme-player-text', 'var(--theme-text)'],
    ['--theme-player-text-secondary', 'var(--theme-text-secondary)'],
    ['--theme-player-accent', 'var(--theme-primary)'],
    ['--theme-player-text-on-accent', 'var(--theme-text-on-primary)'],
    ['--theme-player-border', 'var(--theme-surface-border)'],
    ['--theme-list-bg', 'var(--theme-card-bg)'],
    ['--theme-list-row-bg', 'transparent'],
    ['--theme-list-row-alt-bg', 'color-mix(in srgb, var(--theme-text) 4%, transparent)'],
    ['--theme-list-row-hover-bg', 'var(--theme-interactive-hover)'],
    ['--theme-list-row-active-bg', 'var(--theme-interactive-active)'],
    ['--theme-list-row-border', 'var(--theme-divider)'],
    ['--theme-panel-bg', 'var(--theme-surface-strong)'],
    ['--theme-panel-text', 'var(--theme-text)'],
    ['--theme-panel-text-secondary', 'var(--theme-text-secondary)'],
    ['--theme-panel-border', 'var(--theme-surface-border)'],
    ['--theme-panel-row-bg', 'var(--theme-interactive)'],
    ['--theme-panel-row-hover-bg', 'var(--theme-interactive-hover)'],
    ['--theme-panel-row-border', 'var(--theme-divider)'],
    ['--theme-input-bg', 'var(--theme-surface-strong)'],
    ['--theme-input-bg-hover', 'var(--theme-card-bg-hover)'],
    ['--theme-input-border', 'var(--theme-surface-border)'],
    ['--theme-input-border-active', 'var(--theme-primary)'],
    ['--theme-popover-text', 'var(--theme-text)'],
    ['--theme-popover-text-secondary', 'var(--theme-text-secondary)'],
    ['--theme-popover-border', 'var(--theme-surface-border-strong)'],
    ['--theme-blur', '14px'],
    ['--theme-bg-image', 'none'],
    ['--theme-scrollbar-track', 'transparent'],
    ['--theme-scrollbar-thumb', 'var(--theme-primary)'],
    ['--theme-scrollbar-thumb-hover', 'var(--theme-primary-hover)'],
    ['--theme-scrollbar-thumb-active', 'var(--theme-primary-active)'],
    ['--theme-radius-control', '10px'],
    ['--theme-radius-card', '18px'],
    ['--theme-radius-panel', '18px'],
    ['--theme-radius-cover', '12px'],
]);

function serialise(tokens) {
    const lines = ['/* bakamusic-theme@2.1 — semantic token pack */', ':root {'];
    for (const [token, value] of tokens) lines.push(`    ${token}: ${value};`);
    lines.push('}', '');
    return lines.join('\n');
}

const themesFlagIndex = process.argv.indexOf('--themes');
const selectedThemes = themesFlagIndex >= 0
    ? new Set((process.argv[themesFlagIndex + 1] ?? '').split(',').map((name) => name.trim()).filter(Boolean))
    : null;
if (themesFlagIndex >= 0 && !selectedThemes.size) {
    throw new Error('--themes requires one or more comma-separated theme folders');
}

const entries = await fs.readdir(THEMES_DIR, { withFileTypes: true });
const directoryEntries = entries.filter((item) => item.isDirectory());
if (selectedThemes) {
    const availableThemes = new Set(directoryEntries.map((entry) => entry.name));
    const missingThemes = [...selectedThemes].filter((name) => !availableThemes.has(name));
    if (missingThemes.length) throw new Error(`Theme folders not found: ${missingThemes.join(', ')}`);
}

let upgraded = 0;
for (const entry of directoryEntries) {
    if (selectedThemes && !selectedThemes.has(entry.name)) continue;
    const themeDir = path.join(THEMES_DIR, entry.name);
    const cssPath = path.join(themeDir, 'index.css');
    const configPath = path.join(themeDir, 'config.json');
    const tokens = parseThemeCss(await fs.readFile(cssPath, 'utf-8'));
    for (const token of CLIENT_OWNED_COMPATIBILITY_TOKENS) tokens.delete(token);
    if (!tokens.has('--theme-text-on-primary')) {
        tokens.set('--theme-text-on-primary', chooseReadableText(tokens.get('--theme-primary'), tokens));
    }
    const readableLayer = createReadableSemanticLayer(tokens.get('--theme-scheme'), tokens);
    for (const token of ['--theme-surface', '--theme-surface-strong', '--theme-surface-muted']) {
        const value = readableLayer.get(token);
        if (!tokens.has(token)) tokens.set(token, value);
    }
    for (const [token, value] of SEMANTIC_DEFAULTS) {
        if (!tokens.has(token)) tokens.set(token, value);
    }
    if (!tokens.has('--theme-popover-bg') || tokens.get('--theme-popover-bg') === 'var(--theme-surface-strong)') {
        const popoverBase = tokens.get('--theme-scheme') === 'dark' ? '#17171d' : '#f8f8fa';
        tokens.set('--theme-popover-bg', `color-mix(in srgb, var(--theme-primary) 8%, ${popoverBase})`);
    }
    await fs.writeFile(cssPath, serialise(tokens), 'utf-8');

    const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
    if (/^2\.0\./.test(config.version)) config.version = '2.1.0';
    await fs.writeFile(configPath, `${JSON.stringify(config, null, 4)}\n`, 'utf-8');
    upgraded += 1;
}

console.log(`Upgraded ${upgraded} themes to the theme@2.1 semantic coverage layer.`);

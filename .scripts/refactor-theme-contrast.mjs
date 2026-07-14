/**
 * Rebuild every theme's readable semantic layer from its scheme and preview.
 * Wallpaper tint stays theme-owned; text-bearing surfaces get a contrast-safe
 * neutral base with a small primary-colour tint.
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { parseThemeCss } from './theme-contract.mjs';
import {
    createReadableSemanticLayer,
    relativeLuminance,
    resolveColour,
} from './theme-contrast.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const THEMES_DIR = path.join(ROOT, 'themes');

function serialise(tokens) {
    const lines = ['/* bakamusic-theme@2.1 — semantic token pack */', ':root {'];
    for (const [token, value] of tokens) lines.push(`    ${token}: ${value};`);
    lines.push('}', '');
    return lines.join('\n');
}

async function getPreviewLuminance(themeDir, preview) {
    if (!preview.startsWith('@/')) return null;
    const previewPath = path.join(themeDir, preview.slice(2));
    try {
        const { data, info } = await sharp(previewPath)
            .resize(64, 64, { fit: 'fill' })
            .removeAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });
        let luminanceTotal = 0;
        for (let index = 0; index < data.length; index += info.channels) {
            luminanceTotal += relativeLuminance([data[index], data[index + 1], data[index + 2], 1]);
        }
        return luminanceTotal / (data.length / info.channels);
    } catch {
        return null;
    }
}

function inferScheme(currentScheme, previewLuminance, tokens) {
    if (previewLuminance != null) {
        if (previewLuminance < 0.4) return 'dark';
        if (previewLuminance > 0.62) return 'light';
        return currentScheme;
    }
    const background = resolveColour(tokens.get('--theme-bg'), tokens);
    if (background?.[3] >= 0.9) {
        const luminance = relativeLuminance(background);
        if (luminance < 0.32) return 'dark';
        if (luminance > 0.68) return 'light';
    }
    return currentScheme;
}

function applyReadableLayer(tokens, scheme) {
    for (const [token, value] of createReadableSemanticLayer(scheme, tokens)) {
        tokens.set(token, value);
    }
}

const entries = (await fs.readdir(THEMES_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .sort((first, second) => first.name.localeCompare(second.name));
let schemeChanges = 0;
for (const entry of entries) {
    const themeDir = path.join(THEMES_DIR, entry.name);
    const cssPath = path.join(themeDir, 'index.css');
    const configPath = path.join(themeDir, 'config.json');
    const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
    const tokens = parseThemeCss(await fs.readFile(cssPath, 'utf-8'));
    const previewLuminance = await getPreviewLuminance(themeDir, config.preview);
    const scheme = inferScheme(config.scheme, previewLuminance, tokens);
    if (scheme !== config.scheme) {
        console.log(`${entry.name}: ${config.scheme} -> ${scheme} (preview ${previewLuminance?.toFixed(3) ?? 'n/a'})`);
        config.scheme = scheme;
        schemeChanges += 1;
    }
    applyReadableLayer(tokens, scheme);
    await fs.writeFile(cssPath, serialise(tokens), 'utf-8');
    await fs.writeFile(configPath, `${JSON.stringify(config, null, 4)}\n`, 'utf-8');
}

console.log(`Refactored ${entries.length} themes; changed ${schemeChanges} schemes.`);

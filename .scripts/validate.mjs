/**
 * BakaMusic ThemePacks validator (bakamusic-theme@2)
 *
 * Usage:
 *   node .scripts/validate.mjs
 *   node .scripts/validate.mjs --themes a,b,c
 *   node .scripts/validate.mjs --changed-only
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const THEMES_DIR = path.join(ROOT, 'themes');
const SPEC = 'bakamusic-theme@2';

const SIZE_LIMITS = {
    IMAGE_MAX: 500 * 1024,
    VIDEO_MAX: 5 * 1024 * 1024,
    THEME_TOTAL_MAX: 10 * 1024 * 1024,
};

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const VIDEO_EXTS = new Set(['.mp4', '.webm']);
const ALLOWED_EXTS = new Set([
    ...IMAGE_EXTS, ...VIDEO_EXTS,
    '.css', '.html', '.js', '.json', '.md',
]);

const FOLDER_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;
const COLOR_VALUE_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const SEMVER_REGEX = /^\d+\.\d+\.\d+$/;
const PREVIEW_PATH_REGEX = /^@\/.+\/.+$/;

const REQUIRED_CSS_TOKENS = [
    '--theme-primary',
    '--theme-bg',
    '--theme-text',
    '--theme-scheme',
];

const ALLOWED_CSS_TOKENS = new Set([
    ...REQUIRED_CSS_TOKENS,
    '--theme-text-secondary',
    '--theme-text-on-primary',
    '--theme-header-text',
    '--theme-link',
    '--theme-divider',
    '--theme-mask',
    '--theme-placeholder',
    '--theme-surface-alpha',
    '--theme-blur',
    '--theme-bg-image',
    '--theme-scrollbar-thumb',
]);

/** Client internals / legacy MusicFree selectors — banned in theme CSS */
const BANNED_SELECTOR_PATTERNS = [
    /\.music-bar-container\b/,
    /\.header-container\b/,
    /\.sidebar-container\b/,
    /\.body-container\b/,
    /\.app-container\b/,
    /\.music-detail/,
    /\.l-sidebar\b/,
    /\.l-player-bar\b/,
    /body\[data-window/,
    /#root\s*\{/,
    /::-webkit-scrollbar[^{]*\{\s*display\s*:\s*none/i,
];

const BANNED_TOKEN_PATTERNS = [
    /--color-bg-/,
    /--color-fill-/,
    /--color-text-/,
    /--color-border-/,
    /--primaryColor\b/,
    /--backgroundColor\b/,
    /--textColor\b/,
];

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

async function loadTags() {
    const raw = await fs.readFile(path.join(ROOT, 'tags.json'), 'utf-8');
    const data = JSON.parse(raw);
    return new Set(data.tags.map((t) => t.label));
}

async function getThemeFolders() {
    const entries = await fs.readdir(THEMES_DIR, { withFileTypes: true });
    return entries
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort();
}

async function getAllFiles(dir) {
    const results = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...(await getAllFiles(fullPath)));
        } else {
            results.push(fullPath);
        }
    }
    return results;
}

class ThemeValidator {
    constructor(themeName, themeDir, validTags) {
        this.name = themeName;
        this.dir = themeDir;
        this.validTags = validTags;
        this.errors = [];
        this.warnings = [];
    }

    error(msg) { this.errors.push(msg); }
    warn(msg) { this.warnings.push(msg); }

    validateFolderName() {
        if (!FOLDER_NAME_REGEX.test(this.name)) {
            this.error(`文件夹名 "${this.name}" 不符合规范（仅允许字母、数字、连字符、下划线）`);
        }
    }

    async validateRequiredFiles() {
        for (const file of ['config.json', 'index.css']) {
            try {
                await fs.access(path.join(this.dir, file));
            } catch {
                this.error(`缺少 ${file}`);
            }
        }
    }

    async validateDirectoryStructure() {
        const entries = await fs.readdir(this.dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory() && !FOLDER_NAME_REGEX.test(entry.name)) {
                this.error(`子目录名不符合规范: ${entry.name}/`);
            }
        }
    }

    async validateConfig() {
        const configPath = path.join(this.dir, 'config.json');
        let config;
        try {
            config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
        } catch (e) {
            this.error(`config.json 解析失败: ${e.message}`);
            return null;
        }

        if (config.spec !== SPEC) {
            this.error(`config.spec 必须为 "${SPEC}"（当前: ${config.spec ?? 'missing'}）`);
        }

        const required = ['name', 'author', 'preview', 'description', 'version', 'tags'];
        for (const field of required) {
            if (config[field] === undefined || config[field] === null || config[field] === '') {
                this.error(`config.json 缺少必填字段: ${field}`);
            }
        }

        if ('id' in config) {
            this.error('config.json 中不允许包含 "id" 字段（由 meta.json 统一管理）');
        }
        if ('iframes' in config) {
            this.error('config.json 拼写错误："iframes" 应为 "iframe"');
        }

        if (config.version && !SEMVER_REGEX.test(config.version)) {
            this.error(`version 格式不符合 semver: "${config.version}"`);
        }

        if (config.scheme && config.scheme !== 'light' && config.scheme !== 'dark') {
            this.error(`scheme 必须是 light 或 dark（当前: ${config.scheme}）`);
        }

        if (Array.isArray(config.tags)) {
            if (config.tags.length < 1) this.error('tags 至少需要 1 个标签');
            if (config.tags.length > 5) this.error('tags 最多 5 个标签');
            for (const tag of config.tags) {
                if (!this.validTags.has(tag)) {
                    this.error(`无效标签: "${tag}"`);
                }
            }
            if (config.iframe && !config.tags.includes('动态')) {
                this.error('含 iframe 的动态主题必须包含 "动态" 标签');
            }
        }

        if (config.preview) {
            if (config.preview.startsWith('@/')) {
                if (!PREVIEW_PATH_REGEX.test(config.preview)) {
                    this.error(`preview 路径格式不正确: "${config.preview}"`);
                }
                const previewFile = path.join(this.dir, config.preview.replace('@/', ''));
                try {
                    await fs.access(previewFile);
                } catch {
                    this.error(`preview 引用的文件不存在: ${config.preview}`);
                }
            } else if (config.preview.startsWith('#')) {
                if (!COLOR_VALUE_REGEX.test(config.preview)) {
                    this.error(`preview 颜色值格式不正确: "${config.preview}"`);
                }
            } else {
                this.error(`preview 格式不正确: "${config.preview}"`);
            }
        }

        if (config.iframe) {
            if (typeof config.iframe !== 'object' || !config.iframe.app) {
                this.error('iframe 配置格式不正确（需要 { "app": "@/iframes/xxx.html" }）');
            } else {
                const iframePath = path.join(this.dir, config.iframe.app.replace('@/', ''));
                try {
                    await fs.access(iframePath);
                } catch {
                    this.error(`iframe 引用的文件不存在: ${config.iframe.app}`);
                }
                const extraKeys = Object.keys(config.iframe).filter((k) => k !== 'app');
                if (extraKeys.length) {
                    this.error(`iframe 仅允许 app 槽位，多余: ${extraKeys.join(', ')}`);
                }
            }
        }

        const allowedFields = new Set([
            'spec', 'name', 'author', 'authorUrl', 'preview', 'description',
            'version', 'tags', 'iframe', 'scheme',
        ]);
        for (const key of Object.keys(config)) {
            if (!allowedFields.has(key)) {
                this.warn(`config.json 包含未知字段: "${key}"`);
            }
        }

        return config;
    }

    async validateCss(config) {
        const cssPath = path.join(this.dir, 'index.css');
        let css;
        try {
            css = await fs.readFile(cssPath, 'utf-8');
        } catch {
            return;
        }

        for (const token of REQUIRED_CSS_TOKENS) {
            if (!css.includes(token)) {
                this.error(`index.css 缺少必填 token: ${token}`);
            }
        }

        // Collect custom properties declared in the file
        const declared = [...css.matchAll(/--([a-zA-Z0-9-]+)\s*:/g)].map((m) => `--${m[1]}`);
        for (const token of declared) {
            if (!ALLOWED_CSS_TOKENS.has(token)) {
                this.error(`index.css 含未在契约中的 token: ${token}`);
            }
        }

        for (const re of BANNED_SELECTOR_PATTERNS) {
            if (re.test(css)) {
                this.error(`index.css 含禁止选择器/规则: ${re}`);
            }
        }

        for (const re of BANNED_TOKEN_PATTERNS) {
            if (re.test(css)) {
                this.error(`index.css 含废弃 token 模式: ${re}`);
            }
        }

        // Outside :root rules (rough): any selector block that isn't :root
        const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
        const nonRootBlocks = withoutComments.match(/(^|})\s*([^@{}][^{]*)\{/g) || [];
        for (const block of nonRootBlocks) {
            const selector = block.replace(/^}/, '').replace(/\{$/, '').trim();
            if (!selector || selector === ':root' || selector.startsWith('@')) continue;
            if (selector.includes(':root')) continue;
            this.error(`index.css 禁止非 :root 规则: "${selector}"`);
        }

        if (config?.scheme) {
            const schemeMatch = css.match(/--theme-scheme\s*:\s*(light|dark)\s*;/);
            if (schemeMatch && schemeMatch[1] !== config.scheme) {
                this.warn(`config.scheme (${config.scheme}) 与 CSS --theme-scheme (${schemeMatch[1]}) 不一致`);
            }
        }
    }

    async validateResourceSizes() {
        const files = await getAllFiles(this.dir);
        let totalSize = 0;

        for (const filePath of files) {
            const stat = await fs.stat(filePath);
            const ext = path.extname(filePath).toLowerCase();
            const relativePath = path.relative(this.dir, filePath);
            totalSize += stat.size;

            if (!ALLOWED_EXTS.has(ext)) {
                this.warn(`文件格式不在白名单中: ${relativePath} (${ext})`);
            }
            if (IMAGE_EXTS.has(ext) && stat.size > SIZE_LIMITS.IMAGE_MAX) {
                this.error(`图片过大: ${relativePath} (${formatSize(stat.size)} > ${formatSize(SIZE_LIMITS.IMAGE_MAX)})`);
            }
            if (VIDEO_EXTS.has(ext) && stat.size > SIZE_LIMITS.VIDEO_MAX) {
                this.error(`视频过大: ${relativePath} (${formatSize(stat.size)} > ${formatSize(SIZE_LIMITS.VIDEO_MAX)})`);
            }
        }

        if (totalSize > SIZE_LIMITS.THEME_TOTAL_MAX) {
            this.error(`主题包总大小超限: ${formatSize(totalSize)} > ${formatSize(SIZE_LIMITS.THEME_TOTAL_MAX)}`);
        }
    }

    async validate() {
        this.validateFolderName();
        await this.validateRequiredFiles();
        await this.validateDirectoryStructure();
        const config = await this.validateConfig();
        await this.validateCss(config);
        await this.validateResourceSizes();
        return {
            name: this.name,
            errors: this.errors,
            warnings: this.warnings,
            passed: this.errors.length === 0,
        };
    }
}

async function main() {
    const args = process.argv.slice(2);
    let targetThemes = null;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--themes' && args[i + 1]) {
            targetThemes = args[i + 1].split(',').map((s) => s.trim()).filter(Boolean);
            i++;
        }
        if (args[i] === '--changed-only') {
            const allThemes = await getThemeFolders();
            console.log(allThemes.join(','));
            process.exit(0);
        }
    }

    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║  BakaMusic ThemePacks 校验 (theme@2)     ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');

    const validTags = await loadTags();
    const allThemes = await getThemeFolders();
    const themes = targetThemes
        ? targetThemes.filter((t) => allThemes.includes(t))
        : allThemes;

    if (targetThemes) {
        const notFound = targetThemes.filter((t) => !allThemes.includes(t));
        if (notFound.length) {
            console.log(`⚠️  未找到的主题: ${notFound.join(', ')}`);
        }
    }

    console.log(`📋 待校验主题: ${themes.length} 个\n`);

    let passCount = 0;
    let failCount = 0;

    for (const themeName of themes) {
        const themeDir = path.join(THEMES_DIR, themeName);
        const validator = new ThemeValidator(themeName, themeDir, validTags);
        const result = await validator.validate();

        console.log(`🔍 ${themeName}`);
        if (result.passed) {
            passCount++;
            for (const w of result.warnings) console.log(`   ⚠️  ${w}`);
            console.log('   ✅ 通过');
        } else {
            failCount++;
            for (const e of result.errors) console.log(`   ❌ ${e}`);
            for (const w of result.warnings) console.log(`   ⚠️  ${w}`);
        }
        console.log('');
    }

    console.log('────────────────────────────────────────────');
    console.log(`📊 校验结果: ${themes.length} 个主题, ✅ ${passCount} 通过, ❌ ${failCount} 失败`);
    console.log('');

    if (failCount > 0) process.exit(1);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});

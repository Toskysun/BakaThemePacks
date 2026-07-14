import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const contract = JSON.parse(
    await fs.readFile(path.join(ROOT, 'theme-contract.json'), 'utf-8'),
);

export const THEME_SPEC = contract.spec;
export const REQUIRED_THEME_TOKENS = contract.requiredTokens;
export const THEME_TOKENS = contract.tokens;
export const CLIENT_OWNED_COMPATIBILITY_TOKENS = contract.clientOwnedCompatibilityTokens ?? [];

const TOKEN_SET = new Set(THEME_TOKENS);
const COMMENT_PATTERN = /\/\*[\s\S]*?\*\//g;
const ROOT_BLOCK_PATTERN = /^\s*:root\s*\{([\s\S]*)\}\s*$/;
const UNSAFE_VALUE_PATTERN = /[{}]|@import|expression\s*\(|javascript\s*:/i;
const VARIABLE_REFERENCE_PATTERN = /var\(\s*(--[a-zA-Z0-9-]+)/g;

function splitDeclarations(rawDeclarations) {
    const declarations = [];
    let current = '';
    let quote = null;
    let parenthesesDepth = 0;

    for (let index = 0; index < rawDeclarations.length; index += 1) {
        const character = rawDeclarations[index];
        const previous = rawDeclarations[index - 1];
        if ((character === '"' || character === "'") && previous !== '\\') {
            quote = quote === character ? null : quote ?? character;
        } else if (!quote && character === '(') {
            parenthesesDepth += 1;
        } else if (!quote && character === ')') {
            parenthesesDepth -= 1;
            if (parenthesesDepth < 0) throw new Error('存在未配对的右括号');
        }

        if (!quote && parenthesesDepth === 0 && character === ';') {
            if (current.trim()) declarations.push(current.trim());
            current = '';
        } else {
            current += character;
        }
    }
    if (quote || parenthesesDepth !== 0) throw new Error('存在未结束的 CSS 值');
    if (current.trim()) declarations.push(current.trim());
    return declarations;
}

export function parseThemeCss(rawCss) {
    const withoutComments = rawCss.replace(COMMENT_PATTERN, '');
    const rootMatch = withoutComments.match(ROOT_BLOCK_PATTERN);
    if (!rootMatch) throw new Error('必须且只能包含一个 :root 规则');

    const tokens = new Map();
    for (const declaration of splitDeclarations(rootMatch[1])) {
        const colonIndex = declaration.indexOf(':');
        if (colonIndex < 1) throw new Error(`声明格式错误: ${declaration}`);
        const token = declaration.slice(0, colonIndex).trim();
        const value = declaration.slice(colonIndex + 1).trim();
        if (!TOKEN_SET.has(token)) throw new Error(`未定义的公开 token: ${token}`);
        if (tokens.has(token)) throw new Error(`重复 token: ${token}`);
        if (!value || value.includes('!important') || UNSAFE_VALUE_PATTERN.test(value)) {
            throw new Error(`${token} 的值不合法`);
        }
        if (token === '--theme-scheme' && value !== 'light' && value !== 'dark') {
            throw new Error('--theme-scheme 必须为 light 或 dark');
        }
        if (token === '--theme-surface-alpha') {
            const alpha = Number(value);
            if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
                throw new Error('--theme-surface-alpha 必须在 0 到 1 之间');
            }
        }
        for (const match of value.matchAll(VARIABLE_REFERENCE_PATTERN)) {
            if (!TOKEN_SET.has(match[1])) {
                throw new Error(`${token} 引用了客户端私有 token: ${match[1]}`);
            }
        }
        tokens.set(token, value);
    }
    for (const token of REQUIRED_THEME_TOKENS) {
        if (!tokens.has(token)) throw new Error(`缺少必填 token: ${token}`);
    }
    return tokens;
}

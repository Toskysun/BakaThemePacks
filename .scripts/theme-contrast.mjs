const NAMED_COLOURS = new Map([
    ['black', [0, 0, 0, 1]],
    ['white', [255, 255, 255, 1]],
    ['transparent', [0, 0, 0, 0]],
]);

function splitTopLevel(value) {
    const parts = [];
    let current = '';
    let depth = 0;
    for (const character of value) {
        if (character === '(') depth += 1;
        if (character === ')') depth -= 1;
        if (character === ',' && depth === 0) {
            parts.push(current.trim());
            current = '';
        } else {
            current += character;
        }
    }
    if (current.trim()) parts.push(current.trim());
    return parts;
}

function parseChannel(value) {
    return value.endsWith('%')
        ? Number(value.slice(0, -1)) * 2.55
        : Number(value);
}

function parseAlpha(value = '1') {
    return value.endsWith('%')
        ? Number(value.slice(0, -1)) / 100
        : Number(value);
}

function mixColours(first, second, firstWeight, secondWeight) {
    const totalWeight = firstWeight + secondWeight;
    const normalizedFirst = firstWeight / totalWeight;
    const normalizedSecond = secondWeight / totalWeight;
    const alpha = first[3] * normalizedFirst + second[3] * normalizedSecond;
    if (alpha === 0) return [0, 0, 0, 0];
    return [
        (first[0] * first[3] * normalizedFirst + second[0] * second[3] * normalizedSecond) / alpha,
        (first[1] * first[3] * normalizedFirst + second[1] * second[3] * normalizedSecond) / alpha,
        (first[2] * first[3] * normalizedFirst + second[2] * second[3] * normalizedSecond) / alpha,
        alpha,
    ];
}

function parseMixStop(value, tokens, stack) {
    const percentageMatch = value.match(/^(.*)\s+([0-9.]+)%$/);
    return {
        colour: resolveColour(percentageMatch?.[1] ?? value, tokens, stack),
        weight: percentageMatch ? Number(percentageMatch[2]) / 100 : null,
    };
}

export function resolveColour(value, tokens = new Map(), stack = new Set()) {
    const normalized = value.trim();
    const variableMatch = normalized.match(/^var\(\s*(--theme-[a-z0-9-]+)\s*\)$/i);
    if (variableMatch) {
        const token = variableMatch[1];
        if (stack.has(token) || !tokens.has(token)) return null;
        const nextStack = new Set(stack).add(token);
        return resolveColour(tokens.get(token), tokens, nextStack);
    }

    if (NAMED_COLOURS.has(normalized.toLowerCase())) {
        return [...NAMED_COLOURS.get(normalized.toLowerCase())];
    }

    const hexMatch = normalized.match(/^#([0-9a-f]{3,8})$/i);
    if (hexMatch) {
        let hex = hexMatch[1];
        if (hex.length === 3 || hex.length === 4) hex = [...hex].map((item) => item.repeat(2)).join('');
        if (hex.length !== 6 && hex.length !== 8) return null;
        return [
            Number.parseInt(hex.slice(0, 2), 16),
            Number.parseInt(hex.slice(2, 4), 16),
            Number.parseInt(hex.slice(4, 6), 16),
            hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1,
        ];
    }

    const rgbMatch = normalized.match(/^rgba?\((.*)\)$/i);
    if (rgbMatch) {
        const channels = splitTopLevel(rgbMatch[1]);
        if (channels.length < 3 || channels.length > 4) return null;
        const colour = [
            parseChannel(channels[0]),
            parseChannel(channels[1]),
            parseChannel(channels[2]),
            parseAlpha(channels[3]),
        ];
        return colour.every(Number.isFinite) ? colour : null;
    }

    const mixMatch = normalized.match(/^color-mix\(\s*in\s+srgb\s*,(.*)\)$/i);
    if (mixMatch) {
        const stops = splitTopLevel(mixMatch[1]);
        if (stops.length !== 2) return null;
        const first = parseMixStop(stops[0], tokens, stack);
        const second = parseMixStop(stops[1], tokens, stack);
        if (!first.colour || !second.colour) return null;
        const firstWeight = first.weight ?? (second.weight == null ? 0.5 : 1 - second.weight);
        const secondWeight = second.weight ?? (first.weight == null ? 0.5 : 1 - first.weight);
        return mixColours(first.colour, second.colour, firstWeight, secondWeight);
    }
    return null;
}

export function compositeColour(foreground, background) {
    const alpha = foreground[3] + background[3] * (1 - foreground[3]);
    if (alpha === 0) return [0, 0, 0, 0];
    return [
        (foreground[0] * foreground[3] + background[0] * background[3] * (1 - foreground[3])) / alpha,
        (foreground[1] * foreground[3] + background[1] * background[3] * (1 - foreground[3])) / alpha,
        (foreground[2] * foreground[3] + background[2] * background[3] * (1 - foreground[3])) / alpha,
        alpha,
    ];
}

export function relativeLuminance(colour) {
    const channels = colour.slice(0, 3).map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045
            ? normalized / 12.92
            : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function contrastRatio(first, second) {
    const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
    const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
    return (lighter + 0.05) / (darker + 0.05);
}

export function minimumContrast(foreground, background) {
    return Math.min(
        ...[0, 255].map((canvasChannel) => {
            const canvas = [canvasChannel, canvasChannel, canvasChannel, 1];
            const renderedBackground = compositeColour(background, canvas);
            const renderedForeground = compositeColour(foreground, renderedBackground);
            return contrastRatio(renderedForeground, renderedBackground);
        }),
    );
}

export function chooseReadableText(backgroundValue, tokens = new Map()) {
    const background = resolveColour(backgroundValue, tokens);
    if (!background) return '#0b0b0f';
    const darkText = [11, 11, 15, 1];
    const lightText = [255, 255, 255, 1];
    return minimumContrast(lightText, background) > minimumContrast(darkText, background)
        ? '#ffffff'
        : '#0b0b0f';
}

export function createReadableSemanticLayer(scheme, tokens = new Map()) {
    const dark = scheme === 'dark';
    const text = dark ? '#f5f7fa' : '#1f2329';
    const textRgb = dark ? '245, 247, 250' : '31, 35, 41';
    const surface = dark
        ? 'color-mix(in srgb, var(--theme-primary) 10%, rgba(17, 19, 25, 0.90))'
        : 'color-mix(in srgb, var(--theme-primary) 8%, rgba(248, 249, 252, 0.92))';
    const surfaceStrong = dark
        ? 'color-mix(in srgb, var(--theme-primary) 6%, rgba(14, 16, 22, 0.97))'
        : 'color-mix(in srgb, var(--theme-primary) 5%, rgba(250, 250, 252, 0.98))';
    const surfaceMuted = dark
        ? 'color-mix(in srgb, var(--theme-primary) 8%, rgba(17, 19, 25, 0.82))'
        : 'color-mix(in srgb, var(--theme-primary) 7%, rgba(248, 249, 252, 0.84))';
    const popoverBase = dark ? '#17171d' : '#f8f8fa';

    return new Map([
        ['--theme-scheme', scheme],
        ['--theme-text', text],
        ['--theme-text-secondary', `rgba(${textRgb}, 0.76)`],
        ['--theme-text-muted', `rgba(${textRgb}, 0.56)`],
        ['--theme-text-on-primary', chooseReadableText(tokens.get('--theme-primary'), tokens)],
        ['--theme-header-text', 'var(--theme-text)'],
        ['--theme-divider', `rgba(${textRgb}, 0.14)`],
        ['--theme-placeholder', `rgba(${textRgb}, 0.10)`],
        ['--theme-surface-alpha', '0.9'],
        ['--theme-surface', surface],
        ['--theme-surface-strong', surfaceStrong],
        ['--theme-surface-muted', surfaceMuted],
        ['--theme-surface-border', `rgba(${textRgb}, 0.16)`],
        ['--theme-surface-border-strong', `rgba(${textRgb}, 0.24)`],
        ['--theme-header-bg', 'var(--theme-surface-strong)'],
        ['--theme-header-border', 'var(--theme-surface-border)'],
        ['--theme-header-search-bg', 'var(--theme-surface-muted)'],
        ['--theme-sidebar-bg', 'var(--theme-surface)'],
        ['--theme-sidebar-text', 'var(--theme-text)'],
        ['--theme-sidebar-text-secondary', 'var(--theme-text-secondary)'],
        ['--theme-sidebar-text-muted', 'var(--theme-text-muted)'],
        ['--theme-player-bg', 'var(--theme-surface)'],
        ['--theme-player-bg-alt', 'var(--theme-surface-strong)'],
        ['--theme-player-text', 'var(--theme-text)'],
        ['--theme-player-text-secondary', 'var(--theme-text-secondary)'],
        ['--theme-panel-bg', 'var(--theme-surface-strong)'],
        ['--theme-panel-text', 'var(--theme-text)'],
        ['--theme-panel-text-secondary', 'var(--theme-text-secondary)'],
        ['--theme-input-bg', 'var(--theme-surface-strong)'],
        ['--theme-popover-bg', `color-mix(in srgb, var(--theme-primary) 8%, ${popoverBase})`],
        ['--theme-popover-text', 'var(--theme-text)'],
        ['--theme-popover-text-secondary', 'var(--theme-text-secondary)'],
    ]);
}

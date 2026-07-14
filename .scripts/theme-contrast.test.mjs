import assert from 'node:assert/strict';
import {
    auditThemeContrast,
    chooseReadableText,
    createReadableSemanticLayer,
    minimumContrast,
    resolveColour,
} from './theme-contrast.mjs';

function makeAuditableTheme(scheme, primary) {
    const tokens = new Map([['--theme-primary', primary]]);
    for (const [token, value] of createReadableSemanticLayer(scheme, tokens)) {
        tokens.set(token, value);
    }
    return tokens;
}

const resolvedMix = resolveColour(
    'color-mix(in srgb, var(--theme-primary) 25%, rgba(0, 0, 0, 0.8))',
    new Map([['--theme-primary', '#ffffff']]),
);
assert.ok(resolvedMix);
assert.ok(Math.abs(resolvedMix[0] - 75) < 0.001);
assert.ok(Math.abs(resolvedMix[3] - 0.85) < 0.001);

assert.equal(chooseReadableText('#1e3a8a'), '#ffffff');
assert.equal(chooseReadableText('#f8fafc'), '#0b0b0f');

for (const [scheme, primary] of [['dark', '#1e3a8a'], ['light', '#fb7185']]) {
    const failures = auditThemeContrast(makeAuditableTheme(scheme, primary));
    assert.deepEqual(failures, [], `${scheme} readable layer failed:\n${failures.join('\n')}`);
}

const unreadable = makeAuditableTheme('light', '#1e3a8a');
unreadable.set('--theme-text', '#111111');
unreadable.set('--theme-header-text', '#111111');
unreadable.set('--theme-header-bg', 'rgba(30, 58, 138, 0.12)');
const unreadableFailures = auditThemeContrast(unreadable);
assert.ok(unreadableFailures.some((failure) => failure.includes('--theme-header-text')));

const black = resolveColour('#000000');
const translucentBlue = resolveColour('rgba(30, 58, 138, 0.12)');
assert.ok(minimumContrast(black, translucentBlue) < 4.5);

console.log('Theme contrast tests passed.');

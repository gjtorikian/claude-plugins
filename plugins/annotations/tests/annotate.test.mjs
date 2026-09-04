import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const skillDir = join(import.meta.dirname, '..', 'skills', 'annotations', 'references');
const template = readFileSync(join(skillDir, 'template.html'), 'utf8');
const fixture = readFileSync(join(import.meta.dirname, 'fixtures', 'demo.html'), 'utf8');
const START = '<!-- ANNOTATIONS:CONTENT:START -->';
const END = '<!-- ANNOTATIONS:CONTENT:END -->';

function outsideContent(html) {
    // Normalize the two substituted head fields first, then cut out the content block.
    const normalized = html
        .replace(/<title>[^<]*<\/title>/, '<title></title>')
        .replace(/(<meta name="annotations-slug" content=")[^"]*(")/, '$1$2');
    const s = normalized.indexOf(START);
    const e = normalized.indexOf(END);
    assert.ok(s !== -1 && e !== -1 && s < e, 'content markers present and ordered');
    return normalized.slice(0, s + START.length) + normalized.slice(e);
}

function count(haystack, needle) {
    let n = 0;
    let i = haystack.indexOf(needle);
    while (i !== -1) {
        n += 1;
        i = haystack.indexOf(needle, i + needle.length);
    }
    return n;
}

test('fixture equals template outside the content block and the two substituted head fields', () => {
    assert.equal(outsideContent(fixture), outsideContent(template));
});

test('template has exactly one START and one END marker, START first', () => {
    assert.equal(count(template, START), 1);
    assert.equal(count(template, END), 1);
    assert.ok(template.indexOf(START) < template.indexOf(END));
});

test('template source never contains the browser-set markers', () => {
    assert.ok(!template.includes('data-annotations-ready="true"'));
    assert.ok(!template.includes('data-annotations-selftest'));
});

test('template makes no network references', () => {
    assert.doesNotMatch(template, /https?:\/\/|url\(|@import|@font-face/);
});

test('layer never opens the popover or moves focus straight from mouseup', () => {
    const handler = template.match(/addEventListener\('mouseup',[\s\S]*?\n\s*\}\);/);
    assert.ok(handler, 'mouseup handler present');
    assert.doesNotMatch(handler[0], /openPopover|focus\(/);
});

test('layer owns the cue and heading anchor classes it paints', () => {
    assert.match(template, /\.ann-cue \{/);
    assert.match(template, /\.ann-anchor::before \{ content: '#'; \}/);
    const layer = template.match(/var LAYER = \[([^\]]*)\];/);
    assert.ok(layer, 'LAYER list present');
    for (const name of ['ann-cue', 'ann-anchor']) {
        assert.ok(layer[1].includes(`'${name}'`), `${name} is a layer class`);
    }
});

test('fixture declares the demo slug', () => {
    assert.match(fixture, /name="annotations-slug" content="demo"/);
});

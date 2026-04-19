// Run: node --test scripts/theme-v3-codemod.test.mjs
import { test } from 'node:test';
import assert from 'node:assert';

test('codemod module loads without error', async () => {
  await import('./theme-v3-codemod.mjs');
  assert.ok(true);
});

import { applyOp1 } from './theme-v3-codemod.mjs';

test('op 1: var(--aqb-X) in CSS renames per mapping', () => {
  const mapping = {
    css_vars: {
      chrome_and_canvas_operational: { '--aqb-primary': '--buildrick-accent' },
      design_runtime: {}
    }
  };
  const input = `.foo { color: var(--aqb-primary); }`;
  assert.strictEqual(applyOp1(input, mapping), `.foo { color: var(--buildrick-accent); }`);
});

test('op 1: var() fallbacks preserved', () => {
  const mapping = { css_vars: { chrome_and_canvas_operational: { '--aqb-primary': '--buildrick-accent' }, design_runtime: {} } };
  const input = `.foo { color: var(--aqb-primary, #2d6dff); }`;
  assert.strictEqual(applyOp1(input, mapping), `.foo { color: var(--buildrick-accent, #2d6dff); }`);
});

test('op 1: unmapped aqb var aborts', () => {
  const mapping = { css_vars: { chrome_and_canvas_operational: {}, design_runtime: {} } };
  const input = `.foo { color: var(--aqb-unknown); }`;
  assert.throws(() => applyOp1(input, mapping), /unmapped/i);
});

import { applyOp1b } from './theme-v3-codemod.mjs';

test('op 1b: plain JS string literal "--aqb-X" renames', () => {
  const mapping = { css_vars: { chrome_and_canvas_operational: { '--aqb-primary': '--buildrick-accent' }, design_runtime: {} } };
  const input = `root.style.setProperty("--aqb-primary", merged.primary);`;
  assert.strictEqual(applyOp1b(input, mapping), `root.style.setProperty("--buildrick-accent", merged.primary);`);
});

test('op 1b: template literal with static var(--aqb-X) renames', () => {
  const mapping = { css_vars: { chrome_and_canvas_operational: { '--aqb-primary': '--buildrick-accent', '--aqb-success': '--buildrick-design-color-success' }, design_runtime: {} } };
  const input = 'const s = `linear-gradient(90deg, ${v}, var(--aqb-success), var(--aqb-primary))`;';
  const expected = 'const s = `linear-gradient(90deg, ${v}, var(--buildrick-design-color-success), var(--buildrick-accent))`;';
  assert.strictEqual(applyOp1b(input, mapping), expected);
});

test('op 1b: template literal with --aqb-${id} (namespace remap) NOT auto-rewritten', () => {
  const mapping = { css_vars: { chrome_and_canvas_operational: {}, design_runtime: {} } };
  const input = "const v = `--aqb-${id}`;";
  assert.strictEqual(applyOp1b(input, mapping), input);
});

import { applyOp2 } from './theme-v3-codemod.mjs';

test('op 2: @keyframes aqb-X renames', () => {
  const m = { keyframes: { 'aqb-spin': 'buildrick-spin' } };
  assert.strictEqual(applyOp2('@keyframes aqb-spin { from {} to {} }', m), '@keyframes buildrick-spin { from {} to {} }');
});

test('op 2: animation-name: aqb-X renames', () => {
  const m = { keyframes: { 'aqb-spin': 'buildrick-spin' } };
  assert.strictEqual(applyOp2('.foo { animation-name: aqb-spin; }', m), '.foo { animation-name: buildrick-spin; }');
});

test('op 2: animation: aqb-X <rest> renames', () => {
  const m = { keyframes: { 'aqb-spin': 'buildrick-spin' } };
  assert.strictEqual(applyOp2('.foo { animation: aqb-spin 200ms ease; }', m), '.foo { animation: buildrick-spin 200ms ease; }');
});

test('op 2: action:delete removes animation-name property line', () => {
  const m = { keyframes: { 'aqb-slide-down': { action: 'delete' } } };
  const input = '.foo {\n  color: red;\n  animation-name: aqb-slide-down;\n  padding: 4px;\n}';
  const expected = '.foo {\n  color: red;\n  padding: 4px;\n}';
  assert.strictEqual(applyOp2(input, m), expected);
});

test('op 2: multi-animation shorthand with orphan aborts', () => {
  const m = { keyframes: { 'aqb-slide-down': { action: 'delete' } } };
  const input = '.foo { animation: aqb-slide-down 200ms, other-live 100ms; }';
  assert.throws(() => applyOp2(input, m), /multi-animation/i);
});

import { applyOp4 } from './theme-v3-codemod.mjs';

test('op 4: data-aqb-X renames (CSS selector)', () => {
  const m = { data_attributes: { 'data-aqb-id': 'data-buildrick-id' } };
  assert.strictEqual(applyOp4('[data-aqb-id="foo"] { color: red; }', m), '[data-buildrick-id="foo"] { color: red; }');
});

test('op 4: data-aqb-X renames (JSX prop)', () => {
  const m = { data_attributes: { 'data-aqb-canvas': 'data-buildrick-canvas' } };
  assert.strictEqual(applyOp4('<div data-aqb-canvas="true" />', m), '<div data-buildrick-canvas="true" />');
});

test('op 4: data-aqb-X in template literal static portion renames', () => {
  const m = { data_attributes: { 'data-aqb-id': 'data-buildrick-id' } };
  assert.strictEqual(applyOp4('const sel = `[data-aqb-id="${id}"]`;', m), 'const sel = `[data-buildrick-id="${id}"]`;');
});

test('op 4: unmapped data-aqb-X aborts', () => {
  const m = { data_attributes: {} };
  assert.throws(() => applyOp4('<div data-aqb-wtf />', m), /unmapped/i);
});

import { applyOp5 } from './theme-v3-codemod.mjs';

test('op 5: .aqb-X CSS selector renames', () => {
  const m = { classnames: { 'aqb-canvas': 'buildrick-canvas' } };
  assert.strictEqual(applyOp5('.aqb-canvas { color: red; }', m), '.buildrick-canvas { color: red; }');
});

test('op 5: "aqb-X" JSX className renames', () => {
  const m = { classnames: { 'aqb-selected': 'buildrick-selected' } };
  assert.strictEqual(applyOp5('className="aqb-selected"', m), 'className="buildrick-selected"');
});

test('op 5: template literal static portion renames', () => {
  const m = { classnames: { 'aqb-element': 'buildrick-element' } };
  assert.strictEqual(applyOp5('const c = `aqb-element-${id}`;', m), 'const c = `buildrick-element-${id}`;');
});

test('op 5: action:delete-rule removes entire rule block', () => {
  const m = { classnames: { 'aqb-editor': { action: 'delete-rule' } } };
  const input = '.aqb-editor {\n  color: red;\n  padding: 4px;\n}\n.other { font: x; }';
  const result = applyOp5(input, m);
  assert.ok(!result.includes('.aqb-editor'));
  assert.ok(result.includes('.other'));
});

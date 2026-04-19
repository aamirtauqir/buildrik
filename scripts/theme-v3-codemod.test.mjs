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

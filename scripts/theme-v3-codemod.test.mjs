// Run: node --test scripts/theme-v3-codemod.test.mjs
import { test } from 'node:test';
import assert from 'node:assert';

test('codemod module loads without error', async () => {
  await import('./theme-v3-codemod.mjs');
  assert.ok(true);
});

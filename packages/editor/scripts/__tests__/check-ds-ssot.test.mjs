import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, copyFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const GATE = resolve(HERE, '..', 'check-ds-ssot.mjs');
const SCANNER = resolve(HERE, '..', 'audit', 'ssot-scan.mjs');

function makeRepo(scenario) {
  const dir = mkdtempSync(join(tmpdir(), 'ds-ssot-gate-'));
  mkdirSync(join(dir, 'scripts/audit'), { recursive: true });
  mkdirSync(join(dir, 'scripts/baselines'), { recursive: true });
  copyFileSync(SCANNER, join(dir, 'scripts/audit/ssot-scan.mjs'));
  copyFileSync(GATE, join(dir, 'scripts/check-ds-ssot.mjs'));
  writeFileSync(join(dir, 'scripts/baselines/ssot.json'), JSON.stringify(scenario.baseline, null, 2));
  for (const [path, content] of Object.entries(scenario.files ?? {})) {
    const full = join(dir, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return dir;
}

const EMPTY_BASELINE = [
  { category: 'componentDuplicates', violations: [] },
  { category: 'keyframeDuplicates', violations: [] },
  { category: 'tokenAliasSSOT', violations: [] },
  { category: 'selectorDuplicates', violations: [] },
];

describe('check-ds-ssot gate', () => {
  it('passes when violations match baseline exactly', () => {
    const dir = makeRepo({ baseline: EMPTY_BASELINE, files: {} });
    expect(() => execFileSync('node', ['scripts/check-ds-ssot.mjs'], { cwd: dir })).not.toThrow();
  });

  it('fails when new violation introduced beyond baseline', () => {
    const dir = makeRepo({
      baseline: EMPTY_BASELINE,
      files: {
        'src/editor/shared/vibcoder/Foo.tsx': 'export const Foo = () => null;',
        'src/shared/ui/Foo.tsx': 'export const Foo = () => null;',
      },
    });
    expect(() => execFileSync('node', ['scripts/check-ds-ssot.mjs'], { cwd: dir })).toThrow();
  });

  it('auto-ratchets baseline when violation removed', () => {
    const dir = makeRepo({
      baseline: [
        { category: 'componentDuplicates', violations: [{ path: 'src/old.tsx', line: 1, severity: 'important', message: 'phantom', suggestion: 'fix' }] },
        { category: 'keyframeDuplicates', violations: [] },
        { category: 'tokenAliasSSOT', violations: [] },
        { category: 'selectorDuplicates', violations: [] },
      ],
      files: {},
    });
    execFileSync('node', ['scripts/check-ds-ssot.mjs'], { cwd: dir });
    const updated = JSON.parse(readFileSync(join(dir, 'scripts/baselines/ssot.json'), 'utf8'));
    expect(updated[0].violations).toHaveLength(0);
  });

  it('does NOT ratchet when additions exist (avoid covering up regressions)', () => {
    const baselineWithPhantom = [
      { category: 'componentDuplicates', violations: [{ path: 'src/old.tsx', line: 1, severity: 'important', message: 'phantom', suggestion: 'fix' }] },
      { category: 'keyframeDuplicates', violations: [] },
      { category: 'tokenAliasSSOT', violations: [] },
      { category: 'selectorDuplicates', violations: [] },
    ];
    const dir = makeRepo({
      baseline: baselineWithPhantom,
      files: {
        'src/editor/shared/vibcoder/Foo.tsx': 'export const Foo = () => null;',
        'src/shared/ui/Foo.tsx': 'export const Foo = () => null;',
      },
    });
    expect(() => execFileSync('node', ['scripts/check-ds-ssot.mjs'], { cwd: dir })).toThrow();
    // Baseline must NOT be auto-ratcheted while gate is failing
    const post = JSON.parse(readFileSync(join(dir, 'scripts/baselines/ssot.json'), 'utf8'));
    expect(post[0].violations).toHaveLength(1);
    expect(post[0].violations[0].path).toBe('src/old.tsx');
  });

  it('reports each of 4 mechanical categories independently', () => {
    const dir = makeRepo({ baseline: EMPTY_BASELINE, files: {} });
    const result = execFileSync('node', ['scripts/check-ds-ssot.mjs'], { cwd: dir, encoding: 'utf8' });
    expect(result).toContain('[ok]');
  });

  /*
    Names every category instead of counting them. The gate ran
    `--category=1,2,3,4` for months, so categories 5-8 — including the
    dead-export check — never executed in CI, and the old form of this test
    (`toHaveLength(4)`) asserted that broken state was correct. Listing the
    categories means a future narrowing of the `--category=` argument fails
    here by name rather than passing quietly.
  */
  it('scans and baselines all eight categories, by name', () => {
    const dir = makeRepo({ baseline: EMPTY_BASELINE, files: {} });
    execFileSync('node', ['scripts/check-ds-ssot.mjs'], { cwd: dir });
    const baseline = JSON.parse(readFileSync(join(dir, 'scripts/baselines/ssot.json'), 'utf8'));
    expect(baseline.map((c) => c.category)).toEqual([
      'componentDuplicates',
      'keyframeDuplicates',
      'tokenAliasSSOT',
      'selectorDuplicates',
      'homeContractViolations',
      'antiPatterns',
      'legacyResiduals',
      'docDrift',
    ]);
    expect(baseline.every((c) => 'category' in c && 'violations' in c)).toBe(true);
  });

  it('fails on a dead runtime export but not on a dead type export', () => {
    const withValue = makeRepo({
      baseline: EMPTY_BASELINE,
      files: { 'src/probe.ts': 'export const NOBODY_IMPORTS_THIS = 42;' },
    });
    expect(() => execFileSync('node', ['scripts/check-ds-ssot.mjs'], { cwd: withValue })).toThrow();

    // A props interface exported beside its component is idiomatic TypeScript,
    // not dead code — 407 of 509 hits were that shape, which is why this
    // category was never enforceable until it stopped reporting them.
    const withType = makeRepo({
      baseline: EMPTY_BASELINE,
      files: { 'src/probe.ts': 'export interface NobodyImportsThisProps { a: string }' },
    });
    expect(() => execFileSync('node', ['scripts/check-ds-ssot.mjs'], { cwd: withType })).not.toThrow();
  });

  it('ERROR mode: locks cleared category at zero, fails any new violation', () => {
    const dir = makeRepo({
      baseline: [
        { category: 'componentDuplicates', violations: [] },
        { category: 'keyframeDuplicates', violations: [] },
        { category: 'tokenAliasSSOT', violations: [] },
        { category: 'selectorDuplicates', violations: [] },
      ],
      files: {
        'src/editor/shared/vibcoder/X.tsx': 'export const X = () => null;',
        'src/shared/ui/X.tsx': 'export const X = () => null;',
      },
    });
    expect(() => execFileSync('node', ['scripts/check-ds-ssot.mjs'], { cwd: dir })).toThrow();
  });
});

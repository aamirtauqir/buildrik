/**
 * The conformance CLI scripts, driven through a temp repo the way
 * check-ds-ssot.test.mjs drives its gate.
 *
 * These assert EXIT CODES, because the taxonomy is the contract:
 *   0 PASS · 1 FAIL · 2 STALE · 3 MISSING
 * and the distinction that matters most is 1 vs 3 — "the design and the code
 * disagree" versus "we never got far enough to know". A missing input reading
 * as a pass is the failure this whole harness exists to prevent, so several of
 * the cases below exist purely to prove it does not.
 *
 * measure.mjs and diff-against-live-DOM are NOT here: they need a browser and
 * a dev server, and live in the Playwright harness instead.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, copyFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const CONF = resolve(HERE, '..', 'conformance');
const TOKENS = resolve(HERE, '..', 'tokens', 'figma-tokens.json');

/** Run a conformance script in `dir`; return { code, out }. Never throws. */
function run(dir, script, args = []) {
  try {
    const out = execFileSync('node', [join('scripts/conformance', script), ...args], {
      cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, out };
  } catch (err) {
    return { code: err.status ?? -1, out: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
}

/**
 * A temp repo mirroring the real layout, because the scripts resolve their
 * inputs by relative path (../tokens/figma-tokens.json, ./specs, ./surfaces).
 */
function makeRepo({ raw, spec, recipe, measured, baseline } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'conformance-'));
  mkdirSync(join(dir, 'scripts/conformance/surfaces'), { recursive: true });
  mkdirSync(join(dir, 'scripts/conformance/specs'), { recursive: true });
  mkdirSync(join(dir, 'scripts/conformance/measured'), { recursive: true });
  mkdirSync(join(dir, 'scripts/conformance/raw-figma'), { recursive: true });
  mkdirSync(join(dir, 'scripts/tokens'), { recursive: true });
  for (const f of ['extract.mjs', 'diff.mjs', 'lib.mjs', 'check-spec-age.mjs', 'check-anchors.mjs']) {
    copyFileSync(join(CONF, f), join(dir, 'scripts/conformance', f));
  }
  copyFileSync(TOKENS, join(dir, 'scripts/tokens/figma-tokens.json'));

  const w = (p, o) => writeFileSync(join(dir, p), JSON.stringify(o, null, 2) + '\n');
  if (raw) w('scripts/conformance/raw-figma/t.json', raw);
  if (spec) w('scripts/conformance/specs/t.json', spec);
  if (recipe) w('scripts/conformance/surfaces/s.json', recipe);
  if (measured) w('scripts/conformance/measured/s.json', measured);
  if (baseline) w('scripts/conformance/.conformance-baseline.json', baseline);
  return dir;
}

const CODE = `<div className="bg-[var(--color\\/bg-card,white)] h-[56px] w-[1440px] px-[16px]" data-node-id="1:1" data-name="bar"></div>`;
const RAW = { fileKey: 'k', nodeId: '1:1', boardName: 'Bar', fetchedAt: new Date().toISOString(), code: CODE };

const ago = (days) => new Date(Date.now() - days * 86_400_000).toISOString();

// ── extract.mjs ────────────────────────────────────────────────────────────

describe('extract.mjs — derive a spec from a committed Figma response', () => {
  it('parses a board into a spec with hash, version and timestamp', () => {
    const dir = makeRepo({ raw: RAW });
    const r = run(dir, 'extract.mjs', ['t']);
    expect(r.code).toBe(0);
    const spec = JSON.parse(readFileSync(join(dir, 'scripts/conformance/specs/t.json'), 'utf8'));
    expect(spec.targets).toHaveLength(1);
    expect(spec.targets[0].props['height'].value).toBe('56px');
    expect(spec.targets[0].props['background-color']).toEqual({ token: '--color/bg-card', value: 'white' });
    expect(spec.figmaHash).toMatch(/^[0-9a-f]{64}$/);
    expect(spec.extractorVersion).toBeGreaterThan(0);
    expect(spec.extractedAt).toBeTruthy();
  });

  it('expands px shorthand to longhand, so specs compare against computed style', () => {
    const dir = makeRepo({ raw: RAW });
    run(dir, 'extract.mjs', ['t']);
    const spec = JSON.parse(readFileSync(join(dir, 'scripts/conformance/specs/t.json'), 'utf8'));
    expect(spec.targets[0].props['padding-left'].value).toBe('16px');
    expect(spec.targets[0].props['padding-right'].value).toBe('16px');
  });

  it('is deterministic — same input, same hash', () => {
    const dir = makeRepo({ raw: RAW });
    run(dir, 'extract.mjs', ['t']);
    const a = JSON.parse(readFileSync(join(dir, 'scripts/conformance/specs/t.json'), 'utf8')).figmaHash;
    run(dir, 'extract.mjs', ['t']);
    const b = JSON.parse(readFileSync(join(dir, 'scripts/conformance/specs/t.json'), 'utf8')).figmaHash;
    expect(a).toBe(b);
  });

  it('a changed board changes the hash AND the value', () => {
    const dir = makeRepo({ raw: RAW });
    run(dir, 'extract.mjs', ['t']);
    const before = JSON.parse(readFileSync(join(dir, 'scripts/conformance/specs/t.json'), 'utf8'));
    writeFileSync(join(dir, 'scripts/conformance/raw-figma/t.json'),
      JSON.stringify({ ...RAW, code: CODE.replace('h-[56px]', 'h-[64px]') }, null, 2));
    run(dir, 'extract.mjs', ['t']);
    const after = JSON.parse(readFileSync(join(dir, 'scripts/conformance/specs/t.json'), 'utf8'));
    expect(after.figmaHash).not.toBe(before.figmaHash);
    expect(after.targets[0].props['height'].value).toBe('64px');
  });

  it('refuses to write a spec from empty code — MISSING, not a vacuous pass', () => {
    const dir = makeRepo({ raw: { ...RAW, code: '' } });
    const r = run(dir, 'extract.mjs', ['t']);
    expect(r.code).toBe(3);
    expect(existsSync(join(dir, 'scripts/conformance/specs/t.json'))).toBe(false);
  });

  it('refuses when nothing parses — a zero-target spec makes every diff green', () => {
    const dir = makeRepo({ raw: { ...RAW, code: '<div>nothing here</div>' } });
    const r = run(dir, 'extract.mjs', ['t']);
    expect(r.code).toBe(3);
    expect(r.out).toMatch(/refusing to write a spec that would pass by default/);
  });

  it('a missing raw file is MISSING (3), never FAIL (1)', () => {
    // It performs no comparison, so it can never observe a disagreement.
    const dir = makeRepo({});
    expect(run(dir, 'extract.mjs', ['does-not-exist']).code).toBe(3);
  });
});

// ── diff.mjs ───────────────────────────────────────────────────────────────

const specFrom = (dir) => JSON.parse(readFileSync(join(dir, 'scripts/conformance/specs/t.json'), 'utf8'));
const RECIPE = { surface: 's', targets: [{ name: 'bar', testId: 'bar', spec: 't', nodeId: '1:1' }] };
const measuredWith = (css) => ({ surface: 's', targets: [{ name: 'bar', found: true, css }] });
const MATCHING = { width: '1440px', height: '56px', 'padding-left': '16px', 'padding-right': '16px', 'background-color': 'rgb(255, 255, 255)' };

function repoReadyForDiff(overrides = {}) {
  const dir = makeRepo({ raw: RAW, recipe: RECIPE, measured: measuredWith(MATCHING), ...overrides });
  run(dir, 'extract.mjs', ['t']);
  return dir;
}

describe('diff.mjs — compare rendered against board', () => {
  it('PASS (0) when every property matches', () => {
    const dir = repoReadyForDiff();
    const r = run(dir, 'diff.mjs', ['s']);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/PASS/);
  });

  it('FAIL (1) on a value disagreement, naming the delta', () => {
    const dir = repoReadyForDiff();
    writeFileSync(join(dir, 'scripts/conformance/measured/s.json'),
      JSON.stringify(measuredWith({ ...MATCHING, height: '72px' }), null, 2));
    const r = run(dir, 'diff.mjs', ['s']);
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/height/);
    expect(r.out).toMatch(/off by 16/);
  });

  it('groups failures by property so one board change is one cause', () => {
    const dir = repoReadyForDiff();
    writeFileSync(join(dir, 'scripts/conformance/measured/s.json'),
      JSON.stringify(measuredWith({ ...MATCHING, height: '72px', width: '1400px' }), null, 2));
    const r = run(dir, 'diff.mjs', ['s']);
    expect(r.out).toMatch(/FAILURE\(S\), grouped by property/);
  });

  it('STALE (2) when the raw board moved but the spec did not', () => {
    const dir = repoReadyForDiff();
    writeFileSync(join(dir, 'scripts/conformance/raw-figma/t.json'),
      JSON.stringify({ ...RAW, code: CODE.replace('gap', 'x') + ' ' }, null, 2));
    const r = run(dir, 'diff.mjs', ['s']);
    expect(r.code).toBe(2);
    expect(r.out).toMatch(/STALE/);
  });

  it('STALE (2) when the extractor version moved — the hash cannot see that', () => {
    const dir = repoReadyForDiff();
    const spec = specFrom(dir);
    writeFileSync(join(dir, 'scripts/conformance/specs/t.json'),
      JSON.stringify({ ...spec, extractorVersion: 999 }, null, 2));
    const r = run(dir, 'diff.mjs', ['s']);
    expect(r.code).toBe(2);
    expect(r.out).toMatch(/extractor v999/);
  });

  it('MISSING (3) when there is no measurement — never a pass', () => {
    const dir = repoReadyForDiff();
    rmSync(join(dir, 'scripts/conformance/measured/s.json'));
    const r = run(dir, 'diff.mjs', ['s']);
    expect(r.code).toBe(3);
    expect(r.out).toMatch(/never a pass/);
  });

  it('MISSING (3) when a target has a spec but was never measured', () => {
    const dir = repoReadyForDiff();
    writeFileSync(join(dir, 'scripts/conformance/measured/s.json'),
      JSON.stringify({ surface: 's', targets: [{ name: 'bar', found: false }] }, null, 2));
    expect(run(dir, 'diff.mjs', ['s']).code).toBe(3);
  });

  it('MISSING (3) when every target is skipped — nothing compared is not success', () => {
    const dir = repoReadyForDiff({ recipe: { surface: 's', targets: [{ name: 'bar', testId: 'bar' }] } });
    const r = run(dir, 'diff.mjs', ['s']);
    expect(r.code).toBe(3);
    expect(r.out).toMatch(/every target was SKIPPED/);
  });

  it('FAIL (1) when SKIPPED rises above the baseline — coverage may not shrink', () => {
    const dir = repoReadyForDiff({ baseline: { s: { skipped: 0, compared: 5 } } });
    // recipe has one spec'd target and zero skipped, so force a rise
    writeFileSync(join(dir, 'scripts/conformance/surfaces/s.json'), JSON.stringify({
      surface: 's',
      targets: [RECIPE.targets[0], { name: 'other', testId: 'other' }],
    }, null, 2));
    writeFileSync(join(dir, 'scripts/conformance/measured/s.json'), JSON.stringify({
      surface: 's', targets: [{ name: 'bar', found: true, css: MATCHING }, { name: 'other', found: true, css: {} }],
    }, null, 2));
    const r = run(dir, 'diff.mjs', ['s']);
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/SKIPPED rose 0 -> 1/);
  });

  it('FAIL (1) when the compared count falls — something stopped being checked', () => {
    const dir = repoReadyForDiff({ baseline: { s: { skipped: 0, compared: 99 } } });
    const r = run(dir, 'diff.mjs', ['s']);
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/compared properties fell 99/);
  });

  it('MISSING (3) when the recipe names a node the spec does not contain', () => {
    const dir = repoReadyForDiff({
      recipe: { surface: 's', targets: [{ name: 'bar', testId: 'bar', spec: 't', nodeId: '9:9' }] },
    });
    expect(run(dir, 'diff.mjs', ['s']).code).toBe(3);
  });

  it('rejects an invalid recipe rather than comparing against nonsense', () => {
    const dir = repoReadyForDiff({ recipe: { surface: 's', targets: [{ name: 'bar', selector: '.css' }] } });
    const r = run(dir, 'diff.mjs', ['s']);
    expect(r.code).toBe(3);
    expect(r.out).toMatch(/addressed by CSS/);
  });

  it('reports the token mapping without failing on it — advisory', () => {
    const dir = repoReadyForDiff();
    const r = run(dir, 'diff.mjs', ['s']);
    expect(r.out).toMatch(/--color\/bg-card -> --bk-bg-card/);
    expect(r.code).toBe(0);
  });
});

// ── check-spec-age.mjs ─────────────────────────────────────────────────────

describe('check-spec-age.mjs — blocks at push, warns in CI', () => {
  const withAge = (days) => makeRepo({ spec: { surface: 't', extractedAt: ago(days), targets: [] } });

  it('refuses to run without an explicit --mode', () => {
    // Inferring from process.env.CI would let one wrong default silently turn
    // the blocking half into a no-op with nothing looking broken.
    const r = run(withAge(1), 'check-spec-age.mjs');
    expect(r.code).toBe(2);
    expect(r.out).toMatch(/never inferred/);
  });

  it('rejects a bogus mode', () => {
    expect(run(withAge(1), 'check-spec-age.mjs', ['--mode=maybe']).code).toBe(2);
  });

  it('passes a fresh spec in both modes', () => {
    expect(run(withAge(1), 'check-spec-age.mjs', ['--mode=prepush']).code).toBe(0);
    expect(run(withAge(1), 'check-spec-age.mjs', ['--mode=ci']).code).toBe(0);
  });

  it('FAILS a stale spec at push time, where re-extraction is possible', () => {
    const r = run(withAge(45), 'check-spec-age.mjs', ['--mode=prepush']);
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/STALE/);
  });

  it('only WARNS in CI, which cannot re-extract', () => {
    const r = run(withAge(45), 'check-spec-age.mjs', ['--mode=ci']);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/WARN/);
  });

  it('says plainly that it is a calendar alarm, not drift detection', () => {
    expect(run(withAge(45), 'check-spec-age.mjs', ['--mode=ci']).out).toMatch(/calendar alarm/);
  });

  it('a spec with no extractedAt fails in BOTH modes — unmeasurable is not fresh', () => {
    const dir = makeRepo({ spec: { surface: 't', targets: [] } });
    expect(run(dir, 'check-spec-age.mjs', ['--mode=prepush']).code).toBe(1);
    expect(run(dir, 'check-spec-age.mjs', ['--mode=ci']).code).toBe(1);
  });

  it('an unparseable date fails rather than counting as age zero', () => {
    const dir = makeRepo({ spec: { surface: 't', extractedAt: 'sometime', targets: [] } });
    expect(run(dir, 'check-spec-age.mjs', ['--mode=prepush']).code).toBe(1);
  });

  it('no specs at all is MISSING (3), not a pass', () => {
    const dir = makeRepo({});
    expect(run(dir, 'check-spec-age.mjs', ['--mode=ci']).code).toBe(3);
  });
});

// ── check-anchors.mjs ──────────────────────────────────────────────────────

describe('check-anchors.mjs — a recipe may not name an anchor nobody renders', () => {
  const withSrc = (recipe, src) => {
    const dir = makeRepo({ recipe });
    mkdirSync(join(dir, 'src/editor'), { recursive: true });
    writeFileSync(join(dir, 'src/editor/C.tsx'), src);
    return dir;
  };

  it('passes when every testId exists in src', () => {
    const dir = withSrc({ targets: [{ name: 'bar', testId: 'bar' }] }, '<div data-testid="bar" />');
    const r = run(dir, 'check-anchors.mjs');
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/PASS/);
  });

  it('fails (3) when an anchor is absent, naming the recipe that wants it', () => {
    const dir = withSrc({ targets: [{ name: 'bar', testId: 'bar' }] }, '<div />');
    const r = run(dir, 'check-anchors.mjs');
    expect(r.code).toBe(3);
    expect(r.out).toMatch(/data-testid="bar"/);
    expect(r.out).toMatch(/target bar/);
  });

  it('checks step anchors too, not only targets', () => {
    const dir = withSrc(
      { targets: [{ name: 'bar', testId: 'bar' }], steps: [{ action: 'click', testId: 'gone' }] },
      '<div data-testid="bar" />');
    const r = run(dir, 'check-anchors.mjs');
    expect(r.code).toBe(3);
    expect(r.out).toMatch(/gone/);
  });

  it('checks a scoped target root as well', () => {
    const dir = withSrc(
      { targets: [{ name: 'card', testId: 'card', root: 'grid' }] },
      '<div data-testid="card" />');
    expect(run(dir, 'check-anchors.mjs').code).toBe(3);
  });
});

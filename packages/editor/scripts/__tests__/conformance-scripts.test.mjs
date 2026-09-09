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
import { mkdtempSync, writeFileSync, mkdirSync, copyFileSync, readFileSync, existsSync, rmSync, readdirSync } from 'node:fs';
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
  for (const f of ['extract.mjs', 'diff.mjs', 'lib.mjs', 'check-spec-age.mjs', 'check-anchors.mjs', 'check-board-copy.mjs', 'check-boards.mjs']) {
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

  // Regression: `propsFrom` matched only ARBITRARY values (`bg-[#fff]`), so
  // when the topbar board came back from Figma with a bare `bg-white` the
  // topbar's background silently stopped being compared and diff.mjs still
  // said PASS — one fewer property is an absence, not a failure. 57 `bg-white`
  // and 8 `text-white` were hidden this way across the committed boards.
  it('reads a NAMED colour, not only an arbitrary one', () => {
    const dir = makeRepo({
      raw: { ...RAW, code: '<div data-node-id="9:9" className="bg-white text-white h-[20px]" />' },
    });
    expect(run(dir, 'extract.mjs', ['t']).code).toBe(0);
    const spec = JSON.parse(readFileSync(join(dir, 'scripts/conformance/specs/t.json'), 'utf8'));
    expect(spec.targets[0].props['background-color']).toEqual({ value: '#ffffff' });
    expect(spec.targets[0].props['color']).toEqual({ value: '#ffffff' });
  });

  // The reason NAMED is keyed on whole class names and not on the prefix that
  // SINGLE uses: `border-` maps to border-COLOR, so a prefix lookup would read
  // `border-b` (a WIDTH, 177 occurrences) and `border-solid` (a STYLE, 876) as
  // colours. `text-left` sits in the same trap one level down.
  it('does not mistake a border width or a text alignment for a colour', () => {
    const dir = makeRepo({
      raw: {
        ...RAW,
        code: '<div data-node-id="9:9" className="border-b border-2 border-solid text-left text-ellipsis h-[20px]" />',
      },
    });
    expect(run(dir, 'extract.mjs', ['t']).code).toBe(0);
    const spec = JSON.parse(readFileSync(join(dir, 'scripts/conformance/specs/t.json'), 'utf8'));
    expect(spec.targets[0].props['border-color']).toBeUndefined();
    expect(spec.targets[0].props['color']).toBeUndefined();
    expect(spec.targets[0].props['height'].value).toBe('20px');
  });

  // get_design_context wraps a string in a JSX template literal whenever it
  // carries a character JSX would escape, so the ORIGINAL `[^<>{}]` pattern
  // dropped exactly the interesting copy: "What's live" (apostrophe) and
  // "+  Save a version" (leading +). check-board-copy then reported both as
  // "product renders, no board draws" — a false lead made by the extractor.
  it('reads copy from a JSX template-literal child, not only plain text', () => {
    const dir = makeRepo({
      raw: {
        ...RAW,
        code: '<div data-node-id="9:9" className="h-[20px]"><span>Plain label</span><span>{`What\'s live`}</span></div>',
      },
    });
    expect(run(dir, 'extract.mjs', ['t']).code).toBe(0);
    const spec = JSON.parse(readFileSync(join(dir, 'scripts/conformance/specs/t.json'), 'utf8'));
    expect(spec.copy).toContain('Plain label');
    expect(spec.copy).toContain("What's live");
  });

  // `text-[…]` is two properties wearing one prefix, and `color:` is only ONE
  // of the ways a colour arrives. A bare hex — what Figma emits when the layer
  // has no variable behind it — fell to the else branch and was recorded as
  // `{"font-size": "#6b7280"}`: the colour check silently vanished AND a bogus
  // font-size took its place, which normalizeLength reads as null, so it
  // degraded to UNKNOWN and never failed. 70 such props sat across 53 specs.
  it('reads a bare hex in text-[…] as a colour, not a font size', () => {
    const dir = makeRepo({
      raw: { ...RAW, code: '<div data-node-id="9:9" className="text-[#6b7280] h-[20px]" />' },
    });
    expect(run(dir, 'extract.mjs', ['t']).code).toBe(0);
    const spec = JSON.parse(readFileSync(join(dir, 'scripts/conformance/specs/t.json'), 'utf8'));
    expect(spec.targets[0].props['color']).toEqual({ value: '#6b7280' });
    expect(spec.targets[0].props['font-size']).toBeUndefined();
  });

  it('still reads a real font size, and still honours the explicit color: marker', () => {
    const dir = makeRepo({
      raw: { ...RAW, code: '<div data-node-id="9:9" className="text-[13px]" /><span data-node-id="9:10" className="text-[color:#111827]" />' },
    });
    expect(run(dir, 'extract.mjs', ['t']).code).toBe(0);
    const spec = JSON.parse(readFileSync(join(dir, 'scripts/conformance/specs/t.json'), 'utf8'));
    const byId = Object.fromEntries(spec.targets.map((t) => [t.nodeId, t.props]));
    expect(byId['9:9']['font-size']).toEqual({ value: '13px' });
    expect(byId['9:9']['color']).toBeUndefined();
    expect(byId['9:10']['color']).toEqual({ value: '#111827' });
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

  it('refuses a board whose literal fallback contradicts the token it names', () => {
    // The failure this prevents: a designer edits a raw fill instead of the
    // variable, the fallback drifts off the token, and the written spec then
    // FAILS chrome that correctly renders var(--bk-*). The fix an implementer
    // applies is to delete the token — which is how #3366f2 reached 95 uses
    // across 65 boards. Refuse the spec; the board is the thing that is wrong.
    const drifted = CODE.replace(
      /bg-\[[^\]]*\]/,
      'bg-[var(--color\\/warning-tint,#3366f2)]',
    );
    const dir = makeRepo({ raw: { ...RAW, code: drifted } });
    const r = run(dir, 'extract.mjs', ['t']);
    expect(r.code).toBe(3);
    expect(r.out).toMatch(/contradict the token they name/);
    expect(r.out).toMatch(/#3366f2/);
    expect(existsSync(join(dir, 'scripts/conformance/specs/t.json'))).toBe(false);
  });

  it('a fallback that AGREES with its token still extracts', () => {
    // The negative-control's negative control: the check must not reject the
    // ordinary case, or every extraction stops.
    const ok = CODE.replace(
      /bg-\[[^\]]*\]/,
      'bg-[var(--color\\/warning-tint,#fdfdea)]',
    );
    const dir = makeRepo({ raw: { ...RAW, code: ok } });
    const r = run(dir, 'extract.mjs', ['t']);
    expect(r.code).toBe(0);
    expect(existsSync(join(dir, 'scripts/conformance/specs/t.json'))).toBe(true);
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

  it('--json writes the rows the table is built from', () => {
    // At 287 surfaces the table is ~5,300 lines, ~95% passing. The agent doing
    // triage should read objects, not re-parse a padEnd() table.
    const dir = repoReadyForDiff({});
    const r = run(dir, 'diff.mjs', ['s', '--json']);
    expect(r.code).toBe(0);
    const report = JSON.parse(readFileSync(
      join(dir, 'scripts/conformance/measured/s.report.json'), 'utf8',
    ));
    expect(report.surface).toBe('s');
    expect(report.counts.compared).toBe(report.rows.length);
    expect(report.counts.pass + report.counts.fail + report.counts.unknown)
      .toBe(report.rows.length);
  });

  it('--failures-only hides PASS rows but still counts them', () => {
    const dir = repoReadyForDiff({});
    const r = run(dir, 'diff.mjs', ['s', '--failures-only']);
    expect(r.code).toBe(0);
    // Header keeps the coverage numbers; the body says nothing needs acting on.
    expect(r.out).toMatch(/5 compared · 5 pass/);
    expect(r.out).toMatch(/all 5 compared propert\(ies\) pass/);
  });

  it('--update-baseline MERGES: it must not delete measure.mjs\'s a11y keys', () => {
    // One file, two writers. diff.mjs owns skipped/compared, measure.mjs owns
    // contrastFailures/nonTextFailures. diff.mjs used to assign a fresh object,
    // silently dropping the a11y ratchet — after which measure read baseline 0,
    // saw the real 3, and reported a regression that never happened.
    const dir = repoReadyForDiff({
      baseline: { s: { skipped: 0, compared: 1, contrastFailures: 3, nonTextFailures: 2 } },
    });
    const r = run(dir, 'diff.mjs', ['s', '--update-baseline']);
    expect(r.code).toBe(0);
    const after = JSON.parse(
      readFileSync(join(dir, 'scripts/conformance/.conformance-baseline.json'), 'utf8'),
    );
    expect(after.s.contrastFailures).toBe(3);
    expect(after.s.nonTextFailures).toBe(2);
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


// ── check-board-copy.mjs ───────────────────────────────────────────────────

describe('check-board-copy.mjs — the structural blind spot, through text', () => {
  const seed = (dir, { copy, rendered, targets }) => {
    mkdirSync(join(dir, 'scripts/conformance/surfaces'), { recursive: true });
    writeFileSync(join(dir, 'scripts/conformance/specs/b.json'), JSON.stringify({ copy }));
    writeFileSync(join(dir, 'scripts/conformance/measured/s.json'), JSON.stringify({ rendered }));
    writeFileSync(join(dir, 'scripts/conformance/surfaces/s.json'), JSON.stringify({ surface: 's', targets }));
  };

  it('reports a board line the product never renders', () => {
    const dir = makeRepo({});
    seed(dir, {
      copy: ['Export site as HTML', 'Shared line'],
      rendered: ['Export site as', 'Shared line'],
      targets: [{ name: 'a', testId: 'a', spec: 'b' }],
    });
    const r = run(dir, 'check-board-copy.mjs', ['s']);
    expect(r.code).toBe(0);                       // advisory, never a gate
    expect(r.out).toMatch(/board draws, product does not render/);
    expect(r.out).toMatch(/export site as html/);
  });

  // Boards render SAMPLE values; the product templates them. Folding digits and
  // quoted spans is what keeps "3 open" from being reported against "7 open".
  it('folds sample counts and quoted values instead of reporting them', () => {
    const dir = makeRepo({});
    seed(dir, {
      copy: ['In review · 3 open', "Nothing matches 'hero'"],
      rendered: ['In review · 7 open', "Nothing matches 'footer'"],
      targets: [{ name: 'a', testId: 'a', spec: 'b' }],
    });
    expect(run(dir, 'check-board-copy.mjs', ['s']).out).toMatch(/no leads/);
  });

  // shell-default sweeps `body` but joins ONE spec out of five targets, and
  // reported 88 "extras" that were simply the rest of the editor. The extras
  // direction is only meaningful at full coverage.
  it('suppresses the extras direction when the recipe does not cover the scope', () => {
    const dir = makeRepo({});
    seed(dir, {
      copy: ['Shared line'],
      rendered: ['Shared line', 'Sidebar thing', 'Footer thing'],
      targets: [{ name: 'a', testId: 'a', spec: 'b' }, { name: 'b', testId: 'b' }],
    });
    const out = run(dir, 'check-board-copy.mjs', ['s']).out;
    expect(out).toMatch(/withheld, only 1\/2 targets carry a spec/);
    expect(out).not.toMatch(/product renders, no board draws/);
  });

  it('reports extras once every target carries a spec', () => {
    const dir = makeRepo({});
    seed(dir, {
      copy: ['Shared line'],
      rendered: ['Shared line', 'Undrawn control'],
      targets: [{ name: 'a', testId: 'a', spec: 'b' }],
    });
    expect(run(dir, 'check-board-copy.mjs', ['s']).out).toMatch(/product renders, no board draws \(1\)/);
  });

  it('says so when a surface was measured before the check existed', () => {
    const dir = makeRepo({});
    seed(dir, { copy: ['x'], rendered: undefined, targets: [{ name: 'a', testId: 'a', spec: 'b' }] });
    expect(run(dir, 'check-board-copy.mjs', ['s']).out).toMatch(/measured before this check existed/);
  });
});


// ── check-boards.mjs · recipe/board join ───────────────────────────────────

describe('check-boards.mjs — a row may not claim a recipe that measures another board', () => {
  const seed = (dir, { boardNodeId, recipeName, recipeNodeId }) => {
    writeFileSync(join(dir, 'scripts/conformance/specs/b.json'), JSON.stringify({ nodeId: recipeNodeId, targets: [] }));
    writeFileSync(join(dir, `scripts/conformance/surfaces/${recipeName}.json`), JSON.stringify({
      surface: recipeName, targets: [{ name: 'a', testId: 'a', spec: 'b' }],
    }));
    writeFileSync(join(dir, 'scripts/conformance/boards.json'), JSON.stringify({
      coveredFloor: 0,
      counts: { active: 1 },
      boards: [{ nodeId: boardNodeId, name: 'Board', family: 'F', status: 'active', verified: 'drift-fixed', recipe: recipeName }],
    }));
  };

  // The exact 2026-09-08 error: eleven Brand rows recorded from an agent's
  // prose rather than from the recipes, six node ids wrong, every gate green.
  it('fails when the named recipe joins a different board', () => {
    const dir = makeRepo({});
    seed(dir, { boardNodeId: '152:112', recipeName: 'brand-starters', recipeNodeId: '152:137' });
    const r = run(dir, 'check-boards.mjs');
    expect(r.code).not.toBe(0);
    expect(r.out).toMatch(/names recipe "brand-starters", but that recipe measures 152:137/);
  });

  it('fails when the named recipe does not exist at all', () => {
    const dir = makeRepo({});
    seed(dir, { boardNodeId: '152:112', recipeName: 'brand-starters', recipeNodeId: '152:112' });
    const bp = join(dir, 'scripts/conformance/boards.json');
    const b = JSON.parse(readFileSync(bp, 'utf8'));
    b.boards[0].recipe = 'no-such-recipe';
    writeFileSync(bp, JSON.stringify(b));
    expect(run(dir, 'check-boards.mjs').out).toMatch(/names recipe "no-such-recipe", which does not exist/);
  });

  it('passes when the recipe really does join the board', () => {
    const dir = makeRepo({});
    seed(dir, { boardNodeId: '152:137', recipeName: 'brand-starters', recipeNodeId: '152:137' });
    expect(run(dir, 'check-boards.mjs').code).toBe(0);
  });
});

// ── diff.mjs · a failed measurement is not a verdict ───────────────────────

describe('diff.mjs — refuses a measured file the last run failed to write', () => {
  // `modal-success-then-close` reported "11 compared · 11 pass · 0 fail" while
  // measure.mjs was timing out on a step and reading nothing at all: diff was
  // reporting the run BEFORE it. A green verdict for a surface nobody looked at
  // is the exact shape of silent success this harness exists to prevent.
  it('exits 2 (STALE) and says why, instead of reporting the previous run', () => {
    const dir = repoReadyForDiff();
    const mp = join(dir, 'scripts/conformance/measured/s.json');
    const m = JSON.parse(readFileSync(mp, 'utf8'));
    m.measurementFailed = { why: 'step {"action":"waitFor"} could not resolve', at: '2026-09-08T00:00:00.000Z' };
    writeFileSync(mp, JSON.stringify(m, null, 2));
    const r = run(dir, 'diff.mjs', ['s']);
    expect(r.code).toBe(2);
    expect(r.out).toMatch(/the last measurement FAILED/);
    expect(r.out).toMatch(/Refusing to report a verdict/);
  });

  it('reports normally when the file carries no failure stamp', () => {
    const r = run(repoReadyForDiff(), 'diff.mjs', ['s']);
    expect(r.code).toBe(0);
    expect(r.out).not.toMatch(/Refusing to report a verdict/);
  });
});

// ── every harness script must parse ────────────────────────────────────────

describe('the harness itself is syntactically valid', () => {
  // A block comment containing `bg-*/NN` closed itself early at measure.mjs:244
  // and left the file unparseable. Nothing caught it: the gates that import it
  // simply failed, agents retried against a broken tool, and the harness was
  // unusable for every parallel worker until one of them read the file. A tool
  // that cannot parse verifies nothing, and that is the one failure this suite
  // should never have to be told about twice.
  it('every .mjs in scripts/conformance parses', () => {
    const dir = resolve(HERE, '..', 'conformance');
    const files = readdirSync(dir).filter((f) => f.endsWith('.mjs'));
    expect(files.length).toBeGreaterThan(5);
    const broken = [];
    for (const f of files) {
      try {
        execFileSync('node', ['--check', join(dir, f)], { stdio: ['ignore', 'pipe', 'pipe'] });
      } catch (err) {
        broken.push(`${f}: ${String(err.stderr ?? '').split('\n').find((l) => l.includes('Error')) ?? 'parse failed'}`);
      }
    }
    expect(broken).toEqual([]);
  });
});

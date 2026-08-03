/**
 * lib.mjs — the conformance harness's shared vocabulary.
 *
 * These are pure functions, so they are imported directly rather than driven
 * through a temp repo. The CLI scripts get that treatment in
 * conformance-scripts.test.mjs.
 *
 * The boundary pair (0.5px passes, 0.51px fails) is the most load-bearing
 * assertion in this file: it is the difference between a gate that ignores
 * sub-pixel noise and one that ignores a real regression.
 */
import { describe, it, expect } from 'vitest';
import {
  figmaTokenToBk, figmaTokenValue,
  normalizeColor, normalizeLength,
  compareValue, toleranceClass, validateRecipe,
  TOLERANCE, EXTRACTOR_VERSION,
} from '../conformance/lib.mjs';

describe('figmaTokenToBk — board token names map onto generated --bk-* names', () => {
  // Every token the topbar board (681:26) actually references. If the naming
  // rule in generate.mjs changes, these break, which is the point.
  it.each([
    ['--color/bg-card', '--bk-bg-card'],
    ['--color/border', '--bk-border'],
    ['--color/ink', '--bk-ink'],
    ['--color/ink-soft', '--bk-ink-soft'],
    ['--color/accent-on', '--bk-accent-on'],
    ['--color/warning-tint', '--bk-warning-tint'],
    ['--color/success-tint', '--bk-success-tint'],
    ['--radius/lg', '--bk-radius-lg'],
    ['--flowbite/blue/700', '--bk-blue-700'],
    ['--flowbite/gray/900', '--bk-gray-900'],
  ])('%s -> %s', (figma, bk) => {
    expect(figmaTokenToBk(figma)).toBe(bk);
  });

  it('returns null for a token the chrome set does not carry', () => {
    // Reported as UNKNOWN downstream, never as a failure — boards legitimately
    // reference things outside the chrome token set.
    expect(figmaTokenToBk('--nope/does-not-exist')).toBeNull();
    expect(figmaTokenToBk(null)).toBeNull();
  });

  it('resolves the value the token source holds', () => {
    expect(figmaTokenValue('--color/bg-card')).toBe('#FFFFFF');
    expect(figmaTokenValue('--radius/lg')).toBe('8px');
  });

  it('is derived from figma-tokens.json, not a hardcoded list', () => {
    // size/drawer exists only in the token source; if the map were hand-written
    // for the colour cases above it would not know about it.
    expect(figmaTokenToBk('--size/drawer')).toBe('--bk-size-drawer');
    expect(figmaTokenValue('--size/drawer')).toBe('320px');
  });
});

describe('normalizeColor — one notation, so equal colours compare equal', () => {
  it.each([
    ['rgb(255, 255, 255)', '#ffffff'],
    ['white', '#ffffff'],
    ['#abc', '#aabbcc'],
    ['#1A56DB', '#1a56db'],
    ['rgba(26, 86, 219, 1)', '#1a56db'],
  ])('%s -> %s', (input, want) => expect(normalizeColor(input)).toBe(want));

  it('keeps fully transparent distinct from black', () => {
    // rgba(0,0,0,0) reducing to #000000 would make an invisible element read as
    // a black one, and every contrast comparison against it would be wrong.
    expect(normalizeColor('rgba(0, 0, 0, 0)')).toBe('rgba(0,0,0,0)');
    expect(normalizeColor('rgba(0, 0, 0, 0)')).not.toBe('#000000');
  });

  it('passes non-colours through rather than guessing', () => {
    expect(normalizeColor('inherit')).toBe('inherit');
  });
});

describe('normalizeLength', () => {
  it.each([['56px', 56], ['56', 56], ['0px', 0], ['-4px', -4], ['320.5px', 320.5]])(
    '%s -> %s', (input, want) => expect(normalizeLength(input)).toBe(want));

  it('returns null when there is no number, so callers fall back to string compare', () => {
    expect(normalizeLength('normal')).toBeNull();
    expect(normalizeLength('auto')).toBeNull();
    expect(normalizeLength(null)).toBeNull();
  });
});

describe('compareValue — tolerance by property class', () => {
  it('length: 0.5px off PASSES', () => {
    expect(compareValue('width', '320px', '320.5px').verdict).toBe('PASS');
  });

  it('length: 0.51px off FAILS — the boundary that decides noise from regression', () => {
    const r = compareValue('width', '320px', '320.51px');
    expect(r.verdict).toBe('FAIL');
    expect(r.delta).toBeCloseTo(0.51, 3);
  });

  it('exact class gets no slack at all', () => {
    // 0.4px on an 8px radius is invisible; on a 1px border it is the whole
    // value. The exact class exists so one number does not govern both.
    expect(compareValue('border-radius', '8px', '8px').verdict).toBe('PASS');
    expect(compareValue('border-radius', '8px', '8.4px').verdict).toBe('FAIL');
    expect(compareValue('font-size', '13px', '13.2px').verdict).toBe('FAIL');
  });

  it('colour compares across notations', () => {
    expect(compareValue('background-color', 'white', 'rgb(255, 255, 255)').verdict).toBe('PASS');
    expect(compareValue('background-color', '#1a56db', 'rgb(255, 255, 255)').verdict).toBe('FAIL');
  });

  it('non-numeric lengths fall back to string equality', () => {
    expect(compareValue('line-height', 'normal', 'normal').verdict).toBe('PASS');
  });

  it('a missing side is UNKNOWN, never PASS', () => {
    // A check that cannot see is not a check that agrees.
    expect(compareValue('width', null, '10px').verdict).toBe('UNKNOWN');
    expect(compareValue('width', '10px', null).verdict).toBe('UNKNOWN');
  });

  it('an unclassified property compares exactly rather than loosely', () => {
    expect(toleranceClass('some-unknown-prop')).toBe('exact');
  });

  it('font-family is string equality — computed style cannot reveal the token', () => {
    expect(TOLERANCE.string.props).toContain('font-family');
  });
});

describe('validateRecipe — enforced, because 60 files is too many for a convention', () => {
  const ok = { targets: [{ name: 'a', testId: 'a' }], steps: [{ action: 'waitFor', testId: 'a' }] };

  it('accepts a well-formed recipe', () => {
    expect(() => validateRecipe(ok, 's')).not.toThrow();
  });

  it('rejects a target addressed by CSS — how the only recipe rotted', () => {
    // .bd-topbar and .bd-bp-switcher were named in shell-default.json and exist
    // in no file under src/, so the run died before measuring anything.
    expect(() => validateRecipe({ targets: [{ name: 'a', selector: '.x' }] }, 's'))
      .toThrow(/addressed by CSS/);
  });

  it('rejects a recipe with no targets — it would pass by measuring nothing', () => {
    expect(() => validateRecipe({ targets: [] }, 's')).toThrow(/no targets/);
  });

  it('rejects duplicate target names', () => {
    expect(() => validateRecipe({ targets: [{ name: 'a', testId: 'x' }, { name: 'a', testId: 'y' }] }, 's'))
      .toThrow(/duplicate target name/);
  });

  it('rejects nth without a because — position is not identity', () => {
    expect(() => validateRecipe({ targets: [{ name: 'a', testId: 'a', nth: 0 }] }, 's'))
      .toThrow(/Position is not identity/);
  });

  it('accepts nth when the reason is stated', () => {
    expect(() => validateRecipe({ targets: [{ name: 'a', testId: 'a', nth: 0, because: 'first row has no top border' }] }, 's'))
      .not.toThrow();
  });

  it('rejects an unknown mode', () => {
    expect(() => validateRecipe({ targets: [{ name: 'a', testId: 'a', mode: 'sideways' }] }, 's'))
      .toThrow(/unknown mode/);
  });

  it('rejects CSS in an action step', () => {
    expect(() => validateRecipe({ ...ok, steps: [{ action: 'click', selector: '.x' }] }, 's'))
      .toThrow(/uses a CSS selector/);
  });

  it('allows CSS in waitForState only with a because', () => {
    expect(() => validateRecipe({ ...ok, steps: [{ action: 'waitForState', selector: '.is-open' }] }, 's'))
      .toThrow(/without `because`/);
    expect(() => validateRecipe({ ...ok, steps: [{ action: 'waitForState', selector: '.is-open', because: 'open is a class, not an element' }] }, 's'))
      .not.toThrow();
  });

  it('rejects an unknown step action', () => {
    expect(() => validateRecipe({ ...ok, steps: [{ action: 'teleport', testId: 'a' }] }, 's'))
      .toThrow(/unknown action/);
  });
});

describe('EXTRACTOR_VERSION', () => {
  it('lives in lib so importing it cannot trigger an extraction', () => {
    // extract.mjs does its work at module top level; importing IT to read the
    // constant would run an extraction and call process.exit. That bug shipped
    // briefly and was caught by a diff run that never produced output.
    expect(typeof EXTRACTOR_VERSION).toBe('number');
    expect(EXTRACTOR_VERSION).toBeGreaterThan(0);
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT = resolve(__dirname, '..', 'check-buildrick-baseline.mjs');
const TMP = resolve(__dirname, '__fixtures-buildrick__');

function run() {
  try {
    const out = execFileSync('node', [SCRIPT], {
      cwd: TMP,
      encoding: 'utf8',
      env: { ...process.env, BUILDRICK_GATE_TEST: '1' },
    });
    return { code: 0, out };
  } catch (e) {
    return {
      code: e.status ?? 1,
      out: (e.stdout?.toString() ?? '') + (e.stderr?.toString() ?? ''),
    };
  }
}

beforeEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(`${TMP}/src/editor/footer`, { recursive: true });
  mkdirSync(`${TMP}/scripts/baselines`, { recursive: true });
});
afterEach(() => rmSync(TMP, { recursive: true, force: true }));

describe('check-buildrick-baseline', () => {
  it('passes when count equals baseline (WARN mode)', () => {
    writeFileSync(`${TMP}/src/editor/footer/Foo.tsx`,
      `export const F = () => <button className="buildrick-btn">x</button>;`);
    writeFileSync(`${TMP}/scripts/baselines/buildrick.json`,
      JSON.stringify({ count: 1, mode: 'WARN', perPanel: {} }, null, 2));
    const r = run();
    expect(r.code).toBe(0);
  });

  it('fails when count > baseline (WARN mode regression)', () => {
    writeFileSync(`${TMP}/src/editor/footer/Foo.tsx`,
      `export const F = () => <button className="buildrick-btn buildrick-btn--primary">x</button>;`);
    writeFileSync(`${TMP}/scripts/baselines/buildrick.json`,
      JSON.stringify({ count: 1, mode: 'WARN', perPanel: {} }, null, 2));
    const r = run();
    expect(r.code).not.toBe(0);
    expect(r.out).toMatch(/regression/i);
  });

  it('auto-updates baseline when count < baseline (WARN mode)', () => {
    writeFileSync(`${TMP}/src/editor/footer/Foo.tsx`,
      `export const F = () => <button>clean</button>;`);
    writeFileSync(`${TMP}/scripts/baselines/buildrick.json`,
      JSON.stringify({ count: 5, mode: 'WARN', perPanel: {} }, null, 2));
    const r = run();
    expect(r.code).toBe(0);
    const updated = JSON.parse(
      readFileSync(`${TMP}/scripts/baselines/buildrick.json`, 'utf8')
    );
    expect(updated.count).toBe(0);
  });

  it('fails when ERROR mode and count > 0', () => {
    writeFileSync(`${TMP}/src/editor/footer/Foo.tsx`,
      `export const F = () => <button className="buildrick-btn">x</button>;`);
    writeFileSync(`${TMP}/scripts/baselines/buildrick.json`,
      JSON.stringify({ count: 0, mode: 'ERROR', perPanel: {} }, null, 2));
    const r = run();
    expect(r.code).not.toBe(0);
    expect(r.out).toMatch(/zero-tolerance/i);
  });

  it('fails when per-panel lock violated', () => {
    writeFileSync(`${TMP}/src/editor/footer/Foo.tsx`,
      `export const F = () => <div className="buildrick-row">x</div>;`);
    writeFileSync(`${TMP}/scripts/baselines/buildrick.json`,
      JSON.stringify({ count: 1, mode: 'WARN', perPanel: { footer: 0 } }, null, 2));
    const r = run();
    expect(r.code).not.toBe(0);
    expect(r.out).toMatch(/footer/);
  });

  it('preserves per-panel locks when auto-ratcheting baseline', () => {
    // Live tree: 1 ref in inspector panel only (footer is clean)
    mkdirSync(`${TMP}/src/editor/inspector`, { recursive: true });
    writeFileSync(`${TMP}/src/editor/inspector/Foo.tsx`,
      `export const F = () => <div className="buildrick-row">x</div>;`);
    // Baseline: count was 5, footer locked at 0, inspector unlocked
    writeFileSync(`${TMP}/scripts/baselines/buildrick.json`,
      JSON.stringify({ count: 5, mode: 'WARN', perPanel: { footer: 0 } }, null, 2));
    const r = run();
    expect(r.code).toBe(0);
    const updated = JSON.parse(
      readFileSync(`${TMP}/scripts/baselines/buildrick.json`, 'utf8')
    );
    expect(updated.count).toBe(1);
    expect(updated.perPanel.footer).toBe(0); // lock preserved
    expect(updated.perPanel.inspector).toBe(1); // live count
  });
});

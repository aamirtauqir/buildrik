import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCANNER = resolve(__dirname, '..', 'ssot-scan.mjs');

function makeFixture(files) {
  const dir = mkdtempSync(join(tmpdir(), 'ssot-scan-'));
  for (const [path, content] of Object.entries(files)) {
    const full = join(dir, path);
    mkdirSync(full.split('/').slice(0, -1).join('/'), { recursive: true });
    writeFileSync(full, content);
  }
  return dir;
}

function run(cwd, args = []) {
  try {
    const out = execFileSync('node', [SCANNER, '--json', ...args], {
      cwd,
      encoding: 'utf8',
    });
    return JSON.parse(out);
  } catch (e) {
    const stdout = e.stdout?.toString() ?? '';
    if (stdout) return JSON.parse(stdout);
    throw e;
  }
}

describe('scanComponentDuplicates', () => {
  it('flags primitive name in two homes', () => {
    const dir = makeFixture({
      'src/editor/shared/vibcoder/Badge.tsx': 'export const Badge = () => null;',
      'src/shared/ui/Badge.tsx': 'export const Badge = () => null;',
    });
    const results = run(dir, ['--category=1']);
    const cat1 = results.find((r) => r.category === 'componentDuplicates');
    expect(cat1.violations).toHaveLength(1);
    expect(cat1.violations[0].message).toMatch(/Badge/);
    rmSync(dir, { recursive: true, force: true });
  });

  it('ignores .test.tsx pairs', () => {
    const dir = makeFixture({
      'src/editor/shared/vibcoder/Badge.tsx': 'export const Badge = () => null;',
      'src/editor/shared/vibcoder/Badge.test.tsx': 'test("Badge", () => {});',
    });
    const results = run(dir, ['--category=1']);
    const cat1 = results.find((r) => r.category === 'componentDuplicates');
    expect(cat1.violations).toHaveLength(0);
    rmSync(dir, { recursive: true, force: true });
  });

  it('does not flag basename collision when files export different symbols', () => {
    const dir = makeFixture({
      'src/editor/shared/vibcoder/Foo.tsx': 'export const Foo = () => null;',
      'src/shared/extensions/Foo.tsx': 'export const FooListItem = () => null;\nexport const StudioFoo = () => null;',
    });
    const results = run(dir, ['--category=1']);
    const cat1 = results.find((r) => r.category === 'componentDuplicates');
    expect(cat1.violations).toHaveLength(0);
    rmSync(dir, { recursive: true, force: true });
  });

  it('still flags basename collision when both files export matching symbol', () => {
    const dir = makeFixture({
      'src/editor/shared/vibcoder/Bar.tsx': 'export const Bar = () => null;',
      'src/shared/ui/Bar.tsx': 'export const Bar = () => null;',
    });
    const results = run(dir, ['--category=1']);
    const cat1 = results.find((r) => r.category === 'componentDuplicates');
    expect(cat1.violations).toHaveLength(1);
    expect(cat1.violations[0].message).toMatch(/Bar/);
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('scanKeyframeDuplicates', () => {
  it('flags @keyframes name defined in two CSS files', () => {
    const dir = makeFixture({
      'src/themes/components.css': '@keyframes pulse { from { opacity: 0; } }',
      'src/themes/spinner.css': '@keyframes pulse { from { opacity: 0; } }',
    });
    const results = run(dir, ['--category=2']);
    const cat2 = results.find((r) => r.category === 'keyframeDuplicates');
    expect(cat2.violations).toHaveLength(1);
    expect(cat2.violations[0].message).toMatch(/pulse/);
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('scanTokenAliasSSOT', () => {
  it('flags --bd-* token defined in two alias files', () => {
    const dir = makeFixture({
      'src/themes/_aliases.css': ':root { --bd-color-bg: #fff; }',
      'src/themes/components/bd-aliases.css': ':root { --bd-color-bg: #fff; }',
    });
    const results = run(dir, ['--category=3']);
    const cat3 = results.find((r) => r.category === 'tokenAliasSSOT');
    expect(cat3.violations).toHaveLength(1);
    expect(cat3.violations[0].message).toMatch(/--bd-color-bg/);
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('scanSelectorDuplicates', () => {
  it('flags .bd-* selector defined in two CSS files', () => {
    const dir = makeFixture({
      'src/themes/a.css': '.bd-button { color: red; }',
      'src/themes/b.css': '.bd-button { color: blue; }',
    });
    const results = run(dir, ['--category=4']);
    const cat4 = results.find((r) => r.category === 'selectorDuplicates');
    expect(cat4.violations).toHaveLength(1);
    expect(cat4.violations[0].message).toMatch(/bd-button/);
    rmSync(dir, { recursive: true, force: true });
  });

  it('ignores pseudo-state layered overrides', () => {
    const dir = makeFixture({
      'src/themes/a.css': '.bd-button { color: red; }',
      'src/themes/b.css': '.bd-button:hover { color: blue; }',
    });
    const results = run(dir, ['--category=4']);
    const cat4 = results.find((r) => r.category === 'selectorDuplicates');
    expect(cat4.violations).toHaveLength(0);
    rmSync(dir, { recursive: true, force: true });
  });

  it('strips /* ... */ comments before matching selectors', () => {
    const dir = makeFixture({
      'src/themes/components.css': '.bd-btn { color: red; }',
      'src/themes/_layer.css': '/* example: .bd-btn { padding: 9px 16px } */\n@layer { /* ok */ }',
    });
    const results = run(dir, ['--category=4']);
    const cat4 = results.find((r) => r.category === 'selectorDuplicates');
    expect(cat4.violations).toHaveLength(0);
    rmSync(dir, { recursive: true, force: true });
  });

  it('does not flag child-combinator wrapped selectors as duplicates', () => {
    const dir = makeFixture({
      'src/themes/atoms/helper.css': '.bd-helper-text { color: gray; }',
      'src/themes/molecules/form.css': '.bd-form-field--inline > .bd-helper-text { font-size: 11px; }',
    });
    const results = run(dir, ['--category=4']);
    const cat4 = results.find((r) => r.category === 'selectorDuplicates');
    expect(cat4.violations).toHaveLength(0);
    rmSync(dir, { recursive: true, force: true });
  });

  it('flags simple head + ignores wrapped head in same comma-list', () => {
    const dir = makeFixture({
      'src/themes/atoms/x.css': '.bd-helper-text { color: gray; }',
      'src/themes/molecules/y.css': '.bd-helper-text, .bd-form-field--inline > .bd-other { color: red; }',
    });
    const results = run(dir, ['--category=4']);
    const cat4 = results.find((r) => r.category === 'selectorDuplicates');
    expect(cat4.violations).toHaveLength(1);
    expect(cat4.violations[0].message).toMatch(/bd-helper-text/);
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('scanHomeContractViolations', () => {
  it('flags .tsx file in CSS-only themes/components dir', () => {
    const dir = makeFixture({
      'src/themes/components/Button.tsx': 'export const Button = () => null;',
    });
    const results = run(dir, ['--category=5']);
    const cat5 = results.find((r) => r.category === 'homeContractViolations');
    expect(cat5.violations.length).toBeGreaterThanOrEqual(1);
    expect(cat5.violations.some((v) => /Button\.tsx/.test(v.message))).toBe(true);
    rmSync(dir, { recursive: true, force: true });
  });

  it('flags @keyframes inside vibcoder dir', () => {
    const dir = makeFixture({
      'src/editor/shared/vibcoder/Spinner.css': '@keyframes spin { from { transform: rotate(0); } }',
    });
    const results = run(dir, ['--category=5']);
    const cat5 = results.find((r) => r.category === 'homeContractViolations');
    expect(cat5.violations.some((v) => /@keyframes/.test(v.message))).toBe(true);
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('scanAntiPatterns', () => {
  it('flags pass-through wrapper function', () => {
    const dir = makeFixture({
      'tsconfig.json': '{ "compilerOptions": { "target": "es2020", "module": "esnext" } }',
      'src/foo.ts': `
        export function getElements() {
          return composer.elements.getAll();
        }
        function withArgs(a, b) {
          return target.method(a, b);
        }
      `,
    });
    const results = run(dir, ['--category=6']);
    const cat6 = results.find((r) => r.category === 'antiPatterns');
    expect(cat6.violations.length).toBeGreaterThanOrEqual(1);
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('scanLegacyResiduals', () => {
  it('flags each top-level rule in legacy-components.css', () => {
    const dir = makeFixture({
      'src/themes/legacy-components.css': `.foo { color: red; }
.bar { color: blue; }`,
    });
    const results = run(dir, ['--category=7']);
    const cat7 = results.find((r) => r.category === 'legacyResiduals');
    expect(cat7.violations).toHaveLength(2);
    expect(cat7.violations[0].severity).toBe('minor');
    rmSync(dir, { recursive: true, force: true });
  });

  it('returns empty when legacy file does not exist', () => {
    const dir = makeFixture({
      'src/themes/other.css': '.foo { color: red; }',
    });
    const results = run(dir, ['--category=7']);
    const cat7 = results.find((r) => r.category === 'legacyResiduals');
    expect(cat7.violations).toHaveLength(0);
    rmSync(dir, { recursive: true, force: true });
  });

  it('captures multi-line comma-separated selectors', () => {
    const dir = makeFixture({
      'src/themes/legacy-components.css': `.foo,
.bar {
  color: red;
}
`,
    });
    const results = run(dir, ['--category=7']);
    const cat7 = results.find((r) => r.category === 'legacyResiduals');
    expect(cat7.violations).toHaveLength(1);
    expect(cat7.violations[0].message).toMatch(/\.foo.*\.bar/);
    rmSync(dir, { recursive: true, force: true });
  });

  it('reports correct line number for selectors after blank-line gaps', () => {
    const dir = makeFixture({
      'src/themes/legacy-components.css': `.first {
  color: red;
}

.gap-after-blank {
  color: blue;
}
`,
    });
    const results = run(dir, ['--category=7']);
    const cat7 = results.find((r) => r.category === 'legacyResiduals');
    expect(cat7.violations).toHaveLength(2);
    // .first is on line 1; .gap-after-blank is on line 5 (after } on line 3 + blank line 4)
    expect(cat7.violations[1].line).toBe(5);
    rmSync(dir, { recursive: true, force: true });
  });

  it('skips selectors inside JSDoc-style comments with embedded braces', () => {
    const dir = makeFixture({
      'src/themes/legacy-components.css': `/**
 * Header doc with {curly} and {nested,things}.
 */
.real-selector {
  color: red;
}
`,
    });
    const results = run(dir, ['--category=7']);
    const cat7 = results.find((r) => r.category === 'legacyResiduals');
    expect(cat7.violations).toHaveLength(1);
    expect(cat7.violations[0].message).toMatch(/\.real-selector/);
    expect(cat7.violations[0].message).not.toMatch(/Header doc/);
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('scanDocDrift', () => {
  it('flags CLAUDE.md row referencing non-existent path', () => {
    const dir = makeFixture({
      'packages/editor/CLAUDE.md': `# x
| Concept | Canonical Home | Status |
|---------|---------------|--------|
| Existing tokens | \`src/themes/exists/\` | OK |
| Phantom tokens | \`src/themes/missing/\` | OK |
`,
      'src/themes/exists/x.css': '/* exists */',
    });
    const results = run(dir, ['--category=8']);
    const cat8 = results.find((r) => r.category === 'docDrift');
    expect(cat8.violations.length).toBeGreaterThanOrEqual(1);
    expect(cat8.violations.some((v) => /missing/.test(v.message))).toBe(true);
    rmSync(dir, { recursive: true, force: true });
  });

  it('skips strikethrough rows where home cell is wrapped in ~~', () => {
    const dir = makeFixture({
      'packages/editor/CLAUDE.md': `# Test

| Concept | Canonical Home | Status |
|---------|---------------|--------|
| ~~Old thing~~ | ~~\`src/old/\`~~ | DELETED |
`,
    });
    const results = run(dir, ['--category=8']);
    const cat8 = results.find((r) => r.category === 'docDrift');
    expect(cat8.violations).toHaveLength(0);
    rmSync(dir, { recursive: true, force: true });
  });
});

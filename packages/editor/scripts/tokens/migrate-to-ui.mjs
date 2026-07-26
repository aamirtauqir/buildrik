#!/usr/bin/env node
/**
 * Migrate a directory from the legacy component libraries to @/editor/ui.
 *
 *   node scripts/tokens/migrate-to-ui.mjs <dir>            # dry run
 *   node scripts/tokens/migrate-to-ui.mjs <dir> --apply
 *
 * Mechanical only: import sources and the prop renames whose meaning is
 * identical. Anything ambiguous is reported and left alone for a human — a
 * codemod that guesses is worse than one that stops.
 *
 * @license BSD-3-Clause
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, relative } from "node:path";

const [dirArg, ...flags] = process.argv.slice(2);
const APPLY = flags.includes("--apply");
if (!dirArg) {
  console.error("usage: migrate-to-ui.mjs <dir> [--apply]");
  process.exit(1);
}
const ROOT = resolve(process.cwd());
const DIR = resolve(ROOT, dirArg);

/** legacy component name -> new name (null = same name, import path only) */
const RENAME = { TabFrame: "PanelFrame", PremiumBadge: "Badge", Switch: "Toggle", SemanticBadge: "Badge" };
const BUTTON_VARIANT = { danger: "destructive", publish: "primary", bare: "ghost" };
const NEEDS_HUMAN = /\b(PanelShell|Popover|Menu|Toast|NotificationCenter|ColorPicker|Uploader|Slider|Inspector|SidebarShell|HistoryPanel|CommandPalette|Skeleton|A11yOverlay)\b/;

const files = [];
(function walk(d) {
  for (const e of readdirSync(d)) {
    if (e === "node_modules" || e.startsWith(".")) continue;
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(p)) files.push(p);
  }
})(DIR);

let changed = 0;
const skipped = [];
for (const file of files) {
  const before = readFileSync(file, "utf8");
  if (!/shared\/vibcoder|shared\/extensions|shared\/ui/.test(before)) continue;

  let s = before;
  const imported = new Set();

  // collect + drop legacy import statements
  s = s.replace(
    /import\s*\{([^}]+)\}\s*from\s*["'][^"']*(?:editor\/shared\/vibcoder|shared\/extensions|shared\/ui)(?:\/[^"']*)?["'];?\n/g,
    (_m, names) => {
      for (const raw of names.split(",")) {
        const name = raw.trim().split(/\s+as\s+/)[0].trim();
        const alias = raw.trim().split(/\s+as\s+/)[1]?.trim();
        if (!name) continue;
        const mapped = RENAME[name] ?? name;
        imported.add(alias && alias !== mapped ? `${mapped} as ${alias}` : mapped);
      }
      return "";
    },
  );
  if (imported.size === 0) continue;

  if (NEEDS_HUMAN.test([...imported].join(","))) {
    skipped.push(`${relative(ROOT, file)} — uses ${[...imported].filter((i) => NEEDS_HUMAN.test(i)).join(", ")}`);
    continue;
  }

  // JSX tag renames, including compound sub-components (TabFrame.Header etc.)
  for (const [from, to] of Object.entries(RENAME)) {
    s = s.replace(new RegExp(`<${from}(?=[\\s/>.])`, "g"), `<${to}`);
    s = s.replace(new RegExp(`</${from}(?=[\\s>.])`, "g"), `</${to}`);
    s = s.replace(new RegExp(`<(/?)${to}\\.`, "g"), `<$1${to}.`);
  }
  // PremiumBadge had no children; Badge needs the word
  s = s.replace(/<Badge\s+size=\{?["'][a-z]+["']\}?\s*\/>/g, '<Badge kind="pro">PRO</Badge>');
  // ConfirmDialog takes a boolean, not a kind
  s = s.replace(/(<ConfirmDialog[^>]*?)kind="destructive"/gs, "$1destructive");
  s = s.replace(/(<ConfirmDialog[^>]*?)kind="primary"/gs, "$1");

  // prop renames with identical meaning
  s = s.replace(/\bvariant=\{?["']([a-z]+)["']\}?/g, (m, v) => {
    const mapped = BUTTON_VARIANT[v] ?? v;
    return `kind="${mapped}"`;
  });
  s = s.replace(/\bbusy=/g, "loading=");
  s = s.replace(/\bsize=\{?["']lg["']\}?/g, 'size="md"');
  s = s.replace(/\bisOpen=/g, "open=");
  s = s.replace(/\bconfirmText=/g, "confirmLabel=");
  s = s.replace(/\bcancelText=/g, "cancelLabel=");

  // one import for the new library, placed after the react import
  const importLine = `import { ${[...imported].sort().join(", ")} } from "@/editor/ui";\n`;
  if (/^import .*from "react";?\n/m.test(s)) s = s.replace(/^(import .*from "react";?\n)/m, `$1${importLine}`);
  else s = importLine + s;

  if (s !== before) {
    changed++;
    if (APPLY) writeFileSync(file, s);
  }
}

console.log(`${APPLY ? "APPLIED" : "DRY RUN"} — ${dirArg}`);
console.log(`  files migrated: ${changed}`);
if (skipped.length) {
  console.log(`  left for a human (${skipped.length}):`);
  for (const s of skipped) console.log(`    ${s}`);
}

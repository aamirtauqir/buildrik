#!/usr/bin/env node
/**
 * Migrate a directory from the legacy component libraries to @/editor/ui.
 *
 *   node scripts/tokens/migrate-to-ui.mjs <dir>            # dry run
 *   node scripts/tokens/migrate-to-ui.mjs <dir> --apply
 *
 * Mechanical only. Two rules learned the hard way on batch 2:
 *
 *  1. Prop renames are scoped to the tag that owns them. A global
 *     `isOpen -> open` sweep renamed the prop on an unrelated accordion and
 *     produced 112 type errors from one line of regex.
 *  2. Anything needing structural judgement is skipped and listed, never
 *     guessed. A codemod that guesses is worse than one that stops.
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

/** legacy import name -> new name */
const RENAME = { TabFrame: "PanelFrame", PremiumBadge: "Badge", Switch: "Toggle", SemanticBadge: "Badge" };

/** Imports the new library has no equivalent for yet — these files wait. */
const NEEDS_HUMAN = new Set([
  "PanelShell", "Popover", "Menu", "NotificationCenter", "ColorPicker", "ColorTrigger", "Uploader",
  "Slider", "Inspector", "SidebarShell", "HistoryPanel", "CommandPalette", "Skeleton", "A11yOverlay",
  "Toast", "ToastTitle", "ToastDescription", "ToastAction", "ToastClose", "ToastViewport",
  "ModalClose", "ModalContent", "ModalTitle", "ModalDescription", "ModalFooter", "ModalTrigger",
  "DrawerClose", "DrawerContent", "DrawerTitle", "Accordion", "Breadcrumb", "Chipbar", "Switcher",
  "ActionBar", "Frame", "Grid", "Center", "Cluster", "Thumb", "TileMeta", "Kbd", "SurfaceHead",
  "LeftPanel", "PagesDrawer", "TemplatesDrawer", "Topbar", "Footer", "Rail", "RailTile", "Toolbar",
  "SearchInput", "NumericStepper", "Spinner", "Progress", "Divider", "Grip", "Icon", "IconButton",
  "Card", "Link", "Label", "HelperText", "Count", "Tag", "FormField", "BreakpointSwitcher",
  "SkeletonCompounds", "UpgradeModal", "CopyButton", "ErrorState", "HelpTooltip", "Icons",
]);

/**
 * Walk to the real end of a JSX open tag, respecting braces and strings.
 * A regex cannot do this: `onClick={() => x}` contains a `>` that ends the
 * match early, which is how batch 4 ended up with variant= props unrenamed.
 */
function eachTag(src, tag, transform) {
  const open = new RegExp(`<${tag}(?=[\\s/>])`, "g");
  let out = "";
  let last = 0;
  let m;
  while ((m = open.exec(src)) !== null) {
    const start = m.index;
    let i = start;
    let depth = 0;
    let quote = null;
    for (; i < src.length; i++) {
      const c = src[i];
      if (quote) {
        if (c === quote && src[i - 1] !== "\\") quote = null;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") quote = c;
      else if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === ">" && depth === 0) break;
    }
    const end = Math.min(i + 1, src.length);
    out += src.slice(last, start) + transform(src.slice(start, end));
    last = end;
    open.lastIndex = end;
  }
  return out + src.slice(last);
}

/** Rename attributes only inside the given JSX tag. */
function renameAttrsInTag(src, tag, renames) {
  return eachTag(src, tag, (match) => {
    let out = match;
    for (const [from, to] of Object.entries(renames)) out = out.replace(new RegExp(`\\b${from}=`, "g"), `${to}=`);
    return out;
  });
}

/** Map legacy variant values onto the new kind vocabulary, tag-scoped. */
function mapVariantValues(src, tag) {
  const VALUES = { danger: "destructive", publish: "primary", bare: "ghost" };
  return eachTag(src, tag, (match) =>
    match.replace(/\bkind=\{?["']([a-z]+)["']\}?/g, (_m, v) => `kind="${VALUES[v] ?? v}"`),
  );
}

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

  const names = [];
  let s = before.replace(
    /import\s*(?:type\s*)?\{([^}]+)\}\s*from\s*["'][^"']*(?:editor\/shared\/vibcoder|shared\/extensions|shared\/ui)(?:\/[^"']*)?["'];?\n/g,
    (_m, group) => {
      for (const raw of group.split(",")) {
        const [name, alias] = raw.trim().split(/\s+as\s+/).map((x) => (x ? x.trim() : x));
        if (name) names.push({ name, alias });
      }
      return "";
    },
  );
  if (names.length === 0) continue;

  const blocked = [...new Set(names.filter((n) => NEEDS_HUMAN.has(n.name)).map((n) => n.name))];
  if (blocked.length) {
    skipped.push(`${relative(ROOT, file)} — ${blocked.join(", ")}`);
    continue;
  }
  // The old Checkbox took a label prop; the new one expects a real <label>.
  if (/<Checkbox\b[^>]*\blabel=/s.test(s)) {
    skipped.push(`${relative(ROOT, file)} — <Checkbox label=…> needs a real <label>`);
    continue;
  }

  const imported = new Set(
    names.map(({ name, alias }) => {
      const mapped = RENAME[name] ?? name;
      return alias && alias !== mapped ? `${mapped} as ${alias}` : mapped;
    }),
  );

  // JSX tag renames, including compound sub-components (TabFrame.Header)
  for (const [from, to] of Object.entries(RENAME)) {
    s = s.replace(new RegExp(`<${from}(?=[\\s/>.])`, "g"), `<${to}`);
    s = s.replace(new RegExp(`</${from}(?=[\\s>.])`, "g"), `</${to}`);
  }

  // Scoped prop renames — never global.
  s = renameAttrsInTag(s, "Button", { variant: "kind", busy: "loading" });
  s = mapVariantValues(s, "Button");
  s = renameAttrsInTag(s, "ConfirmDialog", {
    isOpen: "open", confirmText: "confirmLabel", cancelText: "cancelLabel", variant: "kind",
  });
  s = s.replace(/(<ConfirmDialog[^>]*?)kind="danger"/gs, "$1destructive");
  s = s.replace(/(<ConfirmDialog[^>]*?)kind="destructive"/gs, "$1destructive");
  s = s.replace(/(<ConfirmDialog[^>]*?)kind="primary"/gs, "$1");
  s = s.replace(/<Badge\s+size=\{?["'][a-z]+["']\}?\s*\/>/g, '<Badge kind="pro">PRO</Badge>');
  s = eachTag(s, "Button", (m) => m.replace(/\bsize=\{?["']lg["']\}?/g, 'size="md"'));

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

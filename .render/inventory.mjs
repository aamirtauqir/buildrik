#!/usr/bin/env node
// Emits docs/designs/GENERATED-inventory.md from the code's own SSOT files.
// Written because a 2026-07-18 audit found 42 hand-written counts wrong across the
// design docs — every one had exactly one authoritative file. Never hand-write these.
//   run: node .render/inventory.mjs
//
// Rule: a count of 0 is treated as a BROKEN PATTERN, not an answer. A wrong number
// that looks plausible is the exact failure this script exists to prevent.

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "/Users/shahg/Desktop/pencil/buildrik/";
const SRC = ROOT + "packages/editor/src/";
const BROKEN = (why) => ({ n: null, why });

function read(rel) {
  const p = rel.startsWith("packages/") ? ROOT + rel : SRC + rel;
  return existsSync(p) ? readFileSync(p, "utf8") : null;
}

/** slice a file between two literal markers */
function slice(rel, from, to) {
  const src = read(rel);
  if (src === null) return BROKEN(`file missing: ${rel}`);
  const i = src.indexOf(from);
  if (i < 0) return BROKEN(`marker "${from}" gone from ${rel}`);
  let body = src.slice(i + from.length);
  if (to) {
    const j = body.indexOf(to);
    if (j < 0) return BROKEN(`closing "${to}" gone from ${rel}`);
    body = body.slice(0, j);
  }
  return { body };
}

/** count regex matches inside a slice; 0 => broken */
function countIn(rel, from, to, re) {
  const s = slice(rel, from, to);
  if (s.n === null) return s;
  const m = s.body.match(re);
  const n = m ? m.length : 0;
  return n === 0 ? BROKEN(`pattern matched nothing in ${rel}`) : { n };
}

/** distinct captured values inside a slice; 0 => broken */
function uniqIn(rel, from, to, re, group = 1) {
  const s = slice(rel, from, to);
  if (s.n === null) return s;
  const set = new Set();
  for (const m of s.body.matchAll(re)) set.add(m[group]);
  return set.size === 0
    ? BROKEN(`pattern matched nothing in ${rel}`)
    : { n: set.size, values: [...set] };
}

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { if (f !== "__tests__") walk(p, out); }
    else if (/\.tsx?$/.test(f)) out.push(p);
  }
  return out;
}

const ROWS = [
  ["Element types", "shared/types/element.ts", () =>
    uniqIn("shared/types/element.ts", "export type ElementType", ";", /"([a-zA-Z-]+)"/g)],

  ["Blocks — in the registry", "blocks/blockRegistry.ts", () =>
    countIn("blocks/blockRegistry.ts", "blockDefinitions: BlockDefinition[] = [", "\n];",
      /^\s{2}[a-zA-Z][a-zA-Z0-9]*Config,/gm)],

  ["Blocks — categories in the registry", "blocks/blockRegistry.ts", () =>
    uniqIn("blocks/blockRegistry.ts", "blockDefinitions: BlockDefinition[] = [", "\n];",
      /\/\/\s*([A-Z][a-zA-Z]+)\s+blocks/g)],

  ["Blocks — in the shipped Insert panel", "editor/sidebar/tabs/build/catalog/catalog.ts", () =>
    countIn("editor/sidebar/tabs/build/catalog/catalog.ts", "CATALOG: CatEntry[] = [", "\n];", /blockId:\s*"/g)],

  ["Blocks — categories in the shipped panel", "editor/sidebar/tabs/build/catalog/catalog.ts", () =>
    uniqIn("editor/sidebar/tabs/build/catalog/catalog.ts", "CATALOG: CatEntry[] = [", "\n];", /^\s{2}\{\s*\n\s*id:\s*"([a-z]+)"/gm)],

  ["⌘K commands registered", "engine/commands/defaultCommands.ts", () =>
    uniqIn("engine/commands/defaultCommands.ts", "", null, /id:\s*"([a-z0-9-]+)"/g)],

  ["Icons", "shared/constants/icons.ts", () =>
    countIn("shared/constants/icons.ts", "ICON_CATEGORIES: IconCategory[] = [", "\n];", /\{\s*name:\s*"/g)],

  ["Icon categories", "shared/constants/icons.ts", () =>
    uniqIn("shared/constants/icons.ts", "ICON_CATEGORIES: IconCategory[] = [", "\n];",
      /^\s{2}\{\s*\n?\s*id:\s*"([a-z-]+)"/gm)],

  ["DS token kinds", "engine/designSystem/types.ts", () =>
    uniqIn("engine/designSystem/types.ts", "export type TokenKind =", ";", /"([a-z]+)"/g)],

  ["DS default tokens", "editor/design-system/constants.ts", () =>
    countIn("editor/design-system/constants.ts", "", null, /cssVar:\s*"/g)],

  ["Style presets", "editor/design-system/constants.ts", () =>
    countIn("editor/design-system/constants.ts", "DEFAULT_PRESETS", "\n];", /\{\s*\n?\s*id:\s*"/g)],

  ["Starter themes", "editor/design-system/starters/index.ts", () =>
    countIn("editor/design-system/starters/index.ts", "STARTER_DS_REGISTRY", "\n];",
      /^\s{2}[a-zA-Z][a-zA-Z0-9]*,/gm)],

  ["Inspector sections", "editor/inspector/sections/registry/_shared.tsx", () =>
    uniqIn("editor/inspector/sections/registry/_shared.tsx", "SectionId", ";", /"([a-z-]+)"/g)],

  ["Inspector element profiles", "editor/inspector/config/elementProfiles.ts", () =>
    uniqIn("editor/inspector/config/elementProfiles.ts", "", null,
      /const ([A-Z_]+)_PROFILE:\s*ElementProfile/g)],

  ["Interaction triggers", "editor/inspector/sections/interactions/types.ts", () =>
    uniqIn("editor/inspector/sections/interactions/types.ts", "InteractionTrigger", ";", /"([a-z-]+)"/g)],

  ["Interaction animation presets", "editor/inspector/sections/interactions/types.ts", () =>
    countIn("editor/inspector/sections/interactions/types.ts", "ANIMATION_PRESET_GROUPS", "\n};",
      /\{\s*value:\s*"/g)],

  ["Animation editor presets", "editor/animation/AnimationEditor.tsx", () =>
    countIn("editor/animation/AnimationEditor.tsx", "entrance:", "\nconst easings", /\{\s*value:\s*"/g)],

  ["Animation easings", "editor/animation/AnimationEditor.tsx", () =>
    countIn("editor/animation/AnimationEditor.tsx", "const easings", "\n];", /\{\s*value:\s*"/g)],

  ["Component catalog", "editor/components-catalog/catalog.ts", () =>
    countIn("editor/components-catalog/catalog.ts", "=", "\n];", /\{\s*\n?\s*id:\s*"/g)],

  ["Rail tabs configured", "editor/rail/tabsConfig.ts", () =>
    uniqIn("editor/rail/tabsConfig.ts", "", null, /^\s*id:\s*"([a-z]+)"/gm)],

  ["Settings screens (in-tab)", "editor/sidebar/tabs/settings/SettingsTab.tsx", () =>
    uniqIn("editor/sidebar/tabs/settings/SettingsTab.tsx", "", null,
      /\{\s*id:\s*"([a-z-]+)",\s*title:[^}]*group:/g)],

  ["Settings deep-links (leave the editor)", "editor/sidebar/tabs/settings/SettingsTab.tsx", () =>
    uniqIn("editor/sidebar/tabs/settings/SettingsTab.tsx", "", null,
      /\{\s*id:\s*"([a-z-]+)",\s*title:[^}]*scope:/g)],

  ["Engine Manager classes (total)", "engine/**", () => {
    const files = walk(SRC + "engine");
    const set = new Set();
    for (const f of files)
      for (const m of readFileSync(f, "utf8").matchAll(/export class ([A-Za-z]+Manager)\b/g))
        set.add(m[1]);
    return set.size ? { n: set.size } : BROKEN("no Manager classes found in engine/");
  }],

  ["Engine Managers wired into Composer", "engine/Composer.ts", () => {
    const src = read("engine/Composer.ts");
    if (src === null) return BROKEN("Composer.ts missing");
    const set = new Set();
    for (const m of src.matchAll(/import\s*\{([^}]*)\}/g))
      for (const part of m[1].split(","))
        if (/Manager$/.test(part.trim())) set.add(part.trim());
    return set.size ? { n: set.size } : BROKEN("no Manager imports in Composer");
  }],
];

function flags() {
  const src = read("shared/utils/featureFlags.ts");
  if (src === null) return "⚠ featureFlags.ts missing";
  const names = [...src.matchAll(/^\s{2}([a-zA-Z]+):/gm)].map((m) => m[1]);
  return names.length ? names.join(" · ") : "⚠ pattern broken";
}

const L = [];
let broken = 0;
L.push("# GENERATED — code inventory");
L.push("");
L.push("> **Do not edit, and do not hand-write any of these numbers in another document.** Regenerate with `node .render/inventory.mjs`.");
L.push(">");
L.push("> Written because a 2026-07-18 audit found **42 hand-written claims wrong** across the design docs — every one had exactly one authoritative source file. Design docs should link here rather than restate.");
L.push(">");
L.push("> A count of **0 is reported as a broken pattern, never as an answer** — a plausible-looking wrong number is the failure this file exists to prevent.");
L.push(">");
L.push(`> Generated ${new Date().toISOString().slice(0, 16).replace("T", " ")}.`);
L.push("");
L.push("| What | Count | Source of truth |");
L.push("|---|---|---|");

for (const [label, file, fn] of ROWS) {
  let r;
  try { r = fn(); } catch (e) { r = BROKEN(e.message); }
  let cell;
  if (r.n === null) { broken++; cell = `⚠ **BROKEN** — ${r.why}`; }
  else cell = r.values && r.values.length <= 14 ? `**${r.n}** — ${r.values.join(" · ")}` : `**${r.n}**`;
  L.push(`| ${label} | ${cell} | \`${file}\` |`);
}

L.push("");
L.push(`**Feature flags:** ${flags()} — check each default before calling a gated feature "working".`);
L.push("");
L.push("## Why a number here can differ from a number in a design doc");
L.push("");
L.push("Usually both are true and mean different things:");
L.push("");
L.push("- **Registry vs shipped surface** — the block registry and the Insert panel's catalog are different files with different contents. A doc quoting the registry describes a target; the panel is what a user sees.");
L.push("- **Registered vs reachable** — commands live in `defaultCommands.ts`, but a palette that builds its own list never exposes them.");
L.push("- **Implemented vs gated** — code behind a flag defaulting to false is code no user has.");
L.push("- **Total vs wired** — a class can exist in `engine/` and never be instantiated by `Composer`.");
L.push("");
L.push("When this file and a design doc disagree, this file is right about the code; the doc may still be right about the target. State which you mean.");

const OUT = ROOT + "docs/designs/GENERATED-inventory.md";
const next = L.join("\n") + "\n";

// --check : drift gate. Fails when a registry changed and nobody regenerated.
// This is the only reason a number in a design doc is worth trusting.
if (process.argv.includes("--check")) {
  const prev = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  const strip = (t) => t.replace(/^> Generated .*$/m, "");
  if (strip(prev) !== strip(next)) {
    console.error("DRIFT — the code changed and docs/designs/GENERATED-inventory.md is stale.");
    console.error("Run: node .render/inventory.mjs");
    process.exit(1);
  }
  console.log(`inventory up to date — ${broken} broken pattern(s)`);
  if (broken) process.exit(1);
} else {
  writeFileSync(OUT, next);
  console.log(`written docs/designs/GENERATED-inventory.md — ${broken} broken pattern(s)`);
  if (broken) process.exitCode = 1;
}

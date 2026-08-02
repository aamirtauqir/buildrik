#!/usr/bin/env node
/**
 * Remove rules whose every selector is dead.
 *
 * Selector-list aware: `.live, .dead { }` keeps `.live` and drops `.dead`.
 * Compound-aware: `.dead .live` is dropped whole — the rule can never match,
 * because its ancestor never exists.
 * Block-aware: recurses into @media / @supports so nested rules are handled,
 * and drops an at-block that ends up empty.
 *
 * Refuses to touch @keyframes bodies (percent selectors are not classes).
 */
import { readFileSync, writeFileSync } from "node:fs";

const DEAD = new Set(process.argv[2].split(",").map((s) => s.trim()).filter(Boolean));
if (DEAD.size === 0) { console.error("no dead classes given"); process.exit(1); }
const files = process.argv.slice(3);

/** Split a CSS block into top-level statements, respecting nesting + strings. */
function statements(src) {
  const out = [];
  let depth = 0, start = 0, inStr = null, inComment = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (inComment) { if (c === "*" && n === "/") { inComment = false; i++; } continue; }
    if (inStr) { if (c === "\\") i++; else if (c === inStr) inStr = null; continue; }
    if (c === "/" && n === "*") { inComment = true; i++; continue; }
    if (c === '"' || c === "'") { inStr = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) { out.push(src.slice(start, i + 1)); start = i + 1; } }
    else if (c === ";" && depth === 0) { out.push(src.slice(start, i + 1)); start = i + 1; }
  }
  if (start < src.length) out.push(src.slice(start));
  return out;
}

const selectorHasDead = (sel) =>
  [...sel.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)].some((m) => DEAD.has(m[1]));

function processBlock(src) {
  let removed = 0;
  const kept = [];
  for (const st of statements(src)) {
    const open = st.indexOf("{");
    if (open === -1) { kept.push(st); continue; }               // @import etc.
    const head = st.slice(0, open);
    const body = st.slice(open + 1, st.lastIndexOf("}"));
    const bare = head.replace(/\/\*[\s\S]*?\*\//g, "").trim();

    if (/^@(keyframes|font-face|property|layer\s|charset)/.test(bare)) { kept.push(st); continue; }
    if (/^@(media|supports|container|scope)/.test(bare)) {
      const r = processBlock(body);
      removed += r.removed;
      if (r.text.trim() === "") { removed += 0; continue; }      // empty at-block goes
      kept.push(`${head}{${r.text}}`);
      continue;
    }

    const selectors = bare.split(",").map((s) => s.trim()).filter(Boolean);
    const live = selectors.filter((s) => !selectorHasDead(s));
    if (live.length === 0) { removed += selectors.length; continue; }
    if (live.length !== selectors.length) {
      removed += selectors.length - live.length;
      // preserve any leading comment/whitespace that belonged to this rule
      const lead = head.slice(0, head.length - head.trimStart().length);
      kept.push(`${lead}${live.join(",\n")} {${body}}`);
      continue;
    }
    kept.push(st);
  }
  return { text: kept.join(""), removed };
}

let grand = 0;
for (const f of files) {
  const before = readFileSync(f, "utf8");
  const { text, removed } = processBlock(before);
  if (!removed) continue;
  // collapse the 3+ blank lines a removal can leave behind
  const cleaned = text.replace(/\n{3,}/g, "\n\n");
  writeFileSync(f, cleaned);
  const d = before.split("\n").length - cleaned.split("\n").length;
  console.log(`${String(removed).padStart(3)} selectors, -${d} lines  ${f}`);
  grand += removed;
}
console.log(`\ntotal dead selectors removed: ${grand}`);

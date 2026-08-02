#!/usr/bin/env node
/**
 * Checks the rule documents against the repo they describe.
 *
 * Written after two audits of the same seven files found different things. The
 * first pass was done by reading, and missed an entire stale section
 * (DESIGN.md §Implementation Notes) that told readers to define
 * `var(--buildrick-*)` chrome tokens — which Gate 15 rejects outright, so
 * following the doc produced a build failure. A mechanical pass over every
 * backticked path found it in seconds. Reading a document twice is not the same
 * as checking it once.
 *
 * What it checks, and only this:
 *   PATH    — a repo path in backticks that does not exist
 *   SCRIPT  — an `npm run x` / `pnpm run x` whose script is in no package.json
 *   GATE    — a `gate:x` that is not a real script
 *
 * What it deliberately does NOT check:
 *   ENV VARS. The obvious heuristic (does `process.env.X` appear anywhere)
 *   reported 29 hits and ALL 29 were false — every one of those vars is read,
 *   just through destructuring, a helper, or a framework that reads it
 *   internally (NextAuth reads AUTH_TRUST_HOST itself; Prisma reads
 *   DATABASE_URL). A check that is wrong 29 times out of 29 trains you to
 *   ignore the output, which is worse than not having it.
 *
 * Findings are not automatically defects. Rule docs legitimately name paths
 * that no longer exist — deletion history, "this used to live at X" notes, and
 * hypothetical bad examples ("don't dump things in `components/ui/`"). Those
 * are the point of the record. Read the line before believing the finding; the
 * question is always "does this line describe the present in the present
 * tense?"
 *
 * Usage: node scripts/audit/rule-drift-scan.mjs [--quiet]
 * Exit code is always 0 — this is an audit, not a gate. Making it a gate would
 * require an allowlist of every historical mention, and that allowlist would
 * rot faster than the docs.
 */
import { readFileSync, existsSync } from "node:fs";

const DOCS = [
  "CLAUDE.md",
  "DESIGN.md",
  "packages/dashboard/AGENTS.md",
  "packages/editor/CLAUDE.md",
  "packages/editor/src/editor/AGENTS.md",
  "packages/editor/src/engine/AGENTS.md",
  "server/AGENTS.md",
];

const PACKAGE_JSONS = ["package.json", "packages/editor/package.json", "packages/dashboard/package.json"];

/** Lines that are recording history rather than instructing. */
const HISTORICAL = [
  /~~/,                                   // struck-through
  /\b\d{4}-\d{2}-\d{2}\b/,               // any dated line is a record, not an instruction
  /\b(deleted|delete|removed|retired|dropped|killed|graveyard|no longer exists|was renamed|moved|successor|absorbed)\b/i,
];

/** Lines teaching by counter-example — the path is meant NOT to exist. */
const EXAMPLE = [/\bdon'?t\b/i, /\bnever\b/i, /\bprefer\b/i, /\binstead of\b/i, /\bGALAT\b/, /\bNAHI\b/];

const scriptNames = new Set();
for (const p of PACKAGE_JSONS) {
  if (!existsSync(p)) continue;
  for (const name of Object.keys(JSON.parse(readFileSync(p, "utf8")).scripts ?? {})) scriptNames.add(name);
}

const PATH_RE = /`((?:packages|src|server|scripts|app|components|lib|docs|e2e|prisma|themes|emails)\/[A-Za-z0-9._/-]+)`/g;
const RUN_RE = /(?:npm|pnpm) run ([a-z0-9:_-]+)/g;
const GATE_RE = /`(gate:[a-z0-9:_-]+)`/g;

/** A doc under packages/editor/src may write paths relative to its own tree. */
const candidatesFor = (doc, p) => [
  p,
  `packages/editor/${p}`,
  `packages/dashboard/${p}`,
  `packages/editor/src/${p.replace(/^src\//, "")}`,
  `${doc.split("/").slice(0, -1).join("/")}/${p}`,
];

const findings = [];
for (const doc of DOCS) {
  if (!existsSync(doc)) {
    findings.push({ doc, line: 0, kind: "PATH", what: doc, note: "rule document itself is missing" });
    continue;
  }
  readFileSync(doc, "utf8").split("\n").forEach((text, i) => {
    const line = i + 1;
    const historical = HISTORICAL.some((re) => re.test(text)) || EXAMPLE.some((re) => re.test(text));
    for (const [, p] of text.matchAll(PATH_RE)) {
      if (candidatesFor(doc, p).some((c) => existsSync(c))) continue;
      findings.push({ doc, line, kind: "PATH", what: p, historical });
    }
    for (const [, name] of text.matchAll(RUN_RE)) {
      if (scriptNames.has(name)) continue;
      findings.push({ doc, line, kind: "SCRIPT", what: name, historical });
    }
    for (const [, gate] of text.matchAll(GATE_RE)) {
      if (scriptNames.has(gate)) continue;
      findings.push({ doc, line, kind: "GATE", what: gate, historical });
    }
  });
}

const live = findings.filter((f) => !f.historical);
const history = findings.filter((f) => f.historical);
const quiet = process.argv.includes("--quiet");

console.log(`[rule-drift] ${DOCS.length} documents checked.`);
console.log(`[rule-drift] ${live.length} claim(s) in present tense point at something that is not there.`);
for (const f of live) console.log(`  ${f.kind.padEnd(6)} ${f.doc}:${f.line}  ${f.what}${f.note ? `  — ${f.note}` : ""}`);

if (!quiet && history.length) {
  console.log(`\n[rule-drift] ${history.length} more on lines that read as history or counter-example (dated rows, deletion notes, "do not put X in Y"). Shown for completeness:`);
  for (const f of history) console.log(`  ${f.kind.padEnd(6)} ${f.doc}:${f.line}  ${f.what}`);
}
console.log(`\n[rule-drift] Env vars are NOT checked — see the header for why that check was removed.`);

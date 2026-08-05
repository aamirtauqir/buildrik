#!/usr/bin/env node
/**
 * Derive a conformance spec from a committed Figma response.
 *
 * INPUT   scripts/conformance/raw-figma/<surface>.json   (agent step, committed)
 * OUTPUT  scripts/conformance/specs/<surface>.json       (derived, committed)
 *
 * This script NEVER talks to Figma. It is a pure file-to-file transform, which
 * is the only reason it can be unit tested at all. See README §"Why extraction
 * is an agent step" for why fetching is not scriptable here — short version:
 * the MCP is a remote HTTP endpoint behind interactive OAuth whose token lives
 * in the agent's keychain, so CI cannot reach it and a build script has no
 * business reading Claude Code's credential store.
 *
 * WHY PARSE, RATHER THAN HAND-WRITE THE EXPECTED VALUES
 * `packages/dashboard/scripts/check-figma-conformance.mjs` hand-writes 14
 * expected hex values. It has been red since the palette changed on 2026-07-30,
 * and it is the third time that gate family has gone stale on an accent flip.
 * Hand-authored expectations rot the moment the board moves. A derived spec
 * cannot: re-run extraction and the numbers follow the design.
 *
 * WHAT get_design_context ACTUALLY RETURNS
 * React + Tailwind where arbitrary values carry the token name AND its fallback:
 *
 *     bg-[var(--color\/bg-card,white)]        -> token --color/bg-card, fallback white
 *     rounded-[var(--radius\/lg,8px)]         -> token --radius/lg,     fallback 8px
 *     h-[56px] w-[1440px] px-[16px]           -> plain geometry
 *
 * The backslashes are Tailwind escaping the `/` in the class name; they are not
 * part of the token. Both halves are kept: the value gates CI, the token
 * identity is advisory (only ~6% of shipped chrome classes carry a var() at
 * all, so a missing token is UNKNOWN, never a failure).
 *
 * FRESHNESS
 * `figmaHash` is sha256 of the raw code string — it changes when the board
 * changes. `extractorVersion` changes when THIS parser changes. Both are
 * needed: the hash cannot see a parser that started reading a property
 * differently, and the version cannot see a board edit.
 *
 * EXIT CODES
 * 0 on success, 3 on every failure. Deliberately no exit 1: in the harness
 * taxonomy 1 means FAIL — a measured value did not match its spec — and this
 * script performs no comparison, so it can never observe that. Everything that
 * goes wrong here (input absent, `code` empty, zero targets parsed) means the
 * same thing: no spec was produced. That is MISSING.
 *
 * The first version got this wrong and returned 1 for a missing raw file. A
 * negative control caught it. Worth stating because the distinction is the
 * whole point of having a taxonomy: 1 says the design and the code disagree,
 * 3 says we never got far enough to know.
 *
 * @license BSD-3-Clause
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Version lives in lib.mjs so a consumer can read it without executing an
// extraction — this file does its work at module top level.
import { EXTRACTOR_VERSION, figmaTokenValue, compareValue } from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(HERE, "raw-figma");
const SPEC_DIR = join(HERE, "specs");

/** Tailwind escapes `/` inside arbitrary values. Undo it. */
const unescapeTw = (s) => s.replace(/\\+\//g, "/");

/**
 * Parse one arbitrary-value payload into either a token reference or a literal.
 *   "var(--color/bg-card,white)" -> { token: "--color/bg-card", value: "white" }
 *   "56px"                       -> { value: "56px" }
 */
const parseValue = (rawInner) => {
  const inner = unescapeTw(rawInner);
  const m = inner.match(/^var\(\s*(--[^,)]+?)\s*(?:,\s*(.+?)\s*)?\)$/);
  if (m) return { token: m[1], value: m[2] ?? null };
  return { value: inner };
};

/**
 * Utility prefixes worth extracting, mapped to the CSS property they express.
 * `px-`/`py-` expand to both sides so a spec compares against the same
 * longhand `getComputedStyle` reports — a shorthand would never match.
 */
const SINGLE = {
  "w-": ["width"], "h-": ["height"],
  "min-w-": ["min-width"], "min-h-": ["min-height"], "max-w-": ["max-width"],
  "bg-": ["background-color"],
  "rounded-": ["border-radius"],
  "gap-": ["gap"],
  "border-": ["border-color"],
  "px-": ["padding-left", "padding-right"],
  "py-": ["padding-top", "padding-bottom"],
  "pt-": ["padding-top"], "pr-": ["padding-right"],
  "pb-": ["padding-bottom"], "pl-": ["padding-left"],
  "leading-": ["line-height"],
};

/** Extract every `data-node-id` element with its className. */
const elements = (code) => {
  const out = [];
  // Match a tag's attribute soup, then pull className + data-node-id from it.
  for (const tag of code.matchAll(/<[a-zA-Z][^>]*?data-node-id="([^"]+)"[^>]*>/g)) {
    const attrs = tag[0];
    const id = tag[1];
    const cls = attrs.match(/className=(?:"([^"]*)"|\{[^"]*"([^"]*)"[^}]*\})/);
    const name = attrs.match(/data-name="([^"]*)"/);
    out.push({ nodeId: id, name: name?.[1] ?? null, className: cls ? (cls[1] ?? cls[2] ?? "") : "" });
  }
  return out;
};

/** Turn a className string into { property -> {token?, value} }. */
const propsFrom = (className) => {
  const props = {};
  for (const cls of className.split(/\s+/).filter(Boolean)) {
    // text-[color:var(...)] and text-[13px] share a prefix but mean different things.
    const textArb = cls.match(/^text-\[(.+)\]$/);
    if (textArb) {
      const body = textArb[1];
      if (body.startsWith("color:")) props["color"] = parseValue(body.slice(6));
      else props["font-size"] = parseValue(body);
      continue;
    }
    const m = cls.match(/^([a-z-]+?-)\[(.+)\]$/);
    if (!m) continue;
    const targets = SINGLE[m[1]];
    if (!targets) continue;
    const parsed = parseValue(m[2]);
    for (const t of targets) props[t] = parsed;
  }
  return props;
};

const surfaceArg = process.argv.slice(2).find((a) => !a.startsWith("--"));
const surfaces = surfaceArg
  ? [surfaceArg]
  : existsSync(RAW_DIR)
    ? readdirSync(RAW_DIR).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""))
    : [];

if (!surfaces.length) {
  console.error(`[extract] no raw-figma input. Expected ${RAW_DIR}/<surface>.json — an agent step writes it.`);
  process.exit(3);
}

let missing = 0;
for (const surface of surfaces) {
  const rawPath = join(RAW_DIR, `${surface}.json`);
  if (!existsSync(rawPath)) {
    console.error(`[extract] ${surface}: no such raw file ${rawPath}`);
    missing++; continue;
  }
  const raw = JSON.parse(readFileSync(rawPath, "utf8"));
  if (typeof raw.code !== "string" || !raw.code.length) {
    console.error(`[extract] ${surface}: raw file has no \`code\` string — nothing to parse.`);
    missing++; continue;
  }

  const targets = elements(raw.code)
    .map((el) => ({ ...el, props: propsFrom(el.className) }))
    .filter((el) => Object.keys(el.props).length > 0);

  // An empty extraction must NEVER be written. A spec with zero targets makes
  // every later diff vacuously green, which is the exact failure this harness
  // exists to prevent.
  if (!targets.length) {
    console.error(
      `[extract] ${surface}: parsed 0 targets from ${raw.code.length} chars. ` +
      `Either the board is empty or get_design_context changed its output shape — ` +
      `refusing to write a spec that would pass by default.`
    );
    missing++; continue;
  }

  // A board class carries BOTH the token name and a literal fallback:
  //   bg-[var(--color\/accent,#3366f2)]
  // When the fallback disagrees with what `figma-tokens.json` holds for that
  // token, the BOARD is wrong — the designer edited a raw fill instead of the
  // variable. Writing that spec teaches the harness to fail correct,
  // token-using chrome, and the fix an implementer applies is to delete the
  // token. That is how `#3366f2` reached 95 instances across 65 boards.
  //
  // Refuse the spec instead. Unresolvable tokens stay UNKNOWN, never a failure
  // (same rule as figmaTokenToBk) — only a token we can place AND disagree
  // with blocks extraction.
  const drift = [];
  for (const t of targets) {
    for (const [prop, p] of Object.entries(t.props)) {
      if (!p.token || p.value == null) continue;
      const tokenValue = figmaTokenValue(p.token);
      if (tokenValue == null) continue;
      const c = compareValue(prop, p.value, tokenValue);
      if (c.verdict === "FAIL") {
        drift.push(
          `  ${t.name ?? t.nodeId} · ${prop}: board says ${c.expected}, ` +
          `token ${p.token} holds ${c.actual}`
        );
      }
    }
  }
  if (drift.length) {
    console.error(
      `[extract] ${surface}: ${drift.length} propert(ies) contradict the token they name.\n` +
      drift.join("\n") + "\n" +
      `          The board drifted off its own variable. Fix the fill in Figma to\n` +
      `          reference the variable, re-fetch the raw file, and re-run. Refusing\n` +
      `          to write a spec that would make correct token usage fail.`
    );
    missing++; continue;
  }

  const spec = {
    surface,
    fileKey: raw.fileKey,
    nodeId: raw.nodeId,
    boardName: raw.boardName ?? null,
    figmaHash: createHash("sha256").update(raw.code).digest("hex"),
    extractorVersion: EXTRACTOR_VERSION,
    extractedAt: raw.fetchedAt ?? null,
    targets,
  };
  mkdirSync(SPEC_DIR, { recursive: true });
  const outPath = join(SPEC_DIR, `${surface}.json`);
  writeFileSync(outPath, JSON.stringify(spec, null, 2) + "\n");
  const tokened = targets.reduce((n, t) => n + Object.values(t.props).filter((p) => p.token).length, 0);
  const total = targets.reduce((n, t) => n + Object.keys(t.props).length, 0);
  console.log(`[extract] ${surface}: ${targets.length} node(s), ${total} propert(ies), ${tokened} carry a token → ${outPath}`);
}

// 3, never 1 — see the EXIT CODES note in the header.
process.exit(missing ? 3 : 0);

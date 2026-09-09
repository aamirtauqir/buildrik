#!/usr/bin/env node
/**
 * Shared vocabulary for the conformance harness: recipe schema, token mapping,
 * value normalisation, and the tolerance table.
 *
 * Everything here is derived from `scripts/tokens/figma-tokens.json` rather
 * than hardcoded, so a new token group reaches extract, diff and any future
 * consumer at once. The dashboard's `check-figma-conformance.mjs` hardcodes 14
 * expected hex values and has been red since the palette moved on 2026-07-30 —
 * that is the failure this file exists to avoid repeating.
 *
 * @license BSD-3-Clause
 */
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Bump when the extractor's OUTPUT changes for unchanged input — a new
 * property, a different normalisation, a fixed bug. Specs carrying an older
 * version are STALE and must be re-extracted even though their figmaHash still
 * matches: the hash sees the board move, this sees the parser move.
 *
 * Lives here, not in extract.mjs, because extract.mjs runs its work at module
 * top level — importing it just to read a constant would execute an extraction
 * and call process.exit. Shared constants belong with the shared vocabulary.
 */
export const EXTRACTOR_VERSION = 2;

const HERE = dirname(fileURLToPath(import.meta.url));
const TOKENS_PATH = join(HERE, "..", "tokens", "figma-tokens.json");

// ── Token mapping ─────────────────────────────────────────────────────────

/**
 * Build `figma token name -> --bk-* name` by replaying generate.mjs's naming
 * rule over the same source it reads. Derived, never hand-listed.
 *
 *   palette/blue/700  -> --bk-blue-700
 *   semantic/bg-card  -> --bk-bg-card
 *   radius/lg         -> --bk-radius-lg
 *   size/drawer       -> --bk-size-drawer
 */
const buildTokenMap = () => {
  const t = JSON.parse(readFileSync(TOKENS_PATH, "utf8"));
  const map = new Map(); // bare name (no group) -> { bk, value }
  const add = (bare, bk, value) => map.set(bare, { bk, value: String(value) });

  for (const [k, v] of Object.entries(t.palette ?? {})) add(k, `--bk-${k.replace(/\//g, "-")}`, v);
  for (const [k, v] of Object.entries(t.semantic ?? {})) add(k, `--bk-${k}`, v);
  for (const [k, v] of Object.entries(t.radius ?? {})) add(`radius/${k}`, `--bk-radius-${k}`, `${v}px`);
  for (const [k, v] of Object.entries(t.size ?? {})) add(`size/${k}`, `--bk-size-${k}`, `${v}px`);
  return map;
};

let _tokenMap = null;
const tokenMap = () => (_tokenMap ??= buildTokenMap());

/**
 * Map a token as the Figma board writes it onto our generated `--bk-*` name.
 *
 * Boards namespace by group — `--color/bg-card`, `--radius/lg`,
 * `--flowbite/blue/700` — while `figma-tokens.json` stores the same things
 * under `semantic`, `radius` and `palette`. Strip the board's group prefix and
 * look the remainder up.
 *
 * Returns null for a token we cannot place. That is reported as UNKNOWN, never
 * as a failure: the board legitimately references things the chrome token set
 * does not carry.
 */
export function figmaTokenToBk(figmaToken) {
  if (!figmaToken) return null;
  const bare = figmaToken.replace(/^--/, "");
  const m = tokenMap();
  // `--color/x` and `--flowbite/a/b` -> try the tail, then the whole thing.
  const tail = bare.replace(/^(color|flowbite|semantic|palette)\//, "");
  return m.get(tail)?.bk ?? m.get(bare)?.bk ?? m.get(`radius/${tail}`)?.bk ?? null;
}

/** The value `figma-tokens.json` holds for a board token, or null. */
export function figmaTokenValue(figmaToken) {
  if (!figmaToken) return null;
  const bare = figmaToken.replace(/^--/, "");
  const tail = bare.replace(/^(color|flowbite|semantic|palette)\//, "");
  const m = tokenMap();
  return (m.get(tail) ?? m.get(bare) ?? m.get(`radius/${tail}`))?.value ?? null;
}

// ── Normalisation ─────────────────────────────────────────────────────────

const NAMED = { white: "#ffffff", black: "#000000", transparent: "rgba(0,0,0,0)" };

/**
 * Reduce any colour notation to lowercase `#rrggbb`, so a spec written
 * `white` compares equal to a browser reporting `rgb(255, 255, 255)`.
 *
 * Returns the input unchanged when it is not a colour — callers treat an
 * unparsed value as a plain string compare rather than guessing.
 */
export function normalizeColor(v) {
  if (v == null) return null;
  const s = String(v).trim().toLowerCase();
  if (NAMED[s]) return NAMED[s];
  const rgb = s.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/);
  if (rgb) {
    const a = rgb[4];
    // A fully transparent colour is not "black" — keep them distinguishable.
    if (a !== undefined && parseFloat(a) === 0) return "rgba(0,0,0,0)";
    const hex = (n) => Math.round(parseFloat(n)).toString(16).padStart(2, "0");
    return `#${hex(rgb[1])}${hex(rgb[2])}${hex(rgb[3])}`;
  }
  const short = s.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
  if (/^#[0-9a-f]{6}$/.test(s)) return s;
  if (/^#[0-9a-f]{8}$/.test(s)) return s.slice(0, 7); // drop alpha for comparison
  return s;
}

/**
 * "56px" | "56" | 56 -> 56. Returns null when there is no number to read.
 *
 * A pill radius is the one length CSS does not report as a number. Tailwind's
 * `rounded-full` computes to `calc(infinity * 1px)`, which this parser read as
 * null, so every pill in the product compared UNCOMPARABLE against a board
 * drawing `rounded-[9999px]` — the badge component's radius was simply not
 * being checked. Both spellings mean "fully round", so both fold to the same
 * sentinel and compare equal; a board asking for 9999px and a product shipping
 * a 4px corner still fails, which is the case that matters.
 */
const PILL = 9999;
/* Where the fold STARTS. Boards in this file are authored with both 9999 and
   999 for the same intent — 1160:58's quota track is 5px tall on a 999 radius,
   which is a pill by any reading — and comparing 999 against a product's
   `--bk-radius-full` (9999) reported a 9000px difference on a shape that is
   pixel-identical. Nothing in this design system asks for a literal radius
   between 999 and 9999, so folding from 999 cannot mask a real difference. */
const PILL_FLOOR = 999;
export function normalizeLength(v) {
  if (v == null) return null;
  const s = String(v).trim();
  if (/^calc\(\s*infinity\s*\*\s*1px\s*\)$/.test(s)) return PILL;
  // ...and Chrome does not always hand back that calc() spelling: on a
  // `rounded-full` element it resolves the radius itself and reports
  // "3.35544e+07px". Without the exponent in this pattern the match failed,
  // the parser returned null, and the pill was UNCOMPARABLE again — the same
  // blind spot the calc() branch above was written to close, reopened by the
  // browser rather than by Tailwind. Found 2026-09-08 on the Media type chips.
  const m = s.match(/^(-?[\d.]+(?:e[+-]?\d+)?)\s*px$|^(-?[\d.]+(?:e[+-]?\d+)?)$/i);
  const n = m ? parseFloat(m[1] ?? m[2]) : null;
  return n !== null && n >= PILL_FLOOR ? PILL : n;
}

// ── Tolerance ─────────────────────────────────────────────────────────────

/**
 * How close counts as equal, per property class.
 *
 * One global number cannot do this job: 0.5px of slack is meaningless on a 1px
 * border and far too tight to matter on a 320px drawer. The classes below are
 * the decision from the CEO review, recorded so a future reader sees intent
 * rather than a magic constant.
 *
 * `font-family` is STRING equality, not token identity. A computed style
 * returns the resolved family stack; it cannot tell "used the right token"
 * from "resolved to the same family another way". Claiming otherwise would ask
 * the harness for information it does not have.
 */
export const TOLERANCE = {
  length: { px: 0.5, props: [
    "width", "height", "min-width", "min-height", "max-width",
    "padding-top", "padding-right", "padding-bottom", "padding-left",
    "margin-top", "margin-right", "margin-bottom", "margin-left",
    "gap", "line-height",
  ] },
  exact: { px: 0, props: [
    "border-radius", "border-width",
    "border-top-width", "border-bottom-width",
    "font-size",
  ] },
  color: { props: ["color", "background-color", "border-color", "border-top-color", "border-bottom-color"] },
  string: { props: ["font-family", "font-weight", "display", "overflow", "white-space"] },
};

const CLASS_OF = (() => {
  const m = new Map();
  for (const [cls, def] of Object.entries(TOLERANCE)) for (const p of def.props ?? []) m.set(p, cls);
  return m;
})();

/** Which tolerance class governs a property. Unknown properties compare exactly. */
export function toleranceClass(prop) {
  return CLASS_OF.get(prop) ?? "exact";
}

/**
 * Compare one property. Returns { verdict, expected, actual, delta? } where
 * verdict is "PASS" | "FAIL" | "UNKNOWN".
 *
 * UNKNOWN means the comparison could not be made (a value the normalisers
 * could not read), and is never counted as a pass — a check that cannot see
 * is not a check that agrees.
 */
export function compareValue(prop, expected, actual) {
  const cls = toleranceClass(prop);
  if (expected == null || actual == null) return { verdict: "UNKNOWN", expected, actual };

  if (cls === "color") {
    const e = normalizeColor(expected), a = normalizeColor(actual);
    return { verdict: e === a ? "PASS" : "FAIL", expected: e, actual: a };
  }
  if (cls === "length" || cls === "exact") {
    const e = normalizeLength(expected), a = normalizeLength(actual);
    if (e == null || a == null) {
      // Not numeric on one side (e.g. line-height "normal") — fall back to string.
      const se = String(expected).trim(), sa = String(actual).trim();
      return { verdict: se === sa ? "PASS" : "UNKNOWN", expected: se, actual: sa };
    }
    const allowed = cls === "length" ? TOLERANCE.length.px : TOLERANCE.exact.px;
    const delta = Math.abs(e - a);
    return { verdict: delta <= allowed ? "PASS" : "FAIL", expected: e, actual: a, delta: +delta.toFixed(3) };
  }
  const se = String(expected).trim().toLowerCase(), sa = String(actual).trim().toLowerCase();
  return { verdict: se === sa ? "PASS" : "FAIL", expected: se, actual: sa };
}

// ── Recipe schema ─────────────────────────────────────────────────────────

/* `clickIfPresent` is a PRECONDITION, not an interaction: dismiss a thing if it
   happens to be there. It exists because the first-run coach mark appears only
   on a fresh session — a plain `click` fails when it is absent, and omitting the
   step fails when it is present, so neither expresses "get this out of the way".
   It is deliberately NOT a general escape hatch: it swallows a miss, so a step
   that must happen has to stay a `click`. */
const STEP_ACTIONS = new Set(["click", "clickIfPresent", "contextmenu", "hover", "waitFor", "waitForState", "press", "wait"]);

/**
 * Read and validate a surface recipe.
 *
 * Two rules, enforced rather than remembered, because sixty recipe files is
 * far too many for a convention:
 *
 *   1. A target is addressed by `testId`, never by CSS. A class-based selector
 *      breaks at the next styling change and unhooks measurement silently —
 *      `.bd-topbar` and `.bd-bp-switcher` were named in this repo's only
 *      recipe and exist in no file under src/.
 *   2. CSS is allowed in steps ONLY for `waitForState`, and only with a
 *      `because` naming why no element expresses the state. "The panel has
 *      finished opening" is a class, not an element; everything else is not.
 *
 * Throws with the file and the offending entry named. Callers exit 3.
 */
export function validateRecipe(recipe, surfaceId) {
  const err = (msg) => { throw new Error(`recipe "${surfaceId}": ${msg}`); };

  if (!Array.isArray(recipe.targets) || recipe.targets.length === 0) {
    err("has no targets — a recipe that measures nothing passes by default");
  }
  const seen = new Set();
  for (const t of recipe.targets) {
    if (!t.name) err(`a target has no name: ${JSON.stringify(t)}`);
    if (seen.has(t.name)) err(`duplicate target name "${t.name}"`);
    seen.add(t.name);
    if (!t.testId) {
      err(`target "${t.name}" is addressed by CSS (${JSON.stringify(t.selector ?? null)}). ` +
          `Targets must use testId — add a data-testid to the element and name it here.`);
    }
    if (t.mode && !["single", "uniform"].includes(t.mode)) {
      err(`target "${t.name}" has unknown mode "${t.mode}" (expected "single" or "uniform")`);
    }
    if (t.skipProps != null) {
      if (typeof t.skipProps !== "object" || Array.isArray(t.skipProps)) {
        err(`target "${t.name}" has a skipProps that is not an object of property -> reason`);
      } else {
        for (const [prop, why] of Object.entries(t.skipProps)) {
          if (typeof why !== "string" || why.trim().length < 12) {
            err(`target "${t.name}" skips "${prop}" without a real reason. A refusal that does not ` +
                `say why is indistinguishable from an oversight — write what the board asks for and ` +
                `why the code does not follow it.`);
          }
        }
      }
    }
    if (t.nth != null && !t.because) {
      err(`target "${t.name}" uses nth:${t.nth} without a \`because\`. Position is not identity — ` +
          `filtering or sorting makes nth point at a different element. Prefer mode:"uniform", ` +
          `which reads every match and asserts the siblings agree.`);
    }
  }

  for (const [i, s] of (recipe.steps ?? []).entries()) {
    if (!STEP_ACTIONS.has(s.action)) err(`step[${i}] has unknown action "${s.action}"`);
    if (s.action === "press" || s.action === "wait") continue;
    /* Pointer actions may address by CSS **with a `because`**, on the same
       terms waitForState already had. The canvas body is
       `dangerouslySetInnerHTML` from the engine: every node carries
       `data-buildrick-id` and none carries `data-testid`, so three boards
       (1176:4866 ctx-menu, 1176:4925 hover-levels, 1176:4824 inline-edit) could
       not be reached at all — a `contextmenu` on the canvas container lands
       above the element and `closest("[data-buildrick-id]")` returns null.
       The alternative was stamping conformance anchors into engine output,
       i.e. changing the product to suit the instrument. `data-buildrick-id` is
       a real, stable contract; addressing it is honest, and the mandatory
       `because` keeps it from becoming a general escape hatch. TARGETS still
       may not use CSS — only steps. */
    const CSS_STEPS = new Set(["waitForState", "click", "clickIfPresent", "hover", "contextmenu"]);
    if (s.selector && CSS_STEPS.has(s.action) && s.action !== "waitForState" && !s.because) {
      err(`step[${i}] (${s.action}) uses a CSS selector without a \`because\`. Say why no ` +
          `testId can reach this element — the canvas's engine-rendered nodes are the ` +
          `case this exists for, not a shortcut past adding an anchor.`);
    }
    if (s.selector && !CSS_STEPS.has(s.action)) {
      err(`step[${i}] (${s.action}) uses a CSS selector. Only waitForState may, and only ` +
          `with a \`because\` naming the state that has no element of its own.`);
    }
    if (s.action === "waitForState" && !s.because) {
      err(`step[${i}] is a waitForState without \`because\` — say why no element expresses this state.`);
    }
    if (!s.testId && !s.selector) err(`step[${i}] (${s.action}) has neither testId nor selector`);
  }
  return recipe;
}

/** Read + validate in one call. */
export function readRecipe(path, surfaceId) {
  return validateRecipe(JSON.parse(readFileSync(path, "utf8")), surfaceId);
}

/**
 * Run one script over every recipe in `surfaces/`, and fail the run if ANY
 * single surface fails (T5, plan §Failure modes — the one critical gap the eng
 * review flagged).
 *
 * The naive shape — a `for` loop that awaits each surface in-process — is
 * exactly the "gate that lies" this harness exists to prevent: one thrown
 * recipe, one swallowed rejection, and the loop reports green for screens it
 * never measured. So each surface runs in its own process and its exit code is
 * kept. A crash is a failure, not a gap in the log.
 *
 * Sequential on purpose. Both consumers drive a browser against one dev
 * server; running them in parallel would have surfaces competing for the same
 * viewport and produce measurements that depend on scheduling.
 *
 * @param {string} scriptPath - the caller's own file; it re-invokes itself per surface.
 * @param {string[]} args - the caller's argv tail; `--all` is dropped, the rest pass through.
 * @returns {number} 0 when every surface passed, 1 otherwise.
 */
export function runEvery(scriptPath, args) {
  const ids = readdirSync(join(HERE, "surfaces"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .sort();

  if (ids.length === 0) {
    console.error("[all] no recipes in surfaces/ — nothing was measured, which is not a pass.");
    return 1;
  }

  const passThrough = args.filter((a) => a !== "--all");
  const failures = [];
  for (const id of ids) {
    console.log(`\n[all] ── ${id} ─────────────────────────────────────────`);
    const run = spawnSync(process.execPath, [scriptPath, id, ...passThrough], { stdio: "inherit" });
    // `status === null` means the child was killed by a signal (OOM, timeout).
    // That is a failure with no exit code, and must never fall through as 0.
    const code = run.status ?? 1;
    if (code !== 0) failures.push({ id, code });
  }

  if (failures.length) {
    console.error(
      `\n[all] FAIL — ${failures.length} of ${ids.length} surface(s): ` +
        failures.map((f) => `${f.id}(exit ${f.code})`).join(", "),
    );
    return 1;
  }
  console.log(`\n[all] PASS — ${ids.length} surface(s).`);
  return 0;
}

// ── Argument parsing ───────────────────────────────────────────────────────

/**
 * Parse `<id...> [--flags]` with a known-flag allowlist.
 *
 * Every script used `args.find(a => !a.startsWith("--"))`, which silently
 * accepts any flag at all. Two consequences that were live:
 *
 *   `extract.mjs --help`            -> no id found -> extracted and REWROTE
 *                                      every committed spec. Idempotent today;
 *                                      a 287-file commit the day
 *                                      EXTRACTOR_VERSION bumps.
 *   `diff.mjs s --update-baselin`   -> typo ignored, prints PASS, exits 0, and
 *                                      does not update the baseline.
 *
 * Unknown flags exit 64 (EX_USAGE). Deliberately NOT 2 — that is STALE in this
 * harness's taxonomy, and three scripts were overloading it for usage errors.
 */
export function parseArgs(argv, { script, usage, flags = {} }) {
  const ids = [];
  const seen = new Map();
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) { ids.push(a); continue; }
    if (!(a in flags)) {
      const known = Object.keys(flags).join(" ");
      console.error(
        `[${script}] unknown flag ${a}\n` +
        `          cause: flags are allowlisted so a typo cannot be silently ignored.\n` +
        `          fix:   ${usage}\n` +
        `                 known flags: ${known || "(none)"}`,
      );
      process.exit(64);
    }
    if (flags[a] === "value") {
      const v = argv[++i];
      if (v == null || v.startsWith("--")) {
        console.error(`[${script}] ${a} needs a value\n          fix:   ${usage}`);
        process.exit(64);
      }
      seen.set(a, v);
    } else {
      seen.set(a, true);
    }
  }
  return {
    ids,
    id: ids[0],
    has: (f) => seen.has(f),
    get: (f) => seen.get(f) ?? null,
  };
}

// ── Baseline: ONE file, two writers, one merge rule ────────────────────────

/**
 * `.conformance-baseline.json` carries two independent ratchets per surface:
 *
 *   skipped / compared              written by diff.mjs   (coverage)
 *   contrastFailures / nonTextFailures  written by measure.mjs (a11y)
 *
 * They were written by two scripts with two different merge semantics —
 * `measure.mjs` spread the existing entry, `diff.mjs` assigned a fresh object.
 * So `diff --update-baseline` silently DELETED the a11y keys, and the next
 * `measure` read `contrastFailures ?? 0`, saw the real 3, and reported
 * "TEXT CONTRAST REGRESSION: 3 > baseline 0. A new failure was introduced" —
 * a false statement about a cause that never happened. `diff --all
 * --update-baseline` disarmed every contrast baseline in the repo in one
 * command.
 *
 * Both writers now go through `patchBaseline`, which merges by key. A writer
 * can only ever change the keys it owns.
 */
export const BASELINE_PATH = join(HERE, ".conformance-baseline.json");

export function readBaseline(path = BASELINE_PATH) {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};
}

/** Merge `patch` into one surface's entry, preserving every key it omits. */
export function patchBaseline(surfaceId, patch, path = BASELINE_PATH) {
  const all = readBaseline(path);
  all[surfaceId] = { ...(all[surfaceId] ?? {}), ...patch };
  writeFileSync(path, JSON.stringify(all, null, 2) + "\n");
  return all[surfaceId];
}

/**
 * Key a contrast failure the way a human identifies one: which element, which
 * words, which two colours. Text failures carry `text`, icon failures `label`.
 */
export const contrastKey = (p) =>
  [p.selector, p.text ?? p.label ?? "", p.color, p.bg].join(" | ");

/** `{key: ratio}` for a list of failures. */
export const contrastSet = (list) =>
  Object.fromEntries((list ?? []).map((p) => [contrastKey(p), Number(p.ratio)]));

/**
 * Compare a measured failure set against its baseline set (F6).
 *
 * A COUNT cannot do this job: fix one pair, introduce another, and `now >
 * baseline` is false while a real regression ships. It also cannot see a pair
 * getting worse — 4.4 -> 2.1 is the same single failure. So three outcomes are
 * reported separately, and only the set can tell them apart:
 *
 *   `newPairs`   a measured pair with no baseline entry   — the swap
 *   `worsePairs` a known pair whose ratio fell            — silent decay
 *   `fixedPairs` a baseline pair no longer measured       — an improvement
 */
export function compareContrast(nowSet, baseSet) {
  const newPairs = [];
  const worsePairs = [];
  for (const [key, ratio] of Object.entries(nowSet)) {
    if (!(key in baseSet)) newPairs.push({ key, ratio });
    else if (ratio < baseSet[key]) worsePairs.push({ key, was: baseSet[key], now: ratio });
  }
  const fixedPairs = Object.keys(baseSet).filter((k) => !(k in nowSet));
  return { newPairs, worsePairs, fixedPairs };
}

/**
 * Which form, if any, renders `id` as a test anchor somewhere in `haystack`.
 *
 * Three forms are in normal use and a literal grep only sees the first:
 *   literal    `data-testid="x"`
 *   forwarded  a component takes `testId="x"` and renders `data-testid={testId}`
 *   template   `data-testid={`insert-group-${k}`}` → ids like `insert-group-layout`
 *
 * Returns `"literal"`, `"forwarded"`, `` `template:<prefix>${…}` `` or `null`.
 *
 * The template verdict is deliberately weaker than the other two: it proves a
 * template exists whose literal prefix this id starts with, NOT that this exact
 * id is ever produced. Only a browser settles that, and measure.mjs already
 * does. This check exists to catch an anchor that has left the codebase.
 */
/*
 * Literal prefixes of every id-building template in a file, memoised.
 *
 * Two shapes. The attribute form — `` data-testid={`insert-group-${k}`} `` —
 * and ONE LEVEL OF INDIRECTION, because the id is often not built in the
 * attribute at all: `ListRow` renders `data-testid={sub("label")}` where
 * ``const sub = (part) => `row-${part}-${rowId}` ``. The attribute holds a
 * CALL and the template lives in a helper, so an attribute-only regex reported
 * all 66 of that component's derived anchors as missing while every one of
 * them renders.
 *
 * Memoised per haystack because `anchorForm` is called once per anchor and the
 * scan is per file: recomputing it made `check-anchors` — documented at ~0.3s
 * — exceed two minutes.
 */
const PREFIX_CACHE = new WeakMap();
const PREFIX_CACHE_STR = new Map();
function templatePrefixes(haystack) {
  const cache = typeof haystack === "string" ? PREFIX_CACHE_STR : PREFIX_CACHE;
  const hit = cache.get(haystack);
  if (hit) return hit;

  const out = [...haystack.matchAll(/(?:data-testid|testId)=\{`([^`$]*)\$\{/g)].map((m) => m[1]);
  const called = new Set(
    [...haystack.matchAll(/(?:data-testid|testId)=\{([A-Za-z_$][\w$]*)/g)].map((m) => m[1]),
  );
  /* Line-scoped, not whole-file: the first version used
     `(?:const|let|var|function)\s+(?:a|b|c)\b[^\n]*?\`([^\`$]*)\$\{`
     across the entire text and its lazy `[^\n]*?` backtracked hard enough to
     take `check-anchors` from ~0.3s to 37s. A declaration and its template
     literal sit on the same line in every case here, so scan lines. */
  if (called.size) {
    /* A three-line window, not a single line. The first version required the
       declaration and its template literal to sit on the SAME line, which made
       the instrument dictate the source: an agent reformatted three helpers
       onto one line each purely to be seen. A prettier-wrapped arrow —
           const sub = (part: string) =>
             `row-${part}-${rowId}`;
       is the normal shape, and a checker that cannot read it is the one that is
       wrong. Three lines covers declaration + arrow + body; still linear, and
       measured at no cost against the whole-file regex it replaced. */
    const lines = haystack.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (!/(?:const|let|var|function)\s/.test(lines[i])) continue;
      let names = false;
      for (const n of called) { if (lines[i].includes(n)) { names = true; break; } }
      if (!names) continue;
      const window = lines.slice(i, i + 3).join("\n");
      for (const m of window.matchAll(/`([^`$]*)\$\{/g)) out.push(m[1]);
    }
  }
  const list = out.filter(Boolean);
  cache.set(haystack, list);
  return list;
}

export function anchorForm(id, haystack) {
  const has = (s) => haystack.includes(s);
  if (has(`data-testid="${id}"`) || has(`data-testid='${id}'`)
    || has(`data-testid={"${id}"}`) || has(`data-testid={\`${id}\`}`)) return "literal";
  /* A two-literal ternary — `data-testid={open ? "a-open" : "a-shut"}` — names
     BOTH ids literally, and both render. The checker used to see neither, so an
     agent changed the SOURCE to satisfy the tool: a real id was replaced with a
     literal plus a data- attribute purely to be greppable. That is the
     instrument dictating code shape, which is the wrong way round. */
  for (const m of haystack.matchAll(/data-testid=\{[^}]*?\?\s*["'`]([^"'`]+)["'`]\s*:\s*["'`]([^"'`]+)["'`]/g)) {
    if (m[1] === id || m[2] === id) return "literal";
  }
  if (has(`testId="${id}"`) || has(`testId='${id}'`)
    || has(`testId={"${id}"}`) || has(`testId={\`${id}\`}`)) return "forwarded";
  const prefix = templatePrefixes(haystack).find((p) => id.startsWith(p));
  return prefix ? `template:${prefix}\${…}` : null;
}

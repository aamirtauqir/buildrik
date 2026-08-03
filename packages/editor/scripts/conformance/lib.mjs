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
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

/** "56px" | "56" | 56 -> 56. Returns null when there is no number to read. */
export function normalizeLength(v) {
  if (v == null) return null;
  const m = String(v).trim().match(/^(-?[\d.]+)\s*px$|^(-?[\d.]+)$/);
  return m ? parseFloat(m[1] ?? m[2]) : null;
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

const STEP_ACTIONS = new Set(["click", "hover", "waitFor", "waitForState", "press", "wait"]);

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
    if (t.nth != null && !t.because) {
      err(`target "${t.name}" uses nth:${t.nth} without a \`because\`. Position is not identity — ` +
          `filtering or sorting makes nth point at a different element. Prefer mode:"uniform", ` +
          `which reads every match and asserts the siblings agree.`);
    }
  }

  for (const [i, s] of (recipe.steps ?? []).entries()) {
    if (!STEP_ACTIONS.has(s.action)) err(`step[${i}] has unknown action "${s.action}"`);
    if (s.action === "press" || s.action === "wait") continue;
    if (s.selector && s.action !== "waitForState") {
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

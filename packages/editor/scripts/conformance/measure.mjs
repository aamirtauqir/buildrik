#!/usr/bin/env node
/**
 * Conformance Phase 0b — live-DOM measurement runner.
 * Plan: docs/designs/2026-07-26-editor-conformance-plan.md
 *
 * Usage:  node scripts/conformance/measure.mjs <surface-id> [--url http://localhost:5050/]
 *         node scripts/conformance/measure.mjs --list
 *
 * Reads surfaces/<surface-id>.json, drives the running editor to that state
 * at the board's viewport, then dumps for every target: geometry, computed
 * fills/radii/typography, and a WCAG contrast verdict for every element in
 * scope that paints text directly. Output: measured/<surface-id>.json
 * (gitignored — it describes a build, not the source).
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as playwright from "playwright-core";
// Browser pin + font gate are shared with e2e/style-parity.spec.ts — same
// mechanics, different question. See e2e/lib/measure-lib.mjs.
import { launchPinnedBrowser, fontsLoadedStatus } from "../../e2e/lib/measure-lib.mjs";
// Recipe schema lives in lib.mjs so every consumer reads the same rules.
import { validateRecipe, runEvery, readBaseline, patchBaseline, parseArgs, contrastSet, compareContrast } from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SURFACES = join(HERE, "surfaces");
const OUT_DIR = join(HERE, "measured");

const args = process.argv.slice(2);
const USAGE = "usage: measure.mjs <surface-id> [--url <base>] [--update-baseline] | --all | --list";
const cli = parseArgs(args, {
  script: "measure",
  usage: USAGE,
  flags: { "--all": "bool", "--list": "bool", "--update-baseline": "bool", "--url": "value" },
});
if (cli.has("--list")) {
  for (const f of readdirSync(SURFACES)) console.log(f.replace(/\.json$/, ""));
  process.exit(0);
}
if (cli.has("--all")) process.exit(runEvery(import.meta.filename, args));
const surfaceId = cli.id;
if (!surfaceId) {
  // 64 (EX_USAGE), not 2 — 2 means STALE in this harness's taxonomy.
  console.error(`[measure] ${USAGE}`);
  process.exit(64);
}
const recipePath = join(SURFACES, `${surfaceId}.json`);
if (!existsSync(recipePath)) {
  console.error(
    `[measure] no recipe at ${recipePath}\n` +
    `          cause: "${surfaceId}" is not a surface this harness knows.\n` +
    `          fix:   \`node scripts/conformance/measure.mjs --list\` shows every surface id,\n` +
    `                 or copy scripts/conformance/surfaces/layers-loading.json as a starting point.`,
  );
  process.exit(3);
}
const recipe = JSON.parse(readFileSync(recipePath, "utf8"));
const baseUrl = cli.get("--url") ?? recipe.url ?? "http://localhost:5050/";

/**
 * The server a URL expects, named so a connection refusal is actionable.
 *
 * Two roots, and this is the single most common way a first run fails: `:5050`
 * is the demo app, `:5051` is the component probe (a different vite root), and
 * eight of the nine shipped recipes use the probe. The README documents only
 * the first, so "I started the server" is usually "I started the wrong one".
 */
const serverFor = (url) => {
  const port = (() => { try { return new URL(url).port; } catch { return ""; } })();
  if (port === "5051") return "npx vite . --port 5051 --strictPort   # probe host";
  if (port === "5050") return "npx vite --port 5050   # demo app";
  return `a server on ${url}`;
};

// The `channel: "chrome"` fallback that used to live here is gone (2026-08-03).
// Falling back meant the same commit could be measured in two different
// renderers; CI is Ubuntu and development is macOS, so that is a font and
// layout difference presented as a conformance result. Exit 3 instead — an
// instrument we cannot trust yields MISSING, never a pass.
let browser;
try {
  browser = await launchPinnedBrowser(playwright);
} catch (err) {
  console.error(`[measure] ${err.message}`);
  process.exit(3);
}
const page = await browser.newPage({ viewport: recipe.viewport ?? { width: 1440, height: 900 } });
// domcontentloaded + the recipe's own waitFor steps — networkidle is flaky
// under load (vite dev serves hundreds of modules) and never settles on
// pages that poll.
try {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120000 });
} catch (err) {
  // Uncaught, this threw a node stack trace and exited 1 — which in this
  // harness's taxonomy means FAIL, "a measured value did not match its spec".
  // It is the most likely error in the whole tool reported as the one code
  // that sends a newcomer off to debug their CSS. Nothing was measured, so it
  // is 3 (MISSING), and the fix is the server command for this recipe's URL.
  console.error(
    `[measure] could not open ${baseUrl}\n` +
    `          cause: ${err.message.split("\n")[0]}\n` +
    `          fix:   start the server this surface measures against, then re-run:\n` +
    `                 ${serverFor(baseUrl)}`,
  );
  await browser.close();
  process.exit(3);
}

// Fonts before geometry. `domcontentloaded` says nothing about whether the UI
// typeface has resolved, and every text-dependent measurement below is wrong if
// taken against a fallback face. Self-hosted since 2026-08-03 so this settles
// in milliseconds; the gate is for determinism, not speed. Exit 3 on anything
// but "loaded" — see measure-lib.mjs for why the obvious one-liner no-ops.
const fontStatus = await fontsLoadedStatus(page);
if (fontStatus !== "loaded") {
  console.error(
    `[measure] fonts did not finish loading (status=${fontStatus}) — refusing to measure\n` +
    `          cause: every text measurement below would be taken against a fallback face.\n` +
    `          fix:   "unloaded" usually means the page served no @font-face — check that\n` +
    `                 src/themes/fonts.css is imported by the host at ${baseUrl}.\n` +
    `                 "loading" means it timed out; re-run, and if it persists check that\n` +
    `                 src/themes/fonts/*.woff2 are being served (10 files expected).`,
  );
  await browser.close();
  process.exit(3);
}

/**
 * Resolve a step/target reference to a CSS selector string.
 *
 * `testId` is the contract (see the recipe's own _note). A raw `selector` is
 * still accepted for state waits — "the panel has finished opening" is a class,
 * not an element — but never for targets, which is enforced below.
 */
const refToSelector = (ref, where) => {
  if (ref.testId) return `[data-testid="${ref.testId}"]`;
  if (ref.selector) return ref.selector;
  throw new Error(`${where} has neither testId nor selector: ${JSON.stringify(ref)}`);
};

// Schema is enforced in lib.mjs so measure, diff and any future consumer read
// the same rules. A target addressed by CSS is how this recipe rotted in the
// first place: `.bd-topbar` and `.bd-bp-switcher` were named here and exist
// nowhere in src/, so the run died before measuring anything.
try {
  validateRecipe(recipe, surfaceId);
} catch (err) {
  console.error(`[measure] ${err.message}`);
  await browser.close();
  process.exit(3);
}

for (const step of recipe.steps ?? []) {
  const sel = step.action === "press" || step.action === "wait" ? null : refToSelector(step, `step ${step.action}`);
  try {
    if (step.action === "click") await page.click(sel, { timeout: 15000 });
    else if (step.action === "hover") await page.hover(sel, { timeout: 15000 });
    else if (step.action === "waitFor") await page.waitForSelector(sel, { timeout: 15000 });
    else if (step.action === "press") await page.keyboard.press(step.key);
    else if (step.action === "wait") await page.waitForTimeout(step.ms ?? 300);
    else throw new Error(`unknown step action: ${step.action}`);
  } catch (err) {
    // A step that cannot find its element is a MISSING measurement, not a
    // failed one, and certainly not an unhandled TimeoutError dumped as a
    // stack trace (which is what this used to do — exit 1, 120s wait, no
    // indication of which step or which surface).
    console.error(
      `[measure] surface "${surfaceId}": step ${JSON.stringify(step)} could not ` +
      `resolve "${sel}". Nothing was measured.\n` +
      `          ${err.message.split("\n")[0]}`
    );
    await browser.close();
    process.exit(3);
  }
}
// Let transitions settle before reading computed styles.
await page.waitForTimeout(400);

// Every target must resolve to EXACTLY one element before anything is read.
// Zero means the anchor is gone; more than one means the id is ambiguous and
// whichever element happens to be first would be measured — a silently wrong
// number is worse than no number.
const resolution = await page.evaluate(
  (sels) => sels.map(({ name, sel }) => ({ name, sel, count: document.querySelectorAll(sel).length })),
  (recipe.targets ?? []).map((t) => ({ name: t.name, sel: refToSelector(t, `target ${t.name}`) })),
);
const unresolved = resolution.filter((r) => r.count !== 1);
if (unresolved.length) {
  console.error(`[measure] surface "${surfaceId}": ${unresolved.length} target(s) did not resolve to exactly one element:`);
  for (const r of unresolved) {
    console.error(`          ${r.name.padEnd(22)} ${r.sel}  ->  ${r.count} match(es)`);
  }
  await browser.close();
  process.exit(3);
}

/**
 * Read every target plus the contrast sweep, once. Called per interaction
 * state, so this must stay free of side effects on the page.
 */
const readAll = () => page.evaluate(({ targets, contrastScope, ignore }) => {
  const lum = (r, g, b) => {
    const f = (c) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const parse = (css) => {
    const m = css.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
    return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
  };
  const blend = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  // Effective opaque background behind el: walk up compositing each
  // non-transparent layer until one is opaque (or default to white page).
  const effectiveBg = (el) => {
    const layers = [];
    for (let n = el; n; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a >= 1) break;
      }
    }
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    for (const layer of layers.reverse()) bg = blend(layer, bg);
    return bg;
  };
  const ratio = (fg, bg) => {
    const l1 = lum(fg.r, fg.g, fg.b);
    const l2 = lum(bg.r, bg.g, bg.b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const paintsTextDirectly = (el) =>
    [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);

  const readTarget = (name, sel) => {
    const el = document.querySelector(sel);
    if (!el) return { name, selector: sel, found: false };
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return {
      name,
      selector: sel,
      found: true,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      style: {
        background: s.backgroundColor,
        color: s.color,
        borderRadius: s.borderRadius,
        border: s.border,
        boxShadow: s.boxShadow === "none" ? "none" : s.boxShadow,
        fontFamily: s.fontFamily.split(",")[0].replace(/"/g, ""),
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        lineHeight: s.lineHeight,
      },
      /**
       * Everything a Figma spec can express, keyed by the CSS property name so
       * diff.mjs can join without a translation table. Added 2026-08-03: the
       * extractor emits padding, gap and border-color from the board, and
       * without these the diff reported UNKNOWN for most of every spec — a
       * harness that cannot see the properties it is given is not measuring.
       *
       * Longhand only. `getComputedStyle` reports shorthand inconsistently and
       * a spec's `padding-left` would never match a `padding` string.
       */
      css: {
        "width": `${r.width}px`,
        "height": `${r.height}px`,
        "min-width": s.minWidth,
        "min-height": s.minHeight,
        "max-width": s.maxWidth,
        "padding-top": s.paddingTop,
        "padding-right": s.paddingRight,
        "padding-bottom": s.paddingBottom,
        "padding-left": s.paddingLeft,
        "margin-top": s.marginTop,
        "margin-right": s.marginRight,
        "margin-bottom": s.marginBottom,
        "margin-left": s.marginLeft,
        "gap": s.gap === "normal" ? "0px" : s.gap,
        "background-color": s.backgroundColor,
        "color": s.color,
        "border-color": s.borderTopColor,
        "border-top-width": s.borderTopWidth,
        "border-bottom-width": s.borderBottomWidth,
        "border-radius": s.borderTopLeftRadius,
        "font-size": s.fontSize,
        "font-weight": s.fontWeight,
        "font-family": s.fontFamily,
        "line-height": s.lineHeight,
        "display": s.display,
        "overflow": s.overflow,
      },
    };
  };

  // `sel` is resolved node-side (testId -> [data-testid="..."]) and passed in,
  // so this browser-side code never needs to know the recipe's addressing rules.
  const targets_ = (targets ?? []).map((t) => readTarget(t.name, t.sel));

  // Contrast sweep: every visible element painting text directly, page-wide
  // (or scoped by the recipe's contrastScope selector).
  const scope = document.querySelector(contrastScope ?? "body") ?? document.body;
  const ignoreSel = (ignore ?? []).join(",");
  const pairs = [];
  for (const el of scope.querySelectorAll("*")) {
    if (ignoreSel && el.closest(ignoreSel)) continue;
    if (!paintsTextDirectly(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || +s.opacity === 0) continue;
    const fgRaw = parse(s.color);
    if (!fgRaw) continue;
    const bg = effectiveBg(el);
    const fg = fgRaw.a < 1 ? blend(fgRaw, bg) : fgRaw;
    const px = parseFloat(s.fontSize);
    const bold = +s.fontWeight >= 700;
    const large = px >= 18 || (px >= 14 && bold);
    const needed = large ? 3 : 4.5;
    const got = ratio(fg, bg);
    if (got < needed) {
      pairs.push({
        text: el.textContent.trim().slice(0, 40),
        selector:
          el.tagName.toLowerCase() +
          (el.id ? `#${el.id}` : "") +
          (el.classList.length ? `.${[...el.classList].slice(0, 2).join(".")}` : ""),
        color: s.color,
        bg: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        ratio: Math.round(got * 100) / 100,
        needed,
      });
    }
  }
  /**
   * NON-TEXT CONTRAST — WCAG 1.4.11, threshold 3:1, not 4.5.
   *
   * The sweep above only sees elements that paint text directly, so an
   * icon-only control is invisible to it. In this product that is most of the
   * chrome: the rail and the topbar are almost entirely icon buttons. An icon
   * too light against its fill passed every check we had.
   *
   * Scope is deliberately narrow, because 1.4.11 covers parts needed to
   * IDENTIFY a control, not decoration. An SVG only qualifies here when it is
   * inside an interactive element that has no visible text of its own — then
   * the glyph IS the affordance, and if it cannot be seen the control cannot
   * be identified. A decorative icon sitting next to a text label is skipped.
   *
   * Colour resolution: an SVG usually paints with `currentColor`, so the
   * computed `color` of the icon (or its nearest styled ancestor) is the
   * effective stroke. Explicit `stroke`/`fill` win when set to a real colour.
   */
  const INTERACTIVE = 'button, a[href], [role="button"], [role="tab"], [role="menuitem"], input, select, textarea';
  const nonText = [];
  const seenIcon = new Set();
  for (const svg of scope.querySelectorAll("svg")) {
    if (ignoreSel && svg.closest(ignoreSel)) continue;
    const control = svg.closest(INTERACTIVE);
    if (!control) continue;                       // decorative, not a control part
    if (control.textContent.trim().length > 0) continue;  // has a text label; icon is not the only affordance
    if (seenIcon.has(control)) continue;
    seenIcon.add(control);

    const r = svg.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(svg);
    if (cs.visibility === "hidden" || +cs.opacity === 0) continue;

    // stroke/fill may be "none" or currentColor — fall back to computed color.
    const pick = (v) => (v && v !== "none" && !v.startsWith("url(") ? v : null);
    const raw = parse(pick(cs.stroke) ?? pick(cs.fill) ?? cs.color);
    if (!raw) continue;
    const bg = effectiveBg(control);
    const fg = raw.a < 1 ? blend(raw, bg) : raw;
    const got = ratio(fg, bg);
    const needed = 3;                              // non-text UI component
    if (got < needed) {
      nonText.push({
        kind: "icon",
        label: control.getAttribute("aria-label") || control.getAttribute("title") || "(unlabelled)",
        selector:
          control.tagName.toLowerCase() +
          (control.id ? `#${control.id}` : "") +
          (control.classList.length ? `.${[...control.classList].slice(0, 2).join(".")}` : ""),
        color: cs.stroke !== "none" ? cs.stroke : cs.color,
        bg: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
        size: `${Math.round(r.width)}x${Math.round(r.height)}`,
        ratio: Math.round(got * 100) / 100,
        needed,
      });
    }
  }

  return { targets: targets_, contrastFailures: pairs, nonTextFailures: nonText };
}, {
  targets: (recipe.targets ?? []).map((t) => ({ name: t.name, sel: refToSelector(t, `target ${t.name}`) })),
  contrastScope: recipe.contrastScope,
  ignore: recipe.ignore,
});

/**
 * INTERACTION STATES — one page visit, not one per state.
 *
 * Four states across sixty surfaces is 240 page loads if each reloads; one
 * visit each is sixty. The saving is real but it is only SAFE if the reset
 * actually resets, so that is asserted rather than asserted-in-a-comment: the
 * default state is read again after the whole cycle and must be byte-identical
 * to the first read. If a hover was left on, or focus never blurred, the two
 * differ and the run exits 3 naming the property that drifted.
 *
 * Without that check, sharing a page across states is a guess — and a leaked
 * state looks exactly like real drift in the diff.
 */
const applyState = async (st) => {
  const sel = refToSelector(st, `state ${st.name}`);
  if (st.action === "hover") await page.hover(sel, { timeout: 15000 });
  else if (st.action === "focus") await page.focus(sel, { timeout: 15000 });
  else if (st.action === "active") await page.locator(sel).hover({ timeout: 15000 });
  else throw new Error(`state "${st.name}" has unknown action "${st.action}"`);
  await page.waitForTimeout(st.settleMs ?? 150);
};

/** Undo a state. Deliberately explicit — "it will reset itself" is the bug. */
const resetState = async () => {
  // Move the pointer off any element, and drop focus back to the body.
  await page.mouse.move(0, 0);
  await page.evaluate(() => (document.activeElement instanceof HTMLElement) && document.activeElement.blur());
  await page.waitForTimeout(150);
};

/**
 * SCREENSHOTS — captured for every target, every run, not only on failure.
 *
 * The browser is open here and nowhere else: diff.mjs runs later, against JSON,
 * with no page to photograph. Capturing on demand would mean booting a second
 * browser and re-driving the surface, which is slower AND measures a different
 * render than the one that produced the numbers. Five small PNGs per surface is
 * the cheaper trade.
 *
 * Code side only. The Figma half of a side-by-side needs an MCP call, which CI
 * cannot make (see README §"Why extraction is an agent step"), so diff.mjs
 * prints the board nodeId instead and a local run can fetch it. Committing
 * reference PNGs was considered and rejected: they would be a second artifact
 * that goes stale silently, which is the failure this harness exists to stop.
 */
const SHOT_DIR = join(OUT_DIR, surfaceId);
mkdirSync(SHOT_DIR, { recursive: true });
const shots = {};
try {
  await page.screenshot({ path: join(SHOT_DIR, "__surface.png") });
  shots.__surface = join(surfaceId, "__surface.png");
  for (const t of recipe.targets ?? []) {
    const sel = refToSelector(t, `target ${t.name}`);
    const file = `${t.name.replace(/[^a-z0-9-]/gi, "_")}.png`;
    await page.locator(sel).screenshot({ path: join(SHOT_DIR, file) });
    shots[t.name] = join(surfaceId, file);
  }
} catch (err) {
  // A screenshot failing must not lose the measurement — the numbers are the
  // point, the picture is the convenience.
  console.error(`[measure] screenshot capture incomplete: ${err.message.split("\n")[0]}`);
}

const baseline = await readAll();
const states = {};
for (const st of recipe.states ?? []) {
  await applyState(st);
  states[st.name] = await readAll();
  await resetState();
}

// The leak detector. Re-read the default state and compare target geometry and
// computed CSS against the first read.
let leak = null;
if (Object.keys(states).length) {
  const after = await readAll();
  const before = JSON.stringify(baseline.targets);
  if (JSON.stringify(after.targets) !== before) {
    const diffs = [];
    for (const [i, b] of baseline.targets.entries()) {
      const a = after.targets[i];
      for (const k of Object.keys(b.css ?? {})) {
        if (b.css[k] !== a?.css?.[k]) diffs.push(`${b.name}.${k}: ${b.css[k]} -> ${a?.css?.[k]}`);
      }
    }
    leak = diffs;
  }
}

await browser.close();

if (leak) {
  console.error(
    `[measure] surface "${surfaceId}": STATE LEAK — the default state does not read the same ` +
    `after the interaction cycle as before it. A state was applied and not undone, so every ` +
    `subsequent measurement is untrustworthy.`
  );
  for (const d of leak.slice(0, 12)) console.error(`          ${d}`);
  process.exit(3);
}

mkdirSync(OUT_DIR, { recursive: true });
const out = {
  surface: recipe.surface ?? surfaceId,
  board: recipe.board ?? null,
  viewport: recipe.viewport ?? { width: 1440, height: 900 },
  measuredAt: new Date().toISOString(),
  ...baseline,
  states,
  shots,
};
const outPath = join(OUT_DIR, `${surfaceId}.json`);
writeFileSync(outPath, JSON.stringify(out, null, 2));

const missing = out.targets.filter((t) => !t.found);
console.log(`[measure] ${surfaceId}: ${out.targets.length} targets (${missing.length} missing), ${out.contrastFailures.length} text-contrast + ${(out.nonTextFailures ?? []).length} icon-contrast failure(s) → ${resolve(outPath)}`);
for (const t of missing) console.log(`  MISSING target: ${t.name} (${t.selector})`);
for (const p of out.contrastFailures)
  console.log(`  CONTRAST ${p.ratio} < ${p.needed}  ${p.selector}  "${p.text}"  ${p.color} on ${p.bg} @${p.fontSize}/${p.fontWeight}`);
for (const p of out.nonTextFailures ?? [])
  console.log(`  ICON     ${p.ratio} < ${p.needed}  ${p.selector}  "${p.label}"  ${p.color} on ${p.bg} @${p.size}`);
/**
 * CONTRAST RATCHET — may fall, never rise.
 *
 * The surface has three real WCAG AA failures today (gray-500 on gray-100 at
 * 4.39 against a 4.5 floor). Wiring this into CI with a hard zero would land
 * the build red on day one for defects that predate the harness, and a gate
 * that is red on arrival gets disabled rather than fixed.
 *
 * So it is baselined, exactly like inline_literal / inline_hoisted / css_lines
 * in check-styling-ratchet.mjs — the idiom this repo already trusts. Known
 * defects stay visible in every run's output AND cannot grow. Fixing them
 * lowers the baseline; introducing one fails the build.
 *
 * A MISSING target is never baselined. That is an instrument failure, not a
 * product defect, and it exits 3 above.
 */
/**
 * F6 — a COUNT is not a ratchet.
 *
 * This compared `now > baseline` on a number. Fix one failing pair, introduce
 * a different one, and the count is unchanged: the gate passes and reports
 * "0 new failures" while a real regression ships. It also cannot tell you that
 * a pair got *worse* (4.4 -> 2.1 is the same one failure), and the README's
 * baseline named "add-page and zoom controls" while no zoom pair was in the
 * measured five — nobody could tell, because a 3 looks like any other 3.
 *
 * So the baseline is the SET of failing pairs, keyed by what identifies a pair
 * to a human: selector + text + the two colours. Three distinct regressions
 * now exist and are reported separately:
 *   NEW    — a measured pair with no baseline entry (the swap the count missed)
 *   WORSE  — a known pair whose ratio fell
 *   (fixed pairs are an improvement, and say so)
 */
const bl = readBaseline();
const entry = bl[surfaceId] ?? {};
const textNow = out.contrastFailures.length;
const iconNow = (out.nonTextFailures ?? []).length;
const nowPairs = { contrastPairs: contrastSet(out.contrastFailures), nonTextPairs: contrastSet(out.nonTextFailures) };

if (args.includes("--update-baseline")) {
  // Merge, never replace — diff.mjs owns skipped/compared in this same file.
  patchBaseline(surfaceId, { contrastFailures: textNow, nonTextFailures: iconNow, ...nowPairs });
  console.log(`[measure] baseline updated: ${surfaceId} contrast=${textNow} icon=${iconNow}`);
  for (const [kind, pairs] of [["contrast", nowPairs.contrastPairs], ["icon", nowPairs.nonTextPairs]])
    for (const [k, r] of Object.entries(pairs)) console.log(`  recorded ${kind} ${r}  ${k}`);
  process.exit(0);
}

const accept = args.includes("--accept-regression");
let ratchetBroken = false;

for (const [label, nowSet, baseSet, count, baseCount] of [
  ["TEXT", nowPairs.contrastPairs, entry.contrastPairs, textNow, entry.contrastFailures ?? 0],
  ["ICON", nowPairs.nonTextPairs, entry.nonTextPairs, iconNow, entry.nonTextFailures ?? 0],
]) {
  if (!baseSet) {
    /* Legacy numeric-only baseline. Say so loudly rather than pretending the
       count check is equivalent — it is exactly the check F6 is about. */
    if (count > baseCount) {
      console.error(`[measure] ${label} CONTRAST REGRESSION: ${count} > baseline ${baseCount}.`);
      ratchetBroken = true;
    }
    if (count > 0)
      console.warn(`[measure] ${label}: baseline is a COUNT only — a fixed pair plus a new one would pass unnoticed. Run --update-baseline once to record the pair set.`);
    continue;
  }
  const { newPairs, worsePairs, fixedPairs } = compareContrast(nowSet, baseSet);
  for (const { key, ratio } of newPairs) {
    console.error(`[measure] ${label} CONTRAST REGRESSION (NEW pair, ratio ${ratio}): ${key}`);
    ratchetBroken = true;
  }
  for (const { key, was, now } of worsePairs) {
    console.error(`[measure] ${label} CONTRAST REGRESSION (WORSE ${was} -> ${now}): ${key}`);
    if (!accept) ratchetBroken = true;
  }
  for (const key of fixedPairs) console.log(`[measure] ${label} contrast FIXED: ${key}`);
  if (fixedPairs.length)
    console.log(`[measure] ${label}: ${fixedPairs.length} pair(s) fixed — record it: --update-baseline`);
}
process.exit(missing.length || ratchetBroken ? 1 : 0);

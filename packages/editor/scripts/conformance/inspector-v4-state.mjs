/**
 * inspector-v4-state — put the running editor into each Inspector v4 board's
 * state, one snippet per board (boards 1–36, `family: "Inspector v4"` in
 * boards.json; contract: docs/plans/2026-09-27-inspector-figma-board-spec.md).
 *
 * Built for the W0 fixture site (`e2e/fixtures/inspector-v4-site.json`, loaded
 * by `load-inspector-v4-site.mjs`). Every element a board needs has a fixed id
 * there (`i4-*`), so a snippet selects by id through the engine, never by
 * canvas coordinates.
 *
 * Usage
 *   node scripts/conformance/inspector-v4-state.mjs 7          # print board 7's snippet
 *   node scripts/conformance/inspector-v4-state.mjs --list     # board → target → status
 *   node scripts/conformance/live-shot.mjs --url <editor url> --out /tmp/insp-07.png \
 *        --eval "$(node scripts/conformance/inspector-v4-state.mjs 7)"
 *   import { snippet, BOARDS } from "./inspector-v4-state.mjs";   // page.evaluate(snippet(7))
 *
 * live-shot.mjs opens an UNAUTHENTICATED page, so against the dashboard it only
 * reaches /auth. On a real site use `load-inspector-v4-site.mjs --site <id>
 * --board 7 --out /tmp/insp-07.png`, which logs in and runs the same snippet.
 *
 * What a snippet returns (printed as JSON by both runners):
 *   { board, name, expect: [ids], selected: [ids], selectionOk,
 *     steps: [{ step, ok, via, note }], needs: [lane…] }
 * `via` says which door a step used: "engine" (composer API), "v4" (the
 * testid the build plan's W1 chassis is meant to ship), "pre-v4" (today's
 * testid — the fallback the step took because the v4 one is not there yet),
 * "event" (a documented engine/UI event). A step that found neither door
 * reports ok:false. `needs` lists the lanes that still have to land before the
 * board's state is fully reachable; a board with `needs: []` and every step
 * ok is reachable today.
 *
 * INTENDED v4 TESTIDS (the build plan names the components, not the ids).
 * W1 either ships these or edits this file in the same commit:
 *   inspector-state-chip · inspector-state-opt-<base|hover|focus|active|disabled>
 *   inspector-element-menu (kept) · inspector-menu-<ElementActionId>
 *     (duplicate, copy-style, paste-style, apply-style-to-page, reset-style,
 *      save-as-component, lock, delete — board 30, INSPECTOR_MENU)
 *   inspector-status-line · inspector-hide · show-inspector
 *   inspector-apply-style-dialog · inspector-field-error
 * Tabs are found by role="tab" + label inside `inspector-tab-strip`; the v4
 * label is "Behaviour", today's is "Settings".
 *
 * Rules the snippets keep (learned in earlier walks — see editor-rig.mjs):
 *   - the composer is read off the canvas's React fiber (the dashboard route
 *     exposes no global); `window.__bkComposer` (the Vite demo's dev probe) is
 *     used when present and set when absent, so later snippets find it fast;
 *   - selection is read back from the ENGINE after the steps. A null result is
 *     the harness until proven otherwise, which is why every step reports.
 *
 * @license BSD-3-Clause
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

/** Element ids in e2e/fixtures/inspector-v4-site.json. */
export const IDS = {
  heading: "i4-heading",
  text: "i4-text",
  button: "i4-button",
  link: "i4-link",
  image: "i4-image",
  videoEmbed: "i4-video-embed",
  audio: "i4-audio",
  countdown: "i4-countdown",
  progress: "i4-progress",
  accordion: "i4-accordion",
  input: "i4-input",
  checkbox: "i4-checkbox",
  flex: "i4-flex",
  grid: "i4-grid",
  section: "i4-section",
  form: "i4-form",
  collectionList: "i4-collection-list",
  headingCms: "i4-heading-cms",
  headingSpecials: "i4-heading-specials",
  banner: "i4-banner",
  buttonHover: "i4-button-hover",
  headingTablet: "i4-heading-tablet",
  h3: ["i4-h3-1", "i4-h3-2", "i4-h3-3"],
  headingLocked: "i4-heading-locked",
};

/**
 * One entry per board. Keys the page-side runner understands:
 *   select: id | [ids] | null (null = clear selection → Page panel)
 *   tab: "style" | "behaviour" | "effects"
 *   breakpoint: "tablet" · state: "hover" · menu: true · applyDialog: true
 *   stateMenu: true · colour: { section, field } · fieldError: { field, value }
 *   ai: true · hideInspector: true · conflict: true
 *   needs: lanes that must land before the board's state is fully reachable
 *     (the build plan's lane ids). "W1" = `// needs W1` in the task wording.
 */
export const BOARDS = {
  1: { select: IDS.heading, tab: "style", needs: [] },
  2: { select: IDS.heading, tab: "behaviour", needs: ["W1"] }, // tab label "Behaviour" lands in W1
  3: { select: IDS.heading, tab: "effects", needs: [] },
  4: { select: IDS.text, tab: "style", needs: [] },
  5: { select: IDS.button, tab: "style", needs: [] },
  6: { select: IDS.button, tab: "behaviour", needs: ["W1"] },
  7: { select: IDS.link, tab: "behaviour", needs: ["W1"] },
  8: { select: IDS.image, tab: "style", needs: [] },
  9: { select: IDS.videoEmbed, tab: "style", needs: ["L2-B"] }, // Video URL/ratio attrs are L2-B's to name
  10: { select: IDS.audio, tab: "style", needs: [] },
  11: { select: IDS.countdown, tab: "style", needs: ["L2-B"] }, // Ends at / When done attrs: L2-B
  12: { select: IDS.progress, tab: "style", needs: ["L2-B"] }, // Value / Max attrs: L2-B
  13: { select: IDS.accordion, tab: "style", needs: [] },
  14: { select: IDS.input, tab: "style", needs: [] },
  15: { select: IDS.checkbox, tab: "style", needs: [] },
  16: { select: IDS.flex, tab: "style", needs: [] },
  17: { select: IDS.grid, tab: "style", needs: [] },
  18: { select: IDS.section, tab: "behaviour", needs: ["W1"] },
  19: { select: IDS.form, tab: "behaviour", needs: ["W1"] },
  20: { select: IDS.collectionList, tab: "behaviour", needs: ["W1"] },
  21: { select: null, needs: [] },
  22: { select: IDS.h3, tab: "style", needs: [] },
  23: { select: IDS.headingLocked, tab: "style", needs: [] },
  24: { select: IDS.headingCms, tab: "behaviour", needs: ["W1"] },
  25: { select: IDS.headingSpecials, tab: "behaviour", needs: ["W1"] },
  26: { select: IDS.banner, tab: "style", needs: [] },
  27: { select: IDS.buttonHover, tab: "style", state: "hover", needs: ["W1"] }, // state chip: W1
  28: { select: IDS.headingTablet, tab: "style", breakpoint: "tablet", needs: [] },
  29: { select: IDS.heading, tab: "style", conflict: true, needs: ["L2-D2"] }, // status line: L2-D2
  30: { select: IDS.h3[0], tab: "style", menu: true, needs: ["W1"] }, // v4 ⋯ rows
  31: { select: IDS.h3[0], tab: "style", menu: true, applyDialog: true, needs: ["W1", "L3-B"] },
  32: { select: IDS.buttonHover, tab: "style", stateMenu: true, needs: ["W1"] },
  /* Board 33: the colour popover, opened from the button's Fill › Colour row
     (the button carries a fill, so Fill is open; its row label is "Colour"). */
  33: { select: IDS.button, tab: "style", colour: { section: "fill", field: "Colour" }, needs: [] },
  // The image carries a fixed 640px width, so its Size row renders the unit input.
  /* Board 34 is the Heading, Size › Width: the number sits in the size row's
     own field (`inspector-size-width` › `.bdi-fld`), typed "24.." as drawn. */
  34: { select: IDS.heading, tab: "style", fieldError: { selector: '[data-testid="inspector-size-width"] .bdi-fld input', label: "Width", section: "Size", value: "24.." }, needs: [] },
  35: { select: IDS.heading, tab: "style", ai: true, needs: ["L3-D"] }, // "Scope: Heading" + return note
  36: { select: IDS.heading, tab: "style", hideInspector: true, needs: ["L3-D"] }, // Show inspector ⌘\ button
};

/** Board node ids + names, read from boards.json (the SSOT), keyed by number. */
export function boardMeta() {
  const rows = JSON.parse(readFileSync(join(HERE, "boards.json"), "utf8")).boards;
  const out = {};
  for (const r of rows) {
    if (r.family !== "Inspector v4") continue;
    const n = Number(/Inspector v4 · (\d+)/.exec(r.name)?.[1]);
    if (n) out[n] = { nodeId: r.nodeId, name: r.name.replace(/^Inspector v4 · /, "") };
  }
  return out;
}

/*
 * The page-side runner, as source. Kept as ONE function so a snippet is a
 * single self-contained expression (live-shot's --eval takes an expression).
 * It must not reference anything outside itself.
 */
const RUNNER = String.raw`async (spec) => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const steps = [];
  const note = (step, ok, via, extra) => { steps.push({ step, ok, via, ...(extra ? { note: extra } : {}) }); return ok; };
  const q = (id) => document.querySelector('[data-testid="' + id + '"]');

  /* 1. The composer. */
  let c = window.__bkComposer;
  if (!c?.elements) {
    const canvas = document.querySelector(".buildrick-canvas") || document.querySelector("[data-buildrick-canvas]");
    let f = null;
    if (canvas) for (const k in canvas) if (k.startsWith("__reactFiber")) f = canvas[k];
    for (let x = f, h = 0; x && h < 60; x = x.return, h++) {
      if (x.memoizedProps?.composer?.elements) { c = x.memoizedProps.composer; break; }
    }
    if (c) window.__bkComposer = c;
  }
  if (!c?.elements) return { board: spec.n, error: "no-composer", steps };

  /* 2. Breakpoint first: the inspector re-reads styles on a breakpoint change. */
  const bp = spec.breakpoint || "desktop";
  try { c.setDevice(bp); await sleep(300); note("breakpoint:" + bp, c.viewport.getDevice() === bp, "engine"); }
  catch (e) { note("breakpoint:" + bp, false, "engine", String(e)); }

  /* 3. Selection — through the engine. */
  const expect = spec.select === null ? [] : [].concat(spec.select);
  if (spec.select === null) {
    c.selection.clear();
    note("clear-selection", true, "engine");
  } else {
    const els = expect.map((id) => c.elements.getElement(id));
    const missing = expect.filter((id, i) => !els[i]);
    if (missing.length) note("select", false, "engine", "not in project: " + missing.join(","));
    else if (els.length === 1) { c.selection.select(els[0]); note("select", true, "engine"); }
    else { c.selection.selectMultiple(els); note("select-multiple", true, "engine"); }
    /* Boards draw the selection on the canvas — bring it into view. */
    const doc = c.viewport.getDocument?.() || document;
    doc.querySelector('[data-buildrick-id="' + expect[0] + '"]')?.scrollIntoView({ block: "center" });
  }
  await sleep(900);

  /* 4. Tab. */
  if (spec.tab) {
    const want = { style: ["Style"], behaviour: ["Behaviour", "Settings"], effects: ["Effects"] }[spec.tab];
    const strip = q("inspector-tab-strip") || document;
    const tabs = [...strip.querySelectorAll('[role="tab"]')];
    let done = false;
    for (const [i, label] of want.entries()) {
      const t = tabs.find((b) => b.textContent.trim() === label);
      if (t) {
        if (t.getAttribute("aria-selected") !== "true") t.click();
        done = note("tab:" + spec.tab, true, i === 0 ? "v4" : "pre-v4", i === 0 ? undefined : 'label "' + label + '"');
        break;
      }
    }
    if (!done) note("tab:" + spec.tab, expect.length > 1, "none", expect.length > 1 ? "no tab strip in today's multi-select panel" : "no tab labelled " + want.join("/"));
    await sleep(400);
  }

  /* 5. Pseudo state (board 27) / state menu (board 32). */
  if (spec.state || spec.stateMenu) {
    let trigger = q("inspector-state-chip"), via = "v4";
    if (!trigger) { trigger = q("inspector-state-pill"); via = "pre-v4"; }
    if (!trigger) note("state-menu", false, "none");
    else {
      trigger.click(); await sleep(300);
      note("state-menu:open", Boolean(document.querySelector('[data-testid^="inspector-state-opt-"]')), via);
      if (spec.state) {
        const opt = q("inspector-state-opt-" + spec.state);
        if (opt) { opt.click(); await sleep(500); note("state:" + spec.state, true, via); }
        else note("state:" + spec.state, false, via);
      }
    }
  }

  /* 6. ⋯ menu (board 30) and the apply-to-all dialog (board 31). */
  if (spec.menu) {
    const trigger = q("inspector-element-menu");
    if (!trigger) note("menu:open", false, "none");
    else {
      trigger.click(); await sleep(300);
      note("menu:open", Boolean(document.querySelector('[role="menu"]')), "v4");
      const v4Rows = ["duplicate", "copy-style", "paste-style", "apply-style-to-page", "reset-style", "save-as-component", "lock", "delete"];
      const have = v4Rows.filter((id) => q("inspector-menu-" + id));
      note("menu:v4-rows", have.length === v4Rows.length, "v4", have.length + "/" + v4Rows.length + " rows (" + v4Rows.filter((id) => !have.includes(id)).join(",") + " missing)");
      if (spec.applyDialog) {
        const row = q("inspector-menu-apply-style-to-page");
        if (!row) note("apply-dialog", false, "v4", "no apply-style-to-page row");
        else {
          row.click(); await sleep(500);
          note("apply-dialog", Boolean(q("inspector-apply-style-dialog") || document.querySelector('[role="dialog"]')), "v4");
        }
      }
    }
  }

  /* 7. Colour popover (board 33): the swatch of a colour row INSIDE a named
     section. Two sections carry a "Colour" row (Typography, Fill), so the row
     is looked up in its section — a page-wide "inspector-field-colour" is
     ambiguous. A section with no value draws a "+" header and no rows: open it
     by its header first. */
  if (spec.colour) {
    const { section, field } = spec.colour;
    const slug = field.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    let box = q("inspector-section-" + section);
    if (box && box.getAttribute("data-display-mode") !== "open") {
      box.querySelector('[role="button"][aria-expanded]')?.click();
      await sleep(400);
      box = q("inspector-section-" + section);
    }
    const sw = box?.querySelector('[data-testid="inspector-field-' + slug + '"] button');
    if (!box) note("colour:" + section, false, "v4", "no " + section + " section");
    else if (!sw) note("colour:" + section, false, "v4", "no " + field + " row in " + section + " (" + box.getAttribute("data-display-mode") + ")");
    else { sw.click(); await sleep(500); note("colour:" + section + "/" + field, sw.getAttribute("aria-expanded") === "true", "v4"); }
  }

  /* 8. Field error (board 34): type an invalid value, commit with Enter. */
  if (spec.fieldError) {
    const { field, label } = spec.fieldError;
    const find = () => {
      if (spec.fieldError.selector) return { input: document.querySelector(spec.fieldError.selector), via: "v4" };
      const box = q("inspector-field-" + field);
      if (box) return { input: box.matches("input") ? box : box.querySelector("input"), via: "v4" };
      return { input: document.querySelector('[data-testid="inspector-panel"] input[aria-label="' + label + '"]'), via: "pre-v4" };
    };
    let { input, via } = find();
    if (!input) {
      const header = [...document.querySelectorAll('[data-testid="inspector-panel"] [aria-expanded="false"]')]
        .find((b) => b.textContent.trim().startsWith(spec.fieldError.section));
      if (header) { header.click(); await sleep(400); ({ input, via } = find()); }
    }
    if (!input) note("field-error:type", false, "none", "no " + label + " input");
    else {
      input.focus();
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      setter.call(input, spec.fieldError.value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      await sleep(400);
      note("field-error:type", true, via);
      note("field-error:shown", Boolean(q("inspector-field-error") || input.getAttribute("aria-invalid") === "true"), "v4");
    }
  }

  /* 9. AI column (board 35) — the ✦ chip's own event. */
  if (spec.ai) {
    c.emit("ui:switch-tab", { tab: "ai" }); await sleep(800);
    note("ai-column", true, "event");
  }

  /* 10. Inspector hidden (board 36). */
  if (spec.hideInspector) {
    const x = q("inspector-hide");
    if (x) { x.click(); note("hide-inspector", true, "v4"); }
    else { c.emit("ui:toggle:inspector"); note("hide-inspector", true, "event", "no header ✕ yet — UI_TOGGLE_INSPECTOR"); }
    await sleep(700);
    note("show-inspector-button", Boolean(q("show-inspector")), "v4");
  }

  /* 11. Save conflict (board 29) — the REAL path: another writer advances the
     site's lastEditedAt (a save with no expectedLastEditedAt, the same
     content), then the editor's own save is refused with SAVE_CONFLICT and
     raiseSaveConflict() puts the editor into the one conflict state. */
  if (spec.conflict) {
    const siteId = (location.pathname.match(/\/edit\/([^/?#]+)/) || [])[1];
    if (!siteId) note("conflict", false, "none", "not on /edit/:siteId (the demo has no server to conflict with)");
    else {
      const res = await fetch("/api/trpc/sites.saveProject?batch=1", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ 0: { json: { siteId, projectData: c.exportProject() } } }),
      });
      note("conflict:other-writer", res.ok, "event", "HTTP " + res.status);
      /* The editor's own save is its dashboard autosave (project:changed →
         1s debounce); composer.saveProject() writes local storage only. */
      const raised = new Promise((resolve) => {
        const t = setTimeout(() => resolve(false), 20000);
        window.addEventListener("buildrik:save-conflict", () => { clearTimeout(t); resolve(true); }, { once: true });
      });
      c.markDirty();
      const got = await raised;
      await sleep(800);
      const modal = [...document.querySelectorAll('[role="dialog"],[role="alertdialog"]')].find((d) => /elsewhere|conflict|changed/i.test(d.textContent));
      note("conflict:raised", got, "event", got ? (modal ? "ConflictModal open" : "event seen, no modal") : "no buildrik:save-conflict in 20s");
      note("conflict:status-line", Boolean(q("inspector-status-line")), "v4");
    }
  }

  /* 12. Read back. */
  await sleep(300);
  const selected = (c.selection.getAllSelected?.() ?? []).map((e) => e.getId());
  const selectionOk = selected.length === expect.length && expect.every((id) => selected.includes(id));
  /* What the right column says, so a reading is not only the engine's. */
  const header = q("inspector-header") || q("multiselect-header") || q("inspector-empty");
  const inspector = header ? header.textContent.replace(/\s+/g, " ").trim().slice(0, 60) : null;
  return { board: spec.n, expect, selected, selectionOk, inspector, steps, needs: spec.needs };
}`;

/** The --eval expression for board `n`. */
export function snippet(n) {
  const b = BOARDS[n];
  if (!b) throw new Error(`no Inspector v4 board ${n} (1–36)`);
  return `(${RUNNER})(${JSON.stringify({ n: Number(n), ...b })})`;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const arg = process.argv[2];
  if (!arg || arg === "--list") {
    const meta = boardMeta();
    for (const n of Object.keys(BOARDS).map(Number)) {
      const b = BOARDS[n];
      const target = b.select === null ? "(nothing)" : [].concat(b.select).join("+");
      const needs = b.needs.length ? "needs " + b.needs.join(", ") : "reachable today";
      console.log(`${String(n).padStart(2)}  ${meta[n]?.nodeId ?? "?"}  ${(meta[n]?.name ?? "").padEnd(34)}  ${target.padEnd(32)}  ${needs}`);
    }
  } else {
    console.log(snippet(Number(arg)));
  }
}

/**
 * Style-parity probe host.
 *
 * jsdom cannot answer the only question that matters during the inline-style
 * drain: `getComputedStyle` on a `tw:` class returns rgb(0, 0, 0) there,
 * because no stylesheet is loaded. So a conversion from `style={{...}}` to
 * `tw:` utilities makes the vitest suite BLIND to styling while it stays
 * green — the exact failure shape this codebase keeps hitting.
 *
 * This page mounts one component in a real browser with the real CSS pipeline
 * (tokens + tw utilities + chrome reset), so Playwright can read genuine
 * computed values before and after a conversion.
 *
 * Pick the case with ?case=<name>. Cases are registered below, deliberately
 * by hand: an auto-discovering registry would silently stop covering a
 * component the day someone renamed a file, and a probe that quietly covers
 * nothing is worse than no probe.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { createRoot } from "react-dom/client";
import "@/themes/default.css";

import { RootView, S as ContentStyles } from "@/editor/sidebar/tabs/content/ContentViews";

/** Every case renders into `.bd-studio` so chrome-scoped CSS applies. */
const CASES: Record<string, () => React.ReactElement> = {
  // Exercises the hoisted `S` style map directly — one node per entry, so the
  // baseline captures every style the map defines rather than only the subset
  // the default render path happens to reach.
  "content-style-map": () => (
    <>
      {Object.entries(ContentStyles).map(([name, style]) => (
        <div key={name} data-probe={name} style={style}>
          {name}
        </div>
      ))}
    </>
  ),
  // The empty-state render path, so the baseline also covers styles that only
  // appear through real JSX rather than through the S map alone.
  // POPULATED. An all-zero RootView early-returns its empty state
  // (ContentViews.tsx:169), so a zeros-only case renders none of the rows and
  // would pass parity against code it never executed. That false green is the
  // exact failure this harness exists to prevent; it caught itself here.
  "content-root-rows": () => (
    <div data-probe="content-root-rows">
      <RootView
        collections={[{ id: "c1", name: "Posts" } as never, { id: "c2", name: "Authors" } as never]}
        recordCounts={{ c1: 12, c2: 3 }}
        sourcesCount={2}
        variablesCount={5}
        conditionsCount={1}
        onOpenCollection={() => {}}
        onCreateCollection={() => {}}
        onOpenSources={() => {}}
        onOpenVariables={() => {}}
        onOpenConditions={() => {}}
      />
    </div>
  ),
};

const name = new URLSearchParams(location.search).get("case") ?? "";
const render = CASES[name];
const el = document.getElementById("probe-root")!;

if (!render) {
  // Fail loudly and machine-readably. A probe that renders an empty page on a
  // typo'd case name would let the parity spec pass against nothing.
  el.setAttribute("data-probe-error", `unknown case: ${name || "(none)"}`);
  el.textContent = `unknown case: ${name || "(none)"}. known: ${Object.keys(CASES).join(", ")}`;
} else {
  createRoot(el).render(<React.StrictMode>{render()}</React.StrictMode>);
  el.setAttribute("data-probe-ready", name);
}

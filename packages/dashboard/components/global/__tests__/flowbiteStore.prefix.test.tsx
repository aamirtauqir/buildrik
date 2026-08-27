/**
 * Regression guard for the flowbite-react global-prefix collision that this
 * fix closes (flowbite-bigbang arc, dashboard task).
 *
 * flowbite-react's class-name prefix lives in a plain module-level
 * singleton (flowbite-react/store — no React context, see
 * node_modules/.../flowbite-react/dist/store/index.js), read synchronously
 * at render time by resolveTheme(). It is NOT scoped per package:
 * packages/editor and packages/dashboard resolve `flowbite-react` to the
 * SAME physical node_modules install (pnpm content-addressed store), and
 * `next.config.mjs` transpiles the editor package into this app's bundle.
 * packages/editor sets that singleton's prefix to "tw" unconditionally at
 * load (src/editor/chrome-ui/flowbiteStore.ts) — so once the unified editor
 * route has loaded even once in a browser tab, every flowbite-react
 * component anywhere else in that tab (including the dashboard's own
 * ToggleSwitch/Button/Table/etc.) renders `tw:`-prefixed classNames.
 *
 * Before this fix, the dashboard's own Tailwind build never compiled a
 * `tw:`-prefixed form of flowbite's classes — only unprefixed ones — so
 * this exact scenario rendered genuinely unstyled markup in production.
 * The fix: packages/dashboard/components/global/flowbiteStore.ts sets the
 * same prefix itself, unconditionally, and is imported first in
 * app/layout.tsx.
 *
 * FIX ROUND 1 (this file): the previous version of this test called
 * `setStore({prefix:"tw", ...})` itself instead of exercising the real
 * import chain (app/layout.tsx -> components/global/flowbiteStore.ts). That
 * version stayed green even when someone neutered flowbiteStore.ts's own
 * setStore call, and even when the import line was removed from
 * app/layout.tsx — it was testing that flowbite-react's setStore() API
 * works, not that THIS APP actually wires it up. This is the 5th instance
 * in this arc of "a guard that passes when the thing it guards is broken";
 * see the arc's fix-round history for the prior four.
 *
 * This version proves both halves for real:
 *   1. importing the real module (not calling setStore inline) is what
 *      flips flowbite-react's global prefix to "tw", and ToggleSwitch (the
 *      component this app actually renders — components/global/cookie-
 *      consent.tsx) then emits classes this package's compiled CSS backs.
 *   2. app/layout.tsx's actual source imports that exact module — a static
 *      check, because a runtime test cannot observe Next's root layout
 *      render tree.
 *
 * If someone neuters flowbiteStore.ts's setStore call, or removes the
 * import from app/layout.tsx, or reverts .flowbite-react/config.json's
 * prefix, or regenerates class-list.json without the "tw" prefix, this
 * file must fail — that is its entire purpose. (Proven by breaking each of
 * the first two and watching it fail — see the fix-round commit.)
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import { ToggleSwitch } from "flowbite-react";
import { getPrefix, setStore } from "flowbite-react/store";
import classList from "../../../.flowbite-react/class-list.json";

const classListSet = new Set<string>(classList as string[]);

describe("dashboard flowbite prefix wiring (flowbite-bigbang collision fix)", () => {
  it("importing components/global/flowbiteStore — the exact module app/layout.tsx imports — sets flowbite-react's global prefix to 'tw', and ToggleSwitch then renders classes this package's compiled CSS backs", async () => {
    // The repo's shared vitest setupFile (packages/editor/src/test-setup.ts)
    // already imports the EDITOR's OWN flowbiteStore module for every test
    // in the repo (editor and dashboard alike), which alone would leave
    // getPrefix() === "tw" even if the dashboard's own wiring were entirely
    // broken or absent. Reset first, so the assertions below can only pass
    // because of the dynamic import that follows — not because of that
    // ambient priming from a different package's module.
    setStore({ prefix: undefined, version: undefined, dark: undefined });
    expect(getPrefix()).not.toBe("tw");

    // THE REAL ARTIFACT UNDER TEST — not a hand-rolled setStore() call.
    // Dynamic + inside the test body so it runs after the reset above.
    await import("@/components/global/flowbiteStore");

    expect(getPrefix()).toBe("tw");

    render(<ToggleSwitch checked={false} label="Analytics" onChange={() => {}} />);

    const switchEl = screen.getByRole("switch");
    const knob = screen.getByTestId("flowbite-toggleswitch-toggle");
    const label = screen.getByTestId("flowbite-toggleswitch-label");
    const allClasses = [switchEl, knob, label].flatMap((el) => Array.from(el.classList));
    expect(allClasses.length).toBeGreaterThan(0);

    // Every class flowbite-react's OWN theme puts on these elements must
    // carry the tw: prefix — none of flowbite's default (unprefixed) theme
    // classes may leak through once the real import above has run.
    for (const cls of allClasses) {
      expect(cls.startsWith("tw:")).toBe(true);
    }

    // And the dashboard's own compiled CSS must actually back every one of
    // those exact class strings — this is the half a jsdom-only assertion
    // on classNames can never catch on its own (jsdom doesn't know what CSS
    // exists), which is why this cross-checks the generated class-list that
    // app/tw-flowbite.css's `@source` compiles from.
    //
    // `dark:` variants are excluded here, not swept under the rug: neither
    // this app's flowbiteStore.ts nor the editor's calls `setStore({dark:
    // false, ...})`, only `{prefix, version}` — so resolveTheme()'s runtime
    // stripDark() step never runs and `tw:dark:*` classNames DO render, but
    // `.flowbite-react/config.json` has `"dark": false`, so the CLI strips
    // them from the generated class-list. That gap is real and identical in
    // packages/editor's already-shipped, already-reviewed setup — this app
    // is light-theme-only (DESIGN.md), so an uncompiled `dark:` rule is
    // inert (it only matters if OS dark-mode preference is ever honored,
    // which this app deliberately never does), not a visible defect. This
    // test's job is the prefix-wiring regression, not that pre-existing,
    // accepted, pattern-wide characteristic.
    const liveClasses = allClasses.filter((cls) => !cls.includes(":dark:") && !cls.startsWith("tw:dark:"));
    expect(liveClasses.length).toBeGreaterThan(0);
    const uncompiled = liveClasses.filter((cls) => !classListSet.has(cls));
    expect(uncompiled).toEqual([]);
  });

  it("STATIC WIRING CHECK (not a render test — a runtime test cannot observe Next's root layout render): app/layout.tsx's source actually imports components/global/flowbiteStore", () => {
    const layoutSource = readFileSync(path.resolve(__dirname, "../../../app/layout.tsx"), "utf-8");
    const importsFlowbiteStore = /^\s*import\s+["']@\/components\/global\/flowbiteStore["'];?\s*$/m.test(layoutSource);
    expect(importsFlowbiteStore).toBe(true);
  });

  /**
   * FIX ROUND 2 — the 6th "guard that passes while the thing it guards is
   * broken" in this arc, and this file was the guard.
   *
   * Everything above proves the prefix is set when `components/global/
   * flowbiteStore` is IMPORTED. In vitest that import runs in the test
   * process, so it always looks wired. In the app it does not: that module
   * has no "use client" and is imported by app/layout.tsx, a Server
   * Component — so `setStore` only ever ran on the SERVER. Every flowbite
   * component rendered in the browser used the DEFAULT prefix and emitted
   * unprefixed classes, which this package's Tailwind never compiles.
   *
   * Measured in a real browser before the fix: the cookie banner's primary
   * "Accept All" carried `bg-blue-700 text-white` with a rule for text-white
   * (dashboard code uses it) and none for bg-blue-700 (only flowbite does) —
   * white text on a transparent background over a white bar, contrast 1.0.
   * 23 such controls across 14 routes, "New site" and "Upload" among them.
   *
   * The client half is `<ThemeInit />` from the CLI-generated
   * .flowbite-react/init.tsx, which resolves to StoreInitClient in the
   * browser. Assert it is both imported and rendered — an import alone is
   * dead weight for a component.
   */
  it("STATIC WIRING CHECK: app/layout.tsx renders <ThemeInit /> — the CLIENT half of the prefix wiring", () => {
    const layoutSource = readFileSync(path.resolve(__dirname, "../../../app/layout.tsx"), "utf-8");
    expect(/^\s*import\s+\{\s*ThemeInit\s*\}\s+from\s+["']@\/\.flowbite-react\/init["'];?\s*$/m.test(layoutSource)).toBe(true);
    // Comments stripped first. The first version of this assertion searched the
    // raw source and was satisfied by the words "<ThemeInit />" inside the
    // explanatory comment directly above the JSX — it stayed green with the real
    // element deleted. Seventh time in this arc; caught by deleting the element
    // and watching the test pass anyway.
    const code = layoutSource.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    expect(/<ThemeInit\s*\/>/.test(code)).toBe(true);
  });

  it("the generated init module carries the same prefix as config.json — a regenerate that drops it must fail here", async () => {
    const config = JSON.parse(readFileSync(path.resolve(__dirname, "../../../.flowbite-react/config.json"), "utf-8"));
    expect(config.prefix).toBe("tw");
    const initSource = readFileSync(path.resolve(__dirname, "../../../.flowbite-react/init.tsx"), "utf-8");
    expect(initSource).toContain('prefix: "tw"');
  });

  /**
   * `npx flowbite-react build` — the command AGENTS.md tells you to run after
   * importing a new flowbite component — rewrites these two stylesheets, badly.
   * Observed 2026-08-27: it injected `@import 'flowbite-react/plugin/tailwindcss';`
   * INSIDE the block comment at the top of tw-flowbite.css (where it is inert),
   * DELETED the real `@plugin` directive that compiles the prefixed theme, and
   * added an UNPREFIXED `@import` + `@source` pair to globals.css — which would
   * quietly compile flowbite's classes unprefixed and mask the very bug the
   * ThemeInit wiring above exists to fix.
   *
   * The damage is silent: everything still builds. These assert the shape both
   * files must keep, so the next person who runs that CLI finds out from a red
   * test instead of from a screenshot months later.
   */
  it("tw-flowbite.css keeps the @plugin directive that compiles the prefixed theme", () => {
    const css = readFileSync(path.resolve(__dirname, "../../../app/tw-flowbite.css"), "utf-8");
    // Outside any block comment — the CLI's injection landed inside one.
    const code = css.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(code).toContain('@plugin "flowbite-react/plugin/tailwindcss";');
    expect(code).toContain("@source '../.flowbite-react/class-list.json';");
    expect(code).toContain('prefix(tw)');
  });

  it("globals.css does not compile flowbite's classes unprefixed", () => {
    const css = readFileSync(path.resolve(__dirname, "../../../app/globals.css"), "utf-8");
    const code = css.replace(/\/\*[\s\S]*?\*\//g, "");
    // An unprefixed flowbite plugin/source here makes the prefixed layer
    // redundant and hides a broken prefix — the classes resolve either way.
    expect(code).not.toMatch(/@plugin\s+["']flowbite-react/);
    expect(code).not.toMatch(/@import\s+["']flowbite-react/);
    expect(code).not.toMatch(/@source\s+["'][^"']*flowbite-react/);
  });
});

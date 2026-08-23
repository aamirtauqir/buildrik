/**
 * One condition, one name.
 *
 * "The project has no pages" had FOUR answers: `Composer`'s load-time repair
 * said "Home", `useComposerInit`'s bootstrap and `useStudioHandlers`' quick-add
 * fallback both said "Page 1", and `getDefaultPageName` — the function written
 * for exactly this — said "Home". Which name a fresh project got depended on
 * which path happened to run.
 *
 * It is not only a tidiness problem. "Page 1" slugifies to `page-1`, which is
 * the shape `isPlaceholderSlug` singles out, so one of the four answers handed
 * every new project a slug its own SEO panel then marked down.
 *
 * These tests pin the helper's contract and the fact that the paths route
 * through it rather than restating it.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getDefaultPageName } from "../pageUtils";
import { slugify } from "../helpers";
import { isPlaceholderSlug } from "@/editor/sidebar/tabs/pages/utils/seoScore";

describe("getDefaultPageName", () => {
  it("names an empty project's first page Home", () => {
    expect(getDefaultPageName([])).toBe("Home");
  });

  it("does not hand a fresh project a slug its own SEO panel marks down", () => {
    expect(isPlaceholderSlug(slugify(getDefaultPageName([])))).toBe(false);
  });

  it("keeps the rest of the ladder", () => {
    expect(getDefaultPageName([{ name: "Home" }])).toBe("About");
    expect(getDefaultPageName([{ name: "Home" }, { name: "About" }])).toBe("Page 3");
  });
});

/* A source check, because the defect was never a wrong RETURN value — the
   helper was always right. It was three call sites answering the same question
   without asking it. A unit test on the helper cannot see that; this can. */
describe("the paths that create a default page route through the helper", () => {
  const ROOT = join(__dirname, "..", "..", "..");
  const CALLERS = [
    "engine/Composer.ts",
    "editor/shell/hooks/useComposerInit.ts",
    "editor/shell/hooks/useStudioHandlers.ts",
    "editor/shell/PageTabBar.tsx",
    "editor/sidebar/tabs/pages/usePages.ts",
    /* Both of these were missing from the first version of this list, and the
       list is the whole point. `dropOperations` came from the codex review;
       `RecoveryManager` came from re-running the grep WITHOUT `| head -10`,
       which had truncated the original search and hidden it. A guard built
       from a truncated search guards a truncated set. */
    "editor/canvas/hooks/drag/dropOperations.tsx",
    "engine/recovery/RecoveryManager.ts",
  ];

  it.each(CALLERS)("%s hardcodes no default page name", (rel) => {
    const src = readFileSync(join(ROOT, rel), "utf8");
    const calls = src.match(/createPage\(\s*"[^"]*"/g) ?? [];
    expect(calls).toEqual([]);
  });

  it.each(CALLERS)("%s imports getDefaultPageName", (rel) => {
    const src = readFileSync(join(ROOT, rel), "utf8");
    expect(src).toMatch(/getDefaultPageName/);
  });
});

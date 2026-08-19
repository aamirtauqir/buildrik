/**
 * `composer.importProject` emits PROJECT_LOADED and nothing else — no
 * PROJECT_CHANGED. Undo and redo past a load, a version restore and the
 * initial project load all arrive that way.
 *
 * Four subscribers listened for PROJECT_CHANGED alone, so each of them
 * described the previous project until something else happened to fire:
 * comment pins stayed at the old element rects, the template usage counts
 * described the old pages, the link dropdown offered them, and the drag hook
 * kept aiming at a root id that no longer existed.
 *
 * The Pages panel had the identical gap and was fixed earlier; this locks the
 * rest of the set so it is not found a fifth time.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const read = (p: string) => readFileSync(resolve(here, p), "utf8");

const SUBSCRIBERS: Array<[string, string]> = [
  ["comment pins", "../comments/CommentLayer.tsx"],
  ["template usage counts", "../../sidebar/tabs/templates/hooks/useTemplateUsageMap.ts"],
  ["the link dropdown", "../../inspector/sections/LinkSection.tsx"],
  ["the drag root id", "../hooks/useElementDragDomSync.ts"],
  ["the pages panel", "../../sidebar/tabs/pages/usePages.ts"],
];

describe("everything that follows a project also follows a project LOAD", () => {
  for (const [what, path] of SUBSCRIBERS) {
    it(`${what} listens for PROJECT_LOADED`, () => {
      const src = read(path);
      expect(src).toContain("EVENTS.PROJECT_CHANGED");
      expect(src).toContain("EVENTS.PROJECT_LOADED");
    });

    it(`${what} unsubscribes from it too`, () => {
      const src = read(path);
      const offs = src.match(/\.off\(EVENTS\.PROJECT_LOADED/g) ?? [];
      const ons = src.match(/\.on\(EVENTS\.PROJECT_LOADED/g) ?? [];
      expect(offs.length).toBe(ons.length);
    });
  }
});

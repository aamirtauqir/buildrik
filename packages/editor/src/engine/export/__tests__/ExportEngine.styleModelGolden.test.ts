/**
 * CLASS-FIRST-SPEC §6 P0 acceptance 1: a legacy ("element" style model) site
 * publishes byte-identical HTML and CSS after the class-first foundations.
 *
 * The golden files under `fixtures/style-model-golden/` were written from the
 * base commit (501ceb216, before any class-first change) by running this file
 * with `UPDATE_STYLE_GOLDEN=1`. Every surface that emits the cascade is
 * pinned: the publish payload (per-page inline CSS), the ZIP's shared
 * styles.css, the single-file export CSS, Preview's document CSS, and the
 * canvas sheet at each breakpoint.
 *
 * Regenerate only when a change to legacy output is intended — and say so.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import type { Composer } from "@/engine/Composer";
import { emittedSurfaces, loadStyleModelSite } from "./fixtures/styleModelSite";

const DIR = join(__dirname, "fixtures", "style-model-golden");
const UPDATE = process.env.UPDATE_STYLE_GOLDEN === "1";

beforeAll(() => {
  installEngineBrowserStubs();
  vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
});
afterAll(() => {
  removeEngineBrowserStubs();
  vi.unstubAllGlobals();
});

function legacySite(): Composer {
  const composer = createTestComposer();
  loadStyleModelSite(composer);
  return composer;
}

describe("legacy style model — byte-identical output (P0 acceptance 1)", () => {
  it("matches the base commit's output on every surface", async () => {
    const composer = legacySite();
    try {
      const surfaces = await emittedSurfaces(composer);
      const names = Object.keys(surfaces).sort();
      if (UPDATE) {
        for (const name of names) writeFileSync(join(DIR, name), surfaces[name]);
        writeFileSync(join(DIR, "MANIFEST.txt"), names.join("\n") + "\n");
      }
      expect(names.join("\n") + "\n").toBe(readFileSync(join(DIR, "MANIFEST.txt"), "utf8"));
      for (const name of names) {
        const file = join(DIR, name);
        expect(existsSync(file), name).toBe(true);
        expect(surfaces[name], name).toBe(readFileSync(file, "utf8"));
      }
    } finally {
      composer.destroy();
    }
  });
});

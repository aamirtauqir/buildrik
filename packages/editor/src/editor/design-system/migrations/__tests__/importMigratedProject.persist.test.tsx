/**
 * Walk A2 (2026-09-24): the "Updating your project · Schema v0 → v3" modal
 * came back on every open — the engine dropped `dsSchemaVersion` on import,
 * so no save could write it back. Run → export → reload must not migrate
 * again.
 */
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { Composer } from "@/engine";
import type { ProjectData } from "@/shared/types";
import { importMigratedProject } from "../importMigratedProject";
import { TARGET_PROJECT_VERSION } from "@/engine/designSystem/migrations/projectMigrations";
import { migration0002 } from "@/engine/designSystem/migrations/projectMigrations/0002-seed-dark-color-values";
import { DEFAULT_TOKENS } from "../../constants";

beforeEach(() => localStorage.clear());

/* jsdom has no canvas; the real Composer's MediaOptimizer wants a 2d ctx. */
let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;
beforeAll(() => {
  originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
    return { canvas: this, drawImage: () => {}, getImageData: () => ({ data: [] }), putImageData: () => {} } as never;
  } as never;
});
afterAll(() => {
  HTMLCanvasElement.prototype.getContext = originalGetContext;
});

describe("importMigratedProject — runs once", () => {
  it("run → export carries the version → reload skips the migration", () => {
    const composer = new Composer({} as never);
    const data: ProjectData = { version: "1.0", pages: [], styles: [], assets: [], dsSchemaVersion: 0 } as ProjectData;
    expect(importMigratedProject(composer, data, "site-a2")).toBe(true);
    const saved = composer.exportProject();
    expect(saved.dsSchemaVersion).toBe(TARGET_PROJECT_VERSION);

    const started = vi.fn();
    composer.on("migration:started", started);
    expect(importMigratedProject(composer, saved, "site-a2")).toBe(false);
    expect(started).not.toHaveBeenCalled();
    expect(composer.exportProject().dsSchemaVersion).toBe(TARGET_PROJECT_VERSION);
  });
});

/* Walk A2's other half: Issues listed 17 "missing darkValue" because v2's
   dark pairs lived only in a migration whose result never landed. The
   defaults carry them now — running v2 over the defaults changes nothing. */
describe("DEFAULT_TOKENS carry migration v2's dark values", () => {
  it("v2 is a no-op on the defaults", () => {
    const out = migration0002.up({ tokens: DEFAULT_TOKENS } as never);
    expect(out.tokens).toEqual(DEFAULT_TOKENS);
    expect(DEFAULT_TOKENS.find((t) => t.id === "color-primary")?.darkValue).toBe("#60A5FA");
  });
});

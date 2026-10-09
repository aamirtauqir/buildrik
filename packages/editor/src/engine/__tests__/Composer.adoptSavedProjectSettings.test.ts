/**
 * Settings Phase B (BE-3): the Settings Save writes through the settings
 * mutations FIRST, then hands the values to the composer as saved state. The
 * editor must see them (SETTINGS_CHANGE: the screens re-read, the canvas
 * picks up global CSS) — but it is not a document edit: no dirty flag and no
 * PROJECT_CHANGED, which is what schedules autosave's `sites.saveProject`.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, vi } from "vitest";
import { Composer } from "../Composer";
import { EVENTS } from "@/shared/constants/events";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

function loaded() {
  const composer = new Composer({} as never);
  composer.importProject({ pages: [{ id: "p", name: "P", slug: "", root: { id: "root", type: "container", tagName: "div", children: [] } }] } as never);
  composer.markSaved();
  return composer;
}

describe("Composer.adoptSavedProjectSettings", () => {
  it("applies the settings and says so — without dirtying the project or announcing an edit", () => {
    const composer = loaded();
    const settingsChange = vi.fn();
    const projectChanged = vi.fn();
    composer.on(EVENTS.SETTINGS_CHANGE, settingsChange);
    composer.on(EVENTS.PROJECT_CHANGED, projectChanged);

    composer.adoptSavedProjectSettings({ ...composer.getProjectSettings(), redirects: { suggestFrom404s: false } });

    expect(composer.getProjectSettings().redirects).toEqual({ suggestFrom404s: false });
    expect(settingsChange).toHaveBeenCalledTimes(1);
    expect(projectChanged).not.toHaveBeenCalled();
    expect(composer.isDirty()).toBe(false);
  });

  it("is unlike setProjectSettings, which is an edit", () => {
    const composer = loaded();
    const projectChanged = vi.fn();
    composer.on(EVENTS.PROJECT_CHANGED, projectChanged);
    composer.setProjectSettings({ ...composer.getProjectSettings(), redirects: { suggestFrom404s: false } });
    expect(projectChanged).toHaveBeenCalled();
    expect(composer.isDirty()).toBe(true);
  });
});

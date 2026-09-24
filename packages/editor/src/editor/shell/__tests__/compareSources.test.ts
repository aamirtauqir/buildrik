/**
 * compareSources — B8 (G1-061): what each side of the one Compare can be, and
 * how its pages are produced.
 *
 * The saved-version render is the load-bearing case. Lane B's helper imported
 * the snapshot INTO the live composer to export it and never put the live
 * project back — opening Compare on a saved version replaced the user's draft.
 * A saved version is rendered in a scratch composer; the live one is never
 * touched.
 *
 * @license BSD-3-Clause
 */
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Composer } from "@/engine";
import type { NamedVersion } from "@/shared/types/versions";
import { sourceLabel, sourceOptions } from "../compareSources";
import { renderProjectPages } from "../exportPublishPages";

/* jsdom has no canvas; MediaOptimizer asks for a 2d context at construction. */
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

function composerWithHeading(text: string): Composer {
  const c = new Composer({} as never);
  c.elements.createPage("Home");
  const root = c.elements.getElement(c.elements.getActivePage()!.root.id)!;
  root.addChild(c.elements.createElement("heading", { content: text }));
  return c;
}

describe("renderProjectPages", () => {
  it("renders the saved snapshot and leaves the live project as it was", async () => {
    const saved = composerWithHeading("Saved headline");
    const version = { id: "v1", name: "Before launch", snapshot: saved.exportProject() } as NamedVersion;

    const live = composerWithHeading("Live headline");
    const before = JSON.stringify(live.exportProject().pages);

    const pages = await renderProjectPages(version.snapshot);

    expect(pages.map((p) => p.html).join("\n")).toContain("Saved headline");
    expect(JSON.stringify(live.exportProject().pages)).toBe(before);
    saved.destroy();
    live.destroy();
  });
});

describe("sourceOptions — decision #31: a missing version is disabled with its reason", () => {
  const none = { approvedAvailable: false, published: [], saved: [] };

  it("offers Current draft always, and names why the others are absent", () => {
    const opts = sourceOptions(none);
    const byLabel = Object.fromEntries(opts.map((o) => [o.label, o]));
    expect(byLabel["Current draft"].disabled).toBe(false);
    expect(byLabel["Approved — no approved version yet"].disabled).toBe(true);
    expect(byLabel["Published — nothing published yet"].disabled).toBe(true);
    expect(byLabel["Saved — no saved versions yet"].disabled).toBe(true);
  });

  it("lists published versions newest first with the live one marked, and saved versions by name", () => {
    const opts = sourceOptions({
      approvedAvailable: true,
      published: [
        { id: "j6", version: 6 },
        { id: "j5", version: 5 },
      ],
      saved: [{ id: "s1", name: "Before launch" }],
    });
    expect(opts.map((o) => o.label)).toEqual([
      "Approved",
      "v6 · live",
      "v5 · published",
      "Before launch · saved",
      "Current draft",
    ]);
    expect(opts.every((o) => !o.disabled)).toBe(true);
  });
});

describe("sourceLabel — a side names itself before the catalog has loaded", () => {
  const empty = { approvedAvailable: false, published: [], saved: [] };
  it("names a published side by its version, and the newest one live", () => {
    expect(sourceLabel({ kind: "published", jobId: "j5", version: 5 }, empty)).toBe("v5 · published");
    expect(
      sourceLabel({ kind: "published", jobId: "j6", version: 6 }, { ...empty, published: [{ id: "j6", version: 6 }] }),
    ).toBe("v6 · live");
  });
});

vi.mock("@/services/ReviewService", () => ({ fetchApprovedSnapshot: vi.fn() }));

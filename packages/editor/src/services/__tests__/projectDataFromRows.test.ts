/**
 * The `/share/<token>` draft preview path end to end, minus the browser:
 * dashboard rows (as `getShareDraftRows` returns them) → projectDataFromRows
 * → renderProjectPages → the publish pages.
 */
import { beforeAll, describe, it, expect } from "vitest";
import { projectDataFromRows } from "../BuildrikSyncProvider";
import { renderProjectPages } from "@/editor/shell/exportPublishPages";

/* jsdom has no canvas; MediaOptimizer asks for a 2d context at construction. */
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

const heading = (id: string, content: string) => ({
  id: "root-" + id,
  type: "container",
  children: [{ id, type: "heading", content }],
});

describe("projectDataFromRows → renderProjectPages", () => {
  it("renders every page from the saved rows, in position order, with site columns merged", async () => {
    const project = projectDataFromRows(
      { name: "Bella", publishedUrl: null, projectStyles: [{ id: "tok", kind: "token" }], projectSettings: {}, dsSchemaVersion: 0 },
      [
        { id: "p2", name: "Menu", slug: "menu", isHomePage: false, position: 1, blocks: heading("h2", "Our menu") },
        { id: "p1", name: "Home", slug: "home", isHomePage: true, position: 0, blocks: heading("h1", "Welcome to Bella") },
      ],
      { name: "Bella", metaTitle: "Bella Cucina" },
    );

    expect(project.pagesOrder).toEqual(["p1", "p2"]);
    expect(project.styles).toEqual([]); // token entries are not CSS rules
    expect(project.settings?.seo?.metaTitle).toBe("Bella Cucina");

    const pages = await renderProjectPages(project);
    const byPath = Object.fromEntries(pages.map((p) => [p.path, p.html]));
    expect(byPath["index.html"]).toContain("Welcome to Bella");
    expect(Object.values(byPath).join("\n")).toContain("Our menu");
    // The stylesheet is inlined, as for publish — a srcdoc frame has no styles.css to fetch.
    expect(byPath["index.html"]).not.toContain('href="styles.css"');
  });
});

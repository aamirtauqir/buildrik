/**
 * The in-editor Preview shows a CMS-bound element's value, as publish does.
 *
 * Dashboard verify pass 3 (DV3-3): the canvas showed "Tom & Jerry <3" for a
 * bound text while Preview showed it blank — Preview was `exportHTML()`, which
 * writes each element's STORED text and resolves no binding at all.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import {
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
  createTestComposer,
} from "@/engine/__tests__/test-utils/realComposer";
import { exportPublishPages, renderPreviewHtml } from "../exportPublishPages";

beforeAll(() => installEngineBrowserStubs());
afterAll(() => removeEngineBrowserStubs());

describe("renderPreviewHtml", () => {
  it("resolves a bound element's value (escaped, as text) into the preview", async () => {
    const c = createTestComposer();
    const page = c.elements.getActivePage() ?? c.elements.createPage("Home");
    const el = c.elements.createElement("text", { content: "Stored" });
    c.elements.addElement(el, page.root.id);
    vi.spyOn(c.cms.bindings, "resolveBinding").mockResolvedValue("Tom & Jerry <3");
    c.importProject({
      ...c.exportProject(),
      cmsBindings: {
        field: {
          [el.getId()]: [
            { binding: { sourceId: "cms:notes", path: "title", type: "variable" }, collectionId: "notes", fieldSlug: "title", property: "content" },
          ],
        },
      },
    } as never);

    const { html } = await renderPreviewHtml(c);
    expect(html).toContain("Tom &amp; Jerry &lt;3");
    expect(html).not.toContain(">Stored<");
  });

  /* REA #18: Preview built its own document (`exportHTML`) while Publish ran
     the multi-page export — two renderers for "what the page looks like". */
  it("is the page Publish ships, for the page being edited", async () => {
    const c = createTestComposer();
    const home = c.elements.getActivePage() ?? c.elements.createPage("Home");
    c.elements.addElement(c.elements.createElement("heading", { content: "Home title" }), home.root.id);
    const about = c.elements.createPage("About", { slug: "about" });
    c.elements.setActivePage(about.id);
    const live = c.elements.getActivePage()!;
    c.elements.addElement(c.elements.createElement("heading", { content: "About title" }), live.root.id);

    const shipped = await exportPublishPages(c);
    const aboutPage = shipped.find((p) => p.html.includes("About title"));
    expect(aboutPage).toBeDefined();
    expect((await renderPreviewHtml(c)).html).toBe(aboutPage!.html);
  });
});

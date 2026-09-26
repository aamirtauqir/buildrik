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
import { renderPreviewHtml } from "../exportPublishPages";

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

    const html = await renderPreviewHtml(c);
    expect(html).toContain("Tom &amp; Jerry &lt;3");
    expect(html).not.toContain(">Stored<");
  });
});

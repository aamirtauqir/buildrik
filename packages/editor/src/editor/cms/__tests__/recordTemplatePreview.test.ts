/**
 * renderRecordTemplatePreview — "Preview saved record" (7116:76427).
 * `exportPublishPages` is mocked (it's exercised on its own in
 * `editor/shell/__tests__/exportPublishPages.test.ts`); this covers the
 * template lookup + token substitution + escaping this file owns.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CMSCollection, CMSContentItem } from "@/shared/types/cms";

const exportPublishPagesMock = vi.fn();
vi.mock("@/editor/shell/exportPublishPages", () => ({
  exportPublishPages: (...a: unknown[]) => exportPublishPagesMock(...a),
}));

import { renderRecordTemplatePreview } from "../recordTemplatePreview";

const MENU = {
  id: "col-1",
  name: "Menu items",
  pageTemplatePath: "menu-item.html",
  fields: [{ slug: "name", type: "text" }, { slug: "price", type: "text" }, { slug: "link", type: "url" }],
} as unknown as CMSCollection;
const RECORD = {
  id: "r1",
  collectionId: "col-1",
  data: { name: "Margherita & Basil", price: "$12" },
  status: "published",
  createdAt: "",
  updatedAt: "",
} as CMSContentItem;

beforeEach(() => exportPublishPagesMock.mockReset());

describe("renderRecordTemplatePreview", () => {
  it("returns no-template when the collection has no template page bound", async () => {
    const out = await renderRecordTemplatePreview({} as never, { ...MENU, pageTemplatePath: undefined } as CMSCollection, RECORD);
    expect(out).toEqual({ ok: false, reason: "no-template" });
    expect(exportPublishPagesMock).not.toHaveBeenCalled();
  });

  it("returns template-missing when the bound page isn't in the current export", async () => {
    exportPublishPagesMock.mockResolvedValueOnce([{ path: "index.html", html: "<html></html>" }]);
    const out = await renderRecordTemplatePreview({} as never, MENU, RECORD);
    expect(out).toEqual({ ok: false, reason: "template-missing" });
  });

  it("returns render-failed when export throws", async () => {
    exportPublishPagesMock.mockRejectedValueOnce(new Error("boom"));
    const out = await renderRecordTemplatePreview({} as never, MENU, RECORD);
    expect(out).toEqual({ ok: false, reason: "render-failed" });
  });

  it("substitutes {fieldSlug} tokens with the record's values, HTML-escaped", async () => {
    exportPublishPagesMock.mockResolvedValueOnce([
      { path: "menu-item.html", html: "<h1>{{bk:name}}</h1><p>{price}</p><p>{missing}</p>" },
    ]);
    const out = await renderRecordTemplatePreview({} as never, MENU, RECORD);
    /* BD-13: `{{bk:key}}` and a bare `{key}` naming a FIELD are tokens;
       `{missing}` is the author's own text and stays. */
    expect(out).toEqual({ ok: true, html: "<h1>Margherita &amp; Basil</h1><p>$12</p><p>{missing}</p>" });
  });

  it("a javascript: value substituted into an href never reaches the preview iframe's srcDoc", async () => {
    exportPublishPagesMock.mockResolvedValueOnce([{ path: "menu-item.html", html: '<a href="{link}">Go</a>' }]);
    const record = { ...RECORD, data: { link: "javascript:alert(1)" } };
    const out = await renderRecordTemplatePreview({} as never, MENU, record);
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.html).not.toMatch(/javascript:/i);
  });

  it("x4: keeps the export's own <head> — the page stylesheet reaches the preview — and sanitizes only the body", async () => {
    const head =
      '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>{name}</title>' +
      "<style>.hero{color:#1A56DB}</style></head><body>";
    exportPublishPagesMock.mockResolvedValueOnce([
      { path: "menu-item.html", html: `${head}<h1 class="hero">{name}</h1><a href="{link}">Go</a></body></html>` },
    ]);
    const record = { ...RECORD, data: { name: "Margherita & Basil", link: "javascript:alert(1)" } };
    const out = await renderRecordTemplatePreview({} as never, MENU, record);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.html.startsWith(head)).toBe(true);
    expect(out.html).toContain("<style>.hero{color:#1A56DB}</style>");
    expect(out.html).toContain('<h1 class="hero">Margherita &amp; Basil</h1>');
    expect(out.html).not.toMatch(/javascript:/i);
    expect(out.html.endsWith("</body></html>")).toBe(true);
  });
});

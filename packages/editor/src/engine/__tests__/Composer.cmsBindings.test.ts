/**
 * CMS bindings must survive a project round-trip.
 *
 * They lived only in two in-memory Maps (BaseBindingManager.ts:72,
 * CMSBindingManager.ts:68) and were absent from ProjectData, so a reload
 * silently unbound every element and the next publish shipped the pre-binding
 * placeholder copy with nothing said. Both managers already carried an
 * export()/import() pair written for exactly this; nothing called it.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { EVENTS } from "../../shared/constants/events";
import {
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
  createTestComposer,
} from "./test-utils/realComposer";

beforeAll(() => installEngineBrowserStubs());
afterAll(() => removeEngineBrowserStubs());

describe("Composer — CMS bindings round-trip", () => {
  it("carries a field binding through exportProject -> importProject", () => {
    const a = createTestComposer();
    a.cms.bindings.bindToField("el-1", "col-1", "rec-1", "title", "content", "Fallback");
    const snapshot = a.exportProject();

    expect(snapshot.cmsBindings?.field?.["el-1"]).toBeTruthy();

    const b = createTestComposer();
    expect(b.cms.bindings.getBindings("el-1")).toHaveLength(0);
    b.importProject(snapshot);

    const restored = b.cms.bindings.getBindings("el-1");
    expect(restored).toHaveLength(1);
    expect(restored[0].collectionId).toBe("col-1");
    expect(restored[0].fieldSlug).toBe("title");
    expect(restored[0].property).toBe("content");
  });

  it("a project saved before the field existed still loads", () => {
    const b = createTestComposer();
    const legacy = { version: "1.0.0", pages: [], styles: [], assets: [] };
    expect(() => b.importProject(legacy as never)).not.toThrow();
  });

  /* Ldata round 3 (I2): a content binding has TEXT semantics (publish writes
     textContent), but the canvas wrote the raw CMS value as element content,
     which toHTML emits raw into the canvas's innerHTML. The value is
     HTML-escaped, and stays escaped once the element is unbound. */
  it("a content binding stores the CMS value as text, before and after unbind", async () => {
    const c = createTestComposer();
    const page = c.elements.getActivePage() ?? c.elements.createPage("Home");
    const el = c.elements.createElement("text", { content: "Placeholder" });
    c.elements.addElement(el, page.root.id);
    const payload = "<img src=x onerror=alert(1)>";
    vi.spyOn(c.cms.bindings, "resolveBinding").mockResolvedValue(payload);

    c.cms.bindings.bindToField(el.getId(), "col-1", "rec-1", "title", "content");
    await vi.waitFor(() => expect(c.elements.getElement(el.getId())!.toHTML()).toContain("&lt;img"));
    expect(c.elements.getElement(el.getId())!.toHTML()).not.toContain("<img");

    c.cms.bindings.unbindAll(el.getId());
    expect(c.elements.getElement(el.getId())!.toHTML()).toContain("&lt;img");
    expect(c.elements.getElement(el.getId())!.toHTML()).not.toContain("<img");
  });

  /* Lv3 #2: import() re-ran bind() per entry, whose applyBinding wrote the
     resolved value through setContent -> markDirty -> PROJECT_CHANGED. Every
     open of a site with a binding therefore dirtied the page and autosaved —
     a VIEWER got a 403 "Couldn't save" banner on plain load — and when the
     CMS store was not loaded yet the fallback "" overwrote the stored text.
     Loading restores the map only; the canvas preview (useCMSPreview) shows
     the bound value, and publish resolves it server-side. */
  it("loading a project with bindings leaves it clean and its stored content intact", async () => {
    const a = createTestComposer();
    const page = a.elements.getActivePage() ?? a.elements.createPage("Home");
    const el = a.elements.createElement("text", { content: "About" });
    a.elements.addElement(el, page.root.id);
    const snapshot = a.exportProject();
    snapshot.cmsBindings = {
      field: {
        [el.getId()]: [
          {
            binding: { sourceId: "cms:col-1", path: "title", type: "variable" },
            collectionId: "col-1", fieldSlug: "title", property: "content",
          },
        ],
      },
      collection: {},
    } as never;

    const b = createTestComposer();
    const resolve = vi.spyOn(b.cms.bindings, "resolveBinding").mockResolvedValue("Verify Post 1");
    const changed = vi.fn();
    b.on(EVENTS.PROJECT_CHANGED, changed);
    b.importProject(snapshot);
    await new Promise((r) => setTimeout(r, 0));

    expect(b.cms.bindings.getBindings(el.getId())).toHaveLength(1);
    expect(b.isDirty()).toBe(false);
    expect(changed).not.toHaveBeenCalled();
    expect(resolve).not.toHaveBeenCalled();
    expect(b.elements.getElement(el.getId())!.getContent()).toBe("About");
  });

  /* Ldata round 3 (I1): bindings reach import() from version restore, the
     local cache and collab — none pass the server's filter. Import runs the
     same per-entry filter: hostile entries are dropped, valid ones kept. */
  it("import drops hostile binding entries and keeps valid ones", () => {
    const c = createTestComposer();
    const good = {
      binding: { sourceId: "cms:col-1", path: "title", type: "variable" },
      collectionId: "col-1", fieldSlug: "title", property: "content",
    };
    c.importProject({
      version: "1.0.0", pages: [], styles: [], assets: [],
      cmsBindings: {
        field: {
          "el-1": [good, { ...good, property: "onclick", fallback: "alert(1)" }],
          "el-2": [{ ...good, property: "href", fallback: "javascript:alert(1)" }],
          'x"><svg onload=alert(1)>': [good],
        },
        collection: {
          "list-1": { elementId: "list-1", collectionId: "col-1", itemVar: "item" },
          "list-2": { elementId: "list-2", collectionId: "col-1", itemVar: "item", limit: -5 },
        },
      },
    } as never);

    expect(c.cms.bindings.getBindings("el-1").map((b) => b.property)).toEqual(["content"]);
    expect(c.cms.bindings.getBindings("el-2")).toHaveLength(0);
    expect(Object.keys(c.cms.bindings.export())).toEqual(["el-1"]);
    expect(c.cms.bindings.getCollectionBinding("list-1")).toBeTruthy();
    expect(c.cms.bindings.getCollectionBinding("list-2")).toBeFalsy();
  });
});

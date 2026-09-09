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
import { describe, it, expect, beforeAll, afterAll } from "vitest";
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
    a.cms.bindings.bindToField("el-1", "col-1", "rec-1", "title", "textContent", "Fallback");
    const snapshot = a.exportProject();

    expect(snapshot.cmsBindings?.field?.["el-1"]).toBeTruthy();

    const b = createTestComposer();
    expect(b.cms.bindings.getBindings("el-1")).toHaveLength(0);
    b.importProject(snapshot);

    const restored = b.cms.bindings.getBindings("el-1");
    expect(restored).toHaveLength(1);
    expect(restored[0].collectionId).toBe("col-1");
    expect(restored[0].fieldSlug).toBe("title");
    expect(restored[0].property).toBe("textContent");
  });

  it("a project saved before the field existed still loads", () => {
    const b = createTestComposer();
    const legacy = { version: "1.0.0", pages: [], styles: [], assets: [] };
    expect(() => b.importProject(legacy as never)).not.toThrow();
  });
});

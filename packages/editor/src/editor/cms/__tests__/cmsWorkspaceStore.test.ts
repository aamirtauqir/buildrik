/**
 * `ui:cms-open`'s store write (CmsOpenRequest): a collection alone opens its
 * table; with a record, the sheet on that record — in one write.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { cmsWorkspace } from "../cmsWorkspaceStore";

afterEach(() => cmsWorkspace.reset());

describe("cmsWorkspace.openRequest", () => {
  it("opens the collection's table, leaving whatever tab or sheet was open", () => {
    cmsWorkspace.openCollection("col-a", "settings");
    cmsWorkspace.openRequest({ collectionId: "col-b" });
    expect(cmsWorkspace.get()).toEqual({ collectionId: "col-b", tab: "records", recordId: null });
  });

  it("with a recordId opens the sheet on it, notifying once", () => {
    const l = vi.fn();
    const off = cmsWorkspace.subscribe(l);
    cmsWorkspace.openRequest({ collectionId: "col-b", recordId: "rec-7" });
    off();
    expect(cmsWorkspace.get()).toEqual({ collectionId: "col-b", tab: "records", recordId: "rec-7" });
    expect(l).toHaveBeenCalledTimes(1);
  });
});

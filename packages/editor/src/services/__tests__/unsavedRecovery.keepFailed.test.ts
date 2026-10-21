/**
 * A refused save's copy that cannot be kept (quota, storage off) is reported,
 * not swallowed: the user is one closed tab from losing it.
 *
 * @license BSD-3-Clause
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { keepUnsaved, UNSAVED_KEEP_FAILED_EVENT } from "../unsavedRecovery";
import type { ProjectData } from "@shared/types";

const project = { pages: [{ id: "p", name: "mine" }] } as unknown as ProjectData;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("keepUnsaved when storage refuses", () => {
  it("fires UNSAVED_KEEP_FAILED_EVENT with the site id", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    const heard = vi.fn();
    window.addEventListener(UNSAVED_KEEP_FAILED_EVENT, heard);
    keepUnsaved("site-quota", project, null);
    window.removeEventListener(UNSAVED_KEEP_FAILED_EVENT, heard);
    expect(heard).toHaveBeenCalledTimes(1);
    expect((heard.mock.calls[0][0] as CustomEvent).detail).toEqual({ siteId: "site-quota" });
  });

  it("stays quiet when the copy is kept", () => {
    const heard = vi.fn();
    window.addEventListener(UNSAVED_KEEP_FAILED_EVENT, heard);
    keepUnsaved("site-ok", project, null);
    window.removeEventListener(UNSAVED_KEEP_FAILED_EVENT, heard);
    expect(heard).not.toHaveBeenCalled();
    localStorage.removeItem("bk-unsaved-v1-site-ok");
  });
});

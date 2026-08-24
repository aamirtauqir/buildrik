/**
 * "Which template was applied" is a fact about ONE site.
 *
 * It was kept under a single `sessionStorage` key. sessionStorage outlives a
 * same-tab navigation, so applying a template on site A and then opening site B
 * in that tab showed B someone else's applied-template state — the same shape
 * as the media and CMS bleed found the same day, in a smaller place.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach } from "vitest";
import { saveAppliedId, clearAppliedId, loadAppliedId } from "../templatesStorage";

function onSite(id: string) {
  window.history.replaceState({}, "", `/edit/${id}`);
}

describe("applied-template id is per site", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("does not carry across a same-tab move to another site", () => {
    onSite("site-A");
    saveAppliedId("tpl-1");
    onSite("site-B");
    expect(loadAppliedId()).toBeNull();
  });

  it("is still there when you come back", () => {
    onSite("site-A");
    saveAppliedId("tpl-1");
    onSite("site-B");
    onSite("site-A");
    expect(loadAppliedId()).toBe("tpl-1");
  });

  it("clears only the site it was called on", () => {
    onSite("site-A");
    saveAppliedId("tpl-1");
    onSite("site-B");
    saveAppliedId("tpl-2");
    clearAppliedId();
    expect(loadAppliedId()).toBeNull();
    onSite("site-A");
    expect(loadAppliedId()).toBe("tpl-1");
  });

  /* The standalone demo has no site in the URL; it keeps the unkeyed slot
     rather than losing the feature. */
  it("still works with no site at all", () => {
    saveAppliedId("tpl-demo");
    expect(loadAppliedId()).toBe("tpl-demo");
  });
});

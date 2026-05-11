/**
 * Unification spec §550 — getSiteIdFromUrl regex + query fallback.
 * Source: packages/editor/src/services/BuildrikSyncProvider.ts:287
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";

function setLocation(pathname: string, search = "") {
  Object.defineProperty(window, "location", {
    writable: true,
    value: { pathname, search } as Location,
  });
}

describe("getSiteIdFromUrl", () => {
  let original: Location;
  beforeEach(() => {
    original = window.location;
  });
  afterEach(() => {
    Object.defineProperty(window, "location", { writable: true, value: original });
  });

  it("returns siteId from /edit/<id> path", () => {
    setLocation("/edit/abc");
    expect(getSiteIdFromUrl()).toBe("abc");
  });

  it("returns siteId from ?siteId= query fallback", () => {
    setLocation("/", "?siteId=abc");
    expect(getSiteIdFromUrl()).toBe("abc");
  });

  it("returns siteId from path when both path and query present (path wins)", () => {
    setLocation("/edit/path-wins", "?siteId=query-loses");
    expect(getSiteIdFromUrl()).toBe("path-wins");
  });

  it("returns siteId from path with trailing query string", () => {
    setLocation("/edit/abc", "?foo=bar");
    expect(getSiteIdFromUrl()).toBe("abc");
  });

  it("returns null when no path match and no query", () => {
    setLocation("/dashboard/sites");
    expect(getSiteIdFromUrl()).toBeNull();
  });

  it("decodes URL-encoded ids from path", () => {
    setLocation("/edit/abc%20def");
    expect(getSiteIdFromUrl()).toBe("abc def");
  });
});

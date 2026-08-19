import { describe, it, expect } from "vitest";
import { validateSlug, normalizeSlug } from "./slug";

describe("validateSlug", () => {
  it("allows '/' as a valid homepage slug", () => {
    expect(validateSlug("/")).toBeNull();
  });

  it("rejects empty string", () => {
    expect(validateSlug("")).not.toBeNull();
  });

  it("rejects uppercase", () => {
    expect(validateSlug("My-Page")).not.toBeNull();
  });

  it("allows valid slug", () => {
    expect(validateSlug("my-page")).toBeNull();
  });
});

describe("normalizeSlug", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(normalizeSlug("My Page")).toBe("my-page");
  });
});

describe("normalizeSlug — paths people actually type", () => {
  it("drops the leading slash of a path", () => {
    expect(normalizeSlug("/about")).toBe("about");
    expect(normalizeSlug("//about")).toBe("about");
  });

  it("keeps a nested route, which is why segments exist at all", () => {
    expect(normalizeSlug("blog/my post")).toBe("blog/my-post");
  });

  it("drops a trailing slash rather than leaving an empty segment", () => {
    expect(normalizeSlug("about/")).toBe("about");
  });
});

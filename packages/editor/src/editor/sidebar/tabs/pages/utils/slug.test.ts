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

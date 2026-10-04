import { describe, expect, it } from "vitest";
import {
  cmsFieldsSchema,
  cmsPatternError,
  cmsRecordClash,
  cmsRecordErrors,
  cmsRecordPath,
  cmsValueError,
  isEmptyCmsValue,
  stripDangerousRichtextLinks,
} from "../cms";

const f = (slug: string, type: string, extra: Record<string, unknown> = {}) => ({ id: slug, name: slug, slug, type, order: 0, ...extra });

describe("cmsValueError — one rule set for engine, sheet and server", () => {
  it("empty is empty: '', blanks, [] and null — never 0", () => {
    expect(isEmptyCmsValue("")).toBe(true);
    expect(isEmptyCmsValue("  ")).toBe(true);
    expect(isEmptyCmsValue([])).toBe(true);
    expect(isEmptyCmsValue(0)).toBe(false);
    expect(cmsValueError(f("price", "number", { validation: { required: true } }), undefined)).toMatch(/required/);
    expect(cmsValueError(f("price", "number", { validation: { required: true } }), 0)).toBeNull();
  });
  it("types", () => {
    expect(cmsValueError(f("n", "number"), "abc")).toMatch(/number/);
    expect(cmsValueError(f("s", "slug"), "Bad Slug")).toMatch(/lowercase/);
    expect(cmsValueError(f("s", "slug"), "good-slug-2")).toBeNull();
    expect(cmsValueError(f("u", "url"), "javascript:alert(1)")).toMatch(/web address/);
    expect(cmsValueError(f("m", "multiselect", { options: ["a", "b"] }), ["a", "c"])).toMatch(/isn't offered: c/);
    expect(cmsValueError(f("m", "multiselect"), "a,b")).toMatch(/list/);
    expect(cmsValueError(f("r", "reference"), 3)).toMatch(/record/);
    expect(cmsValueError(f("t", "text", { validation: { maxLength: 3 } }), "abcd")).toMatch(/at most 3/);
    expect(cmsValueError(f("t", "richtext", { validation: { maxLength: 3 } }), "<b>abc</b>")).toBeNull();
    expect(cmsValueError(f("t", "text", { validation: { pattern: "^[A-Z]" } }), "abc")).toMatch(/format/);
    expect(cmsValueError(f("t", "text", { validation: { pattern: "([" } }), "abc")).toBeNull();
  });
  it("cmsRecordErrors keys reasons by field key", () => {
    expect(cmsRecordErrors([f("name", "text", { validation: { required: true } })], {})).toEqual({ name: "name is required" });
  });
});

describe("schema + pattern + uniqueness", () => {
  it("unique keys and known types", () => {
    expect(cmsFieldsSchema.safeParse([f("a", "text"), f("a", "text")]).success).toBe(false);
    expect(cmsFieldsSchema.safeParse([f("a", "bogus")]).success).toBe(false);
    expect(cmsFieldsSchema.safeParse([f("a b", "text")]).success).toBe(false);
    expect(cmsFieldsSchema.safeParse([f("a", "text"), f("b", "slug")]).success).toBe(true);
  });
  it("pattern must be a path naming real fields", () => {
    const fields = [{ slug: "slug" }];
    expect(cmsPatternError("/blog/{slug}", fields)).toBeNull();
    expect(cmsPatternError("{slug}", fields)).toBeNull();
    expect(cmsPatternError("/blog", fields)).toMatch(/needs a field/);
    expect(cmsPatternError("/blog/{title}", fields)).toMatch(/not a field/);
    expect(cmsPatternError("/blog/{slug", fields)).toMatch(/braces/);
  });
  it("record path is empty when a placeholder resolves to nothing", () => {
    expect(cmsRecordPath("/blog/{slug}", { slug: "Hello World" })).toBe("blog/hello-world");
    expect(cmsRecordPath("/blog/{slug}", { slug: "" })).toBe("");
  });
  it("slug and page-path clashes", () => {
    const col = { fields: [f("slug", "slug")], pageSlugPattern: "/b/{slug}" };
    expect(cmsRecordClash(col, { id: "1", data: { slug: "x" } }, [{ id: "2", data: { slug: "x" }, published: false }])).toMatch(/already uses/);
    expect(cmsRecordClash(col, { id: "1", data: { slug: "x" } }, [{ id: "1", data: { slug: "x" }, published: true }])).toBeNull();
    expect(cmsRecordClash(col, { id: "1", data: {} }, [])).toMatch(/empty/);
  });
  it("rich text links: a dangerous href goes, a safe one stays", () => {
    expect(stripDangerousRichtextLinks('<a href="javascript:x()">a</a><a href="https://y">b</a>')).toBe('<a>a</a><a href="https://y">b</a>');
  });
});

/**
 * Validation helper tests — email/URL/JSON/hex/phone format checks.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { isEmail, isUrl, isJSON, parseJSON, isHexColor, isPhoneNumber } from "../validation";

describe("isEmail", () => {
  it("accepts standard addresses", () => {
    expect(isEmail("a@b.co")).toBe(true);
    expect(isEmail("first.last+tag@sub.domain.io")).toBe(true);
  });

  it("rejects missing parts and whitespace", () => {
    expect(isEmail("plainaddress")).toBe(false);
    expect(isEmail("a@b")).toBe(false); // no TLD dot
    expect(isEmail("a b@c.d")).toBe(false);
    expect(isEmail("@no-local.com")).toBe(false);
    expect(isEmail("")).toBe(false);
  });
});

describe("isUrl", () => {
  it("accepts absolute URLs of any scheme (WHATWG URL semantics)", () => {
    expect(isUrl("https://example.com/path?q=1")).toBe(true);
    expect(isUrl("http://localhost:3000")).toBe(true);
    expect(isUrl("mailto:x@y.z")).toBe(true);
  });

  it("rejects relative / malformed strings", () => {
    expect(isUrl("not a url")).toBe(false);
    expect(isUrl("/relative/path")).toBe(false);
    expect(isUrl("")).toBe(false);
  });
});

describe("isJSON / parseJSON", () => {
  it("isJSON accepts any parseable JSON value", () => {
    expect(isJSON('{"a":1}')).toBe(true);
    expect(isJSON("[1,2]")).toBe(true);
    expect(isJSON("42")).toBe(true);
    expect(isJSON("null")).toBe(true);
  });

  it("isJSON rejects malformed JSON", () => {
    expect(isJSON("{")).toBe(false);
    expect(isJSON("{'a':1}")).toBe(false);
    expect(isJSON("")).toBe(false);
  });

  it("parseJSON returns the parsed value", () => {
    expect(parseJSON('{"a":1}')).toEqual({ a: 1 });
  });

  it("parseJSON returns the fallback (or undefined) on failure", () => {
    expect(parseJSON("nope{", { fallback: true })).toEqual({ fallback: true });
    expect(parseJSON("nope{")).toBeUndefined();
  });
});

describe("isHexColor", () => {
  it("accepts #rgb, #rrggbb, #rrggbbaa", () => {
    expect(isHexColor("#abc")).toBe(true);
    expect(isHexColor("#A1B2C3")).toBe(true);
    expect(isHexColor("#2D6DFF")).toBe(true);
    expect(isHexColor("#ff000080")).toBe(true);
  });

  it("rejects 4-digit, missing hash, and invalid chars", () => {
    expect(isHexColor("#abcd")).toBe(false); // 4-digit form not allowed
    expect(isHexColor("2D6DFF")).toBe(false);
    expect(isHexColor("#GGHHII")).toBe(false);
    expect(isHexColor("")).toBe(false);
  });
});

describe("isPhoneNumber", () => {
  it("accepts digits with optional +, parens, separators", () => {
    expect(isPhoneNumber("+92 300 1234567")).toBe(true);
    expect(isPhoneNumber("(042) 111-222-333")).toBe(true);
    expect(isPhoneNumber("03001234567")).toBe(true);
  });

  it("rejects letters and empty input", () => {
    expect(isPhoneNumber("call me")).toBe(false);
    expect(isPhoneNumber("")).toBe(false);
    expect(isPhoneNumber("+")).toBe(false); // needs at least one digit
  });
});

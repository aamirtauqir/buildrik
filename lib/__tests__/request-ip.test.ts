import { describe, it, expect } from "vitest";
import { clientIp } from "@/lib/request-ip";

function headers(map: Record<string, string>) {
  return new Headers(map);
}

describe("clientIp (S-11 SSOT)", () => {
  it("takes the leftmost x-forwarded-for entry", () => {
    expect(clientIp(headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
  });

  it("trims whitespace around the leftmost entry", () => {
    expect(clientIp(headers({ "x-forwarded-for": "  1.2.3.4  , 5.6.7.8" }))).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    expect(clientIp(headers({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
  });

  it("falls back to 'unknown' by default when neither header is present", () => {
    expect(clientIp(headers({}))).toBe("unknown");
  });

  it("honors a caller-supplied fallback (null → undefined, empty string)", () => {
    expect(clientIp(headers({}), null)).toBeUndefined();
    expect(clientIp(headers({}), "")).toBe("");
  });

  it("handles a missing headers object", () => {
    expect(clientIp(undefined)).toBe("unknown");
  });
});

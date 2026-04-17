import { describe, it, expect } from "vitest";
import { relativeTime } from "../relativeTime";

const NOW = new Date("2026-04-18T12:00:00Z").getTime();

describe("relativeTime", () => {
  it("returns 'just now' for <60s", () => {
    expect(relativeTime(new Date(NOW - 10_000).toISOString(), NOW)).toBe("just now");
  });
  it("returns minutes for <60m", () => {
    expect(relativeTime(new Date(NOW - 2 * 60_000).toISOString(), NOW)).toBe("2m ago");
  });
  it("returns hours for <24h", () => {
    expect(relativeTime(new Date(NOW - 3 * 3600_000).toISOString(), NOW)).toBe("3h ago");
  });
  it("returns 'yesterday' for 1-2 day range", () => {
    expect(relativeTime(new Date(NOW - 26 * 3600_000).toISOString(), NOW)).toBe("yesterday");
  });
  it("returns days for 2-7d", () => {
    expect(relativeTime(new Date(NOW - 3 * 86400_000).toISOString(), NOW)).toBe("3d ago");
  });
  it("returns weeks for >=7d", () => {
    expect(relativeTime(new Date(NOW - 10 * 86400_000).toISOString(), NOW)).toBe("1w ago");
  });
  it("returns empty string for undefined or invalid input", () => {
    expect(relativeTime(undefined, NOW)).toBe("");
    expect(relativeTime("not-a-date", NOW)).toBe("");
  });
});

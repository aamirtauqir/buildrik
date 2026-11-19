/**
 * FG-043 (owner 2026-10-10): a Date field's configuration — a display format
 * (short / long / ISO) in the field's PRESENTATION config, and optional
 * inclusive earliest/latest bounds in its VALIDATION. Date-only values never
 * shift with the reader's timezone: "2026-10-03" is the 3rd everywhere.
 *
 * @license BSD-3-Clause
 */
import { describe, expect, it } from "vitest";
import { cmsDateOnly, cmsFieldText, cmsFieldValidationSchema, cmsFieldsSchema, cmsValueError, formatCmsDate } from "../cms";

const date = (extra: Record<string, unknown> = {}) => ({ id: "d", name: "Opens", slug: "opens", type: "date", order: 0, ...extra });

describe("cmsDateOnly — the calendar day a value names, never shifted", () => {
  it("reads a date-only value and the day part of an ISO date-time", () => {
    expect(cmsDateOnly("2026-10-03")).toBe("2026-10-03");
    expect(cmsDateOnly("2026-10-03T00:00:00.000Z")).toBe("2026-10-03");
    expect(cmsDateOnly("2026-10-03T23:30:00-05:00")).toBe("2026-10-03");
    expect(cmsDateOnly("not a date")).toBeNull();
    expect(cmsDateOnly(20261003)).toBeNull();
  });
});

describe("formatCmsDate — short / long / ISO", () => {
  it("formats the day itself, in UTC, so no timezone moves it", () => {
    expect(formatCmsDate("2026-10-03", "short")).toBe("Oct 3, 2026");
    expect(formatCmsDate("2026-10-03", "long")).toBe("October 3, 2026");
    expect(formatCmsDate("2026-10-03", "iso")).toBe("2026-10-03");
    expect(formatCmsDate("2026-01-01T00:00:00.000Z", "long")).toBe("January 1, 2026");
  });
});

describe("cmsFieldText — presentation config decides how a date reads", () => {
  it("a date field with a format reads formatted; without one, as stored", () => {
    expect(cmsFieldText(date({ presentation: { dateFormat: "long" } }), "2026-10-03")).toBe("October 3, 2026");
    expect(cmsFieldText(date(), "2026-10-03")).toBe("2026-10-03");
    expect(cmsFieldText(date({ presentation: { dateFormat: "short" } }), "")).toBe("");
    expect(cmsFieldText(date({ presentation: { dateFormat: "short" } }), "garbage")).toBe("garbage");
    expect(cmsFieldText(undefined, ["a", "b"])).toBe("a, b");
  });
});

describe("cmsValueError — inclusive earliest / latest bounds", () => {
  const bounded = date({ validation: { minDate: "2026-01-01", maxDate: "2026-12-31" } });
  it("accepts the bounds themselves and anything between", () => {
    expect(cmsValueError(bounded, "2026-01-01")).toBeNull();
    expect(cmsValueError(bounded, "2026-12-31")).toBeNull();
    expect(cmsValueError(bounded, "2026-12-31T23:59:00.000Z")).toBeNull();
  });
  it("refuses a day outside them, naming the bound", () => {
    expect(cmsValueError(bounded, "2025-12-31")).toBe("Opens must be on or after 2026-01-01");
    expect(cmsValueError(bounded, "2027-01-01")).toBe("Opens must be on or before 2026-12-31");
  });
});

describe("schema", () => {
  it("stores the format in presentation and the bounds in validation", () => {
    const ok = cmsFieldsSchema.safeParse([
      date({ presentation: { dateFormat: "iso" }, validation: { minDate: "2026-01-01", maxDate: "2026-12-31" } }),
    ]);
    expect(ok.success).toBe(true);
    expect(cmsFieldsSchema.safeParse([date({ presentation: { dateFormat: "weird" } })]).success).toBe(false);
    expect(cmsFieldsSchema.safeParse([date({ validation: { minDate: "Jan 1" } })]).success).toBe(false);
  });
});

describe("cmsFieldValidationSchema — the bounds' order", () => {
  it("refuses an earliest day after the latest, and accepts the same day", () => {
    const bad = cmsFieldValidationSchema.safeParse({ minDate: "2026-06-01", maxDate: "2026-01-01" });
    expect(bad.success).toBe(false);
    if (!bad.success) expect(bad.error.issues[0].message).toBe("Earliest must be on or before Latest.");
    expect(cmsFieldValidationSchema.safeParse({ minDate: "2026-01-01", maxDate: "2026-01-01" }).success).toBe(true);
    expect(cmsFieldsSchema.safeParse([date({ validation: { minDate: "2026-06-01", maxDate: "2026-01-01" } })]).success).toBe(false);
  });
});

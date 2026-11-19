import { describe, it, expect } from "vitest";
import { findingCounts, seoStatus, SEO_STATUS_LABEL } from "../status";

const f = (rating: "problem" | "improvement" | "good") => ({ id: "x", rating, text: "" });

describe("seoStatus (FG-008)", () => {
  it("not analysed is Not checked", () => expect(seoStatus(null, { noIndex: false })).toBe("not-checked"));
  it("any problem or improvement is Needs attention", () => {
    expect(seoStatus([f("good"), f("improvement")], { noIndex: false })).toBe("needs-attention");
    expect(seoStatus([f("problem")], { noIndex: false })).toBe("needs-attention");
  });
  it("all good is No issues detected", () => expect(seoStatus([f("good")], { noIndex: false })).toBe("no-issues"));
  it("noindex is Hidden from search regardless", () => expect(seoStatus([f("problem")], { noIndex: true })).toBe("hidden"));
  it("labels are the owner's words", () =>
    expect(Object.values(SEO_STATUS_LABEL)).toEqual(["Not checked", "Needs attention", "No issues detected", "Hidden from search"]));
  it("counts problems and improvements", () => expect(findingCounts([f("problem"), f("problem"), f("improvement"), f("good")])).toBe("2 problems · 1 improvement"));
});

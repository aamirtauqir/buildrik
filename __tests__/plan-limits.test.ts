import { describe, it, expect } from "vitest";
import { PLAN_LIMITS, getPlanLimit } from "@/lib/constants/plan-limits";

describe("Plan Limits", () => {
  it("has all 3 plans", () => {
    expect(PLAN_LIMITS.FREE).toBeDefined();
    expect(PLAN_LIMITS.PRO).toBeDefined();
    expect(PLAN_LIMITS.BUSINESS).toBeDefined();
  });
  it("Free plan has correct site limit", () => { expect(PLAN_LIMITS.FREE.sites).toBe(3); });
  it("Pro plan has correct site limit", () => { expect(PLAN_LIMITS.PRO.sites).toBe(15); });
  it("Business plan has correct site limit", () => { expect(PLAN_LIMITS.BUSINESS.sites).toBe(50); });
  it("Free plan pages per site is 10", () => { expect(PLAN_LIMITS.FREE.pagesPerSite).toBe(10); });
  it("Pro plan pages per site is 30", () => { expect(PLAN_LIMITS.PRO.pagesPerSite).toBe(30); });
  it("Business plan pages per site is 50", () => { expect(PLAN_LIMITS.BUSINESS.pagesPerSite).toBe(50); });
  it("Free plan has 0 custom domains", () => { expect(PLAN_LIMITS.FREE.customDomains).toBe(0); });
  it("Free plan has 3 AI generations", () => { expect(PLAN_LIMITS.FREE.aiGenerations).toBe(3); });
  it("Business plan has -1 (unlimited) AI generations", () => { expect(PLAN_LIMITS.BUSINESS.aiGenerations).toBe(-1); });
  it("Free plan has 10 AI prompts per day", () => { expect(PLAN_LIMITS.FREE.aiPromptsPerDay).toBe(10); });
  it("Pro plan has 200 AI prompts per day", () => { expect(PLAN_LIMITS.PRO.aiPromptsPerDay).toBe(200); });
  it("Business plan has -1 (unlimited) AI prompts per day", () => { expect(PLAN_LIMITS.BUSINESS.aiPromptsPerDay).toBe(-1); });
  it("getPlanLimit returns correct value", () => {
    expect(getPlanLimit("FREE", "sites")).toBe(3);
    expect(getPlanLimit("PRO", "teamMembers")).toBe(5);
    expect(getPlanLimit("BUSINESS", "formSubmissions")).toBe(-1);
  });
  it("Free plan share link max expiry is 7 days", () => { expect(PLAN_LIMITS.FREE.shareLinkExpiryMaxDays).toBe(7); });
  it("Free plan has no share link passwords", () => { expect(PLAN_LIMITS.FREE.shareLinkPasswords).toBe(false); });
  it("Pro plan has share link passwords", () => { expect(PLAN_LIMITS.PRO.shareLinkPasswords).toBe(true); });
  it("Pro pricing is correct", () => {
    expect(PLAN_LIMITS.PRO.priceMonthly).toBe(29);
    expect(PLAN_LIMITS.PRO.priceYearly).toBe(23);
  });
  it("all resource keys are present for each plan", () => {
    const requiredKeys = ["sites","pagesPerSite","customDomains","teamMembers","storageMB","bandwidthMB","aiGenerations","aiPromptsPerDay","fileUploadMaxMB","formSubmissions","urlRedirects","integrations","analyticsRetentionDays","shareLinkExpiryMaxDays","shareLinkPasswords","priceMonthly","priceYearly"];
    for (const plan of ["FREE","PRO","BUSINESS"] as const) {
      for (const key of requiredKeys) { expect(PLAN_LIMITS[plan]).toHaveProperty(key); }
    }
  });
});

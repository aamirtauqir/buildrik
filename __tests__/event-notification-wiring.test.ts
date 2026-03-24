import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

describe("Event Notification Wiring", () => {
  it("publish.service.ts creates SITE_PUBLISHED notification", () => {
    const src = readFileSync(path.resolve(__dirname, "../server/services/publish.service.ts"), "utf-8");
    expect(src).toContain("SITE_PUBLISHED");
    expect(src).toContain("notification.trigger");
  });

  it("auth router creates MEMBER_JOINED notification on invite accept", () => {
    const src = readFileSync(path.resolve(__dirname, "../server/trpc/routers/auth.ts"), "utf-8");
    expect(src).toContain("MEMBER_JOINED");
  });

  it("form-submission.service.ts creates FORM_SUBMISSION_RECEIVED notification", () => {
    const src = readFileSync(path.resolve(__dirname, "../server/services/form-submission.service.ts"), "utf-8");
    expect(src).toContain("FORM_SUBMISSION_RECEIVED");
    expect(src).toContain("notification.trigger");
  });
});

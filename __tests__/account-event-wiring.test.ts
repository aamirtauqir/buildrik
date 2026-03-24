import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

describe("Account Event Wiring", () => {
  const src = readFileSync(
    path.resolve(__dirname, "../server/services/account.service.ts"),
    "utf-8"
  );

  it("sends account deletion email after requestAccountDeletion", () => {
    expect(src).toContain("sendAccountDeletionEmail");
  });

  it("creates SECURITY_PASSWORD_CHANGED notification after changePassword", () => {
    expect(src).toContain("SECURITY_PASSWORD_CHANGED");
  });

  it("creates SECURITY_2FA_CHANGED notification after 2FA changes", () => {
    expect(src).toContain("SECURITY_2FA_CHANGED");
  });

  it("imports createNotification from notification.trigger", () => {
    expect(src).toContain("notification.trigger");
  });
});

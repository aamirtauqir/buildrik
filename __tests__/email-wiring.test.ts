import { describe, it, expect } from "vitest";

describe("Email Service Exports", () => {
  it("exports all 19 email send functions", async () => {
    const mod = await import("@/server/services/email.service");
    const expected = [
      "sendVerificationEmail",
      "sendPasswordResetEmail",
      "sendMagicLinkEmail",
      "sendTeamInviteEmail",
      "sendEmailChangedEmail",
      "sendPaymentFailedEmail",
      "sendDunningReminderEmail",
      "sendAutoDowngradeEmail",
      "sendExportReadyEmail",
      "sendAccountDeletionEmail",
      "sendAICompleteEmail",
      "sendAIFailedEmail",
      "sendWSTransferOutEmail",
      "sendWSTransferInEmail",
      "sendSSLExpiringEmail",
      "sendPlanLimitWarningEmail",
      "sendWSTransferInviteEmail",
      "sendFormSubmissionEmail",
      "sendSiteTransferredEmail",
    ];
    for (const fn of expected) {
      expect(mod).toHaveProperty(fn);
      expect(typeof (mod as any)[fn]).toBe("function");
    }
  });
});

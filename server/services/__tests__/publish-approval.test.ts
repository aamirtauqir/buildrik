import { describe, it, expect } from "vitest";
import { isPublishBlockedByApproval } from "../publish-approval";

/**
 * Publish approval gate (m-approval) — enforcement policy.
 *
 * Regression for the gap where `editsRequireApproval` was read only in settings
 * and never checked at publish, so a publish went through even with the gate on.
 * Policy: gate off → allowed; OWNER → always allowed; everyone else (ADMIN and
 * below) → blocked unless the site's latest review is APPROVED. ADMIN is gated on
 * purpose (§13-C1): sites.publish already requires ADMIN+, so exempting ADMIN
 * would make the setting gate nobody.
 */
describe("isPublishBlockedByApproval", () => {
  it("gate OFF → never blocked, regardless of role or review", () => {
    expect(
      isPublishBlockedByApproval({ editsRequireApproval: false, role: "EDITOR", latestReviewStatus: null }),
    ).toBe(false);
  });

  it("Owner is exempt even with the gate on and no approval", () => {
    expect(
      isPublishBlockedByApproval({ editsRequireApproval: true, role: "OWNER", latestReviewStatus: null }),
    ).toBe(false);
  });

  it("Admin is NOT exempt — gate on and no approval → blocked (§13-C1)", () => {
    expect(
      isPublishBlockedByApproval({ editsRequireApproval: true, role: "ADMIN", latestReviewStatus: null }),
    ).toBe(true);
  });

  it("Admin with gate on and latest review APPROVED → allowed", () => {
    expect(
      isPublishBlockedByApproval({ editsRequireApproval: true, role: "ADMIN", latestReviewStatus: "APPROVED" }),
    ).toBe(false);
  });

  it("Editor with gate on and NO review → blocked", () => {
    expect(
      isPublishBlockedByApproval({ editsRequireApproval: true, role: "EDITOR", latestReviewStatus: null }),
    ).toBe(true);
  });

  it("Editor with gate on and latest review APPROVED → allowed", () => {
    expect(
      isPublishBlockedByApproval({ editsRequireApproval: true, role: "EDITOR", latestReviewStatus: "APPROVED" }),
    ).toBe(false);
  });

  it("Editor with gate on and latest review PENDING or CHANGES_REQUESTED → blocked", () => {
    for (const status of ["PENDING", "CHANGES_REQUESTED"]) {
      expect(
        isPublishBlockedByApproval({ editsRequireApproval: true, role: "EDITOR", latestReviewStatus: status }),
        `latest=${status} should block`,
      ).toBe(true);
    }
  });

  it("Viewer (or any non-exempt role) with gate on and no approval → blocked", () => {
    expect(
      isPublishBlockedByApproval({ editsRequireApproval: true, role: "VIEWER", latestReviewStatus: null }),
    ).toBe(true);
  });
});

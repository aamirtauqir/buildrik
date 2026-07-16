import { describe, it, expect } from "vitest";
import { isPublishBlockedByApproval } from "../publish-approval";

/**
 * Publish approval gate (m-approval) — enforcement policy.
 *
 * Regression for the gap where `editsRequireApproval` was read only in settings
 * and never checked at publish, so an Editor could publish directly even with the
 * gate on. Policy: gate off → allowed; Owner/Admin → always allowed; everyone
 * else → blocked unless the site's latest review is APPROVED.
 */
describe("isPublishBlockedByApproval", () => {
  it("gate OFF → never blocked, regardless of role or review", () => {
    expect(
      isPublishBlockedByApproval({ editsRequireApproval: false, role: "EDITOR", latestReviewStatus: null }),
    ).toBe(false);
  });

  it("Owner and Admin are exempt even with the gate on and no approval", () => {
    for (const role of ["OWNER", "ADMIN"]) {
      expect(
        isPublishBlockedByApproval({ editsRequireApproval: true, role, latestReviewStatus: null }),
        `${role} should be exempt`,
      ).toBe(false);
    }
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

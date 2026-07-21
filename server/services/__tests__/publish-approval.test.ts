import { describe, it, expect } from "vitest";
import { isPublishBlockedByApproval, isApprovalStale, publishApprovalBlock } from "../publish-approval";

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

  it("back-compat: without timestamps, APPROVED is still allowed (no stale info)", () => {
    expect(
      isPublishBlockedByApproval({ editsRequireApproval: true, role: "EDITOR", latestReviewStatus: "APPROVED" }),
    ).toBe(false);
  });
});

/**
 * Stale-approval (contracts §1.5): an approval covers the version approved, not
 * later edits. Edited-since-approval must not silently pass — it blocks until
 * the publisher re-sends or acknowledges. Not revoked; acknowledgement ships it.
 */
describe("isApprovalStale / publishApprovalBlock — edited-since-approval", () => {
  const approvedAt = new Date("2026-07-21T10:00:00Z");
  const before = new Date("2026-07-21T09:00:00Z");
  const after = new Date("2026-07-21T11:00:00Z");

  it("isApprovalStale: edited AFTER approval → true", () => {
    expect(isApprovalStale({
      editsRequireApproval: true, role: "EDITOR", latestReviewStatus: "APPROVED",
      latestReviewResolvedAt: approvedAt, siteLastEditedAt: after,
    })).toBe(true);
  });

  it("isApprovalStale: edited BEFORE approval → false (approval still current)", () => {
    expect(isApprovalStale({
      editsRequireApproval: true, role: "EDITOR", latestReviewStatus: "APPROVED",
      latestReviewResolvedAt: approvedAt, siteLastEditedAt: before,
    })).toBe(false);
  });

  it("isApprovalStale: not APPROVED → never stale", () => {
    expect(isApprovalStale({
      editsRequireApproval: true, role: "EDITOR", latestReviewStatus: "CHANGES_REQUESTED",
      latestReviewResolvedAt: approvedAt, siteLastEditedAt: after,
    })).toBe(false);
  });

  it("block: approved but edited-since, NOT acknowledged → 'stale-unacknowledged'", () => {
    expect(publishApprovalBlock({
      editsRequireApproval: true, role: "EDITOR", latestReviewStatus: "APPROVED",
      latestReviewResolvedAt: approvedAt, siteLastEditedAt: after,
    })).toBe("stale-unacknowledged");
  });

  it("block: approved, edited-since, acknowledged → allowed (null)", () => {
    expect(publishApprovalBlock({
      editsRequireApproval: true, role: "EDITOR", latestReviewStatus: "APPROVED",
      latestReviewResolvedAt: approvedAt, siteLastEditedAt: after, acknowledgeStale: true,
    })).toBeNull();
  });

  it("block: OWNER is exempt even when stale", () => {
    expect(publishApprovalBlock({
      editsRequireApproval: true, role: "OWNER", latestReviewStatus: "APPROVED",
      latestReviewResolvedAt: approvedAt, siteLastEditedAt: after,
    })).toBeNull();
  });

  it("block: no review → 'not-approved' (distinct from stale)", () => {
    expect(publishApprovalBlock({
      editsRequireApproval: true, role: "EDITOR", latestReviewStatus: null,
    })).toBe("not-approved");
  });
});

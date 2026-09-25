/**
 * `sharing.revoke` requires ADMIN on the server (site-detail.ts's
 * `checkSiteRole(..., "ADMIN")`) — a VIEWER can never revoke a share link.
 * A VIEWER also never gets a real `token` back from `sharing.list`
 * (S-10's revealToken gate is EDITOR+), so `token === null` is the same
 * "this caller is a VIEWER" signal the row already uses to hide Copy/
 * Open/QR. Revoke must hide on that same signal instead of always
 * rendering and failing FORBIDDEN on click (controller review round 2).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AccessTab } from "../access-tab";

const baseLink = {
  id: "sl1",
  name: "Client Review",
  viewCount: 3,
  isActive: true,
  expiresAt: null,
  hasPassword: false,
  createdAt: new Date("2026-09-20"),
};

describe("AccessTab — Revoke gated on the same signal as Copy/Open/QR", () => {
  it("hides Revoke when token is null (VIEWER — server refuses revoke below ADMIN)", () => {
    render(
      <AccessTab
        shareLinks={[{ ...baseLink, token: null }]}
        onCreateLink={vi.fn()}
        onRevokeLink={vi.fn()}
        maxExpiryDays={30}
        allowPasswords={true}
      />,
    );
    expect(screen.queryByLabelText("Revoke share link")).toBeNull();
    expect(screen.queryByLabelText("Copy share link")).toBeNull();
  });

  it("shows Revoke when token is present (EDITOR+)", () => {
    render(
      <AccessTab
        shareLinks={[{ ...baseLink, token: "tok-abc" }]}
        onCreateLink={vi.fn()}
        onRevokeLink={vi.fn()}
        maxExpiryDays={30}
        allowPasswords={true}
      />,
    );
    expect(screen.getByLabelText("Revoke share link")).toBeTruthy();
    expect(screen.getByLabelText("Copy share link")).toBeTruthy();
  });
});

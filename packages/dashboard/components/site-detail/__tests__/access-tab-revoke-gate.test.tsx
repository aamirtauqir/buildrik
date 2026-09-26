/**
 * `sharing.revoke` requires ADMIN on the server (site-detail.ts's
 * `checkSiteRole(..., "ADMIN")`) — VIEWER, EDITOR and DESIGNER are all
 * refused. Hiding Revoke on `token !== null` alone only distinguishes
 * VIEWER (never gets a token — S-10's revealToken gate is EDITOR+) from
 * EDITOR+ — an EDITOR/DESIGNER still got a token and still saw a
 * working-looking Revoke button that would 403 on click. Revoke is now
 * gated on the `canRevoke` prop, which the page derives from the caller's
 * real effective site role (`sites.myRole`) against the same ADMIN rank
 * the server enforces.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
vi.mock("@/components/dashboard/toast-provider", () => ({ useToast: () => ({ addToast: vi.fn() }) }));
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

function renderTab(canRevoke: boolean, token: string | null) {
  return render(
    <AccessTab
      shareLinks={[{ ...baseLink, token }]}
      onCreateLink={vi.fn()}
      onRevokeLink={vi.fn()}
      maxExpiryDays={30}
      allowPasswords={true}
      canRevoke={canRevoke}
    />,
  );
}

describe("AccessTab — Revoke gated on canRevoke (the caller's real site role), not on token presence", () => {
  it("hides Revoke for a VIEWER (canRevoke=false, no token)", () => {
    renderTab(false, null);
    expect(screen.queryByLabelText("Revoke share link")).toBeNull();
    expect(screen.queryByLabelText("Copy share link")).toBeNull();
  });

  it("hides Revoke for an EDITOR/DESIGNER even though they have a token", () => {
    renderTab(false, "tok-editor");
    expect(screen.queryByLabelText("Revoke share link")).toBeNull();
    // Copy/Open/QR are unaffected by canRevoke — an EDITOR still has a
    // real token and those still work.
    expect(screen.getByLabelText("Copy share link")).toBeTruthy();
  });

  it("shows Revoke for an ADMIN+ (canRevoke=true)", () => {
    renderTab(true, "tok-admin");
    expect(screen.getByLabelText("Revoke share link")).toBeTruthy();
    expect(screen.getByLabelText("Copy share link")).toBeTruthy();
  });
});

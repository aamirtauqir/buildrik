// @vitest-environment jsdom
/**
 * G1-062 — a VIEWER's inspector column (board 4418:126059) and the
 * Permissions dialog it opens (4418:133026).
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import * as React from "react";
import { ViewerRoleNotice } from "../ViewerRoleNotice";

afterEach(cleanup);

describe("ViewerRoleNotice", () => {
  it("names the role and what it cannot do, and opens the permission details", () => {
    render(<ViewerRoleNotice role="VIEWER" />);
    const notice = screen.getByTestId("viewer-role-notice");
    expect(notice).toHaveTextContent("Workspace role: Viewer");
    expect(notice).toHaveTextContent("Manage members: Admin. Delete site: Workspace owner.");
    expect(screen.queryByTestId("permissions-modal")).toBeNull();

    fireEvent.click(screen.getByTestId("viewer-permission-details"));
    const modal = screen.getByTestId("permissions-modal");
    expect(modal).toHaveTextContent("Permissions — signed in as a VIEWER");
    const denied = within(modal).getAllByTestId("permissions-denied");
    expect(denied.map((r) => r.textContent)).toEqual([
      expect.stringContaining("Editors can edit"),
      expect.stringContaining("Editors can publish"),
      expect.stringContaining("Editors can send"),
      expect.stringContaining("Editors can upload"),
      expect.stringContaining("Only an admin can invite"),
      expect.stringContaining("Only the workspace owner can delete a site"),
      expect.stringContaining("Viewers cannot apply templates"),
    ]);
    expect(modal).toHaveTextContent("Allowed — read-only");
    // Board order: Edit page content, then the allowed row, then Publish.
    const rows = [...within(modal).getByTestId("permissions-rows").children].map((r) => r.textContent ?? "");
    expect(rows[0]).toContain("Edit page content");
    expect(rows[1]).toContain("Open the editor");
    expect(rows[2]).toContain("Publish");
  });

  it("Open the editor / Try it › put you back in the (read-only) editor", () => {
    render(<ViewerRoleNotice role="VIEWER" />);
    fireEvent.click(screen.getByTestId("viewer-permission-details"));
    fireEvent.click(screen.getByRole("button", { name: "Try it ›" }));
    expect(screen.queryByTestId("permissions-modal")).toBeNull();
  });
});

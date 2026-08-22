/**
 * The role reference cards on the empty team page.
 *
 * These shipped hand-written copy that said the editor role "Cannot publish
 * or manage team". Half of it was false: `sites.publish` requires exactly
 * EDITOR, and `Workspace.editsRequireApproval` defaults to false, so on a
 * default workspace that member publishes to the live site. The cards also
 * omitted Designer, a role the invite modal offers.
 *
 * This page is only reachable on a workspace with no members, which no
 * fixture has, so it is locked here rather than walked in the app.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamEmptyState } from "../team-empty-state";
import { RoleDescription, RoleLabel } from "@lib/constants/enums";

describe("TeamEmptyState role cards", () => {
  it("names every role from the SSOT, Designer included", () => {
    render(<TeamEmptyState onInvite={() => {}} />);
    for (const label of Object.values(RoleLabel)) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText(RoleLabel.DESIGNER)).toBeInTheDocument();
  });

  it("describes each role from the SSOT, not from its own copy", () => {
    render(<TeamEmptyState onInvite={() => {}} />);
    for (const description of Object.values(RoleDescription)) {
      expect(screen.getByText(description)).toBeInTheDocument();
    }
  });

  it("never tells a reader the editor role cannot publish", () => {
    const { container } = render(<TeamEmptyState onInvite={() => {}} />);
    expect(container.textContent?.toLowerCase()).not.toContain("cannot publish");
  });
});

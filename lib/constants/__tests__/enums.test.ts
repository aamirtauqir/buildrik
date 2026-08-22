/**
 * Role-label SSOT. The stored enum value stays EDITOR (JWT + ROLE_RANK
 * reference it); only the user-facing label comes from RoleLabel.
 *
 * Rewritten 2026-08-23 with the label change. This suite used to lock
 * `EDITOR → "Content editor"` and assert that no role ever reads as the bare
 * word "Editor" — build-spec E1. The founder overrode E1 because "content"
 * described a narrower permission than the code grants: EDITOR and DESIGNER
 * share a ROLE_RANK, `sites.publish` requires exactly EDITOR, and
 * `Workspace.editsRequireApproval` defaults to false. The half of E1 that
 * survives — "Client" names the account node, never a role — is still locked
 * below, as is the no-gaps rule that caught nothing but costs nothing.
 */
import { describe, it, expect } from "vitest";
import { RoleDescription, RoleLabel, roleLabel, UserRole } from "../enums";

describe("roleLabel (SSOT)", () => {
  it("titles EDITOR 'Editor' — the label promises no narrower scope than the code enforces", () => {
    expect(roleLabel("EDITOR")).toBe("Editor");
  });

  it("keeps the other roles human-titled", () => {
    expect(roleLabel("OWNER")).toBe("Owner");
    expect(roleLabel("ADMIN")).toBe("Admin");
    expect(roleLabel("DESIGNER")).toBe("Designer");
    expect(roleLabel("VIEWER")).toBe("Viewer");
  });

  it("falls back to the raw value for an unknown role", () => {
    expect(roleLabel("SOMETHING_ELSE")).toBe("SOMETHING_ELSE");
  });

  it("labels and describes every stored role value (no gaps)", () => {
    for (const value of Object.values(UserRole)) {
      expect(RoleLabel[value]).toBeTruthy();
      expect(RoleDescription[value]).toBeTruthy();
    }
  });

  it("never shows a role as 'Client' — Client names the account node", () => {
    expect(Object.values(RoleLabel)).not.toContain("Client");
  });

  /* EDITOR and DESIGNER are the same rank in permission.service, so a
     description that gave one of them a capability the other lacks would be
     inventing a boundary the server does not enforce. */
  it("does not describe EDITOR and DESIGNER as different capabilities", () => {
    const strip = (s: string) => s.replace(/ — same access as Editor$/, "");
    expect(strip(RoleDescription.DESIGNER)).toBe(strip(RoleDescription.EDITOR));
  });

  /* The team empty state shipped "Cannot publish" for this role while
     sites.publish required exactly EDITOR. */
  it("does not tell users the editor role cannot publish", () => {
    expect(RoleDescription.EDITOR.toLowerCase()).not.toContain("cannot publish");
    expect(RoleDescription.EDITOR).toContain("publish");
  });
});

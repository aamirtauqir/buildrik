/**
 * Role-label SSOT (redesign build-spec E1). The stored enum value stays EDITOR
 * (JWT + ROLE_RANK reference it); only the user-facing label is "Content editor".
 * Locks: every role has a label, EDITOR reads "Content editor", and no role ever
 * surfaces as the bare word "Editor" or as "Client" (Client = account node only).
 */
import { describe, it, expect } from "vitest";
import { RoleLabel, roleLabel, UserRole } from "../enums";

describe("roleLabel (E1 SSOT)", () => {
  it("renames EDITOR to 'Content editor' for users", () => {
    expect(roleLabel("EDITOR")).toBe("Content editor");
  });

  it("keeps the other roles human-titled", () => {
    expect(roleLabel("OWNER")).toBe("Owner");
    expect(roleLabel("ADMIN")).toBe("Admin");
    expect(roleLabel("VIEWER")).toBe("Viewer");
  });

  it("falls back to the raw value for an unknown role", () => {
    expect(roleLabel("SOMETHING_ELSE")).toBe("SOMETHING_ELSE");
  });

  it("labels every stored role value (no gaps)", () => {
    for (const value of Object.values(UserRole)) {
      expect(RoleLabel[value]).toBeTruthy();
    }
  });

  it("never shows a role as bare 'Editor' or as 'Client'", () => {
    const labels = Object.values(RoleLabel);
    expect(labels).not.toContain("Editor");
    expect(labels).not.toContain("Client");
  });
});

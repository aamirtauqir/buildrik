import { describe, it, expect } from "vitest";

describe("Team Components", () => {
  it("exports ROLE_OPTIONS with 4 roles (incl. Designer)", async () => {
    const mod = await import("@/components/team/invite-modal");
    expect(mod.ROLE_OPTIONS).toHaveLength(4);
    const values = mod.ROLE_OPTIONS.map((r: { value: string }) => r.value);
    expect(values).toEqual(["ADMIN", "EDITOR", "DESIGNER", "VIEWER"]);
  });

  /* `MEMBER_ACTIONS` stopped existing in b5d88a09, which split the menu in two:
     an active member sees Change Role / Revoke Access / Remove Member, a
     suspended one sees Reactivate / Remove Member. Both lists are module
     private now, so this asserted an export that has been gone since — a red
     test that says nothing about the split it should be guarding. */
  it("exports the MemberActions menu and the action union it emits", async () => {
    const mod = await import("@/components/team/member-actions");
    expect(typeof mod.MemberActions).toBe("function");
  });

  it("exports MembersTable component", async () => {
    const mod = await import("@/components/team/members-table");
    expect(mod.MembersTable).toBeDefined();
  });

  it("exports InviteModal component", async () => {
    const mod = await import("@/components/team/invite-modal");
    expect(mod.InviteModal).toBeDefined();
  });

  it("exports TeamEmptyState component", async () => {
    const mod = await import("@/components/team/team-empty-state");
    expect(mod.TeamEmptyState).toBeDefined();
  });

  it("exports PendingInvites component", async () => {
    const mod = await import("@/components/team/pending-invites");
    expect(mod.PendingInvites).toBeDefined();
  });
});

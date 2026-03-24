import { describe, it, expect } from "vitest";

describe("Team Components", () => {
  it("exports ROLE_OPTIONS with 3 roles", async () => {
    const mod = await import("@/components/team/invite-modal");
    expect(mod.ROLE_OPTIONS).toHaveLength(3);
    const values = mod.ROLE_OPTIONS.map((r: { value: string }) => r.value);
    expect(values).toEqual(["ADMIN", "EDITOR", "VIEWER"]);
  });

  it("exports MEMBER_ACTIONS with correct items", async () => {
    const mod = await import("@/components/team/member-actions");
    expect(mod.MEMBER_ACTIONS).toBeDefined();
    expect(mod.MEMBER_ACTIONS.length).toBeGreaterThanOrEqual(3);
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

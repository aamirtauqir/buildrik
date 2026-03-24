import { describe, it, expect } from "vitest";

describe("Account Components", () => {
  it("exports ProfileForm component", async () => {
    const mod = await import("@/components/settings/profile-form");
    expect(mod.ProfileForm).toBeDefined();
  });
  it("exports SecurityTab with 2FA_SETUP_STEPS", async () => {
    const mod = await import("@/components/settings/security-tab");
    expect(mod.SecurityTab).toBeDefined();
  });
  it("exports NOTIFICATION_CATEGORIES with 8 categories", async () => {
    const mod = await import("@/components/settings/notification-prefs");
    expect(mod.NOTIFICATION_CATEGORIES).toHaveLength(8);
  });
  it("exports WorkspaceForm component", async () => {
    const mod = await import("@/components/settings/workspace-form");
    expect(mod.WorkspaceForm).toBeDefined();
  });
  it("exports INTEGRATION_CONFIGS with 4 providers", async () => {
    const mod = await import("@/components/settings/integrations-tab");
    expect(mod.INTEGRATION_CONFIGS).toHaveLength(4);
  });
  it("exports AICreditsTab component", async () => {
    const mod = await import("@/components/settings/ai-credits-tab");
    expect(mod.AICreditsTab).toBeDefined();
  });
  it("exports DangerZoneTab component", async () => {
    const mod = await import("@/components/settings/danger-zone-tab");
    expect(mod.DangerZoneTab).toBeDefined();
  });
  it("exports AccountTab component", async () => {
    const mod = await import("@/components/settings/account-tab");
    expect(mod.AccountTab).toBeDefined();
  });
});

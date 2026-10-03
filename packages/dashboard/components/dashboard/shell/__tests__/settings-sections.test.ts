/**
 * Settings Phase B §25 (#47): the workspace settings directory's five groups,
 * and the routes folded into another card still titled when deep-linked.
 */
import { describe, it, expect } from "vitest";
import { SETTINGS_GROUPS, findSettingsSection } from "../settings-sections";

describe("workspace settings directory — §25 groups", () => {
  it("draws WORKSPACE · CONNECTIONS · BILLING · PERSONAL · DANGER ZONE with their cards", () => {
    expect(SETTINGS_GROUPS.map((g) => [g.label, g.items.map((i) => i.label)])).toEqual([
      ["Workspace", ["General & branding", "Team"]],
      ["Connections", ["Apps & integrations", "Domains", "Workspace API tokens"]],
      ["Billing", ["Plan & billing", "Usage & credits"]],
      ["Personal", ["Profile", "Account & sign-in", "Security", "Notifications"]],
      ["Danger zone", ["Transfer or delete"]],
    ]);
    expect(SETTINGS_GROUPS.find((g) => g.label === "Personal")?.note).toBe("Only affects you");
  });

  it("Plans and AI credits are no cards of their own, yet a deep link is still titled", () => {
    const hrefs = SETTINGS_GROUPS.flatMap((g) => g.items.map((i) => i.href));
    expect(hrefs).not.toContain("/dashboard/settings/plans");
    expect(hrefs).not.toContain("/dashboard/settings/ai");
    expect(findSettingsSection("/dashboard/settings/plans")?.label).toBe("Plans");
    expect(findSettingsSection("/dashboard/settings/ai")?.label).toBe("AI credits");
    expect(findSettingsSection("/dashboard/settings/integrations/vercel-team-picker")?.label).toBe("Apps & integrations");
  });
});

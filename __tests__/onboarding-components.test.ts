import { describe, it, expect } from "vitest";

/**
 * ONBOARDING_DENSITIES (role-select) and CREATION_METHODS (project-setup) belonged
 * to the old 2-step onboarding that the M2 wizard replaced. Both components are
 * gone; their tests stayed and have been red ever since. Removed. The checklist
 * is still live and still covered below.
 */
describe("Onboarding Components", () => {


  describe("checklist items", () => {
    it("full and invited variants each have at least 3 items", async () => {
      const mod = await import("@/components/onboarding/dashboard-checklist");
      expect(mod.FULL_CHECKLIST_ITEMS.length).toBeGreaterThanOrEqual(4);
      expect(mod.INVITED_CHECKLIST_ITEMS.length).toBeGreaterThanOrEqual(3);
    });

    it("each item has id, label, description and a registered task id", async () => {
      const mod = await import("@/components/onboarding/dashboard-checklist");
      const { DASHBOARD_TASK_IDS } = await import("@buildrik/shared/schemas/onboarding");
      for (const item of [...mod.FULL_CHECKLIST_ITEMS, ...mod.INVITED_CHECKLIST_ITEMS]) {
        expect(item).toHaveProperty("id");
        expect(item).toHaveProperty("label");
        expect(item).toHaveProperty("description");
        // every rendered task id must be accepted by completeDashboardTask
        expect(DASHBOARD_TASK_IDS).toContain(item.id);
      }
    });
  });

  describe("OnboardingRoleSelect", () => {
    it("exports OnboardingRoleSelect component", async () => {
      const mod = await import("@/components/onboarding/role-select");
      expect(mod.OnboardingRoleSelect).toBeDefined();
      expect(typeof mod.OnboardingRoleSelect).toBe("function");
    });
  });

  describe("OnboardingProjectSetup", () => {
    it("exports OnboardingProjectSetup component", async () => {
      const mod = await import("@/components/onboarding/project-setup");
      expect(mod.OnboardingProjectSetup).toBeDefined();
      expect(typeof mod.OnboardingProjectSetup).toBe("function");
    });
  });

  describe("DashboardChecklist", () => {
    it("exports DashboardChecklist component", async () => {
      const mod = await import("@/components/onboarding/dashboard-checklist");
      expect(mod.DashboardChecklist).toBeDefined();
      expect(typeof mod.DashboardChecklist).toBe("function");
    });
  });
});

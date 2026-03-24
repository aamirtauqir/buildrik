import { describe, it, expect } from "vitest";

describe("Onboarding Components", () => {
  describe("ONBOARDING_ROLES", () => {
    it("has 3 roles: Freelancer, Small Team, Agency", async () => {
      const mod = await import("@/components/onboarding/role-select");
      expect(mod.ONBOARDING_ROLES).toHaveLength(3);
      const values = mod.ONBOARDING_ROLES.map((r: { value: string }) => r.value);
      expect(values).toContain("FREELANCER");
      expect(values).toContain("SMALL_TEAM");
      expect(values).toContain("AGENCY");
      const labels = mod.ONBOARDING_ROLES.map((r: { label: string }) => r.label);
      expect(labels).toContain("Freelancer");
      expect(labels).toContain("Small Team");
      expect(labels).toContain("Agency");
    });
  });

  describe("CREATION_METHODS", () => {
    it("has 3 methods: ai, template, blank", async () => {
      const mod = await import("@/components/onboarding/project-setup");
      expect(mod.CREATION_METHODS).toHaveLength(3);
      const values = mod.CREATION_METHODS.map((m: { value: string }) => m.value);
      expect(values).toContain("ai");
      expect(values).toContain("template");
      expect(values).toContain("blank");
    });
  });

  describe("DASHBOARD_CHECKLIST_ITEMS", () => {
    it("has at least 4 items", async () => {
      const mod = await import("@/components/onboarding/dashboard-checklist");
      expect(mod.DASHBOARD_CHECKLIST_ITEMS.length).toBeGreaterThanOrEqual(4);
    });

    it("each item has id, label, description", async () => {
      const mod = await import("@/components/onboarding/dashboard-checklist");
      for (const item of mod.DASHBOARD_CHECKLIST_ITEMS) {
        expect(item).toHaveProperty("id");
        expect(item).toHaveProperty("label");
        expect(item).toHaveProperty("description");
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

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    onboardingState: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    site: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  getOnboardingState,
  selectRole,
  setupProject,
  completeStep,
  completeDashboardTask,
  dismissOnboarding,
  completeTourStep,
  completeTour,
} from "@/server/services/onboarding.service";

const mockState = {
  id: "obs_1",
  userId: "user_1",
  role: null,
  step: "ROLE_SELECT",
  projectName: null,
  method: null,
  dashboardTasks: null,
  editorTasks: null,
  tourStep: 0,
  tourCompleted: false,
  completed: false,
  dismissed: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Onboarding Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOnboardingState", () => {
    it("returns existing state when found", async () => {
      vi.mocked(prisma.onboardingState.findUnique).mockResolvedValue(mockState as any);
      const result = await getOnboardingState("user_1");
      expect(result.id).toBe("obs_1");
      expect(result.step).toBe("ROLE_SELECT");
    });

    it("creates default state when not found", async () => {
      vi.mocked(prisma.onboardingState.findUnique).mockResolvedValue(null);
      const created = { ...mockState, id: "obs_new" };
      vi.mocked(prisma.onboardingState.create).mockResolvedValue(created as any);
      const result = await getOnboardingState("user_1");
      expect(result.id).toBe("obs_new");
      expect(prisma.onboardingState.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: "user_1", step: "ROLE_SELECT" }),
        })
      );
    });

    it("read-repairs a user stuck at SITE_CREATION who already owns a site", async () => {
      vi.mocked(prisma.onboardingState.findUnique).mockResolvedValue({
        ...mockState,
        step: "SITE_CREATION",
      } as any);
      vi.mocked(prisma.site.findFirst).mockResolvedValue({ id: "site_1" } as any);
      const repaired = { ...mockState, step: "CHECKLIST" };
      vi.mocked(prisma.onboardingState.update).mockResolvedValue(repaired as any);

      const result = await getOnboardingState("user_1");
      expect(result.step).toBe("CHECKLIST");
      expect(prisma.onboardingState.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user_1" },
          data: { step: "CHECKLIST" },
        })
      );
    });

    it("does NOT advance a SITE_CREATION user with no site yet", async () => {
      vi.mocked(prisma.onboardingState.findUnique).mockResolvedValue({
        ...mockState,
        step: "SITE_CREATION",
      } as any);
      vi.mocked(prisma.site.findFirst).mockResolvedValue(null);

      const result = await getOnboardingState("user_1");
      expect(result.step).toBe("SITE_CREATION");
      expect(prisma.onboardingState.update).not.toHaveBeenCalled();
    });
  });

  describe("selectRole", () => {
    it("updates role and advances step to PROJECT_SETUP", async () => {
      const updated = { ...mockState, role: "FREELANCER", step: "PROJECT_SETUP" };
      vi.mocked(prisma.onboardingState.update).mockResolvedValue(updated as any);
      const result = await selectRole("user_1", "FREELANCER");
      expect(result.role).toBe("FREELANCER");
      expect(result.step).toBe("PROJECT_SETUP");
      expect(prisma.onboardingState.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user_1" },
          data: expect.objectContaining({ role: "FREELANCER", step: "PROJECT_SETUP" }),
        })
      );
    });
  });

  describe("setupProject", () => {
    it("updates projectName and method and advances to SITE_CREATION", async () => {
      const updated = {
        ...mockState,
        role: "FREELANCER",
        step: "SITE_CREATION",
        projectName: "My Portfolio",
        method: "template",
      };
      vi.mocked(prisma.onboardingState.update).mockResolvedValue(updated as any);
      const result = await setupProject("user_1", { projectName: "My Portfolio", method: "template" });
      expect(result.projectName).toBe("My Portfolio");
      expect(result.method).toBe("template");
      expect(result.step).toBe("SITE_CREATION");
      expect(prisma.onboardingState.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user_1" },
          data: expect.objectContaining({
            projectName: "My Portfolio",
            method: "template",
            step: "SITE_CREATION",
          }),
        })
      );
    });
  });

  describe("completeStep", () => {
    it("advances from SITE_CREATION to EDITOR_TOUR", async () => {
      const updated = { ...mockState, step: "EDITOR_TOUR" };
      vi.mocked(prisma.onboardingState.update).mockResolvedValue(updated as any);
      const result = await completeStep("user_1", "SITE_CREATION");
      expect(result.step).toBe("EDITOR_TOUR");
    });

    it("advances from EDITOR_TOUR to CHECKLIST", async () => {
      const updated = { ...mockState, step: "CHECKLIST" };
      vi.mocked(prisma.onboardingState.update).mockResolvedValue(updated as any);
      const result = await completeStep("user_1", "EDITOR_TOUR");
      expect(result.step).toBe("CHECKLIST");
    });

    it("sets completed=true when completing CHECKLIST", async () => {
      const updated = { ...mockState, step: "COMPLETED", completed: true };
      vi.mocked(prisma.onboardingState.update).mockResolvedValue(updated as any);
      const result = await completeStep("user_1", "CHECKLIST");
      expect(result.completed).toBe(true);
    });

    it("rejects unknown step ids instead of completing all onboarding", async () => {
      await expect(completeStep("user_1", "add-text-block")).rejects.toThrow("INVALID_STEP");
      expect(prisma.onboardingState.update).not.toHaveBeenCalled();
    });
  });

  describe("completeDashboardTask", () => {
    it("appends the task without touching step/completed", async () => {
      vi.mocked(prisma.onboardingState.findUnique).mockResolvedValue({
        ...mockState,
        step: "CHECKLIST",
        dashboardTasks: ["add-text-block"],
      } as any);
      vi.mocked(prisma.onboardingState.update).mockImplementation(
        (async (args: any) => ({ ...mockState, ...args.data })) as any
      );

      await completeDashboardTask("user_1", "upload-image");
      const call = vi.mocked(prisma.onboardingState.update).mock.calls[0][0];
      expect(call.data.dashboardTasks).toEqual(
        expect.arrayContaining(["add-text-block", "upload-image"])
      );
      expect(call.data).not.toHaveProperty("completed");
      expect(call.data).not.toHaveProperty("step");
    });

    it("flips completed when the final full-checklist task lands", async () => {
      vi.mocked(prisma.onboardingState.findUnique).mockResolvedValue({
        ...mockState,
        step: "CHECKLIST",
        dashboardTasks: [
          "add-text-block",
          "upload-image",
          "change-site-name",
          "add-second-page",
          "preview-site",
          "invite-team-member",
        ],
      } as any);
      vi.mocked(prisma.onboardingState.update).mockImplementation(
        (async (args: any) => ({ ...mockState, ...args.data })) as any
      );

      await completeDashboardTask("user_1", "publish-site");
      const call = vi.mocked(prisma.onboardingState.update).mock.calls[0][0];
      expect(call.data.completed).toBe(true);
      expect(call.data.step).toBe("COMPLETED");
    });
  });

  describe("dismissOnboarding", () => {
    it("sets dismissed=true", async () => {
      const updated = { ...mockState, dismissed: true };
      vi.mocked(prisma.onboardingState.update).mockResolvedValue(updated as any);
      const result = await dismissOnboarding("user_1");
      expect(result.dismissed).toBe(true);
      expect(prisma.onboardingState.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user_1" },
          data: expect.objectContaining({ dismissed: true }),
        })
      );
    });
  });

  describe("completeTourStep", () => {
    it("advances tourStep", async () => {
      const updated = { ...mockState, tourStep: 2 };
      vi.mocked(prisma.onboardingState.update).mockResolvedValue(updated as any);
      const result = await completeTourStep("user_1", 1);
      expect(result.tourStep).toBe(2);
      expect(prisma.onboardingState.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user_1" },
          data: expect.objectContaining({ tourStep: 2 }),
        })
      );
    });
  });

  describe("completeTour", () => {
    it("sets tourCompleted=true", async () => {
      const updated = { ...mockState, tourCompleted: true };
      vi.mocked(prisma.onboardingState.update).mockResolvedValue(updated as any);
      const result = await completeTour("user_1");
      expect(result.tourCompleted).toBe(true);
      expect(prisma.onboardingState.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user_1" },
          data: expect.objectContaining({ tourCompleted: true }),
        })
      );
    });
  });
});

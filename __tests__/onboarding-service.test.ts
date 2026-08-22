import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    onboardingState: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    userPreference: {
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

/**
 * `selectRole` and `setupProject` were the old 2-step onboarding. The M2 wizard
 * replaced them and the service functions were deleted; their tests stayed and
 * have been red ever since. Removed. getOnboardingState and completeStep are
 * still live and still covered below.
 */
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



  describe("completeStep", () => {
    /** What the caller says it finished only counts if that is where they are. */
    function standingOn(step: string) {
      vi.mocked(prisma.onboardingState.findUnique).mockResolvedValue({
        ...mockState,
        step,
      } as any);
    }

    it("advances from SITE_CREATION to EDITOR_TOUR", async () => {
      standingOn("SITE_CREATION");
      vi.mocked(prisma.onboardingState.update).mockResolvedValue({} as any);
      await completeStep("user_1", "SITE_CREATION");
      expect(prisma.onboardingState.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ step: "EDITOR_TOUR" }) }),
      );
    });

    it("advances from EDITOR_TOUR to CHECKLIST", async () => {
      standingOn("EDITOR_TOUR");
      vi.mocked(prisma.onboardingState.update).mockResolvedValue({} as any);
      await completeStep("user_1", "EDITOR_TOUR");
      expect(prisma.onboardingState.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ step: "CHECKLIST" }) }),
      );
    });

    it("sets completed=true when completing CHECKLIST", async () => {
      standingOn("CHECKLIST");
      vi.mocked(prisma.onboardingState.update).mockResolvedValue({} as any);
      await completeStep("user_1", "CHECKLIST");
      expect(prisma.onboardingState.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ completed: true }) }),
      );
    });

    it("rejects unknown step ids instead of completing all onboarding", async () => {
      await expect(completeStep("user_1", "add-text-block")).rejects.toThrow("INVALID_STEP");
      expect(prisma.onboardingState.update).not.toHaveBeenCalled();
    });

    it("will not finish onboarding for someone who is still on the first step", async () => {
      standingOn("ROLE_SELECT");
      await completeStep("user_1", "CHECKLIST");
      expect(prisma.onboardingState.update).not.toHaveBeenCalled();
    });

    it("is a no-op when the same step arrives twice", async () => {
      standingOn("CHECKLIST");
      vi.mocked(prisma.onboardingState.update).mockResolvedValue({} as any);
      await completeStep("user_1", "CHECKLIST");
      vi.mocked(prisma.onboardingState.update).mockClear();
      standingOn("COMPLETED");
      await completeStep("user_1", "CHECKLIST");
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

  // completeTourStep / completeTour removed — dead procedures (no tour UI).
});

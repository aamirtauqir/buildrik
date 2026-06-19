import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  getOnboardingState,
  selectRole,
  setupProject,
  completeStep,
  completeDashboardTask,
  dismissOnboarding,
} from "@/server/services/onboarding.service";
import {
  selectRoleSchema,
  setupProjectSchema,
  completeDashboardTaskSchema,
} from "@buildrik/shared/schemas/onboarding";

export const onboardingRouter = router({
  getState: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await getOnboardingState(ctx.session.user.id);
    } catch {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to load onboarding state" });
    }
  }),

  selectRole: protectedProcedure
    .input(selectRoleSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await selectRole(ctx.session.user.id, input.density);
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to save role" });
      }
    }),

  setupProject: protectedProcedure
    .input(setupProjectSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await setupProject(ctx.session.user.id, input);
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to save project setup" });
      }
    }),

  completeStep: protectedProcedure
    .input(z.object({ step: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await completeStep(ctx.session.user.id, input.step);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "INVALID_STEP")
          throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown onboarding step" });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to advance step" });
      }
    }),

  completeDashboardTask: protectedProcedure
    .input(completeDashboardTaskSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await completeDashboardTask(ctx.session.user.id, input.taskId);
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to complete task" });
      }
    }),

  dismiss: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      return await dismissOnboarding(ctx.session.user.id);
    } catch {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to dismiss onboarding" });
    }
  }),
  // completeTourStep / completeTour procedures removed — no tour UI calls them
  // (zero consumers). The tourStep/tourCompleted columns remain on
  // OnboardingState for when an editor tour is actually built.
});

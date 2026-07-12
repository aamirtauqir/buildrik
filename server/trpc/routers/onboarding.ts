import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  getOnboardingState,
  completeStep,
  completeDashboardTask,
  dismissOnboarding,
  saveWizard,
  completeWizard,
} from "@/server/services/onboarding.service";
import {
  completeDashboardTaskSchema,
  wizardDataSchema,
} from "@buildrik/shared/schemas/onboarding";

export const onboardingRouter = router({
  getState: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await getOnboardingState(ctx.session.user.id);
    } catch {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to load onboarding state" });
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

  saveWizard: protectedProcedure
    .input(wizardDataSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await saveWizard(ctx.session.user.id, input);
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to save onboarding progress" });
      }
    }),

  completeWizard: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      return await completeWizard(ctx.session.user.id);
    } catch {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to complete onboarding" });
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

import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  getOnboardingState,
  completeDashboardTask,
  completeEditorTask,
  dismissOnboarding,
  saveWizard,
  completeWizard,
} from "@/server/services/onboarding.service";
import {
  completeDashboardTaskSchema,
  completeEditorTaskSchema,
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

  completeDashboardTask: protectedProcedure
    .input(completeDashboardTaskSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await completeDashboardTask(ctx.session.user.id, input.taskId);
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to complete task" });
      }
    }),

  completeEditorTask: protectedProcedure
    .input(completeEditorTaskSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await completeEditorTask(ctx.session.user.id, input.taskId);
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

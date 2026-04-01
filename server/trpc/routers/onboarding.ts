import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  getOnboardingState,
  selectRole,
  setupProject,
  completeStep,
  dismissOnboarding,
  completeTourStep,
  completeTour,
} from "@/server/services/onboarding.service";
import { selectRoleSchema, setupProjectSchema } from "@buildrik/shared/schemas/onboarding";

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
        return await selectRole(ctx.session.user.id, input.role);
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
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to advance step" });
      }
    }),

  dismiss: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      return await dismissOnboarding(ctx.session.user.id);
    } catch {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to dismiss onboarding" });
    }
  }),

  completeTourStep: protectedProcedure
    .input(z.object({ step: z.number().int().min(0) }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await completeTourStep(ctx.session.user.id, input.step);
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to advance tour step" });
      }
    }),

  completeTour: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      return await completeTour(ctx.session.user.id);
    } catch {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to complete tour" });
    }
  }),
});

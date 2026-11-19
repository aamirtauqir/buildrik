import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  getOnboardingState,
  completeDashboardTask,
  dismissOnboarding,
  getEditorOnboarding,
  markEditorTip,
  recordEditorMilestone,
  setEditorChecklistDismissed,
  saveWizard,
  completeWizard,
} from "@/server/services/onboarding.service";
import {
  completeDashboardTaskSchema,
  editorOnboardingInput,
  markEditorTipSchema,
  recordEditorMilestoneSchema,
  setEditorChecklistDismissedSchema,
  wizardDataSchema,
} from "@buildrik/shared/schemas/onboarding";
import { PermissionError } from "@/server/services/permission.service";

/** Editor onboarding is site-scoped: a refused site reaches the client as its own code. */
function editorOnboardingError(e: unknown, message: string): never {
  if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
}

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

  /** L1-015: the one Getting-started view (per user × site) the pill and checklist both read. */
  editorState: protectedProcedure.input(editorOnboardingInput).query(async ({ ctx, input }) => {
    try {
      return await getEditorOnboarding(ctx.session.user.id, input.siteId);
    } catch (e) {
      editorOnboardingError(e, "Failed to load onboarding progress");
    }
  }),

  recordEditorMilestone: protectedProcedure.input(recordEditorMilestoneSchema).mutation(async ({ ctx, input }) => {
    try {
      return await recordEditorMilestone(ctx.session.user.id, input.siteId, input.milestone);
    } catch (e) {
      editorOnboardingError(e, "Failed to record progress");
    }
  }),

  setEditorChecklistDismissed: protectedProcedure
    .input(setEditorChecklistDismissedSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await setEditorChecklistDismissed(ctx.session.user.id, input.siteId, input.dismissed);
      } catch (e) {
        editorOnboardingError(e, "Failed to update the checklist");
      }
    }),

  /** L1-029: the tip queue's seen/dismissed memory, stored with the L1-015 state. */
  markEditorTip: protectedProcedure.input(markEditorTipSchema).mutation(async ({ ctx, input }) => {
    try {
      return await markEditorTip(ctx.session.user.id, input.siteId, input.tipId, input.action);
    } catch (e) {
      editorOnboardingError(e, "Failed to update tips");
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

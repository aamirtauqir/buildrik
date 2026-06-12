import { z } from "zod";

export const onboardingStateSchema = z.object({
  id: z.string(),
  role: z.string().nullable(),
  step: z.string().nullable(),
  projectName: z.string().nullable(),
  method: z.string().nullable(),
  completed: z.boolean(),
  dismissed: z.boolean(),
  tourStep: z.number(),
  tourCompleted: z.boolean(),
});

export const selectRoleSchema = z.object({
  role: z.enum(["FREELANCER", "SMALL_TEAM", "AGENCY"]),
});

export const setupProjectSchema = z.object({
  projectName: z.string().min(2).max(100),
  method: z.enum(["blank", "template", "ai"]),
});

// Canonical dashboard-checklist task ids (union of the full and invited
// variants rendered by dashboard-checklist.tsx). Checklist tasks are tracked
// per-task in OnboardingState.dashboardTasks — they are NOT steps in the
// step sequence, and completing one must never advance the step machine.
export const DASHBOARD_TASK_IDS = [
  "add-text-block",
  "upload-image",
  "change-site-name",
  "add-second-page",
  "preview-site",
  "invite-team-member",
  "publish-site",
  "edit-page",
] as const;

export const completeDashboardTaskSchema = z.object({
  taskId: z.enum(DASHBOARD_TASK_IDS),
});

export type OnboardingStateData = z.infer<typeof onboardingStateSchema>;

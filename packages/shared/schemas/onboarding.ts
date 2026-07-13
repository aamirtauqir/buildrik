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

// M2 onboarding wizard state (spec §2). Persisted to OnboardingState.wizardData
// after every step so a refresh resumes at `route` with inputs intact. Versioned
// so the shape can evolve; validated on write AND read. Fields fill in as the
// user progresses — everything past `v`/`route` is optional.
export const wizardDataSchema = z.object({
  v: z.literal(1),
  route: z.string(), // current frame route, e.g. "/onboarding/site" — the resume point
  workspace: z.object({
    name: z.string().max(40).optional(),
    role: z.string().optional(),
    teamSize: z.string().optional(),
  }).optional(),
  site: z.object({
    name: z.string().optional(),
    orgType: z.enum(["mine", "existing", "new"]).optional(),
    client: z.object({
      id: z.string().optional(),
      name: z.string().optional(),
      email: z.string().optional(),
    }).optional(),
  }).optional(),
  path: z.enum(["ai", "template", "blank"]).optional(),
  ai: z.object({
    industry: z.string().optional(),
    name: z.string().optional(),
    desc: z.string().optional(),
    location: z.string().optional(),
    goal: z.string().optional(),
    audience: z.string().optional(),
    cta: z.string().optional(),
    pages: z.array(z.string()).optional(),
    tone: z.string().optional(),
    style: z.string().optional(),
    color: z.string().optional(),
    refs: z.string().optional(),
  }).optional(),
  template: z.object({ id: z.string().optional() }).optional(),
  blank: z.object({
    startingPage: z.string().optional(),
    layoutStarter: z.string().optional(),
  }).optional(),
  // Outputs written as the flow produces them.
  workspaceId: z.string().optional(),
  siteId: z.string().optional(),
});

export type WizardData = z.infer<typeof wizardDataSchema>;

export type OnboardingStateData = z.infer<typeof onboardingStateSchema>;

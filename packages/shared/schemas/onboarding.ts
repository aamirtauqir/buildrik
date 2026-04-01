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

export type OnboardingStateData = z.infer<typeof onboardingStateSchema>;

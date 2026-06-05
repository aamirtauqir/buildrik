import { z } from "zod";

/**
 * AI adoption telemetry (task-level). The point is to measure whether AI edits
 * are TRUSTED — applied and kept — not vanity "which commands ran". Three events:
 *   edit.applied  — an AI edit batch was applied to the canvas
 *   edit.reverted — the user undid an AI edit (the survival / regret signal)
 *   agent.run     — an agent build loop finished (planned/applied/skipped/failed)
 *
 * PRIVACY: this payload carries STRUCTURAL metrics only — command type names,
 * scope, counts, durations. It MUST NOT carry prompt text, token values, or any
 * page content.
 */
export const aiAdoptionEventSchema = z.enum([
  "edit.applied",
  "edit.reverted",
  "agent.run",
]);
export type AiAdoptionEventName = z.infer<typeof aiAdoptionEventSchema>;

export const aiAdoptionSurfaceSchema = z.enum(["inline", "chat", "agent"]);
export type AiAdoptionSurface = z.infer<typeof aiAdoptionSurfaceSchema>;

export const aiAdoptionInputSchema = z.object({
  siteId: z.string().min(1),
  event: aiAdoptionEventSchema,
  surface: aiAdoptionSurfaceSchema.optional(),
  model: z.string().max(40).optional(),
  // Command TYPE names only (e.g. "set-style", "set-token") — never values.
  commandIds: z.array(z.string().max(40)).max(50).optional(),
  appliedCount: z.number().int().nonnegative().max(1000).optional(),
  // agent.run outcome
  stepsPlanned: z.number().int().nonnegative().max(100).optional(),
  stepsApplied: z.number().int().nonnegative().max(100).optional(),
  stepsSkipped: z.number().int().nonnegative().max(100).optional(),
  stepsFailed: z.number().int().nonnegative().max(100).optional(),
  durationMs: z.number().int().nonnegative().max(3_600_000).optional(),
});
export type AiAdoptionInput = z.infer<typeof aiAdoptionInputSchema>;

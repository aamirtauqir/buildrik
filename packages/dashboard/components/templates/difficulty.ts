import type { PillTone } from "@/components/dashboard/primitives";

/** One difficulty → Pill tone map for the templates gallery + detail page
 *  (was two identical hand-rolled color maps bypassing Pill). */
export const DIFFICULTY_PILL: Record<string, { tone: PillTone; label: string }> = {
  BEGINNER: { tone: "success", label: "Beginner" },
  INTERMEDIATE: { tone: "accent", label: "Intermediate" },
  ADVANCED: { tone: "warning", label: "Advanced" },
};

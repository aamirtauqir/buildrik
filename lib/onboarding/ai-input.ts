import type { WizardData } from "@buildrik/shared/schemas/onboarding";

/**
 * Turn the AI wizard's answers into a `generateSiteSchema` payload.
 *
 * This lived inside the generating page as a private function, which is how its
 * one real bug shipped unnoticed: the budgeting arithmetic below had no way to
 * be tested. It is here so it can be.
 */

const INDUSTRY_TO_TYPE: Record<string, "PORTFOLIO" | "BUSINESS" | "BLOG" | "RESTAURANT" | "AGENCY" | "ECOMMERCE"> = {
  restaurant: "RESTAURANT",
  clinic: "BUSINESS",
  agency: "AGENCY",
  shop: "ECOMMERCE",
  portfolio: "PORTFOLIO",
  events: "BUSINESS",
  saas: "BUSINESS",
  other: "BUSINESS",
};

const TONE_MAP: Record<string, "professional" | "casual" | "creative" | "minimal" | "bold" | "playful"> = {
  professional: "professional",
  friendly: "casual",
  premium: "creative",
  bold: "bold",
  minimal: "minimal",
};

const GOAL_LABEL: Record<string, string> = {
  leads: "get leads",
  calls: "book calls",
  sell: "sell products",
  portfolio: "show portfolio",
  inform: "share information",
};

/** `generateSiteSchema.description` caps at 500 — everything folded shares it. */
export const DESCRIPTION_BUDGET = 500;

/**
 * Fold the A2/A3 answers the generate schema has no fields for (goal, audience,
 * CTA, location, style, colors, references) into the description so the AI still
 * sees them.
 *
 * The structured answers are composed FIRST and the free-text description takes
 * whatever budget is left. It used to be the other way around: `desc` led and the
 * joined string was `.slice(0, 500)`d at the end, so a long description ate the
 * budget and silently starved everything appended after it. "One-line
 * description" is only a placeholder — no field in the AI wizard has a maxLength
 * — and a realistic 473-character answer dropped five of the seven folded
 * answers, every one from the brand step among them. The user filled in three
 * screens of questions and the model saw two of them.
 *
 * `tone` is deliberately NOT folded. It briefly was, because the worker used to
 * collapse the job's six-value tone onto a three-value style and four of the
 * five wizard choices arrived identical. `PageGenerationInput` now carries tone
 * on its own field, so folding it too would say the same thing twice and spend
 * description budget doing it.
 *
 * Structured answers win the tie because the user picked them deliberately, they
 * are short, and they carry more signal per character than prose. Losing the tail
 * of a description shows up in the output; losing "Colors: deep green and cream"
 * does not — the draft just quietly ignores the brand.
 */
export function buildGenerateInput(ai: NonNullable<WizardData["ai"]>) {
  const clauses: string[] = [];
  if (ai.goal) clauses.push(`Goal: ${GOAL_LABEL[ai.goal] ?? ai.goal}.`);
  if (ai.audience) clauses.push(`Audience: ${ai.audience}.`);
  if (ai.cta) clauses.push(`Primary CTA: ${ai.cta}.`);
  if (ai.location) clauses.push(`Location: ${ai.location}.`);
  if (ai.style) clauses.push(`Visual style: ${ai.style}.`);
  if (ai.color) clauses.push(`Colors: ${ai.color}.`);
  if (ai.refs) clauses.push(`Reference sites: ${ai.refs}.`);

  // Clauses are free text too, so they can overrun on their own. Drop whole
  // clauses from the end (references first, goal last) rather than truncating
  // mid-sentence — half a clause reads as noise to the model.
  const kept: string[] = [];
  let used = 0;
  for (const clause of clauses) {
    if (used + clause.length + 1 > DESCRIPTION_BUDGET) break;
    kept.push(clause);
    used += clause.length + 1;
  }

  const room = DESCRIPTION_BUDGET - used - (kept.length > 0 ? 1 : 0);
  const desc = (ai.desc ?? "").slice(0, Math.max(room, 0));
  const description = [desc, ...kept].filter(Boolean).join(" ").slice(0, DESCRIPTION_BUDGET);

  return {
    name: (ai.name ?? "My Site").slice(0, 100),
    businessType: INDUSTRY_TO_TYPE[ai.industry ?? "other"] ?? "BUSINESS",
    pages: (ai.pages && ai.pages.length ? ai.pages : ["Home", "About", "Contact"]).slice(0, 8),
    description,
    tone: TONE_MAP[ai.tone ?? "professional"] ?? "professional",
    content: "generate" as const,
    // Real seeded photos so the first AI draft looks finished, not grey-boxed.
    images: "stock" as const,
  };
}

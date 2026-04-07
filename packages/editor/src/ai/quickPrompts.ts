/**
 * Quick prompt suggestions and option generators for AI Assistant
 * @license BSD-3-Clause
 */

import { CONTENT_TYPES, TONES } from "../shared/utils/openai";

export const QUICK_PROMPTS: Record<string, string[]> = {
  content: [
    "Write a compelling product description for a SaaS tool",
    "Create a customer testimonial for an e-commerce platform",
    "Generate a feature list for a mobile app",
    "Write pricing plan descriptions for a subscription service",
    "Create a team bio for a startup founder",
    "Write a newsletter signup CTA",
    "Generate FAQ about shipping and returns",
  ],
  layout: [
    "Create a pricing section with 3 plans",
    "Design a feature grid with icons",
    "Build a contact form section",
    "Create a team members section",
  ],
  image: [
    "Abstract technology background",
    "Professional team meeting",
    "Modern workspace with laptop",
    "Nature landscape with mountains",
  ],
};

export function getQuickPrompts(tab: string): string[] {
  return QUICK_PROMPTS[tab] ?? [];
}

// Pre-computed option arrays for select fields
export const contentTypeOptions = Object.entries(CONTENT_TYPES).map(
  ([value, { label, description }]) => ({
    value,
    label: `${label} - ${description}`,
  })
);

export const toneOptions = Object.entries(TONES).map(([value, { label, emoji }]) => ({
  value,
  label: `${emoji} ${label}`,
}));

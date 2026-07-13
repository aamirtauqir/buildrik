import type { PillTone } from "@/components/dashboard/primitives";

// SSOT: site status → shared Pill tone + Title-case label. Consumed by site
// cards, list rows, and the site-detail header — all render status via <Pill>.
const STATUS_TONES: Record<string, PillTone> = {
  published: "success",
  live: "success",
  draft: "neutral",
  archived: "neutral",
  staging: "warning",
  review: "warning",
};

export function siteStatusTone(status: string): PillTone {
  return STATUS_TONES[status.toLowerCase()] ?? "warning";
}

// Title-case label: "PUBLISHED" → "Published", "draft" → "Draft".
export function siteStatusLabel(status: string): string {
  const s = status.toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

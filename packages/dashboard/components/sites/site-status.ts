import type { PillTone } from "@/components/dashboard/primitives";

// SSOT: site status → shared Pill tone. Consumed by site cards, list rows, and
// the site-detail header — all render status via the Pill primitive.
const STATUS_TONES: Record<string, PillTone> = {
  PUBLISHED: "success",
  DRAFT: "warning",
  ARCHIVED: "neutral",
};

export function siteStatusTone(status: string): PillTone {
  return STATUS_TONES[status] ?? "warning";
}

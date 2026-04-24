/**
 * statusLabel — map PageStatus enum to human-readable chip label.
 * Returns null for unknown / undefined values so the caller can render no chip.
 *
 * Centralizing this map prevents the "missing case" bug class — adding a new
 * status to PageStatus will tsc-error here until the LABELS record is updated.
 *
 * @license BSD-3-Clause
 */
import type { PageStatus } from "../types";

const LABELS: Record<PageStatus, string> = {
  live: "Live",
  draft: "Draft",
  scheduled: "Scheduled",
  hidden: "Hidden",
  password: "Password",
  external: "External",
  error: "Error",
};

const VALID = new Set(Object.keys(LABELS) as PageStatus[]);

export function getStatusLabel(status: PageStatus | undefined): string | null {
  if (!status) return null;
  if (!VALID.has(status)) return null;
  return LABELS[status];
}

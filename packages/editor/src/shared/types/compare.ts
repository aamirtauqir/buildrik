/**
 * The sides of the one Compare (B8, G1-061) — the payload every Compare door
 * sends on `UI_COMPARE_OPEN`.
 *
 * @license BSD-3-Clause
 */

export type CompareSource =
  | { kind: "approved" }
  | { kind: "published"; jobId: string; version: number }
  | { kind: "saved"; versionId: string }
  | { kind: "current" };

/** What a door opens Compare on, and which door it was ("Opened from …"). */
export interface CompareRequest {
  left: CompareSource;
  right: CompareSource;
  from: "Review" | "History" | "Publish";
}

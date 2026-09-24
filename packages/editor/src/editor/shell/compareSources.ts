/**
 * compareSources — the sides of the ONE Compare (B8, G1-061; picker board
 * 6930:79853: "v3 · approved · v5 · published · v6 · live · Current draft").
 *
 * Three compares used to exist — ApprovedCompareView (Review), PublishDiffView
 * (Publish history) and the saved-version compare — each with its own idea of
 * what the two sides were. A side is now one of four sources, and this file is
 * where a source becomes pages.
 *
 * Published pages are the one source the editor cannot fetch: `publishDiff`
 * keeps the HTML inside the service by design, and `sites.publishedSnapshot`
 * is not a registered procedure yet (needs-dashboard). So a published side
 * only pairs with another published side, where the server's own page-by-page
 * diff is the body.
 *
 * @license BSD-3-Clause
 */
import type { Composer } from "@/engine";
import type { CompareSource } from "@/shared/types/compare";
import type { ComparePage } from "@/shared/utils/html";
import { fetchApprovedSnapshot } from "@/services/ReviewService";
import { exportPublishPages, renderProjectPages } from "./exportPublishPages";

export interface SourceOption {
  /** Stable key for the <select>; decodes back with `sourceFromKey`. */
  key: string;
  label: string;
  disabled: boolean;
}

export interface SourceCatalog {
  approvedAvailable: boolean;
  /** Newest first — the first row is what is live. */
  published: ReadonlyArray<{ id: string; version: number }>;
  saved: ReadonlyArray<{ id: string; name: string }>;
}

export function sourceKey(s: CompareSource): string {
  switch (s.kind) {
    case "approved":
      return "approved";
    case "current":
      return "current";
    case "published":
      return `published:${s.jobId}:${s.version}`;
    case "saved":
      return `saved:${s.versionId}`;
  }
}

export function sourceFromKey(key: string): CompareSource {
  if (key === "approved") return { kind: "approved" };
  if (key.startsWith("published:")) {
    const [, jobId, version] = key.split(":");
    return { kind: "published", jobId, version: Number(version) };
  }
  if (key.startsWith("saved:")) return { kind: "saved", versionId: key.slice("saved:".length) };
  return { kind: "current" };
}

/**
 * The picker's rows, in the board's order: approved, published (newest = live),
 * saved, current. A source that does not exist is still listed, disabled, with
 * the reason in its label (decision #31) — a `<option>` cannot carry a tooltip.
 */
export function sourceOptions(c: SourceCatalog): SourceOption[] {
  const opts: SourceOption[] = [
    c.approvedAvailable
      ? { key: "approved", label: "Approved", disabled: false }
      : { key: "approved", label: "Approved — no approved version yet", disabled: true },
  ];
  if (c.published.length === 0) {
    opts.push({ key: "published:none", label: "Published — nothing published yet", disabled: true });
  } else {
    c.published.forEach((p, i) =>
      opts.push({
        key: sourceKey({ kind: "published", jobId: p.id, version: p.version }),
        label: `v${p.version} · ${i === 0 ? "live" : "published"}`,
        disabled: false,
      }),
    );
  }
  if (c.saved.length === 0) {
    opts.push({ key: "saved:none", label: "Saved — no saved versions yet", disabled: true });
  } else {
    c.saved.forEach((v) =>
      opts.push({ key: sourceKey({ kind: "saved", versionId: v.id }), label: `${v.name} · saved`, disabled: false }),
    );
  }
  opts.push({ key: "current", label: "Current draft", disabled: false });
  return opts;
}

/** A side's name in the pane head and the picker, from the source itself — the
 *  catalog arrives after the door has already opened on a source. */
export function sourceLabel(s: CompareSource, c: SourceCatalog): string {
  switch (s.kind) {
    case "approved":
      return "Approved";
    case "current":
      return "Current draft";
    case "published":
      return `v${s.version} · ${c.published[0]?.id === s.jobId ? "live" : "published"}`;
    case "saved":
      return `${c.saved.find((v) => v.id === s.versionId)?.name ?? "Saved version"} · saved`;
  }
}

/**
 * One side's pages. `null` = the source has no pages to show (an approval that
 * predates snapshot capture). Throws on transport failure so the host shows a
 * retryable error, never a fake-empty diff (DF5).
 */
export async function loadSourcePages(composer: Composer, source: CompareSource): Promise<ComparePage[] | null> {
  switch (source.kind) {
    case "approved":
      return fetchApprovedSnapshot();
    case "current":
      return exportPublishPages(composer);
    case "saved": {
      const version = composer.versions?.getVersions().find((v) => v.id === source.versionId);
      return version ? renderProjectPages(version.snapshot) : null;
    }
    case "published":
      throw new Error("A published version compares with another published version.");
  }
}

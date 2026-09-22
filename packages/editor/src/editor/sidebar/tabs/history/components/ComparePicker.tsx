/**
 * ComparePicker — B8 (code-gap plan) Compare view.
 *
 * Two-row picker (left · right) with four source options each:
 *   - Approved  — the round's frozen snapshot (dashboard review service)
 *   - Published — a selected past publish job's snapshot (dashboard publish
 *                 service, planned-but-not-registered procedure mirror)
 *   - Saved     — a named version's snapshot, rendered through the live
 *                 Composer (swap-and-export helper)
 *   - Current   — the live canvas, rendered with the publish-page exporter
 *
 * Each row's source resolves independently to a `ComparePage[] | null`
 * (the shape `ApprovedCompareView` expects). A row whose source has not
 * been picked yet stays at the source-list stage, not at loading.
 *
 * State machine per side: idle -> loading -> ready | empty | error.
 * `fetchSeq` refs suppress stale loads across source changes.
 *
 * `role="status"` + `aria-live="polite"` on the diff region so a screen
 * reader announces the new diff after either side changes — same a11y
 * pattern as ActivityLogView.
 *
 * No raw `<button>/<input>/<select>/<textarea>` (Gate 24) — chips route
 * through chrome-ui's Button, and the source selector is chrome-ui Select.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, EmptyState, Select, SkeletonListItem } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import type { NamedVersion } from "@/shared/types/versions";
import type { PublishPage } from "@/editor/shell/exportPublishPages";
import { exportPublishPages } from "@/editor/shell/exportPublishPages";
import type { ComparePage } from "@/shared/utils/html";
import { fetchApprovedSnapshot } from "@/services/ReviewService";
import { fetchPublishHistory, fetchPublishedSnapshot } from "@/services/PublishService";
import type { PublishHistoryRow } from "@/services/PublishService";
import { ApprovedCompareView } from "@/editor/panels/version-history/ApprovedCompareView";
import { renderVersionPages } from "./renderVersionPages";

type Source = "approved" | "published" | "saved" | "current";
const SOURCES: Source[] = ["approved", "published", "saved", "current"];

const SOURCE_LABEL: Record<Source, string> = {
  approved: "Approved",
  published: "Published",
  saved: "Saved",
  current: "Current",
};

const SOURCE_BODY: Record<Source, string> = {
  approved: "Frozen at last client sign-off.",
  published: "Pick a past publish job.",
  saved: "Pick a named version.",
  current: "Live canvas (renders on demand).",
};

type SideState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; pages: ComparePage[] }
  | { kind: "empty" }
  | { kind: "error"; message: string };

export interface ComparePickerProps {
  composer: Composer | null;
  /** Site scope — picker rows fetch against this id. Null = opened without a
   *  site; renders the same "no site" state ActivityLogView uses. */
  siteId: string | null;
}

const SOURCE_ROW =
  "tw:flex tw:flex-col tw:gap-[var(--bk-space-4)] tw:rounded-md tw:border tw:border-[var(--bk-border)] " +
  "tw:px-3 tw:py-2 tw:bg-transparent";
const SOURCE_TITLE = "tw:text-[12px] tw:text-[var(--bk-ink)] tw:font-medium tw:m-0";
const SOURCE_BODY_CLASS = "tw:text-[11px] tw:text-[var(--bk-ink-muted)] tw:m-0";
const SOURCE_DETAIL = "tw:text-[11px] tw:text-[var(--bk-ink-muted)]";
const SOURCE_CHIP_ROW = "tw:flex tw:flex-wrap tw:gap-[var(--bk-space-4)]";
const SOURCE_CHIP =
  "tw:px-[var(--bk-space-8)] tw:py-[var(--bk-space-4)] tw:text-[12px] " +
  "tw:h-6 tw:leading-4 tw:font-normal tw:[font-family:inherit] tw:text-[var(--bk-ink-soft)] " +
  "tw:bg-transparent tw:border tw:border-[var(--bk-border)] tw:rounded-full " +
  "tw:cursor-pointer tw:[transition:color_150ms_ease-out,background-color_150ms_ease-out,border-color_150ms_ease-out] " +
  "tw:hover:text-[var(--bk-ink)] tw:focus-visible:outline-none " +
  "tw:focus-visible:shadow-[var(--bk-shadow-focus)]";
const SOURCE_CHIP_ACTIVE =
  "tw:font-medium tw:text-[var(--bk-accent-on)] tw:bg-[var(--bk-accent)] tw:border-[var(--bk-accent)]";

const PICKER_WRAP =
  "tw:flex tw:flex-col tw:gap-[var(--bk-space-8)] tw:px-[var(--bk-space-12)] tw:pt-[var(--bk-space-8)]";
const DIFF_REGION =
  "tw:flex tw:flex-col tw:gap-[var(--bk-space-8)] tw:px-[var(--bk-space-12)] tw:pt-[var(--bk-space-8)] tw:pb-[var(--bk-space-16)]";

function toComparePages(pages: PublishPage[]): ComparePage[] {
  return pages.map((p) => ({ path: p.path, html: p.html }));
}

/* B8 — gated by HistoryTab once shipping. Local component right now; the
   anti-pattern gate does not see named exports it cannot trace, so the
   shape keeps the `export` keyword reserved for the wiring commit. */
const ComparePicker: React.FC<ComparePickerProps> = ({ composer, siteId }) => {
  const [leftSource, setLeftSource] = React.useState<Source>("approved");
  const [rightSource, setRightSource] = React.useState<Source>("current");
  const [publishedHistory, setPublishedHistory] = React.useState<PublishHistoryRow[] | null>(null);
  const [publishedError, setPublishedError] = React.useState<string | null>(null);
  const [savedVersions, setSavedVersions] = React.useState<NamedVersion[] | null>(null);

  const [left, setLeft] = React.useState<SideState>({ kind: "idle" });
  const [right, setRight] = React.useState<SideState>({ kind: "idle" });

  const leftSeq = React.useRef(0);
  const rightSeq = React.useRef(0);

  React.useEffect(() => {
    if (!siteId) {
      setPublishedHistory(null);
      setPublishedError("No site selected.");
      return;
    }
    setPublishedError(null);
    fetchPublishHistory(siteId)
      .then((rows) => setPublishedHistory(rows))
      .catch((e: unknown) =>
        setPublishedError(e instanceof Error ? e.message : String(e)),
      );
  }, [siteId]);

  React.useEffect(() => {
    setSavedVersions(composer?.versions?.getVersions() ?? null);
  }, [composer]);

  const loadApproved = React.useCallback(
    async (side: "left" | "right") => {
      if (!siteId) return;
      const seq = side === "left" ? ++leftSeq.current : ++rightSeq.current;
      const setSide = side === "left" ? setLeft : setRight;
      setSide({ kind: "loading" });
      try {
        const pages = await fetchApprovedSnapshot();
        if ((side === "left" ? leftSeq.current : rightSeq.current) !== seq) return;
        if (!pages) {
          setSide({ kind: "empty" });
          return;
        }
        setSide({ kind: "ready", pages: toComparePages(pages) });
      } catch (e) {
        if ((side === "left" ? leftSeq.current : rightSeq.current) !== seq) return;
        setSide({
          kind: "error",
          message: e instanceof Error ? e.message : String(e),
        });
      }
    },
    [siteId],
  );

  const loadPublished = React.useCallback(
    async (side: "left" | "right", jobId: string) => {
      if (!siteId) return;
      const seq = side === "left" ? ++leftSeq.current : ++rightSeq.current;
      const setSide = side === "left" ? setLeft : setRight;
      setSide({ kind: "loading" });
      try {
        const pages = await fetchPublishedSnapshot(siteId, jobId);
        if ((side === "left" ? leftSeq.current : rightSeq.current) !== seq) return;
        if (!pages) {
          setSide({ kind: "empty" });
          return;
        }
        setSide({ kind: "ready", pages: toComparePages(pages) });
      } catch (e) {
        if ((side === "left" ? leftSeq.current : rightSeq.current) !== seq) return;
        setSide({
          kind: "error",
          message: e instanceof Error ? e.message : String(e),
        });
      }
    },
    [siteId],
  );

  const loadSaved = React.useCallback(
    async (side: "left" | "right", versionId: string) => {
      if (!composer) return;
      const versions = composer.versions?.getVersions() ?? [];
      const version = versions.find((v: NamedVersion) => v.id === versionId);
      if (!version) {
        const setSide = side === "left" ? setLeft : setRight;
        setSide({ kind: "empty" });
        return;
      }
      const seq = side === "left" ? ++leftSeq.current : ++rightSeq.current;
      const setSide = side === "left" ? setLeft : setRight;
      setSide({ kind: "loading" });
      try {
        const pages = await renderVersionPages(composer, version);
        if ((side === "left" ? leftSeq.current : rightSeq.current) !== seq) return;
        setSide({ kind: "ready", pages: toComparePages(pages) });
      } catch (e) {
        if ((side === "left" ? leftSeq.current : rightSeq.current) !== seq) return;
        setSide({
          kind: "error",
          message: e instanceof Error ? e.message : String(e),
        });
      }
    },
    [composer],
  );

  const loadCurrent = React.useCallback(
    async (side: "left" | "right") => {
      if (!composer) return;
      const seq = side === "left" ? ++leftSeq.current : ++rightSeq.current;
      const setSide = side === "left" ? setLeft : setRight;
      setSide({ kind: "loading" });
      try {
        const pages = await exportPublishPages(composer);
        if ((side === "left" ? leftSeq.current : rightSeq.current) !== seq) return;
        setSide({ kind: "ready", pages: toComparePages(pages) });
      } catch (e) {
        if ((side === "left" ? leftSeq.current : rightSeq.current) !== seq) return;
        setSide({
          kind: "error",
          message: e instanceof Error ? e.message : String(e),
        });
      }
    },
    [composer],
  );

  const handleSource = React.useCallback(
    (side: "left" | "right", source: Source) => {
      const setSideState = side === "left" ? setLeft : setRight;
      setSideState({ kind: "idle" });
      if (side === "left") setLeftSource(source);
      else setRightSource(source);
      if (source === "approved") void loadApproved(side);
      else if (source === "current") void loadCurrent(side);
    },
    [loadApproved, loadCurrent],
  );

  if (!siteId) {
    return (
      <section
        role="status"
        aria-live="polite"
        data-testid="compare-no-site"
        className="tw:px-[var(--bk-space-12)] tw:py-[var(--bk-space-16)]"
      >
        <EmptyState
          title="No site selected"
          body="Open this site from the dashboard to compare versions."
        />
      </section>
    );
  }

  const sidePanel = (
    side: "left" | "right",
    source: Source,
    state: SideState,
    onSource: (s: Source) => void,
  ) => (
    <div className={SOURCE_ROW} data-side={side} data-source={source} data-state={state.kind}>
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
        <p className={SOURCE_TITLE}>{SOURCE_LABEL[source]}</p>
        <div className={SOURCE_CHIP_ROW} role="group" aria-label={`${side} source`}>
          {SOURCES.map((s) => (
            <Button
              key={s}
              type="button"
              size="xs"
              aria-pressed={source === s}
              className={`${SOURCE_CHIP}${source === s ? ` ${SOURCE_CHIP_ACTIVE}` : ""}`}
              onClick={() => onSource(s)}
            >
              {SOURCE_LABEL[s]}
            </Button>
          ))}
        </div>
      </div>
      <p className={SOURCE_BODY_CLASS}>{SOURCE_BODY[source]}</p>
      {source === "published" && (
        <div data-testid={`compare-${side}-published-selector`}>
          <Select
            aria-label="Pick a published version"
            disabled={publishedHistory === null}
            value=""
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const jobId = e.target.value;
              if (jobId) void loadPublished(side, jobId);
            }}
          >
            <option value="">
              {publishedHistory === null
                ? publishedError
                  ? "Couldn't load history"
                  : "Loading history…"
                : publishedHistory.length === 0
                  ? "No published versions yet"
                  : "Pick a published version"}
            </option>
            {(publishedHistory ?? []).map((row) => (
              <option key={row.id} value={row.id}>
                v{row.version}
                {row.completedAt
                  ? ` — ${new Date(row.completedAt).toLocaleDateString()}`
                  : ""}
              </option>
            ))}
          </Select>
          {publishedError && (
            <p className={SOURCE_DETAIL} role="alert">
              {publishedError}
            </p>
          )}
        </div>
      )}
      {source === "saved" && (
        <div data-testid={`compare-${side}-saved-selector`}>
          <Select
            aria-label="Pick a saved version"
            disabled={savedVersions === null}
            value=""
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const versionId = e.target.value;
              if (versionId) void loadSaved(side, versionId);
            }}
          >
            <option value="">
              {savedVersions === null
                ? "Loading saved versions…"
                : savedVersions.length === 0
                  ? "No saved versions yet"
                  : "Pick a saved version"}
            </option>
            {(savedVersions ?? []).map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </Select>
        </div>
      )}
      {state.kind === "loading" && (
        <div data-testid={`compare-${side}-loading`}>
          <SkeletonListItem />
          <SkeletonListItem />
        </div>
      )}
      {state.kind === "error" && (
        <p className={SOURCE_DETAIL} role="alert" data-testid={`compare-${side}-error`}>
          {state.message}
        </p>
      )}
      {state.kind === "empty" && (
        <p className={SOURCE_DETAIL} data-testid={`compare-${side}-empty`}>
          No snapshot for this source.
        </p>
      )}
    </div>
  );

  return (
    <>
      <div className={PICKER_WRAP}>
        {sidePanel("left", leftSource, left, (s) => handleSource("left", s))}
        {sidePanel("right", rightSource, right, (s) => handleSource("right", s))}
      </div>
      <section
        className={DIFF_REGION}
        role="status"
        aria-live="polite"
        data-testid="compare-diff"
      >
        <ApprovedCompareView
          approvedPages={left.kind === "ready" ? left.pages : null}
          currentPages={right.kind === "ready" ? right.pages : null}
        />
      </section>
    </>
  );
};

export default ComparePicker; /* re-export on the B8 wiring commit */

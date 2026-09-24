/**
 * CompareHost — the ONE Compare (B8, G1-061; boards 4418:115486 side by side,
 * 4418:115521 overlay, 4418:115551 list, picker 6930:79853).
 *
 * Every Compare door — the Review panel's "Compare with approved", the History
 * panel's approved band, Publish history's per-row "Compare" — emits
 * `UI_COMPARE_OPEN` with the two sides it means; this is the only place a
 * comparison renders. Each side has a picker (approved · published · saved ·
 * current draft), so a door only chooses where Compare STARTS.
 *
 * Page-set sides render through `ApprovedCompareView` (split · overlay · list).
 * Two PUBLISHED sides render the server's page-by-page diff instead: published
 * HTML stays inside the service (see compareSources).
 *
 * Mounted once by the shell, full-canvas through chrome-ui's `OverlayMount`
 * (Gate 22).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { AlertCircle, X } from "lucide-react";
import { Button, EmptyState, OverlayMount, Select, Spinner, Toolbar, ToolbarSpacer } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import type { ComparePage } from "@/shared/utils/html";
import { ApprovedCompareView } from "@/editor/panels/version-history/ApprovedCompareView";
import { fetchApprovedSnapshot } from "@/services/ReviewService";
import { fetchPublishHistory } from "@/services/PublishService";
import { PublishDiffView } from "./PublishDiffView";
import type { CompareRequest, CompareSource } from "@/shared/types/compare";
import {
  loadSourcePages,
  sourceFromKey,
  sourceKey,
  sourceLabel,
  sourceOptions,
  type SourceCatalog,
} from "./compareSources";

type Side = { status: "loading" } | { status: "ready"; pages: ComparePage[] | null } | { status: "error" };

const SURFACE =
  "tw:flex tw:h-[760px] tw:w-[1080px] tw:max-w-[95vw] tw:flex-col tw:overflow-hidden tw:rounded-lg tw:bg-[var(--bk-bg-panel)]";
const BAR_TITLE = "tw:text-[14px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]";
const FROM = "tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)] tw:whitespace-nowrap";
const CLOSE_BTN = "tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-muted)]";

/** A published side pairs only with another published side. Picking one
 *  moves the other side to the nearest other published version; leaving
 *  published on one side moves the other back to a page-set source. */
function pairWith(next: CompareSource, other: CompareSource, catalog: SourceCatalog): CompareSource {
  if (next.kind === "published" && other.kind !== "published") {
    const alt = catalog.published.find((p) => p.id !== next.jobId);
    return alt ? { kind: "published", jobId: alt.id, version: alt.version } : other;
  }
  if (next.kind !== "published" && other.kind === "published") {
    return next.kind === "current" && catalog.approvedAvailable ? { kind: "approved" } : { kind: "current" };
  }
  return other;
}

export const CompareHost: React.FC<{ composer: Composer | null; siteId: string | null }> = ({ composer, siteId }) => {
  const [request, setRequest] = React.useState<CompareRequest | null>(null);
  const [left, setLeftSource] = React.useState<CompareSource>({ kind: "approved" });
  const [right, setRightSource] = React.useState<CompareSource>({ kind: "current" });
  const [catalog, setCatalog] = React.useState<SourceCatalog>({ approvedAvailable: false, published: [], saved: [] });
  const [leftSide, setLeftSide] = React.useState<Side>({ status: "loading" });
  const [rightSide, setRightSide] = React.useState<Side>({ status: "loading" });
  const [mode, setMode] = React.useState<"split" | "overlay" | "list">("split");

  React.useEffect(() => {
    if (!composer) return;
    const open = (req: CompareRequest) => {
      setRequest(req);
      /* A door that opens on the approved side has seen an approval; the
         read below confirms it. Assuming otherwise would show the selected
         side as "no approved version yet" for the length of that read. */
      setCatalog((c) => ({ ...c, approvedAvailable: req.left.kind === "approved" || req.right.kind === "approved" }));
      setLeftSource(req.left);
      setRightSource(req.right);
    };
    composer.on(EVENTS.UI_COMPARE_OPEN, open);
    return () => {
      composer.off(EVENTS.UI_COMPARE_OPEN, open);
    };
  }, [composer]);

  /* What each picker can offer. Read once per open: an approval or a publish
     landing while Compare is up is not worth a second round trip. A failed
     read leaves that source disabled rather than failing the view. */
  React.useEffect(() => {
    if (!request || !composer) return;
    let cancelled = false;
    const saved = (composer.versions?.getVersions() ?? []).map((v) => ({ id: v.id, name: v.name }));
    setCatalog((c) => ({ ...c, saved }));
    void fetchApprovedSnapshot()
      .then((pages) => !cancelled && setCatalog((c) => ({ ...c, approvedAvailable: pages != null })))
      .catch(() => {});
    if (siteId) {
      void fetchPublishHistory(siteId)
        .then((rows) => !cancelled && setCatalog((c) => ({ ...c, published: rows.map((r) => ({ id: r.id, version: r.version })) })))
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [request, composer, siteId]);

  const load = React.useCallback(
    (source: CompareSource, set: (s: Side) => void) => {
      if (!composer) return () => {};
      let cancelled = false;
      set({ status: "loading" });
      loadSourcePages(composer, source)
        .then((pages) => !cancelled && set({ status: "ready", pages }))
        .catch(() => !cancelled && set({ status: "error" }));
      return () => {
        cancelled = true;
      };
    },
    [composer],
  );

  const publishedPair = left.kind === "published" && right.kind === "published";
  const leftKey = sourceKey(left);
  const rightKey = sourceKey(right);
  const [retry, setRetry] = React.useState(0);
  /* Keyed by the source KEY so a re-render with an equal source does not
     re-export the whole site. */
  React.useEffect(() => {
    if (!request || publishedPair) return;
    return load(sourceFromKey(leftKey), setLeftSide);
  }, [request, publishedPair, leftKey, load, retry]);
  React.useEffect(() => {
    if (!request || publishedPair) return;
    return load(sourceFromKey(rightKey), setRightSide);
  }, [request, publishedPair, rightKey, load, retry]);

  if (!request) return null;
  const close = () => setRequest(null);

  const options = sourceOptions(catalog);
  const picker = (value: CompareSource, onPick: (s: CompareSource) => void, label: string) => (
    <Select
      sizing="sm"
      aria-label={label}
      value={sourceKey(value)}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onPick(sourceFromKey(e.target.value))}
      data-testid={label === "Compare from" ? "compare-source-left" : "compare-source-right"}
    >
      {/* The door may open on a source the catalog has not confirmed yet
          (an approval still being read); it stays selectable as itself. */}
      {options.some((o) => o.key === sourceKey(value)) ? null : (
        <option value={sourceKey(value)}>{sourceLabel(value, catalog)}</option>
      )}
      {options.map((o) => (
        <option key={o.key} value={o.key} disabled={o.disabled}>
          {o.label}
        </option>
      ))}
    </Select>
  );
  const pickLeft = (s: CompareSource) => {
    setLeftSource(s);
    setRightSource((r) => pairWith(s, r, catalog));
  };
  const pickRight = (s: CompareSource) => {
    setRightSource(s);
    setLeftSource((l) => pairWith(s, l, catalog));
  };
  const sources = (
    <span className="tw:flex tw:items-center tw:gap-2" data-testid="compare-sources">
      <span className={FROM} data-testid="compare-opened-from">Opened from {request.from}</span>
      {picker(left, pickLeft, "Compare from")}
      <span aria-hidden="true" className={FROM}>→</span>
      {picker(right, pickRight, "Compare to")}
    </span>
  );

  const bar = (
    <Toolbar className="tw:min-h-12 tw:bg-[var(--bk-bg-card)] tw:border-[var(--bk-gray-100)] tw:px-4">
      <span className={BAR_TITLE} id="compare-title">Compare</span>
      {sources}
      <ToolbarSpacer />
      <Button color="light" size="xs" onClick={close} className={CLOSE_BTN} data-testid="compare-close" aria-label="Close compare">
        <X size={14} aria-hidden="true" />
      </Button>
    </Toolbar>
  );

  let body: React.ReactNode;
  if (left.kind === "published" && right.kind === "published" && siteId) {
    body = (
      <>
        {bar}
        <div className="tw:flex-1 tw:min-h-0 tw:overflow-y-auto tw:p-4">
          <PublishDiffView
            siteId={siteId}
            from={{ id: left.jobId, version: left.version }}
            to={{ id: right.jobId, version: right.version }}
          />
        </div>
      </>
    );
  } else if (leftSide.status === "error" || rightSide.status === "error") {
    body = (
      <>
        {bar}
        <EmptyState
          className="tw:flex-1"
          icon={<AlertCircle size={24} aria-hidden="true" />}
          title="Couldn't load this comparison"
          body="One side didn't load. Try again, or pick another version."
          action={
            <Button color="light" size="xs" onClick={() => setRetry((n) => n + 1)}>
              Retry
            </Button>
          }
        />
      </>
    );
  } else if (leftSide.status === "loading") {
    /* The right side may keep rendering after the left is in (the per-side
       asymmetry ApprovedCompareView draws); the LEFT must be in first, because
       the view reads a null left as "no snapshot", not "not yet". */
    body = (
      <>
        {bar}
        <EmptyState className="tw:flex-1" icon={<Spinner size="lg" />} body={`Loading ${sourceLabel(left, catalog)}…`} />
      </>
    );
  } else {
    body = (
      <ApprovedCompareView
        approvedPages={leftSide.pages}
        currentPages={rightSide.status === "ready" ? rightSide.pages ?? [] : null}
        leftLabel={sourceLabel(left, catalog)}
        rightLabel={sourceLabel(right, catalog)}
        sources={sources}
        mode={mode}
        onModeChange={setMode}
        onBack={close}
      />
    );
  }

  return (
    <OverlayMount open onClose={close} labelledBy="compare-title">
      <div className={SURFACE} data-testid="compare-overlay">
        {body}
      </div>
    </OverlayMount>
  );
};

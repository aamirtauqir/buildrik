/**
 * ApprovedCompareView (review contract §3) — what changed since the client
 * approved. Left = the page frozen at approval (`ReviewRequest.snapshotPages`,
 * renders instantly). Right = the site as it is now (live export, may still be
 * rendering — the per-side loading asymmetry §3 calls for).
 *
 * Both sides render in a fully-sandboxed iframe (`sandbox=""`, no scripts, no
 * same-origin): the snapshot is arbitrary site HTML and must never execute in
 * the editor's origin — the same XSS discipline as the M2 review page.
 *
 * The change list uses `compareApprovedToCurrent`. Every kind carries an icon
 * AND a text label AND a plain-text detail — color is never the sole encoding
 * (design codex #6). A round with no stored snapshot shows an explicit state,
 * not an error.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  CheckCircle2,
  File,
  GripVertical,
  History,
  Minus,
  Palette,
  Plus,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { Select, Slider } from "@/editor/ui";
import {
  compareApprovedToCurrent,
  type ComparePage,
  type CompareChange,
  type CompareChangeKind,
} from "@/shared/utils/html";
import { Button } from "flowbite-react";

export interface ApprovedCompareViewProps {
  /** Pages frozen at approval. `null` = this round has no stored snapshot. */
  approvedPages: ComparePage[] | null;
  /** Live-exported pages. `null` = still rendering (per-side loading asymmetry). */
  currentPages: ComparePage[] | null;
  onRefreshCurrent?: () => void;
}

type Mode = "split" | "overlay" | "list";

const KIND: Record<CompareChangeKind, { icon: LucideIcon; color: string; label: string }> = {
  content: { icon: File, color: "var(--bk-accent)", label: "Content" },
  style: { icon: Palette, color: "var(--bk-warning-text)", label: "Style" },
  added: { icon: Plus, color: "var(--bk-success)", label: "Added" },
  removed: { icon: Minus, color: "var(--bk-error)", label: "Removed" },
  moved: { icon: GripVertical, color: "var(--bk-ink-soft)", label: "Moved" },
};

const KIND_ORDER: CompareChangeKind[] = ["added", "removed", "moved", "content", "style"];

const S: Record<string, React.CSSProperties> = {
  body: { display: "flex", flexDirection: "column", height: "100%", minHeight: 0 },
  toolbar: { display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderBottom: "1px solid var(--bk-border)", flexWrap: "wrap" },
  spacer: { flex: 1 },
  stage: { flex: 1, minHeight: 0, display: "flex", gap: 8, padding: 8, overflow: "hidden" },
  pane: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", border: "1px solid var(--bk-border)", borderRadius: "var(--bk-radius-lg)", overflow: "hidden", background: "var(--bk-bg-panel)" },
  paneLabel: { fontSize: 11, fontWeight: 600, color: "var(--bk-ink-muted)", padding: "6px 10px", borderBottom: "1px solid var(--bk-border)", textTransform: "uppercase", letterSpacing: "0.04em" },
  frame: { flex: 1, minHeight: 0, border: "none", width: "100%", background: "#fff" },
  overlayWrap: { flex: 1, position: "relative", minHeight: 0 },
  overlayFrame: { position: "absolute", inset: 0, border: "none", width: "100%", height: "100%", background: "#fff" },
  placeholder: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--bk-ink-muted)", fontSize: 13, textAlign: "center", padding: 24 },
  legend: { display: "flex", gap: 12, flexWrap: "wrap", padding: "6px 12px", borderTop: "1px solid var(--bk-border)", fontSize: 11, color: "var(--bk-ink-muted)" },
  legendItem: { display: "flex", alignItems: "center", gap: 4 },
  listScroll: { flex: 1, minHeight: 0, overflowY: "auto", padding: "4px 12px 12px" },
  listRow: { display: "flex", gap: 8, padding: "8px 10px", border: "1px solid var(--bk-border)", borderRadius: "var(--bk-radius-lg)", marginBottom: 6, alignItems: "flex-start" },
  listMain: { display: "flex", flexDirection: "column", gap: 2, minWidth: 0 },
  listLabel: { fontSize: 13, color: "var(--bk-ink)", fontWeight: 500 },
  listDetail: { fontSize: 12, color: "var(--bk-ink-muted)" },
  kindTag: { fontSize: 11, fontWeight: 600, flexShrink: 0, display: "flex", alignItems: "center", gap: 3 },
  center: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 28, textAlign: "center", color: "var(--bk-ink-muted)" },
  centerTitle: { fontSize: 14, fontWeight: 600, color: "var(--bk-ink)" },
  summary: { fontSize: 12, color: "var(--bk-ink-muted)", padding: "6px 12px" },
};

function findPage(pages: ComparePage[] | null, path: string): ComparePage | undefined {
  return pages?.find((p) => p.path === path);
}

function Frame({ page, style }: { page: ComparePage | undefined; style: React.CSSProperties }) {
  if (!page) {
    return <div style={S.placeholder}>Not present on this side</div>;
  }
  return <iframe title="compare" sandbox="" srcDoc={page.html} style={style} />;
}

export const ApprovedCompareView: React.FC<ApprovedCompareViewProps> = ({
  approvedPages,
  currentPages,
  onRefreshCurrent,
}) => {
  const [mode, setMode] = React.useState<Mode>("split");
  const [overlayOpacity, setOverlayOpacity] = React.useState(0.5);

  const paths = React.useMemo(() => {
    const set = new Set<string>();
    (approvedPages ?? []).forEach((p) => set.add(p.path));
    (currentPages ?? []).forEach((p) => set.add(p.path));
    return [...set];
  }, [approvedPages, currentPages]);

  const [activePath, setActivePath] = React.useState<string>("");
  const path = activePath && paths.includes(activePath) ? activePath : paths[0] ?? "";

  const result = React.useMemo(
    () => compareApprovedToCurrent(approvedPages, currentPages ?? []),
    [approvedPages, currentPages],
  );

  // No stored snapshot — an explicit state, not an error (§3).
  if (approvedPages == null) {
    return (
      <div style={S.body}>
        <div style={S.center}>
          <History size={24} aria-hidden="true" />
          <div style={S.centerTitle}>No approved snapshot for this round</div>
          <div style={S.summary}>
            This review was sent before snapshots were captured, so there's nothing to compare
            against. The next round you send will support Compare.
          </div>
        </div>
      </div>
    );
  }

  const currentReady = currentPages != null;
  const approvedPage = findPage(approvedPages, path);
  const currentPage = findPage(currentPages, path);

  const changesForPage = result.changes
    .filter((c) => c.page === path)
    .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));

  return (
    <div style={S.body}>
      <div style={S.toolbar}>
        {(["split", "overlay", "list"] as Mode[]).map((m) => (
          <Button
            key={m}
            color={mode === m ? undefined : "light"}
            size="xs"
            onClick={() => setMode(m)}
            className={mode === m ? undefined : "tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"}
          >
            {m === "split" ? "Side by side" : m === "overlay" ? "Overlay" : "List"}
          </Button>
        ))}
        <div style={S.spacer} />
        {paths.length > 1 && (
          <Select
            value={path}
            onChange={(e) => setActivePath(e.target.value)}
            aria-label="Page to compare"
          >
            {paths.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
        )}
        {onRefreshCurrent && (
          <Button color="light" size="xs" onClick={onRefreshCurrent} title="Re-render the current site" aria-label="Re-render the current site" className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
            <RefreshCw size={14} aria-hidden="true" />
          </Button>
        )}
      </div>

      {mode === "list" ? (
        <>
          <div style={S.summary}>
            {result.changes.length === 0
              ? "No changes since approval."
              : KIND_ORDER.filter((k) => result.counts[k] > 0)
                  .map((k) => `${result.counts[k]} ${KIND[k].label.toLowerCase()}`)
                  .join(" · ")}
          </div>
          <div style={S.listScroll}>
            {changesForPage.length === 0 ? (
              <div style={S.center}>
                <CheckCircle2 size={24} aria-hidden="true" />
                <div style={S.centerTitle}>This page matches the approved version</div>
              </div>
            ) : (
              changesForPage.map((c: CompareChange, i) => {
                const KindIcon = KIND[c.kind].icon;
                return (
                <div key={`${c.key}-${c.kind}-${i}`} style={S.listRow}>
                  <span style={{ ...S.kindTag, color: KIND[c.kind].color }}>
                    <KindIcon size={14} aria-hidden="true" />
                    {KIND[c.kind].label}
                  </span>
                  <div style={S.listMain}>
                    <span style={S.listLabel}>{c.label}</span>
                    <span style={S.listDetail}>{c.detail}</span>
                  </div>
                </div>
                );
              })
            )}
          </div>
        </>
      ) : mode === "overlay" ? (
        <>
          <div style={S.stage}>
            <div style={S.overlayWrap}>
              <Frame page={approvedPage} style={S.overlayFrame} />
              {currentReady ? (
                <div style={{ ...S.overlayFrame, opacity: overlayOpacity }}>
                  <Frame page={currentPage} style={S.overlayFrame} />
                </div>
              ) : (
                <div style={{ ...S.placeholder, position: "absolute", inset: 0 }}>Rendering current…</div>
              )}
            </div>
          </div>
          <div style={S.toolbar}>
            <span style={S.listDetail}>Approved</span>
            <div style={{ flex: 1 }}>
              <Slider
                value={Math.round(overlayOpacity * 100)}
                onChange={(v) => setOverlayOpacity(v / 100)}
                min={0}
                max={100}
                step={2}
                label="Overlay opacity"
                withField={false}
              />
            </div>
            <span style={S.listDetail}>Current</span>
          </div>
        </>
      ) : (
        <div style={S.stage}>
          <div style={S.pane}>
            <div style={S.paneLabel}>Approved</div>
            <Frame page={approvedPage} style={S.frame} />
          </div>
          <div style={S.pane}>
            <div style={S.paneLabel}>Current</div>
            {currentReady ? (
              <Frame page={currentPage} style={S.frame} />
            ) : (
              <div style={S.placeholder}>Rendering current…</div>
            )}
          </div>
        </div>
      )}

      <div style={S.legend}>
        {KIND_ORDER.map((k) => {
          const KindIcon = KIND[k].icon;
          return (
            <span key={k} style={S.legendItem}>
              <span style={{ color: KIND[k].color, display: "inline-flex" }}>
                <KindIcon size={14} aria-hidden="true" />
              </span>
              {KIND[k].label}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default ApprovedCompareView;

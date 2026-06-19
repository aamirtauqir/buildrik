/**
 * ReachScopeStrip (40/41/59 — the 3-reach model).
 *
 * The redesign's central editor concept: a style edit has a *reach*. The
 * inspector's per-control edits always target THIS element (the safe default,
 * unchanged). This strip surfaces the other two reaches explicitly so an edit
 * never silently widens beyond the selected item:
 *
 *   - This element     — the default (what the inspector controls already do)
 *   - All <type>s · N   — propagate this element's styles to every element of the
 *                         same type, behind a blast-radius confirm (ReachGuard)
 *   - Whole site        — site-wide colors & fonts live in the Styles tab
 *
 * "All like this" uses existing per-element engine APIs (getAllElements +
 * setStyle) inside one transaction, so it composes with history/undo and needs
 * no class/token engine change. Layout styles are inline (self-contained, no
 * orphan-CSS); the actions are vibcoder Buttons (Gate-24 safe).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/shared/vibcoder/Button";
import type { Composer } from "../../../engine";

interface ReachScopeStripProps {
  composer: Composer | null | undefined;
  selectedElement: { id: string; type: string };
}

export function ReachScopeStrip({ composer, selectedElement }: ReachScopeStripProps) {
  const [confirming, setConfirming] = React.useState(false);
  const [siteHint, setSiteHint] = React.useState(false);

  // Count same-type peers (excludes the selected element). Recomputed per render
  // off the live element set — cheap relative to a style edit.
  const peers = React.useMemo(() => {
    if (!composer?.elements?.getAllElements) return [];
    try {
      return composer.elements
        .getAllElements()
        .filter((e) => e.getType?.() === selectedElement.type && e.getId?.() !== selectedElement.id);
    } catch {
      return [];
    }
  }, [composer, selectedElement.id, selectedElement.type]);

  const typeLabel = selectedElement.type || "element";

  const propagate = () => {
    const src = composer?.elements?.getElement?.(selectedElement.id);
    if (!src || peers.length === 0) { setConfirming(false); return; }
    const styles = src.getStyles?.() ?? {};
    composer?.beginTransaction?.("reach-all-like-this");
    try {
      for (const peer of peers) {
        for (const [prop, value] of Object.entries(styles)) {
          peer.setStyle?.(prop, value as string);
        }
      }
    } finally {
      composer?.endTransaction?.();
    }
    setConfirming(false);
  };

  const activePill: React.CSSProperties = {
    fontSize: 11,
    padding: "3px 8px",
    borderRadius: 6,
    background: "var(--bd-accent, #2D6DFF)",
    color: "#fff",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--bd-border, #e5e7eb)" }}>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--bd-text-muted, #9ca3af)", marginBottom: 5 }}>
        Reach
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <span style={activePill}>This element</span>
        <Button
          variant="ghost"
          size="sm"
          disabled={peers.length === 0}
          onClick={() => setConfirming(true)}
          title={peers.length === 0 ? `No other ${typeLabel}s on this page` : `Apply this element's styles to all ${peers.length} ${typeLabel}s`}
        >
          All {typeLabel}s · {peers.length}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSiteHint((s) => !s)}
          title="Site-wide colors & fonts live in the Styles tab"
        >
          Whole site
        </Button>
      </div>

      {siteHint && (
        <p style={{ margin: "8px 0 0", fontSize: 11, color: "var(--bd-text-muted, #6b7280)" }}>
          Site-wide colors, fonts &amp; spacing live in the <strong>Styles</strong> tab — change them once, everywhere updates.
        </p>
      )}

      {confirming && (
        <div style={{ marginTop: 8, padding: 8, borderRadius: 6, background: "var(--bd-surface-2, #f9fafb)", border: "1px solid var(--bd-border, #e5e7eb)" }}>
          <p style={{ margin: "0 0 6px", fontSize: 11, color: "var(--bd-text, #374151)" }}>
            Apply this element&apos;s styles to all <strong>{peers.length}</strong> {typeLabel}s? This changes more than the selected item.
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            <Button variant="primary" size="sm" onClick={propagate}>Apply to {peers.length}</Button>
            <Button variant="bare" size="sm" onClick={() => setConfirming(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

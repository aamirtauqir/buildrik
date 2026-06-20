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
  // "N other paragraph(s)" — pluralize only the noun, and always say "other" so
  // it's clear the selected item isn't being re-counted (peers already excludes it).
  const othersLabel = `${peers.length} other ${peers.length === 1 ? typeLabel : `${typeLabel}s`}`;

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

  const cardBase: React.CSSProperties = {
    flex: "1 1 0",
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 1,
    padding: "6px 8px",
    height: "auto",
    borderRadius: 6,
    border: "1px solid var(--bd-border, #e5e7eb)",
    background: "transparent",
    textAlign: "left",
    lineHeight: 1.2,
  };
  const cardActive: React.CSSProperties = {
    ...cardBase,
    borderColor: "var(--bd-accent, #2D6DFF)",
    background: "var(--bd-accent-soft, #EFF4FF)",
  };
  const cardTop: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: "var(--bd-text, #374151)" };
  const cardSub: React.CSSProperties = { fontSize: 10, color: "var(--bd-text-muted, #9ca3af)" };

  return (
    <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--bd-border, #e5e7eb)" }}>
      <div style={{ display: "flex", gap: 6 }}>
        <Button variant="bare" size="sm" style={cardActive} title="Just this element">
          <span style={{ ...cardTop, color: "var(--bd-accent, #2D6DFF)" }}>This item</span>
          <span style={cardSub}>just here</span>
        </Button>
        <Button
          variant="bare"
          size="sm"
          style={cardBase}
          disabled={peers.length === 0}
          onClick={() => setConfirming(true)}
          title={peers.length === 0 ? `No other ${typeLabel}s on this page` : `Apply to ${othersLabel}`}
        >
          <span style={cardTop}>All like this</span>
          <span style={cardSub}>{peers.length} {peers.length === 1 ? "instance" : "instances"}</span>
        </Button>
        <Button variant="bare" size="sm" style={cardBase} onClick={() => setSiteHint((s) => !s)} title="Site-wide colors & fonts">
          <span style={cardTop}>Whole site</span>
          <span style={cardSub}>every page</span>
        </Button>
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 10, color: "var(--bd-text-muted, #9ca3af)" }}>
        <strong style={{ color: "var(--bd-text-muted, #6b7280)" }}>Just this</strong> by default — nothing else moves. Widen only to change all of them.
      </p>

      {siteHint && (
        <p style={{ margin: "8px 0 0", fontSize: 11, color: "var(--bd-text-muted, #6b7280)" }}>
          Site-wide colors, fonts &amp; spacing live in the <strong>Styles</strong> tab — change them once, everywhere updates.
        </p>
      )}

      {confirming && (
        <div style={{ marginTop: 8, padding: 8, borderRadius: 6, background: "var(--bd-surface-2, #f9fafb)", border: "1px solid var(--bd-border, #e5e7eb)" }}>
          <p style={{ margin: "0 0 6px", fontSize: 11, color: "var(--bd-text, #374151)" }}>
            Apply this element&apos;s styles to the <strong>{othersLabel}</strong> on this page? This changes more than the selected item.
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

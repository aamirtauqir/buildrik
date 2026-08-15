/**
 * ScopeDropdown (40/41/59 — the 3-reach model, compact form).
 *
 * The redesign's central editor concept: a style edit has a *reach*. The
 * inspector's per-control edits always target THIS element (the safe default).
 * This dropdown surfaces the other two reaches explicitly so an edit never
 * silently widens beyond the selected item:
 *
 *   - This item      — the default (what the inspector controls already do)
 *   - All like this  — propagate this element's styles to every same-type peer,
 *                      behind a blast-radius confirm
 *   - Whole site     — site-wide colors & fonts live in the Styles tab
 *
 * Compact `This ▾` pill matching Figma node 32-2 (design-system Foundations):
 * scope sits in the breakpoint/state pill row, not as a full-width card block.
 * The three-card `ReachScopeStrip` it replaced ate ~150px of vertical space and
 * diverged hard from the design; this is one pill that opens the same choices.
 *
 * "All like this" uses existing per-element engine APIs (getAllElements +
 * setStyle) inside one transaction, so it composes with history/undo and needs
 * no class/token engine change.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ChevronDown } from "lucide-react";
import type { Composer } from "../../../engine";
import { Button } from "@/editor/chrome-ui";

interface ScopeDropdownProps {
  composer: Composer | null | undefined;
  selectedElement: { id: string; type: string };
  /** Board 189:2 — selecting Whole site switches the inspector into the
   *  site-wide banner state (site styles live in the Brand panel). */
  onWholeSite?: () => void;
  /** Board 160:412 — the panel says what a reach beyond "this" just did. */
  onAppliedToPeers?: (count: number) => void;
}

export function ScopeDropdown({
  composer,
  selectedElement,
  onWholeSite,
  onAppliedToPeers,
}: ScopeDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

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
  const othersLabel = `${peers.length} other ${peers.length === 1 ? typeLabel : `${typeLabel}s`}`;

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirming(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

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
    setOpen(false);
    onAppliedToPeers?.(peers.length);
  };

  const optionRow: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 1,
    width: "100%",
    padding: "6px 8px",
    background: "transparent",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    textAlign: "left",
    lineHeight: 1.2,
  };
  const optTop: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: "var(--bk-ink)" };
  const optSub: React.CSSProperties = { fontSize: 10, color: "var(--bk-ink-muted)" };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <Button
        type="button"
        className="bdi-bpr-pill"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Edit reach: this item"
        style={{ border: "none", cursor: "pointer" }}
      >
        <span>This</span>
        <ChevronDown size={10} aria-hidden="true" style={{ opacity: 0.7 }} />
      </Button>
      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 200,
            background: "var(--bk-bg-card)",
            border: "1px solid var(--bk-border)",
            borderRadius: 4,
            padding: 4,
            minWidth: 200,
            boxShadow: "var(--bk-shadow-drag)",
          }}
        >
          <Button
            color="light"
            style={{ ...optionRow, background: "var(--bk-accent-tint)" }}
            title="Just this element" className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
          >
            <span style={{ ...optTop, color: "var(--bk-accent)" }}>This item</span>
            <span style={optSub}>just here — the default</span>
          </Button>
          <Button
            color="light"
            style={optionRow}
            disabled={peers.length === 0}
            onClick={() => setConfirming(true)}
            title={peers.length === 0 ? `No other ${typeLabel}s on this page` : `Apply to ${othersLabel}`} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
          >
            <span style={optTop}>All like this</span>
            <span style={optSub}>{peers.length} {peers.length === 1 ? "instance" : "instances"}</span>
          </Button>
          <Button
            color="light"
            style={optionRow}
            title="Site-wide colors & fonts live in the Styles tab"
            onClick={() => {
              setOpen(false);
              onWholeSite?.();
            }} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
          >
            <span style={optTop}>Whole site</span>
            <span style={optSub}>colors & fonts — Styles tab</span>
          </Button>

          {confirming && (
            <div style={{ margin: 4, padding: 8, borderRadius: 4, background: "var(--bk-bg-subtle)", border: "1px solid var(--bk-border)" }}>
              <p style={{ margin: "0 0 6px", fontSize: 11, color: "var(--bk-ink)" }}>
                Apply this element&apos;s styles to the <strong>{othersLabel}</strong> on this page?
              </p>
              <div style={{ display: "flex", gap: 6 }}>
                <Button size="xs" onClick={propagate}>Apply to {peers.length}</Button>
                <Button color="light" size="xs" onClick={() => setConfirming(false)} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

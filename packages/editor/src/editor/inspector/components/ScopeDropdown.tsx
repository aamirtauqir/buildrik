/**
 * ScopeDropdown (40/41/59 — the 3-reach model, compact form).
 *
 * The redesign's central editor concept: a style edit has a *reach*. The
 * inspector's per-control edits always target THIS element (the safe default).
 * This dropdown surfaces the other two reaches explicitly so an edit never
 * silently widens beyond the selected item:
 *
 *   - This item      — the default (what the inspector controls already do)
 *   - All like this  — a MODE: every edit you make from here also lands on
 *                      every same-type peer, until you leave it
 *   - Whole site     — site-wide colors & fonts live in the Styles tab
 *
 * Compact `This ▾` pill matching Figma node 32-2 (design-system Foundations):
 * scope sits in the breakpoint/state pill row, not as a full-width card block.
 * The three-card `ReachScopeStrip` it replaced ate ~150px of vertical space and
 * diverged hard from the design; this is one pill that opens the same choices.
 *
 * "All like this" was a one-shot until 2026-08-16: picking it copied THIS
 * element's whole style map onto every peer and closed. That is a much larger
 * thing than the label promises — a peer with its own padding, colour and size
 * lost all three — and it is not what board 160:412 draws, which is a banner
 * that stays up while you work. It is the mode now; the fan-out happens in
 * useStyleHandlers, per edit, so only the properties you actually touch move.
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
  /** Whether the "All like this" mode is on. Owned by the inspector, which
   *  also owns the banner and the style handlers the mode changes. */
  reachAll?: boolean;
  onReachAllChange?: (on: boolean) => void;
}

export function ScopeDropdown({
  composer,
  selectedElement,
  onWholeSite,
  reachAll = false,
  onReachAllChange,
}: ScopeDropdownProps) {
  const [open, setOpen] = React.useState(false);
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
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

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
        className="bdi-bpr-pill tw:bg-[var(--bk-bg-card)]"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={reachAll ? "Edit reach: all like this" : "Edit reach: this item"}
        style={{ border: "none", cursor: "pointer" }}
      >
        {/* The pill names the reach it is IN. Board 160:412 draws it reading
            "This" beside a banner that says twelve buttons are being edited —
            the two cannot both be right, and a control that misreports its own
            state is the worse half to keep. */}
        <span>{reachAll ? "All like this" : "This"}</span>
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
            style={reachAll ? optionRow : { ...optionRow, background: "var(--bk-accent-tint)" }}
            title="Just this element"
            onClick={() => {
              onReachAllChange?.(false);
              setOpen(false);
            }}
            className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]"
          >
            <span style={reachAll ? optTop : { ...optTop, color: "var(--bk-accent)" }}>This item</span>
            <span style={optSub}>just here — the default</span>
          </Button>
          <Button
            color="light"
            style={reachAll ? { ...optionRow, background: "var(--bk-accent-tint)" } : optionRow}
            disabled={peers.length === 0}
            onClick={() => {
              onReachAllChange?.(true);
              setOpen(false);
            }}
            title={peers.length === 0 ? `No other ${typeLabel}s on this page` : `Every edit also goes to ${othersLabel}`}
            className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]"
          >
            <span style={reachAll ? { ...optTop, color: "var(--bk-accent)" } : optTop}>All like this</span>
            <span style={optSub}>
              {peers.length === 0
                ? `no other ${typeLabel}s here`
                : `edits also go to ${othersLabel}`}
            </span>
          </Button>
          <Button
            color="light"
            style={optionRow}
            title="Site-wide colors & fonts live in the Styles tab"
            onClick={() => {
              setOpen(false);
              onWholeSite?.();
            }}
            className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]"
          >
            <span style={optTop}>Whole site</span>
            <span style={optSub}>colors & fonts — Styles tab</span>
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * TipsFooter — board 137:43 "TipsFooter": a single 40-tall strip on the accent
 * tint, not a card. "💡 Tip n/N" + one-line tip body + ‹ › ✕. The ✕ hides
 * tips (scope lives in useBuildTab); no collapse state — board 138:244 shows
 * dismiss removes the band entirely, nothing collapsed remains. The strip
 * stays mounted during search (board 138:53 draws it under the results).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { TIPS } from "../catalog/tips";
import { Button } from "@/editor/chrome-ui";

export interface TipsFooterProps {
  tipIdx: number;
  onPrev: () => void;
  onNext: () => void;
  onDotClick: (i: number) => void;
  dismissed?: boolean;
  onDismiss?: () => void;
}

// ── Styles (token-bound) ─────────────────────────────────────────────────────

const strip: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  height: "var(--bk-space-40)",
  padding: "0 12px 0 16px",
  background: "var(--bk-accent-tint)",
  color: "var(--bk-accent-text)",
  fontFamily: "var(--bk-font-ui)",
  fontSize: "var(--bk-text-12)",
  lineHeight: "18px",
};

// Board text style ui/12 — Inter Regular, no bold in the strip.
const counter: React.CSSProperties = {
  fontWeight: 400,
  flexShrink: 0,
  fontVariantNumeric: "tabular-nums",
};

const spacer: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const nav: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 2,
  flexShrink: 0,
};

const arr: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 20,
  height: 20,
  minHeight: 20,
  padding: 0,
  border: "none",
  borderRadius: 4,
  background: "transparent",
  color: "var(--bk-accent-text)",
  cursor: "pointer",
  lineHeight: 1,
};

const hoverIn = (e: React.MouseEvent<HTMLElement>) => {
  e.currentTarget.style.background = "var(--bk-accent-subtle)";
};
const hoverOut = (e: React.MouseEvent<HTMLElement>) => {
  e.currentTarget.style.background = "transparent";
};

// ── Component ────────────────────────────────────────────────────────────────

export const TipsFooter: React.FC<TipsFooterProps> = ({
  tipIdx,
  onPrev,
  onNext,
  dismissed = false,
  onDismiss,
}) => {
  if (dismissed) return null;
  const tip = TIPS[tipIdx];

  return (
    // Board 137:43 (and every Insert state board): the strip draws ONLY
    // "💡 Tip n/N" + ‹ › ✕ — no tip body text. The body rides on title so
    // hover still tells you what the tip says.
    <div style={strip} role="note" aria-label="Tips" title={`${tip.bold}${tip.body}`}>
      <span aria-hidden="true">💡</span>
      <span style={counter}>
        Tip {tipIdx + 1}/{TIPS.length}
      </span>
      <span style={spacer} />
      <span style={nav}>
        <Button type="button" style={arr} onClick={onPrev} onMouseEnter={hoverIn} onMouseLeave={hoverOut} aria-label="Previous tip">
          <ChevronLeft size={12} />
        </Button>
        <Button type="button" style={arr} onClick={onNext} onMouseEnter={hoverIn} onMouseLeave={hoverOut} aria-label="Next tip">
          <ChevronRight size={12} />
        </Button>
        {onDismiss && (
          <Button
            type="button"
            style={arr}
            onClick={onDismiss}
            onMouseEnter={hoverIn}
            onMouseLeave={hoverOut}
            aria-label="Hide tips for this session"
            title="Hide tips for this session — bring them back from Help"
          >
            <X size={12} />
          </Button>
        )}
      </span>
    </div>
  );
};

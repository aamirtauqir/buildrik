/**
 * TipsFooter — board 137:43 "TipsFooter": a single 40-tall strip on the accent
 * tint, not a card. "💡 Tip n/N" + one-line tip body + ‹ › ✕. The ✕ hides
 * tips for the session (scope lives in useBuildTab); no collapse state — the
 * board has none, dismiss IS the collapse. Search mode unmounts it entirely
 * (BuildTab hides panel-bottom while searching).
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
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
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

const counter: React.CSSProperties = {
  fontWeight: 600,
  flexShrink: 0,
  fontVariantNumeric: "tabular-nums",
};

const body: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
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
    <div style={strip} role="note" aria-label="Tips">
      <span aria-hidden="true">💡</span>
      <span style={counter}>
        Tip {tipIdx + 1}/{TIPS.length}
      </span>
      <span style={body} title={`${tip.bold}${tip.body}`}>
        <strong>{tip.bold}</strong>
        {tip.body}
      </span>
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

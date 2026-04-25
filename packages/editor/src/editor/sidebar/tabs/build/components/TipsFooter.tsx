/**
 * TipsFooter — PRO TIPS carousel at bottom of Add panel.
 *
 * Rewritten against the `--bd-*` alias tokens from
 * src/themes/design-system/bd-aliases.css. All colors, spacing, type come from tokens
 * (no raw hex, no class dependency). Collapsed = 1-line header; expanded =
 * header + tip card + dot pagination.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Lightbulb, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { TIPS } from "../catalog/tips";

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

const wrap: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontFamily: "var(--bd-font)",
};

const header: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  minHeight: 20,
};

const label: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontFamily: "var(--bd-font)",
  fontSize: "var(--bd-text-2xs)",
  fontWeight: 600,
  letterSpacing: "var(--bd-track-widest)",
  textTransform: "uppercase",
  color: "var(--bd-fg-muted)",
  flexShrink: 0,
};

const counter: React.CSSProperties = {
  fontFamily: "var(--bd-mono)",
  fontSize: "var(--bd-text-xs)",
  fontWeight: 500,
  color: "var(--bd-fg-muted)",
  marginLeft: 8,
  fontVariantNumeric: "tabular-nums",
};

const nav: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 2,
  marginLeft: "auto",
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
  color: "var(--bd-fg-muted)",
  cursor: "pointer",
  lineHeight: 1,
  transition: "background 120ms, color 120ms",
};

const card: React.CSSProperties = {
  fontFamily: "var(--bd-font)",
  fontSize: "var(--bd-text-sm-plus)",
  fontWeight: 500,
  lineHeight: "var(--bd-leading-normal)",
  color: "var(--bd-fg-secondary)",
  textAlign: "center",
};

const cardBold: React.CSSProperties = {
  color: "var(--bd-fg-primary)",
  fontWeight: 600,
  marginRight: 4,
};

const dots: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
  paddingTop: 2,
};

const dot = (active: boolean): React.CSSProperties => ({
  width: 5,
  height: 5,
  minHeight: 5,
  padding: 0,
  border: "none",
  borderRadius: "var(--buildrick-radius-full)",
  background: active ? "var(--bd-accent)" : "var(--bd-border-medium)",
  cursor: "pointer",
  transform: active ? "scale(1.1)" : "none",
  transition: "background 120ms, transform 120ms",
});

// Simple hover-bg via inline handlers since we're avoiding new CSS classes.
const hoverIn = (e: React.MouseEvent<HTMLElement>) => {
  e.currentTarget.style.background = "var(--bd-bg-subtle)";
  e.currentTarget.style.color = "var(--bd-fg-primary)";
};
const hoverOut = (e: React.MouseEvent<HTMLElement>) => {
  e.currentTarget.style.background = "transparent";
  e.currentTarget.style.color = "var(--bd-fg-muted)";
};

// ── Component ────────────────────────────────────────────────────────────────

export const TipsFooter: React.FC<TipsFooterProps> = ({
  tipIdx,
  onPrev,
  onNext,
  onDotClick,
  dismissed = false,
  onDismiss,
  collapsed = false,
  onToggleCollapsed,
}) => {
  if (dismissed) return null;
  const tip = TIPS[tipIdx];

  if (collapsed) {
    return (
      <div
        style={{ ...header, cursor: "pointer" }}
        onClick={onToggleCollapsed}
        role="button"
        tabIndex={0}
        aria-expanded={false}
        aria-label="Expand Pro Tips"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleCollapsed?.();
          }
        }}
      >
        <span style={label}>
          <Lightbulb size={12} aria-hidden color="var(--bd-accent)" />
          Pro tips
        </span>
        <span style={counter}>
          {tipIdx + 1} / {TIPS.length}
        </span>
        <span style={{ ...arr, marginLeft: "auto" }} aria-hidden="true">
          <ChevronUp size={12} />
        </span>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={header}>
        <span style={label}>
          <Lightbulb size={12} aria-hidden color="var(--bd-accent)" />
          Pro tips
        </span>
        <span style={counter}>
          {tipIdx + 1} / {TIPS.length}
        </span>
        <div style={nav}>
          <button
            type="button"
            style={arr}
            onClick={onPrev}
            onMouseEnter={hoverIn}
            onMouseLeave={hoverOut}
            aria-label="Previous tip"
          >
            <ChevronLeft size={12} />
          </button>
          <button
            type="button"
            style={arr}
            onClick={onNext}
            onMouseEnter={hoverIn}
            onMouseLeave={hoverOut}
            aria-label="Next tip"
          >
            <ChevronRight size={12} />
          </button>
          {onToggleCollapsed && (
            <button
              type="button"
              style={arr}
              onClick={onToggleCollapsed}
              onMouseEnter={hoverIn}
              onMouseLeave={hoverOut}
              aria-label="Collapse tips"
              aria-expanded={true}
            >
              <ChevronDown size={12} />
            </button>
          )}
        </div>
      </div>
      <div style={card}>
        <strong style={cardBold}>{tip.bold}</strong>
        {tip.body}
      </div>
      <div style={dots}>
        {TIPS.map((_, i) => (
          <button
            key={i}
            type="button"
            style={dot(i === tipIdx)}
            onClick={() => onDotClick(i)}
            aria-label={`Tip ${i + 1}`}
            aria-current={i === tipIdx ? "true" : undefined}
          />
        ))}
      </div>
    </div>
  );
};

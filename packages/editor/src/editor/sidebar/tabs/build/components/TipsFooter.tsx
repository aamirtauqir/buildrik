/**
 * TipsFooter — PRO TIP carousel rendered at the bottom of the Build Tab
 * Supports collapsed state (28px header) vs expanded (full carousel).
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Lightbulb } from "lucide-react";
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
        className="bld-tips-hd"
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
        style={{ cursor: "pointer" }}
      >
        <span className="bld-tips-lbl"><Lightbulb size={12} aria-hidden /> Pro Tips</span>
        <span style={{ fontSize: 11, color: "var(--buildrick-text-muted)", fontFamily: "monospace" }}>
          {tipIdx + 1} / {TIPS.length}
        </span>
        <div className="bld-tips-nav">
          <span className="bld-tip-arr" aria-hidden="true">˅</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bld-tips-hd">
        <span className="bld-tips-lbl"><Lightbulb size={12} aria-hidden /> Pro Tips</span>
        <div className="bld-tips-nav">
          <button className="bld-tip-arr" onClick={onPrev} aria-label="Previous tip">
            ‹
          </button>
          <button className="bld-tip-arr" onClick={onNext} aria-label="Next tip">
            ›
          </button>
          {onToggleCollapsed && (
            <button
              className="bld-tip-arr"
              onClick={onToggleCollapsed}
              aria-label="Collapse tips"
              aria-expanded={true}
            >
              ˄
            </button>
          )}
          {onDismiss && (
            <button
              className="bld-tip-arr bld-tip-dismiss"
              onClick={onDismiss}
              aria-label="Dismiss tips"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      <div className="bld-tip-card">
        <strong>{tip.bold}</strong>
        {tip.body}
      </div>
      <div className="bld-tip-dots">
        {TIPS.map((_, i) => (
          <button
            key={i}
            className={`bld-tip-dot${i === tipIdx ? " on" : ""}`}
            onClick={() => onDotClick(i)}
            aria-label={`Tip ${i + 1}`}
          />
        ))}
      </div>
    </>
  );
};

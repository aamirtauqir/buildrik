/**
 * TipsFooter — PRO TIP carousel rendered at the bottom of the Build Tab
 * @license BSD-3-Clause
 */

import * as React from "react";
import { TIPS } from "../catalog/tips";

export interface TipsFooterProps {
  tipIdx: number;
  onPrev: () => void;
  onNext: () => void;
  onDotClick: (i: number) => void;
  dismissed?: boolean;
  onDismiss?: () => void;
}

export const TipsFooter: React.FC<TipsFooterProps> = ({
  tipIdx,
  onPrev,
  onNext,
  onDotClick,
  dismissed = false,
  onDismiss,
}) => {
  if (dismissed) return null;

  const tip = TIPS[tipIdx];

  return (
    <>
      <div className="bld-tips-hd">
        <span className="bld-tips-lbl">💡 Pro Tip</span>
        <div className="bld-tips-nav">
          <button className="bld-tip-arr" onClick={onPrev} aria-label="Previous tip">
            ‹
          </button>
          <button className="bld-tip-arr" onClick={onNext} aria-label="Next tip">
            ›
          </button>
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

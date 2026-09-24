/**
 * TemplateCard — one card of the full-canvas catalogue (board 4418:54134):
 * the template's actual page as a thumbnail, its name, "N sections" with a
 * Built-in / Saved chip, and a full-width "Preview template →" button. The
 * whole card opens the preview.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { getSectionCount, type TemplateItem } from "../templatesData";

export interface TemplateCardProps {
  template: TemplateItem;
  onClick: (id: string) => void;
  isSelected?: boolean;
  /** Most-recently applied to the current page — the APPLIED badge. */
  isApplied?: boolean;
}

/** The thumbnail frame is 226 wide on the board; the page renders at 1200. */
const THUMB_SCALE = 226 / 1200;

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onClick,
  isSelected = false,
  isApplied = false,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(template.id);
    }
  };

  const isPremium = template.status === "premium";
  const isSaved = template.category === "my-templates";
  const sections = getSectionCount(template.html);
  /* The page itself, scaled — "Actual template thumbnail" on the board. */
  const srcDoc = React.useMemo(
    () =>
      `<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;overflow:hidden}` +
      `.r{width:1200px;transform:scale(${THUMB_SCALE});transform-origin:top left}</style></head>` +
      `<body><div class="r">${template.html}</div></body></html>`,
    [template.html],
  );

  const className = ["tpl-card", isSelected && "tpl-card--selected", isApplied && "tpl-card--applied"]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className}
      role="option"
      aria-selected={isSelected}
      aria-label={`${template.name} template`}
      tabIndex={0}
      onClick={() => onClick(template.id)}
      onKeyDown={handleKeyDown}
    >
      <div className="tpl-card-thumb" aria-hidden="true">
        <iframe className="tpl-card-thumb-frame" title="" tabIndex={-1} sandbox="" srcDoc={srcDoc} />
        {isApplied && <span className="tpl-card-applied-badge">APPLIED</span>}
      </div>
      <div className="tpl-card-info">
        <div className="tpl-card-name">{template.name}</div>
        <div className="tpl-card-meta" data-testid={`tpl-card-meta-${template.id}`}>
          <span className="tpl-card-category">
            {sections} {sections === 1 ? "section" : "sections"}
          </span>
          <span className={`tpl-card-tag${isSaved ? " tpl-card-tag--saved" : ""}`}>
            {isSaved ? "Saved" : "Built-in"}
            {isPremium ? " · Pro" : ""}
          </span>
        </div>
      </div>
      <span className="tpl-card-cta" aria-hidden="true">
        Preview template →
      </span>
    </div>
  );
};

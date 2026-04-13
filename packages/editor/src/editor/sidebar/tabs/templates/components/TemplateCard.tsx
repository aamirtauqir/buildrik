/**
 * TemplateCard — single template tile in the Templates grid.
 *
 * Spec lives in __tests__/TemplateCard.test.tsx. Renders thumbnail (gradient
 * background + icon glyph), name, formatted category label, and reacts to
 * click + Enter for keyboard-driven selection.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { TemplateItem } from "../templatesData";

export interface TemplateCardProps {
  template: TemplateItem;
  onClick: (id: string) => void;
  isSelected?: boolean;
}

/** "landing-page" → "Landing page". */
function formatCategory(category: string | undefined): string {
  if (!category) return "";
  const spaced = category.replace(/[-_]+/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onClick,
  isSelected = false,
}) => {
  const handleActivate = React.useCallback(() => {
    onClick(template.id);
  }, [onClick, template.id]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleActivate();
      }
    },
    [handleActivate]
  );

  const className = `tpl-card${isSelected ? " tpl-card--selected" : ""}`;
  const categoryLabel = formatCategory(template.category);

  return (
    <div
      className={className}
      role="option"
      aria-selected={isSelected}
      aria-label={`${template.name} template`}
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
    >
      <div
        className="tpl-card-thumb"
        style={template.gradient ? { background: template.gradient } : undefined}
        aria-hidden="true"
      >
        <span className="tpl-card-thumb-icon">{template.icon}</span>
        {template.status === "premium" && (
          <span className="tpl-card-badge">Pro</span>
        )}
      </div>
      <div className="tpl-card-body">
        <div className="tpl-card-name">{template.name}</div>
        {categoryLabel && <div className="tpl-card-category">{categoryLabel}</div>}
      </div>
    </div>
  );
};

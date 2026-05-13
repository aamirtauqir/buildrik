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
  /** True when this template is the most-recently applied one for current page.
   *  Drives the cobalt APPLIED badge (prototype-v3 §1). */
  isApplied?: boolean;
  /** Active search query — wraps matching substring in <mark> for highlight. */
  highlightQuery?: string;
}

/** "landing-page" → "Landing page". */
function formatCategory(category: string | undefined): string {
  if (!category) return "";
  const spaced = category.replace(/[-_]+/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderHighlighted(name: string, query: string): React.ReactNode {
  const trimmed = query.trim();
  if (!trimmed) return name;
  const tokens = trimmed.split(/\s+/).filter(Boolean).map(escapeRegex);
  if (tokens.length === 0) return name;
  const re = new RegExp(`(${tokens.join("|")})`, "gi");
  const parts = name.split(re);
  return parts.map((part, i) =>
    re.test(part) ? <mark key={i} className="tpl-card-name-mark">{part}</mark> : <React.Fragment key={i}>{part}</React.Fragment>
  );
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onClick,
  isSelected = false,
  isApplied = false,
  highlightQuery,
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

  const className = [
    "tpl-card",
    isSelected && "tpl-card--selected",
    isApplied && "tpl-card--applied",
  ].filter(Boolean).join(" ");
  const categoryLabel = formatCategory(template.category);
  const isPremium = template.status === "premium";
  const statusLabel = isPremium ? "Pro" : "Free";

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
        {isApplied && (
          <span className="tpl-card-applied-badge" aria-label="Applied to current page">APPLIED</span>
        )}
        {!isApplied && isPremium && (
          <span className="tpl-card-badge">Pro</span>
        )}
      </div>
      <div className="tpl-card-info">
        <div className="tpl-card-name">{highlightQuery ? renderHighlighted(template.name, highlightQuery) : template.name}</div>
        {categoryLabel && (
          <div className="tpl-card-category">
            {categoryLabel}
            <span className="tpl-card-meta-sep"> · </span>
            <span className={`tpl-card-status${isPremium ? " tpl-card-status--pro" : ""}`}>{statusLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
};

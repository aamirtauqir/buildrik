import { Button } from "@/shared/ui/Button";
/**
 * MilestoneSuggestionBanner - Inline banner for auto-milestone suggestions
 * Phase 5: Shows AI-suggested version name with Save/Edit/Dismiss actions
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { MilestoneSuggestion } from "../../../../../shared/hooks/useAutoMilestone";

interface MilestoneSuggestionBannerProps {
  suggestion: MilestoneSuggestion;
  isLoading: boolean;
  onAccept: (name: string | null) => void;
  onDismiss: () => void;
  onEdit: (name: string) => void;
}

export const MilestoneSuggestionBanner: React.FC<MilestoneSuggestionBannerProps> = ({
  suggestion,
  isLoading,
  onAccept,
  onDismiss,
  onEdit,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(suggestion.suggestedName);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setEditValue(suggestion.suggestedName);
    setIsEditing(false);
  }, [suggestion.suggestedName]);

  const handleEditStart = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleEditSave = () => {
    if (editValue.trim()) {
      onEdit(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleEditSave();
    if (e.key === "Escape") {
      setEditValue(suggestion.suggestedName);
      setIsEditing(false);
    }
  };

  const triggerLabel = {
    page_added: "New page added",
    element_deleted: "Element deleted",
    mass_change: "Significant changes",
    checkpoint_threshold: "Editing session progress",
  }[suggestion.trigger];

  return (
    <div
      className="milestone-banner"
      role="alert"
      aria-live="polite"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        background: "var(--bd-accent-tint, rgba(45,109,255,0.08))",
        border: "1px solid rgba(45,109,255,0.2)",
        borderRadius: "var(--bd-radius-md)",
        margin: "0 12px 8px",
      }}
    >
      {/* Icon */}
      <div style={{ flexShrink: 0, color: "var(--bd-accent)" }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="6" />
          <path d="M8 5v3l2 1" />
        </svg>
      </div>
      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "var(--bd-fg-muted)", marginBottom: 2 }}>
          {triggerLabel}
        </div>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleEditKeyDown}
            onBlur={handleEditSave}
            maxLength={50}
            style={{
              width: "100%",
              background: "var(--bd-bg-subtle)",
              border: "1px solid var(--bd-accent)",
              borderRadius: 4,
              padding: "2px 6px",
              fontSize: 13,
              color: "var(--bd-fg-primary)",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
        ) : (
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--bd-fg-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={suggestion.suggestedName}
          >
            {suggestion.suggestedName}
          </div>
        )}
        {suggestion.reasoning && !isEditing && (
          <div
            style={{
              fontSize: 11,
              color: "var(--bd-fg-muted)",
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {suggestion.reasoning}
          </div>
        )}
      </div>
      {/* Actions */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {isEditing ? (
          <Button
            onClick={handleEditSave}
            className="milestone-btn milestone-btn--primary"
            style={{ background: "var(--bd-accent)", color: "var(--bd-fg-on-accent)" }}
          >
            Save
          </Button>
        ) : (
          <>
            <Button
              onClick={() => onAccept(null)}
              className="milestone-btn milestone-btn--primary"
              disabled={isLoading}
            >
              {isLoading ? "..." : "Save"}
            </Button>
            <Button onClick={handleEditStart} className="milestone-btn milestone-btn--ghost">
              Edit
            </Button>
            <Button onClick={onDismiss} className="milestone-btn milestone-btn--ghost">
              Dismiss
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * MilestoneSuggestionBanner - Inline banner for auto-milestone suggestions
 * Phase 5: Shows AI-suggested version name with Save/Edit/Dismiss actions
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { MilestoneSuggestion } from "../../../../../shared/hooks/useAutoMilestone";
import { Button, TextInput } from "@/editor/chrome-ui";

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
      data-testid="milestone-banner"
      role="alert"
      aria-live="polite"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        background: "var(--bk-accent-tint)",
        // was a raw rgba of the retired cobalt accent — the accent moved to
        // #406ED6 on 2026-07-21 and this border never followed (board B9.4).
        border: "1px solid var(--bk-alpha-accent-30)",
        borderRadius: "var(--bk-radius-lg)",
        margin: "0 12px 8px",
      }}
    >
      {/* Icon */}
      <div data-testid="milestone-icon" style={{ flexShrink: 0, color: "var(--bk-accent)" }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="6" />
          <path d="M8 5v3l2 1" />
        </svg>
      </div>
      {/* Content */}
      {/* 433:2352 — a flex column with a 2px gap. The three lines carried their own
          margins instead, so the gap between them was a property of each child
          rather than of the stack, and the middle one changed size when the
          name became an input. */}
      <div data-testid="milestone-content" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        <div data-testid="milestone-trigger" style={{ fontSize: 11, color: "var(--bk-ink-soft)" }}>
          {triggerLabel}
        </div>
        {isEditing ? (
          <TextInput
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleEditKeyDown}
            onBlur={handleEditSave}
            maxLength={50}
            style={{
              width: "100%",
              background: "var(--bk-bg-subtle)",
              border: "1px solid var(--bk-accent)",
              borderRadius: 4,
              padding: "2px 6px",
              fontSize: 13,
              color: "var(--bk-ink)",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
        ) : (
          <div
            data-testid="milestone-name"
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--bk-ink)",
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
            data-testid="milestone-reasoning"
            style={{
              fontSize: 11,
              color: "var(--bk-ink-soft)",
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
      <div data-testid="milestone-actions" style={{ display: "flex", gap: 6, flexShrink: 0, flexBasis: "100%" }}>
        {isEditing ? (
          <Button
            onClick={handleEditSave}
            className="milestone-btn milestone-btn--primary"
            style={{ background: "var(--bk-accent)", color: "var(--bk-accent-on)" }}
          >
            Save
          </Button>
        ) : (
          <>
            <Button
              onClick={() => onAccept(null)}
              className="milestone-btn milestone-btn--primary"
              data-testid="milestone-save"
              disabled={isLoading}
            >
              {isLoading ? "…" : "Save"}
            </Button>
            {/* Board 433:2359 draws Edit as btn/SECONDARY — a white chip with a
                --bk-border edge — and only 433:2361 Dismiss as the ghost. Both
                shipped ghost, so the action that keeps the suggestion and the
                action that throws it away were the same control. */}
            <Button onClick={handleEditStart} className="milestone-btn milestone-btn--secondary" data-testid="milestone-edit">
              Edit
            </Button>
            <Button onClick={onDismiss} className="milestone-btn milestone-btn--ghost" data-testid="milestone-dismiss">
              Dismiss
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

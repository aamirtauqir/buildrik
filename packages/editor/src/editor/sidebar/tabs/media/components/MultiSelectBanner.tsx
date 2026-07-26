import * as React from "react";
import { Button } from "@/editor/ui";
import { FolderInput, Trash2, X } from "lucide-react";

interface MultiSelectBannerProps {
  count: number;
  onMove(): void;
  onDelete(): void;
  onCancel(): void;
}

export function MultiSelectBanner({
  count,
  onMove,
  onDelete,
  onCancel,
}: MultiSelectBannerProps) {
  return (
    <div
      className="med-multi-select-banner"
      role="region"
      aria-label="Multi-select actions"
    >
      <span className="med-multi-select-banner__count">{count} selected</span>
      <div className="med-multi-select-banner__actions">
        <Button
          type="button"
          kind="ghost"
          size="sm"
          className="med-multi-select-banner__btn"
          onClick={onMove}
          aria-label="Move to folder"
        >
          <FolderInput size={14} aria-hidden />
          <span>Move to folder</span>
        </Button>
        <Button
          type="button"
          kind="ghost"
          size="sm"
          className="med-multi-select-banner__btn is-danger"
          onClick={onDelete}
          aria-label="Delete selected"
        >
          <Trash2 size={14} aria-hidden />
          <span>Delete</span>
        </Button>
        <Button
          type="button"
          kind="ghost"
          size="sm"
          className="med-multi-select-banner__btn"
          onClick={onCancel}
          aria-label="Cancel selection"
        >
          <X size={14} aria-hidden />
          <span>Cancel</span>
        </Button>
      </div>
    </div>
  );
}

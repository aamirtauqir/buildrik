/**
 * ToolbarActionsSection — Add/Duplicate/More menu/Delete action buttons
 * Extracted sub-component of UnifiedSelectionToolbar.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Tooltip } from "../../../../shared/ui/Tooltip";
import { canvasTokens } from "../../../../styles/tokens";
import {
  actionBtnStyles,
  deleteContainerStyles,
  isolatedDeleteStyles,
  dividerStyles,
  dropdownStyles,
  menuItemStyles,
  menuDividerStyles,
} from "./toolbarStyles";

const { colors } = canvasTokens;

export interface ToolbarActionsSectionProps {
  showMoreMenu: boolean;
  moreMenuRef: React.RefObject<HTMLDivElement>;
  onAdd: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onWrap: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoreMenuToggle: () => void;
}

export const ToolbarActionsSection: React.FC<ToolbarActionsSectionProps> = ({
  showMoreMenu,
  moreMenuRef,
  onAdd,
  onDuplicate,
  onDelete,
  onCopy,
  onWrap,
  onMoveUp,
  onMoveDown,
  onMoreMenuToggle,
}) => (
  <>
    <div style={dividerStyles} />

    {/* Add button */}
    <Tooltip content="Add Element" position="bottom">
      <button onClick={onAdd} style={actionBtnStyles} aria-label="Add child element">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </Tooltip>

    {/* Duplicate button */}
    <Tooltip content="Duplicate" shortcut="⌘D" position="bottom">
      <button onClick={onDuplicate} style={actionBtnStyles} aria-label="Duplicate element">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      </button>
    </Tooltip>

    <div style={dividerStyles} />

    {/* More button + dropdown */}
    <div style={{ position: "relative" }}>
      <Tooltip content="More" position="bottom">
        <button
          onClick={onMoreMenuToggle}
          style={{
            ...actionBtnStyles,
            background: showMoreMenu ? colors.surface.border : "transparent",
          }}
          aria-label="More actions menu"
          aria-expanded={showMoreMenu}
          aria-haspopup="menu"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      </Tooltip>

      {showMoreMenu && (
        <div
          ref={moreMenuRef}
          role="menu"
          aria-label="More actions"
          style={{ ...dropdownStyles, right: 0, left: "auto" }}
        >
          <button role="menuitem" onClick={onCopy} style={menuItemStyles}>
            <svg
              aria-hidden="true"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <span>Copy</span>
          </button>

          <div role="separator" style={menuDividerStyles} />

          <button role="menuitem" onClick={onWrap} style={menuItemStyles}>
            <svg
              aria-hidden="true"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <rect x="7" y="7" width="10" height="10" rx="1" />
            </svg>
            <span>Wrap in Container</span>
          </button>

          <div role="separator" style={menuDividerStyles} />

          <button role="menuitem" onClick={onMoveUp} style={menuItemStyles}>
            <svg
              aria-hidden="true"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            <span>Bring Forward</span>
          </button>
          <button role="menuitem" onClick={onMoveDown} style={menuItemStyles}>
            <svg
              aria-hidden="true"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
            <span>Send Backward</span>
          </button>
        </div>
      )}
    </div>

    {/* Delete button — spatially separated at far right */}
    <div style={deleteContainerStyles}>
      <Tooltip content="Delete" shortcut="⌫" position="bottom">
        <button onClick={onDelete} style={isolatedDeleteStyles} aria-label="Delete element">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </Tooltip>
    </div>
  </>
);

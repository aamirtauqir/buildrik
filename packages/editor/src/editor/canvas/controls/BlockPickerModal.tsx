/**
 * BlockPickerModal - Block picker modal for QuickActionsToolbar
 * Opens a modal with ElementsTab to select block type for insertion
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { getBlockById, insertBlock } from "../../../blocks/blockRegistry";
import type { Composer } from "../../../engine";
import type { BlockData } from "../../../shared/types";
import type { ElementType } from "../../../shared/types";
import { devLogger } from "../../../shared/utils/devLogger";
import { runTransaction } from "../../../shared/utils/helpers";
import { canNestElement } from "../../../shared/utils/nesting";
import { ElementsTab } from "../../sidebar/tabs/ElementsTab";

export interface BlockPickerModalProps {
  composer: Composer;
  isOpen: boolean;
  onClose: () => void;
  insertionContext: {
    targetElementId: string;
    position: "child" | "before" | "after";
  };
}

export const BlockPickerModal: React.FC<BlockPickerModalProps> = ({
  composer,
  isOpen,
  onClose,
  insertionContext,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");

  // Handle escape key to close
  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle block selection
  const handleBlockSelect = React.useCallback(
    (block: BlockData) => {
      const { targetElementId, position } = insertionContext;
      const targetElement = composer.elements.getElement(targetElementId);
      if (!targetElement) {
        devLogger.toolbar("block-picker-error", {
          reason: "Target element not found",
          targetElementId,
        });
        onClose();
        return;
      }

      // Get full block config with elementType
      const blockConfig = getBlockById(block.id);
      if (!blockConfig) {
        devLogger.toolbar("block-picker-error", {
          reason: "Block config not found",
          blockId: block.id,
        });
        onClose();
        return;
      }

      // Determine parent for nesting validation
      let parentId: string;
      let parentType: ElementType;
      let dropIndex: number | undefined;

      if (position === "child") {
        parentId = targetElementId;
        parentType = targetElement.getType() as ElementType;
        // Insert as last child
        dropIndex = targetElement.getChildren?.()?.length || 0;
      } else {
        const parent = targetElement.getParent();
        if (!parent) {
          devLogger.toolbar("block-picker-error", {
            reason: "No parent for sibling insertion",
            position,
          });
          onClose();
          return;
        }
        parentId = parent.getId();
        parentType = parent.getType() as ElementType;
        const currentIndex = parent.getChildIndex(targetElement);
        dropIndex = position === "before" ? currentIndex : currentIndex + 1;
      }

      // Validate nesting
      if (!canNestElement(blockConfig.elementType, parentType)) {
        devLogger.toolbar("block-picker-error", {
          reason: "Invalid nesting",
          elementType: blockConfig.elementType,
          parentType,
        });
        onClose();
        return;
      }

      devLogger.toolbar("block-picker-insert", {
        blockId: block.id,
        elementType: blockConfig.elementType,
        position,
        targetElementId,
        parentId,
        dropIndex,
      });

      runTransaction(composer, `quick-add-${position}`, () => {
        const newElementId = insertBlock(composer, blockConfig, parentId, dropIndex);

        // Select the newly created element
        if (newElementId) {
          const newElement = composer.elements.getElement(newElementId);
          if (newElement) {
            composer.selection.select(newElement as never);
          }
        }
      });

      onClose();
    },
    [composer, insertionContext, onClose]
  );

  if (!isOpen) return null;

  // Get position label for title
  const positionLabels = {
    child: "Add Child Element",
    before: "Add Element Before",
    after: "Add Element After",
  };

  return createPortal(
    <div
      className="aqb-block-picker-overlay"
      style={overlayStyles}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="aqb-block-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-label={positionLabels[insertionContext.position]}
        style={modalStyles}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={headerStyles}>
          <div style={titleStyles}>{positionLabels[insertionContext.position]}</div>
          <button onClick={onClose} style={closeButtonStyles} aria-label="Close">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search bar */}
        <div style={searchContainerStyles}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ opacity: 0.5 }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search elements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchInputStyles}
            autoFocus
          />
        </div>

        {/* ElementsTab content */}
        <div style={contentStyles}>
          <ElementsTab searchQuery={searchQuery} onBlockClick={handleBlockSelect} />
        </div>
      </div>
    </div>,
    document.body
  );
};

// Styles
const overlayStyles: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.7)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10000,
  backdropFilter: "blur(4px)",
};

const modalStyles: React.CSSProperties = {
  background: "var(--aqb-bg-panel, #1e1e2e)",
  borderRadius: 12,
  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
  width: 380,
  maxHeight: "80vh",
  display: "flex",
  flexDirection: "column",
  animation: "aqb-modal-in 0.2s ease",
};

const headerStyles: React.CSSProperties = {
  padding: "14px 16px",
  borderBottom: "1px solid var(--aqb-border, rgba(255,255,255,0.08))",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const titleStyles: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 14,
  color: "var(--aqb-text-primary, #cdd6f4)",
};

const closeButtonStyles: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "var(--aqb-text-secondary, #a6adc8)",
  cursor: "pointer",
  padding: 4,
  borderRadius: 6,
  display: "flex",
  transition: "background 0.15s",
};

const searchContainerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 16px",
  borderBottom: "1px solid var(--aqb-border, rgba(255,255,255,0.08))",
};

const searchInputStyles: React.CSSProperties = {
  flex: 1,
  background: "transparent",
  border: "none",
  outline: "none",
  color: "var(--aqb-text-primary, #cdd6f4)",
  fontSize: 13,
};

const contentStyles: React.CSSProperties = {
  flex: 1,
  overflow: "auto",
  maxHeight: "calc(80vh - 120px)",
};

export default BlockPickerModal;

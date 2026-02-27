/**
 * ToolbarNavSection — Parent navigation + element name chip + ancestor dropdown
 * Extracted sub-component of UnifiedSelectionToolbar.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Tooltip } from "../../../../shared/ui/Tooltip";
import {
  parentBtnStyles,
  nameBtnStyles,
  nameTextStyles,
  dropdownStyles,
  menuItemStyles,
} from "./toolbarStyles";

export interface ToolbarNavSectionProps {
  hasParent: boolean;
  elementName: string;
  ancestors: Array<{ id: string; name: string }>;
  showAncestorMenu: boolean;
  ancestorMenuRef: React.RefObject<HTMLDivElement>;
  onSelectParent: () => void;
  onAncestorMenuToggle: () => void;
  onSelectAncestor: (id: string) => void;
}

export const ToolbarNavSection: React.FC<ToolbarNavSectionProps> = ({
  hasParent,
  elementName,
  ancestors,
  showAncestorMenu,
  ancestorMenuRef,
  onSelectParent,
  onAncestorMenuToggle,
  onSelectAncestor,
}) => (
  <>
    {/* Parent button */}
    {hasParent && (
      <Tooltip content="Select Parent" shortcut="⌥↑" position="bottom">
        <button onClick={onSelectParent} style={parentBtnStyles} aria-label="Select parent element">
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
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      </Tooltip>
    )}

    {/* Element name — clickable for ancestor dropdown */}
    <div style={{ position: "relative" }}>
      <button
        onClick={onAncestorMenuToggle}
        style={nameBtnStyles}
        aria-label="Show element path"
        aria-expanded={showAncestorMenu}
        aria-haspopup="menu"
      >
        <span style={nameTextStyles}>{elementName}</span>
        {ancestors.length > 0 && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ marginLeft: 2, opacity: 0.6 }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        )}
      </button>

      {/* Ancestor dropdown */}
      {showAncestorMenu && ancestors.length > 0 && (
        <div
          ref={ancestorMenuRef}
          role="menu"
          aria-label="Element ancestors"
          style={dropdownStyles}
        >
          {ancestors.map((ancestor, i) => (
            <button
              key={ancestor.id}
              role="menuitem"
              onClick={() => onSelectAncestor(ancestor.id)}
              style={{ ...menuItemStyles, paddingLeft: 10 + i * 8 }}
            >
              <span aria-hidden="true" style={{ opacity: 0.5, marginRight: 6 }}>
                ↑
              </span>
              {ancestor.name}
            </button>
          ))}
        </div>
      )}
    </div>
  </>
);

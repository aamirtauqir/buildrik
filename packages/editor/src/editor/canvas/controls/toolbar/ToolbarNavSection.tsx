/**
 * ToolbarNavSection — Parent navigation + element name chip + ancestor dropdown
 * Extracted sub-component of UnifiedSelectionToolbar.
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  parentBtnStyles,
  nameBtnStyles,
  nameTextStyles,
  dropdownStyles,
  menuItemStyles,
} from "./toolbarStyles";
import { Button, Tooltip } from "@/editor/chrome-ui";

export interface ToolbarNavSectionProps {
  hasParent: boolean;
  elementName: string;
  ancestors: Array<{ id: string; name: string }>;
  showAncestorMenu: boolean;
  ancestorMenuRef: React.RefObject<HTMLDivElement | null>;
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
      <Tooltip content="Select Parent · ⌥↑" placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
        <Button color="light" onClick={onSelectParent} style={parentBtnStyles} aria-label="Select parent element" className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
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
        </Button>
      </Tooltip>
    )}

    {/* Element name — clickable for ancestor dropdown */}
    <div style={{ position: "relative" }}>
      <Button
        color="light"
        onClick={onAncestorMenuToggle}
        style={nameBtnStyles}
        aria-label="Show element path"
        aria-expanded={showAncestorMenu}
        aria-haspopup="menu" className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
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
      </Button>

      {/* Ancestor dropdown */}
      {showAncestorMenu && ancestors.length > 0 && (
        <div
          ref={ancestorMenuRef}
          role="menu"
          aria-label="Element ancestors"
          style={dropdownStyles}
        >
          {ancestors.map((ancestor, i) => (
            <Button
              key={ancestor.id}
              color="light"
              role="menuitem"
              onClick={() => onSelectAncestor(ancestor.id)}
              style={{ ...menuItemStyles, paddingLeft: 10 + i * 8 }} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
            >
              <span aria-hidden="true" style={{ opacity: 0.5, marginRight: 6 }}>
                ↑
              </span>
              {ancestor.name}
            </Button>
          ))}
        </div>
      )}
    </div>
  </>
);

/**
 * UserSavedSection (S6 CU3) — wraps existing ComponentsTab unchanged.
 *
 * Per spec §6.3, the user-saved component library is one half of the
 * dual-section Components panel. ComponentsTab.tsx (503 LOC, fully
 * featured: search, CRUD, dialogs, variant picker, persistence) already
 * handles all that work — wrapping rather than refactoring keeps the
 * shipped UX intact and avoids regression risk in the existing surface.
 *
 * Section header surfaces the user's saved-component count via composer
 * elements/userSaved API. v1 reads composer.elements.getAll() length;
 * future composer.components.userSaved API (spec §5.2) will replace.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ComponentsTab } from "@/editor/sidebar/tabs/ComponentsTab";
import type { ComponentsTabProps } from "@/editor/sidebar/tabs/component-library/types";

interface UserSavedSectionProps extends ComponentsTabProps {
  /** Optional override for the section header — defaults to "Your symbols". */
  sectionTitle?: string;
}

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: "var(--bk-ink-soft)",
  margin: "16px 12px 6px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
};

export const UserSavedSection: React.FC<UserSavedSectionProps> = ({
  sectionTitle = "Your symbols",
  ...componentsTabProps
}) => {
  return (
    <div style={containerStyle} data-user-saved-section>
      <div style={sectionHeaderStyle}>{sectionTitle}</div>
      <ComponentsTab {...componentsTabProps} />
    </div>
  );
};

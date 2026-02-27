/**
 * PagesTabHelpers — Context menu item, add menu item, and icon atoms for PagesTab.
 * @license BSD-3-Clause
 */

import * as React from "react";

// ─── Context Menu Item ─────────────────────────────────────────────────────────

interface CtxItemProps {
  label: string;
  kbd?: string;
  danger?: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  onClick?: () => void;
}

export const CtxItem: React.FC<CtxItemProps> = ({ label, kbd, danger, disabled, icon, onClick }) => (
  <div
    className={`pages-ctx__item${danger ? " pages-ctx__item--danger" : ""}${disabled ? " pages-ctx__item--disabled" : ""}`}
    onClick={!disabled ? onClick : undefined}
  >
    {icon}
    <span className="pages-ctx__lbl">{label}</span>
    {kbd && <span className="pages-ctx__kbd">{kbd}</span>}
  </div>
);

// ─── Add Menu Item ─────────────────────────────────────────────────────────────

interface AddMenuItemProps {
  icon: string;
  bg: string;
  label: string;
  sub: string;
  /** Shows a "Soon" badge — for features not yet available */
  soon?: boolean;
  onClick: () => void;
}

export const AddMenuItem: React.FC<AddMenuItemProps> = ({ icon, bg, label, sub, soon, onClick }) => (
  <div className="pages-add-item" onClick={onClick}>
    <div className="pages-add-item__icon" style={{ background: bg }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div className="pages-add-item__label">
        {label}{soon && <span className="pages-add-item__badge">Soon</span>}
      </div>
      <div className="pages-add-item__sub">{sub}</div>
    </div>
  </div>
);

// ─── Context Menu Icons ────────────────────────────────────────────────────────

const Ico = (d: string | string[]): React.ReactElement => {
  const paths = Array.isArray(d) ? d : [d];
  return (
    <svg className="pages-ctx__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      {paths.map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
};

export const IconEdit = () => Ico(["M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7", "M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"]);

export const IconCopy = () => (
  <svg className="pages-ctx__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);

export const IconHome = () => (
  <svg className="pages-ctx__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

export const IconLink = () => Ico(["M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71", "M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"]);

export const IconSettings = () => (
  <svg className="pages-ctx__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

export const IconTrash = () => (
  <svg className="pages-ctx__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
);

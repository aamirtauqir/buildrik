/**
 * Buildrik Editor Topbar — Design-accurate implementation
 * Matches spec: left icon-btns (r=8) | breadcrumb center | collab+actions right
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import { Tooltip } from "../../shared/ui/Tooltip";
import type { Issue } from "./hooks/useStudioState";
import { CommandPalette } from "./CommandPalette";
import { InviteModal } from "./InviteModal";
import { PublishDropdown, type PublishState } from "./PublishDropdown";

const dashboardUrl = import.meta.env.VITE_DASHBOARD_URL || "http://localhost:3000";

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

const IconArrowLeft: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 12L6 8l4-4" />
  </svg>
);

const IconUndo: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </svg>
);

const IconRedo: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m15 14 5-5-5-5" />
    <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
  </svg>
);

const IconKeyboard: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
  </svg>
);

const IconExternalLink: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const IconUser: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TopbarProps {
  composer?: Composer | null;

  // State
  canUndo: boolean;
  canRedo: boolean;
  issues?: Issue[];

  // Project context (for breadcrumb)
  projectName?: string;
  pageName?: string;

  // Publish workflow
  publishState?: PublishState;
  publishLoading?: boolean;
  isPublished?: boolean;

  // Preview
  previewLoading?: boolean;

  // Collaboration slot (renders before Invite button)
  collaborationSlot?: React.ReactNode;

  // Handlers
  onUndo: () => void;
  onRedo: () => void;
  onPreview: () => void;
  onPublish: () => void;
  onSave: () => void;
  onOpenIssues?: () => void;
  onCommandPalette?: () => void;
  onHelp?: () => void;
  onAccount?: () => void;
  onInvite?: () => void;

  // Legacy props kept for StudioHeader compatibility
  device?: string;
  zoom?: number;
  saveStatus?: "idle" | "saving" | "error";
  isDirty?: boolean;
  lastSavedAt?: number;
  exportLoading?: boolean;
  syncStatus?: string;
  selectedElement?: { id: string; type: string; tagName?: string } | null;
  showXRay?: boolean;
  devMode?: boolean;
  showSuggestions?: boolean;
  onDeviceChange?: (d: "desktop" | "tablet" | "mobile" | "wide") => void;
  onZoomChange?: (z: number) => void;
  onToggleXRay?: () => void;
  onToggleDevMode?: () => void;
  onToggleSuggestions?: () => void;
  onOpenProjectSettings?: () => void;
  onOpenDesignSystem?: () => void;
  onOpenPublish?: () => void;
  onOpenPlugins?: () => void;
  onOpenHistory?: () => void;
  onOpenAI?: () => void;
  onShowTemplates?: () => void;
  onShowAI?: () => void;
  onShowCopilot?: () => void;
  onAddPage?: () => void;
  onExportHTML?: () => void;
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

export const Topbar: React.FC<TopbarProps> = ({
  canUndo,
  canRedo,
  issues = [],
  projectName = "My Project",
  pageName = "Home",
  publishState = "draft",
  publishLoading = false,
  previewLoading = false,
  collaborationSlot,
  onUndo,
  onRedo,
  onPreview,
  onPublish,
  onSave,
  onOpenIssues,
  onHelp,
  onAccount,
}) => {
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [inviteOpen, setInviteOpen] = React.useState(false);

  // ⌘K global shortcut
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const errorCount = issues.filter((i) => i.type === "error").length;
  const warnCount = issues.filter((i) => i.type === "warning").length;

  const issueLabel = [
    errorCount > 0 ? `${errorCount} error${errorCount !== 1 ? "s" : ""}` : "",
    warnCount > 0 ? `${warnCount} warning${warnCount !== 1 ? "s" : ""}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div className="tbWrap">
        <div className="tbBar">

          {/* ── LEFT: Back · Divider · Undo · Redo ── */}
          <div className="tbLeft">
            <Tooltip content="Back to Dashboard">
              <a
                href={`${dashboardUrl}/dashboard/sites`}
                className="tbIconBtn"
                aria-label="Back to Dashboard"
              >
                <IconArrowLeft />
              </a>
            </Tooltip>

            <div className="tbDivider" role="separator" />

            <Tooltip content="Undo" shortcut="⌘Z">
              <button
                className="tbIconBtn"
                onClick={onUndo}
                disabled={!canUndo}
                aria-label="Undo last action"
                aria-disabled={!canUndo}
              >
                <IconUndo />
              </button>
            </Tooltip>

            <Tooltip content="Redo" shortcut="⌘⇧Z">
              <button
                className="tbIconBtn"
                onClick={onRedo}
                disabled={!canRedo}
                aria-label="Redo last action"
                aria-disabled={!canRedo}
              >
                <IconRedo />
              </button>
            </Tooltip>
          </div>

          {/* ── CENTER: Breadcrumb or Issues Badge ── */}
          <div className="tbCenter">
            {issues.length > 0 ? (
              <button
                className="tbIssuesBadge"
                onClick={onOpenIssues}
                aria-label={`${issueLabel} — click to open issues panel`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                {issueLabel}
              </button>
            ) : (
              <div className="tbBreadcrumb" aria-label="Current location">
                <span className="tbBreadcrumb-project">{projectName}</span>
                <span className="tbBreadcrumb-sep" aria-hidden="true">/</span>
                <span className="tbBreadcrumb-page">{pageName}</span>
              </div>
            )}
          </div>

          {/* ── RIGHT: Collab · Invite · ⌘K · Preview · Publish · Help · Account ── */}
          <div className="tbRight">
            {collaborationSlot}

            <Tooltip content="Invite team members">
              <button
                className="tbInviteBtn"
                onClick={() => setInviteOpen(true)}
                aria-label="Invite team members"
              >
                + Invite
              </button>
            </Tooltip>

            <Tooltip content="Command palette" shortcut="⌘K">
              <button
                className="tbCmdBtn"
                onClick={() => setCmdOpen(true)}
                aria-label="Open command palette"
              >
                <IconKeyboard />
                <span className="tbCmdText">⌘K</span>
              </button>
            </Tooltip>

            <Tooltip content="Preview in browser" shortcut="⌘P">
              <button
                className="tbPreviewBtn"
                onClick={onPreview}
                disabled={previewLoading}
                aria-label="Preview in browser"
                aria-disabled={previewLoading}
              >
                <IconExternalLink />
                <span>{previewLoading ? "Loading…" : "Preview"}</span>
              </button>
            </Tooltip>

            <PublishDropdown
              publishState={publishState}
              loading={publishLoading}
              onPublish={onPublish}
              onSave={onSave}
            />

            <Tooltip content="Help">
              <button
                className="tbHelpBtn"
                onClick={onHelp}
                aria-label="Help"
              >
                ?
              </button>
            </Tooltip>

            <Tooltip content="Account settings">
              <a
                href={`${dashboardUrl}/account`}
                className="tbAccountBtn"
                aria-label="Account settings"
                onClick={onAccount ? (e) => { e.preventDefault(); onAccount(); } : undefined}
              >
                <IconUser />
              </a>
            </Tooltip>
          </div>

        </div>
      </div>

      {/* ── Overlays ── */}
      {cmdOpen && (
        <CommandPalette onClose={() => setCmdOpen(false)} />
      )}

      {inviteOpen && (
        <InviteModal onClose={() => setInviteOpen(false)} />
      )}
    </>
  );
};

export default Topbar;

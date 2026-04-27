import { Button } from "@/shared/ui/Button";
/**
 * Buildrik Editor Topbar — v2 (new-design).
 * Layout: Brand · Undo/Redo/History · | · Breadcrumb · Breakpoints · | · Saved · Preview · Publish
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import { Tooltip } from "../../shared/ui/Tooltip";
import type { Issue } from "./hooks/useStudioState";
import { AccountModal } from "./AccountModal";
import { CommandPalette } from "./CommandPalette";
import { InviteModal } from "./InviteModal";
import { PublishDropdown, type PublishState } from "./PublishDropdown";

import "./chrome.css";

const dashboardUrl = import.meta.env.VITE_DASHBOARD_URL || "http://localhost:3000";

// ── icons ────────────────────────────────────────────────────────────────────

const Stroke: React.FC<{ size?: number; children: React.ReactNode; w?: number }> = ({
  size = 14,
  children,
  w = 1.6,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={w}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const IconUndo = () => (
  <Stroke>
    <path d="M9 14L4 9l5-5" />
    <path d="M4 9h10a6 6 0 0 1 6 6v0a6 6 0 0 1-6 6H8" />
  </Stroke>
);
const IconRedo = () => (
  <Stroke>
    <path d="M15 14l5-5-5-5" />
    <path d="M20 9H10a6 6 0 0 0-6 6v0a6 6 0 0 0 6 6h6" />
  </Stroke>
);
const IconHistory = () => (
  <Stroke>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Stroke>
);
const IconEye = () => (
  <Stroke>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </Stroke>
);
const IconDesktop = () => (
  <Stroke>
    <rect x="2" y="4" width="20" height="12" rx="2" />
    <path d="M8 20h8 M12 16v4" />
  </Stroke>
);
const IconTablet = () => (
  <Stroke>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M12 18h.01" />
  </Stroke>
);
const IconMobile = () => (
  <Stroke>
    <rect x="7" y="2" width="10" height="20" rx="2" />
    <path d="M12 18h.01" />
  </Stroke>
);
const IconWide = () => (
  <Stroke>
    <rect x="1" y="5" width="22" height="10" rx="2" />
    <path d="M8 19h8 M12 15v4" />
  </Stroke>
);
const IconChevDown = () => (
  <Stroke size={12}>
    <path d="M6 9l6 6 6-6" />
  </Stroke>
);
const IconKbd = () => (
  <Stroke>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
  </Stroke>
);
const IconWarn = () => (
  <Stroke w={2.5} size={12}>
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </Stroke>
);
const IconUser = () => (
  <Stroke>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Stroke>
);

// ── props ────────────────────────────────────────────────────────────────────

export interface TopbarProps {
  composer?: Composer | null;

  canUndo: boolean;
  canRedo: boolean;
  issues?: Issue[];

  projectName?: string;
  pageName?: string;

  publishState?: PublishState;
  publishLoading?: boolean;
  isPublished?: boolean;
  isOffline?: boolean;

  previewLoading?: boolean;

  collaborationSlot?: React.ReactNode;

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

  // Legacy / StudioHeader wiring
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

// ── helpers ──────────────────────────────────────────────────────────────────

function formatSavedAgo(ts?: number): string {
  if (!ts) return "Not saved";
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 10) return "just now";
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

// ── component ────────────────────────────────────────────────────────────────

export const Topbar: React.FC<TopbarProps> = ({
  canUndo,
  canRedo,
  issues = [],
  projectName = "My project",
  pageName = "Home",
  publishState = "draft",
  publishLoading = false,
  isOffline = false,
  previewLoading = false,
  device = "desktop",
  saveStatus = "idle",
  isDirty = false,
  lastSavedAt,
  collaborationSlot,
  onUndo,
  onRedo,
  onPreview,
  onPublish,
  onSave,
  onOpenIssues,
  onOpenHistory,
  onHelp,
  onAccount,
  onDeviceChange,
}) => {
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [accountOpen, setAccountOpen] = React.useState(false);

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

  // Force re-render every 30s so the "Saved · Nm" label stays fresh.
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!lastSavedAt) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, [lastSavedAt]);

  const errorCount = issues.filter((i) => i.type === "error").length;
  const warnCount = issues.filter((i) => i.type === "warning").length;
  const issueLabel = [
    errorCount > 0 ? `${errorCount} error${errorCount !== 1 ? "s" : ""}` : "",
    warnCount > 0 ? `${warnCount} warning${warnCount !== 1 ? "s" : ""}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const savedLabel =
    saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "error"
        ? "Save failed"
        : isDirty
          ? "Unsaved"
          : lastSavedAt
            ? `Saved · ${formatSavedAgo(lastSavedAt)}`
            : "Not saved";

  const savedVariant =
    saveStatus === "error"
      ? "error"
      : isDirty || !lastSavedAt
        ? "warn"
        : "ok";

  const bpItems: Array<{ k: "desktop" | "tablet" | "mobile" | "wide"; icon: React.ReactNode; label: string }> = [
    { k: "wide", icon: <IconWide />, label: "Wide" },
    { k: "desktop", icon: <IconDesktop />, label: "Desktop" },
    { k: "tablet", icon: <IconTablet />, label: "Tablet" },
    { k: "mobile", icon: <IconMobile />, label: "Mobile" },
  ];

  return (
    <>
      <div className="bdc-top bdc" role="banner">
        {/* Brand */}
        <div className="bdc-brand">
          <a
            href={`${dashboardUrl}/dashboard/sites`}
            className="bdc-mark"
            aria-label="Back to Dashboard"
            style={{ textDecoration: "none" }}
          >
            B
          </a>
          <div className="bdc-name">Buildrik</div>
          <span style={{ color: "var(--bd-fg-muted)", display: "inline-flex" }}>
            <IconChevDown />
          </span>
        </div>

        {/* Undo / Redo / History */}
        <div className="bdc-group">
          <Tooltip content="Undo" shortcut="⌘Z">
            <Button
              className="bdc-btn bdc-icon"
              onClick={onUndo}
              disabled={!canUndo}
              aria-label="Undo"
            >
              <IconUndo />
            </Button>
          </Tooltip>
          <Tooltip content="Redo" shortcut="⌘⇧Z">
            <Button
              className="bdc-btn bdc-icon"
              onClick={onRedo}
              disabled={!canRedo}
              aria-label="Redo"
            >
              <IconRedo />
            </Button>
          </Tooltip>
          <Tooltip content="History">
            <Button
              className="bdc-btn bdc-icon"
              onClick={onOpenHistory}
              aria-label="History"
            >
              <IconHistory />
            </Button>
          </Tooltip>
        </div>

        <div className="bdc-divider" />

        {/* Breadcrumb / Issues */}
        <div className="bdc-title">
          {issues.length > 0 ? (
            <Button
              className="bdc-btn"
              onClick={onOpenIssues}
              aria-label={`${issueLabel} — open issues`}
              style={{ color: "var(--bd-warning)" }}
            >
              <IconWarn />
              {issueLabel}
            </Button>
          ) : (
            <>
              <span>{projectName}</span>
              <span className="bdc-slash">/</span>
              <span className="bdc-page">{pageName}</span>
              <span style={{ color: "var(--bd-fg-muted)" }}>
                <IconChevDown />
              </span>
            </>
          )}
        </div>

        {/* Breakpoints */}
        <div className="bdc-group bdc-bp-group" role="group" aria-label="Breakpoint">
          {bpItems.map((b) => (
            <Tooltip content={b.label} key={b.k}>
              <Button
                className={`bdc-btn bdc-icon${device === b.k ? " bdc-bp-on" : ""}`}
                onClick={() => onDeviceChange?.(b.k)}
                aria-label={b.label}
                aria-pressed={device === b.k}
              >
                {b.icon}
              </Button>
            </Tooltip>
          ))}
        </div>

        <div className="bdc-divider" />

        {/* Saved / Collab / Cmd / Preview / Publish */}
        <span
          className={`bdc-badge${savedVariant === "ok" ? " bdc-saved" : ""}`}
          style={
            savedVariant === "warn"
              ? {
                  background: "var(--bd-warning-bg)",
                  borderColor: "var(--bd-warning-border)",
                  color: "var(--bd-warning)",
                }
              : savedVariant === "error"
                ? {
                    background: "var(--bd-error-bg)",
                    borderColor: "var(--bd-error-border)",
                    color: "var(--bd-error)",
                  }
                : undefined
          }
          onClick={() => {
            if (savedVariant !== "ok") onSave();
          }}
          role={savedVariant !== "ok" ? "button" : undefined}
          tabIndex={savedVariant !== "ok" ? 0 : undefined}
        >
          <span
            className="bdc-dot"
            style={{
              background:
                savedVariant === "ok"
                  ? "var(--bd-success)"
                  : savedVariant === "warn"
                    ? "var(--bd-warning)"
                    : "var(--bd-error)",
            }}
          />
          {savedLabel}
        </span>

        {collaborationSlot}

        <Tooltip content="Invite team">
          <Button
            className="bdc-btn bdc-secondary"
            onClick={() => setInviteOpen(true)}
            aria-label="Invite team"
          >
            + Invite
          </Button>
        </Tooltip>

        <div className="bdc-group">
          <Tooltip content="Command palette" shortcut="⌘K">
            <Button
              className="bdc-btn bdc-icon"
              onClick={() => setCmdOpen(true)}
              aria-label="Command palette"
            >
              <IconKbd />
            </Button>
          </Tooltip>

          <Tooltip content="Preview" shortcut="⌘P">
            <Button
              className="bdc-btn bdc-secondary"
              onClick={onPreview}
              disabled={previewLoading}
              aria-label="Preview"
            >
              <IconEye />
              <span>{previewLoading ? "Loading…" : "Preview"}</span>
            </Button>
          </Tooltip>

          <div style={{ position: "relative" }}>
            <PublishDropdown
              publishState={publishState}
              loading={publishLoading}
              onPublish={onPublish}
              onSave={onSave}
            />
            {isOffline && (
              <div className="tbOfflineTooltip">Cannot publish while offline</div>
            )}
          </div>

          <Tooltip content="Help">
            <Button className="bdc-btn bdc-icon" onClick={onHelp} aria-label="Help">
              ?
            </Button>
          </Tooltip>

          <Tooltip content="Account">
            <Button
              className="bdc-btn bdc-icon"
              onClick={() => {
                setAccountOpen(true);
                onAccount?.();
              }}
              aria-label="Account"
            >
              <IconUser />
            </Button>
          </Tooltip>
        </div>
      </div>
      {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} />}
      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}
      {accountOpen && <AccountModal onClose={() => setAccountOpen(false)} />}
    </>
  );
};

export default Topbar;

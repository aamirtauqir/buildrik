/**
 * Buildrik Editor Topbar — v2 (vibcoder bd-* re-port).
 * Layout: Brand · Undo/Redo/History · | · Breadcrumb · Breakpoints · Saved · Collab/Invite · Right-actions
 *
 * Skin: vibcoder canonical `bd-topbar` (organisms/topbar.css) extended via
 * `themes/design-system/bd-topbar-overrides.css` (8-col grid + slot widening).
 * Sunsets to pure canonical when upstream PR lands. See
 * `docs/superpowers/specs/2026-04-29-vibcoder-bd-topbar-evolution.md`.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import {
  BreakpointSwitcher,
  Button,
  Divider,
  IconButton,
  Tooltip,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
  TooltipKbd,
  Topbar as VibcoderTopbar,
  TopbarBrand,
  TopbarGroup,
  TopbarStatus,
  TopbarStatusDot,
} from "@/editor/shared/vibcoder";
import type { Issue } from "./hooks/useStudioState";
import { AccountModal } from "./AccountModal";
import { CommandPalette } from "./modals/CommandPalette";
import { InviteModal } from "./InviteModal";
import { PublishDropdown, type PublishState } from "./PublishDropdown";
import { isFeatureEnabled } from "@/shared/utils/featureFlags";

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
const IconHelpCircle = () => (
  <Stroke>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
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
  publishedUrl?: string | null;
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
  composer,
  canUndo,
  canRedo,
  issues = [],
  projectName = "My project",
  pageName = "Home",
  publishState = "draft",
  publishLoading = false,
  publishedUrl = null,
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
  onExportHTML,
  onDeviceChange,
}) => {
  const publishEnabled = isFeatureEnabled("publish");
  const accountEnabled = isFeatureEnabled("account");
  const inviteEnabled = isFeatureEnabled("invite");
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

  const savedVariant: "ok" | "saving" | "warn" | "error" =
    saveStatus === "saving"
      ? "saving"
      : saveStatus === "error"
        ? "error"
        : isDirty || !lastSavedAt
          ? "warn"
          : "ok";

  const renderSavedLabel = (): React.ReactNode => {
    if (saveStatus === "saving") return "Saving…";
    if (saveStatus === "error") return "Save failed";
    if (isDirty) return "Unsaved";
    if (lastSavedAt) {
      return (
        <>
          Saved · <span className="bd-topbar__status-time">{formatSavedAgo(lastSavedAt)}</span>
        </>
      );
    }
    return "Not saved";
  };

  const isStatusInteractive = savedVariant === "warn" || savedVariant === "error";

  const bpGlyphs = {
    wide: <IconWide />,
    desktop: <IconDesktop />,
    tablet: <IconTablet />,
    mobile: <IconMobile />,
  } as const;

  return (
    <>
      <VibcoderTopbar>
        {/* Cell 1 — Brand group (mark + label + chevron) */}
        <div className="bd-topbar__brand-group">
          <a
            href={`${dashboardUrl}/dashboard/sites`}
            className="bd-topbar__brand-mark"
            aria-label="Back to Dashboard"
          >
            B
          </a>
          <TopbarBrand>Buildrik</TopbarBrand>
          <IconButton size="xs" aria-label="Switch project">
            <IconChevDown />
          </IconButton>
        </div>

        {/* Cell 2 — Undo / Redo / History */}
        <TopbarGroup>
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton onClick={onUndo} disabled={!canUndo} aria-label="Undo">
                <IconUndo />
              </IconButton>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent>Undo <TooltipKbd>⌘Z</TooltipKbd></TooltipContent>
            </TooltipPortal>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton onClick={onRedo} disabled={!canRedo} aria-label="Redo">
                <IconRedo />
              </IconButton>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent>Redo <TooltipKbd>⌘⇧Z</TooltipKbd></TooltipContent>
            </TooltipPortal>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton onClick={onOpenHistory} aria-label="History">
                <IconHistory />
              </IconButton>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent>History</TooltipContent>
            </TooltipPortal>
          </Tooltip>
        </TopbarGroup>

        {/* Cell 3 — Divider */}
        <Divider orientation="vertical" />

        {/* Cell 4 — Title (centered, 1fr) — switches to issue pill when issues > 0 */}
        {issues.length > 0 ? (
          <div className="bd-topbar__title bd-topbar__title--issues">
            <Button
              variant="ghost"
              size="sm"
              className="bd-topbar__issue-pill"
              onClick={onOpenIssues}
              aria-label={`${issueLabel} — open issues`}
            >
              <IconWarn />
              {issueLabel}
            </Button>
          </div>
        ) : (
          <div className="bd-topbar__title">
            <span>{projectName}</span>
            <span className="bd-topbar__title-slash">/</span>
            <span className="bd-topbar__title-page">{pageName}</span>
            <IconChevDown />
          </div>
        )}

        {/* Cell 5 — Breakpoint switcher (4 cells: wide/desktop/tablet/mobile) */}
        <BreakpointSwitcher
          value={device as "wide" | "desktop" | "tablet" | "mobile"}
          onChange={(d) => onDeviceChange?.(d)}
          includeWide
          glyphs={bpGlyphs}
        />

        {/* Cell 6 — Status pill */}
        <TopbarStatus
          className={`bd-topbar__status--${savedVariant}`}
          onClick={isStatusInteractive ? onSave : undefined}
          role={isStatusInteractive ? "button" : undefined}
          tabIndex={isStatusInteractive ? 0 : undefined}
        >
          <TopbarStatusDot />
          {renderSavedLabel()}
        </TopbarStatus>

        {/* Cell 7 — Collab presence + offline indicator + Invite */}
        <TopbarGroup>
          {collaborationSlot}
          {isOffline && (
            <span className="bd-topbar__offline" aria-label="Offline">
              <span className="bd-topbar__offline-dot" />
              Offline
            </span>
          )}
          {inviteEnabled && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setInviteOpen(true)}
                  aria-label="Invite team"
                >
                  + Invite
                </Button>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent>Invite team</TooltipContent>
              </TooltipPortal>
            </Tooltip>
          )}
        </TopbarGroup>

        {/* Cell 8 — Right actions: Cmd / Preview / Publish / Help / Account */}
        <TopbarGroup>
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton onClick={() => setCmdOpen(true)} aria-label="Command palette">
                <IconKbd />
              </IconButton>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent>Command palette <TooltipKbd>⌘K</TooltipKbd></TooltipContent>
            </TooltipPortal>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                onClick={onPreview}
                disabled={previewLoading}
                aria-label="Preview"
              >
                <IconEye />
                <span>{previewLoading ? "Loading…" : "Preview"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent>Preview <TooltipKbd>⌘P</TooltipKbd></TooltipContent>
            </TooltipPortal>
          </Tooltip>

          {publishEnabled ? (
            <div style={{ position: "relative" }}>
              <PublishDropdown
                publishState={publishState}
                loading={publishLoading}
                publishedUrl={publishedUrl}
                onPublish={onPublish}
                onSave={onSave}
              />
              {isOffline && (
                <div className="tbOfflineTooltip">Cannot publish while offline</div>
              )}
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onExportHTML}
                  aria-label="Export HTML"
                >
                  Export
                </Button>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent>Export HTML — publish to web coming soon</TooltipContent>
              </TooltipPortal>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton onClick={onHelp} aria-label="Help">
                <IconHelpCircle />
              </IconButton>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent>Help</TooltipContent>
            </TooltipPortal>
          </Tooltip>

          {accountEnabled && (
            <Tooltip>
              <TooltipTrigger asChild>
                <IconButton
                  onClick={() => {
                    setAccountOpen(true);
                    onAccount?.();
                  }}
                  aria-label="Account"
                >
                  <IconUser />
                </IconButton>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent>Account</TooltipContent>
              </TooltipPortal>
            </Tooltip>
          )}
        </TopbarGroup>
      </VibcoderTopbar>
      {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} composer={composer ?? null} />}
      {inviteOpen && inviteEnabled && <InviteModal onClose={() => setInviteOpen(false)} />}
      {accountOpen && accountEnabled && <AccountModal onClose={() => setAccountOpen(false)} />}
    </>
  );
};

export default Topbar;

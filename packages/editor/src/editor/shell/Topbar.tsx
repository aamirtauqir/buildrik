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
  TopbarGroup,
  TopbarStatus,
  TopbarStatusDot,
} from "@/editor/shared/vibcoder";
import { Menu, MenuItem } from "@/editor/shared/vibcoder/Menu";
import { useClickOutside } from "@/shared/hooks";
import { Sparkles, MoreHorizontal } from "lucide-react";
import { getEditorViewMode } from "../../shared/utils/editorViewMode";
import { submitForReview } from "../../services/ReviewService";
import type { Issue } from "./hooks/useStudioState";
import { CommandPalette } from "./modals/CommandPalette";
import { PublishDropdown, type PublishState } from "./PublishDropdown";
import { isFeatureEnabled } from "@/shared/utils/featureFlags";
import { DASHBOARD_URL as dashboardUrl } from "@/shared/utils/runtimeEnv";
import { ColorModeIconCycle } from "@/editor/design-system/ui/ColorModeIconCycle";

import "./chrome.css";

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
const IconWarn = () => (
  <Stroke w={2.5} size={12}>
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
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
  syncStatus,
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
  onExportHTML,
  onDeviceChange,
  onOpenAI,
}) => {
  const publishEnabled = isFeatureEnabled("publish");
  // E3: in 4-tool mode AI leaves the rail, so the topbar carries the ✨ trigger.
  const viewMode = getEditorViewMode();
  const fourToolRail = viewMode.fourToolRail;
  // E4: an invited content editor sends for review instead of publishing.
  const [reviewState, setReviewState] = React.useState<"idle" | "sending" | "sent" | "error">("idle");
  const sendForReview = React.useCallback(async () => {
    setReviewState("sending");
    try {
      await submitForReview();
      setReviewState("sent");
    } catch {
      setReviewState("error");
    }
  }, []);
  const [cmdOpen, setCmdOpen] = React.useState(false);

  // Redesign: the "Status + Ship" zone keeps only the common actions; the rare
  // ones (Invite, command palette, Preview-as-client, Help, Account) live in a
  // ⋯ overflow menu. Same handlers — only their home moved.
  const [moreOpen, setMoreOpen] = React.useState(false);
  const moreRef = React.useRef<HTMLDivElement | null>(null);
  useClickOutside(moreRef, () => setMoreOpen(false), { enabled: moreOpen });

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

  // 60-save-states: "offline" = the browser is offline OR the dashboard sync is
  // disconnected. Either way edits are kept locally and queued, so this must
  // never read as a failed/lost save — it overrides the error state.
  const offline = isOffline || syncStatus === "offline";

  const savedVariant: "ok" | "saving" | "warn" | "error" =
    offline
      ? "warn"
      : saveStatus === "saving"
        ? "saving"
        : saveStatus === "error"
          ? "error"
          : isDirty || !lastSavedAt
            ? "warn"
            : "ok";

  const renderSavedLabel = (): React.ReactNode => {
    // Offline takes precedence — a dropped connection never reads as data loss.
    if (offline) return "Offline — changes queued, will sync";
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
        {/* ZONE 1 — Navigate: leave the editor + step back through history.
            Redesign: the site/page breadcrumb left the topbar (it lives in the
            bottom status bar now); the topbar is three labelled zones. */}
        <div className="bd-topbar__zone bd-topbar__zone--left">
          <div className="bd-topbar__brand-group">
            <a
              href={`${dashboardUrl}/dashboard/sites`}
              className="bd-topbar__brand-mark"
              aria-label="Exit to Dashboard"
            >
              B
            </a>
            <a
              href={`${dashboardUrl}/dashboard/sites`}
              className="bd-topbar__exit"
              aria-label="Exit to Dashboard"
              style={{ fontSize: 13, color: "var(--bd-text-muted, #6b7280)", textDecoration: "none", whiteSpace: "nowrap" }}
            >
              ‹ Exit
            </a>
          </div>
          <Divider orientation="vertical" />
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
        </div>

        {/* ZONE 2 — View: device/breakpoint switcher, centered (1fr column). */}
        <BreakpointSwitcher
          value={device as "wide" | "desktop" | "tablet" | "mobile"}
          onChange={(d) => onDeviceChange?.(d)}
          includeWide
          glyphs={bpGlyphs}
        />

        {/* ZONE 3 — Status + Ship: live status, the AI helper, Preview, and the one
            hero action (Publish). Rare actions live in the ⋯ overflow. */}
        <div className="bd-topbar__zone bd-topbar__zone--right">
          {issues.length > 0 && (
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
          )}

          {collaborationSlot}
          {isOffline && (
            <span className="bd-topbar__offline" aria-label="Offline">
              <span className="bd-topbar__offline-dot" />
              Offline
            </span>
          )}

          {/* Status pill — one truth (saved / saving / offline / reconnecting) */}
          <TopbarStatus
            className={`bd-topbar__status--${savedVariant}`}
            onClick={isStatusInteractive ? onSave : undefined}
            role={isStatusInteractive ? "button" : undefined}
            tabIndex={isStatusInteractive ? 0 : undefined}
          >
            <TopbarStatusDot />
            {renderSavedLabel()}
          </TopbarStatus>

          {/* ✨ Ask AI — icon helper (constitution #5: Publish is the hero, not AI). */}
          {fourToolRail && onOpenAI && (
            <Tooltip>
              <TooltipTrigger asChild>
                <IconButton onClick={onOpenAI} aria-label="Ask AI">
                  <Sparkles size={16} />
                </IconButton>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent>Ask AI</TooltipContent>
              </TooltipPortal>
            </Tooltip>
          )}

          {/* Preview */}
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

          {viewMode.clientView ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={sendForReview}
                  disabled={reviewState === "sending" || reviewState === "sent"}
                  aria-label="Send for review"
                >
                  {reviewState === "sending"
                    ? "Sending…"
                    : reviewState === "sent"
                      ? "Sent for review ✓"
                      : reviewState === "error"
                        ? "Retry send"
                        : "Send for review"}
                </Button>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent>An admin will review your changes before they go live</TooltipContent>
              </TooltipPortal>
            </Tooltip>
          ) : publishEnabled ? (
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

          {composer && (
            <Tooltip>
              <TooltipTrigger asChild>
                <ColorModeIconCycle
                  composer={composer}
                  renderTrigger={({ onClick, ariaLabel, children }) => (
                    <IconButton onClick={onClick} aria-label={ariaLabel}>
                      {children as React.ReactNode}
                    </IconButton>
                  )}
                />
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent>Color mode (light · dark · system)</TooltipContent>
              </TooltipPortal>
            </Tooltip>
          )}

          {/* ⋯ overflow — rare actions off the hot path: Invite, command palette,
              Preview-as-client, Help, Account. Same handlers, new home. */}
          <div ref={moreRef} style={{ position: "relative" }}>
            <Tooltip>
              <TooltipTrigger asChild>
                <IconButton
                  onClick={() => setMoreOpen((o) => !o)}
                  aria-label="More options"
                  aria-expanded={moreOpen}
                >
                  <MoreHorizontal size={16} />
                </IconButton>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent>More</TooltipContent>
              </TooltipPortal>
            </Tooltip>
            {moreOpen && (
              <Menu style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 1000, minWidth: 200 }}>
                <MenuItem
                  onClick={() => {
                    window.open(`${dashboardUrl}/dashboard/team`, "_blank", "noopener,noreferrer");
                    setMoreOpen(false);
                  }}
                >
                  Invite teammates
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setCmdOpen(true);
                    setMoreOpen(false);
                  }}
                >
                  Command palette ⌘K
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    const url = new URL(window.location.href);
                    if (viewMode.clientView) url.searchParams.delete("view");
                    else url.searchParams.set("view", "client");
                    window.location.assign(url.toString());
                  }}
                >
                  {viewMode.clientView ? "Exit client view" : "Preview as client"}
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    onHelp?.();
                    setMoreOpen(false);
                  }}
                >
                  Help &amp; shortcuts
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    window.open(`${dashboardUrl}/dashboard/settings/account`, "_blank", "noopener,noreferrer");
                    setMoreOpen(false);
                  }}
                >
                  Account settings
                </MenuItem>
              </Menu>
            )}
          </div>
        </div>
      </VibcoderTopbar>
      {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} composer={composer ?? null} />}
    </>
  );
};

export default Topbar;

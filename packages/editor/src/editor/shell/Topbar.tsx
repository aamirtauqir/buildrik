/**
 * Buildrik Editor Topbar — New Design 2026
 * Light theme: #F8FAFC bg, 56px height
 * Layout: Left (back + undo/redo) | Center (device + status) | Right (collab + actions)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import { Tooltip } from "../../shared/ui/Tooltip";
import { BreakpointDropdown } from "./BreakpointDropdown";
import type { SyncStatus, Issue } from "./hooks/useStudioState";
import { StatusIndicators } from "./StatusIndicators";

const dashboardUrl = import.meta.env.VITE_DASHBOARD_URL || "http://localhost:3000";

// ─────────────────────────────────────────────
// Icon helpers (inline SVG — no external dep)
// ─────────────────────────────────────────────

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

const IconRocket: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

const IconChevronDown: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconUser: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconSpinner: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ animation: "tbSpin 1s linear infinite" }}>
    <circle cx="12" cy="12" r="10" opacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
);

// ─────────────────────────────────────────────
// Device Switcher Pill (light theme)
// ─────────────────────────────────────────────

type PillDevice = "mobile" | "tablet" | "desktop" | "wide";

const DEVICE_SEGMENTS: Array<{ id: PillDevice; label: string; ariaLabel: string; icon: React.ReactNode }> = [
  {
    id: "mobile",
    label: "Mobile",
    ariaLabel: "Mobile (375px)",
    icon: (
      <svg width="9" height="13" viewBox="0 0 9 13" fill="none" aria-hidden="true">
        <rect x="0.75" y="0.75" width="7.5" height="11.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="3.5" y="10" width="2" height="1" rx="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "tablet",
    label: "Tablet",
    ariaLabel: "Tablet (768px)",
    icon: (
      <svg width="11" height="13" viewBox="0 0 11 13" fill="none" aria-hidden="true">
        <rect x="0.75" y="0.75" width="9.5" height="11.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="4" y="10.5" width="3" height="1" rx="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "desktop",
    label: "Desktop",
    ariaLabel: "Desktop (1280px)",
    icon: (
      <svg width="16" height="13" viewBox="0 0 16 13" fill="none" aria-hidden="true">
        <rect x="0.75" y="0.75" width="14.5" height="9" rx="1.25" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5.5 12h5M8 9.75V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "wide",
    label: "Wide",
    ariaLabel: "Wide (1920px)",
    icon: (
      <svg width="18" height="13" viewBox="0 0 18 13" fill="none" aria-hidden="true">
        <rect x="0.75" y="0.75" width="16.5" height="9" rx="1.25" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6.5 12h5M9 9.75V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

const DeviceSwitcherPill: React.FC<{ device: PillDevice; onDeviceChange: (d: PillDevice) => void }> = ({ device, onDeviceChange }) => (
  <div
    role="group"
    aria-label="Device breakpoint"
    style={{ display: "flex", alignItems: "center", height: 28, padding: 2, background: "#F1F5F9", border: "1px solid #D1D9E6", borderRadius: 8, gap: 1 }}
  >
    {DEVICE_SEGMENTS.map((seg) => {
      const isActive = seg.id === device;
      return (
        <Tooltip key={seg.id} content={seg.ariaLabel}>
          <button
            onClick={() => onDeviceChange(seg.id)}
            aria-label={seg.ariaLabel}
            aria-pressed={isActive}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 36,
              height: 22,
              padding: "0 8px",
              background: isActive ? "#FFFFFF" : "transparent",
              border: "none",
              borderRadius: 6,
              color: isActive ? "#334155" : "#94A3B8",
              cursor: "pointer",
              boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
              transition: "background 0.12s ease, color 0.12s ease",
              flexShrink: 0,
            }}
          >
            {seg.icon}
          </button>
        </Tooltip>
      );
    })}
  </div>
);

// ─────────────────────────────────────────────
// Topbar Props
// ─────────────────────────────────────────────

export interface TopbarProps {
  composer?: Composer | null;
  device: string;
  canUndo: boolean;
  canRedo: boolean;
  saveStatus: "idle" | "saving" | "error";
  isDirty: boolean;
  lastSavedAt?: number;
  previewLoading: boolean;
  publishLoading?: boolean;
  isPublished?: boolean;
  exportLoading?: boolean;
  syncStatus?: SyncStatus;
  issues?: Issue[];
  /** Collaboration presence indicators rendered in right section */
  collaborationSlot?: React.ReactNode;
  projectName?: string;
  // Handlers
  onDeviceChange: (d: "desktop" | "tablet" | "mobile" | "wide") => void;
  onUndo: () => void;
  onRedo: () => void;
  onPreview: () => void;
  onPublish: () => void;
  onSave: () => void;
  onOpenIssues?: () => void;
  onProjectNameClick?: () => void;
  onCommandPalette?: () => void;
  onHelp?: () => void;
  onAccount?: () => void;
  onInvite?: () => void;
  onExportHTML?: () => void;
  // Legacy props (kept for StudioHeader compatibility — unused in new layout)
  zoom?: number;
  onZoomChange?: (z: number) => void;
  selectedElement?: { id: string; type: string; tagName?: string } | null;
  showXRay?: boolean;
  devMode?: boolean;
  showSuggestions?: boolean;
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
}

// ─────────────────────────────────────────────
// Topbar Component
// ─────────────────────────────────────────────

export const Topbar: React.FC<TopbarProps> = ({
  device,
  canUndo,
  canRedo,
  saveStatus,
  lastSavedAt,
  previewLoading,
  publishLoading = false,
  isPublished = false,
  syncStatus = "connected",
  issues = [],
  collaborationSlot,
  onDeviceChange,
  onUndo,
  onRedo,
  onPreview,
  onPublish,
  onSave,
  onOpenIssues,
  onCommandPalette,
  onHelp,
  onAccount,
  onInvite,
}) => (
  <div className="tbWrap">
    <div className="tbBar">

      {/* ── LEFT: Back · Divider · Undo · Redo ── */}
      <div className="tbLeft">
        <Tooltip content="Back to Dashboard">
          <a
            href={`${dashboardUrl}/dashboard/sites`}
            className="tbCircleBtn"
            aria-label="Back to Dashboard"
          >
            <IconArrowLeft />
          </a>
        </Tooltip>

        <div className="tbDivider" role="separator" />

        <Tooltip content="Undo" shortcut="⌘Z">
          <button
            className="tbCircleBtn"
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
            className="tbCircleBtn"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo last action"
            aria-disabled={!canRedo}
          >
            <IconRedo />
          </button>
        </Tooltip>
      </div>

      {/* ── CENTER: Device switcher + Save status ── */}
      <div className="tbCenter">
        <DeviceSwitcherPill
          device={(device as PillDevice) || "desktop"}
          onDeviceChange={onDeviceChange}
        />
        <BreakpointDropdown
          device={(device === "watch" ? "desktop" : device) as "desktop" | "tablet" | "mobile" | "wide"}
          onDeviceChange={onDeviceChange}
        />
        <StatusIndicators
          saveStatus={saveStatus}
          lastSavedAt={lastSavedAt}
          syncStatus={syncStatus}
          issues={issues}
          onSaveRetry={onSave}
          onIssuesClick={onOpenIssues}
        />
      </div>

      {/* ── RIGHT: Collab · Invite · ⌘K · Preview · Publish · Help · Account ── */}
      <div className="tbRight">
        {collaborationSlot}

        <Tooltip content="Invite collaborators">
          <button
            className="tbBtn tbBtnGhost"
            onClick={onInvite}
            aria-label="Invite collaborators"
          >
            + Invite
          </button>
        </Tooltip>

        <Tooltip content="Command palette" shortcut="⌘K">
          <button
            className="tbBtn"
            onClick={onCommandPalette}
            aria-label="Open command palette"
          >
            <IconKeyboard />
            <span style={{ color: "#475569" }}>⌘K</span>
          </button>
        </Tooltip>

        <Tooltip content="Preview" shortcut="⌘P">
          <button
            className="tbBtn"
            onClick={onPreview}
            disabled={previewLoading}
            aria-label="Preview in browser"
            aria-disabled={previewLoading}
          >
            {previewLoading ? <IconSpinner /> : <IconExternalLink />}
            <span>{previewLoading ? "Loading…" : "Preview"}</span>
          </button>
        </Tooltip>

        <Tooltip content="Publish site">
          <button
            className="tbBtnPublish"
            onClick={onPublish}
            disabled={publishLoading}
            aria-label="Publish site"
            aria-disabled={publishLoading}
          >
            {publishLoading ? <IconSpinner /> : <IconRocket />}
            <span>{publishLoading ? "Publishing…" : "Publish"}</span>
            {!isPublished && !publishLoading && (
              <span className="tbDraftBadge">Draft</span>
            )}
            {!publishLoading && <IconChevronDown />}
          </button>
        </Tooltip>

        <Tooltip content="Help">
          <button
            className="tbSquareBtn"
            onClick={onHelp}
            aria-label="Help"
          >
            ?
          </button>
        </Tooltip>

        <Tooltip content="Account">
          <a
            href={`${dashboardUrl}/account`}
            className="tbSquareBtn"
            aria-label="Account settings"
            onClick={onAccount ? (e) => { e.preventDefault(); onAccount(); } : undefined}
          >
            <IconUser />
          </a>
        </Tooltip>
      </div>

    </div>
  </div>
);

export default Topbar;

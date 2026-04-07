/**
 * InfoBanner — Standardized in-panel guidance components.
 * Three variants: InfoBanner (panel messages), Tip (inline hints), Warning.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Info, Lightbulb, AlertTriangle, X } from "lucide-react";

// ─── InfoBanner ────────────────────────────────────────────────────────────

export interface InfoBannerProps {
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function InfoBanner({ children, dismissible, onDismiss, className }: InfoBannerProps) {
  return (
    <div
      className={className}
      role="note"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        padding: "10px 12px",
        background: "var(--aqb-info-light, rgba(59, 130, 246, 0.12))",
        borderLeft: "3px solid var(--aqb-info, #3b82f6)",
        borderRadius: "0 6px 6px 0",
      }}
    >
      <Info
        size={16}
        aria-hidden="true"
        style={{ flexShrink: 0, marginTop: 1, color: "var(--aqb-info, #3b82f6)" }}
      />
      <span
        style={{
          flex: 1,
          fontSize: 13,
          fontWeight: 400,
          lineHeight: 1.5,
          color: "var(--aqb-text-secondary)",
        }}
      >
        {children}
      </span>
      {dismissible && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 18,
            height: 18,
            padding: 0,
            background: "transparent",
            border: "none",
            color: "var(--aqb-text-muted)",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <X size={12} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

// ─── Tip ───────────────────────────────────────────────────────────────────

export interface TipProps {
  children: React.ReactNode;
  className?: string;
}

export function Tip({ children, className }: TipProps) {
  return (
    <div
      className={className}
      role="note"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 6,
        padding: "6px 0",
      }}
    >
      <Lightbulb
        size={14}
        aria-hidden="true"
        style={{ flexShrink: 0, marginTop: 1, color: "var(--aqb-text-disabled, #6b6963)" }}
      />
      <span
        style={{
          fontSize: 12,
          fontWeight: 400,
          lineHeight: 1.5,
          color: "var(--aqb-text-muted)",
        }}
      >
        {children}
      </span>
    </div>
  );
}

// ─── Warning ───────────────────────────────────────────────────────────────

export interface WarningBannerProps {
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function WarningBanner({ children, dismissible, onDismiss, className }: WarningBannerProps) {
  return (
    <div
      className={className}
      role="alert"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        padding: "10px 12px",
        background: "var(--aqb-warning-light, rgba(245, 158, 11, 0.12))",
        borderLeft: "3px solid var(--aqb-warning, #f59e0b)",
        borderRadius: "0 6px 6px 0",
      }}
    >
      <AlertTriangle
        size={16}
        aria-hidden="true"
        style={{ flexShrink: 0, marginTop: 1, color: "var(--aqb-warning, #f59e0b)" }}
      />
      <span
        style={{
          flex: 1,
          fontSize: 13,
          fontWeight: 400,
          lineHeight: 1.5,
          color: "var(--aqb-text-secondary)",
        }}
      >
        {children}
      </span>
      {dismissible && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 18,
            height: 18,
            padding: 0,
            background: "transparent",
            border: "none",
            color: "var(--aqb-text-muted)",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <X size={12} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

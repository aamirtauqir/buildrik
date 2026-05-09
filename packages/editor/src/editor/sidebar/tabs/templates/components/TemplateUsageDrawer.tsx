/**
 * TemplateUsageDrawer (S9 — Templates extended drawer)
 *
 * Two tabs: "Used in" lists every page that has the template applied;
 * "Versions" is a P9-pending placeholder. Lives next to TemplateDetail
 * inline panel; opened when user clicks "Used in N pages →" affordance
 * inside the detail panel.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Modal, ModalContent, ModalDescription, ModalTitle } from "@/editor/shared/vibcoder";
import type { TemplateUsageEntry } from "../utils/templateUsage";

type Tab = "used" | "versions";

export interface TemplateUsageDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  templateName: string;
  usage: ReadonlyArray<TemplateUsageEntry>;
  /** Optional: jump to page when user clicks a usage row. */
  onJumpToPage?: (pageId: string) => void;
  /**
   * P9: current template version. Versions tab compares each applied
   * usage's version against this to flag stale applications. Omit to
   * hide the comparison (Versions tab still renders the timeline).
   */
  currentVersion?: string;
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export const TemplateUsageDrawer: React.FC<TemplateUsageDrawerProps> = ({
  open,
  onOpenChange,
  templateId,
  templateName,
  usage,
  onJumpToPage,
  currentVersion,
}) => {
  const [tab, setTab] = React.useState<Tab>("used");

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="lg" aria-labelledby={`tpl-usage-title-${templateId}`}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--bd-border, #e2e8f0)" }}>
          <ModalTitle id={`tpl-usage-title-${templateId}`} style={{ fontSize: 16, fontWeight: 600 }}>
            {templateName}
          </ModalTitle>
          <ModalDescription style={{ fontSize: 12, color: "var(--bd-fg-muted, #64748b)", marginTop: 2 }}>
            Where this template is in use across pages
          </ModalDescription>
        </div>

        <div
          role="tablist"
          aria-label="Drawer sections"
          style={{
            display: "flex",
            gap: 4,
            padding: "8px 12px",
            borderBottom: "1px solid var(--bd-border, #e2e8f0)",
          }}
        >
          {(["used", "versions"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              style={{
                all: "unset",
                cursor: "pointer",
                padding: "6px 12px",
                borderRadius: 4,
                fontSize: 13,
                fontWeight: tab === t ? 600 : 500,
                color: tab === t ? "var(--bd-fg, #0f172a)" : "var(--bd-fg-muted, #64748b)",
                borderBottom:
                  tab === t ? "2px solid var(--bd-accent, #2D6DFF)" : "2px solid transparent",
              }}
            >
              {t === "used" ? "Used in" : "Versions"}
            </button>
          ))}
        </div>

        <div role="tabpanel" style={{ padding: "16px 24px", maxHeight: 360, overflow: "auto" }}>
          {tab === "used" && (
            usage.length === 0 ? (
              <div
                style={{
                  fontSize: 13,
                  color: "var(--bd-fg-muted, #64748b)",
                  padding: "32px 0",
                  textAlign: "center",
                }}
              >
                Not applied to any page yet
              </div>
            ) : (
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                {usage.map((entry) => (
                  <li key={entry.pageId}>
                    <button
                      type="button"
                      onClick={() => onJumpToPage?.(entry.pageId)}
                      disabled={!onJumpToPage}
                      style={{
                        all: "unset",
                        cursor: onJumpToPage ? "pointer" : "default",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 4,
                        fontSize: 13,
                        color: "var(--bd-fg, #0f172a)",
                      }}
                    >
                      <span style={{ flex: 1 }}>{entry.pageName}</span>
                      {entry.version && (
                        <span
                          style={{
                            fontSize: 11,
                            padding: "2px 6px",
                            borderRadius: 3,
                            background: "var(--bd-bg-subtle, #f1f5f9)",
                            color: "var(--bd-fg-muted, #64748b)",
                          }}
                        >
                          v{entry.version}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: "var(--bd-fg-muted, #64748b)" }}>
                        {formatRelative(entry.appliedAt)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )
          )}

          {tab === "versions" && (
            <VersionsPanel
              usage={usage}
              currentVersion={currentVersion}
            />
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "12px 24px",
            borderTop: "1px solid var(--bd-border, #e2e8f0)",
          }}
        >
          <button
            type="button"
            aria-label="Close drawer"
            onClick={() => onOpenChange(false)}
            className="bd-btn bd-btn--ghost"
          >
            Close
          </button>
        </div>
      </ModalContent>
    </Modal>
  );
};

// ── Versions panel (P9) ────────────────────────────────────────────────────

interface VersionsPanelProps {
  usage: ReadonlyArray<TemplateUsageEntry>;
  currentVersion?: string;
}

function VersionsPanel({ usage, currentVersion }: VersionsPanelProps) {
  // Sort by appliedAt DESC. Stable for ties.
  const timeline = React.useMemo(() => {
    return usage.slice().sort((a, b) => {
      if (a.appliedAt === b.appliedAt) return 0;
      return a.appliedAt < b.appliedAt ? 1 : -1;
    });
  }, [usage]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {currentVersion && (
        <div
          data-testid="versions-current"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 10px",
            borderRadius: 6,
            background: "var(--bd-bg-subtle, #f8fafc)",
            border: "1px solid var(--bd-border, #e2e8f0)",
            fontSize: 12,
          }}
        >
          <span style={{ color: "var(--bd-fg-muted, #64748b)" }}>Current version</span>
          <span style={{ fontWeight: 600 }}>v{currentVersion}</span>
        </div>
      )}

      {timeline.length === 0 ? (
        <div
          style={{
            fontSize: 13,
            color: "var(--bd-fg-muted, #64748b)",
            padding: "24px 0",
            textAlign: "center",
          }}
        >
          No applies yet — when you apply this template, the history will appear here.
        </div>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          {timeline.map((entry, idx) => {
            const stale =
              currentVersion !== undefined &&
              entry.version !== undefined &&
              entry.version !== currentVersion;
            return (
              <li
                key={`${entry.pageId}-${idx}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 10px",
                  borderRadius: 4,
                  fontSize: 13,
                  color: "var(--bd-fg, #0f172a)",
                  border: stale
                    ? "1px solid var(--bd-warn-border, #fde68a)"
                    : "1px solid transparent",
                  background: stale ? "var(--bd-warn-soft, #fef9c3)" : "transparent",
                }}
              >
                <span style={{ flex: 1 }}>{entry.pageName}</span>
                {entry.version && (
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 6px",
                      borderRadius: 3,
                      background: "var(--bd-bg-subtle, #f1f5f9)",
                      color: "var(--bd-fg-muted, #64748b)",
                    }}
                  >
                    v{entry.version}
                  </span>
                )}
                {stale && (
                  <span style={{ fontSize: 11, color: "var(--bd-warn-strong, #854d0e)", fontWeight: 600 }}>
                    update available
                  </span>
                )}
                <span style={{ fontSize: 11, color: "var(--bd-fg-muted, #64748b)" }}>
                  {formatRelative(entry.appliedAt)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

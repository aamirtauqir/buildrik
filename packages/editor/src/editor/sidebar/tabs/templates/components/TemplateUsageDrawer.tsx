/**
 * TemplateUsageDrawer (S9 — Templates extended drawer)
 *
 * Three tabs: "Preview" shows the template's thumbnail with an
 * "Open full preview" CTA (callback opens TemplatePreviewModal in the
 * parent); "Used in" lists every page that has the template applied;
 * "Versions" is a P9-pending placeholder. Lives next to TemplateDetail
 * inline panel; opened when user clicks "Used in N pages →" affordance
 * inside the detail panel.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { ModalContent, ModalRoot, ModalTitle, Button } from "@/editor/chrome-ui";
import type { TemplateUsageEntry } from "../utils/templateUsage";
type Tab = "preview" | "used" | "versions";

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
  /** Optional: thumbnail URL for Preview tab (data-URL or HTTP). */
  templateThumbnail?: string;
  /** Optional: caller's hook to open the full TemplatePreviewModal. */
  onOpenPreview?: () => void;
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/* `all: "unset"` appeared on two Buttons here. It nukes flowbite's entire
   button styling — including its focus ring — and then re-adds padding and
   colour by hand, which is how a control ends up with no visible keyboard
   focus. Both are ordinary Buttons now. */
const HEAD = "tw:px-6 tw:py-5 tw:border-b tw:border-gray-200";
const TABLIST = "tw:flex tw:gap-1 tw:px-3 tw:py-2 tw:border-b tw:border-gray-200";
const TAB = "tw:px-3 tw:py-1.5 tw:text-[13px] tw:rounded tw:border-b-2 tw:bg-transparent";
const PANEL = "tw:px-6 tw:py-4 tw:max-h-90 tw:overflow-auto";
const LIST = "tw:list-none tw:m-0 tw:p-0 tw:flex tw:flex-col tw:gap-1";
const ROW = "tw:flex tw:items-center tw:gap-3 tw:w-full tw:px-2.5 tw:py-2 tw:rounded tw:text-[13px]";
const VERSION_CHIP = "tw:text-[11px] tw:px-1.5 tw:py-0.5 tw:rounded-sm tw:bg-gray-50 tw:text-gray-500";
const META = "tw:text-[11px] tw:text-gray-500";
const CENTERED_EMPTY = "tw:text-[13px] tw:text-gray-500 tw:py-8 tw:text-center";
const FOOTER = "tw:flex tw:justify-end tw:px-6 tw:py-3 tw:border-t tw:border-gray-200";

export const TemplateUsageDrawer: React.FC<TemplateUsageDrawerProps> = ({
  open,
  onOpenChange,
  templateId,
  templateName,
  usage,
  onJumpToPage,
  currentVersion,
  templateThumbnail,
  onOpenPreview,
}) => {
  const [tab, setTab] = React.useState<Tab>("preview");

  return (
    <ModalRoot open={open} onOpenChange={onOpenChange}>
      <ModalContent size="lg" aria-labelledby={`tpl-usage-title-${templateId}`}>
        <div className={HEAD}>
          {/* Board 1169:4764 asks the question in the title — "Where 'Bistro
              Menu' is used" — instead of naming the template and explaining
              underneath. */}
          <ModalTitle id={`tpl-usage-title-${templateId}`} className="tw:text-base tw:font-semibold">
            Where &lsquo;{templateName}&rsquo; is used
          </ModalTitle>
        </div>

        <div
          role="tablist"
          aria-label="Drawer sections"
          className={TABLIST}
        >
          {(["preview", "used", "versions"] as const).map((t) => (
            <Button
              key={t}
              type="button"
              color="light"
              size="xs"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`${TAB} ${
                tab === t
                  ? "tw:font-semibold tw:text-gray-900 tw:border-b-blue-700"
                  : "tw:font-medium tw:text-gray-500 tw:border-b-transparent"
              }`}
            >
              {t === "preview" ? "Preview" : t === "used" ? "Used in" : "Versions"}
            </Button>
          ))}
        </div>

        <div role="tabpanel" className={PANEL}>
          {tab === "preview" && (
            <div
              className="tw:flex tw:flex-col tw:items-center tw:gap-4 tw:py-2"
            >
              {templateThumbnail ? (
                <img
                  src={templateThumbnail}
                  alt={`${templateName} preview`}
                  className="tw:w-full tw:max-h-60 tw:object-contain tw:rounded tw:border tw:border-gray-200 tw:bg-gray-50"
                />
              ) : (
                <div
                  className="tw:w-full tw:h-40 tw:flex tw:items-center tw:justify-center tw:rounded tw:border tw:border-dashed tw:border-gray-200 tw:bg-gray-50 tw:text-xs tw:text-gray-500"
                >
                  No preview thumbnail
                </div>
              )}
              <Button
                type="button"
                onClick={() => onOpenPreview?.()}
                disabled={!onOpenPreview}
                size="sm"
              >
                Open full preview →
              </Button>
            </div>
          )}

          {tab === "used" && (
            usage.length === 0 ? (
              <div
                className={CENTERED_EMPTY}
              >
                Not applied to any page yet
              </div>
            ) : (
              <ul
                className={LIST}
              >
                {usage.map((entry) => (
                  <li key={entry.pageId}>
                    <Button
                      type="button"
                      color="light"
                      size="xs"
                      onClick={() => onJumpToPage?.(entry.pageId)}
                      disabled={!onJumpToPage}
                      className={`${ROW} tw:border-transparent tw:bg-transparent tw:text-gray-900`}
                    >
                      <span className="tw:flex-1">{entry.pageName}</span>
                      {entry.version && (
                        <span
                          className={VERSION_CHIP}
                        >
                          v{entry.version}
                        </span>
                      )}
                      <span className={META}>
                        {formatRelative(entry.appliedAt)}
                      </span>
                    </Button>
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

        {/* Board 1169:4764's footnote, and the fact behind this whole drawer:
            applying a template COPIES it, so editing the template later
            changes nothing that already exists. Without it, a list of pages
            reads like a set of live links. */}
        <p className="tw:m-0 tw:px-6 tw:pb-3 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
          Changes to the template never touch pages already created from it.
        </p>

        <div
          className={FOOTER}
        >
          <Button
            color="light"
            size="xs"
            type="button"
            aria-label="Close drawer"
            onClick={() => onOpenChange(false)} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
          >
            Close
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
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
    <div className="tw:flex tw:flex-col tw:gap-3">
      {currentVersion && (
        <div
          data-testid="versions-current"
          className="tw:flex tw:justify-between tw:items-center tw:px-2.5 tw:py-2 tw:rounded-md tw:bg-gray-50 tw:border tw:border-gray-200 tw:text-xs"
        >
          <span className="tw:text-gray-500">Current version</span>
          <span className="tw:font-semibold">v{currentVersion}</span>
        </div>
      )}

      {timeline.length === 0 ? (
        <div
          className="tw:text-[13px] tw:text-gray-500 tw:py-6 tw:text-center"
        >
          No applies yet — when you apply this template, the history will appear here.
        </div>
      ) : (
        <ul className={LIST}>
          {timeline.map((entry, idx) => {
            const stale =
              currentVersion !== undefined &&
              entry.version !== undefined &&
              entry.version !== currentVersion;
            return (
              <li
                key={`${entry.pageId}-${idx}`}
                className={`${ROW} tw:border tw:text-gray-900 ${
                  stale
                    ? "tw:border-[var(--bk-warning-text)] tw:bg-[var(--bk-warning-tint)]"
                    : "tw:border-transparent tw:bg-transparent"
                }`}
              >
                <span className="tw:flex-1">{entry.pageName}</span>
                {entry.version && (
                  <span
                    className={VERSION_CHIP}
                  >
                    v{entry.version}
                  </span>
                )}
                {stale && (
                  <span className="tw:text-[11px] tw:text-[var(--bk-warning-text)] tw:font-semibold">
                    update available
                  </span>
                )}
                <span className={META}>
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

/* @lint-hex-policy: component-theme
   "Template applied!" success banner uses a slightly brighter emerald than
   canonical --buildrick-success — intentional tonal choice for the post-apply
   celebration state. */

import * as React from "react";
import { MousePointerClick } from "lucide-react";
import { Kbd, Button } from "@/editor/chrome-ui";
import type { Composer } from "../../../engine";
import { EVENTS } from "../../../shared/constants/events";

/**
 * Empty state shown when no element is selected in the Inspector.
 * Emits Composer events to open Build panel, Templates, or Design panel.
 */

export interface InspectorEmptyStateProps {
  composer?: Composer | null;
}

export const InspectorEmptyState: React.FC<InspectorEmptyStateProps> = ({
  composer,
}) => {
  // Phase 7: Check if template was recently applied
  const [appliedName, setAppliedName] = React.useState<string | null>(null);

  React.useEffect(() => {
    const stored = localStorage.getItem("buildrick-last-applied-template");
    if (stored) {
      try {
        const data = JSON.parse(stored) as { name: string; ts: number };
        // Show for 30 minutes
        if (Date.now() - data.ts < 30 * 60 * 1000) {
          setAppliedName(data.name);
        } else {
          localStorage.removeItem("buildrick-last-applied-template");
        }
      } catch {
        localStorage.removeItem("buildrick-last-applied-template");
      }
    }
  }, []);

  // Phase 7: Post-apply state
  if (appliedName) {
    return (
      <div role="status" aria-live="polite" className={CONTAINER}>
        <div className={APPLIED_BANNER}>
          <h3 className={`${TITLE} tw:mb-1 tw:text-[var(--bk-success)]`}>Template applied!</h3>
          {/* was color: var(--bk-success-tint) — a BACKGROUND tone used as text,
              i.e. pale green on pale green. The name was barely readable. */}
          <p className={`${DESCRIPTION} tw:mb-3 tw:text-gray-900`}>
            {appliedName}
          </p>
          {composer && (
            <Button
              onClick={() => composer.emit(EVENTS.UI_OPEN_DESIGN_PANEL, {})}
              className={APPLIED_ACTION}
              aria-label="Set brand colors in Global Styles"
            >
              Set Brand Colors
            </Button>
          )}
        </div>
        {/* Still show default tips below */}
        <div className={`${TIP} tw:mt-3`}>
          <span className="tw:opacity-70">Tip:</span> Click an element to edit its properties
        </div>
      </div>
    );
  }

  return (
    <div role="status" aria-live="polite" aria-label="No element selected" className={CONTAINER}>
      {/* Icon */}
      <div className={ICON_CIRCLE} aria-hidden="true">
        <MousePointerClick size={16} strokeWidth={1.5} className="tw:opacity-50" />
      </div>
      {/* Title */}
      <h3 className={TITLE}>Nothing Selected</h3>
      {/* Description */}
      <p className={DESCRIPTION}>
        Click an element on the canvas or use the Layers panel to select and edit properties.
      </p>
      {/* CTA Buttons */}
      <div className={CTA_STACK}>
        {composer && (
          <>
            <Button
              onClick={() => composer.emit(EVENTS.UI_OPEN_BUILD_PANEL, {})}
              className={PRIMARY_BTN}
              aria-label="Open Build panel to add elements"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Open Build Panel
            </Button>
            <Button
              onClick={() => composer.emit(EVENTS.UI_BROWSE_TEMPLATES, {})}
              className={SECONDARY_BTN}
              aria-label="Browse available templates"
            >
              Browse Templates
            </Button>
          </>
        )}
      </div>
      {/* Keyboard Tips */}
      <div className={TIP}>
        <span className="tw:opacity-70">Tip:</span> Press <Kbd>A</Kbd> to open Build
        panel{" · "}
        <Kbd>Esc</Kbd> to deselect
      </div>
    </div>
  );
};

// ============================================================================
// CLASSES
// ============================================================================

const CONTAINER =
  "tw:flex tw:flex-col tw:items-center tw:justify-center tw:h-full tw:mt-10 tw:p-6 " +
  "tw:text-center tw:text-[var(--bk-ink-soft)]";
const ICON_CIRCLE =
  "tw:flex tw:items-center tw:justify-center tw:size-12 tw:mb-4 tw:rounded-full " +
  "tw:border tw:border-[var(--bk-bg-subtle)] tw:bg-[var(--bk-bg-subtle)]";
const TITLE = "tw:mb-2 tw:text-sm tw:font-semibold tw:text-gray-900";
const DESCRIPTION = "tw:m-0 tw:max-w-55 tw:text-[13px] tw:leading-normal tw:text-gray-500";
const CTA_STACK = "tw:flex tw:flex-col tw:gap-2 tw:mt-5 tw:w-full tw:max-w-50";
const PRIMARY_BTN =
  "tw:flex tw:items-center tw:justify-center tw:gap-1.5 tw:w-full tw:px-4 tw:py-2 tw:rounded-md " +
  "tw:border-0 tw:bg-blue-700 tw:text-white tw:text-xs tw:font-semibold tw:hover:bg-blue-800";
const SECONDARY_BTN =
  "tw:px-3 tw:py-1.5 tw:rounded tw:border-0 tw:bg-transparent tw:text-xs tw:font-medium " +
  "tw:text-[var(--bk-ink-soft)] tw:underline tw:underline-offset-2 tw:hover:text-gray-900";
const TIP = "tw:mt-5 tw:px-3 tw:py-2 tw:rounded-md tw:bg-blue-50 tw:text-[11px] tw:text-[var(--bk-ink-soft)]";
/** Success banner after a template applies — success tokens, not a hand-mixed green. */
const APPLIED_BANNER =
  "tw:w-full tw:max-w-55 tw:px-4 tw:py-3 tw:rounded-lg tw:text-center " +
  "tw:border tw:border-[var(--bk-success)] tw:bg-[var(--bk-success-tint)]";
const APPLIED_ACTION =
  "tw:block tw:w-full tw:px-2.5 tw:py-1.5 tw:rounded-md tw:text-[11px] tw:text-center " +
  "tw:border tw:border-[var(--bk-alpha-accent-15)] tw:bg-[var(--bk-accent-subtle)] tw:text-blue-700";

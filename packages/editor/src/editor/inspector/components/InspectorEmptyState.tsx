/* @lint-hex-policy: component-theme
   "Template applied." success banner uses a slightly brighter emerald than
   canonical --buildrick-success — intentional tonal choice for the post-apply
   celebration state. */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";
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
          <h3 className={`${TITLE} tw:mb-1 tw:text-[var(--bk-success)]`}>Template applied.</h3>
          {/* was color: var(--bk-success-tint) — a BACKGROUND tone used as text,
              i.e. pale green on pale green. The name was barely readable. */}
          <p className={`${DESCRIPTION} tw:mb-3 tw:text-[var(--bk-ink)]`}>
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

  /* Board 159:99 draws this state as TWO LINES: a muted sentence and one accent
     link to the AI. What it replaces was an icon circle, an h3, a description,
     a two-button CTA stack (Open Build Panel / Browse Templates) and a keyboard
     tip — six blocks of chrome for "nothing is selected".

     Neither CTA loses its destination: Insert is a rail button and Templates
     opens from ⌘K and the Pages panel, so the capability is untouched. What
     changes is that an empty panel stops advertising them. And the one action
     the board does keep is the AI entry, which is the same one the inspector
     header carries as `✦ AI` — one answer to "I do not know what to do next",
     not three. */
  return (
    <div role="status" aria-live="polite" aria-label="No element selected" className={CONTAINER}>
      <p className={DESCRIPTION}>Select something on the canvas to edit it.</p>
      {composer && (
        <Button
          color="light"
          size="xs"
          data-testid="inspector-empty-ask-ai"
          onClick={() => composer.emit("ui:switch-tab", { tab: "ai" })}
          variant="link" className="tw:min-h-6 tw:mt-1 tw:font-normal"
        >
          ✦ Ask AI ›
        </Button>
      )}
    </div>
  );
};

// ============================================================================
// CLASSES
// ============================================================================

/* Board 159:99 sets this line where the first row of a real inspector would
   be — near the top, not floating in the middle of an 812px column. Centring
   it made the panel read as a placeholder screen rather than a panel waiting
   for a selection. */
const CONTAINER =
  "tw:flex tw:flex-col tw:items-center tw:px-4 tw:pt-12 tw:pb-6 " +
  "tw:text-center tw:text-[var(--bk-ink-soft)]";
const TITLE = "tw:mb-2 tw:text-sm tw:font-semibold tw:text-[var(--bk-ink)]";
/* No max-width: the board's sentence sits on one line inside the panel's
   own padding; capping it at 220px broke it across two. */
const DESCRIPTION = "tw:m-0 tw:text-[13px] tw:leading-normal tw:text-[var(--bk-ink-muted)]";
const TIP = "tw:mt-5 tw:px-3 tw:py-2 tw:rounded-md tw:bg-blue-50 tw:text-[11px] tw:text-[var(--bk-ink-soft)]";
/** Success banner after a template applies — success tokens, not a hand-mixed green. */
const APPLIED_BANNER =
  "tw:w-full tw:max-w-55 tw:px-4 tw:py-3 tw:rounded-lg tw:text-center " +
  "tw:border tw:border-[var(--bk-success)] tw:bg-[var(--bk-success-tint)]";
/* Board 1175:4841 draws this as the primary action it is — solid accent, not
   a pale tint of it. */
const APPLIED_ACTION =
  "tw:block tw:px-3 tw:py-2 tw:rounded-md tw:text-[12px] tw:font-medium tw:text-center " +
  "tw:border-transparent tw:bg-[var(--bk-accent)] tw:text-white";

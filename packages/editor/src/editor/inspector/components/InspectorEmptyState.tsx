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
      <div role="status" aria-live="polite" className={CONTAINER_APPLIED}>
        <div className={APPLIED_BANNER}>
          <h3 className={`${TITLE} tw:mb-1 tw:text-[var(--bk-success)]`}>Template applied.</h3>
          {/* was color: var(--bk-success-tint) — a BACKGROUND tone used as text,
              i.e. pale green on pale green. The name was barely readable. */}
          <p className={`${DESCRIPTION} tw:mb-3 tw:text-[var(--bk-ink)]`}>
            {appliedName}
          </p>
          {composer && (
            <Button
              size="xs"
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
          variant="link" className="tw:min-h-6 tw:mt-2 tw:font-normal"
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

/* Top-left, at the panel's own 16px margin — where the first row of a real
   inspector would be, not floating in the middle of an 812px column.
   Boards 159:99 and 1175:4841 set every child at x=16: the sentence, the AI
   action, the template banner, the tip. Measured live 2026-08-31 after the
   change: sentence x17 y64, action x17 y92, against the board's x16 y64 / y92.
   Horizontally centred, the single action rendered as a 62px link adrift
   mid-panel above 700px of void; left-aligned it reads as the next step.

   The TOP padding is not shared: 159:99 opens its sentence at y64, while
   1175:4841 opens its banner at y14, so the template-applied branch overrides
   `pt-16` with `pt-4`. Applying one padding to both pushed the banner 63px
   down its own board. */
const CONTAINER_BASE =
  "tw:flex tw:flex-col tw:items-start tw:px-4 tw:pb-6 " +
  "tw:text-left tw:text-[var(--bk-ink-soft)]";
/* Exactly ONE `pt-*` per state, never a base plus an override. Appending
   `tw:pt-4` to a string already carrying `tw:pt-16` changes nothing: both
   compile, neither is more specific, and the stylesheet's order decides —
   measured, the element carried both classes and computed 64px. */
const CONTAINER = `${CONTAINER_BASE} tw:pt-16`;          // 159:99, sentence at y64
const CONTAINER_APPLIED = `${CONTAINER_BASE} tw:pt-4`;   // 1175:4841, banner at y14
const TITLE = "tw:mb-2 tw:text-sm tw:font-semibold tw:text-[var(--bk-ink)]";
/* No max-width: the board's sentence sits on one line inside the panel's
   own padding; capping it at 220px broke it across two. */
const DESCRIPTION = "tw:m-0 tw:text-[13px] tw:leading-normal tw:text-[var(--bk-ink-muted)]";
const TIP = "tw:mt-5 tw:px-3 tw:py-2 tw:rounded-md tw:bg-blue-50 tw:text-[11px] tw:text-[var(--bk-ink-soft)]";
/** Success banner after a template applies — success tokens, not a hand-mixed green. */
const APPLIED_BANNER =
  "tw:w-full tw:max-w-55 tw:px-4 tw:py-3 tw:rounded-lg tw:text-left " +
  "tw:border tw:border-[var(--bk-success)] tw:bg-[var(--bk-success-tint)]";
/* Board 1175:4841 draws this as the primary action it is — solid accent, not
   a pale tint of it. */
/* Sized to its label, not to the banner: board 1175:4841 draws it 113px wide
   inside a 288px banner. Full-width it read as a section footer. */
/* `size="xs"` on the Button, not a height class here: flowbite ships its own
   `h-10`, and a competing `h-*` in this string loses on stylesheet order the
   same way the padding did. */
const APPLIED_ACTION =
  "tw:inline-block tw:min-h-0 tw:rounded-md tw:text-[12px] tw:font-medium tw:text-center " +
  "tw:border-transparent tw:bg-[var(--bk-accent)] tw:text-white";

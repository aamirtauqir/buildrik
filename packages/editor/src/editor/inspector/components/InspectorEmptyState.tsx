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
          <h3 className={APPLIED_TITLE}>Template applied!</h3>
          {/* was color: var(--bk-success-tint) — a BACKGROUND tone used as text,
              i.e. pale green on pale green. The name was barely readable. */}
          <p className={APPLIED_NAME}>{appliedName}</p>
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
        <div className={TIP}>
          <span className="tw:opacity-70">Tip:</span> Click an element to edit its properties
        </div>
      </div>
    );
  }

  /* Board 4428:44164 (v3): the no-selection column is a centred pair — a
     600 "Nothing selected" over a muted two-line hint. The 159:99 version
     this replaces was a single top-aligned sentence plus "✦ Ask AI ›"; v3
     draws no AI link here (the header's ✦ AI is the AI door once something
     is selected). */
  return (
    <div role="status" aria-live="polite" aria-label="No element selected" className={CONTAINER} data-testid="inspector-empty">
      <p className={EMPTY_TITLE} data-testid="inspector-empty-title">Nothing selected</p>
      <p className={DESCRIPTION} data-testid="inspector-empty-text">
        Click an element on the canvas to edit its style, settings and effects.
      </p>
    </div>
  );
};

// ============================================================================
// CLASSES
// ============================================================================

/* Top-left, at the panel's own 16px margin — where the first row of a real
   inspector would be, not floating in the middle of an 812px column.
   Boards 159:99 and 1175:4841 place both text nodes as a 268px block
   centred in the 300px panel (x16..x284) — for the sentence that box is
   as wide as the line itself, so left vs centre is invisible; the AI link's
   box is the same 268px even though the glyphs are ~62px, and the panel's
   own `text-center` ancestor centres them inside it. Read literally as
   "box starts at x16" (a metadata-only read, not the rendered image) this
   looked like a flush-left action; the board's own screenshot shows it
   centred under the sentence, so the sentence stays flush (`DESCRIPTION`)
   and the link gets `self-center` on its own.

   The TOP padding is not shared: 159:99 opens its sentence at y64, while
   1175:4841 opens its banner at y14, so the template-applied branch overrides
   `pt-16` with `pt-4`. Applying one padding to both pushed the banner 63px
   down its own board. */
const CONTAINER_BASE =
  "tw:flex tw:flex-col tw:px-4 tw:text-[var(--bk-ink-soft)]";
/* Exactly ONE `pt-*` per state, never a base plus an override. Appending
   `tw:pt-4` to a string already carrying `tw:pt-16` changes nothing: both
   compile, neither is more specific, and the stylesheet's order decides —
   measured, the element carried both classes and computed 64px. */
/* 159:100 is a 160px block with `text-center`, and BOTH its text nodes are
   268-wide boxes at `left-[150px] -translate-x-1/2` — i.e. the panel's full
   content width, centred. The read this replaces ("box starts at x16, so the
   sentence is flush left") came from the box's left EDGE and missed both the
   centring transform and the `text-center` on their parent. `items-stretch`
   gives each child that 268 box; the container's own `text-center` places the
   glyphs inside it. */
/* Board 4428:44164: vertically and horizontally centred in the column. */
const CONTAINER = `${CONTAINER_BASE} tw:h-full tw:min-h-40 tw:items-center tw:justify-center tw:gap-1 tw:text-center`;
const EMPTY_TITLE = "tw:m-0 tw:text-[13px] tw:leading-5 tw:font-semibold tw:text-[var(--bk-ink)]";
const CONTAINER_APPLIED = `${CONTAINER_BASE} tw:items-start tw:pb-6 tw:text-left tw:pt-4`; // 1175:4841, banner at y14
/* Board 1175:4843/4844 — 12 semibold in the success ink and the template's own
   name at 11 under it. It was 14 over 13, both a step too loud for a banner
   the board draws 87 tall. */
const APPLIED_TITLE = "tw:m-0 tw:text-[12px] tw:font-semibold tw:text-[var(--bk-success-text)]";
const APPLIED_NAME = "tw:m-0 tw:text-[11px] tw:leading-normal tw:text-[var(--bk-ink-soft)]";
/* No max-width: the board's sentence sits on one line inside the panel's
   own padding; capping it at 220px broke it across two. */
const DESCRIPTION = "tw:m-0 tw:max-w-[220px] tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]";
/* Board 1175:4847 sets the tip at 10; the DS type scale floors at 11 and
   `gate:design-debt-ratchet` locks off-scale sizes at zero, so 11 it is. */
const TIP = "tw:mt-2.5 tw:text-[11px] tw:text-[var(--bk-ink-muted)]";
/** Success banner after a template applies — success tokens, not a hand-mixed green. */
const APPLIED_BANNER =
  "tw:flex tw:w-full tw:flex-col tw:items-start tw:gap-1.5 tw:px-3 tw:py-2.5 " +
  "tw:rounded-lg tw:text-left tw:bg-[var(--bk-success-tint)]";
/* Board 1175:4841 draws this as the primary action it is — solid accent, not
   a pale tint of it. */
/* Sized to its label, not to the banner: board 1175:4841 draws it 113px wide
   inside a 288px banner. Full-width it read as a section footer. */
/* `size="xs"` gives the flowbite Button its own fixed `h-8` (32px, not the
   board's 27). `min-h-*` is a DIFFERENT property from `h-*` so it never
   contested that base class — measured 32px with `min-h-6` still in place.
   `h-auto` IS the same twMerge group as `h-8` and wins as the later class,
   letting the padding (py-7 top/bottom + the 11px label) size it to 27. */
const APPLIED_ACTION =
  "tw:inline-block tw:h-auto tw:min-h-6 tw:rounded-md tw:px-3 tw:py-[7px] tw:text-[11px] tw:font-medium tw:text-center " +
  "tw:border-transparent tw:bg-[var(--bk-accent)] tw:text-white";

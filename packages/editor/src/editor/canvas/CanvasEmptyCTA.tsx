/**
 * CanvasEmptyCTA — board 4428:44164 (Canvas · empty page · About).
 *
 * The board draws an empty page as five things, top to bottom: the title
 * ("This page is empty"), one sentence naming the three ways forward, a row
 * of three template cards, and a row of four actions — Browse all templates ·
 * Add a block · ✦ Describe your site · Start blank. What shipped before was
 * board 65:2's first-run pair (one sentence, Browse templates / Start blank),
 * which offered less than the design (G2-018).
 *
 * The three cards are the first three site templates of the catalogue
 * (`SITE_TEMPLATES` is the same list the Templates panel opens on) — the
 * board's Restaurant · Bistro Menu · Autumn are sample data; the SHAPE is the
 * contract. A card opens the Templates panel the way Browse all does: the
 * panel owns apply, backup and confirm (G2-098), and this surface does not
 * grow a second copy of that flow. Its swatch is the template's own
 * `gradient` — a swatch whose fill IS the value is the one inline style
 * DESIGN.md allows.
 *
 * Board 807:6558 is what Start blank leads to — the Insert drawer open, and
 * this sentence replaced by the next instruction rather than removed. Pressing
 * it used to hide the CTA and nothing else, which left a first-time user on an
 * empty canvas with no drawer, no guidance and nothing to press.
 *
 * Board 65:2's first-run coach mark over the rail lives in
 * `editor/onboarding/RailCoach.tsx`, which owns its copy and its dismissal.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import { SITE_TEMPLATES } from "@/editor/sidebar/tabs/templates/templatesData";
import type { FrameSpan } from "./hooks/useVisibleFrameSpan";

interface CanvasEmptyCTAProps {
  onBrowseTemplates: () => void;
  onAddBlock: () => void;
  onDescribe: () => void;
  onStartBlank: () => void;
  /**
   * Board 807:6558 — after Start blank. The page is still empty, so the
   * invitation stays; it becomes the next instruction and drops its cards and
   * buttons, because the Insert drawer it just opened is where the next act is.
   */
  started?: boolean;
  /** The part of the frame on screen (useVisibleFrameSpan). The frame can be
   *  wider than its viewport, and a CTA centred on the frame hid "Start blank"
   *  under the inspector. Absent → the whole frame. */
  span?: FrameSpan | null;
}

/** The board's three cards. */
const CARD_COUNT = 3;

export function CanvasEmptyCTA({
  onBrowseTemplates,
  onAddBlock,
  onDescribe,
  onStartBlank,
  started,
  span,
}: CanvasEmptyCTAProps): React.ReactElement {
  const cards = SITE_TEMPLATES.slice(0, CARD_COUNT);
  return (
    <div
      className="bd-canvas-empty-cta"
      role="status"
      aria-label="Canvas is empty"
      data-testid="canvas-empty-cta"
      style={span ? { left: span.left, width: span.width, right: "auto" } : undefined}
    >
      {started ? (
        <p className="bd-canvas-empty-cta__title" data-testid="canvas-empty-cta-title">
          Drop an element from the Insert panel, or drag a section.
        </p>
      ) : (
        <>
          <p className="bd-canvas-empty-cta__title" data-testid="canvas-empty-cta-title">
            This page is empty
          </p>
          <p className="bd-canvas-empty-cta__subtitle" data-testid="canvas-empty-cta-subtitle">
            Start with a template, drop a block, or describe your site.
          </p>
          <ul className="bd-canvas-empty-cta__cards" data-testid="canvas-empty-cta-cards">
            {cards.map((t) => (
              <li key={t.id}>
                <Button
                  color="light"
                  className={CARD}
                  data-testid={`canvas-empty-template-${t.id}`}
                  aria-label={`Start from the ${t.name} template`}
                  onClick={onBrowseTemplates}
                >
                  <span className="bd-canvas-empty-cta__swatch" aria-hidden="true" style={{ background: t.gradient }} />
                  <span className="bd-canvas-empty-cta__card-name">{t.name}</span>
                </Button>
              </li>
            ))}
          </ul>
          <div className="bd-canvas-empty-cta__actions" data-testid="canvas-empty-cta-actions">
            <Button color="light" onClick={onBrowseTemplates} className={SECONDARY} data-testid="canvas-empty-browse">
              Browse all templates
            </Button>
            <Button onClick={onAddBlock} className={PRIMARY} data-testid="canvas-empty-add-block">
              Add a block
            </Button>
            <Button color="light" onClick={onDescribe} className={SECONDARY} data-testid="canvas-empty-describe">
              ✦ Describe your site
            </Button>
            <Button color="light" onClick={onStartBlank} className={SECONDARY} data-testid="canvas-empty-start-blank">
              Start blank
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/* Board 338:2326 is a real Button COMPONENT instance and settles the primary:
   32 tall, 16 across, 10 top/bottom, radius 8. flowbite's size-md defaults are
   h-10/px-5, and only a SAME-property utility unseats them — `tw:h-8` does,
   a `min-h` would not (CLAUDE.md §Chrome Routing). The one primary on the
   row is Add a block — the board's other three are quiet. */
const PRIMARY = "tw:h-8 tw:px-4 tw:py-2.5 tw:rounded-lg";
const SECONDARY = "tw:h-8 tw:px-[14px] tw:rounded-lg tw:text-[13px] tw:leading-5";
/* A card is a column: swatch over name, on a hairline, the whole thing a
   button. `h-auto` unseats flowbite's h-10 so the swatch can set the height. */
const CARD =
  "tw:h-auto tw:min-h-0 tw:w-[132px] tw:flex-col tw:items-stretch tw:gap-2 tw:p-2 tw:rounded-lg " +
  "tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-card)] tw:text-[var(--bk-ink)] tw:hover:border-[var(--bk-accent)]";

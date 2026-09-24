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
 * grow a second copy of that flow. Its thumbnail is the board's light
 * wireframe, drawn in CSS.
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
  /** The part of the frame on screen (useVisibleFrameSpan). The frame can be
   *  wider than its viewport, and a CTA centred on the frame hid "Start blank"
   *  under the inspector. Absent → the whole frame. */
  span?: FrameSpan | null;
  /** The canvas zoom as a fraction. The CTA lives inside the scaled frame so
   *  drops over it reach the frame, but it is chrome: it counter-scales so its
   *  type and buttons stay at 1:1 when the page is fitted (board 4428:44164
   *  draws a readable CTA inside a scaled page card). */
  scale?: number;
}

function ctaBoxStyle(span: FrameSpan | null | undefined, scale: number): React.CSSProperties | undefined {
  if (!span && scale === 1) return undefined;
  const left = span?.left ?? 0;
  const style: React.CSSProperties = { left, right: "auto", bottom: "auto", top: 0 };
  style.width = span ? span.width * scale : `${100 * scale}%`;
  style.height = `${100 * scale}%`;
  if (scale !== 1) {
    style.transform = `scale(${1 / scale})`;
    style.transformOrigin = "0 0";
  }
  return style;
}

/** The board's three cards. */
const CARD_COUNT = 3;

export function CanvasEmptyCTA({
  onBrowseTemplates,
  onAddBlock,
  onDescribe,
  onStartBlank,
  span,
  scale = 1,
}: CanvasEmptyCTAProps): React.ReactElement {
  const cards = SITE_TEMPLATES.slice(0, CARD_COUNT);
  return (
    <div
      className="bd-canvas-empty-cta"
      role="status"
      aria-label="Canvas is empty"
      data-testid="canvas-empty-cta"
      style={ctaBoxStyle(span, scale)}
    >
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
                  {/* Board 4428:44164: a light wireframe thumbnail with the
                      name under it, left-aligned — not a dark colour swatch. */}
                  <span className="bd-canvas-empty-cta__thumb" aria-hidden="true">
                    <span className="bd-canvas-empty-cta__thumb-bar" />
                    <span className="bd-canvas-empty-cta__thumb-row">
                      <span />
                      <span />
                      <span />
                    </span>
                  </span>
                  <span className="bd-canvas-empty-cta__card-name">{t.name}</span>
                </Button>
              </li>
            ))}
          </ul>
          <div className="bd-canvas-empty-cta__actions" data-testid="canvas-empty-cta-actions">
            {/* Board 4428:44164: Browse all templates is the primary; Add a
                block and Describe are bordered secondaries; Start blank is a
                plain text action. */}
            <Button onClick={onBrowseTemplates} className={PRIMARY} data-testid="canvas-empty-browse">
              Browse all templates
            </Button>
            <Button color="light" onClick={onAddBlock} className={SECONDARY} data-testid="canvas-empty-add-block">
              Add a block
            </Button>
            <Button color="light" onClick={onDescribe} className={SECONDARY} data-testid="canvas-empty-describe">
              ✦ Describe your site
            </Button>
            <Button color="light" onClick={onStartBlank} className={TEXT_ACTION} data-testid="canvas-empty-start-blank">
              Start blank
            </Button>
          </div>
      </>
    </div>
  );
}

/* Board 338:2326 is a real Button COMPONENT instance and settles the primary:
   32 tall, 16 across, 10 top/bottom, radius 8. flowbite's size-md defaults are
   h-10/px-5, and only a SAME-property utility unseats them — `tw:h-8` does,
   a `min-h` would not (CLAUDE.md §Chrome Routing). The one primary on the
   row is Browse all templates (board 4428:44164). */
const PRIMARY = "tw:h-8 tw:px-4 tw:py-2.5 tw:rounded-lg";
const SECONDARY = "tw:h-8 tw:px-[14px] tw:rounded-lg tw:text-[13px] tw:leading-5";
const TEXT_ACTION =
  "tw:h-8 tw:px-[14px] tw:rounded-lg tw:text-[13px] tw:leading-5 tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)]";
/* A card is a column: thumbnail over name, the whole thing a button.
   `h-auto` unseats flowbite's h-10 so the thumbnail sets the height. */
const CARD =
  "tw:h-auto tw:min-h-0 tw:w-[148px] tw:flex-col tw:items-start tw:gap-1.5 tw:p-0 tw:rounded-md " +
  "tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink)]";

/**
 * The starter card grid.
 *
 * It lived inside StarterGalleryModal, whose first-run modal was replaced by
 * the Brand › Starters destination (b80cde29) — the modal's only opener was a
 * "Browse themes" button that the destination removed, leaving the modal
 * mounted and unreachable (its UI_OPEN_STARTERS listener had no emitter, which
 * is how the seam scan found it). The grid is the part that ships, so it lives
 * on its own.
 *
 * Board 152:137 draws two columns in a 320 panel, swatch + name.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import { STARTER_DS_REGISTRY, type StarterDS } from "../starters";

/** The card grid, shared by the first-run modal and the Brand > Starters
 *  destination (board 152:137, which draws two columns in a 320 panel). */
export function StarterGrid({
  columns,
  selectedId,
  onSelect,
  showDescription = true,
}: {
  columns: number;
  selectedId: string;
  onSelect: (id: string) => void;
  /** Board 152:137 draws a card as swatch + NAME. The destination passes
   *  false; the first-run modal, which has room and a different board, keeps
   *  the line. Truncated to "Clean blue bra…" it was neither. */
  showDescription?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Starter design systems"
      /* Board 152:137 (redrawn at 280 on 2026-09-02): a 16/12 inset, 16 between
         cards, two 116-wide cards per row. */
      data-testid="starter-grid"
      style={{
        padding: "12px 16px",
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 16,
      }}
    >
      {STARTER_DS_REGISTRY.map((s) => (
        <StarterCard
          key={s.id}
          starter={s}
          selected={s.id === selectedId}
          onSelect={() => onSelect(s.id)}
          showDescription={showDescription}
        />
      ))}
    </div>
  );
}

interface StarterCardProps {
  starter: StarterDS;
  selected: boolean;
  onSelect: () => void;
  showDescription?: boolean;
}

function StarterCard({ starter, selected, onSelect, showDescription = true }: StarterCardProps) {
  // Fallback swatch for a starter with no color-primary. Was the retired
  // cobalt; the seed's own brand blue is the only honest stand-in.
  const primary = starter.tokens.find((t) => t.id === "color-primary")?.value ?? "#1A56DB";
  const background = starter.tokens.find((t) => t.id === "color-background")?.value ?? "#fff";
  const text = starter.tokens.find((t) => t.id === "color-text")?.value ?? "#0f172a";

  return (
    <Button
      type="button"
      color="light"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      data-testid={`starter-card-${starter.id}`}
      /* tw:h-auto and friends restate what flowbite's Button theme sets
         (h-10, justify-center, items-center, font-medium) — without them the
         card locked to 40px: the 80px gradient squashed to 17px and the
         description clipped mid-line with its ellipsis below the fold. Found
         live 2026-08-13; the CLAUDE.md menu/pill trap, on a card. */
      /* `gap-1.5` + a padding-free name block, because 152:148 states the card
         as a 6px column gap rather than a top pad on the label — measured, the
         two are the same 6px but only one of them is what the board says, and
         `gap` is a property the conformance diff can read. */
      /* `h-26` is 104, which is what 152:148 states — thumb 76 + the 6px gap +
         the 18px caption is 100, and the board keeps the extra 4 under the
         caption so all six cards land on one baseline whatever their name
         wraps to. `h-auto` measured 100 and the row rhythm drifted by 4 a row. */
      className={`tw:h-26 tw:items-stretch tw:justify-start tw:text-left tw:font-normal tw:gap-1.5 tw:rounded-lg tw:overflow-hidden tw:flex tw:flex-col tw:bg-transparent tw:p-0 ${
        selected
          ? "tw:border-2 tw:border-[var(--bk-accent)] tw:[box-shadow:0_0_0_2px_var(--bk-accent-subtle)]"
          : "tw:border-0 tw:shadow-none"
      }`}
    >
      {/* radius 6, height 76 — 152:149. The board fills the thumb a flat
          `--color/bg-subtle` on all six cards, which is a placeholder rather
          than a design decision: six identical grey rectangles would leave the
          gallery with nothing to tell Stripe Blue from Linear Dark but the
          caption. The starter's own primary/background is the card's only
          differentiator, so the fill stays and the board's geometry is what is
          conformed. Recorded as not-conformed in surfaces/brand-starters.json. */}
      <div
        data-testid={`starter-thumb-${starter.id}`}
        style={{
          height: 76,
          borderRadius: 6,
          background: `linear-gradient(135deg, ${primary}, ${background})`,
          display: "grid",
          placeItems: "center",
          color: text,
          fontSize: 12,
          fontWeight: 600,
        }}
        aria-hidden="true"
      >
        {/* Board 152:137 names a starter once, under its swatch. The name sat
            in the swatch AND under it, so every card said it twice — and the
            copy inside a gradient was the least readable of the two. */}
      </div>
      <div>
        {/* 12/18 in `--color/ink-soft` (152:150). The line-height was inherited
            from flowbite's `text-sm` on the Button above it, which is 20 and
            only correct at 14px. */}
        <div
          data-testid={`starter-name-${starter.id}`}
          style={{ fontSize: 12, lineHeight: "18px", fontWeight: 400, color: "var(--bk-ink-soft)" }}
        >
          {starter.name}
        </div>
        {showDescription ? (
          <div
            style={{
              fontSize: 11,
              color: "var(--bk-ink-muted)",
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {starter.description}
          </div>
        ) : null}
      </div>
    </Button>
  );
}

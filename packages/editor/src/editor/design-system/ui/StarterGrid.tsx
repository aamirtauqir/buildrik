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
      style={{
        padding: "24px 28px",
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 12,
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
      /* tw:h-auto and friends restate what flowbite's Button theme sets
         (h-10, justify-center, items-center, font-medium) — without them the
         card locked to 40px: the 80px gradient squashed to 17px and the
         description clipped mid-line with its ellipsis below the fold. Found
         live 2026-08-13; the CLAUDE.md menu/pill trap, on a card. */
      className={`tw:h-auto tw:items-stretch tw:justify-start tw:text-left tw:font-normal tw:rounded-lg tw:overflow-hidden tw:flex tw:flex-col tw:bg-white tw:p-0 ${
        selected
          ? "tw:border-2 tw:border-[var(--bk-accent)] tw:[box-shadow:0_0_0_2px_var(--bk-accent-subtle)]"
          : "tw:border tw:border-[var(--bk-gray-200)] tw:shadow-none"
      }`}
    >
      <div
        style={{
          height: 80,
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
      <div style={{ padding: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--bk-ink)" }}>
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

/**
 * StartersSection — Brand › Starters, board 7316:85139 (C1 (ii); was the
 * drawer's 152:137 / 306:2186 grid).
 *
 * One card, a 48px row per starter: its name over "<fonts> · <colour>"
 * (the description rides in the row's title), ending in ›. The ROW is the control, as the card was: a click APPLIES the
 * starter's values to the site in one write (useApplyStarter) — the header's
 * caption says so ("Pick a starter to apply it to the site"), the canvas and
 * live preview repaint, ⌘Z or Review changes takes it back. The chosen row
 * stays tinted for the visit.
 *
 * Gone with the grid, none of it on the board: the gradient thumbnails, the
 * 150px warning callout and the "Starter applied" pill (the tinted row and
 * Review changes carry that now). StarterGrid had no other consumer and is deleted.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { STARTER_DS_REGISTRY } from "../../starters";
import { useApplyStarter } from "../../state/useApplyStarter";
import { useTypeRegistry } from "../../state/TokenRegistryContext";
import type { StarterDS } from "../../starters/types";
import { BrandCard, BrandChevron, BrandRow } from "../BrandCard";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";

export interface StartersSectionProps {
  projectId?: string | null;
  /** BRP1-M11's door (behind dsAi): absent → no row. */
  onOpenFromSource?: () => void;
}

const family = (v: string | null | undefined) => String(v ?? "").split(",")[0].trim().replace(/^["']|["']$/g, "");

/**
 * 7316:85139's line under a starter: "<fonts> · <colour>" ("Playfair + Inter ·
 * terracotta"). Starters carry no font tokens — applying one keeps the site's
 * fonts — so the fonts are the site's own (heading + body when they differ),
 * and the colour is the starter's primary on its page colour.
 */
function starterLine(starter: StarterDS, headingFont: string, bodyFont: string): string {
  const fonts = headingFont && headingFont !== bodyFont ? `${headingFont} + ${bodyFont}` : bodyFont;
  const hex = (id: string) => resolveTokenLiteral(starter.tokens, id, "light")?.toUpperCase();
  const primary = hex("color-primary");
  const page = hex("color-background");
  const colour = primary ? (page ? `${primary} on ${page}` : primary) : "";
  return [fonts, colour].filter(Boolean).join(" · ");
}

export const StartersSection: React.FC<StartersSectionProps> = ({ projectId, onOpenFromSource }) => {
  const type = useTypeRegistry();
  const headingFont = family(resolveTokenLiteral(type.tokens, "font-heading", "light"));
  const bodyFont = family(resolveTokenLiteral(type.tokens, "font-body", "light"));
  const [selectedId, setSelectedId] = React.useState<string>("");
  const applyStarter = useApplyStarter(projectId);

  return (
    <>
    {onOpenFromSource && (
      <div className="tw:mb-4">
        <BrandCard label="Your own brand" data-testid="starter-from-source">
          <BrandRow
            data-testid="starter-row-from-source"
            onSelect={onOpenFromSource}
            trailing={<BrandChevron />}
            name="Brand from logo or website"
            sub="Colours and fonts from your logo or your current site"
          />
        </BrandCard>
      </div>
    )}
    <BrandCard label="Starter design systems" role="radiogroup" data-testid="starter-list">
      {STARTER_DS_REGISTRY.map((s) => (
        <BrandRow
          key={s.id}
          role="radio"
          aria-checked={selectedId === s.id}
          aria-pressed={undefined}
          data-testid={`starter-row-${s.id}`}
          selected={selectedId === s.id}
          onSelect={() => {
            setSelectedId(s.id);
            applyStarter(s.id);
          }}
          trailing={<BrandChevron />}
          name={<span data-testid={`starter-name-${s.id}`}>{s.name}</span>}
          title={s.description}
          sub={<span data-testid={`starter-line-${s.id}`}>{starterLine(s, headingFont, bodyFont)}</span>}
        />
      ))}
    </BrandCard>
    </>
  );
};

export default StartersSection;

/**
 * TypographySection — Brand › Fonts & type styles, board 7316:81551 (C1 (ii);
 * was the drawer's 153:57 list half).
 *
 * One card: the three font roles (Heading · Body · Mono — "<family> · <role> ·
 * N weights"), then the type styles (the font-size tokens — "<family> · <size>").
 * A row click selects the token; the workspace draws its card in the right
 * column, where Change opens the font picker or the size field. The drawer's
 * type-scale editor (B/I toggles, desktop/mobile specimen) is not on the board
 * and went with it.
 *
 * The Brand panel had eight destinations and this was not one of them, so the
 * board's whole screen was missing: a site's fonts could be changed one type
 * token at a time under Tokens, and nothing anywhere answered "which fonts does
 * this site use, and in how many weights".
 *
 * Scope, per founder call 2026-08-16: the ACTIVE FONTS list ships now; the
 * board's "+ Add a font", `.woff2` drop zone and "I have a licence for this
 * font" checkbox do not. Those need somewhere to put a font file and a
 * publish-time `@font-face`, which is its own arc — and a drop zone that
 * accepts a file it cannot store is worse than no drop zone.
 *
 * The weight count is MEASURED off the element tree, not declared anywhere:
 * nothing in the token model records which weights of a family a site uses,
 * and a count that is not the truth is worse than no count (the same rule the
 * root's section counts follow). It answers the question a font manager exists
 * to answer — which weights would have to ship — rather than restating the
 * board's sample numbers.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import { EVENTS } from "../../../../shared/constants/events";
import { getDefaultStyles } from "../../../../shared/constants/defaultStyles";
import { DEFAULT_TOKENS } from "../../constants";
import type { DesignToken } from "../../types";
import { BrandCard, BrandChevron, BrandRow } from "../BrandCard";

export interface TypographySectionProps {
  composer?: Composer | null;
  /** The project's own type tokens; falls back to the seed when absent. */
  tokens?: readonly DesignToken[];
  selectedTokenId?: string | null;
  onSelectToken?: (tokenId: string) => void;
}

/** The three font slots the token model actually has, in the board's order. */
const FONT_SLOTS: Array<{ id: string; title: string; role: string }> = [
  { id: "font-heading", title: "Heading", role: "Display" },
  { id: "font-body", title: "Body", role: "Body" },
  { id: "font-mono", title: "Mono", role: "Mono" },
];

/* The type styles are the font-size tokens, named the way a designer names
   them, largest first (7316:81551 lists "Heading XL" above "Body text"). The
   family is the one the site's CSS gives that role: headings take the display
   face, the rest the body face — the same split `slotForType` makes. */
const STYLE_NAMES: Record<string, { name: string; slot: "font-heading" | "font-body"; element: string }> = {
  "font-size-4xl": { name: "Heading 1", slot: "font-heading", element: "h1" },
  "font-size-3xl": { name: "Heading 2", slot: "font-heading", element: "h2" },
  "font-size-2xl": { name: "Heading 3", slot: "font-heading", element: "h3" },
  "font-size-xl": { name: "Sub-heading", slot: "font-body", element: "h5" },
  "font-size-lg": { name: "Body large", slot: "font-body", element: "paragraph" },
  "font-size-base": { name: "Body text", slot: "font-body", element: "paragraph" },
  "font-size-sm": { name: "Caption", slot: "font-body", element: "text" },
  "font-size-xs": { name: "Caption XS", slot: "font-body", element: "text" },
};

const WEIGHT_NAMES: Record<string, string> = {
  "300": "Light", "400": "Regular", "500": "Medium", "600": "Semi Bold", "700": "Bold", "800": "Extra Bold",
};

/**
 * "<Family> <Weight> <size>/<line>" — 7316:81551's type-style line. The size
 * is the token's; the weight and line-height are what the canvas gives the
 * element that role names (DEFAULT_ELEMENT_STYLES), the line rounded to px.
 */
export function typeStyleLine(family: string, size: string, element: string): string {
  const d = getDefaultStyles(element);
  const px = parseFloat(size);
  const weight = WEIGHT_NAMES[d["font-weight"] ?? "400"] ?? d["font-weight"];
  const lh = parseFloat(d["line-height"] ?? "");
  const line = Number.isFinite(px) && Number.isFinite(lh) ? `${Math.round(px)}/${Math.round(px * lh)}` : size;
  return [family, weight, line].filter(Boolean).join(" ");
}

/** The type styles — the font-size tokens, largest first, each with its
 *  board line. Shared by Fonts & type styles and Styles (7316:82153). */
export function typeStyleRows(source: readonly DesignToken[]): Array<{ id: string; name: string; line: string }> {
  const order = Object.keys(STYLE_NAMES);
  return source
    .filter((t) => t.type === "font-size")
    .sort((a, b) => {
      const ia = order.indexOf(a.id);
      const ib = order.indexOf(b.id);
      return (ia === -1 ? order.length : ia) - (ib === -1 ? order.length : ib);
    })
    .map((t) => {
      const known = STYLE_NAMES[t.id];
      const family = familyOf(String(source.find((f) => f.id === (known?.slot ?? "font-body"))?.value ?? ""));
      return {
        id: t.id,
        name: known?.name ?? t.friendlyName ?? t.name,
        line: typeStyleLine(family, t.value, known?.element ?? "text"),
      };
    });
}

/** "N roles · M active fonts" — the page header's caption. */
export function fontsCaption(tokens: readonly DesignToken[]): string {
  const families = new Set(
    FONT_SLOTS.map(({ id }) => familyOf(String(tokens.find((t) => t.id === id)?.value ?? "")).toLowerCase())
      .filter(Boolean),
  );
  const roles = FONT_SLOTS.filter(({ id }) => tokens.some((t) => t.id === id)).length;
  return `${roles} role${roles === 1 ? "" : "s"} · ${families.size} active font${families.size === 1 ? "" : "s"}`;
}



/** `"Inter Tight"` and `Inter Tight, sans-serif` both name the same family. */
function familyOf(value: string): string {
  return String(value ?? "")
    .split(",")[0]
    .trim()
    .replace(/^["']|["']$/g, "");
}

/**
 * Distinct font-weights in use for a family, across every element on the site.
 * An element that names no weight still renders one, so a family that is used
 * at all is used in at least one weight.
 */
/**
 * Which font slot an element falls under when it names no family of its own.
 *
 * Almost no element does name one. `ElementManager` writes `font-family` only
 * when a user applies a font to a selection (`:405`); everything else inherits
 * from the site's own CSS, which binds these three tokens by their `cssVar`
 * (`--buildrick-design-font-heading` and friends). That is what a three-slot
 * font model means: headings take the display face, code takes the mono face,
 * and the rest take the body face.
 */
function slotForType(type: string): string {
  const t = type.toLowerCase();
  if (t === "heading" || /^h[1-6]$/.test(t)) return "font-heading";
  if (t === "code" || t === "pre") return "font-mono";
  return "font-body";
}

function weightsInUse(
  composer: Composer | null | undefined,
  family: string,
  slotId: string,
): number {
  const all = composer?.elements?.getAllElements?.() ?? [];
  const weights = new Set<string>();
  let used = false;
  for (const el of all) {
    const styles = el.getStyles?.() ?? {};
    const declared = familyOf(String(styles["font-family"] ?? ""));
    /*
      Two ways an element uses this face, and the row was only counting the
      rarer one. Matching solely on a DECLARED family meant a normally-built
      page — where nothing declares one — reported "not used yet" for every
      slot forever: a row whose stated job is to answer "in how many weights"
      that could not answer it at all.
    */
    const usesThisFace = declared
      ? declared.toLowerCase() === family.toLowerCase()
      : slotForType(String(el.getType?.() ?? "")) === slotId;
    if (!usesThisFace) continue;
    used = true;
    const w = String(styles["font-weight"] ?? "").trim();
    if (w) weights.add(w);
  }
  if (!used) return 0;
  return weights.size === 0 ? 1 : weights.size;
}

export const TypographySection: React.FC<TypographySectionProps> = ({
  composer,
  tokens,
  selectedTokenId = null,
  onSelectToken,
}) => {
  const source = tokens ?? DEFAULT_TOKENS;

  const read = React.useCallback(() => {
    return FONT_SLOTS.map(({ id, title, role }) => {
      const token = source.find((t) => t.id === id);
      const family = familyOf(String(token?.value ?? ""));
      return { id, title, role, family, weights: weightsInUse(composer, family, id) };
    }).filter((row) => row.family.length > 0);
  }, [composer, source]);

  const [rows, setRows] = React.useState(read);

  React.useEffect(() => {
    setRows(read());
    if (!composer) return;
    const refresh = () => setRows(read());
    composer.on(EVENTS.ELEMENT_UPDATED, refresh);
    composer.on(EVENTS.ELEMENT_CREATED, refresh);
    composer.on(EVENTS.ELEMENT_DELETED, refresh);
    return () => {
      composer.off(EVENTS.ELEMENT_UPDATED, refresh);
      composer.off(EVENTS.ELEMENT_CREATED, refresh);
      composer.off(EVENTS.ELEMENT_DELETED, refresh);
    };
  }, [composer, read]);

  const styles = React.useMemo(() => typeStyleRows(source), [source]);

  if (rows.length === 0 && styles.length === 0) {
    return (
      <p className="tw:m-0 tw:py-3 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]">
        No fonts set. Pick a starter or import a brand to set the site's fonts.
      </p>
    );
  }

  return (
    <BrandCard label="Fonts and type styles" data-testid="brand-typography">
      {rows.map((r) => (
        <BrandRow
          key={r.id}
          data-testid={`brand-type-row-${r.id}`}
          data-type-row="role"
          selected={selectedTokenId === r.id}
          onSelect={() => onSelectToken?.(r.id)}
          trailing={<BrandChevron />}
          name={r.title}
          sub={
            <>
              {/* The family is set IN the face it names — you can see the font
                  without leaving the page. */}
              <span data-testid={`brand-font-family-${r.id}`} style={{ fontFamily: `${r.family}, sans-serif` }}>{r.family}</span>
              {" · "}
              <span data-testid={`brand-font-role-${r.id}`}>{r.role}</span>
              {" · "}
              <span data-font-weights>
                {r.weights === 0 ? "not used yet" : `${r.weights} weight${r.weights === 1 ? "" : "s"}`}
              </span>
            </>
          }
        />
      ))}
      {styles.map((st) => (
        <BrandRow
          key={st.id}
          data-testid={`brand-type-row-${st.id}`}
          data-type-row="style"
          selected={selectedTokenId === st.id}
          onSelect={() => onSelectToken?.(st.id)}
          trailing={<BrandChevron />}
          name={st.name}
          sub={st.line}
        />
      ))}
    </BrandCard>
  );
};

export default TypographySection;

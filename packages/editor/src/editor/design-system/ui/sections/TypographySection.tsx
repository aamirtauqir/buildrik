/**
 * TypographySection — board 153:57 (Brand · Typography), list half.
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
import { DEFAULT_TOKENS } from "../../constants";
import type { DesignToken } from "../../types";

export interface TypographySectionProps {
  composer?: Composer | null;
  /** The project's own type tokens; falls back to the seed when absent. */
  tokens?: readonly DesignToken[];
}

/** The three font slots the token model actually has, in the board's order. */
const FONT_SLOTS: Array<{ id: string; role: string }> = [
  { id: "font-heading", role: "Display" },
  { id: "font-body", role: "Body" },
  { id: "font-mono", role: "Mono" },
];

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

export const TypographySection: React.FC<TypographySectionProps> = ({ composer, tokens }) => {
  const source = tokens ?? DEFAULT_TOKENS;

  const read = React.useCallback(() => {
    return FONT_SLOTS.map(({ id, role }) => {
      const token = source.find((t) => t.id === id);
      const family = familyOf(String(token?.value ?? ""));
      return { id, role, family, weights: weightsInUse(composer, family, id) };
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

  if (rows.length === 0) {
    return (
      <p className="tw:m-0 tw:px-3 tw:py-3 tw:text-xs tw:leading-normal tw:text-[var(--bk-ink-muted)]">
        No fonts set. Pick a font family under Tokens and it appears here.
      </p>
    );
  }

  return (
    <div data-testid="brand-typography">
      <div className="tw:flex tw:items-center tw:h-7 tw:px-3 tw:text-[11px] tw:leading-4 tw:font-medium tw:tracking-[0.5px] tw:text-[var(--bk-ink-muted)]">
        ACTIVE FONTS
      </div>
      <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:p-0">
        {rows.map((row) => (
          <li key={row.id} className="tw:flex tw:flex-col tw:gap-1 tw:px-3 tw:py-2">
            {/* The name is set IN the family it names — the board's whole point
                is that you can see the face without leaving the panel. */}
            <span
              className="tw:text-[17px] tw:leading-6 tw:text-[var(--bk-ink)]"
              style={{ fontFamily: `${row.family}, sans-serif` }}
            >
              {row.family}
            </span>
            <span className="tw:flex tw:items-center tw:gap-2">
              <span className="tw:rounded-full tw:bg-[var(--bk-bg-subtle)] tw:px-2 tw:py-0.5 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-soft)]">
                {row.role}
              </span>
              <span className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
                {row.weights === 0
                  ? "not used yet"
                  : `${row.weights} weight${row.weights === 1 ? "" : "s"} in use`}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TypographySection;

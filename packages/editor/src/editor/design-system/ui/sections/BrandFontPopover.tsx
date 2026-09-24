/**
 * BrandFontPopover — board 7318:81029 (Brand workspace · Font picker), opened
 * by a font role's `Change` on the Fonts & type styles page (7316:81551).
 *
 * The board's shape: a title, one line on what is being chosen, "Current
 * selection", the site's fonts as `<Family> · <source>` rows (the current one
 * tinted with a ✓), `Manage site fonts ›`, and Cancel. The rows are the SITE
 * fonts — the bundled ones (`themes/fonts.css`: Inter, Geist Mono → "Built
 * in") and the ADDED library fonts ("Uploaded", `useUploadedFonts`) — plus
 * the current family when it is neither (a Google or hand-typed pick,
 * "Custom"). Adding a font is Site fonts' job, hence the Manage link.
 *
 * `All fonts ›` (not drawn — owner ruling 2026-09-24, capabilities stay)
 * hands over to the full picker: Google fonts and a hand-typed stack.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "../../../../engine/Composer";
import { Button, Popover } from "@/editor/chrome-ui";
import { openSiteFonts, primaryFamily, useUploadedFonts } from "@/editor/inspector/sections/typography";

/** The families `themes/fonts.css` bundles with the editor. */
const BUILT_IN_FONTS = ["Inter", "Geist Mono"];

type FontSource = "Built in" | "Uploaded" | "Custom";

export interface BrandFontPopoverProps {
  open: boolean;
  onClose: () => void;
  trigger: React.ReactNode;
  /** The role being chosen for, e.g. "Body Font". */
  roleName: string;
  /** The token's current value — a bare family or a typed stack. */
  value: string;
  onPick: (family: string) => void;
  /** The full picker (Google fonts, a hand-typed stack). */
  onAllFonts: () => void;
  composer: Composer | null | undefined;
}

const LINK =
  "tw:h-auto tw:min-h-0 tw:p-0 tw:text-[length:var(--bk-text-12)] tw:font-normal tw:leading-4 tw:text-[var(--bk-accent-text)] tw:enabled:hover:no-underline";

export const BrandFontPopover: React.FC<BrandFontPopoverProps> = ({
  open,
  onClose,
  trigger,
  roleName,
  value,
  onPick,
  onAllFonts,
  composer,
}) => {
  const uploaded = useUploadedFonts(composer);
  const current = primaryFamily(value) || value;
  const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

  const options: Array<{ family: string; source: FontSource }> = [
    ...BUILT_IN_FONTS.map((family) => ({ family, source: "Built in" as const })),
    ...uploaded
      .filter((f) => !BUILT_IN_FONTS.some((b) => same(b, f.label)))
      .map((f) => ({ family: f.label, source: "Uploaded" as const })),
  ];
  if (current && !options.some((o) => same(o.family, current))) options.unshift({ family: current, source: "Custom" });
  const currentOption = options.find((o) => same(o.family, current));

  return (
    <Popover open={open} onClose={onClose} trigger={trigger} placement="bottom-end" label={`${roleName} font`}>
      <div className="tw:flex tw:w-70 tw:flex-col tw:gap-2 tw:p-3" data-testid="brand-font-popover">
        <div className="tw:text-[length:var(--bk-text-13)] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]">{roleName}</div>
        <p className="tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-soft)]">
          Brand › Fonts &amp; type styles › {roleName}. Choose the font this role uses across the site.
        </p>
        <div className="tw:flex tw:flex-col tw:gap-0.5">
          <span className="tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-muted)]">Current selection</span>
          <span className="tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]" data-testid="brand-font-current">
            {currentOption ? `${currentOption.family} · ${currentOption.source}` : "None"}
          </span>
        </div>
        <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:p-0" role="listbox" aria-label={`${roleName} options`}>
          {options.map((o) => {
            const selected = same(o.family, current);
            return (
              <li key={o.family} role="option" aria-selected={selected}>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => onPick(o.family)}
                  data-testid={`brand-font-option-${o.family}`}
                  className={`tw:h-8 tw:w-full tw:justify-between tw:rounded-md tw:px-2 tw:text-left tw:text-[length:var(--bk-text-13)] tw:font-normal tw:text-[var(--bk-ink)] ${
                    selected ? "tw:bg-[var(--bk-gray-100)]" : ""
                  }`}
                >
                  <span className="tw:truncate" style={{ fontFamily: `'${o.family}'` }}>
                    {o.family} · {o.source}
                  </span>
                  {selected ? (
                    <span aria-hidden="true" className="tw:text-[var(--bk-ink-muted)]">
                      ✓
                    </span>
                  ) : null}
                </Button>
              </li>
            );
          })}
        </ul>
        <div className="tw:flex tw:items-center tw:justify-between">
          <Button
            type="button"
            variant="link"
            className={LINK}
            onClick={() => {
              onClose();
              openSiteFonts(composer);
            }}
            data-testid="brand-font-manage"
          >
            Manage site fonts ›
          </Button>
          <Button type="button" variant="link" className={LINK} onClick={onAllFonts} data-testid="brand-font-all">
            All fonts ›
          </Button>
        </div>
        <Button type="button" variant="secondary" size="xs" className="tw:h-8 tw:w-full" onClick={onClose} data-testid="brand-font-cancel">
          Cancel
        </Button>
      </div>
    </Popover>
  );
};

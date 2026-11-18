/**
 * ColorFillPopover — the inspector's colour / token popover, board 33
 * (7995:209771). Opens beside the column, over the canvas (the trigger's
 * `Popover beside`, P-4).
 *
 * "Brand colours", one row per colour token — swatch, the token's name, its
 * hex, "Use" — then "Add colours in Brand", which opens Brand while the
 * selection is held (P-5). Below the board's content, a closed "Custom
 * colour" section holds the visual picker (owner decision 2026-09-28): its
 * Apply writes a raw colour, which unlinks a bound token in the same write
 * (one Undo step). Recent colours and Detach are not part of it.
 *
 * ✎ on a row (shown on hover / focus) opens the shared token's edit (2L9
 * 39:9114 panel 3): "Update {token} · Light" changes the Brand token, "Use on
 * selected element" writes the new colour on this element only (it detaches
 * the value). Pro adds the search and its "N of M match" line. Copy is the
 * 2L9 board's ("Brand colors", "Custom color").
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { ChevronDown, ChevronRight, ExternalLink, Search as SearchIcon } from "lucide-react";
import { Button, TextInput } from "@/editor/chrome-ui";
import { ColorPicker } from "@/editor/design-system/ui/colors/ColorPicker";
import type { TokenEntry } from "./TokenPickerPopover";

export interface ColorFillPopoverProps {
  tokens: TokenEntry[];
  /** The id of the token the value is bound to, if any. */
  boundTokenId: string | null;
  onSelectToken: (cssVarRef: string) => void;
  /** "Only this element": a raw colour, detached from the token. */
  onCustomValue: (hex: string) => void;
  /** "Update everywhere": the Brand token takes the new value. */
  onUpdateToken: (tokenId: string, hex: string) => void;
  /** Elements bound to a token (the "N×"). */
  usageOf: (tokenId: string) => number;
  /** Pro draws the search. */
  showSearch: boolean;
  /** "Add colours in Brand" — absent, the link is not drawn. */
  onOpenBrand?: () => void;
  /** The colour on screen (resolved when bound) — where the custom picker starts. */
  currentHex: string;
  /** "Color for {name}" / "{breakpoint} · {state}" — the popover's head (39:9114). */
  target?: { name: string; editing: string };
}

const HEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

const TEXT_12 = "tw:text-[length:var(--bk-text-12)] tw:leading-4";
const LINK =
  "tw:h-auto tw:min-h-0 tw:p-0 tw:text-[length:var(--bk-text-12)] tw:font-normal tw:leading-4 tw:text-[var(--bk-accent-text)] tw:enabled:hover:no-underline";

/** A token value as the board prints it: hex upper-cased, anything else as is. */
const shownValue = (value: string) => (/^#[0-9a-f]{3,8}$/i.test(value) ? value.toUpperCase() : value);

export const ColorFillPopover: React.FC<ColorFillPopoverProps> = ({
  tokens,
  boundTokenId,
  onSelectToken,
  onCustomValue,
  onUpdateToken,
  usageOf,
  showSearch,
  onOpenBrand,
  currentHex,
  target,
}) => {
  const [query, setQuery] = React.useState("");
  const [editing, setEditing] = React.useState<TokenEntry | null>(null);
  const [customOpen, setCustomOpen] = React.useState(false);

  /* 2L9 39:9114 panel 3, "Edit a shared token": two explicit owners — the
     shared Brand colour (its Light value: useUpdateColorEverywhere writes
     the light literal) or a local value on the selected element only. */
  if (editing) {
    const t = editing;
    const n = usageOf(t.id);
    return (
      <div className="tw:-m-2 tw:w-70" data-testid="fill-edit-token">
        <div className="tw:flex tw:flex-col tw:gap-1 tw:px-3 tw:pt-3">
          <Button type="button" variant="link" className={`${LINK} tw:self-center`} onClick={() => setEditing(null)} data-testid="fill-edit-back">
            ← Back to Brand colors
          </Button>
          <span className="tw:pt-1 tw:text-[length:var(--bk-text-13)] tw:font-semibold tw:leading-4 tw:text-[var(--bk-ink)]">{t.name}</span>
          <span className={`${TEXT_12} tw:text-[var(--bk-ink-muted)]`}>Editing shared Brand color</span>
          <span className={`${TEXT_12} tw:text-[var(--bk-ink-muted)]`} data-testid="fill-edit-usage">
            Known references · {n} in this site
          </span>
          {t.source ? (
            <span className={`${TEXT_12} tw:text-[var(--bk-ink-muted)]`} data-testid="fill-edit-source">
              Source · {t.source}
            </span>
          ) : null}
        </div>
        <ColorPicker
          initialHex={t.value}
          onChange={() => {}}
          onCancel={() => setEditing(null)}
          onSave={() => {}}
          actions={(hex, valid) => (
            <div className="tw:flex tw:flex-col tw:gap-2">
              <p className="tw:m-0 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
                Changes this token’s color; the original palette color stays unchanged.
              </p>
              <Button type="button" size="xs" className="tw:h-8 tw:w-full" disabled={!valid} onClick={() => onUpdateToken(t.id, hex)} data-testid="fill-edit-everywhere">
                Update {t.name} · Light
              </Button>
              <Button type="button" variant="secondary" size="xs" className="tw:h-8 tw:w-full" disabled={!valid} onClick={() => onCustomValue(hex.toUpperCase())} data-testid="fill-edit-only-this">
                Use on selected element
              </Button>
              <p className="tw:m-0 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
                Local use applies in Light and Dark. Other uses of the token stay unchanged.
              </p>
              <Button type="button" variant="link" className={`${LINK} tw:self-center tw:text-[13px] tw:text-[var(--bk-ink)]`} onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
          )}
        />
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const shown = q ? tokens.filter((t) => t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)) : tokens;

  /* Board 33: 280 wide, 12 in, rows 48 tall at 8 in. The Popover surface
     pads 8, so the frame steps out by 8 and pads 12 itself. */
  return (
    <div className="tw:-m-2 tw:flex tw:w-[278px] tw:flex-col tw:gap-1 tw:p-3" data-testid="fill-popover">
      {target ? (
        <div className="tw:mb-2 tw:flex tw:flex-col tw:gap-1 tw:border-b tw:border-[var(--bk-border)] tw:pb-3" data-testid="fill-target">
          <span className="tw:text-[length:var(--bk-text-13)] tw:font-semibold tw:leading-4 tw:text-[var(--bk-ink)]">Color for {target.name}</span>
          <span className={`${TEXT_12} tw:text-[var(--bk-ink-muted)]`}>{target.editing}</span>
        </div>
      ) : null}
      <p className="tw:m-0 tw:text-[length:var(--bk-text-13)] tw:font-medium tw:leading-4 tw:text-[var(--bk-ink-soft)]">Brand colors</p>

      {showSearch ? (
        <div className="tw:flex tw:flex-col tw:gap-1 tw:pt-1">
          <TextInput
            type="search"
            icon={SearchIcon}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search colors"
            aria-label="Search colors"
            data-testid="fill-search"
          />
          {q ? (
            <span className={`${TEXT_12} tw:text-[var(--bk-ink-muted)]`} data-testid="fill-search-count">
              {shown.length} of {tokens.length} match '{query.trim()}'
            </span>
          ) : null}
        </div>
      ) : null}

      {tokens.length === 0 ? (
        <p className={`tw:m-0 tw:py-2 ${TEXT_12} tw:text-[var(--bk-ink-muted)]`}>No brand colors yet.</p>
      ) : (
        /* Five rows show; a larger brand scrolls inside, so the Brand link
           stays on screen. */
        <ul className="tw:m-0 tw:flex tw:max-h-60 tw:list-none tw:flex-col tw:overflow-y-auto tw:p-0" aria-label="Brand colors">
          {shown.map((t) => (
            <li
              key={t.id}
              aria-current={t.id === boundTokenId ? "true" : undefined}
              className="tw:group tw:flex tw:h-12 tw:flex-none tw:items-center tw:gap-2 tw:px-2"
            >
              <span
                aria-hidden
                className="tw:size-6 tw:flex-none tw:rounded tw:border tw:border-[var(--bk-border)]"
                style={{ background: t.value }}
              />
              <span className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-0.5 tw:leading-4">
                <span data-token-name className="tw:truncate tw:text-[length:var(--bk-text-12)] tw:font-medium tw:text-[var(--bk-ink-soft)]" title={t.name}>
                  {t.name}
                </span>
                <span className="tw:truncate tw:text-[length:var(--bk-text-11)] tw:text-[var(--bk-ink-muted)] tw:[font-family:var(--bk-font-mono)] tw:tabular-nums">
                  {shownValue(t.value)}
                </span>
              </span>
              {/* Use comes first in the DOM, so opening the popover focuses it,
                  not the ✎ that is hidden at rest; order draws ✎ before it. */}
              <Button
                type="button"
                variant="secondary"
                aria-label={`Use ${t.name}`}
                onClick={() => onSelectToken(`var(${t.cssVar})`)}
                className="tw:order-2 tw:h-6 tw:w-[50px] tw:flex-none tw:rounded tw:border-[var(--bk-border)] tw:bg-[var(--bk-gray-50)] tw:p-0 tw:text-[length:var(--bk-text-12)] tw:font-medium tw:text-[var(--bk-ink-soft)] tw:focus:ring-0 tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]"
              >
                Use
              </Button>
              <Button
                type="button"
                variant="ghost"
                aria-label={`Edit ${t.name}`}
                onClick={() => setEditing(t)}
                className="tw:order-1 tw:h-6 tw:flex-none tw:border-0 tw:bg-transparent tw:px-2 tw:text-[length:var(--bk-text-13)] tw:font-normal tw:text-[var(--bk-ink)] tw:focus:ring-0 tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]"
              >
                Edit
              </Button>
            </li>
          ))}
        </ul>
      )}

      {onOpenBrand ? (
        <Button
          type="button"
          variant="ghost"
          onClick={onOpenBrand}
          className={`tw:h-6 tw:w-full tw:justify-center tw:gap-1 tw:rounded tw:border-0 tw:bg-transparent tw:px-2 tw:py-0 ${TEXT_12} tw:font-normal tw:text-[var(--bk-accent-text)] tw:hover:bg-[var(--bk-gray-50)] tw:focus:ring-0 tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]`}
        >
          Add colors in Brand
          <ExternalLink size={12} aria-hidden className="tw:flex-none" />
        </Button>
      ) : null}

      <div className="tw:mt-1 tw:border-t tw:border-[var(--bk-border)] tw:pt-1">
        <Button
          type="button"
          variant="ghost"
          aria-expanded={customOpen}
          aria-controls="fill-custom-colour"
          onClick={() => setCustomOpen((v) => !v)}
          className={`tw:h-8 tw:w-full tw:justify-center tw:gap-1 tw:rounded tw:border-0 tw:bg-transparent tw:px-2 tw:py-0 tw:text-[length:var(--bk-text-13)] tw:font-normal tw:text-[var(--bk-ink)] tw:hover:bg-[var(--bk-gray-50)] tw:focus:ring-0 tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]`}
        >
          Custom color
          {customOpen ? <ChevronDown size={12} aria-hidden /> : <ChevronRight size={12} aria-hidden />}
        </Button>
        {customOpen ? (
          <div id="fill-custom-colour" className="tw:-mx-3 tw:-mb-3" data-testid="fill-custom-picker">
            <ColorPicker
              initialHex={HEX.test(currentHex) ? currentHex : "#000000"}
              onChange={() => {}}
              onCancel={() => setCustomOpen(false)}
              onSave={(hex) => onCustomValue(hex.toUpperCase())}
              actions={(hex, valid) => (
                <div className="tw:flex tw:flex-col tw:gap-2">
                  <span className={`${TEXT_12} tw:text-[var(--bk-ink-muted)]`}>Local color · selected element</span>
                  <p className={`tw:m-0 ${TEXT_12} tw:text-[var(--bk-ink-muted)]`}>Applies a local value to the selected element. Brand colors remain unchanged.</p>
                  <div className="tw:flex tw:gap-2">
                    <Button type="button" variant="secondary" size="xs" className="tw:h-8 tw:flex-1" onClick={() => setCustomOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="button" size="xs" className="tw:h-8 tw:flex-1" disabled={!valid} onClick={() => onCustomValue(hex.toUpperCase())} data-testid="fill-custom-apply">
                      Apply
                    </Button>
                  </div>
                </div>
              )}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

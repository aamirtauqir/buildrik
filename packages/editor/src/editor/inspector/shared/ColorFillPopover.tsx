/**
 * ColorFillPopover — the inspector's colour picker (G3-155), boards
 * 4428:142922 (Fill), 6840:62765 (search, Pro) and 4428:142968 (Edit token).
 *
 * Three rows, in the board's order: BRAND (the colour tokens, a 3-column
 * grid of swatch + name, each with a ✎), RECENT (the last custom colours
 * applied here, always drawn), CUSTOM (a hex field, a swatch that opens the
 * one picker — G3-140's ColorPicker — and Detach, live while bound). Pro adds the
 * search field and its "N of M match" line, and the ✎ footnote.
 *
 * ✎ opens Edit <token>: the same picker without its foot, and the board's two
 * outcomes — "Update everywhere (N×)" changes the Brand token, "Only this
 * element" detaches this fill with the new colour.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { ChevronLeft, Pencil, Search as SearchIcon, X } from "lucide-react";
import { Button, IconButton, TextInput } from "@/editor/chrome-ui";
import { ColorPicker } from "@/editor/design-system/ui/colors/ColorPicker";
import type { TokenEntry } from "./TokenPickerPopover";

const RECENT_KEY = "bk-recent-colors";
const RECENT_MAX = 5;

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((v): v is string => typeof v === "string").slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

function pushRecent(hex: string): void {
  try {
    const next = [hex.toUpperCase(), ...readRecent().filter((v) => v.toUpperCase() !== hex.toUpperCase())].slice(0, RECENT_MAX);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* private window / blocked storage: RECENT simply stays empty */
  }
}

const HEX = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export interface ColorFillPopoverProps {
  /** The row's label — the header ("Fill"). */
  label: string;
  tokens: TokenEntry[];
  /** The id of the token the value is bound to, if any. */
  boundTokenId: string | null;
  /** The colour on screen (resolved when bound). */
  currentHex: string;
  onSelectToken: (cssVarRef: string) => void;
  /** A raw colour — custom, recent, detach, "Only this element". */
  onCustomValue: (hex: string) => void;
  /** "Update everywhere": the Brand token takes the new value. */
  onUpdateToken: (tokenId: string, hex: string) => void;
  /** Elements bound to a token (the "N×"). */
  usageOf: (tokenId: string) => number;
  /** Pro draws the search (6840:62765: "search in Advanced"). */
  showSearch: boolean;
  onClose: () => void;
}

const EYEBROW = "tw:text-[length:var(--bk-text-11)] tw:uppercase tw:tracking-[0.06em] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const SWATCH = "tw:min-h-0 tw:min-w-0 tw:rounded-md tw:border tw:border-[var(--bk-border)] tw:p-0";
const LINK =
  "tw:h-auto tw:min-h-0 tw:p-0 tw:text-[length:var(--bk-text-12)] tw:font-normal tw:leading-4 tw:text-[var(--bk-accent-text)] tw:enabled:hover:no-underline";

export const ColorFillPopover: React.FC<ColorFillPopoverProps> = ({
  label,
  tokens,
  boundTokenId,
  currentHex,
  onSelectToken,
  onCustomValue,
  onUpdateToken,
  usageOf,
  showSearch,
  onClose,
}) => {
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState<{ kind: "main" } | { kind: "custom" } | { kind: "edit"; token: TokenEntry }>({ kind: "main" });
  const [hexDraft, setHexDraft] = React.useState(currentHex.toUpperCase());
  const [recent, setRecent] = React.useState<string[]>(readRecent);

  const applyCustom = (hex: string) => {
    const full = (hex.startsWith("#") ? hex : `#${hex}`).toUpperCase();
    pushRecent(full);
    setRecent(readRecent());
    onCustomValue(full);
  };

  const q = query.trim().toLowerCase();
  const brand = q ? tokens.filter((t) => t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)) : tokens;

  if (view.kind === "edit") {
    const t = view.token;
    const n = usageOf(t.id);
    return (
      <div className="tw:-m-2 tw:w-70" data-testid="fill-edit-token">
        <div className="tw:flex tw:items-center tw:gap-2 tw:px-4 tw:pt-3">
          <IconButton label="Back" onClick={() => setView({ kind: "main" })} className="tw:size-5 tw:min-h-0 tw:min-w-0">
            <ChevronLeft size={14} aria-hidden />
          </IconButton>
          <span className="tw:text-[length:var(--bk-text-13)] tw:font-medium tw:text-[var(--bk-ink)]">Edit {t.name}</span>
          <span className="tw:text-[length:var(--bk-text-11)] tw:text-[var(--bk-ink-muted)]">used {n}×</span>
          <IconButton label="Close" onClick={onClose} className="tw:ml-auto tw:size-5 tw:min-h-0 tw:min-w-0">
            <X size={14} aria-hidden />
          </IconButton>
        </div>
        <div className="tw:mx-4 tw:mt-3 tw:rounded-md tw:px-3 tw:py-3 tw:text-[length:var(--bk-text-12)] tw:text-white" style={{ background: t.value }} data-testid="fill-edit-preview">
          {t.name} · {t.value.toUpperCase()}
        </div>
        <ColorPicker
          initialHex={t.value}
          onChange={() => {}}
          onCancel={() => setView({ kind: "main" })}
          onSave={() => {}}
          actions={(hex, valid) => (
            <div className="tw:flex tw:flex-col tw:gap-2">
              <Button type="button" variant="link" className={`${LINK} tw:self-start tw:text-[var(--bk-ink)]`} onClick={() => setView({ kind: "main" })}>
                Cancel
              </Button>
              <Button type="button" size="xs" className="tw:h-8 tw:w-full" disabled={!valid} onClick={() => onUpdateToken(t.id, hex)} data-testid="fill-edit-everywhere">
                Update everywhere ({n}×)
              </Button>
              <Button type="button" variant="secondary" size="xs" className="tw:h-8 tw:w-full" disabled={!valid} onClick={() => applyCustom(hex)} data-testid="fill-edit-only-this">
                Only this element
              </Button>
              <p className="tw:m-0 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
                Update everywhere changes the Brand token; Only this element detaches this fill from it.
              </p>
            </div>
          )}
        />
      </div>
    );
  }

  if (view.kind === "custom") {
    return (
      <div className="tw:-m-2 tw:overflow-hidden tw:rounded-lg" data-testid="fill-custom-picker">
        <ColorPicker
          initialHex={HEX.test(currentHex) ? currentHex : "#000000"}
          title={`${label} · Custom`}
          palette={tokens.slice(0, 8).map((t) => ({ id: t.id, name: t.name, value: t.value }))}
          onChange={() => {}}
          onCancel={() => setView({ kind: "main" })}
          onSave={(hex) => applyCustom(hex)}
        />
      </div>
    );
  }

  return (
    <div className="tw:flex tw:w-66 tw:flex-col tw:gap-3 tw:p-2" data-testid="fill-popover">
      <div className="tw:flex tw:items-center tw:justify-between">
        <span className="tw:text-[length:var(--bk-text-13)] tw:text-[var(--bk-ink)]">{label}</span>
        <IconButton label="Close" onClick={onClose} className="tw:size-5 tw:min-h-0 tw:min-w-0 tw:text-[var(--bk-ink-muted)]">
          <X size={14} aria-hidden />
        </IconButton>
      </div>

      {showSearch ? (
        <div className="tw:flex tw:flex-col tw:gap-2">
          <TextInput
            type="search"
            icon={SearchIcon}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search colours"
            aria-label="Search colours"
            data-testid="fill-search"
          />
          {q ? (
            <span className="tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink-muted)]" data-testid="fill-search-count">
              {brand.length} of {tokens.length} match '{query.trim()}'
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="tw:flex tw:flex-col tw:gap-2">
        <span className={EYEBROW}>Brand</span>
        {tokens.length === 0 ? (
          <span className="tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink-muted)]">No brand colours yet — add them in Brand › Colours.</span>
        ) : (
          /* Two rows show (the board samples six); the rest scroll, so CUSTOM
             stays on screen with an 18-colour brand. */
          <div className="tw:grid tw:max-h-32 tw:grid-cols-3 tw:gap-y-3 tw:overflow-y-auto tw:pt-1.5" role="listbox" aria-label="Brand colours">
            {brand.map((t) => {
              const selected = t.id === boundTokenId;
              /* Board 4428:142922: a 32px tile in the token's own colour, the
                 selected one ringed 2px in the accent with a white ✎ on it
                 (the other tiles show their ✎ on hover). The ✎ is a sibling
                 over the tile, not inside it — a button in a button is invalid. */
              return (
                <div key={t.id} className="tw:group tw:flex tw:flex-col tw:items-center tw:gap-1">
                  <div className="tw:relative">
                    <Button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      aria-label={t.name}
                      className={`${SWATCH} tw:size-8 ${selected ? "tw:border-2 tw:border-[var(--bk-accent)]" : ""}`}
                      style={{ background: t.value }}
                      onClick={() => onSelectToken(`var(${t.cssVar})`)}
                      data-testid={`fill-brand-${t.id}`}
                    />
                    <IconButton
                      label={`Edit ${t.name}`}
                      onClick={() => setView({ kind: "edit", token: t })}
                      className={`tw:absolute tw:left-1/2 tw:top-1/2 tw:size-5 tw:min-h-0 tw:min-w-0 tw:-translate-x-1/2 tw:-translate-y-1/2 tw:bg-transparent tw:p-0 tw:text-white tw:[filter:drop-shadow(0_0_1px_rgba(0,0,0,0.6))] tw:hover:bg-transparent ${selected ? "" : "tw:opacity-0 tw:group-hover:opacity-100 tw:focus-visible:opacity-100"}`}
                      data-testid={`fill-edit-${t.id}`}
                    >
                      <Pencil size={12} aria-hidden />
                    </IconButton>
                  </div>
                  <span className="tw:max-w-full tw:truncate tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-muted)]">{t.name}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Board 4428:142922 always draws RECENT. */}
      <div className="tw:flex tw:flex-col tw:gap-2" data-testid="fill-recent">
        <span className={EYEBROW}>Recent</span>
        {recent.length > 0 ? (
          <div className="tw:flex tw:gap-2">
            {recent.map((hex) => (
              <Button
                key={hex}
                type="button"
                aria-label={`Use ${hex}`}
                className={`${SWATCH} tw:size-8`}
                style={{ background: hex }}
                onClick={() => applyCustom(hex)}
              />
            ))}
          </div>
        ) : (
          <span className="tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink-muted)]">Colours you apply show here.</span>
        )}
      </div>

      <div className="tw:flex tw:flex-col tw:gap-2">
        <span className={EYEBROW}>Custom</span>
        <div className="tw:flex tw:items-center tw:gap-2">
          <Button
            type="button"
            aria-label="Open the colour picker"
            className={`${SWATCH} tw:size-6 tw:flex-none`}
            style={{ background: HEX.test(hexDraft) ? hexDraft : "transparent" }}
            onClick={() => setView({ kind: "custom" })}
            data-testid="fill-custom-swatch"
          />
          <TextInput
            type="text"
            value={hexDraft}
            onChange={(e) => setHexDraft(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter" && HEX.test(hexDraft)) applyCustom(hexDraft);
            }}
            onBlur={() => {
              if (HEX.test(hexDraft) && hexDraft.replace("#", "") !== currentHex.replace("#", "").toUpperCase()) applyCustom(hexDraft);
            }}
            aria-label={`${label} hex`}
            className="tw:w-34 tw:[font-family:var(--bk-font-mono)]"
            data-testid="fill-custom-hex"
          />
          {/* Beside the field as the board draws it; live only while the fill
              is bound to a brand colour. */}
          <Button
            type="button"
            variant="link"
            className={`${LINK} tw:ml-auto tw:bg-transparent tw:disabled:bg-transparent tw:disabled:text-[var(--bk-ink-disabled)] tw:disabled:opacity-100`}
            disabled={!boundTokenId}
            title={boundTokenId ? "Keep this colour, unlinked from the brand colour" : "Not linked to a brand colour"}
            onClick={() => onCustomValue(currentHex)}
            data-testid="fill-detach"
          >
            Detach
          </Button>
        </div>
      </div>

      {showSearch ? (
        <p className="tw:m-0 tw:flex tw:items-start tw:gap-1 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
          <Pencil size={9} aria-hidden className="tw:mt-0.5 tw:flex-none" />
          on a brand swatch edits the token everywhere it is used.
        </p>
      ) : null}
    </div>
  );
};

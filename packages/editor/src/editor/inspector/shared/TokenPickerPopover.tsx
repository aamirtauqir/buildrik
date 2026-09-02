/**
 * TokenPickerPopover — pick a design-system token or enter a raw value.
 *
 * Layout modes:
 *   showSwatch=true  (default) → 4-column swatch grid (color tokens)
 *   showSwatch=false           → single-column list: name left, value badge right
 *                                (spacing / type tokens)
 *
 * Empty states:
 *   - Zero tokens in list  → "No [X] tokens yet" + "Add in Design tab" hint
 *   - Search yields nothing → "No tokens found"  (no Design tab hint)
 *
 * Binding model: onSelect passes token.cssVar (e.g. var(--buildrick-design-color-primary)),
 * NOT the raw hex/px value.
 *
 * Keyboard nav: role=listbox, ArrowUp/Down (list), ArrowUp/Down/Left/Right (grid),
 * Enter=select, Escape=close.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, TextInput } from "@/editor/chrome-ui";
// ============================================================================
// TYPES
// ============================================================================

export interface TokenEntry {
  id: string;
  name: string;
  value: string;
  cssVar: string;
}

export interface TokenPickerPopoverProps {
  tokens: TokenEntry[];
  /** Currently applied value (may be var(--buildrick-design-*) or a raw value) */
  currentValue: string;
  /** Called with (tokenId, cssVar) — e.g. ("color-primary", "var(--buildrick-design-color-primary)") */
  onSelect: (tokenId: string, cssVar: string) => void;
  /** Apply a raw value instead of a token. OPTIONAL: omit it and the Custom
   *  tab does not render at all. It used to be required, so a consumer that
   *  could not honour a raw value had to pass a no-op — and `BindingRow` did,
   *  which shipped a Custom tab whose Apply button did nothing. A tab is not a
   *  place to park an unimplemented decision. */
  onCustomValue?: (value: string) => void;
  /** false = list layout (spacing/type), true = 4-col swatch grid (default, color) */
  showSwatch?: boolean;
  /** Noun shown in empty-state prompt, e.g. "color", "spacing", "type" */
  tokenLabel?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const isValidHex = (v: string) => /^#[0-9A-Fa-f]{3}(?:[0-9A-Fa-f]{3})?$/.test(v);

/** Extract just the --buildrick-design-* var name from var(--buildrick-design-…) for comparison */
const extractVarName = (v: string) => {
  const m = v.match(/^var\((--buildrick-design-[^)]+)\)$/);
  return m ? m[1] : null;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const VALUE_BADGE =
  "tw:flex-none tw:max-w-20 tw:px-[5px] tw:py-px tw:rounded tw:overflow-hidden tw:text-ellipsis " +
  "tw:whitespace-nowrap tw:text-[length:var(--bk-text-11)] tw:text-[var(--bk-accent-text)] tw:bg-[var(--bk-accent-subtle)] " +
  "tw:[font-family:var(--bk-font-mono)]";

/** Selected / keyboard-focused / resting frame, shared by both layouts. */
const optionState = (selected: boolean, focused: boolean) =>
  selected
    ? "tw:bg-[var(--bk-accent-subtle)] tw:border-[var(--bk-accent)]"
    : focused
      ? "tw:bg-[var(--bk-accent-subtle)] tw:border-[var(--bk-alpha-accent-30)]"
      : "tw:bg-transparent tw:border-transparent tw:hover:bg-[var(--bk-accent-subtle)]";

const SWATCH =
  "tw:h-[30px] tw:w-[46px] tw:flex-none tw:rounded-md tw:border tw:border-[var(--bk-border)]";
const PICKER_INPUT =
  "tw:[&_input]:h-6 tw:[&_input]:px-2 tw:[&_input]:py-0 tw:[&_input]:rounded-md " +
  "tw:[&_input]:border-[var(--bk-border)] tw:[&_input]:bg-[var(--bk-bg-subtle)]";

// ============================================================================
// COMPONENT
// ============================================================================

export const TokenPickerPopover: React.FC<TokenPickerPopoverProps> = ({
  tokens,
  currentValue,
  onSelect,
  onCustomValue,
  showSwatch = true,
  tokenLabel = "color",
}) => {
  const [tab, setTab] = React.useState<"tokens" | "custom">("tokens");
  const allowCustom = onCustomValue !== undefined;
  const [customInput, setCustomInput] = React.useState(
    isValidHex(currentValue) ? currentValue : "#000000"
  );
  const [query, setQuery] = React.useState("");
  const [focusedIndex, setFocusedIndex] = React.useState<number>(-1);

  const searchRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Auto-focus search on open
  React.useEffect(() => {
    if (tab === "tokens") {
      searchRef.current?.focus();
    }
  }, [tab]);

  const filtered = query.trim()
    ? tokens.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
    : tokens;

  const hasNoTokens = tokens.length === 0;
  const hasNoResults = tokens.length > 0 && filtered.length === 0;

  // Determine which token is currently selected (match by cssVar)
  const currentVarName = extractVarName(currentValue);
  const isSelected = (token: TokenEntry) =>
    currentVarName != null
      ? token.cssVar === currentVarName
      : currentValue === token.value;

  // Grid columns for keyboard nav
  const COLS = showSwatch ? 4 : 1;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filtered.length === 0) return;

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        setFocusedIndex((i) => {
          const next = i + COLS;
          return next < filtered.length ? next : i;
        });
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        setFocusedIndex((i) => {
          const next = i - COLS;
          return next >= 0 ? next : i;
        });
        break;
      }
      case "ArrowRight": {
        if (showSwatch) {
          e.preventDefault();
          setFocusedIndex((i) => (i + 1 < filtered.length ? i + 1 : i));
        }
        break;
      }
      case "ArrowLeft": {
        if (showSwatch) {
          e.preventDefault();
          setFocusedIndex((i) => (i - 1 >= 0 ? i - 1 : i));
        }
        break;
      }
      case "Enter": {
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filtered.length) {
          const token = filtered[focusedIndex];
          onSelect(token.id, `var(${token.cssVar})`);
        }
        break;
      }
      case "Escape": {
        e.preventDefault();
        // Signal parent to close — parent's Popover/Escape handler will fire
        break;
      }
    }
  };

  const commitCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed) onCustomValue?.(trimmed);
  };

  return (
    <div
      className="tw:w-59 tw:overflow-hidden tw:rounded-lg tw:border tw:border-[var(--bk-gray-200)] tw:bg-[var(--bk-bg-panel)] tw:[box-shadow:var(--bk-shadow-overlay)]"
    >
      {/* Tab strip */}
      <div className="tw:flex tw:gap-1 tw:px-3 tw:pt-2.5">
        {(allowCustom ? (["tokens", "custom"] as const) : (["tokens"] as const)).map((t) => (
          <Button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`tw:min-h-6 tw:rounded-md tw:border-0 tw:px-2.5 tw:py-1 tw:text-[11px] tw:font-medium ${
              tab === t
                ? "tw:bg-[var(--bk-accent-tint)] tw:text-[var(--bk-accent-text)]"
                : "tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]"
            }`}
          >
            {t === "tokens" ? "Tokens" : "Custom"}
          </Button>
        ))}
      </div>
      {tab === "tokens" && (
        <div onKeyDown={handleKeyDown}>
          {/* Search */}
          <div className="tw:px-3 tw:pt-2 tw:pb-1">
            <TextInput
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setFocusedIndex(-1);
              }}
              placeholder="Search tokens…"
              aria-label="Search tokens"
              className={`${PICKER_INPUT} tw:[&_input]:text-[11px]`}
            />
          </div>

          {/* Empty state — zero tokens */}
          {hasNoTokens && (
            <div className="tw:px-3 tw:py-5 tw:text-center">
              <div className="tw:mb-1.5 tw:text-lg tw:opacity-40">🎨</div>
              <div className="tw:mb-1 tw:text-[11px] tw:text-[var(--bk-ink-soft)]">
                No {tokenLabel} tokens yet
              </div>
              <div className="tw:text-[length:var(--bk-text-11)] tw:text-[var(--bk-ink-muted)]">Add tokens in the Design tab</div>
            </div>
          )}

          {/* Empty state — search no-results */}
          {hasNoResults && (
            <div className="tw:px-3 tw:py-4 tw:text-center tw:text-[11px] tw:text-[var(--bk-ink-muted)]">
              No tokens found
            </div>
          )}

          {/* Token list */}
          {!hasNoTokens && !hasNoResults && (
            <div
              ref={listRef}
              role="listbox"
              aria-label={`${tokenLabel} tokens`}
              className={`tw:px-3 tw:pt-2 tw:max-h-55 tw:overflow-y-auto ${
                showSwatch
                  ? "tw:pb-2 tw:grid tw:grid-cols-4 tw:gap-1.5"
                  : "tw:pb-1.5 tw:flex tw:flex-col tw:gap-0.5"
              }`}
            >
              {filtered.map((token, idx) => {
                const selected = isSelected(token);
                const focused = idx === focusedIndex;
                const cssVarRef = `var(${token.cssVar})`;

                return showSwatch ? (
                  // ── Grid item (color swatch) ──
                  (<Button
                    key={token.id}
                    role="option"
                    aria-selected={selected}
                    type="button"
                    title={`${token.name}: ${token.value}`}
                    tabIndex={focused ? 0 : -1}
                    onClick={() => onSelect(token.id, cssVarRef)}
                    className={`tw:p-0 tw:rounded-md tw:border ${optionState(selected, focused)}`}
                    onFocus={() => setFocusedIndex(idx)}
                  >
                    <div className="tw:flex tw:flex-col tw:items-center tw:gap-[3px]">
                      {/* Swatch */}
                      <div className={SWATCH} style={{ background: token.value }} />
                      {/* Name */}
                      <span className="tw:max-w-11 tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap tw:text-center tw:text-[length:var(--bk-text-11)] tw:leading-tight tw:text-[var(--bk-ink-muted)]">
                        {token.name}
                      </span>
                    </div>
                  </Button>)
                ) : (
                  // ── List item (spacing / type) ──
                  (<Button
                    key={token.id}
                    role="option"
                    aria-selected={selected}
                    type="button"
                    title={`${token.name}: ${token.value}`}
                    tabIndex={focused ? 0 : -1}
                    onClick={() => onSelect(token.id, cssVarRef)}
                    className={`tw:flex tw:w-full tw:items-center tw:justify-between tw:gap-2 tw:px-1.5 tw:py-[5px] tw:rounded-[5px] tw:border tw:text-left ${optionState(selected, focused)}`}
                    onFocus={() => setFocusedIndex(idx)}
                  >
                    <span className="tw:flex-1 tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap tw:text-[11px] tw:text-[var(--bk-ink-soft)]">
                      {token.name}
                    </span>
                    <span className={VALUE_BADGE}>{token.value}</span>
                  </Button>)
                );
              })}
            </div>
          )}
        </div>
      )}
      {tab === "custom" && (
        <div className="tw:p-2.5">
          <div className="tw:mb-1.5 tw:text-[11px] tw:text-[var(--bk-ink-muted)]">Enter any CSS color value</div>
          <div className="tw:flex tw:items-center tw:gap-1.5">
            {/* Preview swatch */}
            <div className={SWATCH} style={{ background: customInput }} />
            <TextInput
              type="text"
              value={customInput}
              autoFocus
              onChange={(e) => setCustomInput(e.target.value)}
              onBlur={commitCustom}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitCustom();
              }}
              placeholder="#000000"
              className={`tw:flex-1 ${PICKER_INPUT} tw:[&_input]:text-xs`}
            />
          </div>
          <div className="tw:mt-2 tw:text-[length:var(--bk-text-11)] tw:text-[var(--bk-ink-muted)]">
            Accepts hex, rgb(), hsl(), or any CSS keyword
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenPickerPopover;

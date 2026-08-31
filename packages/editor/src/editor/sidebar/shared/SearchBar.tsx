/**
 * SearchBar - Search input for sidebar tabs
 * Debounces onChange to parent (300ms default) while keeping input visually instant
 * @license BSD-3-Clause
 */

import * as React from "react";
import { trackSidebar } from "../../../shared/utils/sidebarAnalytics";
import { TextInput } from "@/editor/chrome-ui";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Accessible label for the search input (WCAG 1.3.1) */
  ariaLabel?: string;
  /** Debounce delay in ms (default: 300, 0 = instant) */
  debounceMs?: number;
  /** Id for the input element — used by parent for keyboard shortcuts */
  id?: string;
  /** Optional keyboard hint shown on the right of the input (e.g. "/"). Rendered only when input is empty. */
  kbdHint?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  ariaLabel = "Search",
  debounceMs = 300,
  id,
  kbdHint,
}) => {
  // Internal state for instant visual feedback
  const [inputValue, setInputValue] = React.useState(value);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync internal state when parent value changes (e.g., external clear)
  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = (newValue: string) => {
    setInputValue(newValue);

    if (timerRef.current) clearTimeout(timerRef.current);

    // Telemetry fires regardless of debounce mode. The previous version only
    // fired inside the debounced branch, so any consumer passing debounceMs=0
    // silently lost all search analytics.
    const fireTelemetry = () => {
      if (newValue.length > 0) {
        trackSidebar("search", { query_length: newValue.length });
      }
    };

    if (debounceMs <= 0) {
      onChange(newValue);
      fireTelemetry();
      return;
    }

    timerRef.current = setTimeout(() => {
      onChange(newValue);
      fireTelemetry();
    }, debounceMs);
  };

  return (
    // Board 137:8 / 138:53: the box draws NO magnifier and NO ✕ — text plus
    // the bare mono kbd hint, which stays visible while typing (138:53 shows
    // "button" and ⌘F together). Clearing = Escape or the empty-state's
    // "Clear search" link.
    <div style={containerStyles} role="search">
      <TextInput
        type="text"
        id={id}
        value={inputValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        /* `className` reaches flowbite's OUTER wrapper; `style` reaches the
           real <input>. The growth has to be on the wrapper — `flex: 1` in
           `inputStyles` landed on the input while both wrapper divs stayed
           `flex: 0 1 auto`, so the whole stack sat at 168px inside a 287px
           box and the kbd hint below was stranded 89px from its right edge.
           Same wrapper/className split documented in settings/shared.tsx. */
        className="tw:flex-1 tw:min-w-0"
        style={inputStyles}
        aria-label={ariaLabel}
      />
      {kbdHint ? (
        <span className="bld-kbd-hint" aria-hidden="true">{kbdHint}</span>
      ) : null}
    </div>
  );
};

const containerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  margin: 0,
  padding: "0 8px",
  // Board 137:8 (founder re-spec 2026-08-06): 28h field on gray-50 with a
  // border, radius 6 — the wrapper's 4/16 padding supplies the 36h band.
  // Shared by all seven drawers; the board's Panel-header doc scopes the
  // drawer chrome file-wide, so this is the one deliberate SearchBar edit
  // of the frozen set, board-driven.
  height: "var(--bk-size-row-dense)",
  background: "var(--bk-gray-50)",
  border: "1px solid var(--bk-border)",
  borderRadius: 6,
  color: "var(--bk-ink-soft, var(--bk-ink-muted))",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
};

const inputStyles: React.CSSProperties = {
  width: "100%",
  background: "transparent",
  border: "none",
  color: "var(--bk-ink)",
  // Board text style ui/13: Inter 13/20. No system fallbacks in any stack
  // (DESIGN.md §Typography, anti-slop rule 8) — the token carries the family.
  fontSize: 13,
  outline: "none",
  lineHeight: "20px",
  fontFamily: "var(--bk-font-ui)",
  // The CONTAINER is the box (board 137:8) — the flowbite input's own focus
  // ring inside it reads as a second box. Inline style outranks the theme's
  // ring utility.
  boxShadow: "none",
};

export default SearchBar;

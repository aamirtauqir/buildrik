/**
 * PanelSearch — a drawer's own search field, directly under its header and
 * above its list.
 *
 * OWNER DECISION 2026-10-03: the per-panel searches moved OUT of the topbar
 * (boards 4418:100087 / 4418:81300 / 4418:92256 / 4418:59771 / 6819:59209 had
 * the topbar field take on "Search elements… / layers… / pages… / all N
 * assets… / <collection>…" while that drawer was open). The topbar now carries
 * no search in any state; each panel owns this field instead.
 *
 * Behaviour carried over from the topbar field unchanged:
 *   - Escape with text clears it and stops there; Escape on an empty field
 *     passes through (Layers / Add use that Escape to close the drawer).
 *   - ✕ clears; a keycap hint (⌘F) shows while empty when the panel binds one.
 * Every field carries `data-panel-search`, which is how a panel's own Escape
 * and shortcut handlers recognise it (it replaced the topbar's single id).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Search, X } from "lucide-react";
import { TextInput } from "./TextInput";
import { IconButton, Kbd } from "./Icon";

export interface PanelSearchProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  /** A keycap hint shown while empty (e.g. "⌘F") — only when the panel binds it. */
  shortcut?: string;
  /** Extra classes on the band (e.g. a max width in a wide workspace). */
  className?: string;
  "data-testid"?: string;
}

/** The marker every panel search input carries. */
export const PANEL_SEARCH_ATTR = "data-panel-search";

/** True when `el` is a panel's search input. */
export function isPanelSearchInput(el: Element | null): el is HTMLInputElement {
  return el instanceof HTMLInputElement && el.hasAttribute(PANEL_SEARCH_ATTR);
}

export const PanelSearch = React.forwardRef<HTMLInputElement, PanelSearchProps>(function PanelSearch(
  { placeholder, value, onChange, shortcut, className, "data-testid": testId = "panel-search" },
  ref,
) {
  return (
    /* 4px grid: 16 in from the drawer edges like the header and rows, 8 above
       and below — a 48 band holding the 32-tall input. */
    <div className={["tw:relative tw:flex-none tw:px-4 tw:py-2", className].filter(Boolean).join(" ")} data-testid={testId}>
      <TextInput
        ref={ref}
        type="text"
        icon={SearchIcon}
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.stopPropagation();
            onChange("");
          }
        }}
        {...{ [PANEL_SEARCH_ATTR]: "" }}
        data-testid={`${testId}-input`}
        theme={{ field: { input: { base: "tw:pr-8" } } }}
      />
      <span className="tw:absolute tw:right-5 tw:top-1/2 tw:flex tw:-translate-y-1/2 tw:items-center">
        {value ? (
          <IconButton
            label="Clear search"
            size="sm"
            className="tw:text-[var(--bk-ink-muted)]"
            onClick={() => onChange("")}
            data-testid={`${testId}-clear`}
          >
            <X size={14} aria-hidden="true" />
          </IconButton>
        ) : shortcut ? (
          <Kbd aria-hidden="true">{shortcut}</Kbd>
        ) : null}
      </span>
    </div>
  );
});

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return <Search size={14} aria-hidden="true" {...props} />;
}

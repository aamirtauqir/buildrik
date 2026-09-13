/**
 * Tabs — child-level navigation inside a surface.
 *
 * Arrow keys move between tabs and Home/End jump to the ends, which is the
 * WAI-ARIA tab pattern; without it a tablist is a row of buttons that screen
 * reader users have to tab through one at a time.
 *
 * KEEP verdict (Task 4, flowbite big-bang): flowbite-react has no Tabs
 * component with this roving-tabindex + arrow-key contract, so this stays a
 * custom primitive, restyled to tw:* in place.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { twMerge } from "tailwind-merge";

export interface Tab {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  tabs: readonly Tab[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
  /** Merged over every tab's classes — a host whose board draws the chips
   *  differently (the image editor's 112-wide grey chips, 3397:39917) keeps
   *  the roving-tabindex + arrow-key contract and restyles the buttons. */
  tabClassName?: string;
}

/**
 * The selected tab is a tinted pill, not an underline, and the row carries no
 * rule beneath it. Three boards draw it that way and none draws the underline:
 * 1172:4867 (project settings), 1172:4825 (export) and 1164:4713 (media
 * picker) all fill the active tab with `--bk-accent-tint` and set its label to
 * `--bk-accent`, over a plain white row.
 */
const TAB_CLASS =
  "tw:h-8 tw:py-0 tw:px-2.5 tw:border-0 tw:rounded-md tw:bg-transparent tw:cursor-pointer " +
  "tw:[font-family:var(--bk-font-ui)] tw:text-[13px] tw:text-[var(--bk-ink-muted)] " +
  "tw:[transition:var(--bk-transition-fast)] " +
  "tw:hover:text-[var(--bk-ink)] tw:hover:bg-[var(--bk-gray-100)] " +
  "tw:aria-selected:text-[var(--bk-accent-text)] tw:aria-selected:bg-[var(--bk-accent-tint)] " +
  "tw:aria-selected:font-medium tw:aria-selected:hover:bg-[var(--bk-accent-tint)] " +
  "tw:disabled:opacity-50 tw:disabled:cursor-not-allowed tw:disabled:hover:bg-transparent " +
  "tw:focus-visible:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

export function Tabs({
  tabs,
  value,
  onChange,
  label = "Sections",
  className,
  tabClassName,
  "data-testid": testId,
  ...rest
}: TabsProps & { "data-testid"?: string }) {
  const enabled = tabs.filter((t) => !t.disabled);
  const nodes = React.useRef(new Map<string, HTMLButtonElement>());

  /**
   * Selection had to drag focus with it. The row is roving-tabindex, so
   * arrowing off a tab left the browser focused on a button that was now
   * `tabIndex={-1}` — the ring sat on the old tab while the pill moved to the
   * new one (visible on board 1172:4867's Canvas state), and the next Tab
   * press escaped the row from the wrong place.
   */
  const select = (id: string) => {
    onChange(id);
    nodes.current.get(id)?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = enabled.findIndex((t) => t.id === value);
    if (i < 0) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next = (i + (e.key === "ArrowRight" ? 1 : -1) + enabled.length) % enabled.length;
      select(enabled[next].id);
    } else if (e.key === "Home") {
      e.preventDefault();
      select(enabled[0].id);
    } else if (e.key === "End") {
      e.preventDefault();
      select(enabled[enabled.length - 1].id);
    }
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      /* twMerge, not a join: the row is a plain element, so a host's
         `tw:p-0` has to REPLACE the default padding, not sit beside it. */
      className={twMerge("tw:flex tw:items-center tw:gap-1 tw:py-1 tw:px-3", className)}
      onKeyDown={onKeyDown}
      data-testid={testId}
      {...rest}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          ref={(el) => {
            if (el) nodes.current.set(t.id, el);
            else nodes.current.delete(t.id);
          }}
          type="button"
          role="tab"
          className={tabClassName ? twMerge(TAB_CLASS, tabClassName) : TAB_CLASS}
          /* `<row testid>-<tab id>` — the conformance recipes measure one tab. */
          data-testid={testId ? `${testId}-${t.id}` : undefined}
          aria-selected={t.id === value}
          aria-disabled={t.disabled || undefined}
          tabIndex={t.id === value ? 0 : -1}
          disabled={t.disabled}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

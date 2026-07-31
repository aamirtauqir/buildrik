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

export interface Tab {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  tabs: Tab[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
}

const TAB_CLASS =
  "tw:h-11 tw:py-0 tw:px-3 tw:border-0 tw:bg-transparent tw:cursor-pointer " +
  "tw:[font-family:var(--bk-font-ui)] tw:text-[13px] tw:text-gray-500 " +
  "tw:border-b-2 tw:border-transparent tw:[transition:var(--bk-transition-fast)] " +
  "tw:hover:text-gray-900 " +
  "tw:aria-selected:text-blue-700 tw:aria-selected:border-b-blue-700 tw:aria-selected:font-medium " +
  "tw:focus-visible:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

export function Tabs({ tabs, value, onChange, label = "Sections", className, ...rest }: TabsProps) {
  const enabled = tabs.filter((t) => !t.disabled);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = enabled.findIndex((t) => t.id === value);
    if (i < 0) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next = (i + (e.key === "ArrowRight" ? 1 : -1) + enabled.length) % enabled.length;
      onChange(enabled[next].id);
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange(enabled[0].id);
    } else if (e.key === "End") {
      e.preventDefault();
      onChange(enabled[enabled.length - 1].id);
    }
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={[
        "tw:flex tw:items-center tw:gap-1 tw:border-b tw:border-gray-200 tw:py-0 tw:px-3",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onKeyDown={onKeyDown}
      {...rest}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          className={TAB_CLASS}
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

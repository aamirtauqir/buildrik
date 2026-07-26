/**
 * Tabs — child-level navigation inside a surface.
 *
 * Arrow keys move between tabs and Home/End jump to the ends, which is the
 * WAI-ARIA tab pattern; without it a tablist is a row of buttons that screen
 * reader users have to tab through one at a time.
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
      className={["bk-tabs", className].filter(Boolean).join(" ")}
      onKeyDown={onKeyDown}
      {...rest}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          className="bk-tab"
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

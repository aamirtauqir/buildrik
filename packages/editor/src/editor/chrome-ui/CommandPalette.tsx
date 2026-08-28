/**
 * CommandPalette — Figma 166:2 (640×420).
 *
 * Keyboard-first by definition, so the keyboard contract is the component, not
 * a decoration: ↑/↓ move, Enter runs, Escape closes, and the highlighted item
 * is the one aria-activedescendant points at — the input keeps focus the whole
 * time, which is what lets you keep typing while moving through results.
 *
 * Disabled commands are skipped by the arrow keys rather than silently
 * swallowing Enter.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { OverlayMount } from "./OverlayMount";

export interface Command {
  id: string;
  label: string;
  kbd?: string;
  group?: string;
  disabled?: boolean;
}

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: Command[];
  onRun: (command: Command) => void;
  placeholder?: string;
  emptyLabel?: string;
}

/* idle/selected/disabled each supply their own bg + text color — same-property
   values can't be additive (Row/PanelFrame precedent). */
const ITEM_STATE_CLASS: Record<"idle" | "selected" | "disabled", string> = {
  idle: "tw:bg-transparent tw:text-gray-900",
  selected: "tw:bg-blue-50 tw:text-[var(--bk-accent-text)]",
  disabled: "tw:bg-transparent tw:text-gray-300 tw:pointer-events-none",
};

export function CommandPalette({
  open, onClose, commands, onRun, placeholder = "Type a command or search…", emptyLabel = "No matching commands",
}: CommandPaletteProps) {
  const [query, setQuery] = React.useState("");
  const [index, setIndex] = React.useState(0);
  const listId = React.useId();

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? commands.filter((c) => c.label.toLowerCase().includes(q)) : commands;
  }, [commands, query]);

  React.useEffect(() => {
    setIndex(0);
  }, [query, open]);

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const step = (dir: 1 | -1) => {
    if (results.length === 0) return;
    let next = index;
    for (let i = 0; i < results.length; i++) {
      next = (next + dir + results.length) % results.length;
      if (!results[next].disabled) break;
    }
    setIndex(next);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      step(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = results[index];
      if (cmd && !cmd.disabled) onRun(cmd);
    }
  };

  return (
    <OverlayMount open={open} onClose={onClose} align="top">
      <div className="tw:z-[70] tw:w-[640px] tw:max-w-[calc(100vw-32px)] tw:max-h-[420px] tw:flex tw:flex-col tw:bg-white tw:rounded-lg tw:[box-shadow:var(--bk-shadow-overlay)] tw:overflow-hidden tw:[font-family:var(--bk-font-ui)]">
        <div className="tw:h-14 tw:flex-none tw:flex tw:items-center tw:px-4 tw:border-b tw:border-gray-200">
          <input
            className="tw:flex-1 tw:border-0 tw:bg-transparent tw:outline-none tw:[font-family:var(--bk-font-ui)] tw:text-base tw:text-gray-900 tw:placeholder:text-gray-300"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results[index] ? `${listId}-${results[index].id}` : undefined}
            aria-label={placeholder}
          />
        </div>
        <div className="tw:flex-1 tw:overflow-auto tw:py-1" id={listId} role="listbox" aria-label="Commands">
          {results.length === 0 ? (
            <div
              className={[
                "tw:flex tw:items-center tw:gap-2 tw:h-10 tw:px-4 tw:text-[13px] tw:cursor-pointer tw:border-0 tw:w-full tw:text-left",
                ITEM_STATE_CLASS.disabled,
              ].join(" ")}
              aria-disabled="true"
            >
              {emptyLabel}
            </div>
          ) : (
            results.map((c, i) => (
              <div
                key={c.id}
                id={`${listId}-${c.id}`}
                role="option"
                aria-selected={i === index}
                aria-disabled={c.disabled || undefined}
                className={[
                  "tw:flex tw:items-center tw:gap-2 tw:h-10 tw:px-4 tw:text-[13px] tw:cursor-pointer tw:border-0 tw:w-full tw:text-left",
                  ITEM_STATE_CLASS[c.disabled ? "disabled" : i === index ? "selected" : "idle"],
                ].join(" ")}
                onMouseEnter={() => !c.disabled && setIndex(i)}
                onClick={() => !c.disabled && onRun(c)}
              >
                <span>{c.label}</span>
                {c.kbd ? <span className="tw:ml-auto tw:text-gray-500 tw:text-[11px]">{c.kbd}</span> : null}
              </div>
            ))
          )}
        </div>
      </div>
    </OverlayMount>
  );
}

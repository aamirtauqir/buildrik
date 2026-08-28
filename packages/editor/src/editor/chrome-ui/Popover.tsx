/**
 * Popover + Menu.
 *
 * Anchored, not portalled: the popover is a sibling of its trigger inside a
 * relatively-positioned wrapper. That keeps it in DOM order for screen readers
 * and keyboard users, which a portal breaks unless you re-create the
 * relationship by hand — and the surfaces that need to escape a clipping
 * ancestor already have Portal.
 *
 * Closes on Escape and on pointer-down outside. Menu adds the roving-focus
 * arrow-key contract that turns a list of buttons into one tab stop.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { ROW_ICON_CLASS } from "./Row";

export type PopoverPlacement = "bottom" | "bottom-end" | "top" | "top-end" | "right";

/* inline/block and each placement supply their own full set — same-property
   values (display; top/bottom/left/right) can't be additive across variants
   (Row/PanelFrame precedent). */
const ANCHOR_CLASS: Record<"inline" | "block", string> = {
  inline: "tw:relative tw:inline-flex",
  block: "tw:relative tw:flex tw:flex-1 tw:min-w-0",
};
const PLACEMENT_CLASS: Record<PopoverPlacement, string> = {
  bottom: "tw:top-[calc(100%+4px)] tw:left-0",
  "bottom-end": "tw:top-[calc(100%+4px)] tw:right-0",
  top: "tw:bottom-[calc(100%+4px)] tw:left-0",
  "top-end": "tw:bottom-[calc(100%+4px)] tw:right-0",
  right: "tw:left-[calc(100%+4px)] tw:top-0",
};
/** Exported for the rare cross-file borrower that wraps its own positioned
 *  box in the popover "look" without using the Popover component itself
 *  (e.g. AddPageButton.tsx). */
export const POPOVER_BASE_CLASS =
  "tw:absolute tw:z-40 tw:min-w-[180px] tw:p-2 tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white " +
  "tw:[box-shadow:var(--bk-shadow-overlay)] tw:[font-family:var(--bk-font-ui)] tw:text-[13px] tw:text-gray-900";

export interface PopoverProps {
  open: boolean;
  onClose: () => void;
  trigger: React.ReactNode;
  placement?: PopoverPlacement;
  children: React.ReactNode;
  label?: string;
  className?: string;
  /** Anchor stretches to fill its flex/grid parent — for full-width triggers. */
  block?: boolean;
}

export function Popover({ open, onClose, trigger, placement = "bottom", children, label, className, block }: PopoverProps) {
  const wrap = React.useRef<HTMLSpanElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open, onClose]);

  return (
    <span className={ANCHOR_CLASS[block ? "block" : "inline"]} ref={wrap}>
      {trigger}
      {open ? (
        <div className={[POPOVER_BASE_CLASS, PLACEMENT_CLASS[placement], className].filter(Boolean).join(" ")} role="dialog" aria-label={label}>
          {children}
        </div>
      ) : null}
    </span>
  );
}

/**
 * Menu — compound, because a real menu is not a flat array.
 *
 * The array form could not express groups, labels, or a checkable item, so
 * every caller that needed one of those hand-rolled its own list. Children
 * compose instead: Menu > MenuGroup > MenuLabel + MenuItem.
 *
 * Roving focus is computed from the DOM rather than from child indices. The
 * items may be nested inside groups, wrapped by callers, or conditionally
 * rendered — an index over `children` is wrong the moment any of that happens.
 *
 * Opening the menu moves focus to the first item, per the WAI-ARIA menu-button
 * pattern. Without it the arrow keys land on the trigger, which is not in the
 * menu, so a keyboard user opens the menu and then cannot get into it.
 */
export interface MenuProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "role"> {
  label?: string;
  /** Set false when the menu is always on screen rather than opened. */
  autoFocus?: boolean;
}

const ITEM_SELECTOR = '[role="menuitem"],[role="menuitemcheckbox"]';

export function Menu({ label = "Actions", autoFocus = true, className, children, onKeyDown, ...rest }: MenuProps) {
  const root = React.useRef<HTMLDivElement | null>(null);

  const items = () => {
    const all = Array.from(root.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? []);
    return all.filter((el) => el.getAttribute("aria-disabled") !== "true" && !(el as HTMLButtonElement).disabled);
  };

  /** One tab stop: the focused item, or the first enabled one. */
  const syncTabStops = React.useCallback((focus?: HTMLElement) => {
    const all = Array.from(root.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? []);
    const enabled = all.filter((el) => el.getAttribute("aria-disabled") !== "true" && !(el as HTMLButtonElement).disabled);
    const stop = focus ?? enabled[0];
    for (const el of all) el.tabIndex = el === stop ? 0 : -1;
  }, []);

  React.useEffect(() => {
    if (!autoFocus) return;
    items()[0]?.focus();
    // Mount only: re-focusing on every render would fight the user's arrow keys.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    // A parent re-render must not move the tab stop off whatever the user is
    // standing on, so the focused item wins when it is one of ours.
    const active = document.activeElement;
    const inside = active instanceof HTMLElement && root.current?.contains(active) ? active : undefined;
    syncTabStops(inside);
  });

  const move = (dir: 1 | -1) => {
    const list = items();
    if (list.length === 0) return;
    const at = list.indexOf(document.activeElement as HTMLElement);
    const next = list[(at + dir + list.length) % list.length];
    next.focus();
    syncTabStops(next);
  };

  const jump = (to: "first" | "last") => {
    const list = items();
    const el = to === "first" ? list[0] : list[list.length - 1];
    if (!el) return;
    el.focus();
    syncTabStops(el);
  };

  return (
    <div
      ref={root}
      className={["tw:p-1 tw:min-w-[200px]", className].filter(Boolean).join(" ")}
      role="menu"
      aria-label={label}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented) return;
        if (e.key === "ArrowDown") {
          e.preventDefault();
          move(1);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          move(-1);
        } else if (e.key === "Home") {
          e.preventDefault();
          jump("first");
        } else if (e.key === "End") {
          e.preventDefault();
          jump("last");
        }
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface MenuItemProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "role"> {
  icon?: React.ReactNode;
  kbd?: string;
  /** Present = checkable item. `true` renders it checked. */
  selected?: boolean;
  /** Destructive action — red, and never the resting tab stop by accident. */
  danger?: boolean;
}

const MENU_ITEM_BASE =
  "tw:flex tw:items-center tw:gap-2 tw:w-full tw:h-8 tw:py-0 tw:px-2 tw:border-0 tw:rounded-md tw:bg-transparent " +
  "tw:[font-family:var(--bk-font-ui)] tw:text-[13px] tw:text-left " +
  "tw:focus-visible:outline-none tw:focus-visible:bg-blue-50";

export function MenuItem({ icon, kbd, selected, danger, disabled, className, children, ...rest }: MenuItemProps) {
  const stateClass = disabled
    ? "tw:cursor-default tw:pointer-events-none tw:text-gray-300 tw:focus-visible:text-gray-300"
    : danger
      ? "tw:cursor-pointer tw:hover:bg-gray-100 tw:text-red-700 tw:focus-visible:text-red-700"
      : "tw:cursor-pointer tw:hover:bg-gray-100 tw:text-gray-900 tw:focus-visible:text-blue-700";

  return (
    <button
      type="button"
      role={selected === undefined ? "menuitem" : "menuitemcheckbox"}
      aria-checked={selected === undefined ? undefined : selected}
      className={[MENU_ITEM_BASE, stateClass, className].filter(Boolean).join(" ")}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      tabIndex={-1}
      {...rest}
    >
      {selected !== undefined ? (
        <span aria-hidden="true" className="tw:w-3 tw:flex-none tw:text-[var(--bk-accent-text)]">
          {selected ? "✓" : ""}
        </span>
      ) : null}
      {icon ? <span className={ROW_ICON_CLASS}>{icon}</span> : null}
      <span className="tw:flex-1 tw:text-left">{children}</span>
      {kbd ? <span className="tw:ml-auto tw:text-gray-500 tw:text-[11px]">{kbd}</span> : null}
    </button>
  );
}

export function MenuGroup({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="group"
      className={[
        "tw:mt-1 tw:pt-1 tw:border-t tw:border-gray-200 tw:first:mt-0 tw:first:pt-0 tw:first:border-t-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}

export function MenuLabel({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        "tw:pt-1 tw:px-2 tw:pb-0.5 tw:text-gray-500 tw:text-[11px] tw:font-medium tw:tracking-[0.08em] tw:uppercase tw:[font-family:var(--bk-font-ui)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}

export function MenuSeparator() {
  return <div className="tw:h-px tw:my-1 tw:bg-gray-200" role="separator" />;
}

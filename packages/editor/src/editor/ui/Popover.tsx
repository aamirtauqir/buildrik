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

export type PopoverPlacement = "bottom" | "bottom-end" | "top" | "right";

export interface PopoverProps {
  open: boolean;
  onClose: () => void;
  trigger: React.ReactNode;
  placement?: PopoverPlacement;
  children: React.ReactNode;
  label?: string;
  className?: string;
}

export function Popover({ open, onClose, trigger, placement = "bottom", children, label, className }: PopoverProps) {
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
    <span className="bk-popover-anchor" ref={wrap}>
      {trigger}
      {open ? (
        <div
          className={["bk-popover", `bk-popover--${placement}`, className].filter(Boolean).join(" ")}
          role="dialog"
          aria-label={label}
        >
          {children}
        </div>
      ) : null}
    </span>
  );
}

export interface MenuItemDef {
  id: string;
  label: string;
  kbd?: string;
  disabled?: boolean;
  destructive?: boolean;
  icon?: React.ReactNode;
}

export interface MenuProps {
  items: MenuItemDef[];
  onSelect: (item: MenuItemDef) => void;
  label?: string;
}

/** Roving focus: one tab stop, arrows move within, Home/End jump. */
export function Menu({ items, onSelect, label = "Actions" }: MenuProps) {
  const enabled = items.filter((i) => !i.disabled);
  const [active, setActive] = React.useState(0);
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);

  React.useEffect(() => {
    refs.current[active]?.focus();
  }, [active]);

  const move = (dir: 1 | -1) => {
    if (enabled.length === 0) return;
    setActive((i) => {
      let next = i;
      for (let n = 0; n < items.length; n++) {
        next = (next + dir + items.length) % items.length;
        if (!items[next].disabled) break;
      }
      return next;
    });
  };

  return (
    <div
      className="bk-menu"
      role="menu"
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          move(1);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          move(-1);
        } else if (e.key === "Home") {
          e.preventDefault();
          setActive(0);
        } else if (e.key === "End") {
          e.preventDefault();
          setActive(items.length - 1);
        }
      }}
    >
      {items.map((item, i) => (
        <button
          key={item.id}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="menuitem"
          className={["bk-menu-item", item.destructive && "bk-menu-item--destructive"].filter(Boolean).join(" ")}
          aria-disabled={item.disabled || undefined}
          tabIndex={i === active ? 0 : -1}
          onClick={() => !item.disabled && onSelect(item)}
        >
          {item.icon ? <span className="bk-row__icon">{item.icon}</span> : null}
          <span>{item.label}</span>
          {item.kbd ? <span className="bk-menu-item__kbd">{item.kbd}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function MenuSeparator() {
  return <div className="bk-menu__separator" role="separator" />;
}

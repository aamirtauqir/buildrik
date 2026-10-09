/**
 * Element Context Menu — right-click on the canvas (and the selection
 * toolbar's ⋯ More), board 4428:43928: rows in registry order, a rule wherever
 * the group changes, submenus for Arrange / Style / Structure.
 *
 * Built on chrome-ui's Menu / MenuItem (DQ-018). It used to carry its own
 * menu: an `aria-activedescendant` focus model, hand-written ↑ ↓ Enter
 * handling and its own row component, so its keyboard and focus behaviour
 * differed from every other menu in the editor. Now the rows are real focus
 * stops on Menu's roving tab index, like the Inspector ⋯ and the site menu;
 * this file adds only what a submenu needs — → / Enter opens one and moves
 * focus into it, ← / Esc closes it and returns focus to its row.
 *
 * The board's geometry stays: a 200-wide card, 6px top/bottom, full-bleed
 * 30px rows at 13/400 ink with the selected-row tint, the shortcut column in
 * muted 12px.
 *
 * The menu floats in the chrome overlay root (#bk-overlay-root), not where the
 * canvas renders it: inside the canvas it sat under a `position: relative;
 * z-index: 1` wrapper — a stacking context — and the Inspector column painted
 * over every row that crossed it. The submenu is a SIBLING of the menu inside
 * the same wrapper, so the menu's roving focus never walks into it and a
 * click inside it is not a click outside.
 *
 * @license BSD-3-Clause
 */

import { Sparkles } from "lucide-react";
import * as React from "react";
import { useClickOutside } from "../../../shared/hooks/useClickOutside";
import type { ContextAction, ActionContext } from "./contextMenuRegistry";
import { formatShortcutHint, isMac } from "./shortcutHint";
import { Z_INDEX } from "../shared";
import { Menu, MenuItem, Portal } from "@/editor/chrome-ui";

interface ElementContextMenuProps {
  x: number;
  y: number;
  actions: ContextAction[];
  context: ActionContext;
  onClose: () => void;
}

const MENU_WIDTH = 200;
const SUBMENU_OFFSET = 4;
/** Hover intent, both ways: open after, and close after leaving. */
const HOVER_DELAY = 150;

/* 1176:4867 / 4902: the surface is `py-[6px]` with the 12px inset on the
   ROWS, so a highlight runs the full width; radius 8. Fixed-positioned at
   the pointer, which is the one computed value (set inline below). */
const SURFACE =
  "tw:fixed tw:min-w-[200px]! tw:px-0! tw:py-1.5! tw:rounded-lg tw:border tw:border-[var(--bk-border)] " +
  "tw:bg-[var(--bk-bg-card)] tw:[box-shadow:var(--bk-shadow-overlay)] tw:text-[var(--bk-ink)] tw:outline-none";

/* 4428:43928: 13px ink rows on a 30 pitch, full-bleed (no row radius inside
   a card whose own padding is vertical only), the `--color/bg-selected` tint
   (1176:4872) on hover and on keyboard focus. */
const ROW =
  "tw:!h-[30px] tw:!min-h-[30px] tw:!px-3 tw:!rounded-none tw:!text-[13px] tw:!font-normal " +
  "tw:enabled:hover:!bg-[var(--bk-accent-tint)] tw:focus-visible:!bg-[var(--bk-accent-tint)] tw:focus-visible:!text-[var(--bk-ink)]";
const ROW_OPEN = "tw:!bg-[var(--bk-accent-tint)]";
const HINT = "tw:ml-auto tw:pl-2 tw:text-[12px] tw:tracking-[0.5px] tw:text-[var(--bk-ink-muted)]";
const RULE = "tw:h-px tw:my-1.5 tw:bg-[var(--bk-border)]";

const enabledFor = (action: ContextAction, context: ActionContext) =>
  action.isEnabled ? action.isEnabled(context) : true;

export const ElementContextMenu: React.FC<ElementContextMenuProps> = (props) => (
  <Portal>
    <ContextMenuPanel {...props} />
  </Portal>
);

type OpenSubmenu = { id: string; x: number; y: number; viaKeyboard: boolean };

const ContextMenuPanel: React.FC<ElementContextMenuProps> = ({ x, y, actions, context, onClose }) => {
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const [sub, setSub] = React.useState<OpenSubmenu | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useClickOutside(wrapRef, onClose, { closeOnEscape: true });

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  React.useEffect(() => clearTimer, []);

  /** Beside its row: right of it, or left when the viewport has no room; grown
   *  upward from the row's foot when it would run off the bottom. */
  const placeFor = (row: HTMLElement, id: string, viaKeyboard: boolean): OpenSubmenu => {
    const r = row.getBoundingClientRect();
    const left = window.innerWidth - r.right < MENU_WIDTH + 20;
    const estimated = 300;
    const above = window.innerHeight - r.top < estimated;
    return {
      id,
      viaKeyboard,
      x: left ? r.left - MENU_WIDTH - SUBMENU_OFFSET : r.right + SUBMENU_OFFSET,
      y: above ? Math.max(8, r.bottom - estimated) : r.top - 6,
    };
  };

  const rowFor = (id: string) => wrapRef.current?.querySelector<HTMLElement>(`[data-testid="canvas-ctx-item-${id}"]`) ?? null;

  const closeSubmenu = (refocus: boolean) => {
    clearTimer();
    if (refocus && sub) rowFor(sub.id)?.focus();
    setSub(null);
  };

  const run = (action: ContextAction) => {
    if (!enabledFor(action, context) || !action.handler) return;
    action.handler(context);
    onClose();
  };

  const openFromKeyboard = (action: ContextAction, row: HTMLElement) => {
    clearTimer();
    setSub(placeFor(row, action.id, true));
  };

  if (!actions.length) return null;

  const rows: React.ReactNode[] = [];
  actions.forEach((action, index) => {
    if (index > 0 && actions[index - 1].group !== action.group) {
      rows.push(<div key={`rule-${action.id}`} role="separator" className={RULE} />);
    }
    const enabled = enabledFor(action, context);
    const hasSub = Boolean(action.submenu?.length);
    const open = sub?.id === action.id;
    rows.push(
      <MenuItem
        key={action.id}
        data-testid={`canvas-ctx-item-${action.id}`}
        className={open ? `${ROW} ${ROW_OPEN}` : ROW}
        disabled={!enabled}
        aria-haspopup={hasSub ? "menu" : undefined}
        aria-expanded={hasSub ? open : undefined}
        icon={action.icon === "sparkles" ? <Sparkles size={14} aria-hidden="true" /> : undefined}
        onMouseEnter={(e) => {
          clearTimer();
          if (!hasSub) {
            if (sub) timer.current = setTimeout(() => setSub(null), HOVER_DELAY);
            return;
          }
          const row = e.currentTarget;
          timer.current = setTimeout(() => setSub(placeFor(row, action.id, false)), HOVER_DELAY);
        }}
        onMouseLeave={() => {
          clearTimer();
          if (hasSub) timer.current = setTimeout(() => setSub(null), HOVER_DELAY);
        }}
        onKeyDown={(e) => {
          if (hasSub && (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            openFromKeyboard(action, e.currentTarget);
          }
        }}
        onClick={(e) => (hasSub ? openFromKeyboard(action, e.currentTarget) : run(action))}
      >
        <span className="tw:flex tw:w-full tw:items-center">
          <span>{action.label}</span>
          {action.shortcut ? <span className={HINT}>{formatShortcutHint(action.shortcut, isMac())}</span> : null}
          {hasSub ? (
            <span aria-hidden="true" className={HINT}>
              {">"}
            </span>
          ) : null}
        </span>
      </MenuItem>,
    );
  });

  const subAction = sub ? actions.find((a) => a.id === sub.id) : undefined;

  return (
    <div ref={wrapRef} className="tw:contents">
      <Menu
        label="Element context menu"
        data-testid="canvas-ctx-menu"
        className={SURFACE}
        style={{ top: y, left: x, zIndex: Z_INDEX.contextMenu }}
        onKeyDown={(e) => {
          /* ↑ ↓ leave an open submenu behind them. */
          if (sub && (e.key === "ArrowDown" || e.key === "ArrowUp")) closeSubmenu(false);
        }}
      >
        {rows}
      </Menu>
      {subAction?.submenu && sub ? (
        <Menu
          key={sub.id}
          label={subAction.label}
          data-testid="canvas-ctx-submenu"
          className={SURFACE}
          autoFocus={sub.viaKeyboard}
          style={{ top: sub.y, left: sub.x, zIndex: Z_INDEX.contextMenu + 1 }}
          onMouseEnter={clearTimer}
          onMouseLeave={() => {
            clearTimer();
            timer.current = setTimeout(() => setSub(null), HOVER_DELAY);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "Escape") {
              e.preventDefault();
              /* This Esc is the submenu's: the whole menu stays open. */
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              closeSubmenu(true);
            }
          }}
        >
          {subAction.submenu.map((action) => (
            <MenuItem
              key={action.id}
              data-testid={`canvas-ctx-item-${action.id}`}
              className={ROW}
              disabled={!enabledFor(action, context)}
              onClick={() => run(action)}
            >
              <span className="tw:flex tw:w-full tw:items-center">
                <span>{action.label}</span>
                {action.shortcut ? <span className={HINT}>{formatShortcutHint(action.shortcut, isMac())}</span> : null}
              </span>
            </MenuItem>
          ))}
        </Menu>
      ) : null}
    </div>
  );
};

export default ElementContextMenu;

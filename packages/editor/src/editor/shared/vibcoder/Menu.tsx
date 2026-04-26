/**
 * Vibcoder Menu wrapper — action list molecule.
 * Renders the bd-menu composite from
 * src/themes/components/molecules/popover.css (one CSS file ships three
 * conceptually distinct molecules — Popover + Tooltip + Menu — split into
 * three wrapper files per the Phase 2 plan).
 *
 * Slot composition (Contract A from Phase 2 design):
 *   Menu container holds MenuGroup / MenuLabel / MenuItem siblings as
 *   children. Caller composes the action list explicitly.
 *
 * Sibling exports (Contract C):
 *   Menu       bd-menu container (renders <div role="menu">)
 *   MenuGroup  bd-menu__group section wrapper (CSS adds top-border between
 *              consecutive groups)
 *   MenuLabel  bd-menu__label uppercase section heading
 *   MenuItem   bd-menu__item interactive row (renders <button>) with
 *              optional icon / text / kbd / chevron slots
 *
 * Variants from `vibcoder-variants.mjs molecules/popover` (filtered to
 * bd-menu__item):
 *   variants: danger (red treatment via .bd-menu__item--danger)
 *
 * MenuItem state props (paired with ARIA per Phase 1 convention):
 *   selected  → applies .is-on + aria-checked="true"
 *   danger    → applies .bd-menu__item--danger
 *   disabled  → forwards native disabled + applies aria-disabled (CSS
 *               selector matches both [disabled] and [aria-disabled="true"])
 *
 * Keyboard navigation: out of scope for Phase 2. Caller wires arrow-key
 * navigation externally OR a Phase 3 organism (CommandPalette,
 * RightClickMenu) will provide it. The wrapper renders semantic
 * <button> children inside <div role="menu"> so default tab-order works.
 *
 * forwardRef on every export — Menu root is anchor measurement target;
 * MenuItem is the focusable element callers ref to programmatically
 * focus.
 *
 * @license BSD-3-Clause
 */
import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  forwardRef,
} from "react";

export type MenuProps = Omit<HTMLAttributes<HTMLDivElement>, "role">;

export const Menu = forwardRef<HTMLDivElement, MenuProps>(
  ({ className, children, ...rest }, ref) => {
    const classes = ["bd-menu", className].filter(Boolean).join(" ");
    return (
      <div ref={ref} role="menu" className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
Menu.displayName = "Menu";

export type MenuGroupProps = Omit<HTMLAttributes<HTMLDivElement>, "role">;

export const MenuGroup = forwardRef<HTMLDivElement, MenuGroupProps>(
  ({ className, children, ...rest }, ref) => {
    const classes = ["bd-menu__group", className].filter(Boolean).join(" ");
    return (
      <div ref={ref} role="group" className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
MenuGroup.displayName = "MenuGroup";

export type MenuLabelProps = HTMLAttributes<HTMLDivElement>;

export const MenuLabel = forwardRef<HTMLDivElement, MenuLabelProps>(
  ({ className, children, ...rest }, ref) => {
    const classes = ["bd-menu__label", className].filter(Boolean).join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
MenuLabel.displayName = "MenuLabel";

export interface MenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * When set, upgrades ARIA role from "menuitem" to "menuitemcheckbox" so
   * `aria-checked` is valid per ARIA 1.2. Applies `is-on` class + `aria-checked={true|false}`.
   * Leave undefined for plain action items (no checkable semantics).
   */
  selected?: boolean;
  /** Applies .bd-menu__item--danger (red treatment for destructive ops). */
  danger?: boolean;
  /** Optional leading icon slot (caller passes <Icon name=...>). */
  icon?: ReactNode;
  /** Optional trailing keyboard shortcut slot (caller passes <Kbd>). */
  kbd?: ReactNode;
  /** Optional trailing chevron (submenu affordance). */
  chevron?: ReactNode;
}

export const MenuItem = forwardRef<HTMLButtonElement, MenuItemProps>(
  (
    {
      selected,
      danger,
      icon,
      kbd,
      chevron,
      children,
      className,
      type = "button",
      disabled,
      ...rest
    },
    ref,
  ) => {
    const classes = [
      "bd-menu__item",
      selected && "is-on",
      danger && "bd-menu__item--danger",
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <button
        ref={ref}
        type={type}
        role={selected !== undefined ? "menuitemcheckbox" : "menuitem"}
        aria-checked={selected !== undefined ? selected : undefined}
        aria-disabled={disabled ? true : undefined}
        disabled={disabled}
        className={classes}
        {...rest}
      >
        {icon && (
          <span className="bd-menu__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="bd-menu__text">{children}</span>
        {kbd && <span className="bd-menu__kbd">{kbd}</span>}
        {chevron && (
          <span className="bd-menu__chevron" aria-hidden="true">
            {chevron}
          </span>
        )}
      </button>
    );
  },
);
MenuItem.displayName = "MenuItem";

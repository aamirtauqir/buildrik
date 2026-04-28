/**
 * Vibcoder RailTile wrapper — draggable palette tile (left rail / inspector
 * add-block menu / form-builder field palette).
 * Renders the bd-rail-tile composite from
 * src/themes/components/molecules/rail-tile.css.
 *
 * Slot composition (Contract A from Phase 2 design):
 *   icon      required structural slot — caller passes <Icon name=…>
 *   label     required structural slot → flat string (also used as
 *             aria-label fallback when caller does not pass one explicitly)
 *   count     optional decorative slot — short numeric / text affordance
 *             (mono micro-text rendered in __count slot)
 *
 * State props (paired with ARIA per Phase 1 convention):
 *   active    visual marker → applies `is-active` class. Caller still owns
 *             aria-current="page" via the standard prop spread because the
 *             "active" semantic differs by host (rail item vs nav item vs
 *             selected palette tile). The wrapper does NOT auto-emit
 *             aria-current — same precedent as Tabs/SectionHead.
 *
 * Cross-MOLECULE imports (FIRST in Phase 2 — proves cross-molecule pattern):
 *   Tooltip + TooltipTrigger + TooltipPortal + TooltipContent +
 *   TooltipTitle + TooltipDesc + TooltipKbd from sibling ./Tooltip molecule.
 *   The tooltip prop accepts either a plain string (rendered inline inside
 *   TooltipContent) or a ReactNode for richer compositions like
 *   <><TooltipTitle/><TooltipDesc/></>.
 *
 * Tooltip render approach (Bucket B1 T1 update — Radix-backed compound).
 *   When `tooltip` is provided, the button is wrapped in a Tooltip Root with
 *   TooltipTrigger asChild + TooltipPortal + TooltipContent siblings. Radix
 *   handles hover/focus visibility per the ambient TooltipProvider's
 *   delayDuration (consumers must mount TooltipProvider once at the app
 *   shell). When `tooltip` is omitted, no Tooltip node ships — keeps the
 *   DOM clean.
 *
 * Variants from `vibcoder-variants.mjs molecules/rail-tile`:
 *   variants: horizontal (default flex row), vertical (column for grids)
 *   sizes:    sm
 *
 * forwardRef targets the <button> (focus management + drag-source measurement).
 *
 * @license BSD-3-Clause
 */
import {
  type ButtonHTMLAttributes,
  type ReactNode,
  forwardRef,
} from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
} from "./Tooltip";

export type RailTileSize = "sm";
export type RailTileOrientation = "horizontal" | "vertical";

export interface RailTileProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Required leading glyph slot (caller passes <Icon name=…>). */
  icon: ReactNode;
  /** Required label text (also used as aria-label when caller omits one). */
  label: string;
  /** Optional trailing count / micro-meta slot. */
  count?: ReactNode;
  /**
   * Visual-only active marker. Adds `is-active` class. Caller owns
   * `aria-current` via the standard prop because the active semantic
   * differs by host (rail item vs nav item vs palette).
   */
  active?: boolean;
  /** Tile size — `sm` shrinks padding + glyph. md is base default. */
  size?: RailTileSize;
  /** Layout orientation. `horizontal` is base default; `vertical` stacks
   * glyph above label for grid layouts (also hides __grip per CSS). */
  orientation?: RailTileOrientation;
  /**
   * Optional tooltip content shown alongside the tile. When provided, a
   * <Tooltip> sibling node is rendered after the button. Visibility is
   * caller-owned (or Phase 3 hover-intent organism wires it) — the
   * vendored CSS does NOT auto-show on hover. Pass a string for a
   * single-line tooltip OR a ReactNode for richer compositions
   * (TooltipTitle + TooltipDesc + TooltipKbd siblings).
   */
  tooltip?: ReactNode | string;
}

export const RailTile = forwardRef<HTMLButtonElement, RailTileProps>(
  (
    {
      icon,
      label,
      count,
      active,
      size,
      orientation,
      tooltip,
      className,
      type = "button",
      "aria-label": ariaLabel,
      ...rest
    },
    ref,
  ) => {
    const classes = [
      "bd-rail-tile",
      size && `bd-rail-tile--${size}`,
      orientation && `bd-rail-tile--${orientation}`,
      active && "is-active",
      className,
    ]
      .filter(Boolean)
      .join(" ");
    const button = (
      <button
        ref={ref}
        type={type}
        className={classes}
        aria-label={ariaLabel ?? label}
        {...rest}
      >
        <span className="bd-rail-tile__grip" aria-hidden="true" />
        <span className="bd-rail-tile__glyph" aria-hidden="true">
          {icon}
        </span>
        <span className="bd-rail-tile__body">
          <span className="bd-rail-tile__label">{label}</span>
          {count !== undefined && count !== null && count !== false && (
            <span className="bd-rail-tile__count">{count}</span>
          )}
        </span>
      </button>
    );
    if (tooltip === undefined) return button;
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipPortal>
          <TooltipContent>{tooltip}</TooltipContent>
        </TooltipPortal>
      </Tooltip>
    );
  },
);
RailTile.displayName = "RailTile";

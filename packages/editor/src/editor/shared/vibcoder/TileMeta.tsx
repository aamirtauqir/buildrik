/**
 * Vibcoder TileMeta wrapper — tile foot row composite.
 * Renders the bd-tile-meta composite from
 * src/themes/components/molecules/tile-meta.css.
 *
 * Slot composition (Contract A from Phase 2 design):
 *   title     required structural slot → flat string (renders __name)
 *   meta      optional supportive slot → flat string (renders __sub)
 *   children  optional decorative slot — caller passes <IconButton /> or
 *             <Badge /> for the right-aligned action area (renders inside
 *             __action wrapper). Omit children entirely on centered
 *             template tiles.
 *
 * No cross-atom imports — TileMeta owns its own __name / __sub typography
 * surfaces (NOT shared with form-field or toggle-row label classes).
 *
 * Variant union from `vibcoder-variants.mjs molecules/tile-meta`:
 *   variants: centered    (no action slot, centered text — template tiles)
 *             inline      (single row, no sub — collapses meta inline)
 *             with-status (caller drops a <StatusDot /> as first child via
 *                          composition — wrapper does NOT inject one)
 *
 * Note on `with-status`: per the upstream CSS docstring, the
 * .bd-tile-meta--with-status > .bd-status-dot selector targets a
 * status-dot atom dropped as the FIRST child of the tile-meta root —
 * NOT inside __action. Phase 2 ships the variant flag; callers compose
 * the leading dot manually because the wrapper template here renders
 * __body first (would break the > combinator). Document this in the
 * gallery example.
 *
 * forwardRef on the root <div>.
 *
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, type ReactNode, forwardRef } from "react";

export type TileMetaVariant = "centered" | "inline" | "with-status";

export interface TileMetaProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** Required tile name (primary text, ellipsis-truncates on overflow). */
  title: string;
  /** Optional secondary line (e.g., "Edited 3h ago"). */
  meta?: string;
  /** Visual variant. Adds the matching --centered / --inline / --with-status modifier. */
  variant?: TileMetaVariant;
  /**
   * Right-aligned action slot — caller passes <IconButton /> or <Badge />.
   * Omit on centered/template tiles (CSS hides .bd-tile-meta__action when
   * --centered is active).
   */
  children?: ReactNode;
}

export const TileMeta = forwardRef<HTMLDivElement, TileMetaProps>(
  ({ title, meta, variant, className, children, ...rest }, ref) => {
    const classes = [
      "bd-tile-meta",
      variant && `bd-tile-meta--${variant}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        <div className="bd-tile-meta__body">
          <span className="bd-tile-meta__name">{title}</span>
          {meta && <span className="bd-tile-meta__sub">{meta}</span>}
        </div>
        {children && <div className="bd-tile-meta__action">{children}</div>}
      </div>
    );
  },
);
TileMeta.displayName = "TileMeta";

/**
 * Vibcoder Frame — aspect-ratio media container.
 *
 * Renders the `bd-frame` rule from src/themes/components/layouts/frame.css.
 * Clips a child <img>, <video>, <picture>, or <div> to a fixed aspect
 * ratio with object-fit: cover. Replaces ad-hoc `aspect-ratio: N/M;
 * overflow:hidden` patterns across editor chrome — asset-library tiles,
 * template thumbnails, uploader previews, video posters, anywhere a media
 * slot needs a stable footprint regardless of intrinsic media dimensions.
 *
 * For both-axes centering of arbitrary content use Center. For card decks
 * or asset grids that hold many Frames use Grid.
 *
 * `ratio` is REQUIRED — the vendored `.bd-frame` base ships only width
 * and overflow, no aspect-ratio. Without `ratio` the element renders as
 * a full-width unconstrained block (rarely intentional).
 *
 * Ratio class mapping (`:` → `-` substitution to match vendored selectors):
 *   - "1:1"  → bd-frame--1-1
 *   - "16:9" → bd-frame--16-9
 *   - "4:3"  → bd-frame--4-3
 *   - "3:2"  → bd-frame--3-2
 *
 * Child sizing is hardcoded by vendored CSS: `bd-frame > img/video/picture/div`
 * fills 100% width/height with object-fit: cover. This is NOT configurable
 * from the wrapper — there is no `fit` prop because the vendored CSS does
 * not expose one.
 *
 * NOTE: do not pass `bd-frame--*` classes via the className prop. Use the
 * `ratio` prop. Manual class injection produces undefined specificity
 * stacking against the typed prop output.
 *
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, forwardRef } from "react";

export type FrameRatio = "1:1" | "16:9" | "4:3" | "3:2";

export interface FrameProps extends HTMLAttributes<HTMLDivElement> {
  /** Required. Ratio class mapping: "1:1"→bd-frame--1-1, "16:9"→bd-frame--16-9, etc. */
  ratio: FrameRatio;
}

export const Frame = forwardRef<HTMLDivElement, FrameProps>(
  ({ ratio, className, children, ...rest }, ref) => {
    const ratioClass = `bd-frame--${ratio.replace(":", "-")}`;
    const classes = ["bd-frame", ratioClass, className]
      .filter(Boolean)
      .join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
Frame.displayName = "Frame";

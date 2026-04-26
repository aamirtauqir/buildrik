/**
 * Vibcoder Thumb wrapper.
 * Renders the `bd-thumb` class from src/themes/components/atoms/thumb.css —
 * a generic placeholder/image/clickable thumbnail tile.
 *
 * Variant + size + state union from `vibcoder-variants.mjs atoms/thumb`:
 *   sizes: sm (80px tall), md (140px base — no modifier), lg (200px tall)
 *   variants (heuristic bucketed all non-size modifiers as variants):
 *     image          — kind: hosts <img> child, object-fit cover
 *     placeholder    — kind: centered "image" glyph via ::before
 *     interactive    — kind: clickable, hover-lift + focus-ring (button semantics)
 *     ratio-1-1      — modifier: aspect-ratio 1/1 (overrides height)
 *     ratio-16-9     — modifier: aspect-ratio 16/9
 *     ratio-4-3      — modifier: aspect-ratio 4/3
 *
 * `kind` is REQUIRED + mutually exclusive (image vs placeholder vs
 * interactive). Each kind carries different semantic + DOM expectations:
 *   - image:        <div class="bd-thumb bd-thumb--image"><img src alt /></div>
 *   - placeholder:  <div class="bd-thumb bd-thumb--placeholder">{children}</div>
 *   - interactive:  <button class="bd-thumb bd-thumb--interactive">{children}</button>
 *
 * The button render for `interactive` is intentional: the vendored CSS targets
 * `:hover`, `:focus-visible`, `:active`, `[disabled]`, `[aria-disabled="true"]`
 * — semantics that demand a real focusable element. A clickable <div> would
 * fail keyboard a11y. Wrapping `interactive` in a button forces correctness.
 *
 * `ratio` is an orthogonal aspect-ratio modifier (composes with any kind).
 *
 * forwardRef target is `HTMLElement` — broad enough to cover both <div> and
 * <button>, so callers can attach refs regardless of kind. Callers needing
 * the narrower type can cast via TS at the call site (rare).
 *
 * Native `disabled` only meaningful when kind="interactive" (browsers ignore
 * it on <div>); we forward it unconditionally to avoid forking the prop type.
 *
 * @license BSD-3-Clause
 */
import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  forwardRef,
} from "react";

export type ThumbSize = "sm" | "md" | "lg";
export type ThumbRatio = "1-1" | "16-9" | "4-3";
export type ThumbKind = "image" | "placeholder" | "interactive";

interface ThumbBaseProps {
  kind: ThumbKind;
  size?: ThumbSize;
  ratio?: ThumbRatio;
  /** Required when kind="image"; ignored otherwise. */
  src?: string;
  alt?: string;
  children?: ReactNode;
  className?: string;
  /** Honored when kind="interactive" (button); inert on div renders. */
  disabled?: boolean;
}

// HTMLAttributes<HTMLElement> covers div; ButtonHTMLAttributes covers button.
// Intersect to allow either set of native attrs. Caller knows their kind.
export type ThumbProps = ThumbBaseProps &
  Omit<
    HTMLAttributes<HTMLElement> & ButtonHTMLAttributes<HTMLButtonElement>,
    keyof ThumbBaseProps
  >;

export const Thumb = forwardRef<HTMLElement, ThumbProps>(
  (
    {
      kind,
      size = "md",
      ratio,
      src,
      alt,
      disabled,
      className,
      children,
      ...rest
    },
    ref
  ) => {
    const classes = [
      "bd-thumb",
      // md is base default — no `bd-thumb--md` rule exists in vendored CSS
      size !== "md" && `bd-thumb--${size}`,
      ratio && `bd-thumb--ratio-${ratio}`,
      `bd-thumb--${kind}`,
      className,
    ].filter(Boolean).join(" ");

    if (kind === "interactive") {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          className={classes}
          disabled={disabled}
          aria-disabled={disabled || undefined}
          {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          {children}
        </button>
      );
    }
    if (kind === "image") {
      return (
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          className={classes}
          {...(rest as HTMLAttributes<HTMLDivElement>)}
        >
          <img src={src} alt={alt ?? ""} />
        </div>
      );
    }
    // placeholder
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={classes}
        {...(rest as HTMLAttributes<HTMLDivElement>)}
      >
        {children}
      </div>
    );
  }
);
Thumb.displayName = "Thumb";

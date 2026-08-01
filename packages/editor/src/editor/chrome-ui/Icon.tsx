/**
 * Icon + IconButton + Kbd + Spinner.
 *
 * Icon is a sizing and colour wrapper, not an icon set — the glyphs stay where
 * they are (lucide, editor/shared/elementIcons) so this library does not become
 * a place SVGs get pasted into.
 *
 * @license BSD-3-Clause
 */
import React from "react";

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: number | string;
  /** Icons are decorative unless the caller gives them a label. */
  label?: string;
}

export function Icon({ size = 16, label, className, children, style, ...rest }: IconProps) {
  return (
    <span
      className={["tw:inline-flex tw:items-center tw:justify-center tw:flex-none tw:text-current", className]
        .filter(Boolean)
        .join(" ")}
      style={{ width: size, height: size, ...style }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...rest}
    >
      {children}
    </span>
  );
}

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: an icon-only control with no name is invisible to screen readers. */
  label: string;
  size?: "sm" | "md";
  pressed?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = "md", pressed, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={[
        "tw:inline-flex tw:items-center tw:justify-center tw:h-7 tw:w-7 tw:border-0 tw:rounded-md",
        "tw:bg-transparent tw:text-gray-600 tw:cursor-pointer tw:[transition:var(--bk-transition-fast)]",
        "tw:enabled:hover:bg-gray-100 tw:enabled:hover:text-gray-900",
        "tw:aria-pressed:bg-blue-50 tw:aria-pressed:text-blue-700",
        "tw:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]",
        "tw:disabled:opacity-50 tw:disabled:cursor-not-allowed",
        size === "sm" && "tw:h-6 tw:w-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      {...rest}
    >
      {children}
    </button>
  );
});

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {}

export function Kbd({ className, children, ...rest }: KbdProps) {
  return (
    <kbd
      className={[
        "tw:inline-flex tw:items-center tw:justify-center tw:min-w-5 tw:h-5 tw:px-1",
        "tw:border tw:border-gray-200 tw:border-b-2 tw:rounded-sm tw:bg-gray-100",
        "tw:[font-family:var(--bk-font-mono)] tw:text-[11px] tw:text-gray-600",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </kbd>
  );
}

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "md" | "lg";
  label?: string;
}

/** flowbite-react's own `Spinner` is a different, larger-scope component
 *  (used elsewhere post-Skeleton-swap) — this one stays a plain custom dot
 *  loader (border-ring + rotate), same shape as before. Duration 700ms has
 *  no Tailwind `animate-*` ramp match (`animate-spin` is 1s); the arbitrary
 *  `animation` value below names Tailwind's OWN built-in `spin` keyframe
 *  (`to { transform: rotate(360deg) }`, confirmed byte-identical to the
 *  deleted `@keyframes bk-spin` by reading tailwindcss/theme.css) so no new
 *  keyframe definition is needed anywhere. */
const SIZE: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "tw:h-3 tw:w-3 tw:border-[1.5px]",
  md: "tw:h-4 tw:w-4 tw:border-2",
  lg: "tw:h-6 tw:w-6 tw:border-2",
};

export function Spinner({ size = "md", label = "Loading", className, ...rest }: SpinnerProps) {
  return (
    <span
      className={[
        "tw:inline-block tw:flex-none tw:rounded-full tw:border-gray-200 tw:border-t-blue-700",
        "tw:[animation:spin_700ms_linear_infinite]",
        SIZE[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-label={label}
      {...rest}
    />
  );
}

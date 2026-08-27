/**
 * HintTooltip — a tooltip that adds NO element to the DOM around its trigger.
 *
 * flowbite's Tooltip renders a Fragment of two siblings: a `div` wrapper around
 * the trigger, and the `role="tooltip"` bubble. Inside a container with a role
 * that constrains its children — the rail is `role="tablist"`, which may own
 * only tabs — those two extra elements make the container invalid, and axe
 * reports `aria-required-children` (critical) with the tab-set relationship
 * lost for every AT user. Neither child can be re-roled from the outside:
 * arbitrary props spread onto the bubble, not the wrapper, and marking the zone
 * `role="presentation"` only makes it transparent, so the tooltips surface to
 * the tablist directly (tried and reverted 2026-08-21).
 *
 * So this one clones its single child instead of wrapping it, and portals the
 * bubble to the overlay root. The tablist's children stay exactly the tabs.
 *
 * Positioning is hand-rolled rather than @floating-ui/react: flowbite's copy is
 * nested under pnpm and not resolvable from this package, and a label bubble
 * that opens below a fixed rail needs an anchor and a viewport clamp, not a
 * middleware stack.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { Portal } from "./Portal";

/** `right` is for a vertical icon rail: the bubble sits beside the icon,
 *  vertically centred, the way every icon rail places one. */
export type HintTooltipPlacement = "bottom" | "bottom-end" | "right";

export interface HintTooltipProps {
  /** Bubble body. Kept a ReactNode so a label + shortcut can compose. */
  content: React.ReactNode;
  placement?: HintTooltipPlacement;
  /** Hover open delay. Focus always opens immediately. */
  delay?: number;
  /** Exactly one element — it IS the trigger; nothing is rendered around it. */
  children: TriggerElement;
}

/* Mirrors flowbite's default dark tooltip so the rail looks unchanged.

   `z-50` was hardcoded here. The token registry ships ten layers ending at
   `--bk-z-tooltip: 90`, and 50 is `--bk-z-overlay` — so the one element that
   must sit above everything was pinned to the same plane as the things it has
   to clear. Bypassing a token that exists is not a style choice.

   12px, not `text-sm`'s 14: this is a hint, and it was rendering at body size.

   NOT fixed here, because it is a founder call and not a bug: `bg-gray-900`
   is `#111827`, every channel under 0x35, against DESIGN.md's NO BLACK RULE
   ("Account avatar, context menus, tooltips all follow this"). Flowbite's own
   Tooltip is dark too, and board 138:198 specifies a dark bubble, so DESIGN.md
   and the boards disagree and every tooltip in the product moves together.
   Recorded in the redesign plan for adjudication. */
const BUBBLE_CLASS =
  "tw:fixed tw:max-w-[280px] tw:whitespace-normal tw:rounded-lg tw:px-3 tw:py-2 " +
  "tw:bg-gray-900 tw:text-white tw:text-[length:var(--bk-text-12)] tw:leading-[var(--bk-leading-16)] tw:font-medium " +
  "tw:[box-shadow:var(--bk-shadow-overlay)] " +
  "tw:[font-family:var(--bk-font-ui)] tw:pointer-events-none";

/* The registry's top layer. A `tw:z-*` utility cannot carry a var(), so this
   rides on the same inline style that already positions the bubble. */
const TOOLTIP_Z = "var(--bk-z-tooltip)";

const GAP = 8;
const EDGE = 8;

type Coords = { left: number; top: number };

type TriggerProps = React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement>;
type TriggerElement = React.ReactElement<TriggerProps>;

function place(
  anchor: DOMRect,
  bubble: DOMRect,
  placement: HintTooltipPlacement,
): Coords {
  const maxLeft = window.innerWidth - bubble.width - EDGE;
  const maxTop = window.innerHeight - bubble.height - EDGE;

  /* Beside the icon, vertically centred. `bottom` on a narrow vertical rail
     put the bubble at the ICON's left edge and let it run past the rail's own
     width into the open drawer — measured live, roughly a third of the bubble.
     It straddled two surfaces and belonged to neither. */
  if (placement === "right") {
    const left = anchor.right + GAP;
    const top = anchor.top + anchor.height / 2 - bubble.height / 2;
    return {
      left: Math.max(EDGE, Math.min(left, Math.max(EDGE, maxLeft))),
      top: Math.max(EDGE, Math.min(top, Math.max(EDGE, maxTop))),
    };
  }

  const left =
    placement === "bottom-end" ? anchor.right - bubble.width : anchor.left;
  const top = anchor.bottom + GAP;
  return {
    left: Math.max(EDGE, Math.min(left, Math.max(EDGE, maxLeft))),
    // Flip above the anchor only when below genuinely does not fit.
    top: top > maxTop ? Math.max(EDGE, anchor.top - bubble.height - GAP) : top,
  };
}

export function HintTooltip({
  content,
  placement = "bottom",
  delay = 150,
  children,
}: HintTooltipProps) {
  const id = React.useId();
  const [open, setOpen] = React.useState(false);
  const [coords, setCoords] = React.useState<Coords | null>(null);
  const anchorRef = React.useRef<HTMLElement | null>(null);
  const bubbleRef = React.useRef<HTMLDivElement | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const close = React.useCallback(() => {
    cancel();
    setOpen(false);
    setCoords(null);
  }, [cancel]);

  React.useEffect(() => cancel, [cancel]);

  const reposition = React.useCallback(() => {
    const a = anchorRef.current;
    const b = bubbleRef.current;
    if (!a || !b) return;
    setCoords(place(a.getBoundingClientRect(), b.getBoundingClientRect(), placement));
  }, [placement]);

  /* Positioning hangs off the bubble's own ref, not a layout effect keyed on
     `open`: Portal renders null on its first pass while it resolves the overlay
     root, so at that point there is no bubble to measure and the effect ran
     against nothing — measured live, the bubble sat at 0,0 with opacity 0. The
     ref fires when the node actually attaches. */
  const setBubbleRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      bubbleRef.current = node;
      if (node) reposition();
    },
    [reposition],
  );

  React.useLayoutEffect(() => {
    if (open) reposition();
  }, [open, reposition, content]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    // Capture: the rail sits in a scrolling shell, and a bubble anchored to a
    // stale rect is worse than no bubble.
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    document.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open, reposition, close]);

  const child: TriggerElement = React.Children.only(children);
  const childProps = child.props;

  const setRef = (node: HTMLElement | null) => {
    anchorRef.current = node;
    // React 19 passes ref as a normal prop; the child may still want its own.
    const own = childProps.ref;
    if (typeof own === "function") own(node);
    else if (own) own.current = node;
  };

  /** Their handler still runs — this component adds behaviour, never replaces it. */
  const chain =
    <E,>(theirs: ((e: E) => void) | undefined, ours: (e: E) => void) =>
    (e: E) => {
      theirs?.(e);
      ours(e);
    };

  const trigger = React.cloneElement(child, {
    ref: setRef,
    "aria-describedby": open ? id : undefined,
    onPointerEnter: chain(childProps.onPointerEnter, () => {
      cancel();
      timer.current = setTimeout(() => setOpen(true), delay);
    }),
    onPointerLeave: chain(childProps.onPointerLeave, close),
    onPointerDown: chain(childProps.onPointerDown, close),
    onFocus: chain(childProps.onFocus, () => {
      cancel();
      setOpen(true);
    }),
    onBlur: chain(childProps.onBlur, close),
  });

  return (
    <>
      {trigger}
      {open ? (
        <Portal>
          <div
            ref={setBubbleRef}
            id={id}
            role="tooltip"
            className={BUBBLE_CLASS}
            style={
              coords
                ? { left: coords.left, top: coords.top, zIndex: TOOLTIP_Z }
                : // First paint measures the bubble; showing it at 0,0 first
                  // would flash it in the corner.
                  { left: 0, top: 0, opacity: 0, zIndex: TOOLTIP_Z }
            }
          >
            {content}
          </div>
        </Portal>
      ) : null}
    </>
  );
}

export default HintTooltip;

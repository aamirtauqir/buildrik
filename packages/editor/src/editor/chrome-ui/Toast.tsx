/**
 * Toast — transient feedback.
 *
 * The store lives at module level so a toast fired during a route change or
 * from a non-React callsite (an engine event, a worker result) still lands, and
 * so it survives HMR in dev. The provider only subscribes to it.
 *
 * THE STACKING RULE lives here, in the store, not at the call sites (plan
 * 2026-09-21 decisions #24 / #35). Ten fast drops used to stack ten toasts
 * with ten Undo buttons, each reverting a different action than the one the
 * user was looking at. Now:
 *
 *   - at most ONE transient toast is visible; the newest replaces it, so an
 *     Undo on screen is always the undo of the LAST action;
 *   - persistent toasts — `tone: "error"` or `duration: Infinity` — are never
 *     replaced by a transient and are kept FIRST in the queue, so they render
 *     above the transient in the bottom-anchored column;
 *   - a toast that offers Undo lingers at least 8 s (decision #17 — a user who
 *     expected a confirm sees the element vanish, and 5 s is not enough to
 *     read, decide and reach the button); everything else defaults to 5 s;
 *   - an ERROR toast does not time out (owner call 2026-10-04): it stays until
 *     it is closed with ✕ or its action runs. An explicit `duration` from the
 *     caller still wins.
 *
 * THE ANCHOR is the bottom-RIGHT (owner decision 2026-10-03: the boards win
 * over the 5940:148012 bottom-left anchor and the 7574:194162 dark catalogue).
 * The Settings and CMS boards — 8134:212718 (General · saved, Publish),
 * 8136:215838 (Redirects · deleted-undo, Undo), 8139:217711 / 8139:217890 /
 * 8139:218055 (CMS record / collection deleted, publish blocked) — all draw
 * the toast 48px in from the right edge. With the canvas column on screen
 * (`data-bk-toast-anchor`, non-zero width) the toast sits 16px in from that
 * column's right edge and 16px above its footer toolbar
 * (`data-bk-toast-floor`), so it never covers the inspector or the docked
 * toolbar. Full-page views (Settings, CMS, Brand) collapse the column to 0
 * width; there it falls back to the boards' 48px from the window's right and
 * bottom. The overlay root is a sibling of `.bd-studio`, so this is measured,
 * not inherited.
 *
 * THE LAYER is --bk-z-toast, above everything — except an open modal
 * (EDT-017). While any `aria-modal` dialog is open (every OverlayMount, so
 * every Modal, confirm and palette) the viewport drops to --bk-z-popover,
 * under the modal scrim: a sync toast once sat on the Publish confirm's
 * Cancel. The toast stays visible, dimmed by the scrim, and comes back up
 * when the modal closes.
 *
 * THE SURFACE is those boards' card: white (`--bk-bg-elevated`), a 1px
 * `--bk-border` border, r8, pad 16, gap 8, 460 wide, no shadow. Title 14/20
 * semibold, body 13/20 regular, both gray-700 (the boards' #334155 has no
 * token; gray-700 is its nearest). Actions are Button Kind=link Size=sm in the
 * accent: 28 high, pad 8, 12/18 medium, r6. A toast without a title is the
 * same card on one row. The boards draw no tone dot and no ✕; the 8px tone dot
 * (success / warning / error) and the ✕ stay, because removing them would
 * silently drop a capability (owner rule 2026-09-24, designer-notes.md).
 *
 * The viewport is aria-live="polite": announced when the user is idle rather
 * than interrupting mid-sentence. Errors use assertive, because "publish
 * failed" losing the race with a form label is worse than an interruption.
 *
 * API mirrors the previous library — call sites use `useToast().addToast(...)`
 * and none of them had to change for the policy. The context value is a
 * module constant (decision #43): a consumer renders once no matter how many
 * toasts fire, because the queue is read by the viewport's own subscription,
 * never through the context.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { createPortal } from "react-dom";
import { Button } from "flowbite-react";
import { X } from "lucide-react";
import { getOverlayRoot } from "./OverlayRoot";

/* Button Kind=link Size=sm (boards 8134:212718 / 8136:215838): 28 high, pad 8,
   12/18 medium accent, r6. */
const LINK_BTN_CLASS =
  "tw:h-7 tw:px-2 tw:py-0 tw:border-0 tw:bg-transparent tw:hover:bg-transparent tw:hover:underline " +
  "tw:text-[var(--bk-accent)] tw:text-xs tw:leading-[18px] tw:font-medium tw:rounded-[var(--bk-radius-md)] " +
  "tw:focus:ring-0 tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

const CLOSE_BTN_CLASS =
  "tw:h-6 tw:w-6 tw:p-0 tw:border-0 tw:bg-transparent tw:hover:bg-[var(--bk-gray-100)] tw:text-[var(--bk-gray-500)] " +
  "tw:rounded-[var(--bk-radius-md)] tw:focus:ring-0 tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

export type ToastTone = "info" | "success" | "warning" | "error" | "neutral";

/** The 8px tone dot, in the semantic fills (on white). Neutral and info draw none. */
const TONE_DOT_CLASS: Partial<Record<ToastTone, string>> = {
  success: "tw:bg-[var(--bk-success)]",
  warning: "tw:bg-[var(--bk-warning)]",
  error: "tw:bg-[var(--bk-error)]",
};

export interface ToastActionPayload {
  label: string;
  onClick: () => void;
}

export interface ToastInput {
  tone?: ToastTone;
  title?: string;
  description: string;
  action?: ToastActionPayload;
  /* C0a (Task 5): a second action button rendered next to `action`. The CMS
     sync layer uses it for a "Keep mine" / "Use theirs" pair on a conflict. */
  secondaryAction?: ToastActionPayload;
  /** ms; Infinity persists until dismissed. Default 5000 (error: Infinity); Undo toasts ≥ 8000. */
  duration?: number;
  /** One fact, one card: a toast with a key replaces the card already showing
   *  that key, and `dismissToastKey` clears it when the fact stops being true
   *  (L3-006 — "Save failed" stayed up after the next save landed). */
  key?: string;
}

export interface QueuedToast extends ToastInput {
  id: string;
  duration: number;
}

export interface UseToastReturn {
  addToast: (input: ToastInput) => string;
  removeToast: (id: string) => void;
}

/** Board 1177:4859's header: "Default 5000ms". */
const TOAST_DEFAULT_DURATION = 5000;
/** Decision #17: a toast offering Undo stays on screen at least this long. */
const TOAST_UNDO_MIN_DURATION = 8000;

/** Persistent toasts survive the next transient and sort first. */
function isPersistent(t: QueuedToast): boolean {
  return t.tone === "error" || !Number.isFinite(t.duration);
}

function offersUndo(input: ToastInput): boolean {
  return input.action?.label.trim().toLowerCase() === "undo";
}

function resolveDuration(input: ToastInput): number {
  const asked = input.duration ?? (input.tone === "error" ? Infinity : TOAST_DEFAULT_DURATION);
  return offersUndo(input) ? Math.max(asked, TOAST_UNDO_MIN_DURATION) : asked;
}

type Listener = (toasts: QueuedToast[]) => void;

const store = (() => {
  let toasts: QueuedToast[] = [];
  const listeners = new Set<Listener>();
  let seq = 0;
  const emit = () => listeners.forEach((l) => l([...toasts]));
  return {
    get toasts() {
      return toasts;
    },
    add(input: ToastInput) {
      const id = `toast-${++seq}`;
      const next: QueuedToast = { ...input, id, duration: resolveDuration(input) };
      if (input.key) toasts = toasts.filter((t) => t.key !== input.key);
      const pinned = toasts.filter(isPersistent);
      /* Persistent first, in arrival order; then the ONE transient — a new
         transient replaces the old, a new persistent slots in above it. */
      toasts = isPersistent(next)
        ? [...pinned, next, ...toasts.filter((t) => !isPersistent(t))]
        : [...pinned, next];
      emit();
      return id;
    },
    remove(id: string) {
      toasts = toasts.filter((t) => t.id !== id);
      emit();
    },
    removeKey(key: string) {
      if (!toasts.some((t) => t.key === key)) return;
      toasts = toasts.filter((t) => t.key !== key);
      emit();
    },
    /**
     * A new listener is handed the current queue immediately.
     *
     * Without that, a toast fired from a CHILD's mount effect was dropped:
     * children's effects always run before their parent's, so the add landed
     * while the provider had not subscribed yet, and the provider's own state
     * was seeded at render time — before the add. Nothing displayed it and
     * nothing ever would, until some later, unrelated toast triggered an emit.
     * Anything that reports on load — "Offline — changes queued", a sync
     * failure noticed during hydration — is exactly that shape.
     */
    subscribe(l: Listener) {
      listeners.add(l);
      l([...toasts]);
      return () => {
        listeners.delete(l);
      };
    },
    /** No provider mounted means nothing can display a toast, so holding a
     *  queue would only leak it into the next mount. */
    clear() {
      toasts = [];
      emit();
    },
    get listenerCount() {
      return listeners.size;
    },
  };
})();

/**
 * Dismiss a toast by the id `addToast` returned, from outside React.
 *
 * This is the same singleton method the context hands out as `removeToast` —
 * `store` itself stays private so nothing can reach `add`/`subscribe` around
 * the provider. It exists because the sync layer's stranded-mirror notices are
 * raised from `window` event callbacks that were handed only `addToast`, and
 * `useToast()` throws outside a provider, which their tests run without.
 */
export const dismissToast = store.remove;

/** Dismiss every toast carrying `key` (see `ToastInput.key`). */
export const dismissToastKey = store.removeKey;

/* One object for the life of the module. `store.add`/`store.remove` are the
   same functions every time, so nothing here can change identity — the 104
   consumers of `useToast()` never re-render because of a toast. */
const TOAST_API: UseToastReturn = { addToast: store.add, removeToast: store.remove };

const ToastContext = React.createContext<UseToastReturn | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastContext.Provider value={TOAST_API}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  );
}

type Anchor = { right: number; bottom: number };

/** In the canvas: 16px in from the canvas column's right edge
 *  (`data-bk-toast-anchor`) and 16px above its footer toolbar
 *  (`data-bk-toast-floor`, else the column's bottom). Without a column wide
 *  enough to hold the card: the boards' 48px from the window's right and
 *  bottom. Full-page views (Settings, CMS, Brand) squeeze the column to a
 *  sliver without unmounting it — measured 2026-10-03 in full-page Settings,
 *  its right edge at x=48, which threw the card off the left of the screen —
 *  so "non-zero" is not the test; "can hold the card" is. The CMS workspace
 *  does not squeeze it at all: it covers a full-width column, and the card
 *  sat 16px off a canvas nobody could see (measured 2026-10-04 at right 16 /
 *  bottom 61, where 8139:217711 draws 48 / 48). A view that covers the
 *  canvas says so with `data-bk-full-page`. */
function measureAnchor(): Anchor {
  if (document.querySelector("[data-bk-full-page]")) return VIEWPORT_ANCHOR;
  const el = document.querySelector("[data-bk-toast-anchor]");
  const r = el?.getBoundingClientRect();
  if (!el || !r || r.width < TOAST_WIDTH + 2 * CANVAS_GAP || !r.height) return VIEWPORT_ANCHOR;
  const floor = el.querySelector("[data-bk-toast-floor]")?.getBoundingClientRect();
  const top = floor && floor.height ? floor.top : r.bottom;
  return {
    right: Math.round(window.innerWidth - r.right + CANVAS_GAP),
    bottom: Math.round(window.innerHeight - top + CANVAS_GAP),
  };
}

const CANVAS_GAP = 16;
/** The boards' card width; the `tw:w-[460px]` on ToastItem. */
const TOAST_WIDTH = 460;
/** Boards 8134:212718 et al.: the card's right edge sits 48px from the window's. */
const VIEWPORT_ANCHOR: Anchor = { right: 48, bottom: 48 };

const MODAL_SELECTOR = '[aria-modal="true"]';

/** True while an aria-modal dialog is open anywhere in the chrome. Watched
 *  only while toasts are showing — there is nothing to re-layer otherwise. */
function useModalOpen(watch: boolean): boolean {
  const [open, setOpen] = React.useState(false);
  React.useLayoutEffect(() => {
    if (!watch) return;
    const update = () => setOpen(document.querySelector(MODAL_SELECTOR) !== null);
    update();
    const mo = new MutationObserver(update);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-modal"] });
    return () => mo.disconnect();
  }, [watch]);
  return watch && open;
}

function ToastViewport() {
  const [toasts, setToasts] = React.useState<QueuedToast[]>(() => [...store.toasts]);
  const [anchor, setAnchor] = React.useState<Anchor>(VIEWPORT_ANCHOR);

  React.useEffect(() => {
    const unsubscribe = store.subscribe(setToasts);
    return () => {
      unsubscribe();
      if (store.listenerCount === 0) store.clear();
    };
  }, []);

  /* Measured while something is showing: the drawer opening, the window
     resizing, or a full-page view handing back to the canvas (a toast's own
     action can do that — Settings' "Publish" opens the Publish panel) moves
     the canvas column, and the toast moves with it. The body does not resize
     when the column does, so the column is observed too. */
  const showing = toasts.length > 0;
  React.useLayoutEffect(() => {
    if (!showing) return;
    const update = () => setAnchor(measureAnchor());
    update();
    window.addEventListener("resize", update);
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    ro?.observe(document.body);
    const column = document.querySelector("[data-bk-toast-anchor]");
    if (column) ro?.observe(column);
    return () => {
      window.removeEventListener("resize", update);
      ro?.disconnect();
    };
  }, [showing]);

  const underModal = useModalOpen(showing);

  if (typeof document === "undefined") return null;
  const hasError = toasts.some((t) => t.tone === "error");
  return createPortal(
    <div
      className={`tw:fixed ${underModal ? "tw:z-[var(--bk-z-popover)]" : "tw:z-[var(--bk-z-toast)]"} tw:flex tw:flex-col tw:items-end tw:gap-2 tw:max-w-[calc(100vw-32px)] tw:pointer-events-none`}
      style={{ right: anchor.right, bottom: anchor.bottom }}
      data-under-modal={underModal ? "true" : undefined}
      role="status"
      aria-live={hasError ? "assertive" : "polite"}
      aria-atomic="false"
      data-testid="toast-viewport"
    >
      {toasts.map((t, i) => (
        <ToastItem key={t.id} toast={t} index={i} onDismiss={store.remove} />
      ))}
    </div>,
    getOverlayRoot(),
  );
}

function ToastItem({
  toast,
  index,
  onDismiss,
}: {
  toast: QueuedToast;
  /* Position in the viewport, so a measurement can address one toast out of a
     stack. The queue is the only stable identity a toast has — its own id is a
     module-level counter that restarts per session. */
  index: number;
  onDismiss: (id: string) => void;
}) {
  const { id, tone = "info", title, description, action, secondaryAction, duration } = toast;

  // A13-14: hover/focus pauses the auto-dismiss timer — a user mid-read (or
  // mid-Undo-click) should not have the toast vanish under their cursor.
  // Tracks remaining time across pause/resume with Date.now() rather than a
  // fixed re-arm, so repeated hover/leave cycles don't reset the clock.
  const remainingRef = React.useRef(duration);
  const startedAtRef = React.useRef(0);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const arm = React.useCallback((ms: number) => {
    clear();
    if (!Number.isFinite(ms)) return;
    startedAtRef.current = Date.now();
    timerRef.current = setTimeout(() => onDismiss(id), ms);
  }, [clear, id, onDismiss]);

  React.useEffect(() => {
    remainingRef.current = duration;
    arm(duration);
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, duration]);

  const pause = () => {
    if (!Number.isFinite(duration) || !timerRef.current) return;
    clear();
    remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAtRef.current));
  };
  const resume = () => {
    if (!Number.isFinite(duration) || timerRef.current) return;
    arm(remainingRef.current);
  };

  const persistent = isPersistent(toast);
  /* An error toast stays until it is dealt with — its action running is that
     (owner call 2026-10-04), so the action takes it down after it runs. */
  const run = (payload: ToastActionPayload) => () => {
    payload.onClick();
    if (tone === "error") onDismiss(id);
  };
  const dotClass = TONE_DOT_CLASS[tone];
  const dot = dotClass ? (
    <span data-testid="toast-tone" aria-hidden="true" className={`tw:block tw:flex-none tw:size-2 tw:rounded-full ${dotClass}`} />
  ) : null;
  const actionButton = action ? (
    <Button color="alternative" size="xs" onClick={run(action)} className={LINK_BTN_CLASS}>
      {action.label}
    </Button>
  ) : null;
  const secondaryActionButton = secondaryAction ? (
    <Button color="alternative" size="xs" onClick={run(secondaryAction)} className={LINK_BTN_CLASS}>
      {secondaryAction.label}
    </Button>
  ) : null;
  /* Library Toast `Close:B` (IconButton 24, icon/x). The catalogue shows it
     off on transients, but dismissing early is something users can do today,
     so it stays on every toast (owner rule 2026-09-24: parity never silently
     removes a capability — designer-notes.md). */
  const closeButton = (
    <Button
      color="alternative"
      size="xs"
      className={`tw:flex-none ${CLOSE_BTN_CLASS}`}
      aria-label="Dismiss notification"
      onClick={() => onDismiss(id)}
    >
      <X size={16} aria-hidden="true" />
    </Button>
  );

  return (
    <div
      data-testid={`toast-item-${index}`}
      data-persistent={persistent ? "true" : undefined}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      className={[
        /* Boards 8134:212718 / 8136:215838 / 8139:*: a 460 white card, 1px
           border, r8, pad 16, gap 8, no shadow. With a title the text stacks
           (title · body · actions); without one it is a single row. */
        title
          ? "tw:relative tw:flex tw:items-start tw:gap-3"
          : "tw:flex tw:items-center tw:gap-3",
        "tw:pointer-events-auto tw:box-border tw:w-[460px] tw:max-w-full tw:p-4",
        "tw:rounded-[var(--bk-radius-lg)] tw:border tw:border-solid tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-elevated)]",
        "tw:text-[var(--bk-gray-700)] tw:[font-family:var(--bk-font-ui)] tw:text-[13px] tw:leading-5",
      ].join(" ")}
    >
      {title ? (
        <>
          {dot ? <span className="tw:pt-1.5">{dot}</span> : null}
          <div className="tw:flex-1 tw:flex tw:flex-col tw:gap-2 tw:min-w-0">
            {/* The ✕ sits in the title's row only — the body runs the card's
                full width under it. */}
            <span className="tw:pr-7 tw:text-[14px] tw:font-semibold">{title}</span>
            <span data-testid={`toast-body-${index}`} className="tw:whitespace-pre-line">{description}</span>
            {actionButton || secondaryActionButton ? (
              <div className="tw:flex tw:gap-2">
                {actionButton}
                {secondaryActionButton}
              </div>
            ) : null}
          </div>
          <span className="tw:absolute tw:top-3.5 tw:right-3">{closeButton}</span>
        </>
      ) : (
        <>
          {dot}
          <span className="tw:min-w-0 tw:flex-1" data-testid={`toast-body-${index}`}>
            {description}
          </span>
          {actionButton}
          {closeButton}
        </>
      )}
    </div>
  );
}

export function useToast(): UseToastReturn {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

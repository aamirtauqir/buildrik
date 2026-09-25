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
 *     read, decide and reach the button); everything else defaults to 5 s.
 *
 * THE ANCHOR is the bottom-left of the CANVAS column, 16px above its toolbar
 * (board 5940:148012, "Moved down · Undo"). The canvas column carries
 * `data-bk-toast-anchor` and its footer toolbar `data-bk-toast-floor`; the
 * viewport measures both.
 * With no anchor mounted (full-page views) it falls back to the window's
 * bottom-left. The overlay root is a sibling of `.bd-studio`, so this is
 * measured, not inherited.
 *
 * THE SURFACE is the toast catalogue's (7574:194162): an ink bar, white 13px
 * text, r8, actions as on-dark link buttons (blue-300), an 8px tone dot for
 * success / warning / error. The owner retired decision #25's NO BLACK RULE
 * for toasts on 2026-09-24. Lines=1 is a 36px bar that hugs its text; a toast
 * with a title is the 420px two-line card. Every toast keeps its ✕ (the
 * library's Close:B), though the catalogue draws it off on transients.
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

/* Button Kind=link Size=sm, on-dark: 28 high, pad 8, 12px medium blue-300. */
const LINK_BTN_CLASS =
  "tw:h-7 tw:px-2 tw:py-0 tw:border-0 tw:bg-transparent tw:hover:bg-transparent tw:hover:underline " +
  "tw:text-[var(--bk-blue-300)] tw:text-xs tw:font-medium tw:rounded-[6px] tw:focus:ring-0 " +
  "tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

const CLOSE_BTN_CLASS =
  "tw:h-6 tw:w-6 tw:p-0 tw:border-0 tw:bg-transparent tw:hover:bg-white/10 tw:text-[var(--bk-gray-400)] " +
  "tw:rounded-[6px] tw:focus:ring-0 tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

export type ToastTone = "info" | "success" | "warning" | "error" | "neutral";

/** The catalogue's 8px tone dot. Neutral and info draw none. */
const TONE_DOT_CLASS: Partial<Record<ToastTone, string>> = {
  success: "tw:bg-[var(--bk-green-400)]",
  warning: "tw:bg-[var(--bk-yellow-300)]",
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
  /** ms; Infinity persists until dismissed. Default 5000; Undo toasts ≥ 8000. */
  duration?: number;
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
  const asked = input.duration ?? TOAST_DEFAULT_DURATION;
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

type Anchor = { left: number; bottom: number } | null;

/** Board 5940:148012: 16px in from the canvas column's left edge
 *  (`data-bk-toast-anchor`) and 16px above its footer toolbar
 *  (`data-bk-toast-floor`, else the column's bottom). */
function measureAnchor(): Anchor {
  const el = document.querySelector("[data-bk-toast-anchor]");
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (!r.width && !r.height) return null;
  const floor = el.querySelector("[data-bk-toast-floor]")?.getBoundingClientRect();
  const top = floor && floor.height ? floor.top : r.bottom;
  return { left: Math.round(r.left + ANCHOR_GAP), bottom: Math.round(window.innerHeight - top + ANCHOR_GAP) };
}

const ANCHOR_GAP = 16;

function ToastViewport() {
  const [toasts, setToasts] = React.useState<QueuedToast[]>(() => [...store.toasts]);
  const [anchor, setAnchor] = React.useState<Anchor>(null);

  React.useEffect(() => {
    const unsubscribe = store.subscribe(setToasts);
    return () => {
      unsubscribe();
      if (store.listenerCount === 0) store.clear();
    };
  }, []);

  /* Measured while something is showing: the drawer opening or the window
     resizing moves the canvas column, and the toast moves with it. */
  const showing = toasts.length > 0;
  React.useLayoutEffect(() => {
    if (!showing) return;
    const update = () => setAnchor(measureAnchor());
    update();
    window.addEventListener("resize", update);
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    ro?.observe(document.body);
    return () => {
      window.removeEventListener("resize", update);
      ro?.disconnect();
    };
  }, [showing]);

  if (typeof document === "undefined") return null;
  const hasError = toasts.some((t) => t.tone === "error");
  return createPortal(
    <div
      className="tw:fixed tw:z-[80] tw:flex tw:flex-col tw:items-start tw:gap-2 tw:max-w-[calc(100vw-32px)] tw:pointer-events-none"
      style={{ left: anchor?.left ?? ANCHOR_GAP, bottom: anchor?.bottom ?? ANCHOR_GAP }}
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
  const { id, tone = "info", title, description, action, duration } = toast;

  React.useEffect(() => {
    if (!Number.isFinite(duration)) return;
    const timer = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  const persistent = isPersistent(toast);
  const dotClass = TONE_DOT_CLASS[tone];
  const dot = dotClass ? (
    <span data-testid="toast-tone" aria-hidden="true" className={`tw:block tw:flex-none tw:size-2 tw:rounded-full ${dotClass}`} />
  ) : null;
  const actionButton = action ? (
    <Button color="alternative" size="xs" onClick={action.onClick} className={LINK_BTN_CLASS}>
      {action.label}
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
      className={[
        /* Lines=1: a 36px bar that hugs its text, pad 10/16, gap 16.
           Lines=2 (a title): the 420px card, pad 16, gap 8. */
        title
          ? "tw:pointer-events-auto tw:flex tw:items-start tw:gap-3 tw:w-[420px] tw:max-w-full tw:p-4"
          : "tw:pointer-events-auto tw:flex tw:items-center tw:gap-4 tw:min-h-9 tw:px-4 tw:py-1",
        "tw:box-border tw:rounded-lg tw:bg-[var(--bk-ink)] tw:text-white",
        "tw:[font-family:var(--bk-font-ui)] tw:text-[13px] tw:leading-5",
      ].join(" ")}
    >
      {title ? (
        <>
          {dot ? <span className="tw:pt-1.5">{dot}</span> : null}
          <div className="tw:flex-1 tw:flex tw:flex-col tw:gap-2 tw:min-w-0">
            <span className="tw:text-sm tw:font-semibold">{title}</span>
            <span data-testid={`toast-body-${index}`}>{description}</span>
            {actionButton ? <div className="tw:flex tw:gap-2 tw:-ml-2">{actionButton}</div> : null}
          </div>
          {closeButton}
        </>
      ) : (
        <>
          {dot}
          <span className="tw:min-w-0" data-testid={`toast-body-${index}`}>
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

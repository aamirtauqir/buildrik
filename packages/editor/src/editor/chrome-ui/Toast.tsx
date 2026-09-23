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
 * THE ANCHOR is the bottom-right of the CANVAS region, not of the window: the
 * viewport's `right` adds `--bk-inspector-w`, which the shell sets to the
 * inspector's width while it is open and to 0 while it is closed, so a toast
 * never sits over the inspector footer's Publish/Save row. The overlay root is
 * a sibling of `.bd-studio`, not a descendant (chrome-reset.css:64), so the
 * shell writes the variable on the document root — a value on `.bd-studio`
 * would never reach this portal.
 *
 * THE SURFACE follows DESIGN.md's NO BLACK RULE (decision #25): every tone is a
 * pale tint or the neutral grey on a hairline, never ink. The Figma library's
 * dark two-line toast (board 814:7027 drew the undo/redo bar on --color/ink)
 * loses to DESIGN.md, the same call the founder made for the tooltip on
 * 2026-08-27. The box-sizing/border reset is carried on the card itself; the
 * `.bd-studio` reset does not reach this portal (TODOS.md:476).
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
import { getOverlayRoot } from "./OverlayRoot";

const GHOST_BTN_CLASS = "tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]";

export type ToastTone = "info" | "success" | "warning" | "error" | "neutral";

/**
 * The tone fills the card and colours the title — board 1177:4859, the toast
 * catalog. It was a 3px left border on a white card, which reads as the same
 * toast five times with a coloured tick mark; the board tints the whole
 * surface, and every value it draws is already a token pair: measured off the
 * frame, `var(--bk-green-100)`/`var(--bk-green-600)`, `var(--bk-blue-50)`/`var(--bk-blue-700)`, `var(--bk-red-100)`/`var(--bk-red-700)`, `var(--bk-yellow-50)`/`var(--bk-yellow-800)`
 * and `var(--bk-gray-100)` for the neutral one, in that order.
 *
 * Same-property values can't be additive (Row/PanelFrame precedent), so each
 * tone carries its own complete pair rather than layering on a base.
 */
/* Each entry carries BOTH the fill and the ink. They are listed whole rather
   than layered on a shared `text-[var(--bk-ink)]` because two utilities for
   the same property on a PLAIN element do not merge — source order in the
   compiled sheet would pick the winner, not the order they are concatenated
   in (CLAUDE.md, "Overriding a flowbite default depends on WHERE the class
   lands"). Same rule Row's SIZE table already follows. */
const TONE_CLASS: Record<ToastTone, string> = {
  neutral: "tw:bg-[var(--bk-gray-100)] tw:text-[var(--bk-ink)]",
  info: "tw:bg-[var(--bk-accent-tint)] tw:text-[var(--bk-ink)]",
  success: "tw:bg-[var(--bk-success-tint)] tw:text-[var(--bk-ink)]",
  warning: "tw:bg-[var(--bk-warning-tint)] tw:text-[var(--bk-ink)]",
  error: "tw:bg-[var(--bk-error-tint)] tw:text-[var(--bk-ink)]",
};

const TONE_TITLE_CLASS: Record<ToastTone, string> = {
  neutral: "tw:text-[var(--bk-ink-soft)]",
  info: "tw:text-[var(--bk-accent-text)]",
  success: "tw:text-[var(--bk-success-text)]",
  warning: "tw:text-[var(--bk-warning-text)]",
  error: "tw:text-[var(--bk-error-text)]",
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

function ToastViewport() {
  const [toasts, setToasts] = React.useState<QueuedToast[]>(() => [...store.toasts]);

  React.useEffect(() => {
    const unsubscribe = store.subscribe(setToasts);
    return () => {
      unsubscribe();
      if (store.listenerCount === 0) store.clear();
    };
  }, []);

  if (typeof document === "undefined") return null;
  const hasError = toasts.some((t) => t.tone === "error");
  return createPortal(
    <div
      /* `right` = 16px + the inspector's width while it is open (0 when
         closed) — the shell owns `--bk-inspector-w`; see the header. */
      className="tw:fixed tw:bottom-4 tw:right-[calc(16px_+_var(--bk-inspector-w,0px))] tw:z-[80] tw:flex tw:flex-col tw:gap-2 tw:w-[360px] tw:max-w-[calc(100vw-32px)] tw:pointer-events-none"
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

  return (
    <div
      data-testid={`toast-item-${index}`}
      data-persistent={isPersistent(toast) ? "true" : undefined}
      className={[
        /* Library Toast Lines=1 is a single bar with its text and action on
           one centred row; Lines=2 carries a title over a body and
           top-aligns. Which one a toast is follows from whether it has a
           title, not from its tone. */
        title
          ? "tw:pointer-events-auto tw:flex tw:items-start tw:gap-2 tw:p-3"
          : "tw:pointer-events-auto tw:flex tw:items-center tw:gap-2 tw:px-3 tw:py-2.5",
        /* The reset for portalled chrome: box-sizing and an explicit hairline,
           because `.bd-studio`'s reset never reaches `#bk-overlay-root`. */
        "tw:box-border tw:rounded-lg tw:border tw:border-solid tw:border-[var(--bk-border)]",
        "tw:[box-shadow:var(--bk-shadow-overlay)] tw:[font-family:var(--bk-font-ui)] tw:text-[13px]",
        TONE_CLASS[tone],
      ].join(" ")}
    >
      <div className="tw:flex-1 tw:flex tw:flex-col tw:gap-0.5 tw:min-w-0">
        {title ? <span className={`tw:font-medium ${TONE_TITLE_CLASS[tone]}`}>{title}</span> : null}
        <span className="tw:text-[var(--bk-ink-soft)] tw:text-xs" data-testid={`toast-body-${index}`}>
          {description}
        </span>
      </div>
      {action ? (
        <Button color="light" size="xs" onClick={action.onClick} className={GHOST_BTN_CLASS}>
          {action.label}
        </Button>
      ) : null}
      <Button
        color="light"
        size="xs"
        className={`tw:flex-none ${GHOST_BTN_CLASS}`}
        aria-label="Dismiss notification"
        onClick={() => onDismiss(id)}
      >
        ✕
      </Button>
    </div>
  );
}

export function useToast(): UseToastReturn {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

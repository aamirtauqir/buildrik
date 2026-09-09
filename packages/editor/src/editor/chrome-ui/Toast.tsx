/**
 * Toast — transient feedback.
 *
 * The store lives at module level so a toast fired during a route change or
 * from a non-React callsite (an engine event, a worker result) still lands, and
 * so it survives HMR in dev. The provider only subscribes to it.
 *
 * The viewport is aria-live="polite": announced when the user is idle rather
 * than interrupting mid-sentence. Errors use assertive, because "publish
 * failed" losing the race with a form label is worse than an interruption.
 *
 * API mirrors the previous library exactly — 34 call sites use
 * `useToast().addToast(...)` and none of them should have to change.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { createPortal } from "react-dom";
import { Button } from "flowbite-react";
import { getOverlayRoot } from "./OverlayRoot";

const GHOST_BTN_CLASS = "tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]";

export type ToastTone = "info" | "success" | "warning" | "error" | "neutral" | "dark";

/**
 * The tone fills the card and colours the title — board 1177:4859, the toast
 * catalog. It was a 3px left border on a white card, which reads as the same
 * toast five times with a coloured tick mark; the board tints the whole
 * surface, and every value it draws is already a token pair: measured off the
 * frame, #DEF7EC/#057A55, #EBF5FF/#1A56DB, #FDE8E8/#C81E1E, #FDFDEA/#723B13
 * and #F3F4F6 for the neutral one, in that order.
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
  /* `dark` is the SIXTH tone and it does not touch the five above. Board
     814:7027 draws all six undo/redo toasts on --color/ink with the message
     in --flowbite/gray/200 — a transient "here is what just happened" bar,
     not one of the five semantic tints board 1177:4859 catalogues. It is
     declared here rather than at the call site so the ink ground, the ink
     type colour and the readable action all move together; a caller that set
     only the fill would have shipped ink-soft body text on ink. */
  dark: "tw:bg-[var(--bk-ink)] tw:text-[var(--bk-gray-200)]",
};

const TONE_TITLE_CLASS: Record<ToastTone, string> = {
  neutral: "tw:text-[var(--bk-ink-soft)]",
  info: "tw:text-[var(--bk-accent-text)]",
  success: "tw:text-[var(--bk-success-text)]",
  warning: "tw:text-[var(--bk-warning-text)]",
  error: "tw:text-[var(--bk-error-text)]",
  dark: "tw:text-white",
};

/* The body line. Every tinted tone keeps ink-soft on its own pale ground;
   `dark` takes the board's --flowbite/gray/200 at 11 (814:7033/7063), which
   is 12.6:1 on ink. */
const TONE_BODY_CLASS: Record<ToastTone, string> = {
  neutral: "tw:text-[var(--bk-ink-soft)] tw:text-xs",
  info: "tw:text-[var(--bk-ink-soft)] tw:text-xs",
  success: "tw:text-[var(--bk-ink-soft)] tw:text-xs",
  warning: "tw:text-[var(--bk-ink-soft)] tw:text-xs",
  error: "tw:text-[var(--bk-ink-soft)] tw:text-xs",
  dark: "tw:text-[var(--bk-gray-200)] tw:text-[11px]",
};

/* The reverse-action link. 814:7034 draws it #80B2FF, which is NOT a token —
   the nearest step in the generated scale is --bk-blue-300 #A4CAFE, and
   Gate 16's hex ratchet over chrome may only go down, so the literal cannot
   be introduced. Measured on ink: #A4CAFE is 10.4:1, #80B2FF would be 8.0:1;
   both clear AA, and the token is the one this repo can hold. */
const DARK_BTN_CLASS =
  "tw:h-auto tw:min-h-0 tw:p-0 tw:text-[11px] tw:font-semibold tw:border-transparent tw:bg-transparent " +
  "tw:text-[var(--bk-blue-300)] tw:hover:text-white tw:enabled:hover:bg-transparent";

export interface ToastActionPayload {
  label: string;
  onClick: () => void;
}

export interface ToastInput {
  tone?: ToastTone;
  title?: string;
  description: string;
  action?: ToastActionPayload;
  /** ms; Infinity persists until dismissed. Default 5000. */
  duration?: number;
}

export interface QueuedToast extends ToastInput {
  id: string;
}

export interface UseToastReturn {
  toasts: ReadonlyArray<QueuedToast>;
  addToast: (input: ToastInput) => string;
  removeToast: (id: string) => void;
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
      toasts = [...toasts, { ...input, id }];
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

const ToastContext = React.createContext<UseToastReturn | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<QueuedToast[]>(() => [...store.toasts]);

  React.useEffect(() => {
    const unsubscribe = store.subscribe(setToasts);
    return () => {
      unsubscribe();
      if (store.listenerCount === 0) store.clear();
    };
  }, []);

  const value = React.useMemo<UseToastReturn>(
    () => ({ toasts, addToast: store.add, removeToast: store.remove }),
    [toasts],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={store.remove} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ toasts, onDismiss }: { toasts: QueuedToast[]; onDismiss: (id: string) => void }) {
  if (typeof document === "undefined") return null;
  const hasError = toasts.some((t) => t.tone === "error");
  return createPortal(
    <div
      className="tw:fixed tw:bottom-4 tw:right-4 tw:z-[80] tw:flex tw:flex-col tw:gap-2 tw:w-[360px] tw:max-w-[calc(100vw-32px)] tw:pointer-events-none"
      role="status"
      aria-live={hasError ? "assertive" : "polite"}
      aria-atomic="false"
    >
      {toasts.map((t, i) => (
        <ToastItem key={t.id} toast={t} index={i} onDismiss={onDismiss} />
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
  const { id, tone = "info", title, description, action, duration = 5000 } = toast;
  const ghost = tone === "dark" ? DARK_BTN_CLASS : GHOST_BTN_CLASS;

  React.useEffect(() => {
    if (!Number.isFinite(duration)) return;
    const timer = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  return (
    <div
      data-testid={`toast-item-${index}`}
      className={[
        /* `dark` is a one-line bar (814:7032 is 36 tall with its text at y=10
           and the reverse action as an inline LINK, not a 32-high button), so
           it takes 10/10 insets and centres its row. The tinted tones keep
           the 12 they had — they carry a title over a body and top-align. */
        tone === "dark"
          ? "tw:pointer-events-auto tw:flex tw:items-center tw:gap-2 tw:px-2.5 tw:py-2.5 tw:rounded-lg " +
            "tw:[box-shadow:var(--bk-shadow-overlay)] tw:[font-family:var(--bk-font-ui)] tw:text-[11px]"
          : "tw:pointer-events-auto tw:flex tw:items-start tw:gap-2 tw:p-3 tw:rounded-lg " +
          "tw:[box-shadow:var(--bk-shadow-overlay)] tw:[font-family:var(--bk-font-ui)] tw:text-[13px]",
        TONE_CLASS[tone],
      ].join(" ")}
    >
      <div className="tw:flex-1 tw:flex tw:flex-col tw:gap-0.5 tw:min-w-0">
        {title ? <span className={`tw:font-medium ${TONE_TITLE_CLASS[tone]}`}>{title}</span> : null}
        <span className={TONE_BODY_CLASS[tone]} data-testid={`toast-body-${index}`}>
          {description}
        </span>
      </div>
      {action ? (
        <Button color="light" size="xs" onClick={action.onClick} className={ghost}>
          {action.label}
        </Button>
      ) : null}
      <Button
        color="light"
        size="xs"
        className={`tw:flex-none ${ghost}`}
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

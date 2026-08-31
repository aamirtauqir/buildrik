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

export type ToastTone = "info" | "success" | "warning" | "error" | "neutral";

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
const TONE_CLASS: Record<ToastTone, string> = {
  neutral: "tw:bg-gray-100",
  info: "tw:bg-[var(--bk-accent-tint)]",
  success: "tw:bg-[var(--bk-success-tint)]",
  warning: "tw:bg-[var(--bk-warning-tint)]",
  error: "tw:bg-[var(--bk-error-tint)]",
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
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>,
    getOverlayRoot(),
  );
}

function ToastItem({ toast, onDismiss }: { toast: QueuedToast; onDismiss: (id: string) => void }) {
  const { id, tone = "info", title, description, action, duration = 5000 } = toast;

  React.useEffect(() => {
    if (!Number.isFinite(duration)) return;
    const timer = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  return (
    <div
      className={[
        "tw:pointer-events-auto tw:flex tw:items-start tw:gap-2 tw:p-3 tw:rounded-lg " +
          "tw:[box-shadow:var(--bk-shadow-overlay)] tw:[font-family:var(--bk-font-ui)] tw:text-[13px] tw:text-[var(--bk-ink)]",
        TONE_CLASS[tone],
      ].join(" ")}
    >
      <div className="tw:flex-1 tw:flex tw:flex-col tw:gap-0.5 tw:min-w-0">
        {title ? <span className={`tw:font-medium ${TONE_TITLE_CLASS[tone]}`}>{title}</span> : null}
        <span className="tw:text-[var(--bk-ink-soft)] tw:text-xs">{description}</span>
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

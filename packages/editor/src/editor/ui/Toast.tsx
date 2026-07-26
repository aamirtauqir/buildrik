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
import { Button } from "./Button";

export type ToastTone = "info" | "success" | "warning" | "error" | "neutral";

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
    subscribe(l: Listener) {
      listeners.add(l);
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
      className="bk-toast-viewport"
      role="status"
      aria-live={hasError ? "assertive" : "polite"}
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body,
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
    <div className={`bk-toast bk-toast--${tone}`}>
      <div className="bk-toast__body">
        {title ? <span className="bk-toast__title">{title}</span> : null}
        <span className="bk-toast__desc">{description}</span>
      </div>
      {action ? (
        <Button kind="ghost" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
      <Button
        kind="ghost"
        size="sm"
        className="bk-toast__close"
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

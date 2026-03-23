"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Toast, TOAST_AUTO_DISMISS_MS, TOAST_MAX_VISIBLE, type ToastData, type ToastVariant } from "./toast";

interface ToastContextValue {
  addToast: (variant: ToastVariant, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((variant: ToastVariant, title: string, message?: string) => {
    const id = `toast-${++counterRef.current}`;
    setToasts((prev) => {
      const next = [...prev, { id, variant, title, message }];
      if (next.length > TOAST_MAX_VISIBLE) next.shift();
      return next;
    });
    setTimeout(() => dismiss(id), TOAST_AUTO_DISMISS_MS);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map((t) => <Toast key={t.id} toast={t} onDismiss={dismiss} />)}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Aquibra Toast/Notification Component
 * @license BSD-3-Clause
 *
 * Uses module-level store to persist toasts across Vite HMR remounts.
 */

import * as React from "react";

export type ToastVariant = "info" | "success" | "warning" | "error";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastProps {
  id: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  /** Optional action button (e.g., "Undo") */
  action?: ToastAction;
  onClose?: (id: string) => void;
}

export interface ToastContainerProps {
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center";
}

// ============================================
// Module-level toast store (survives HMR)
// ============================================
type ToastListener = (toasts: ToastProps[]) => void;

interface ToastStore {
  toasts: ToastProps[];
  listeners: Set<ToastListener>;
  add: (toast: Omit<ToastProps, "id">) => string;
  remove: (id: string) => void;
  subscribe: (listener: ToastListener) => () => void;
}

// Use globalThis to ensure single instance across HMR
const STORE_KEY = "__AQUIBRA_TOAST_STORE__";

function createToastStore(): ToastStore {
  const store: ToastStore = {
    toasts: [],
    listeners: new Set(),
    add: (toast) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      store.toasts = [...store.toasts, { ...toast, id }];
      store.listeners.forEach((fn) => fn(store.toasts));
      return id;
    },
    remove: (id) => {
      store.toasts = store.toasts.filter((t) => t.id !== id);
      store.listeners.forEach((fn) => fn(store.toasts));
    },
    subscribe: (listener) => {
      store.listeners.add(listener);
      return () => store.listeners.delete(listener);
    },
  };
  return store;
}

// Get or create the global store (persists across HMR)
function getToastStore(): ToastStore {
  const g = globalThis as unknown as Record<string, ToastStore>;
  if (!g[STORE_KEY]) {
    g[STORE_KEY] = createToastStore();
  }
  return g[STORE_KEY];
}

const toastStore = getToastStore();

// ============================================
// Toast Context (React interface to store)
// ============================================
interface ToastContextValue {
  toasts: ToastProps[];
  addToast: (toast: Omit<ToastProps, "id">) => string;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

// Toast Provider - syncs with module-level store
export const ToastProvider: React.FC<{ children: React.ReactNode } & ToastContainerProps> = ({
  children,
  position = "top-right",
}) => {
  // Subscribe to the global toast store
  const [toasts, setToasts] = React.useState<ToastProps[]>(toastStore.toasts);

  React.useEffect(() => {
    // Sync initial state from store (in case HMR happened)
    setToasts(toastStore.toasts);
    // Subscribe to future updates
    return toastStore.subscribe(setToasts);
  }, []);

  const addToast = React.useCallback((toast: Omit<ToastProps, "id">) => {
    return toastStore.add(toast);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    toastStore.remove(id);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} position={position} onClose={removeToast} />
    </ToastContext.Provider>
  );
};

// Toast Container
const ToastContainer: React.FC<{
  toasts: ToastProps[];
  position: ToastContainerProps["position"];
  onClose: (id: string) => void;
}> = ({ toasts, position = "top-right", onClose }) => {
  const positionStyles: Record<string, React.CSSProperties> = {
    "top-right": { top: 16, right: 16 },
    "top-left": { top: 16, left: 16 },
    "bottom-right": { bottom: 16, right: 16 },
    "bottom-left": { bottom: 16, left: 16 },
    "top-center": { top: 16, left: "50%", transform: "translateX(-50%)" },
    "bottom-center": { bottom: 16, left: "50%", transform: "translateX(-50%)" },
  };

  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="false"
      style={{
        position: "fixed",
        zIndex: 2000,
        ...positionStyles[position!],
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
};

// Single Toast
const Toast: React.FC<ToastProps> = ({
  id,
  title,
  message,
  variant = "info",
  duration: durationProp,
  action,
  onClose,
}) => {
  // Error toasts persist by default (duration = 0), others auto-dismiss after 5s
  const duration = durationProp ?? (variant === "error" ? 0 : 5000);
  const [isExiting, setIsExiting] = React.useState(false);

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onClose?.(id), 200);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, id, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose?.(id), 200);
  };

  const handleAction = () => {
    action?.onClick();
    handleClose();
  };

  const variantStyles: Record<ToastVariant, { bg: string; border: string; icon: string }> = {
    info: { bg: "var(--aqb-info)", border: "var(--aqb-info)", icon: "ℹ" },
    success: {
      bg: "var(--aqb-success)",
      border: "var(--aqb-success)",
      icon: "✓",
    },
    warning: {
      bg: "var(--aqb-warning)",
      border: "var(--aqb-warning)",
      icon: "⚠",
    },
    error: { bg: "var(--aqb-error)", border: "var(--aqb-error)", icon: "✕" },
  };

  const style = variantStyles[variant];

  return (
    <div
      className={`aqb-toast aqb-toast-${variant}`}
      role="alert"
      aria-live={variant === "error" ? "assertive" : "polite"}
      style={{
        background: "var(--aqb-bg-panel)",
        borderRadius: 8,
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        padding: "12px 16px",
        minWidth: 280,
        maxWidth: 400,
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        borderLeft: `4px solid ${style.border}`,
        animation: isExiting ? "aqb-toast-out 0.2s ease forwards" : "aqb-toast-in 0.2s ease",
      }}
    >
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: style.bg,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: "bold",
          flexShrink: 0,
        }}
      >
        {style.icon}
      </span>
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>}
        <div style={{ color: "var(--aqb-text-secondary)", fontSize: 13 }}>{message}</div>
      </div>
      {action && (
        <button
          onClick={handleAction}
          style={{
            background: "var(--aqb-primary)",
            border: "none",
            borderRadius: 4,
            color: "#fff",
            cursor: "pointer",
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: "nowrap",
            transition: "opacity 0.15s ease",
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
        >
          {action.label}
        </button>
      )}
      <button
        onClick={handleClose}
        aria-label="Dismiss notification"
        style={{
          background: "transparent",
          border: "none",
          color: "var(--aqb-text-muted)",
          cursor: "pointer",
          padding: 4,
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
};

export default Toast;

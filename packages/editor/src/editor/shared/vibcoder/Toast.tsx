/**
 * Vibcoder Toast wrapper — Radix.Toast-backed compound + queue + useToast hook.
 *
 * Bucket B3 upgrade: replaces the Phase 2 passive single-instance surface
 * with a Radix.Toast-backed multi-instance system. The wrapper bridges the
 * two API shapes:
 *
 *   - The shim exposed an IMPERATIVE API (chrome consumers call
 *     useToast().addToast({...}) → push into a queue → wrapper renders).
 *   - Radix.Toast exposes a DECLARATIVE API (caller renders <Toast.Root open>).
 *
 * ToastProvider is the bridge: it owns the queue (React state synced to a
 * module-level globalThis store for HMR persistence) and renders one
 * <Radix.Toast.Root open> per queue entry inside <Radix.Toast.Provider>.
 * useToast() returns { toasts, addToast, removeToast } — the same shape
 * the deleted shim ToastContext exposed, so the T3 codemod is mostly a
 * path rewrite + variant→tone + message→description.
 *
 * Architectural decisions resolved (Bucket B3 controller pre-flight):
 *   Q1 NotificationCenter organism: RETIRED. Radix.Toast.Provider/Viewport
 *      already handles queue + auto-dismiss + swipe + focus management.
 *      The Phase 3 organism was a workaround for the missing Radix backing.
 *   Q2 Provider mount: AquibraStudio shell (T2 swaps the existing shim mount).
 *   Q3 Codemod: T3 will translate import paths + variant→tone + message→description.
 *   Q4 Auto-dismiss: 5000ms default via Radix duration prop. Per-instance
 *      override via addToast({ duration: X }).
 *
 * Compound exports:
 *   ToastProvider    — hosts queue + Radix.Toast.Provider + Viewport. Mount
 *                      ONCE at app shell root.
 *   useToast         — hook returning { toasts, addToast, removeToast }.
 *                      Throws outside ToastProvider. Imperative API matches
 *                      the deleted shim contract.
 *   Toast            — Radix.Toast.Root re-export. Rare direct use (gallery
 *                      only — production code goes through addToast).
 *   ToastTitle       — bd-toast__title forwardRef wrap.
 *   ToastDescription — bd-toast__desc forwardRef wrap (note: vendored CSS
 *                      slot is __desc, not __description — preserved from
 *                      the molecule manifest).
 *   ToastAction      — bd-toast__link forwardRef wrap (action lives in the
 *                      __link slot per the vendored molecule; __actions is
 *                      the parent group container).
 *   ToastClose       — Radix.Toast.Close forwardRef wrap. No __close skin
 *                      class in the vendored CSS — composes structural
 *                      attributes only; visual treatment via dismiss-button
 *                      tokens at the consumer site.
 *   ToastViewport    — Radix.Toast.Viewport with bd-toast-viewport positioning
 *                      class. ToastProvider already mounts a default viewport
 *                      internally; DO NOT also render <ToastViewport /> as a
 *                      Provider child — that creates two viewports both
 *                      receiving Radix's queue rendering, with duplicate DOM
 *                      and aria regions. Export exists only for advanced
 *                      cases that disable the default viewport (not yet
 *                      supported — gate via ToastProviderProps if needed).
 *
 * E2 contract waiver — Radix types deliberately leak through the Toast
 *   re-export (Radix.Toast.Root) and ToastViewport props. Same precedent
 *   as Bucket A T1 Popover and Bucket B1 T1 Tooltip. Re-typing positioning
 *   props (swipeDirection, swipeThreshold, hotkey, label) as a buildrik
 *   subset would lose the multi-instance ordering + a11y semantics that
 *   the contract IS.
 *
 * E3 portal-discipline waiver — ToastViewport does NOT route via
 *   useOverlayContainer. Different reasoning from Tooltip's E3 waiver,
 *   same conclusion. ToastViewport is a fixed-position viewport, NOT a
 *   trigger-anchored portal. It's its own modal-stack-equivalent: a
 *   region-level container with z-index local to bd-toast-viewport. It
 *   doesn't compete with modals/popovers for stacking — it sits above
 *   everything by design (notifications must be visible).
 *
 * Module-level globalThis store preserves the deleted shim's HMR-DX win:
 *   toasts triggered before a Vite HMR remount don't disappear on reload.
 *   Store key was renamed from __AQUIBRA_TOAST_STORE__ to
 *   __VIBCODER_TOAST_STORE__ — clean break from the legacy namespace.
 *
 * @license BSD-3-Clause
 */
import * as RadixToast from "@radix-ui/react-toast";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementRef,
  type ReactNode,
} from "react";

// ============================================
// Public types
// ============================================

export type ToastTone = "info" | "success" | "warning" | "error" | "neutral";

export interface ToastActionPayload {
  label: string;
  onClick: () => void;
}

export interface ToastInput {
  /** Severity discriminator. Defaults to 'info' visual when omitted. */
  tone?: ToastTone;
  /** Optional headline. */
  title?: string;
  /** Required body copy. */
  description: string;
  /** Optional action button. */
  action?: ToastActionPayload;
  /** Auto-dismiss timeout in ms. Defaults to 5000. Pass Infinity to persist. */
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

// ============================================
// Module-level toast store (survives HMR)
// ============================================

type ToastListener = (toasts: QueuedToast[]) => void;

interface ToastStore {
  toasts: QueuedToast[];
  listeners: Set<ToastListener>;
  add: (toast: ToastInput) => string;
  remove: (id: string) => void;
  subscribe: (listener: ToastListener) => () => void;
}

const STORE_KEY = "__VIBCODER_TOAST_STORE__";

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
      return () => {
        store.listeners.delete(listener);
      };
    },
  };
  return store;
}

function getToastStore(): ToastStore {
  const g = globalThis as unknown as Record<string, ToastStore | undefined>;
  if (!g[STORE_KEY]) {
    g[STORE_KEY] = createToastStore();
  }
  return g[STORE_KEY] as ToastStore;
}

// ============================================
// React context bridge
// ============================================

const ToastContext = createContext<UseToastReturn | null>(null);

export const useToast = (): UseToastReturn => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

// ============================================
// Compound primitives — Radix re-exports + className wraps
// ============================================

/**
 * Radix.Toast.Root re-export. Production code rarely uses this directly —
 * call useToast().addToast(...) instead. Exposed for the gallery and
 * future advanced compositions.
 */
export const Toast = RadixToast.Root;

export type ToastTitleProps = ComponentPropsWithoutRef<typeof RadixToast.Title>;
export const ToastTitle = forwardRef<
  ElementRef<typeof RadixToast.Title>,
  ToastTitleProps
>(({ className, children, ...rest }, ref) => {
  const classes = ["bd-toast__title", className].filter(Boolean).join(" ");
  return (
    <RadixToast.Title ref={ref} className={classes} {...rest}>
      {children}
    </RadixToast.Title>
  );
});
ToastTitle.displayName = "ToastTitle";

export type ToastDescriptionProps = ComponentPropsWithoutRef<
  typeof RadixToast.Description
>;
export const ToastDescription = forwardRef<
  ElementRef<typeof RadixToast.Description>,
  ToastDescriptionProps
>(({ className, children, ...rest }, ref) => {
  const classes = ["bd-toast__desc", className].filter(Boolean).join(" ");
  return (
    <RadixToast.Description ref={ref} className={classes} {...rest}>
      {children}
    </RadixToast.Description>
  );
});
ToastDescription.displayName = "ToastDescription";

export type ToastActionProps = ComponentPropsWithoutRef<
  typeof RadixToast.Action
>;
export const ToastAction = forwardRef<
  ElementRef<typeof RadixToast.Action>,
  ToastActionProps
>(({ className, children, ...rest }, ref) => {
  const classes = ["bd-toast__link", className].filter(Boolean).join(" ");
  return (
    <RadixToast.Action ref={ref} className={classes} {...rest}>
      {children}
    </RadixToast.Action>
  );
});
ToastAction.displayName = "ToastAction";

export type ToastCloseProps = ComponentPropsWithoutRef<typeof RadixToast.Close>;
export const ToastClose = forwardRef<
  ElementRef<typeof RadixToast.Close>,
  ToastCloseProps
>(({ className, children, ...rest }, ref) => {
  const classes = ["bd-toast__close", className].filter(Boolean).join(" ");
  return (
    <RadixToast.Close ref={ref} className={classes} {...rest}>
      {children}
    </RadixToast.Close>
  );
});
ToastClose.displayName = "ToastClose";

export type ToastViewportProps = ComponentPropsWithoutRef<
  typeof RadixToast.Viewport
>;
export const ToastViewport = forwardRef<
  ElementRef<typeof RadixToast.Viewport>,
  ToastViewportProps
>(({ className, style, ...rest }, ref) => {
  const classes = ["bd-toast-viewport", className].filter(Boolean).join(" ");
  // Inline positioning fallback — vendored CSS does not yet ship a
  // .bd-toast-viewport rule. Class is applied for namespacing/test
  // selection; if a future re-vend adds the rule, the inline style still
  // works as a defensive backstop. z-index uses the existing toast token.
  const positionStyle: CSSProperties = {
    position: "fixed",
    top: 16,
    right: 16,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    zIndex: 2000,
    listStyle: "none",
    margin: 0,
    padding: 0,
    outline: "none",
    ...style,
  };
  return (
    <RadixToast.Viewport
      ref={ref}
      className={classes}
      style={positionStyle}
      {...rest}
    />
  );
});
ToastViewport.displayName = "ToastViewport";

// ============================================
// ToastProvider — queue + Radix.Provider + Viewport
// ============================================

const DEFAULT_DURATION_MS = 5000;

export interface ToastProviderProps {
  children: ReactNode;
  /**
   * Radix swipe direction for dismiss gesture. Defaults to "right" (matches
   * top-right viewport position).
   */
  swipeDirection?: ComponentPropsWithoutRef<
    typeof RadixToast.Provider
  >["swipeDirection"];
  /**
   * Radix swipe threshold in pixels. Defaults to Radix's default (50).
   */
  swipeThreshold?: ComponentPropsWithoutRef<
    typeof RadixToast.Provider
  >["swipeThreshold"];
  /**
   * Optional viewport prop overrides for non-default placement. Most apps
   * leave this unset and accept the top-right default.
   */
  viewportProps?: Omit<ToastViewportProps, "ref">;
}

export const ToastProvider = ({
  children,
  swipeDirection = "right",
  swipeThreshold,
  viewportProps,
}: ToastProviderProps) => {
  const store = useMemo(() => getToastStore(), []);
  const [toasts, setToasts] = useState<QueuedToast[]>(() => store.toasts);

  useEffect(() => {
    setToasts(store.toasts);
    return store.subscribe(setToasts);
  }, [store]);

  const addToast = useCallback(
    (input: ToastInput) => store.add(input),
    [store],
  );
  const removeToast = useCallback((id: string) => store.remove(id), [store]);

  const value = useMemo<UseToastReturn>(
    () => ({ toasts, addToast, removeToast }),
    [toasts, addToast, removeToast],
  );

  return (
    <ToastContext.Provider value={value}>
      <RadixToast.Provider
        swipeDirection={swipeDirection}
        swipeThreshold={swipeThreshold}
      >
        {children}
        {toasts.map((entry) => {
          const tone = entry.tone ?? "info";
          const duration = entry.duration ?? DEFAULT_DURATION_MS;
          const rootClass = `bd-toast bd-toast--${tone}`;
          return (
            <RadixToast.Root
              key={entry.id}
              open
              onOpenChange={(open) => {
                if (!open) removeToast(entry.id);
              }}
              duration={duration}
              className={rootClass}
            >
              <div className="bd-toast__body">
                {entry.title && (
                  <RadixToast.Title className="bd-toast__title">
                    {entry.title}
                  </RadixToast.Title>
                )}
                <RadixToast.Description className="bd-toast__desc">
                  {entry.description}
                </RadixToast.Description>
                {entry.action && (
                  <div className="bd-toast__actions">
                    <RadixToast.Action
                      className="bd-toast__link"
                      altText={entry.action.label}
                      onClick={entry.action.onClick}
                    >
                      {entry.action.label}
                    </RadixToast.Action>
                  </div>
                )}
              </div>
              <RadixToast.Close
                className="bd-toast__close"
                aria-label="Dismiss notification"
              >
                {"×"}
              </RadixToast.Close>
            </RadixToast.Root>
          );
        })}
        <ToastViewport {...viewportProps} />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
};
ToastProvider.displayName = "ToastProvider";

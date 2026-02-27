/**
 * useEventListener Hook
 * Generic hook for safely adding/removing event listeners
 * Handles cleanup automatically and uses refs for stable callbacks
 *
 * This hook prevents common patterns of duplicated event listener setup
 * across multiple hooks.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

type EventMap = WindowEventMap & DocumentEventMap & HTMLElementEventMap;

export interface UseEventListenerOptions {
  /** Event options (passive, capture, once) */
  options?: boolean | AddEventListenerOptions;
  /** Whether the listener is currently enabled (default: true) */
  enabled?: boolean;
  /** Dependencies that should trigger re-subscription */
  deps?: React.DependencyList;
}

/**
 * Hook to add an event listener with automatic cleanup
 *
 * @param target - Element or window/document to attach listener to
 * @param eventName - Name of the event
 * @param handler - Event handler function
 * @param options - Additional configuration
 *
 * @example
 * // Window scroll listener
 * useEventListener(window, "scroll", handleScroll, { options: { passive: true } });
 *
 * @example
 * // Element click listener
 * useEventListener(buttonRef.current, "click", handleClick);
 *
 * @example
 * // Conditionally enabled listener
 * useEventListener(window, "keydown", handleKeydown, { enabled: isActive });
 */
export function useEventListener<K extends keyof EventMap>(
  target: EventTarget | null | undefined,
  eventName: K,
  handler: (event: EventMap[K]) => void,
  options: UseEventListenerOptions = {}
): void {
  const { options: listenerOptions, enabled = true, deps = [] } = options;

  // Store handler in ref to avoid recreating the listener on handler changes
  const handlerRef = React.useRef(handler);
  handlerRef.current = handler;

  React.useEffect(() => {
    if (!target || !enabled) return;

    // Wrapper that uses the current handler ref
    const eventListener = (event: Event) => {
      handlerRef.current(event as EventMap[K]);
    };

    target.addEventListener(eventName, eventListener, listenerOptions);

    return () => {
      target.removeEventListener(eventName, eventListener, listenerOptions);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, eventName, enabled, listenerOptions, ...deps]);
}

/**
 * Hook to add a window event listener
 * Convenience wrapper for useEventListener(window, ...)
 *
 * @example
 * useWindowEventListener("resize", handleResize);
 * useWindowEventListener("keydown", handleKeydown, { enabled: isActive });
 */
export function useWindowEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  options: UseEventListenerOptions = {}
): void {
  useEventListener(typeof window !== "undefined" ? window : null, eventName, handler, options);
}

/**
 * Hook to add a document event listener
 * Convenience wrapper for useEventListener(document, ...)
 *
 * @example
 * useDocumentEventListener("mousedown", handleClickOutside);
 */
export function useDocumentEventListener<K extends keyof DocumentEventMap>(
  eventName: K,
  handler: (event: DocumentEventMap[K]) => void,
  options: UseEventListenerOptions = {}
): void {
  useEventListener(typeof document !== "undefined" ? document : null, eventName, handler, options);
}

/**
 * Hook to add multiple event listeners at once
 *
 * @example
 * useEventListeners(window, {
 *   scroll: handleScroll,
 *   resize: handleResize,
 * }, { options: { passive: true } });
 */
export function useEventListeners<K extends keyof EventMap>(
  target: EventTarget | null | undefined,
  handlers: Partial<Record<K, (event: EventMap[K]) => void>>,
  options: Omit<UseEventListenerOptions, "deps"> = {}
): void {
  const { options: listenerOptions, enabled = true } = options;

  // Store handlers in ref
  const handlersRef = React.useRef(handlers);
  handlersRef.current = handlers;

  React.useEffect(() => {
    if (!target || !enabled) return;

    const cleanups: Array<() => void> = [];

    for (const [eventName, handler] of Object.entries(handlersRef.current)) {
      if (handler) {
        const eventListener = (event: Event) => {
          (handler as (e: Event) => void)(event);
        };
        target.addEventListener(eventName, eventListener, listenerOptions);
        cleanups.push(() => {
          target.removeEventListener(eventName, eventListener, listenerOptions);
        });
      }
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [target, enabled, listenerOptions]);
}

export default useEventListener;

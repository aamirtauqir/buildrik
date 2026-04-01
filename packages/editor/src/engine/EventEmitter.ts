/**
 * Aquibra Event Emitter
 * Lightweight event system for the composer
 *
 * @module engine/EventEmitter
 * @license BSD-3-Clause
 */

/**
 * Event handler function type
 * Uses a flexible signature that accepts any arguments for runtime flexibility
 * while maintaining type safety at the call site
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventHandler = (...args: any[]) => void;

interface EventHandlerEntry {
  handler: EventHandler;
  once: boolean;
}

/**
 * Simple event emitter implementation
 */
export class EventEmitter {
  private events: Map<string, EventHandlerEntry[]> = new Map();

  /**
   * Subscribe to an event
   */
  on(event: string, handler: EventHandler): this {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push({ handler, once: false });
    return this;
  }

  /**
   * Subscribe to an event (fires only once)
   */
  once(event: string, handler: EventHandler): this {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push({ handler, once: true });
    return this;
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, handler?: EventHandler): this {
    if (!handler) {
      this.events.delete(event);
    } else {
      const handlers = this.events.get(event);
      if (handlers) {
        const index = handlers.findIndex((h) => h.handler === handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      }
    }
    return this;
  }

  /**
   * Emit an event
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit(event: string, ...args: any[]): this {
    const handlers = this.events.get(event);
    if (handlers) {
      // Create a copy to avoid issues if handlers modify the array
      const toCall = [...handlers];

      // Remove once handlers before calling
      this.events.set(
        event,
        handlers.filter((h) => !h.once)
      );

      // Call all handlers
      toCall.forEach(({ handler }) => {
        try {
          handler(...args);
        } catch {
          // Error in event handler - silently continue
        }
      });
    }
    return this;
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(event?: string): this {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }

  /**
   * Get listener count for an event
   */
  listenerCount(event: string): number {
    return this.events.get(event)?.length ?? 0;
  }

  /**
   * Get all event names
   */
  eventNames(): string[] {
    return Array.from(this.events.keys());
  }
}

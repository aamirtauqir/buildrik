/**
 * Aquibra Helpers - Event Emitter
 * Lightweight event emitter pattern implementation
 *
 * @module utils/helpers/events
 * @license BSD-3-Clause
 */

import type { EventEmitter, EventHandler } from "./types";

// =============================================================================
// EVENT EMITTER
// =============================================================================

/**
 * Create event emitter
 */
export function createEventEmitter<Events extends Record<string, unknown>>(): EventEmitter<Events> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlers = new Map<keyof Events, Set<EventHandler<any>>>();

  return {
    on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>) {
      if (!handlers.has(event)) {
        handlers.set(event, new Set());
      }
      handlers.get(event)!.add(handler);
      return () => this.off(event, handler);
    },

    once<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>) {
      const onceHandler = (data: Events[K]) => {
        this.off(event, onceHandler);
        handler(data);
      };
      return this.on(event, onceHandler);
    },

    off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>) {
      handlers.get(event)?.delete(handler);
    },

    emit<K extends keyof Events>(event: K, data: Events[K]) {
      handlers.get(event)?.forEach((handler) => handler(data));
    },

    clear() {
      handlers.clear();
    },
  };
}

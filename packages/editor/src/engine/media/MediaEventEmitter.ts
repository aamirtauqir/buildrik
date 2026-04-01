/**
 * Media Event Emitter
 * Simple event system for media manager
 * @license BSD-3-Clause
 */

/** Event listener callback */
export type MediaEventListener = (payload: unknown) => void;

/**
 * Simple event emitter for media events
 */
export class MediaEventEmitter {
  private listeners: Map<string, Set<MediaEventListener>> = new Map();

  /**
   * Subscribe to an event
   */
  on(event: string, listener: MediaEventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.add(listener);
    }
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, listener: MediaEventListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  /**
   * Emit an event to all listeners
   */
  protected emit(event: string, payload: unknown): void {
    this.listeners.get(event)?.forEach((listener) => listener(payload));
  }
}

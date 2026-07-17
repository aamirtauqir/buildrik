/**
 * Shared "best-effort mirror with retry" queue for the editor→dashboard sync
 * layer. When the local (IndexedDB / localStorage) write has already happened,
 * a failed server mirror must never throw into the engine; instead it is:
 *   - queued latest-wins per target key (a newer payload for the same target
 *     replaces the stale one, so only one slot is ever held per record),
 *   - broadcast to error subscribers so the editor can surface a retryable
 *     toast (no silent drop),
 *   - auto-replayed on reconnect ('online') and via an explicit retry().
 *
 * Extracted from cmsSync (E7): versionSync / componentSync / templateSync were
 * near-verbatim copies with NO retry queue, so a failed version/component/
 * template mirror was dropped on the floor. They now all share this. Never
 * throws — best-effort by design.
 *
 * @license BSD-3-Clause
 */

export interface SyncRetryInfo {
  /** Number of changes still queued (not yet mirrored to the server). */
  pending: number;
}

export class SyncRetryQueue {
  private queue = new Map<string, () => Promise<void>>();
  private subscribers = new Set<(info: SyncRetryInfo) => void>();

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => void this.retry());
    }
  }

  /** Subscribe to mirror failures. Returns an unsubscribe fn. */
  onError(cb: (info: SyncRetryInfo) => void): () => void {
    this.subscribers.add(cb);
    return () => {
      this.subscribers.delete(cb);
    };
  }

  /** How many changes are queued for retry (not yet on the server). */
  pendingCount(): number {
    return this.queue.size;
  }

  /**
   * Forget a queued op without replaying it — used when a later op supersedes
   * it (a delete drops a pending upsert for the same target, so a reconnect
   * retry can't resurrect the just-deleted record).
   */
  drop(key: string): void {
    this.queue.delete(key);
  }

  private notify(): void {
    const info: SyncRetryInfo = { pending: this.queue.size };
    this.subscribers.forEach((cb) => {
      try {
        cb(info);
      } catch {
        // A subscriber throwing must not break the sync layer.
      }
    });
  }

  /**
   * Run one mirror task. On success the target clears from the queue; on failure
   * the (latest) task is queued under `key`, `onWarn` fires, and subscribers are
   * notified with the new pending count. Never throws.
   */
  async run(
    key: string,
    task: () => Promise<unknown>,
    onWarn: (e: unknown) => void
  ): Promise<void> {
    try {
      await task();
      this.queue.delete(key);
    } catch (e) {
      onWarn(e);
      this.queue.set(key, () => this.run(key, task, onWarn));
      this.notify();
    }
  }

  /** Replay every queued op; each clears itself on success / re-queues on failure. */
  async retry(): Promise<void> {
    for (const replay of Array.from(this.queue.values())) {
      await replay();
    }
  }
}

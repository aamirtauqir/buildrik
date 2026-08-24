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

/* One reader per sync domain, keyed by domain name so the exit guards can ask
   "is anything stranded?" without importing all four modules and knowing there
   are four.
   KEYED, not a Set of instances: registering the queue objects themselves has
   no removal path, so a dev hot-reload of a sync module leaves the abandoned
   queue in the registry — still counted, still holding whatever was pending
   when it was replaced — and the exit guard warns about work no live queue is
   carrying. Re-registering under the same domain replaces the stale reader.
   Ad-hoc queues in tests never register, so they cannot contaminate the total
   either. (Codex review, 2026-08-24.) */
const pendingSources = new Map<string, () => number>();

/** Publish this domain's pending count to `totalPendingMirrors`. */
export function registerPendingSource(domain: string, read: () => number): void {
  pendingSources.set(domain, read);
}

/**
 * Mirrors queued across every registered sync domain — work that is on this
 * device and NOT on the server.
 *
 * Read at the moment a navigation is attempted, never held in state: the count
 * changes from event callbacks outside React, and a stale copy would either
 * block a clean exit or wave a stranded one through.
 */
export function totalPendingMirrors(): number {
  let total = 0;
  for (const read of pendingSources.values()) total += read();
  return total;
}

export class SyncRetryQueue {
  private queue = new Map<string, () => Promise<boolean>>();
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
    /* A supersession still changes the pending count, so it has to be
       announced. The delete paths call `drop` on the matching upsert first and
       then `run` a delete that usually succeeds on the first try — which does
       NOT notify, because nothing was queued under the delete's own key. The
       queue reached zero and the permanent "not on the server" notice stayed
       up over an empty queue. (Codex review, 2026-08-24.) */
    if (this.queue.delete(key)) this.notify();
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
   *
   * Resolves true when THIS op reached the server, false when it was queued —
   * `pendingCount()` cannot answer that, since it counts every target and a
   * different record's stale failure would read as this one failing.
   */
  async run(
    key: string,
    task: () => Promise<unknown>,
    onWarn: (e: unknown) => void
  ): Promise<boolean> {
    try {
      await task();
      /* Notify only when this actually cleared something. Subscribers put a
         permanent "not on the server" toast on screen; when the queue drains —
         by this retry, or by the `online` handler replaying it with no UI
         involved — nothing used to fire, so that toast stood forever asserting
         a failure that had already been fixed. Firing on every first-time
         success instead would be noise: nothing was pending, nothing changed. */
      if (this.queue.delete(key)) this.notify();
      return true;
    } catch (e) {
      onWarn(e);
      this.queue.set(key, () => this.run(key, task, onWarn));
      this.notify();
      return false;
    }
  }

  /** Replay every queued op; each clears itself on success / re-queues on failure. */
  async retry(): Promise<void> {
    for (const replay of Array.from(this.queue.values())) {
      await replay();
    }
  }
}

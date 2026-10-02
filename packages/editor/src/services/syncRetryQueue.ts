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

import { deepEqual } from "@shared/utils/helpers/objectDeep";

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
  /** The op running per target — the next one for it waits (see `run`). */
  private inFlight = new Map<string, Promise<boolean>>();

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

  /** Total work this queue still owes the server — queued retries AND any
   *  in-flight mirror that hasn't resolved yet. C0a (Task 6): publish blocks
   *  on this; an in-flight mirror has to count, or publish can hand off a row
   *  that hasn't landed. `publishService` consults this so an unsynced CMS
   *  edit refuses to publish even when the network call returned 200 but the
   *  state diff has not propagated. */
  outstandingCount(): number {
    return this.outstandingKeys().length;
  }

  /** The targets behind `outstandingCount` — a key both queued and in flight
   *  (a retry running) is one change, not two. */
  outstandingKeys(): string[] {
    return [...new Set([...this.queue.keys(), ...this.inFlight.keys()])];
  }

  /** Resolves true when the latest run for `key` reaches the server, false
   *  when it failed and was queued. Returns true immediately if no run is
   *  in flight and none is queued (publish is allowed to proceed). */
  settled(key: string): Promise<boolean> {
    const inflight = this.inFlight.get(key);
    if (inflight) return inflight;
    return Promise.resolve(!this.queue.has(key));
  }

  /** Whether a mirror for `key` is waiting to reach the server. Hydration
   *  reads it so a newer server copy never overwrites a local change that
   *  simply has not landed yet (C-4). */
  isPending(key: string): boolean {
    return this.queue.has(key);
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
    /* One write per target in flight, in the order they were asked for. Two
       upserts of one row racing (a collection's create and its first field
       update, fired a tick apart) could land in either order — the older
       payload last — or the second could lose the create race on a unique key
       and sit queued with the newer data. The Inspector v4 fixture's Menu
       collection loaded with `fields: []` exactly so. Different targets
       still run side by side. */
    const prev = this.inFlight.get(key);
    const mine = (prev ?? Promise.resolve()).then(() => this.attempt(key, task, onWarn));
    this.inFlight.set(key, mine);
    try {
      return await mine;
    } finally {
      /* Only delete if this is still the latest in-flight entry — a newer
         run on the same key keeps its own promise tracked. */
      if (this.inFlight.get(key) === mine) this.inFlight.delete(key);
    }
  }

  private async attempt(
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

/* ── C-4: server stamps — reconcile on ONE clock ────────────────────────────
   Hydration decides "is the server's copy newer than mine?". Comparing the
   server's `updatedAt` with a local row's `updatedAt` mixes two clocks (the
   local one is this browser's), and the retry queue above is in memory, so
   after a reload it cannot say which local rows never reached the server.

   A stamp records, per synced row, the SERVER's `updatedAt` the last time the
   server confirmed this browser's copy, and the LOCAL `updatedAt` that copy
   had then. It persists in localStorage so it survives the reload. Then:
     - no local row          → take the server's
     - no stamp              → never confirmed by the server: keep local
     - local moved on since  → an unconfirmed local edit: keep local
     - otherwise             → take the server's only if ITS clock moved on
   Every comparison is server-vs-server or an equality on the local value. */
const STAMP_STORAGE_KEY = "bk-sync-stamps-v1";

interface ServerStamp {
  server: string;
  local: string;
}

function readStamps(): Record<string, ServerStamp> {
  try {
    const raw = localStorage.getItem(STAMP_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ServerStamp>) : {};
  } catch {
    return {};
  }
}

/** Record that the server holds this browser's copy of `key` as of `server`. */
export function recordServerStamp(key: string, server: Date | string, local: string | number): void {
  try {
    const stamps = readStamps();
    stamps[key] = { server: new Date(server).toISOString(), local: String(local) };
    localStorage.setItem(STAMP_STORAGE_KEY, JSON.stringify(stamps));
  } catch {
    // Private mode / quota: without a stamp the row simply stays local-first.
  }
}

/** Whether the server has ever confirmed this browser's copy of `key`. */
export function hasServerStamp(key: string): boolean {
  return key in readStamps();
}

/** The server updatedAt the server last confirmed for `key`, if any — the
 *  precondition a write sends so a teammate's newer copy is refused, not
 *  overwritten. */
export function serverStampOf(key: string): string | undefined {
  return readStamps()[key]?.server;
}

/** Forget `key`'s stamp — the row is gone, or the user chose to overwrite. */
export function forgetServerStamp(key: string): void {
  try {
    const stamps = readStamps();
    if (!(key in stamps)) return;
    delete stamps[key];
    localStorage.setItem(STAMP_STORAGE_KEY, JSON.stringify(stamps));
  } catch {
    // Storage unavailable: the next write simply goes without a precondition.
  }
}

/**
 * Whether hydration may overwrite the local copy of `key` with the server's.
 * `firstPass` is the one-time pre-stamp pass (see `stampMigrationDue`): rows
 * written before stamps existed have none, and without this a row never edited
 * locally again would never be mirrored, never stamped, and hide every
 * teammate edit forever. On that pass only, an unstamped row falls back to the
 * old two-clock comparison, once; after it, no stamp means "never confirmed,
 * stays local".
 */
export function serverCopyWins(
  key: string,
  serverUpdatedAt: Date | string,
  localUpdatedAt: string | number | undefined,
  hasLocal: boolean,
  firstPass: boolean,
): boolean {
  if (!hasLocal) return true;
  const stamp = readStamps()[key];
  if (!stamp) {
    return firstPass && new Date(serverUpdatedAt).getTime() > new Date(localUpdatedAt ?? NaN).getTime();
  }
  if (String(localUpdatedAt) !== stamp.local) return false;
  return new Date(serverUpdatedAt).getTime() > new Date(stamp.server).getTime();
}

/**
 * Same content, as the server stores it: a JSON round trip drops `undefined`
 * fields (IndexedDB keeps them, the server's JSON does not) and `deepEqual`
 * ignores key order (Postgres jsonb reorders keys). An unstamped local row
 * equal to the server's copy is ADOPTED — stamped — so the next server edit
 * reaches it, instead of it staying local-first forever.
 */
export function sameContent(a: unknown, b: unknown): boolean {
  return deepEqual(JSON.parse(JSON.stringify(a ?? null)), JSON.parse(JSON.stringify(b ?? null)));
}

/* The one-time pre-stamp pass is tracked per `<domain>:<siteId>` (e.g.
   "cms:site-1"), not by the stamp map's absence: the CMS and component
   hydrates run side by side and the first stamp either writes would end the
   pass for the other, and the stamp map is browser-wide while a hydrate only
   sees the current site's rows. It is marked done only after a hydrate got
   through, so a failed one runs the pass again next time. */
const MIGRATION_STORAGE_KEY = "bk-sync-stamp-migrations-v1";

function readMigrations(): string[] {
  try {
    const raw = localStorage.getItem(MIGRATION_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

/** Whether `scope`'s one-time pre-stamp pass has yet to run in this browser. */
export function stampMigrationDue(scope: string): boolean {
  return !readMigrations().includes(scope);
}

export function markStampMigrationDone(scope: string): void {
  try {
    const done = readMigrations();
    if (done.includes(scope)) return;
    localStorage.setItem(MIGRATION_STORAGE_KEY, JSON.stringify([...done, scope]));
  } catch {
    // Storage unavailable: the pass simply runs again on the next hydrate.
  }
}

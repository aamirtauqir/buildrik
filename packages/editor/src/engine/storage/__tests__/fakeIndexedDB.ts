/**
 * Minimal in-memory IndexedDB fake for the storage test suites.
 *
 * jsdom ships no `indexedDB` and `fake-indexeddb` is not a dependency, so the
 * StorageAdapter indexeddb-backend tests and the VersionHistoryStorage tests
 * install this fake via `installFakeIndexedDB()` (vi.stubGlobal). It covers
 * exactly the surface those two modules use: open / onupgradeneeded /
 * onsuccess / onerror, createObjectStore({ keyPath }), createIndex,
 * transaction, objectStore put/get/delete, index getAll/getAllKeys,
 * tx oncomplete/onerror, db.close().
 *
 * Error injection:
 * - `env.openError` — every `indexedDB.open` fails with the given error.
 * - `env.putGate`   — consulted on every `store.put` at commit time; returning
 *                     a DOMException fails the request AND its transaction
 *                     with that error (how quota exhaustion surfaces in real
 *                     IndexedDB: `tx.error.name === "QuotaExceededError"`).
 *
 * @license BSD-3-Clause
 */
import { vi } from "vitest";

type VoidHandler = (() => void) | null;

export interface PutGateArgs {
  /** Object store name the put targets */
  store: string;
  /** Primary key extracted via the store's keyPath */
  key: IDBValidKey;
  /** Record count in the store at commit time */
  size: number;
  /** Whether the key already exists (put would overwrite, not grow) */
  hasKey: boolean;
}

class FakeRequest<T = unknown> {
  result!: T;
  error: DOMException | null = null;
  onsuccess: VoidHandler = null;
  onerror: VoidHandler = null;
  /**
   * Real IDB passes an IDBVersionChangeEvent whose `target` is the request.
   * ComponentStorage reads `event.target.result`, so the fake mirrors that;
   * handlers that ignore the argument (StorageAdapter, VersionHistoryStorage)
   * are unaffected.
   */
  onupgradeneeded: ((event: { target: unknown }) => void) | null = null;
}

class StoreData {
  records = new Map<IDBValidKey, unknown>();
  /** index name -> keyPath (dot-paths supported) */
  indexes = new Map<string, string>();
  constructor(public keyPath: string) {}
}

class DatabaseData {
  stores = new Map<string, StoreData>();
  constructor(
    public name: string,
    public version: number
  ) {}
}

function resolvePath(value: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (acc, part) => (acc == null ? undefined : (acc as Record<string, unknown>)[part]),
      value
    );
}

class FakeTransaction {
  error: DOMException | null = null;
  oncomplete: VoidHandler = null;
  onerror: VoidHandler = null;
  private pending = 0;
  private settled = false;

  constructor(
    private data: DatabaseData,
    private env: FakeIndexedDBEnv
  ) {
    // A transaction with no requests still settles.
    queueMicrotask(() => this.maybeSettle());
  }

  objectStore(name: string): FakeObjectStoreHandle {
    const store = this.data.stores.get(name);
    if (!store) {
      throw new DOMException(`No objectStore named ${name}`, "NotFoundError");
    }
    return new FakeObjectStoreHandle(store, name, this, this.env);
  }

  /** Queue a request body; tracks pending count so oncomplete fires last. */
  _run(fire: () => void): void {
    this.pending++;
    queueMicrotask(() => {
      fire();
      this.pending--;
      // Requests created inside `fire` (e.g. deletes issued from a getAllKeys
      // onsuccess) have already incremented `pending`, so settling only
      // happens once every request in the transaction has fired.
      queueMicrotask(() => this.maybeSettle());
    });
  }

  private maybeSettle(): void {
    if (this.settled || this.pending > 0) return;
    this.settled = true;
    if (this.error) this.onerror?.();
    else this.oncomplete?.();
  }
}

class FakeObjectStoreHandle {
  constructor(
    private store: StoreData,
    private name: string,
    private tx: FakeTransaction,
    private env: FakeIndexedDBEnv
  ) {}

  put(value: Record<string, unknown>): FakeRequest<IDBValidKey> {
    const req = new FakeRequest<IDBValidKey>();
    this.tx._run(() => {
      const key = value[this.store.keyPath] as IDBValidKey;
      const gateError =
        this.env.putGate?.({
          store: this.name,
          key,
          size: this.store.records.size,
          hasKey: this.store.records.has(key),
        }) ?? null;
      if (gateError) {
        req.error = gateError;
        this.tx.error = gateError;
        req.onerror?.();
        return;
      }
      // Real IndexedDB structured-clones on write; mirror that so stored
      // records are never live references into caller objects.
      this.store.records.set(key, structuredClone(value));
      req.result = key;
      req.onsuccess?.();
    });
    return req;
  }

  get(key: IDBValidKey): FakeRequest<unknown> {
    const req = new FakeRequest<unknown>();
    this.tx._run(() => {
      const record = this.store.records.get(key);
      req.result = record === undefined ? undefined : structuredClone(record);
      req.onsuccess?.();
    });
    return req;
  }

  delete(key: IDBValidKey): FakeRequest<undefined> {
    const req = new FakeRequest<undefined>();
    this.tx._run(() => {
      this.store.records.delete(key);
      req.onsuccess?.();
    });
    return req;
  }

  index(name: string): FakeIndexHandle {
    const keyPath = this.store.indexes.get(name);
    if (!keyPath) {
      throw new DOMException(`No index named ${name}`, "NotFoundError");
    }
    return new FakeIndexHandle(this.store, keyPath, this.tx);
  }
}

class FakeIndexHandle {
  constructor(
    private store: StoreData,
    private keyPath: string,
    private tx: FakeTransaction
  ) {}

  getAll(query: unknown): FakeRequest<unknown[]> {
    const req = new FakeRequest<unknown[]>();
    this.tx._run(() => {
      const matches: unknown[] = [];
      this.store.records.forEach((record) => {
        if (resolvePath(record, this.keyPath) === query) {
          matches.push(structuredClone(record));
        }
      });
      req.result = matches;
      req.onsuccess?.();
    });
    return req;
  }

  getAllKeys(query: unknown): FakeRequest<IDBValidKey[]> {
    const req = new FakeRequest<IDBValidKey[]>();
    this.tx._run(() => {
      const keys: IDBValidKey[] = [];
      this.store.records.forEach((record, key) => {
        if (resolvePath(record, this.keyPath) === query) {
          keys.push(key);
        }
      });
      req.result = keys;
      req.onsuccess?.();
    });
    return req;
  }
}

class FakeConnection {
  closed = false;
  readonly objectStoreNames: { contains: (name: string) => boolean };

  constructor(
    private data: DatabaseData,
    private env: FakeIndexedDBEnv
  ) {
    this.objectStoreNames = { contains: (name: string) => data.stores.has(name) };
  }

  createObjectStore(name: string, opts: { keyPath: string }): {
    createIndex: (indexName: string, keyPath: string, opts?: { unique?: boolean }) => void;
  } {
    const store = new StoreData(opts.keyPath);
    this.data.stores.set(name, store);
    return {
      createIndex: (indexName: string, keyPath: string) => {
        store.indexes.set(indexName, keyPath);
      },
    };
  }

  transaction(name: string, _mode?: IDBTransactionMode): FakeTransaction {
    if (this.closed) {
      throw new DOMException("Connection is closed", "InvalidStateError");
    }
    return new FakeTransaction(this.data, this.env);
  }

  close(): void {
    this.closed = true;
  }
}

export class FakeIndexedDBEnv {
  databases = new Map<string, DatabaseData>();
  openCalls: Array<{ name: string; version?: number }> = [];
  openError: DOMException | null = null;
  putGate: ((args: PutGateArgs) => DOMException | null) | null = null;

  open = (name: string, version?: number): FakeRequest<FakeConnection> => {
    this.openCalls.push({ name, version });
    const req = new FakeRequest<FakeConnection>();
    queueMicrotask(() => {
      if (this.openError) {
        req.error = this.openError;
        req.onerror?.();
        return;
      }
      let data = this.databases.get(name);
      const needsUpgrade = !data;
      if (!data) {
        data = new DatabaseData(name, version ?? 1);
        this.databases.set(name, data);
      }
      req.result = new FakeConnection(data, this);
      if (needsUpgrade) req.onupgradeneeded?.({ target: req });
      req.onsuccess?.();
    });
    return req;
  };

  /** Direct record access for assertions, bypassing the async API. */
  getRecords(dbName: string, storeName: string): Map<IDBValidKey, unknown> | undefined {
    return this.databases.get(dbName)?.stores.get(storeName)?.records;
  }
}

/** Stub `globalThis.indexedDB` with a fresh fake. Undo with vi.unstubAllGlobals(). */
export function installFakeIndexedDB(): FakeIndexedDBEnv {
  const env = new FakeIndexedDBEnv();
  vi.stubGlobal("indexedDB", env);
  return env;
}

export function quotaExceededError(): DOMException {
  return new DOMException("Quota exceeded", "QuotaExceededError");
}

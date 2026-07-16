/**
 * StorageAdapter — persistence backends, key scoping, autosave debounce,
 * error paths, and adapter delegation.
 *
 * Browser-storage secret redaction for the `local` backend is covered by the
 * sibling StorageAdapter.secrets.test.ts; this file asserts redaction for the
 * `session` and `indexeddb` backends and that `remote` (server sync over
 * HTTPS) is NOT redacted.
 *
 * jsdom ships no `indexedDB`, so the indexeddb backend runs against the
 * in-memory fake in ./fakeIndexedDB (installed per test via vi.stubGlobal).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StorageAdapter } from "../StorageAdapter";
import { EVENTS, THRESHOLDS } from "../../../shared/constants";
import type { Composer } from "../../Composer";
import type { ProjectData, ProjectSettings, StorageConfig } from "../../../shared/types";
import { installFakeIndexedDB, quotaExceededError } from "./fakeIndexedDB";

// ============================================
// Fixtures
// ============================================

function makeProject(version = "1.0.0"): ProjectData {
  return { version, pages: [], styles: [], assets: [] };
}

function projectWithSecrets(): ProjectData {
  const settings: ProjectSettings = {
    integrations: {
      email: { provider: "resend", enabled: true, apiKey: "re_secret_123", listId: "L1" },
    },
    publishing: { provider: "vercel", publishedPassword: "hunter2" },
  };
  return { ...makeProject(), settings };
}

/**
 * Stub composer: real listener dispatch (so PROJECT_CHANGED reaches the
 * adapter's debounced handler) plus a record of every emit for STORAGE_ERROR
 * assertions. The full Composer pulls 25+ managers — overkill here.
 */
function createStubComposer(options: { dirty?: boolean; project?: ProjectData } = {}) {
  const listeners = new Map<string, Set<(payload?: unknown) => void>>();
  const emitted: Array<{ event: string; payload?: unknown }> = [];
  const project = options.project ?? makeProject();

  const stub = {
    on: vi.fn((event: string, handler: (payload?: unknown) => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(handler);
    }),
    off: vi.fn((event: string, handler: (payload?: unknown) => void) => {
      listeners.get(event)?.delete(handler);
    }),
    emit: vi.fn((event: string, payload?: unknown) => {
      emitted.push({ event, payload });
      listeners.get(event)?.forEach((handler) => handler(payload));
    }),
    isDirty: vi.fn(() => options.dirty ?? true),
    exportProject: vi.fn(() => project),
  };

  return { stub, emitted, project, composer: stub as unknown as Composer };
}

function makeLocalAdapter(keyPrefix: string, config: Partial<StorageConfig> = {}) {
  const { composer } = createStubComposer();
  return new StorageAdapter(composer, {
    type: "local",
    keyPrefix,
    autoSave: false,
    ...config,
  });
}

describe("StorageAdapter", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  // ============================================
  // Key scoping
  // ============================================

  describe("key scoping", () => {
    it("defaults to keyPrefix 'aquibra' and unscoped key '<prefix>-project'", async () => {
      const { composer } = createStubComposer();
      const adapter = new StorageAdapter(composer, { type: "local", autoSave: false });

      await adapter.save(makeProject("default-key"));

      const raw = localStorage.getItem("aquibra-project");
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw!).version).toBe("default-key");
    });

    it("scopes save/load to '<prefix>-<id>' when an id is passed", async () => {
      const adapter = makeLocalAdapter("scoped");

      await adapter.save(makeProject("site-a"), "site-42");

      expect(localStorage.getItem("scoped-site-42")).not.toBeNull();
      expect(localStorage.getItem("scoped-project")).toBeNull();

      const loaded = await adapter.load("site-42");
      expect(loaded?.version).toBe("site-a");
    });

    it("keeps projects with different ids under the same prefix isolated", async () => {
      const adapter = makeLocalAdapter("multi");

      await adapter.save(makeProject("one"), "p1");
      await adapter.save(makeProject("two"), "p2");

      expect((await adapter.load("p1"))?.version).toBe("one");
      expect((await adapter.load("p2"))?.version).toBe("two");

      await adapter.delete("p1");
      expect(await adapter.load("p1")).toBeNull();
      expect((await adapter.load("p2"))?.version).toBe("two");
    });
  });

  // ============================================
  // local backend
  // ============================================

  describe("local backend", () => {
    it("round-trips a project through localStorage", async () => {
      const adapter = makeLocalAdapter("rt");
      const data = { ...makeProject("rt-1"), pagesOrder: ["a", "b"] };

      await adapter.save(data);
      const loaded = await adapter.load();

      expect(loaded).toEqual(data);
    });

    it("returns null when nothing is stored", async () => {
      const adapter = makeLocalAdapter("empty");
      expect(await adapter.load()).toBeNull();
    });

    it("returns null (not a throw) when the stored value is corrupt JSON", async () => {
      const adapter = makeLocalAdapter("corrupt");
      localStorage.setItem("corrupt-project", "{not valid json!!");

      await expect(adapter.load()).resolves.toBeNull();
    });

    it("rejects with the storage error when the quota is exceeded on save", async () => {
      const adapter = makeLocalAdapter("quota");
      const quotaError = quotaExceededError();
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw quotaError;
      });

      await expect(adapter.save(makeProject())).rejects.toBe(quotaError);
    });

    it("delete removes the stored project", async () => {
      const adapter = makeLocalAdapter("del");
      await adapter.save(makeProject());
      expect(localStorage.getItem("del-project")).not.toBeNull();

      await adapter.delete();
      expect(localStorage.getItem("del-project")).toBeNull();
    });
  });

  // ============================================
  // session backend
  // ============================================

  describe("session backend", () => {
    it("round-trips a project through sessionStorage without touching localStorage", async () => {
      const adapter = makeLocalAdapter("sess", { type: "session" });

      await adapter.save(makeProject("sess-1"));

      expect(sessionStorage.getItem("sess-project")).not.toBeNull();
      expect(localStorage.getItem("sess-project")).toBeNull();
      expect((await adapter.load())?.version).toBe("sess-1");
    });

    it("redacts email.apiKey and publishedPassword in the sessionStorage copy", async () => {
      const adapter = makeLocalAdapter("sess-secrets", { type: "session" });
      const data = projectWithSecrets();

      await adapter.save(data);

      const parsed = JSON.parse(sessionStorage.getItem("sess-secrets-project")!);
      expect(parsed.settings.integrations.email.apiKey).toBeUndefined();
      expect(parsed.settings.publishing.publishedPassword).toBeNull();
      // Non-secrets survive; the caller's object is untouched.
      expect(parsed.settings.integrations.email.provider).toBe("resend");
      expect(data.settings!.integrations!.email!.apiKey).toBe("re_secret_123");
    });

    it("returns null on corrupt sessionStorage JSON", async () => {
      const adapter = makeLocalAdapter("sess-corrupt", { type: "session" });
      sessionStorage.setItem("sess-corrupt-project", "]]]");

      await expect(adapter.load()).resolves.toBeNull();
    });

    it("rejects when sessionStorage save exceeds quota", async () => {
      const adapter = makeLocalAdapter("sess-quota", { type: "session" });
      const quotaError = quotaExceededError();
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw quotaError;
      });

      await expect(adapter.save(makeProject())).rejects.toBe(quotaError);
    });

    it("delete removes the sessionStorage entry", async () => {
      const adapter = makeLocalAdapter("sess-del", { type: "session" });
      await adapter.save(makeProject());

      await adapter.delete();
      expect(sessionStorage.getItem("sess-del-project")).toBeNull();
    });
  });

  // ============================================
  // indexeddb backend (in-memory fake)
  // ============================================

  describe("indexeddb backend", () => {
    it("saves into db 'aquibra-storage' store 'projects' keyed by the scoped key", async () => {
      const env = installFakeIndexedDB();
      const adapter = makeLocalAdapter("idb", { type: "indexeddb" });

      await adapter.save(makeProject("idb-1"), "site-9");

      expect(env.openCalls[0]).toEqual({ name: "aquibra-storage", version: 1 });
      const records = env.getRecords("aquibra-storage", "projects")!;
      const record = records.get("idb-site-9") as {
        id: string;
        data: ProjectData;
        updatedAt: number;
      };
      expect(record.id).toBe("idb-site-9");
      expect(record.data.version).toBe("idb-1");
      expect(typeof record.updatedAt).toBe("number");
    });

    it("round-trips a project and returns null for a missing key", async () => {
      installFakeIndexedDB();
      const adapter = makeLocalAdapter("idb-rt", { type: "indexeddb" });

      await adapter.save(makeProject("idb-rt-1"));
      expect((await adapter.load())?.version).toBe("idb-rt-1");
      expect(await adapter.load("never-saved")).toBeNull();
    });

    it("redacts email.apiKey and publishedPassword in the IndexedDB copy", async () => {
      installFakeIndexedDB();
      const adapter = makeLocalAdapter("idb-secrets", { type: "indexeddb" });
      const data = projectWithSecrets();

      await adapter.save(data);
      const loaded = await adapter.load();

      expect(loaded!.settings!.integrations!.email!.apiKey).toBeUndefined();
      expect(loaded!.settings!.publishing!.publishedPassword).toBeNull();
      expect(loaded!.settings!.integrations!.email!.provider).toBe("resend");
      // Caller's object keeps its secrets (server sync path).
      expect(data.settings!.integrations!.email!.apiKey).toBe("re_secret_123");
    });

    it("delete removes the record", async () => {
      const env = installFakeIndexedDB();
      const adapter = makeLocalAdapter("idb-del", { type: "indexeddb" });

      await adapter.save(makeProject());
      expect(env.getRecords("aquibra-storage", "projects")!.size).toBe(1);

      await adapter.delete();
      expect(env.getRecords("aquibra-storage", "projects")!.size).toBe(0);
      expect(await adapter.load()).toBeNull();
    });

    it("rejects when the database cannot be opened", async () => {
      const env = installFakeIndexedDB();
      env.openError = new DOMException("open denied", "UnknownError");
      const adapter = makeLocalAdapter("idb-err", { type: "indexeddb" });

      await expect(adapter.load()).rejects.toBe(env.openError);
      await expect(adapter.save(makeProject())).rejects.toBe(env.openError);
    });

    it("rejects save with the transaction error when the write fails", async () => {
      const env = installFakeIndexedDB();
      const quotaError = quotaExceededError();
      env.putGate = () => quotaError;
      const adapter = makeLocalAdapter("idb-quota", { type: "indexeddb" });

      await expect(adapter.save(makeProject())).rejects.toBe(quotaError);
    });
  });

  // ============================================
  // remote backend
  // ============================================

  describe("remote backend", () => {
    const endpoint = "https://api.example.test/projects";

    function makeRemoteAdapter(config: Partial<StorageConfig> = {}) {
      return makeLocalAdapter("rem", { type: "remote", endpoint, ...config });
    }

    it("load GETs '<endpoint>/<key>' and returns the JSON body", async () => {
      const project = makeProject("remote-1");
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => project,
      });
      vi.stubGlobal("fetch", fetchMock);

      const loaded = await makeRemoteAdapter().load("site-7");

      expect(fetchMock).toHaveBeenCalledWith(`${endpoint}/rem-site-7`);
      expect(loaded).toEqual(project);
    });

    it("load returns null on 404 and throws on other HTTP errors", async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404 });
      vi.stubGlobal("fetch", fetchMock);
      expect(await makeRemoteAdapter().load()).toBeNull();

      fetchMock.mockResolvedValue({ ok: false, status: 500 });
      await expect(makeRemoteAdapter().load()).rejects.toThrow("HTTP 500");
    });

    it("save PUTs JSON and does NOT redact secrets (server sync needs them)", async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      vi.stubGlobal("fetch", fetchMock);

      await makeRemoteAdapter().save(projectWithSecrets(), "site-7");

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${endpoint}/rem-site-7`);
      expect(init.method).toBe("PUT");
      expect(init.headers).toEqual({ "Content-Type": "application/json" });
      const body = JSON.parse(init.body);
      expect(body.settings.integrations.email.apiKey).toBe("re_secret_123");
      expect(body.settings.publishing.publishedPassword).toBe("hunter2");
    });

    it("save throws on a non-ok response", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));
      await expect(makeRemoteAdapter().save(makeProject())).rejects.toThrow("HTTP 403");
    });

    it("delete sends DELETE and throws on a non-ok response", async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      vi.stubGlobal("fetch", fetchMock);

      await makeRemoteAdapter().delete("site-7");
      expect(fetchMock).toHaveBeenCalledWith(`${endpoint}/rem-site-7`, { method: "DELETE" });

      fetchMock.mockResolvedValue({ ok: false, status: 500 });
      await expect(makeRemoteAdapter().delete()).rejects.toThrow("HTTP 500");
    });

    it("load/save/delete all throw when no endpoint is configured", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      const adapter = makeLocalAdapter("rem-noend", { type: "remote" });

      await expect(adapter.load()).rejects.toThrow("Remote endpoint not configured");
      await expect(adapter.save(makeProject())).rejects.toThrow(
        "Remote endpoint not configured"
      );
      await expect(adapter.delete()).rejects.toThrow("Remote endpoint not configured");
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // none backend
  // ============================================

  describe("none backend", () => {
    it("load resolves null, save/delete resolve without touching any storage", async () => {
      const adapter = makeLocalAdapter("none", { type: "none" });
      const setItem = vi.spyOn(Storage.prototype, "setItem");

      expect(await adapter.load()).toBeNull();
      await expect(adapter.save(makeProject())).resolves.toBeUndefined();
      await expect(adapter.delete()).resolves.toBeUndefined();
      expect(setItem).not.toHaveBeenCalled();
      expect(localStorage.length).toBe(0);
    });
  });

  // ============================================
  // custom handler delegation
  // ============================================

  describe("custom handler delegation", () => {
    // "custom" is not in the StorageConfig["type"] union — any unknown type
    // falls into the switch's default branch, which delegates to handlers.
    const customType = "custom" as StorageConfig["type"];

    it("load delegates the RAW id (not the prefixed key) to handlers.load", async () => {
      const project = makeProject("custom-1");
      const load = vi.fn().mockResolvedValue(project);
      const adapter = makeLocalAdapter("cust", { type: customType, handlers: { load } });

      expect(await adapter.load("abc")).toEqual(project);
      expect(load).toHaveBeenCalledWith("abc");

      await adapter.load();
      expect(load).toHaveBeenLastCalledWith(undefined);
    });

    it("save delegates the un-redacted data to handlers.save", async () => {
      const save = vi.fn().mockResolvedValue(undefined);
      const adapter = makeLocalAdapter("cust-s", { type: customType, handlers: { save } });
      const data = projectWithSecrets();

      await adapter.save(data, "ignored-id");

      // The exact same object — custom adapters own their transport security.
      expect(save).toHaveBeenCalledWith(data);
      expect(save.mock.calls[0][0].settings.integrations.email.apiKey).toBe("re_secret_123");
    });

    it("falls back to null/no-op when no handlers are configured", async () => {
      const adapter = makeLocalAdapter("cust-none", { type: customType });

      expect(await adapter.load()).toBeNull();
      await expect(adapter.save(makeProject())).resolves.toBeUndefined();
    });
  });

  // ============================================
  // Autosave (debounced PROJECT_CHANGED, only when dirty)
  // ============================================

  describe("autosave", () => {
    it("subscribes to PROJECT_CHANGED by default and not when autoSave is false", () => {
      const enabled = createStubComposer();
      new StorageAdapter(enabled.composer, { type: "local", keyPrefix: "as-on" });
      expect(enabled.stub.on).toHaveBeenCalledTimes(1);
      expect(enabled.stub.on.mock.calls[0][0]).toBe(EVENTS.PROJECT_CHANGED);

      const disabled = createStubComposer();
      new StorageAdapter(disabled.composer, {
        type: "local",
        keyPrefix: "as-off",
        autoSave: false,
      });
      expect(disabled.stub.on).not.toHaveBeenCalled();
    });

    it("saves the exported project after the default debounce interval", async () => {
      vi.useFakeTimers();
      const { composer, stub, project } = createStubComposer({
        project: makeProject("autosaved"),
      });
      new StorageAdapter(composer, { type: "local", keyPrefix: "as-def" });

      stub.emit(EVENTS.PROJECT_CHANGED);

      await vi.advanceTimersByTimeAsync(THRESHOLDS.AUTOSAVE_INTERVAL - 1);
      expect(localStorage.getItem("as-def-project")).toBeNull();

      await vi.advanceTimersByTimeAsync(1);
      expect(JSON.parse(localStorage.getItem("as-def-project")!)).toEqual(project);
      expect(stub.exportProject).toHaveBeenCalledTimes(1);
    });

    it("honors a custom autoSaveInterval", async () => {
      vi.useFakeTimers();
      const { composer, stub } = createStubComposer();
      new StorageAdapter(composer, {
        type: "local",
        keyPrefix: "as-int",
        autoSaveInterval: 250,
      });

      stub.emit(EVENTS.PROJECT_CHANGED);
      await vi.advanceTimersByTimeAsync(249);
      expect(localStorage.getItem("as-int-project")).toBeNull();
      await vi.advanceTimersByTimeAsync(1);
      expect(localStorage.getItem("as-int-project")).not.toBeNull();
    });

    it("coalesces a burst of PROJECT_CHANGED events into one save", async () => {
      vi.useFakeTimers();
      const { composer, stub } = createStubComposer();
      new StorageAdapter(composer, {
        type: "local",
        keyPrefix: "as-burst",
        autoSaveInterval: 100,
      });

      stub.emit(EVENTS.PROJECT_CHANGED);
      stub.emit(EVENTS.PROJECT_CHANGED);
      stub.emit(EVENTS.PROJECT_CHANGED);
      await vi.advanceTimersByTimeAsync(500);

      expect(stub.exportProject).toHaveBeenCalledTimes(1);
    });

    it("does not save when the composer is not dirty", async () => {
      vi.useFakeTimers();
      const { composer, stub } = createStubComposer({ dirty: false });
      new StorageAdapter(composer, {
        type: "local",
        keyPrefix: "as-clean",
        autoSaveInterval: 100,
      });

      stub.emit(EVENTS.PROJECT_CHANGED);
      await vi.advanceTimersByTimeAsync(500);

      expect(stub.isDirty).toHaveBeenCalled();
      expect(stub.exportProject).not.toHaveBeenCalled();
      expect(localStorage.getItem("as-clean-project")).toBeNull();
    });

    it("emits STORAGE_ERROR with operation 'auto-save' when the save fails", async () => {
      vi.useFakeTimers();
      const quotaError = quotaExceededError();
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw quotaError;
      });
      const { composer, stub, emitted } = createStubComposer();
      new StorageAdapter(composer, {
        type: "local",
        keyPrefix: "as-err",
        autoSaveInterval: 100,
      });

      stub.emit(EVENTS.PROJECT_CHANGED);
      await vi.advanceTimersByTimeAsync(500);

      const errorEvent = emitted.find((e) => e.event === EVENTS.STORAGE_ERROR);
      expect(errorEvent).toBeTruthy();
      expect(errorEvent!.payload).toEqual({ error: quotaError, operation: "auto-save" });
    });

    it("stopAutoSave unsubscribes: later PROJECT_CHANGED never saves", async () => {
      vi.useFakeTimers();
      const { composer, stub } = createStubComposer();
      const adapter = new StorageAdapter(composer, {
        type: "local",
        keyPrefix: "as-stop",
        autoSaveInterval: 100,
      });

      adapter.stopAutoSave();
      expect(stub.off).toHaveBeenCalledWith(EVENTS.PROJECT_CHANGED, expect.any(Function));

      stub.emit(EVENTS.PROJECT_CHANGED);
      await vi.advanceTimersByTimeAsync(1000);
      expect(localStorage.getItem("as-stop-project")).toBeNull();

      // Idempotent — second call must not double-unsubscribe or throw.
      adapter.stopAutoSave();
      expect(stub.off).toHaveBeenCalledTimes(1);
    });

    it("destroy() tears down the autosave subscription", () => {
      const { composer, stub } = createStubComposer();
      const adapter = new StorageAdapter(composer, { type: "local", keyPrefix: "as-destroy" });

      adapter.destroy();

      expect(stub.off).toHaveBeenCalledWith(EVENTS.PROJECT_CHANGED, expect.any(Function));
    });

    it.todo(
      "BUG: stopAutoSave() does not cancel an already-scheduled debounced save — " +
        "a PROJECT_CHANGED fired just before stopAutoSave()/destroy() still saves " +
        "after the interval elapses (debouncedSaveHandler.cancel() is never called; " +
        "the handler is only unsubscribed from future events). A save can thus run " +
        "against a destroyed adapter's composer."
    );
  });

  // ============================================
  // Utility methods
  // ============================================

  describe("utility methods", () => {
    it("getType returns the configured type (default 'local')", () => {
      const { composer } = createStubComposer();
      expect(new StorageAdapter(composer, undefined).getType()).toBe("local");
      expect(makeLocalAdapter("t", { type: "session" }).getType()).toBe("session");
      expect(makeLocalAdapter("t", { type: "none" }).getType()).toBe("none");
    });

    it("isAvailable reflects the backend's actual availability", () => {
      expect(makeLocalAdapter("a").isAvailable()).toBe(true);
      expect(makeLocalAdapter("a", { type: "session" }).isAvailable()).toBe(true);
      expect(makeLocalAdapter("a", { type: "none" }).isAvailable()).toBe(false);

      expect(
        makeLocalAdapter("a", { type: "remote", endpoint: "https://x.test" }).isAvailable()
      ).toBe(true);
      expect(makeLocalAdapter("a", { type: "remote" }).isAvailable()).toBe(false);

      const customType = "custom" as StorageConfig["type"];
      expect(
        makeLocalAdapter("a", {
          type: customType,
          handlers: { load: async () => null },
        }).isAvailable()
      ).toBe(true);
      expect(makeLocalAdapter("a", { type: customType }).isAvailable()).toBe(false);
    });

    it("isAvailable for indexeddb tracks the presence of the global", () => {
      installFakeIndexedDB();
      expect(makeLocalAdapter("a", { type: "indexeddb" }).isAvailable()).toBe(true);

      vi.stubGlobal("indexedDB", undefined);
      expect(makeLocalAdapter("a", { type: "indexeddb" }).isAvailable()).toBe(false);
    });

    it("getStorageQuota reports navigator.storage.estimate figures", async () => {
      vi.stubGlobal("navigator", {
        storage: { estimate: async () => ({ usage: 500, quota: 2000 }) },
      });

      const quota = await makeLocalAdapter("q").getStorageQuota();
      expect(quota).toEqual({ used: 500, quota: 2000, percentage: 0.25 });
    });

    it("getStorageQuota guards against a zero quota (no division by zero)", async () => {
      vi.stubGlobal("navigator", {
        storage: { estimate: async () => ({ usage: 0, quota: 0 }) },
      });

      expect(await makeLocalAdapter("q0").getStorageQuota()).toEqual({
        used: 0,
        quota: 0,
        percentage: 0,
      });
    });

    it("getStorageQuota falls back to zeros when estimate rejects or is missing", async () => {
      vi.stubGlobal("navigator", {
        storage: {
          estimate: async () => {
            throw new Error("estimate unavailable");
          },
        },
      });
      expect(await makeLocalAdapter("qe").getStorageQuota()).toEqual({
        used: 0,
        quota: 0,
        percentage: 0,
      });

      vi.stubGlobal("navigator", {});
      expect(await makeLocalAdapter("qm").getStorageQuota()).toEqual({
        used: 0,
        quota: 0,
        percentage: 0,
      });
    });
  });
});

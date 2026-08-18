/**
 * VersionHistoryStorage — IndexedDB CRUD, prune, quota recovery, export/import.
 *
 * jsdom ships no `indexedDB`, so every test runs against the in-memory fake
 * in ./fakeIndexedDB (installed per test via vi.stubGlobal). Quota exhaustion
 * is injected through `env.putGate`, which fails the write transaction with a
 * DOMException exactly like real IndexedDB does.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NamedVersion } from "../../../shared/types/versions";
import {
  saveVersion,
  loadVersion,
  loadVersions,
  deleteVersion,
  deleteAllVersions,
  pruneVersions,
  exportVersions,
  importVersions,
  downloadVersionsFile,
  isStorageAvailable,
  getStorageStats,
} from "../VersionHistoryStorage";
import {
  installFakeIndexedDB,
  quotaExceededError,
  type FakeIndexedDBEnv,
} from "./fakeIndexedDB";

const DB_NAME = "aquibra-versions";
const STORE_NAME = "versions";

function makeVersion(overrides: Partial<NamedVersion> = {}): NamedVersion {
  return {
    id: "v-1",
    name: "Checkpoint",
    snapshot: { version: "1.0.0", pages: [], styles: [], assets: [] },
    createdAt: 1_000,
    isAutoCheckpoint: false,
    ...overrides,
  };
}

/**
 * Seed `count` versions with ascending createdAt (v-0 oldest … v-(n-1) newest).
 * NOTE: version ids are the store's primary key ACROSS projects, so seeding two
 * projects needs distinct idPrefixes or the second overwrites the first.
 */
async function seedVersions(
  count: number,
  projectId = "proj-a",
  idPrefix = "v",
  /* Pruning only ever evicts auto-checkpoints (board 162:2 — "named ones
     never prune"), so a prune test seeded with named versions is a test of
     nothing. */
  isAutoCheckpoint = true
): Promise<NamedVersion[]> {
  const versions: NamedVersion[] = [];
  for (let i = 0; i < count; i++) {
    const v = makeVersion({ id: `${idPrefix}-${i}`, createdAt: 1_000 + i * 100, projectId, isAutoCheckpoint });
    await saveVersion(v);
    versions.push(v);
  }
  return versions;
}

describe("VersionHistoryStorage", () => {
  let env: FakeIndexedDBEnv;

  beforeEach(() => {
    env = installFakeIndexedDB();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // ============================================
  // save / load
  // ============================================

  describe("saveVersion / loadVersion", () => {
    it("persists into db 'aquibra-versions' store 'versions' keyed by version id", async () => {
      await saveVersion(makeVersion({ id: "v-db", projectId: "p1" }));

      expect(env.openCalls[0]).toEqual({ name: DB_NAME, version: 1 });
      const record = env.getRecords(DB_NAME, STORE_NAME)!.get("v-db") as {
        id: string;
        projectId: string;
        data: NamedVersion;
        updatedAt: number;
      };
      expect(record.id).toBe("v-db");
      expect(record.projectId).toBe("p1");
      expect(record.data.name).toBe("Checkpoint");
      expect(typeof record.updatedAt).toBe("number");
    });

    it("round-trips a version through loadVersion", async () => {
      const version = makeVersion({
        id: "v-rt",
        name: "Before hero rewrite",
        description: "pre-experiment",
        projectId: "p1",
        tags: ["hero"],
      });

      await saveVersion(version);
      const loaded = await loadVersion("v-rt");

      expect(loaded).toEqual(version);
    });

    it("defaults the stored projectId to 'default' when the version has none", async () => {
      await saveVersion(makeVersion({ id: "v-nopid", projectId: undefined }));

      const record = env.getRecords(DB_NAME, STORE_NAME)!.get("v-nopid") as {
        projectId: string;
      };
      expect(record.projectId).toBe("default");
      // …and the no-arg loadVersions (projectId "default") finds it.
      const versions = await loadVersions();
      expect(versions.map((v) => v.id)).toEqual(["v-nopid"]);
    });

    it("upserts: saving the same id twice keeps one record with the new data", async () => {
      await saveVersion(makeVersion({ id: "v-up", name: "first", projectId: "p1" }));
      await saveVersion(makeVersion({ id: "v-up", name: "second", projectId: "p1" }));

      expect(env.getRecords(DB_NAME, STORE_NAME)!.size).toBe(1);
      expect((await loadVersion("v-up"))?.name).toBe("second");
    });

    it("loadVersion returns null for an unknown id", async () => {
      await saveVersion(makeVersion({ id: "v-known" }));
      expect(await loadVersion("v-unknown")).toBeNull();
    });

    it("rejects when the database cannot be opened", async () => {
      env.openError = new DOMException("open denied", "UnknownError");

      await expect(saveVersion(makeVersion())).rejects.toBe(env.openError);
      await expect(loadVersions("p1")).rejects.toBe(env.openError);
    });
  });

  // ============================================
  // loadVersions
  // ============================================

  describe("loadVersions", () => {
    it("returns versions sorted newest-first by createdAt", async () => {
      await saveVersion(makeVersion({ id: "old", createdAt: 100, projectId: "p1" }));
      await saveVersion(makeVersion({ id: "newest", createdAt: 900, projectId: "p1" }));
      await saveVersion(makeVersion({ id: "mid", createdAt: 500, projectId: "p1" }));

      const versions = await loadVersions("p1");
      expect(versions.map((v) => v.id)).toEqual(["newest", "mid", "old"]);
    });

    it("filters by projectId", async () => {
      await seedVersions(3, "proj-a", "a");
      await seedVersions(2, "proj-b", "b");

      expect((await loadVersions("proj-a")).map((v) => v.id)).toEqual(["a-2", "a-1", "a-0"]);
      expect((await loadVersions("proj-b")).map((v) => v.id)).toEqual(["b-1", "b-0"]);
      expect(await loadVersions("proj-c")).toEqual([]);
    });
  });

  // ============================================
  // delete
  // ============================================

  describe("deleteVersion / deleteAllVersions", () => {
    it("deleteVersion removes only the targeted version", async () => {
      await seedVersions(3, "p1");

      await deleteVersion("v-1");

      const remaining = await loadVersions("p1");
      expect(remaining.map((v) => v.id).sort()).toEqual(["v-0", "v-2"]);
    });

    it("deleteVersion resolves for an id that does not exist", async () => {
      await seedVersions(1, "p1");
      await expect(deleteVersion("nope")).resolves.toBeUndefined();
      expect(await loadVersions("p1")).toHaveLength(1);
    });

    it("deleteAllVersions wipes one project and leaves others intact", async () => {
      await seedVersions(3, "proj-a");
      const other = makeVersion({ id: "keep-me", projectId: "proj-b" });
      await saveVersion(other);

      await deleteAllVersions("proj-a");

      expect(await loadVersions("proj-a")).toEqual([]);
      expect((await loadVersions("proj-b")).map((v) => v.id)).toEqual(["keep-me"]);
    });
  });

  // ============================================
  // pruneVersions
  // ============================================

  describe("pruneVersions", () => {
    it("returns 0 and deletes nothing when at or under the limit", async () => {
      await seedVersions(5, "p1");

      expect(await pruneVersions("p1", 5)).toBe(0);
      expect(await pruneVersions("p1", 10)).toBe(0);
      expect(await loadVersions("p1")).toHaveLength(5);
    });

    it("deletes the oldest versions past the limit and returns the deleted count", async () => {
      await seedVersions(8, "p1"); // v-0 oldest … v-7 newest

      const deleted = await pruneVersions("p1", 3);

      expect(deleted).toBe(5);
      const remaining = await loadVersions("p1");
      expect(remaining.map((v) => v.id)).toEqual(["v-7", "v-6", "v-5"]);
    });

    it("defaults to a maximum of 50 versions", async () => {
      await seedVersions(55, "p1");

      const deleted = await pruneVersions("p1");

      expect(deleted).toBe(5);
      const remaining = await loadVersions("p1");
      expect(remaining).toHaveLength(50);
      // The 5 oldest (v-0 … v-4) are gone; v-5 is now the oldest survivor.
      expect(remaining[remaining.length - 1].id).toBe("v-5");
      expect(remaining[0].id).toBe("v-54");
    });

    it("never prunes a named version, even when it sits in the overflow", async () => {
      await seedVersions(4, "p1", "a");                       // a-0 oldest … a-3
      await saveVersion(makeVersion({ id: "m-1", projectId: "p1", createdAt: 1_050, isAutoCheckpoint: false }));

      const deleted = await pruneVersions("p1", 3);

      // Two too many; both evicted are auto-checkpoints and the milestone stays.
      expect(deleted).toBe(2);
      const remaining = (await loadVersions("p1")).map((v) => v.id);
      expect(remaining).toContain("m-1");
      expect(remaining).not.toContain("a-0");
      expect(remaining).not.toContain("a-1");
    });

    it("keeps every named version even past the cap", async () => {
      await seedVersions(5, "p2", "m", false);

      expect(await pruneVersions("p2", 2)).toBe(0);
      expect(await loadVersions("p2")).toHaveLength(5);
    });

    it("prunes only within the given project", async () => {
      await seedVersions(4, "proj-a");
      await saveVersion(makeVersion({ id: "b-1", projectId: "proj-b", createdAt: 1, isAutoCheckpoint: true }));

      await pruneVersions("proj-a", 2);

      expect(await loadVersions("proj-a")).toHaveLength(2);
      expect(await loadVersions("proj-b")).toHaveLength(1);
    });
  });

  // ============================================
  // Quota recovery (spec §5.2)
  // ============================================

  describe("saveVersion quota recovery", () => {
    it("on QuotaExceededError prunes the 10 oldest for the project and retries once", async () => {
      await seedVersions(15, "p1"); // v-0 oldest … v-14 newest
      // Simulate a full store: any put that would GROW the store fails.
      env.putGate = ({ size, hasKey }) =>
        !hasKey && size >= 15 ? quotaExceededError() : null;

      const newVersion = makeVersion({ id: "v-new", createdAt: 99_999, projectId: "p1" });
      await saveVersion(newVersion);

      const versions = await loadVersions("p1");
      // 15 - 10 pruned + 1 new = 6; the 10 oldest (v-0 … v-9) are gone.
      expect(versions).toHaveLength(6);
      expect(versions.map((v) => v.id)).toEqual([
        "v-new",
        "v-14",
        "v-13",
        "v-12",
        "v-11",
        "v-10",
      ]);
      expect(await loadVersion("v-new")).toEqual(newVersion);
    });

    it("rethrows when the retry also hits the quota", async () => {
      await seedVersions(15, "p1");
      const quotaError = quotaExceededError();
      env.putGate = () => quotaError; // every put fails, including the retry

      await expect(
        saveVersion(makeVersion({ id: "v-doomed", createdAt: 99_999, projectId: "p1" }))
      ).rejects.toBe(quotaError);

      // The prune between the two failed writes still happened (15 -> 5).
      expect(await loadVersions("p1")).toHaveLength(5);
      expect(await loadVersion("v-doomed")).toBeNull();
    });

    it("rethrows non-quota errors immediately without pruning", async () => {
      await seedVersions(12, "p1");
      const diskError = new DOMException("disk fell over", "UnknownError");
      env.putGate = ({ hasKey }) => (!hasKey ? diskError : null);

      await expect(
        saveVersion(makeVersion({ id: "v-fail", createdAt: 99_999, projectId: "p1" }))
      ).rejects.toBe(diskError);

      // No recovery attempt: nothing was pruned.
      expect(await loadVersions("p1")).toHaveLength(12);
    });
  });

  // ============================================
  // Export / Import
  // ============================================

  describe("exportVersions / importVersions", () => {
    it("exports the schema-versioned envelope with all project versions newest-first", async () => {
      await seedVersions(3, "p1");

      const exported = await exportVersions("p1");

      expect(exported.version).toBe("1.0.0");
      expect(exported.projectId).toBe("p1");
      expect(new Date(exported.exportedAt).getTime()).not.toBeNaN();
      expect(exported.versions.map((v) => v.id)).toEqual(["v-2", "v-1", "v-0"]);
    });

    it("imports versions under the export's projectId, rewriting each version's projectId", async () => {
      const count = await importVersions({
        version: "1.0.0",
        projectId: "target-proj",
        exportedAt: new Date().toISOString(),
        versions: [
          makeVersion({ id: "im-1", createdAt: 100, projectId: "source-proj" }),
          makeVersion({ id: "im-2", createdAt: 200, projectId: "source-proj" }),
        ],
      });

      expect(count).toBe(2);
      expect(await loadVersions("source-proj")).toEqual([]);
      const imported = await loadVersions("target-proj");
      expect(imported.map((v) => v.id)).toEqual(["im-2", "im-1"]);
      expect(imported.every((v) => v.projectId === "target-proj")).toBe(true);
    });

    it("merges with existing versions by default", async () => {
      await seedVersions(2, "p1");

      await importVersions({
        version: "1.0.0",
        projectId: "p1",
        exportedAt: new Date().toISOString(),
        versions: [makeVersion({ id: "im-1", createdAt: 5_000 })],
      });

      expect((await loadVersions("p1")).map((v) => v.id)).toEqual(["im-1", "v-1", "v-0"]);
    });

    it("clearExisting=true wipes the project's versions before importing", async () => {
      await seedVersions(2, "p1");

      await importVersions(
        {
          version: "1.0.0",
          projectId: "p1",
          exportedAt: new Date().toISOString(),
          versions: [makeVersion({ id: "im-only", createdAt: 5_000 })],
        },
        true
      );

      expect((await loadVersions("p1")).map((v) => v.id)).toEqual(["im-only"]);
    });
  });

  // ============================================
  // downloadVersionsFile
  // ============================================

  describe("downloadVersionsFile", () => {
    function makeExport() {
      return {
        version: "1.0.0" as const,
        projectId: "dl-proj",
        exportedAt: new Date().toISOString(),
        versions: [makeVersion({ id: "dl-1" })],
      };
    }

    it("clicks a temporary blob-URL anchor and revokes the URL afterwards", () => {
      const createObjectURL = vi.fn((_blob: Blob) => "blob:fake-url");
      const revokeObjectURL = vi.fn();
      vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

      let clicked: HTMLAnchorElement | null = null;
      let inBodyAtClick = false;
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
        this: HTMLAnchorElement
      ) {
        clicked = this;
        inBodyAtClick = document.body.contains(this);
      });

      downloadVersionsFile(makeExport(), "my-versions.json");

      expect(createObjectURL).toHaveBeenCalledTimes(1);
      const blob = createObjectURL.mock.calls[0][0];
      expect(blob.type).toBe("application/json");

      expect(clicked!.href).toContain("blob:fake-url");
      expect(clicked!.download).toBe("my-versions.json");
      expect(inBodyAtClick).toBe(true);
      // Anchor removed and URL revoked after the click.
      expect(document.body.contains(clicked!)).toBe(false);
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
    });

    it("defaults the filename to versions-<projectId>-<timestamp>.json", () => {
      vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:x"), revokeObjectURL: vi.fn() });
      let downloadName = "";
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
        this: HTMLAnchorElement
      ) {
        downloadName = this.download;
      });

      downloadVersionsFile(makeExport());

      expect(downloadName).toMatch(/^versions-dl-proj-\d+\.json$/);
    });
  });

  // ============================================
  // Utilities
  // ============================================

  describe("utilities", () => {
    it("isStorageAvailable tracks the indexedDB global", () => {
      expect(isStorageAvailable()).toBe(true);

      vi.stubGlobal("indexedDB", undefined);
      expect(isStorageAvailable()).toBe(false);
    });

    it("getStorageStats returns zero/null for an empty project", async () => {
      expect(await getStorageStats("empty-proj")).toEqual({
        count: 0,
        oldestDate: null,
        newestDate: null,
      });
    });

    it("getStorageStats reports count and oldest/newest creation dates", async () => {
      await saveVersion(makeVersion({ id: "s-old", createdAt: 10_000, projectId: "p1" }));
      await saveVersion(makeVersion({ id: "s-mid", createdAt: 20_000, projectId: "p1" }));
      await saveVersion(makeVersion({ id: "s-new", createdAt: 30_000, projectId: "p1" }));

      const stats = await getStorageStats("p1");

      expect(stats.count).toBe(3);
      expect(stats.newestDate).toEqual(new Date(30_000));
      expect(stats.oldestDate).toEqual(new Date(10_000));
    });
  });
});

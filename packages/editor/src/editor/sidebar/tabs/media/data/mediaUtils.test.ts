import { describe, it, expect } from "vitest";
import type { LibraryItem } from "./mediaTypes";
import type { MediaAsset } from "@/shared/types/media";
import { countByType, fmtSize, toLibraryItem } from "./mediaUtils";

describe("toLibraryItem — assetId threading (G11)", () => {
  const base = {
    id: "local_1", name: "hero", type: "image" as const, src: "blob:x",
    size: 1234, mimeType: "image/png", createdAt: "2026-06-14T00:00:00Z",
  };
  it("surfaces the synced serverId as assetId for version-history calls", () => {
    const synced = { ...base, serverId: "srv_abc" } as unknown as MediaAsset;
    expect(toLibraryItem(synced).assetId).toBe("srv_abc");
  });
  it("leaves assetId undefined for local-only / unsynced assets", () => {
    expect(toLibraryItem(base as unknown as MediaAsset).assetId).toBeUndefined();
  });
});

describe("fmtSize", () => {
  it("formats bytes", () => expect(fmtSize(512)).toBe("512 B"));
  it("formats KB", () => expect(fmtSize(1536)).toBe("1.5 KB"));
  // No padded decimals: the boards write "24 MB", never "24.0 MB".
  it("formats MB", () => expect(fmtSize(2 * 1024 * 1024)).toBe("2 MB"));
  it("formats GB for 1073741824 bytes (1 GB quota)", () =>
    expect(fmtSize(1_073_741_824)).toBe("1 GB"));
  it("formats partial GB", () => expect(fmtSize(1.5 * 1024 * 1024 * 1024)).toBe("1.5 GB"));
  it("formats 0 bytes", () => expect(fmtSize(0)).toBe("0 B"));
});

describe("countByType", () => {
  const items: LibraryItem[] = [
    { key: "1", name: "a", type: "img", src: "", size: 0, createdAt: "", mimeType: "" },
    { key: "2", name: "b", type: "img", src: "", size: 0, createdAt: "", mimeType: "" },
    { key: "3", name: "c", type: "vid", src: "", size: 0, createdAt: "", mimeType: "" },
    { key: "4", name: "d", type: "ico", src: "", size: 0, createdAt: "", mimeType: "" },
    { key: "5", name: "e", type: "fnt", src: "", size: 0, createdAt: "", mimeType: "" },
  ];

  it("counts all types correctly", () => {
    const counts = countByType(items);
    expect(counts).toEqual({ all: 5, img: 2, vid: 1, ico: 1, fnt: 1 });
  });

  it("returns zeros for empty array", () => {
    expect(countByType([])).toEqual({ all: 0, img: 0, vid: 0, ico: 0, fnt: 0 });
  });
});

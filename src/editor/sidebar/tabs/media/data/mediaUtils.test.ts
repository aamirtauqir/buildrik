import { describe, it, expect } from "vitest";
import type { LibraryItem } from "./mediaTypes";
import { countByType, fmtSize } from "./mediaUtils";

describe("fmtSize", () => {
  it("formats bytes", () => expect(fmtSize(512)).toBe("512 B"));
  it("formats KB", () => expect(fmtSize(1536)).toBe("1.5 KB"));
  it("formats MB", () => expect(fmtSize(2 * 1024 * 1024)).toBe("2.0 MB"));
  it("formats GB for 1073741824 bytes (1 GB quota)", () =>
    expect(fmtSize(1_073_741_824)).toBe("1.0 GB"));
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

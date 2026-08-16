/**
 * `toLibraryItem` carries `assetSource` — the provenance badge's only input.
 *
 * Written after a live walk on 2026-08-17: a stock photo saved through the
 * real path (uploadFile → updateAsset({assetSource:"stock"})) landed in the
 * library with no `STOCK` badge. Both writers were correct and the local
 * record held the field; the mapper dropped it, so `AssetCell`'s badge was
 * unreachable for every asset in every session. AssetCell's own docstring
 * blamed the missing server column, which is a separate (real) limitation and
 * was not this bug.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { toLibraryItem } from "../mediaUtils";
import type { MediaAsset } from "@shared/types/media";

const asset = (over: Partial<MediaAsset> = {}): MediaAsset =>
  ({
    id: "a1",
    name: "shot",
    type: "image",
    src: "blob:x",
    size: 10,
    createdAt: new Date().toISOString(),
    ...over,
  }) as MediaAsset;

describe("toLibraryItem — provenance", () => {
  it("carries assetSource so the badge can paint", () => {
    expect(toLibraryItem(asset({ assetSource: "stock" })).assetSource).toBe("stock");
    expect(toLibraryItem(asset({ assetSource: "ai" })).assetSource).toBe("ai");
  });

  it("carries 'uploaded' too — the badge map, not the mapper, decides what paints", () => {
    // MediaManager stamps every upload. It must survive the mapping so the
    // decision about which sources get a badge stays in one place (AssetCell's
    // BADGE map), not smuggled into the data layer.
    expect(toLibraryItem(asset({ assetSource: "uploaded" })).assetSource).toBe("uploaded");
  });

  it("leaves it undefined when the asset has none", () => {
    expect(toLibraryItem(asset()).assetSource).toBeUndefined();
  });
});

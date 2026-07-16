/**
 * constants/media — MIME allow-lists, size limits, asset-type + placeholder.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import {
  isAllowedImageType,
  isAllowedVideoType,
  isAllowedAudioType,
  isAllowedMimeType,
  getMaxFileSize,
  getAssetTypeFromMime,
  placeholderImageSrc,
  MEDIA_SIZE_LIMITS,
} from "../media";

describe("MIME allow-lists", () => {
  it("isAllowedImageType", () => {
    expect(isAllowedImageType("image/png")).toBe(true);
    expect(isAllowedImageType("image/svg+xml")).toBe(true);
    expect(isAllowedImageType("image/tiff")).toBe(false);
  });
  it("isAllowedVideoType / isAllowedAudioType", () => {
    expect(isAllowedVideoType("video/mp4")).toBe(true);
    expect(isAllowedVideoType("video/avi")).toBe(false);
    expect(isAllowedAudioType("audio/mpeg")).toBe(true);
    expect(isAllowedAudioType("audio/flac")).toBe(false);
  });
  it("isAllowedMimeType spans all categories", () => {
    expect(isAllowedMimeType("image/png")).toBe(true);
    expect(isAllowedMimeType("video/mp4")).toBe(true);
    expect(isAllowedMimeType("audio/wav")).toBe(true);
    expect(isAllowedMimeType("application/pdf")).toBe(false);
  });
});

describe("getMaxFileSize", () => {
  it("picks the per-category limit, with SVG special-cased", () => {
    expect(getMaxFileSize("image/svg+xml")).toBe(MEDIA_SIZE_LIMITS.MAX_SVG_SIZE);
    expect(getMaxFileSize("image/png")).toBe(MEDIA_SIZE_LIMITS.MAX_IMAGE_SIZE);
    expect(getMaxFileSize("video/mp4")).toBe(MEDIA_SIZE_LIMITS.MAX_VIDEO_SIZE);
    expect(getMaxFileSize("audio/mpeg")).toBe(MEDIA_SIZE_LIMITS.MAX_AUDIO_SIZE);
  });
  it("falls back to the image limit for unknown types", () => {
    expect(getMaxFileSize("application/pdf")).toBe(MEDIA_SIZE_LIMITS.MAX_IMAGE_SIZE);
  });
});

describe("getAssetTypeFromMime", () => {
  it("maps MIME to an asset kind, svg before generic image", () => {
    expect(getAssetTypeFromMime("image/svg+xml")).toBe("svg");
    expect(getAssetTypeFromMime("image/png")).toBe("image");
    expect(getAssetTypeFromMime("video/mp4")).toBe("video");
    expect(getAssetTypeFromMime("audio/mpeg")).toBe("audio");
    expect(getAssetTypeFromMime("application/pdf")).toBeNull();
  });
});

describe("placeholderImageSrc", () => {
  it("returns an inline SVG data URI carrying the given dimensions", () => {
    const src = placeholderImageSrc(120, 90);
    expect(src.startsWith("data:image/svg+xml;utf8,")).toBe(true);
    const decoded = decodeURIComponent(src.replace("data:image/svg+xml;utf8,", ""));
    expect(decoded).toContain("width='120'");
    expect(decoded).toContain("height='90'");
    expect(decoded).toContain("<svg");
  });
});

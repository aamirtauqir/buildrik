/**
 * AltTextService tests — editor → server bridge for AI alt-text generation.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = {
  generateAltTextMutate: vi.fn(),
  featuresList: vi.fn(),
};

vi.mock("../api-client", () => ({
  createBuildrikApiClient: () => ({
    media: {
      generateAltText: {
        mutate: (...args: any[]) => mocks.generateAltTextMutate(...args),
      },
    },
    features: {
      list: { query: () => mocks.featuresList() },
    },
  }),
}));

import { autoAltTextEnabled, generateAltTextRemote, __resetAltTextClient } from "../AltTextService";

describe("AltTextService.autoAltTextEnabled (L4-007)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetAltTextClient();
  });

  it("reads the workspace's auto_alt_text flag", async () => {
    mocks.featuresList.mockResolvedValueOnce({ agency_layer: false, client_mode: false, auto_alt_text: true });
    await expect(autoAltTextEnabled()).resolves.toBe(true);
  });

  it("is off when the flag is off, absent, or unreadable — an opt-in is never assumed", async () => {
    mocks.featuresList.mockResolvedValueOnce({ agency_layer: true, client_mode: false, auto_alt_text: false });
    await expect(autoAltTextEnabled()).resolves.toBe(false);
    __resetAltTextClient();
    mocks.featuresList.mockResolvedValueOnce({ agency_layer: true });
    await expect(autoAltTextEnabled()).resolves.toBe(false);
    __resetAltTextClient();
    mocks.featuresList.mockRejectedValueOnce(new Error("401"));
    await expect(autoAltTextEnabled()).resolves.toBe(false);
  });

  it("asks the server once per short window, not once per file in a bulk drop", async () => {
    mocks.featuresList.mockResolvedValue({ auto_alt_text: true });
    await Promise.all([autoAltTextEnabled(), autoAltTextEnabled(), autoAltTextEnabled()]);
    expect(mocks.featuresList).toHaveBeenCalledTimes(1);
  });
});

describe("AltTextService.generateAltTextRemote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetAltTextClient();
  });

  it("returns the server's payload on success", async () => {
    mocks.generateAltTextMutate.mockResolvedValueOnce({
      altText: "A red bicycle by a brick wall.",
      skipped: false,
      model: "gpt-4o-mini",
    });

    const result = await generateAltTextRemote("asset-cuid-123");

    expect(result).toEqual({
      altText: "A red bicycle by a brick wall.",
      skipped: false,
      model: "gpt-4o-mini",
    });
    expect(mocks.generateAltTextMutate).toHaveBeenCalledWith({ assetId: "asset-cuid-123" });
  });

  it("Regenerate sends force: true; the default call never does", async () => {
    mocks.generateAltTextMutate.mockResolvedValue({ altText: "New", skipped: false });
    await generateAltTextRemote("a1", { force: true });
    expect(mocks.generateAltTextMutate).toHaveBeenLastCalledWith({ assetId: "a1", force: true });
    await generateAltTextRemote("a1");
    expect(mocks.generateAltTextMutate).toHaveBeenLastCalledWith({ assetId: "a1" });
  });

  it("the upload hook's call is marked automatic and can never force", async () => {
    mocks.generateAltTextMutate.mockResolvedValue({ altText: "", skipped: true, reason: "AUTO_OFF" });
    await generateAltTextRemote("a1", { trigger: "auto" });
    expect(mocks.generateAltTextMutate).toHaveBeenLastCalledWith({ assetId: "a1", trigger: "auto" });
  });

  it("returns skipped=true when the server preserved a user-typed value", async () => {
    mocks.generateAltTextMutate.mockResolvedValueOnce({
      altText: "User wrote this",
      skipped: true,
    });

    const result = await generateAltTextRemote("asset-cuid-123");

    expect(result).toEqual({ altText: "User wrote this", skipped: true });
  });

  it("returns null on tRPC error (auth / network / 4xx / 5xx)", async () => {
    mocks.generateAltTextMutate.mockRejectedValueOnce(new Error("UNAUTHORIZED"));

    const result = await generateAltTextRemote("asset-cuid-123");

    expect(result).toBeNull();
  });

  it("returns null on NOT_IMAGE BAD_REQUEST", async () => {
    mocks.generateAltTextMutate.mockRejectedValueOnce(
      new Error("Alt text generation is only available for images."),
    );

    const result = await generateAltTextRemote("asset-cuid-123");

    expect(result).toBeNull();
  });
});

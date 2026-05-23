/**
 * AltTextService tests — editor → server bridge for AI alt-text generation.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = {
  generateAltTextMutate: vi.fn(),
};

vi.mock("../api-client", () => ({
  createBuildrikApiClient: () => ({
    media: {
      generateAltText: {
        mutate: (...args: any[]) => mocks.generateAltTextMutate(...args),
      },
    },
  }),
}));

import { generateAltTextRemote, __resetAltTextClient } from "../AltTextService";

describe("AltTextService.generateAltTextRemote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetAltTextClient();
  });

  it("returns the server's payload on success", async () => {
    mocks.generateAltTextMutate.mockResolvedValueOnce({
      altText: "A red bicycle by a brick wall.",
      skipped: false,
      model: "claude-haiku-4-5",
    });

    const result = await generateAltTextRemote("asset-cuid-123");

    expect(result).toEqual({
      altText: "A red bicycle by a brick wall.",
      skipped: false,
      model: "claude-haiku-4-5",
    });
    expect(mocks.generateAltTextMutate).toHaveBeenCalledWith({ assetId: "asset-cuid-123" });
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

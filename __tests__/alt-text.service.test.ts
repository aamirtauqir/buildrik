import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    mediaAsset: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const checkSiteRoleMock = vi.fn();
vi.mock("@/server/services/permission.service", () => ({
  checkSiteRole: (...a: unknown[]) => checkSiteRoleMock(...a),
}));

const mockCompletionsCreate = vi.fn();
vi.mock("openai", () => ({
  default: class MockOpenAI {
    chat = { completions: { create: mockCompletionsCreate } };
  },
}));

import { prisma } from "@/lib/prisma";

const SAMPLE_ASSET = {
  userId: "u1",
  url: "https://blob.vercel-storage.com/abc.jpg",
  type: "image",
  altText: null as string | null,
};

const SAMPLE_RESPONSE = {
  choices: [{ message: { content: "A sunset over mountains." } }],
  usage: { prompt_tokens: 1024, completion_tokens: 8 },
};

describe("alt-text.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
  });

  // ─── generateAltText (bare AI call) ─────────────────────────────────────

  describe("generateAltText", () => {
    it("returns trimmed text from the model with usage", async () => {
      const { generateAltText } = await import("@/server/services/alt-text.service");
      mockCompletionsCreate.mockResolvedValueOnce({
        choices: [{ message: { content: "  A red bicycle leaning on a brick wall.  " } }],
        usage: { prompt_tokens: 500, completion_tokens: 12 },
      });

      const result = await generateAltText({ imageUrl: "https://x/y.jpg" });

      expect(result.altText).toBe("A red bicycle leaning on a brick wall.");
      expect(result.model).toBe("gpt-4o-mini");
      expect(result.usage).toEqual({ inputTokens: 500, outputTokens: 12 });
    });

    it("throws when the model returns empty text", async () => {
      const { generateAltText } = await import("@/server/services/alt-text.service");
      mockCompletionsCreate.mockResolvedValueOnce({
        choices: [{ message: { content: "   " } }],
      });
      await expect(generateAltText({ imageUrl: "https://x/y.jpg" })).rejects.toThrow(
        /empty alt text/i,
      );
    });

    it("throws when the model returns no content", async () => {
      const { generateAltText } = await import("@/server/services/alt-text.service");
      mockCompletionsCreate.mockResolvedValueOnce({
        choices: [{ message: { content: null } }],
      });
      await expect(generateAltText({ imageUrl: "https://x/y.jpg" })).rejects.toThrow(
        /empty alt text/i,
      );
    });
  });

  // ─── applyAltTextToAsset (orchestrator) ─────────────────────────────────

  describe("applyAltTextToAsset", () => {
    it("throws ASSET_NOT_FOUND when asset is missing", async () => {
      const { applyAltTextToAsset } = await import("@/server/services/alt-text.service");
      vi.mocked(prisma.mediaAsset.findUnique).mockResolvedValue(null as any);

      await expect(applyAltTextToAsset("u1", "missing")).rejects.toThrow("ASSET_NOT_FOUND");
    });

    it("throws ASSET_NOT_FOUND when asset is owned by a different user", async () => {
      const { applyAltTextToAsset } = await import("@/server/services/alt-text.service");
      vi.mocked(prisma.mediaAsset.findUnique).mockResolvedValue({
        ...SAMPLE_ASSET,
        userId: "other-user",
      } as any);

      await expect(applyAltTextToAsset("u1", "a1")).rejects.toThrow("ASSET_NOT_FOUND");
      expect(mockCompletionsCreate).not.toHaveBeenCalled();
    });

    it("throws NOT_IMAGE when asset.type is not 'image'", async () => {
      const { applyAltTextToAsset } = await import("@/server/services/alt-text.service");
      vi.mocked(prisma.mediaAsset.findUnique).mockResolvedValue({
        ...SAMPLE_ASSET,
        type: "video",
      } as any);

      await expect(applyAltTextToAsset("u1", "a1")).rejects.toThrow("NOT_IMAGE");
      expect(mockCompletionsCreate).not.toHaveBeenCalled();
    });

    it("returns existing alt text without calling the model when user already typed one", async () => {
      const { applyAltTextToAsset } = await import("@/server/services/alt-text.service");
      vi.mocked(prisma.mediaAsset.findUnique).mockResolvedValue({
        ...SAMPLE_ASSET,
        altText: "User wrote this",
      } as any);

      const result = await applyAltTextToAsset("u1", "a1");

      expect(result).toEqual({ altText: "User wrote this", skipped: true });
      expect(mockCompletionsCreate).not.toHaveBeenCalled();
      expect(prisma.mediaAsset.update).not.toHaveBeenCalled();
    });

    it("treats whitespace-only existing alt text as empty (still generates)", async () => {
      const { applyAltTextToAsset } = await import("@/server/services/alt-text.service");
      vi.mocked(prisma.mediaAsset.findUnique)
        .mockResolvedValueOnce({ ...SAMPLE_ASSET, altText: "   " } as any)
        .mockResolvedValueOnce({ userId: "u1", altText: null } as any);
      mockCompletionsCreate.mockResolvedValueOnce(SAMPLE_RESPONSE);
      vi.mocked(prisma.mediaAsset.update).mockResolvedValue({} as any);

      const result = await applyAltTextToAsset("u1", "a1");

      expect(result.skipped).toBe(false);
      expect(result.altText).toBe("A sunset over mountains.");
      expect(mockCompletionsCreate).toHaveBeenCalledTimes(1);
    });

    it("generates and persists alt text + generatedMetadata on the happy path", async () => {
      const { applyAltTextToAsset } = await import("@/server/services/alt-text.service");
      vi.mocked(prisma.mediaAsset.findUnique)
        .mockResolvedValueOnce(SAMPLE_ASSET as any)
        .mockResolvedValueOnce({ userId: "u1", altText: null } as any);
      mockCompletionsCreate.mockResolvedValueOnce(SAMPLE_RESPONSE);
      vi.mocked(prisma.mediaAsset.update).mockResolvedValue({} as any);

      const result = await applyAltTextToAsset("u1", "a1");

      expect(result).toEqual({
        altText: "A sunset over mountains.",
        skipped: false,
        model: "gpt-4o-mini",
      });

      const updateArgs = vi.mocked(prisma.mediaAsset.update).mock.calls[0][0];
      expect(updateArgs.where).toEqual({ id: "a1" });
      expect(updateArgs.data.altText).toBe("A sunset over mountains.");
      const meta = updateArgs.data.generatedMetadata as any;
      expect(meta.altText.model).toBe("gpt-4o-mini");
      expect(meta.altText.usage).toEqual({ inputTokens: 1024, outputTokens: 8 });
      expect(typeof meta.altText.generatedAt).toBe("string");
    });

    it("preserves user-typed alt text when the user types DURING generation (TOCTOU)", async () => {
      const { applyAltTextToAsset } = await import("@/server/services/alt-text.service");
      // First read: empty altText (nothing to skip on).
      // Second read (post-AI): user has now typed.
      vi.mocked(prisma.mediaAsset.findUnique)
        .mockResolvedValueOnce(SAMPLE_ASSET as any)
        .mockResolvedValueOnce({ userId: "u1", altText: "I typed this mid-stream" } as any);
      mockCompletionsCreate.mockResolvedValueOnce(SAMPLE_RESPONSE);

      const result = await applyAltTextToAsset("u1", "a1");

      expect(result).toEqual({ altText: "I typed this mid-stream", skipped: true });
      expect(prisma.mediaAsset.update).not.toHaveBeenCalled();
    });

    it("throws ASSET_NOT_FOUND if the asset disappears between AI call and persistence", async () => {
      const { applyAltTextToAsset } = await import("@/server/services/alt-text.service");
      vi.mocked(prisma.mediaAsset.findUnique)
        .mockResolvedValueOnce(SAMPLE_ASSET as any)
        .mockResolvedValueOnce(null as any);
      mockCompletionsCreate.mockResolvedValueOnce(SAMPLE_RESPONSE);

      await expect(applyAltTextToAsset("u1", "a1")).rejects.toThrow("ASSET_NOT_FOUND");
      expect(prisma.mediaAsset.update).not.toHaveBeenCalled();
    });
  });

  // ─── Regenerate (force) ─────────────────────────────────────────────────
  /* The library's "Regenerate" could never work: the skip-guard kept any
     existing alt text, so the button only ever said "Kept your alt text". */
  describe("applyAltTextToAsset — force (Regenerate)", () => {
    it("replaces existing alt text when forced", async () => {
      const { applyAltTextToAsset } = await import("@/server/services/alt-text.service");
      vi.mocked(prisma.mediaAsset.findUnique).mockResolvedValue({ ...SAMPLE_ASSET, altText: "Old text" } as any);
      mockCompletionsCreate.mockResolvedValue(SAMPLE_RESPONSE);

      const result = await applyAltTextToAsset("u1", "a1", { force: true });

      expect(result).toMatchObject({ altText: "A sunset over mountains.", skipped: false });
      expect(prisma.mediaAsset.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ altText: "A sunset over mountains." }) }),
      );
    });

    it("without force, existing alt text is still kept and the model is not called", async () => {
      const { applyAltTextToAsset } = await import("@/server/services/alt-text.service");
      vi.mocked(prisma.mediaAsset.findUnique).mockResolvedValue({ ...SAMPLE_ASSET, altText: "Old text" } as any);

      await expect(applyAltTextToAsset("u1", "a1")).resolves.toMatchObject({ altText: "Old text", skipped: true });
      expect(mockCompletionsCreate).not.toHaveBeenCalled();
      expect(prisma.mediaAsset.update).not.toHaveBeenCalled();
    });

    it("forced, but the user typed something NEW while generating → theirs wins", async () => {
      const { applyAltTextToAsset } = await import("@/server/services/alt-text.service");
      vi.mocked(prisma.mediaAsset.findUnique)
        .mockResolvedValueOnce({ ...SAMPLE_ASSET, altText: "Old text" } as any)
        .mockResolvedValueOnce({ userId: "u1", altText: "Typed meanwhile" } as any);
      mockCompletionsCreate.mockResolvedValue(SAMPLE_RESPONSE);

      await expect(applyAltTextToAsset("u1", "a1", { force: true })).resolves.toEqual({
        altText: "Typed meanwhile",
        skipped: true,
      });
      expect(prisma.mediaAsset.update).not.toHaveBeenCalled();
    });

    it("force does not bypass the role gate: a VIEWER on the asset's site is refused", async () => {
      const { applyAltTextToAsset } = await import("@/server/services/alt-text.service");
      vi.mocked(prisma.mediaAsset.findUnique).mockResolvedValue({ ...SAMPLE_ASSET, siteId: "s1", altText: "Old" } as any);
      checkSiteRoleMock.mockRejectedValueOnce(Object.assign(new Error("Insufficient permissions"), { code: "FORBIDDEN" }));

      await expect(applyAltTextToAsset("u1", "a1", { force: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(checkSiteRoleMock).toHaveBeenCalledWith(expect.anything(), "u1", "s1", "EDITOR");
      expect(mockCompletionsCreate).not.toHaveBeenCalled();
    });
  });
});

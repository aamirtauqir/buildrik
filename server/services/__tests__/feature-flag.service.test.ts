/**
 * Per-workspace feature flags. Verifies default-off semantics (absent row = disabled,
 * so a feature ships dark), the full-map fill, and the idempotent upsert toggle.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const featureFindUnique = vi.fn();
const featureFindMany = vi.fn();
const featureUpsert = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspaceFeature: {
      findUnique: (...a: unknown[]) => featureFindUnique(...a),
      findMany: (...a: unknown[]) => featureFindMany(...a),
      upsert: (...a: unknown[]) => featureUpsert(...a),
    },
  },
}));

import {
  isFeatureEnabled,
  listWorkspaceFeatures,
  setFeature,
} from "@server/services/feature-flag.service";

describe("feature-flag service", () => {
  beforeEach(() => {
    featureFindUnique.mockReset();
    featureFindMany.mockReset();
    featureUpsert.mockReset();
  });

  describe("isFeatureEnabled", () => {
    it("returns true when the row is enabled", async () => {
      featureFindUnique.mockResolvedValueOnce({ enabled: true });
      await expect(isFeatureEnabled("ws-1", "agency_layer")).resolves.toBe(true);
    });

    it("returns false when the row is disabled", async () => {
      featureFindUnique.mockResolvedValueOnce({ enabled: false });
      await expect(isFeatureEnabled("ws-1", "client_mode")).resolves.toBe(false);
    });

    it("defaults to false when no row exists (ships dark)", async () => {
      featureFindUnique.mockResolvedValueOnce(null);
      await expect(isFeatureEnabled("ws-1", "agency_layer")).resolves.toBe(false);
    });
  });

  describe("listWorkspaceFeatures", () => {
    it("fills every known key, defaulting absent ones to false", async () => {
      featureFindMany.mockResolvedValueOnce([{ key: "agency_layer", enabled: true }]);
      await expect(listWorkspaceFeatures("ws-1")).resolves.toEqual({
        agency_layer: true,
        client_mode: false,
      });
    });

    it("ignores unknown keys lingering in the table", async () => {
      featureFindMany.mockResolvedValueOnce([
        { key: "agency_layer", enabled: true },
        { key: "legacy_dead_flag", enabled: true },
      ]);
      const map = await listWorkspaceFeatures("ws-1");
      expect(map).toEqual({ agency_layer: true, client_mode: false });
      expect("legacy_dead_flag" in map).toBe(false);
    });
  });

  describe("setFeature", () => {
    it("upserts the flag (create + update branches covered)", async () => {
      featureUpsert.mockResolvedValueOnce({});
      await setFeature("ws-1", "client_mode", true);
      expect(featureUpsert).toHaveBeenCalledWith({
        where: { workspaceId_key: { workspaceId: "ws-1", key: "client_mode" } },
        create: { workspaceId: "ws-1", key: "client_mode", enabled: true },
        update: { enabled: true },
      });
    });
  });
});

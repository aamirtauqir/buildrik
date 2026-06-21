/**
 * collapseEntries — folds consecutive identical activity rows into one + count.
 * Recovery Phase 2: the dashboard feed read as a wall of repeated
 * "Saqib Updated 2 settings" rows; this collapses runs of identical entries.
 */

import { describe, it, expect } from "vitest";
import type { ActivityEntry } from "@buildrik/shared/schemas/dashboard";
import { collapseEntries } from "../activity-feed";

function entry(over: Partial<ActivityEntry>): ActivityEntry {
  return {
    id: Math.random().toString(36).slice(2),
    action: "settings.update",
    actorName: "Saqib",
    actorAvatar: null,
    description: "Updated 2 settings",
    siteId: null,
    createdAt: new Date(0),
    ...over,
  };
}

describe("collapseEntries", () => {
  it("folds consecutive identical entries into one row with a count", () => {
    const result = collapseEntries([entry({}), entry({}), entry({})]);
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(3);
  });

  it("keeps distinct descriptions as separate rows", () => {
    const result = collapseEntries([
      entry({ description: "Updated 2 settings" }),
      entry({ description: "Published site" }),
    ]);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.count)).toEqual([1, 1]);
  });

  it("does not merge across different actors", () => {
    const result = collapseEntries([
      entry({ actorName: "Saqib" }),
      entry({ actorName: "Ali" }),
    ]);
    expect(result).toHaveLength(2);
  });

  it("only collapses CONSECUTIVE runs, not all matches", () => {
    const result = collapseEntries([
      entry({ description: "A" }),
      entry({ description: "B" }),
      entry({ description: "A" }),
    ]);
    expect(result).toHaveLength(3);
  });

  it("falls back to action when description is null", () => {
    const result = collapseEntries([
      entry({ description: null, action: "site.create" }),
      entry({ description: null, action: "site.create" }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(2);
  });
});

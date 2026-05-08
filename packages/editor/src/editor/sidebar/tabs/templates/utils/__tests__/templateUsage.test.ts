import { describe, it, expect } from "vitest";
import { getTemplateUsageMap } from "../templateUsage";

function makeComposer(pages: any[]) {
  return { elements: { getAllPages: () => pages } } as any;
}

describe("getTemplateUsageMap", () => {
  it("returns an empty map when composer is null", () => {
    const map = getTemplateUsageMap(null);
    expect(map.size).toBe(0);
  });

  it("returns an empty map when no pages have appliedTemplates", () => {
    const map = getTemplateUsageMap(makeComposer([{ id: "p1", name: "Home" }]));
    expect(map.size).toBe(0);
  });

  it("groups one entry per (template, page)", () => {
    const map = getTemplateUsageMap(
      makeComposer([
        {
          id: "p1",
          name: "Home",
          meta: {
            appliedTemplates: [{ templateId: "t1", appliedAt: "2026-05-08T10:00:00Z" }],
          },
        },
        {
          id: "p2",
          name: "About",
          meta: {
            appliedTemplates: [{ templateId: "t1", appliedAt: "2026-05-08T11:00:00Z", version: "1.2.0" }],
          },
        },
      ])
    );
    expect(map.size).toBe(1);
    const t1 = map.get("t1");
    expect(t1).toHaveLength(2);
    expect(t1?.[0].pageId).toBe("p1");
    expect(t1?.[1].version).toBe("1.2.0");
  });

  it("de-dupes a template applied to the same page twice (first occurrence wins)", () => {
    const map = getTemplateUsageMap(
      makeComposer([
        {
          id: "p1",
          name: "Home",
          meta: {
            appliedTemplates: [
              { templateId: "t1", appliedAt: "2026-05-08T10:00:00Z" },
              { templateId: "t1", appliedAt: "2026-05-08T11:00:00Z" }, // ignored
            ],
          },
        },
      ])
    );
    expect(map.get("t1")).toHaveLength(1);
    expect(map.get("t1")?.[0].appliedAt).toBe("2026-05-08T10:00:00Z");
  });

  it("falls back to '(untitled)' when page name is missing", () => {
    const map = getTemplateUsageMap(
      makeComposer([
        {
          id: "p1",
          meta: { appliedTemplates: [{ templateId: "t1", appliedAt: "2026-05-08T10:00:00Z" }] },
        },
      ])
    );
    expect(map.get("t1")?.[0].pageName).toBe("(untitled)");
  });

  it("handles multiple distinct templates across pages", () => {
    const map = getTemplateUsageMap(
      makeComposer([
        {
          id: "p1",
          name: "Home",
          meta: { appliedTemplates: [{ templateId: "t1", appliedAt: "2026-05-08T10:00:00Z" }] },
        },
        {
          id: "p2",
          name: "About",
          meta: { appliedTemplates: [{ templateId: "t2", appliedAt: "2026-05-08T11:00:00Z" }] },
        },
      ])
    );
    expect(map.size).toBe(2);
    expect(map.get("t1")).toHaveLength(1);
    expect(map.get("t2")).toHaveLength(1);
  });
});

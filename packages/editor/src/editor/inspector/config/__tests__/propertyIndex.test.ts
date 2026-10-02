/**
 * G2-146 (owner 2026-09-25): ⌘K "Jump to property" rows come from the
 * inspector's own section registry + the type's capabilities — no hand list.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { buildPropertyIndex } from "../propertyIndex";
import { SECTION_REGISTRY } from "../../sections/registry";

const find = (type: string, label: string) => buildPropertyIndex(type).filter((r) => r.label === label);

describe("buildPropertyIndex", () => {
  it("a section whose title is its property is one row on its tab: Opacity · Effects", () => {
    expect(find("container", "Opacity")).toEqual([
      expect.objectContaining({ label: "Opacity", path: "Effects", section: "opacity", tab: "effects" }),
    ]);
  });

  it("a property row names tab › section: Padding · Style › Spacing", () => {
    expect(find("container", "Padding")[0]).toEqual(
      expect.objectContaining({ path: "Style › Spacing", section: "spacing", tab: "style", property: "padding" }),
    );
  });

  it("every section the type can show has a row, titled from the registry", () => {
    const rows = buildPropertyIndex("container");
    for (const r of rows.filter((x) => !x.property)) expect(r.label).toBe(SECTION_REGISTRY[r.section].title);
    /* Q1: Interactions lives on Behaviour now. */
    expect(rows.some((r) => r.label === "Interactions" && r.tab === "behaviour")).toBe(true);
  });

  it("labels are unique and carry no custom properties", () => {
    const labels = buildPropertyIndex("container").map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels.some((l) => l.startsWith("-"))).toBe(false);
  });

  it("follows the type's capabilities — a Collection list offers Collection, not CMS binding", () => {
    expect(find("collection-list", "Collection")).toHaveLength(1);
    expect(find("collection-list", "CMS binding")).toHaveLength(0);
    expect(find("heading", "CMS binding")).toHaveLength(1);
  });
});

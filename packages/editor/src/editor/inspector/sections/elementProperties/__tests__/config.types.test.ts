/**
 * elementProperties/config — per-type field-shape assertions for the richer
 * element types (input, video, select, columns, icon).
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { getPropertiesForType, ELEMENT_PROPERTIES } from "../config";

describe("config — input types", () => {
  it("declares all 16 input type options", () => {
    const type = ELEMENT_PROPERTIES.input.find((p) => p.id === "type");
    expect(type?.options).toHaveLength(16);
    expect(type?.options?.map((o) => o.value)).toContain("datetime-local");
  });
});

describe("config — video booleans", () => {
  it("declares exactly five checkbox flags", () => {
    const checkboxes = ELEMENT_PROPERTIES.video.filter((p) => p.type === "checkbox");
    expect(checkboxes.map((p) => p.id)).toEqual([
      "autoplay",
      "loop",
      "muted",
      "controls",
      "playsinline",
    ]);
  });
});

describe("config — select / columns / icon", () => {
  it("select exposes an options textarea", () => {
    const options = ELEMENT_PROPERTIES.select.find((p) => p.id === "options");
    expect(options?.type).toBe("textarea");
  });

  it("columns exposes 2–6 column-count choices and a gap select", () => {
    const count = ELEMENT_PROPERTIES.columns.find((p) => p.id === "data-columns");
    expect(count?.options?.map((o) => o.value)).toEqual(["2", "3", "4", "5", "6"]);
    const gap = ELEMENT_PROPERTIES.columns.find((p) => p.id === "data-gap");
    expect(gap?.type).toBe("select");
  });

  it("icon leads with a data-icon-size select of six sizes", () => {
    const props = getPropertiesForType("icon");
    expect(props[0].id).toBe("data-icon-size");
    expect(props[0].options).toHaveLength(6);
  });
});

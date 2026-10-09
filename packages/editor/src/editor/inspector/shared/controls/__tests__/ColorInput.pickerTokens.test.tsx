/**
 * @vitest-environment jsdom
 */
/**
 * L4-025: the Fill picker listed ~45 rows — the semantic Brand colours plus
 * the internal `custom-color-*` primitives and retired (`replacedBy`) tokens,
 * so names showed twice and users could bind to a primitive that a Brand
 * change never reaches. The picker lists the Brand page's own set.
 *
 * @license BSD-3-Clause
 */
import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ColorInput } from "../ColorInput";

const token = (id: string, name: string, layer: string, extra: Record<string, unknown> = {}) => ({
  id,
  name,
  kind: "color",
  layer,
  modes: { light: { value: "#1A56DB" } },
  category: "colors",
  type: "color",
  cssVar: `--buildrick-design-${id}`,
  ...extra,
});

vi.mock("../../../../design-system/state/TokenRegistryContext", () => ({
  useColorRegistry: () => ({
    tokens: [
      token("color-primary", "Primary", "semantic"),
      token("custom-color-primary", "Primary", "primitive"),
      token("color-old", "Old accent", "semantic", { replacedBy: "color-primary" }),
      token("color-surface", "Surface", "semantic"),
    ],
  }),
}));

describe("ColorInput · the Brand colours picker (L4-025)", () => {
  it("lists only live semantic colours, once each", () => {
    render(<ColorInput label="Fill" value="#ffffff" onChange={() => {}} composer={{ emit: vi.fn() } as never} />);
    fireEvent.click(screen.getByRole("button", { name: "Choose Fill color" }));
    const list = screen.getByRole("list", { name: "Brand colours" });
    const rows = within(list).getAllByRole("listitem").map((li) => li.textContent ?? "");
    expect(rows).toHaveLength(2);
    expect(rows.some((r) => r.includes("Primary"))).toBe(true);
    expect(rows.some((r) => r.includes("Surface"))).toBe(true);
    expect(rows.some((r) => r.includes("Old accent"))).toBe(false);
  });
});

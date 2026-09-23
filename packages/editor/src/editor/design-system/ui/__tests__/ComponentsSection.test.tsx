/**
 * ComponentsSection — Brand › Component styles, board 7316:82755 (C1 (ii)).
 *
 * One card, a row per catalogue component ("Default appearance · N variants"),
 * then the saved components. The AI action moved to the workspace header —
 * its tests are in BrandWorkspace.pages.test.tsx.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import * as React from "react";
import { ComponentsSection } from "../sections/ComponentsSection";
import { CATALOG } from "../../../components-catalog/catalog";

beforeEach(() => {
  localStorage.clear();
});

describe("ComponentsSection — the Component styles card", () => {
  it("renders a row per CATALOG entry inside one card", () => {
    const { getByTestId } = render(<ComponentsSection composer={null} />);
    const card = getByTestId("brand-components-list");
    expect(card.querySelectorAll("[data-catalog-card]").length).toBe(CATALOG.length);
  });

  it("each row names the component over 'Default appearance · N variants'", () => {
    const { getByTestId } = render(<ComponentsSection composer={null} />);
    const first = CATALOG[0];
    expect(getByTestId(`brand-comp-label-${first.id}`).textContent).toBe(first.name);
    expect(getByTestId(`brand-comp-meta-${first.id}`).textContent).toMatch(/^Default appearance · \d+ variants?$/);
  });

  it("counts instances in use when the composer reports them", () => {
    const composer = {
      components: {
        getAllComponents: () => [],
        getInstancesOfComponent: (id: string) => (id === CATALOG[0].id ? [1, 2] : []),
      },
    } as never;
    const { getByTestId } = render(<ComponentsSection composer={composer} />);
    expect(getByTestId(`brand-comp-meta-${CATALOG[0].id}`).textContent).toMatch(/· 2 in use$/);
  });

  it("lists saved components in the same card", () => {
    const composer = {
      components: {
        getAllComponents: () => [{ id: "cmp-1", name: "Menu card" }],
        getInstancesOfComponent: () => [1],
      },
    } as never;
    const { container } = render(<ComponentsSection composer={composer} />);
    const saved = container.querySelector('[data-saved-card="cmp-1"]');
    expect(saved?.textContent).toMatch(/Menu card/);
    expect(saved?.textContent).toMatch(/Saved component · 1 instance$/);
  });

  it("draws none of the drawer's furniture: no pinned AI strip, no read-only callout, no dead row buttons", () => {
    const { container } = render(<ComponentsSection composer={null} />);
    expect(container.querySelector("[data-ai-assist-cta]")).toBeNull();
    expect(container.querySelector("[data-readonly-footer]")).toBeNull();
    expect(container.querySelector("button")).toBeNull();
  });
});

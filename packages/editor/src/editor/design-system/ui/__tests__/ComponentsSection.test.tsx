/**
 * ComponentsSection (Arc D2) — read-only summary tests per prototype s04.
 *
 * Replaces Arc B2 functional-catalog tests. Asserts the summary shape:
 * catalog header line, catalog card grid with variant/instance text,
 * AI-assist CTA + button, saved-components subheader, and "Read-only by
 * design" footer. Also verifies the Open Components panel jump CTA
 * emits the `buildrik:openRailTab` window event and the Open AI-assist
 * button invokes the parent callback.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { ComponentsSection } from "../sections/ComponentsSection";
import { CATALOG } from "../../../components-catalog/catalog";

beforeEach(() => {
  localStorage.clear();
});

describe("ComponentsSection (Arc D2) — read-only summary", () => {
  it("renders the catalog header with shipped component count", () => {
    const { getByText } = render(<ComponentsSection composer={null} />);
    expect(
      getByText(`Catalog · ${CATALOG.length} polished components shipped`)
    ).toBeTruthy();
  });

  it("renders a catalog card per CATALOG entry with variant + instance text", () => {
    const { container } = render(<ComponentsSection composer={null} />);
    const cards = container.querySelectorAll("[data-catalog-card]");
    expect(cards.length).toBe(CATALOG.length);
    // First card should expose name + "N variants · M instances" text.
    const first = cards[0];
    expect(first.textContent).toMatch(CATALOG[0].name);
    expect(first.textContent).toMatch(/\d+ variants? · \d+ instances?/);
  });

  it("renders the + Add via AI-assist CTA and Open AI-assist button", () => {
    const { container } = render(<ComponentsSection composer={null} />);
    expect(container.querySelector("[data-ai-assist-cta]")?.textContent).toMatch(
      /\+ Add via AI-assist/
    );
    expect(container.querySelector("[data-open-ai-assist]")).toBeTruthy();
  });

  it("Open AI-assist click invokes onOpenAIAssist callback", () => {
    const onOpen = vi.fn();
    const { container } = render(
      <ComponentsSection composer={null} onOpenAIAssist={onOpen} />
    );
    const btn = container.querySelector("[data-open-ai-assist]") as HTMLButtonElement;
    fireEvent.click(btn);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("renders the 'Your saved components · N' subheader", () => {
    const { container } = render(<ComponentsSection composer={null} />);
    const header = container.querySelector("[data-saved-header]");
    expect(header).toBeTruthy();
    expect(header?.textContent).toMatch(/Your saved components · 0/);
  });

  it("renders the empty-state when there are no saved components", () => {
    const { container } = render(<ComponentsSection composer={null} />);
    const empty = container.querySelector("[data-saved-empty]");
    expect(empty).toBeTruthy();
    expect(empty?.textContent).toMatch(/No saved components yet/);
  });

  it("renders the 'Read-only by design' footer callout", () => {
    const { container } = render(<ComponentsSection composer={null} />);
    const footer = container.querySelector("[data-readonly-footer]");
    expect(footer).toBeTruthy();
    expect(footer?.textContent).toMatch(/Read-only by design/);
  });

  it("Open Components panel button emits ui:switch-tab on composer", () => {
    const emit = vi.fn();
    const composer = { emit } as unknown as Parameters<typeof ComponentsSection>[0]["composer"];
    const { container } = render(<ComponentsSection composer={composer} />);
    const btn = container.querySelector(
      "[data-open-components-panel]"
    ) as HTMLButtonElement;
    fireEvent.click(btn);
    expect(emit).toHaveBeenCalledWith("ui:switch-tab", { tab: "components" });
  });

  it("Open Components panel button is a safe no-op when composer is null", () => {
    const { container } = render(<ComponentsSection composer={null} />);
    const btn = container.querySelector(
      "[data-open-components-panel]"
    ) as HTMLButtonElement;
    // Smoke — must not throw.
    fireEvent.click(btn);
    expect(btn).toBeTruthy();
  });
});

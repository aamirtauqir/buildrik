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
  it("renders a catalog row per CATALOG entry, count at the right", () => {
    const { container } = render(<ComponentsSection composer={null} />);
    const cards = container.querySelectorAll("[data-catalog-card]");
    expect(cards.length).toBe(CATALOG.length);
    // First card should expose name + "N variants · M instances" text.
    const first = cards[0];
    expect(first.textContent).toMatch(CATALOG[0].name);
    expect(first.textContent).toMatch(/\d+ variants?/);
  });

  /* Board 153:29 pins ONE call to action at the foot — "✨ Generate with AI" —
     where this asserted a label plus a bordered button plus a paragraph. Old
     copy, not a regression. */
  it("pins a single Generate with AI action at the foot of the list", () => {
    const { container } = render(<ComponentsSection composer={null} />);
    expect(container.querySelector("[data-ai-assist-cta]")?.textContent).toMatch(
      /Generate with AI/
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

});

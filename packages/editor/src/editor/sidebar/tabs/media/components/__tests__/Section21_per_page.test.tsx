/**
 * §21 ReplaceAcrossDialog — the drawer's Replace across site.
 *
 * The PICKER half is V1 board 1164:4738 (the Clone does not re-draw it): a
 * per-page list with checkboxes, all pages checked by default, a live count,
 * and a commit through `composer.mediaOps.replaceAcrossSelective` with the
 * checked page ids only. The RESULT half is the Clone's `ReplaceResultModal`
 * (3695:43897 Replacing image → 3695:43900 Replacement complete / 3695:43903
 * Some uses could not update → 3695:43906 Retrying failed use); V1 board
 * 1174:4849's states are displaced.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { act, render, fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { ReplaceAcrossDialog } from "../ReplaceAcrossDialog";
import type { Composer } from "@/engine";
import type { ReplaceAcrossResult } from "@/engine/media/MediaCommandLayer";
import { makeSitePages } from "@/editor/media/__tests__/libraryFixture";

const CLEAN: ReplaceAcrossResult = { replaced: [], failed: [], clean: true };

/** Home ×2 · About ×1 use old.png; Contact uses nothing. */
function makeComposer({
  onSelective,
  onRetry,
}: {
  onSelective?: (oldSrc: string, newSrc: string, pageIds: ReadonlyArray<string>) => ReplaceAcrossResult;
  onRetry?: () => ReplaceAcrossResult;
} = {}): Composer {
  const elements = makeSitePages([
    {
      id: "p1",
      name: "Home",
      elements: [
        { id: "e1", src: "old.png", name: "Hero" },
        { id: "e2", src: "old.png", name: "Gallery" },
      ],
    },
    { id: "p2", name: "About", elements: [{ id: "e3", src: "old.png", name: "Team photo" }] },
    { id: "p3", name: "Contact", elements: [] },
  ]);
  const usagesByPage = new Map<string, unknown[]>();
  for (const page of elements.getAllPages()) {
    const hits = elements.findByMediaSrc("old.png").filter((el) => el.getParent()?.getId() === page.root.id);
    if (hits.length) usagesByPage.set(page.id, hits);
  }
  return {
    elements,
    mediaOps: {
      getUsages: () => ({ count: elements.findByMediaSrc("old.png").length, elements: [] }),
      getUsagesByPage: () => usagesByPage,
      replaceAcross: vi.fn(onRetry ?? (() => CLEAN)),
      replaceAcrossSelective: vi.fn(onSelective ?? (() => CLEAN)),
    },
  } as unknown as Composer;
}

function mount(composer = makeComposer(), onClose = vi.fn()) {
  render(<ReplaceAcrossDialog composer={composer} oldSrc="old.png" newSrc="new.png" onClose={onClose} />);
  return { composer, onClose };
}

const flush = () => act(async () => {});

describe("§21 — per-page replace selection (board 1164:4738)", () => {
  it("renders per-page list with use counts", () => {
    mount();
    expect(screen.getByTestId("rx-pages-list")).toBeInTheDocument();
    expect(screen.getByText(/Home/)).toBeInTheDocument();
    expect(screen.getByText("2 uses")).toBeInTheDocument();
    expect(screen.getByText(/About/)).toBeInTheDocument();
    expect(screen.getByText("1 use")).toBeInTheDocument();
    expect(screen.queryByText(/Contact/)).toBeNull();
  });

  it("defaults all pages checked + Commit button shows total", () => {
    mount();
    const cb1 = screen.getByTestId("rx-page-p1") as HTMLInputElement;
    const cb2 = screen.getByTestId("rx-page-p2") as HTMLInputElement;
    expect(cb1.checked).toBe(true);
    expect(cb2.checked).toBe(true);
    expect(screen.getByRole("button", { name: /Replace 3 uses on 2 pages/i })).toBeInTheDocument();
  });

  it("toggling a page updates live count", () => {
    mount();
    fireEvent.click(screen.getByTestId("rx-page-p2"));
    expect(screen.getByRole("button", { name: /Replace 2 uses on 1 page/i })).toBeInTheDocument();
  });

  it("commit fires replaceAcrossSelective with selected page ids only", async () => {
    const { composer } = mount();
    fireEvent.click(screen.getByTestId("rx-page-p2")); // uncheck About
    fireEvent.click(screen.getByRole("button", { name: /Replace 2 uses on 1 page/i }));
    await flush();
    expect(composer.mediaOps.replaceAcrossSelective).toHaveBeenCalledWith("old.png", "new.png", ["p1"]);
  });

  it("commit button disabled when no pages selected", () => {
    mount();
    fireEvent.click(screen.getByTestId("rx-page-p1"));
    fireEvent.click(screen.getByTestId("rx-page-p2"));
    const btn = screen.getByRole("button", { name: /Replace 0 uses on 0 pages/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("shows empty state when asset not used on any page", () => {
    const composer = makeComposer();
    (composer.mediaOps.getUsagesByPage as unknown as () => Map<string, unknown[]>) = () => new Map();
    mount(composer);
    expect(screen.getByText(/not used on any page/i)).toBeInTheDocument();
  });
});

describe("Clone 3695:43897 → 3695:43900 · the drawer's commit reports in the result card", () => {
  it("the V1 card gives way to Replacing image while the engine runs, then Replacement complete per page; Done closes", async () => {
    const onSelective = vi.fn(() => ({
      replaced: [
        { elementId: "e1", previousSrc: "old.png" },
        { elementId: "e2", previousSrc: "old.png" },
        { elementId: "e3", previousSrc: "old.png" },
      ],
      failed: [],
      clean: true,
    }));
    const { onClose } = mount(makeComposer({ onSelective }));
    fireEvent.click(screen.getByRole("button", { name: /Replace 3 uses on 2 pages/i }));
    /* The busy card stands on its own — no V1 frame under it. */
    expect(screen.queryByTestId("rx-dialog")).toBeNull();
    expect(screen.getByTestId("rx-result-title")).toHaveTextContent("Replacing image");
    expect(screen.getByTestId("rx-result-busy")).toHaveTextContent("Updating 3 uses across Home and About. Please wait.");
    await flush();
    expect(screen.getByTestId("rx-result-title")).toHaveTextContent("Replacement complete");
    expect(screen.getByTestId("rx-result-count")).toHaveTextContent("3 of 3 uses updated");
    expect(screen.getByTestId("rx-result-pages")).toHaveTextContent("Home: 2 updated · About: 1 updated");
    expect(screen.getByTestId("rx-result-note")).toHaveTextContent("Other elements are unchanged.");
    fireEvent.click(screen.getByTestId("rx-result-done"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("3695:43903 → 3695:43906 · a partial commit names the failed placement; Retry runs the SAME page scope again and completes", async () => {
    const onSelective = vi
      .fn<(o: string, n: string, ids: ReadonlyArray<string>) => ReplaceAcrossResult>()
      .mockReturnValueOnce({
        replaced: [{ elementId: "e1", previousSrc: "old.png" }],
        failed: [{ elementId: "e2", error: "locked" }],
        clean: false,
      })
      .mockReturnValueOnce({ replaced: [{ elementId: "e2", previousSrc: "old.png" }], failed: [], clean: true });
    const { composer } = mount(makeComposer({ onSelective }));
    fireEvent.click(screen.getByTestId("rx-page-p2")); // Home only
    fireEvent.click(screen.getByRole("button", { name: /Replace 2 uses on 1 page/i }));
    await flush();
    expect(screen.getByTestId("rx-result-title")).toHaveTextContent("Some uses could not update");
    expect(screen.getByTestId("rx-result-count")).toHaveTextContent("1 updated · 1 failed");
    expect(screen.getByTestId("rx-result-pages")).toHaveTextContent("Home: 1 updated");
    expect(screen.getByTestId("rx-result-failed-0")).toHaveTextContent(
      "Home / Gallery: update could not be saved. The previous image remains.",
    );
    fireEvent.click(screen.getByTestId("rx-result-retry"));
    expect(screen.getByTestId("rx-result-title")).toHaveTextContent("Retrying failed use");
    await flush();
    /* The unchecked About page stays out of the retry — a whole-site
       `replaceAcross` would have swept it in. */
    expect(onSelective).toHaveBeenLastCalledWith("old.png", "new.png", ["p1"]);
    expect(composer.mediaOps.replaceAcross).not.toHaveBeenCalled();
    expect(screen.getByTestId("rx-result-title")).toHaveTextContent("Replacement complete");
    expect(screen.getByTestId("rx-result-count")).toHaveTextContent("2 of 2 uses updated");
    expect(screen.getByTestId("rx-result-pages")).toHaveTextContent("Home: 2 updated");
  });
});

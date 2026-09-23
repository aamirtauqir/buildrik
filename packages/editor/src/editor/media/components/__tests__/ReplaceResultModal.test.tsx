/**
 * ReplaceResultModal — Clone 3695:43897 "Replacing image" · 3695:43900
 * "Replacement complete" · 3695:43903 "Some uses could not update" ·
 * 3695:43906 "Retrying failed use", and the same card under P6-V's titles
 * (3720:43313 / 3720:43316 "Saved version applied" with View versions).
 *
 * Sample data ("3 uses on Home and Menu", "Hero image") is the SHAPE — the
 * lines are read from the engine's pages through `summarizeByPage`.
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import type { Composer } from "@/engine";
import { makeSitePages } from "../../__tests__/libraryFixture";
import { ReplaceResultModal, replacingLabel, resultIds, summarizeByPage } from "../ReplaceResultModal";

/** Home ×2 (hero, gallery) · Menu ×1 (Hero image) — the prototype's three uses. */
function site() {
  return makeSitePages([
    {
      id: "home",
      name: "Home",
      elements: [
        { id: "e1", src: "blob:hero", name: "Hero" },
        { id: "e2", src: "blob:hero" },
      ],
    },
    { id: "menu", name: "Menu", elements: [{ id: "e3", src: "blob:hero", name: "Hero image" }] },
    { id: "about", name: "About", elements: [{ id: "e9", src: "blob:other" }] },
  ]);
}

function composerWith(elements = site()) {
  return { elements } as unknown as Composer;
}

function mount(over: Partial<React.ComponentProps<typeof ReplaceResultModal>> = {}) {
  const props = {
    open: true,
    composer: composerWith(),
    title: "Replacement complete",
    replaced: ["e1", "e2", "e3"],
    failed: [] as string[],
    onDone: vi.fn(),
    ...over,
  };
  render(<ReplaceResultModal {...props} />);
  return props;
}

const flush = () => act(async () => {});

describe("summarizeByPage", () => {
  it("counts placements per page in the site's page order, whatever order the ids come in", () => {
    expect(summarizeByPage(composerWith(), ["e3", "e2", "e1"])).toEqual([
      { page: "Home", count: 2 },
      { page: "Menu", count: 1 },
    ]);
  });

  it("skips ids the pages cannot place and pages nothing landed on", () => {
    expect(summarizeByPage(composerWith(), ["e3", "ghost"])).toEqual([{ page: "Menu", count: 1 }]);
    expect(summarizeByPage(composerWith(), [])).toEqual([]);
  });

  it("resultIds maps the engine's result to ids; replacingLabel reads the board's progress line", () => {
    expect(
      resultIds({ replaced: [{ elementId: "e1", previousSrc: "x" }], failed: [{ elementId: "e3", error: "locked" }], clean: false }),
    ).toEqual({ replaced: ["e1"], failed: ["e3"] });
    expect(replacingLabel(composerWith(), ["e1", "e2", "e3"])).toBe("Updating 3 uses across Home and Menu. Please wait.");
    expect(replacingLabel(composerWith(), ["e3"])).toBe("Updating 1 use on Menu. Please wait.");
  });
});

describe("Clone 3695:43897 · Replacing image", () => {
  it("is a title and the caller's progress line, with no door to close", () => {
    mount({ replaced: [], busy: { label: "Updating 3 uses across Home and Menu. Please wait." } });
    expect(screen.getByTestId("rx-result-title")).toHaveTextContent("Replacing image");
    expect(screen.getByTestId("rx-result-busy")).toHaveTextContent("Updating 3 uses across Home and Menu. Please wait.");
    expect(screen.queryByTestId("rx-result-foot")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("3720:43313 · the caller may name the busy card (Applying saved version)", () => {
    mount({ replaced: [], busy: { title: "Applying saved version", label: "Applying to 3 uses…" } });
    expect(screen.getByTestId("rx-result-title")).toHaveTextContent("Applying saved version");
    expect(screen.getByTestId("rx-result-busy")).toHaveTextContent("Applying to 3 uses…");
  });
});

describe("Clone 3695:43900 · Replacement complete", () => {
  it("reads `3 of 3 uses updated` / per page / `Other elements are unchanged.` and Done closes", () => {
    const props = mount();
    expect(screen.getByTestId("rx-result-title")).toHaveTextContent("Replacement complete");
    expect(screen.getByTestId("rx-result-count")).toHaveTextContent("3 of 3 uses updated");
    expect(screen.getByTestId("rx-result-pages")).toHaveTextContent("Home: 2 updated · Menu: 1 updated");
    expect(screen.getByTestId("rx-result-note")).toHaveTextContent("Other elements are unchanged.");
    expect(screen.getAllByRole("button").map((b) => b.textContent?.trim())).toEqual(["Done"]);
    fireEvent.click(screen.getByTestId("rx-result-done"));
    expect(props.onDone).toHaveBeenCalledTimes(1);
  });

  it("one use reads in the singular", () => {
    mount({ replaced: ["e3"] });
    expect(screen.getByTestId("rx-result-count")).toHaveTextContent("1 of 1 use updated");
    expect(screen.getByTestId("rx-result-pages")).toHaveTextContent("Menu: 1 updated");
  });

  it("3720:43316 · Saved version applied carries View versions beside Done when the caller offers it", () => {
    const props = mount({ title: "Saved version applied", onViewVersions: vi.fn() });
    expect(screen.getByTestId("rx-result-title")).toHaveTextContent("Saved version applied");
    expect(screen.getAllByRole("button").map((b) => b.textContent?.trim())).toEqual(["Done", "View versions"]);
    fireEvent.click(screen.getByTestId("rx-result-versions"));
    expect(props.onViewVersions).toHaveBeenCalledTimes(1);
  });

  it("renders nothing while closed", () => {
    mount({ open: false });
    expect(screen.queryByTestId("rx-result")).toBeNull();
  });
});

describe("Clone 3695:43903 → 3695:43906 · Some uses could not update → Retry failed use", () => {
  it("counts updated · failed, lists the updated pages, names each failed placement, and offers Close · Retry failed use", () => {
    const props = mount({ replaced: ["e1", "e2"], failed: ["e3"], onRetry: vi.fn() });
    expect(screen.getByTestId("rx-result-title")).toHaveTextContent("Some uses could not update");
    expect(screen.getByTestId("rx-result-count")).toHaveTextContent("2 updated · 1 failed");
    expect(screen.getByTestId("rx-result-pages")).toHaveTextContent("Home: 2 updated");
    expect(screen.getByTestId("rx-result-failed-0")).toHaveTextContent(
      "Menu / Hero image: update could not be saved. The previous image remains.",
    );
    expect(screen.queryByTestId("rx-result-note")).toBeNull();
    expect(screen.getAllByRole("button").map((b) => b.textContent?.trim())).toEqual(["Close", "Retry failed use"]);
    fireEvent.click(screen.getByTestId("rx-result-close"));
    expect(props.onDone).toHaveBeenCalledTimes(1);
  });

  it("a placement without a name is called by its type label; nothing updated lists no pages line", () => {
    mount({ replaced: [], failed: ["e2"], onRetry: vi.fn() });
    expect(screen.getByTestId("rx-result-count")).toHaveTextContent("0 updated · 1 failed");
    expect(screen.queryByTestId("rx-result-pages")).toBeNull();
    expect(screen.getByTestId("rx-result-failed-0")).toHaveTextContent("Home / Image: update could not be saved.");
  });

  it("without a retry door the partial result offers Close only", () => {
    mount({ replaced: ["e1", "e2"], failed: ["e3"] });
    expect(screen.getAllByRole("button").map((b) => b.textContent?.trim())).toEqual(["Close"]);
  });

  it("Retry failed use runs only the failed ids, reads `Retrying …` meanwhile, and lands on Replacement complete with every use counted", async () => {
    let resolve!: (r: { replaced: string[]; failed: string[] }) => void;
    const onRetry = vi.fn(() => new Promise<{ replaced: string[]; failed: string[] }>((r) => (resolve = r)));
    const props = mount({ replaced: ["e1", "e2"], failed: ["e3"], onRetry });
    fireEvent.click(screen.getByTestId("rx-result-retry"));
    expect(onRetry).toHaveBeenCalledWith(["e3"]);
    expect(screen.getByTestId("rx-result-title")).toHaveTextContent("Retrying failed use");
    expect(screen.getByTestId("rx-result-busy")).toHaveTextContent(
      "Retrying Menu / Hero image only. The 2 successful updates will not be repeated.",
    );
    expect(screen.queryByRole("button")).toBeNull();
    await act(async () => {
      resolve({ replaced: ["e3"], failed: [] });
    });
    await flush();
    expect(screen.getByTestId("rx-result-title")).toHaveTextContent("Replacement complete");
    expect(screen.getByTestId("rx-result-count")).toHaveTextContent("3 of 3 uses updated");
    expect(screen.getByTestId("rx-result-pages")).toHaveTextContent("Home: 2 updated · Menu: 1 updated");
    fireEvent.click(screen.getByTestId("rx-result-done"));
    expect(props.onDone).toHaveBeenCalledTimes(1);
  });

  it("a retry that fails again is this dialog again, with the failed placement still named", async () => {
    const onRetry = vi.fn(() => Promise.resolve({ replaced: [], failed: ["e3"] }));
    mount({ replaced: ["e1", "e2"], failed: ["e3"], onRetry });
    fireEvent.click(screen.getByTestId("rx-result-retry"));
    await flush();
    expect(screen.getByTestId("rx-result-title")).toHaveTextContent("Some uses could not update");
    expect(screen.getByTestId("rx-result-count")).toHaveTextContent("2 updated · 1 failed");
    expect(screen.getByTestId("rx-result-failed-0")).toHaveTextContent("Menu / Hero image");
    expect(screen.getByTestId("rx-result-retry")).toBeInTheDocument();
  });
});

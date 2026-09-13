/**
 * The replace-across result dialog — Figma page "Editor v1 Clone",
 * 3695:43900 ("Replacement complete"), 3695:43903 ("Some uses could not
 * update"), 3695:43906 ("Retrying failed use"), and P6-V's 3720:43316
 * ("Saved version applied"), which is the same card under another title.
 *
 * P6-V's minimal build of P6-R's contract: `ReplaceResultModal` with a
 * `title` prop and the exported `summarizeByPage`. Main folds this into R's
 * component at merge; the contract is what these tests pin.
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { ReplaceResultModal, summarizeByPage } from "../ReplaceResultModal";

/* A two-page site: Home holds a hero and a card image, Menu one image. */
interface Node {
  id: string;
  parent: Node | null;
  name?: string;
  type: string;
  getId(): string;
  getParent(): Node | null;
  getAttribute(name: string): string | undefined;
  getType(): string;
}

function node(id: string, parent: Node | null, type = "image", name?: string): Node {
  return {
    id,
    parent,
    name,
    type,
    getId: () => id,
    getParent: () => parent,
    getAttribute: (attr: string) => (attr === "data-name" ? name : undefined),
    getType: () => type,
  };
}

function makeComposer() {
  const homeRoot = node("home-root", null, "section");
  const menuRoot = node("menu-root", null, "section");
  const homeHero = node("el-hero", node("home-section", homeRoot, "section"), "image", "Hero image");
  const homeCard = node("el-card", homeRoot, "image", "Card image");
  const menuImg = node("el-menu", menuRoot, "image", "Hero image");
  const orphan = node("el-orphan", null, "image");
  const all = new Map([homeHero, homeCard, menuImg, orphan].map((n) => [n.id, n]));
  return {
    elements: {
      getAllPages: () => [
        { id: "p-home", name: "Home", root: { id: "home-root" } },
        { id: "p-menu", name: "Menu", root: { id: "menu-root" } },
      ],
      getElement: (id: string) => all.get(id),
    },
  } as unknown as React.ComponentProps<typeof ReplaceResultModal>["composer"];
}

function mount(over: Partial<React.ComponentProps<typeof ReplaceResultModal>> = {}) {
  const props = {
    open: true,
    title: "Saved version applied",
    replaced: ["el-hero", "el-card", "el-menu"],
    failed: [] as string[],
    composer: makeComposer(),
    onDone: vi.fn(),
    ...over,
  };
  const utils = render(<ReplaceResultModal {...props} />);
  return { ...utils, props };
}

describe("summarizeByPage", () => {
  it("counts the elements per page, in page order, naming pages from the element's root", () => {
    expect(summarizeByPage(makeComposer(), ["el-menu", "el-hero", "el-card"])).toEqual([
      { page: "Home", count: 2 },
      { page: "Menu", count: 1 },
    ]);
  });

  it("skips an element that cannot be traced to a page, and ids that no longer exist", () => {
    expect(summarizeByPage(makeComposer(), ["el-orphan", "gone", "el-menu"])).toEqual([{ page: "Menu", count: 1 }]);
  });
});

describe("Clone 3720:43316 · Saved version applied (the result under P6-V's title)", () => {
  it("reads the title, '3 of 3 uses updated', the per-page line and the unchanged note", () => {
    mount();
    expect(screen.getByTestId("replace-result-title")).toHaveTextContent("Saved version applied");
    expect(screen.getByTestId("replace-result-count")).toHaveTextContent("3 of 3 uses updated");
    expect(screen.getByTestId("replace-result-pages")).toHaveTextContent("Home: 2 updated · Menu: 1 updated");
    expect(screen.getByTestId("replace-result-note")).toHaveTextContent("Other elements are unchanged.");
  });

  it("foots Done · View versions when a versions door is given; both fire", () => {
    const onViewVersions = vi.fn();
    const { props } = mount({ onViewVersions });
    const foot = within(screen.getByTestId("replace-result-foot"));
    expect(foot.getAllByRole("button").map((b) => b.textContent?.trim())).toEqual(["Done", "View versions"]);
    fireEvent.click(screen.getByTestId("replace-result-view-versions"));
    expect(onViewVersions).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId("replace-result-done"));
    expect(props.onDone).toHaveBeenCalledTimes(1);
  });

  it("without a versions door the foot is Done alone (3695:43900 Replacement complete)", () => {
    mount({ title: "Replacement complete" });
    expect(screen.getByTestId("replace-result-title")).toHaveTextContent("Replacement complete");
    expect(screen.queryByTestId("replace-result-view-versions")).toBeNull();
  });

  it("one use reads '1 of 1 use updated'", () => {
    mount({ replaced: ["el-menu"] });
    expect(screen.getByTestId("replace-result-count")).toHaveTextContent("1 of 1 use updated");
  });
});

describe("Clone 3695:43903 / 3695:43906 · Some uses could not update → Retrying failed use", () => {
  it("counts updated and failed, names each failed placement by page and element, and foots Close · Retry failed use", async () => {
    let finishRetry!: () => void;
    const onRetry = vi.fn(() => new Promise<void>((resolve) => (finishRetry = resolve)));
    const { props } = mount({ replaced: ["el-hero", "el-card"], failed: ["el-menu"], onRetry });
    expect(screen.getByTestId("replace-result-count")).toHaveTextContent("2 updated · 1 failed");
    expect(screen.getByTestId("replace-result-pages")).toHaveTextContent("Home: 2 updated");
    expect(screen.getByTestId("replace-result-failed-el-menu")).toHaveTextContent(
      "Menu / Hero image: update could not be saved. The previous image remains.",
    );
    expect(screen.queryByTestId("replace-result-note")).toBeNull();
    const foot = within(screen.getByTestId("replace-result-foot"));
    expect(foot.getAllByRole("button").map((b) => b.textContent?.trim())).toEqual(["Close", "Retry failed use"]);
    fireEvent.click(screen.getByTestId("replace-result-retry"));
    expect(onRetry).toHaveBeenCalledWith(["el-menu"]);
    expect(screen.getByTestId("replace-result-retrying")).toHaveTextContent("Retrying failed use…");
    await act(async () => finishRetry());
    expect(screen.queryByTestId("replace-result-retrying")).toBeNull();
    fireEvent.click(screen.getByTestId("replace-result-close"));
    expect(props.onDone).toHaveBeenCalledTimes(1);
  });

  it("two failures read plural on the button and the retry line", () => {
    mount({ replaced: ["el-hero"], failed: ["el-menu", "el-card"], onRetry: vi.fn(async () => {}) });
    expect(screen.getByTestId("replace-result-retry")).toHaveTextContent("Retry failed uses");
  });
});

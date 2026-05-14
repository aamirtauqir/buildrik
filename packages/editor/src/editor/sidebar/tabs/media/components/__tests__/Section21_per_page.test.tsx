/**
 * §21 ReplaceAcrossDialog per-page selection — Phase 12 Tasks 65-68.
 *
 * Asserts the preview phase renders a per-page list with checkboxes,
 * default-checks all pages, updates live count when toggled, and
 * commits via composer.mediaOps.replaceAcrossSelective with selected
 * page ids only.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { ReplaceAcrossDialog } from "../ReplaceAcrossDialog";
import type { Composer } from "../../../../../../engine/Composer";
import type { ReplaceAcrossResult } from "../../../../../../engine/media/MediaCommandLayer";

interface PageData {
  id: string;
  name: string;
}

function makeComposer({
  pages,
  usagesByPage,
  onSelective,
}: {
  pages: PageData[];
  usagesByPage: Map<string, unknown[]>;
  onSelective?: (
    oldSrc: string,
    newSrc: string,
    pageIds: ReadonlyArray<string>,
  ) => ReplaceAcrossResult;
}): Composer {
  const result: ReplaceAcrossResult = {
    replaced: [],
    failed: [],
    clean: true,
  };
  return {
    elements: {
      getAllPages: () => pages,
    },
    mediaOps: {
      getUsages: (_src: string) => ({
        count: Array.from(usagesByPage.values()).reduce(
          (acc, arr) => acc + arr.length,
          0,
        ),
        elements: [],
      }),
      getUsagesByPage: (_src: string) => usagesByPage,
      replaceAcross: vi.fn(() => result),
      replaceAcrossSelective: vi.fn(
        onSelective ?? ((..._args) => result),
      ),
    },
  } as unknown as Composer;
}

describe("§21 — per-page replace selection", () => {
  it("renders per-page list with use counts", () => {
    const composer = makeComposer({
      pages: [
        { id: "p1", name: "Home" },
        { id: "p2", name: "About" },
      ],
      usagesByPage: new Map([
        ["p1", [{}, {}]],
        ["p2", [{}]],
      ]),
    });
    render(
      <ReplaceAcrossDialog
        composer={composer}
        oldSrc="old.png"
        newSrc="new.png"
        onClose={() => {}}
      />,
    );
    const list = screen.getByTestId("rx-pages-list");
    expect(list).toBeInTheDocument();
    expect(screen.getByText(/Home/)).toBeInTheDocument();
    expect(screen.getByText("2 uses")).toBeInTheDocument();
    expect(screen.getByText(/About/)).toBeInTheDocument();
    expect(screen.getByText("1 use")).toBeInTheDocument();
  });

  it("defaults all pages checked + Commit button shows total", () => {
    const composer = makeComposer({
      pages: [
        { id: "p1", name: "Home" },
        { id: "p2", name: "About" },
      ],
      usagesByPage: new Map([
        ["p1", [{}, {}]],
        ["p2", [{}]],
      ]),
    });
    render(
      <ReplaceAcrossDialog
        composer={composer}
        oldSrc="old.png"
        newSrc="new.png"
        onClose={() => {}}
      />,
    );
    const cb1 = screen.getByTestId("rx-page-p1") as HTMLInputElement;
    const cb2 = screen.getByTestId("rx-page-p2") as HTMLInputElement;
    expect(cb1.checked).toBe(true);
    expect(cb2.checked).toBe(true);
    expect(
      screen.getByRole("button", { name: /Replace 3 uses on 2 pages/i }),
    ).toBeInTheDocument();
  });

  it("toggling a page updates live count", () => {
    const composer = makeComposer({
      pages: [
        { id: "p1", name: "Home" },
        { id: "p2", name: "About" },
      ],
      usagesByPage: new Map([
        ["p1", [{}, {}]],
        ["p2", [{}]],
      ]),
    });
    render(
      <ReplaceAcrossDialog
        composer={composer}
        oldSrc="old.png"
        newSrc="new.png"
        onClose={() => {}}
      />,
    );
    fireEvent.click(screen.getByTestId("rx-page-p2"));
    expect(
      screen.getByRole("button", { name: /Replace 2 uses on 1 page/i }),
    ).toBeInTheDocument();
  });

  it("commit fires replaceAcrossSelective with selected page ids only", async () => {
    const onSelective = vi.fn(() => ({
      replaced: [],
      failed: [],
      clean: true,
    })) as unknown as (
      o: string,
      n: string,
      ids: ReadonlyArray<string>,
    ) => ReplaceAcrossResult;
    const composer = makeComposer({
      pages: [
        { id: "p1", name: "Home" },
        { id: "p2", name: "About" },
      ],
      usagesByPage: new Map([
        ["p1", [{}, {}]],
        ["p2", [{}]],
      ]),
      onSelective,
    });
    render(
      <ReplaceAcrossDialog
        composer={composer}
        oldSrc="old.png"
        newSrc="new.png"
        onClose={() => {}}
      />,
    );
    fireEvent.click(screen.getByTestId("rx-page-p2")); // uncheck About
    fireEvent.click(
      screen.getByRole("button", { name: /Replace 2 uses on 1 page/i }),
    );
    // Allow promise microtask
    await Promise.resolve();
    await Promise.resolve();
    expect(onSelective).toHaveBeenCalledWith("old.png", "new.png", ["p1"]);
  });

  it("commit button disabled when no pages selected", () => {
    const composer = makeComposer({
      pages: [{ id: "p1", name: "Home" }],
      usagesByPage: new Map([["p1", [{}]]]),
    });
    render(
      <ReplaceAcrossDialog
        composer={composer}
        oldSrc="old.png"
        newSrc="new.png"
        onClose={() => {}}
      />,
    );
    fireEvent.click(screen.getByTestId("rx-page-p1"));
    const btn = screen.getByRole("button", {
      name: /Replace 0 uses on 0 pages/i,
    }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("shows empty state when asset not used on any page", () => {
    const composer = makeComposer({
      pages: [{ id: "p1", name: "Home" }],
      usagesByPage: new Map(),
    });
    render(
      <ReplaceAcrossDialog
        composer={composer}
        oldSrc="old.png"
        newSrc="new.png"
        onClose={() => {}}
      />,
    );
    expect(
      screen.getByText(/not used on any page/i),
    ).toBeInTheDocument();
  });
});

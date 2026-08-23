/**
 * editActions — copy/paste feedback + clipboard wiring test
 *
 * Recovery Phase 1 (feedback layer). Two things this locks in:
 *   1. Context-menu Copy populates `composer.clipboard` (the in-app clipboard
 *      the engine `paste` command reads), not only the OS clipboard. Without
 *      this, copy→paste from the right-click menu silently did nothing.
 *   2. Context-menu Paste reports its outcome: an info toast when there is
 *      nothing to paste, a success toast after a real paste — and it runs the
 *      real engine `paste` command instead of emitting a dead event.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Composer } from "../../../../../engine/Composer";
import type { Element } from "../../../../../engine/elements/Element";
import type { ElementData } from "../../../../../shared/types";
import { editSubmenu } from "../editActions";

type Ctx = Parameters<NonNullable<(typeof editSubmenu)[number]["handler"]>>[0];

function buildMockComposer() {
  return {
    clipboard: null as ElementData | null,
    commands: { run: vi.fn() },
    history: { undo: vi.fn() },
    selection: { select: vi.fn() },
    elements: { removeElement: vi.fn() },
    emit: vi.fn(),
  } as unknown as Composer;
}

const sampleData = { type: "heading", props: {} } as unknown as ElementData;

function buildMockElement() {
  return {
    getData: vi.fn(() => sampleData),
    getId: vi.fn(() => "el-1"),
    getType: vi.fn(() => "heading"),
    getChildren: vi.fn(() => []),
  } as unknown as Element;
}

describe("editActions — copy populates the in-app clipboard", () => {
  let composer: Composer;

  beforeEach(() => {
    composer = buildMockComposer();
  });

  it("copy sets composer.clipboard from element.getData()", () => {
    const copy = editSubmenu.find((a) => a.id === "copy");
    expect(copy).toBeDefined();

    copy!.handler!({
      composer,
      element: buildMockElement(),
      isRoot: false,
      addToast: vi.fn(),
    } as Ctx);

    expect(composer.clipboard).toEqual([sampleData]);
  });
});

describe("editActions — paste reports its outcome", () => {
  let composer: Composer;
  let addToast: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    composer = buildMockComposer();
    addToast = vi.fn();
  });

  it("with an empty clipboard: info toast, and the paste command does NOT run", () => {
    composer.clipboard = null;
    const paste = editSubmenu.find((a) => a.id === "paste");

    paste!.handler!({
      composer,
      element: buildMockElement(),
      isRoot: false,
      addToast,
    } as Ctx);

    expect(composer.commands.run).not.toHaveBeenCalled();
    expect(addToast).toHaveBeenCalledTimes(1);
    expect(addToast.mock.calls[0][0]).toMatchObject({ tone: "info" });
  });

  it("with a populated clipboard: runs the engine paste command and toasts success", () => {
    composer.clipboard = [sampleData];
    const paste = editSubmenu.find((a) => a.id === "paste");

    paste!.handler!({
      composer,
      element: buildMockElement(),
      isRoot: false,
      addToast,
    } as Ctx);

    expect(composer.commands.run).toHaveBeenCalledWith("paste");
    expect(addToast).toHaveBeenCalledTimes(1);
    expect(addToast.mock.calls[0][0]).toMatchObject({ tone: "success" });
  });
});

/**
 * editActions — copy/paste feedback + clipboard wiring test
 *
 * Recovery Phase 1 (feedback layer). Two things this locks in:
 *   1. Context-menu Copy is the engine `copy` command (the in-app clipboard
 *      the engine `paste` command reads), the same action as ⌘C.
 *   2. Context-menu Paste reports its outcome: an info toast when there is
 *      nothing to paste, a success toast after a real paste — and it runs the
 *      real engine `paste` command instead of emitting a dead event.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Composer } from "@/engine/Composer";
import type { Element } from "@/engine/elements/Element";
import type { ElementData } from "@/shared/types";
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

/* Audit 2026-10-08 P1-4: the row used to write `[element.getData()]` itself —
   one element out of a multi-selection, with getData()'s stale children, and
   its own toast. It is now the engine `copy` (⌘C): whole selection, pruned,
   serialised fresh, CLIPBOARD_COPY → useClipboardToasts. */
describe("editActions — copy runs the engine command", () => {
  let composer: Composer;

  beforeEach(() => {
    composer = buildMockComposer();
  });

  it("copy runs composer.commands.run('copy') and writes no clipboard or toast itself", () => {
    const copy = editSubmenu.find((a) => a.id === "copy");
    expect(copy).toBeDefined();
    const element = buildMockElement();
    const addToast = vi.fn();

    copy!.handler!({ composer, element, isRoot: false, addToast } as Ctx);

    expect(composer.commands.run).toHaveBeenCalledWith("copy");
    expect(element.getData).not.toHaveBeenCalled();
    expect(composer.clipboard).toBeNull();
    expect(addToast).not.toHaveBeenCalled();
  });
});

/* L1-018: Paste was enabled with an empty clipboard. */
describe("editActions — paste is disabled with nothing to paste", () => {
  it("isEnabled follows the in-app clipboard", () => {
    const paste = editSubmenu.find((a) => a.id === "paste")!;
    expect(paste.isEnabled?.({ composer: { clipboard: [] } } as never)).toBe(false);
    expect(paste.isEnabled?.({ composer: { clipboard: [{ id: "x" }] } } as never)).toBe(true);
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

  /* Rewritten 2026-08-23. It asserted a success toast from this handler, which
     is a double: useClipboardToasts already speaks for CLIPBOARD_PASTE, and a
     paste can place N elements — so right-click Paste showed a collapsed
     "3 elements pasted" AND a plain "Pasted" on top. The empty-clipboard toast
     above stays: no command runs in that case, so nothing else would speak. */
  it("with a populated clipboard: runs the engine paste command and leaves the toast to the hook", () => {
    composer.clipboard = [sampleData];
    const paste = editSubmenu.find((a) => a.id === "paste");

    paste!.handler!({
      composer,
      element: buildMockElement(),
      isRoot: false,
      addToast,
    } as Ctx);

    expect(composer.commands.run).toHaveBeenCalledWith("paste");
    expect(addToast).not.toHaveBeenCalled();
  });
});

/* G2-051 (CI-13): menu Delete is the engine delete — whole selection, one
   transaction, #17's confirm for N > 1, one toast from useHistoryFeedback. */
describe("editActions — delete runs the engine command", () => {
  it("delete runs composer.commands.run('delete') and removes nothing itself", () => {
    const run = vi.fn();
    const removeElement = vi.fn();
    const del = editSubmenu.find((a) => a.id === "delete")!;
    del.handler!({
      composer: { commands: { run }, elements: { removeElement } } as never,
      element: {} as never,
      isRoot: false,
    });
    expect(run).toHaveBeenCalledWith("delete");
    expect(removeElement).not.toHaveBeenCalled();
  });
});

/* (follow-up to A-5): this row used to call
   composer.elements.removeElement directly, bypassing the engine `cut`
   command's lock/instance filter entirely — a right-click Cut on a locked
   element removed it anyway. It's now routed through commands.run("cut"),
   the same command Delete's row already used, which applies the filter,
   sets composer.clipboard from the whole selection, and emits CLIPBOARD_CUT
   (useClipboardToasts turns that into the "N cut" + Undo toast). */
describe("editActions — cut routes through the engine cut command", () => {
  it("runs composer.commands.run('cut') and does not call removeElement directly", () => {
    const composer = buildMockComposer();
    const cut = editSubmenu.find((a) => a.id === "cut");
    expect(cut).toBeDefined();

    cut!.handler!({
      composer,
      element: buildMockElement(),
      isRoot: false,
      addToast: vi.fn(),
    } as Ctx);

    expect(composer.commands.run).toHaveBeenCalledWith("cut");
    expect(composer.elements.removeElement).not.toHaveBeenCalled();
  });

  it("still writes the element's data to the OS clipboard", () => {
    const composer = buildMockComposer();
    const cut = editSubmenu.find((a) => a.id === "cut");
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    cut!.handler!({
      composer,
      element: buildMockElement(),
      isRoot: false,
      addToast: vi.fn(),
    } as Ctx);

    expect(writeText).toHaveBeenCalledWith(JSON.stringify(sampleData, null, 2));
  });
});


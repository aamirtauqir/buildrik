/**
 * BRD-24: ⌘Z inside Brand never reaches the canvas history.
 *
 * Measured 2026-10-05 on a site with 13 elements and one staged colour: one
 * ⌘Z discarded the staged edit AND undid the last canvas action (13 → 9, a
 * CTA block gone), all under the workspace where nothing showed it. The
 * shell's window keydown ran `composer.history.undo()`, and the
 * `history:undo` it emitted re-hydrated the registries over the draft.
 *
 * Real Composer, real history (flushed, so the canvas steps are on the undo
 * stack), the shell's real shortcut hook, the real workspace.
 *
 * @license BSD-3-Clause
 */
import { render, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import * as React from "react";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "@/engine/__tests__/test-utils/realComposer";
import { useEditorShortcuts } from "@/editor/shell/hooks/useEditorShortcuts";
import { BrandWorkspace } from "../BrandWorkspace";
import { SMALL_RADIUS_ID, installDomShims, openPage, wrap, type ComposerProp } from "./brandWorkspaceHarness";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);
beforeEach(installDomShims);

type RealComposer = ReturnType<typeof createTestComposer>;

const modals = { setShowShortcuts: () => {} };
const save = () => {};

function Shell({ composer, brandOpen }: { composer: RealComposer; brandOpen: boolean }) {
  useEditorShortcuts({ composer, modals, saveProject: save });
  return brandOpen ? <BrandWorkspace composer={composer as unknown as ComposerProp} /> : null;
}

/** A page with three blocks added as three separate, flushed history steps. */
function seededComposer() {
  const c = createTestComposer();
  const page = c.elements.getActivePage() ?? c.elements.createPage("Home");
  for (const content of ["Heading", "Body", "Call to action"]) {
    c.elements.addElement(c.elements.createElement("text", { content }), page.root.id);
    c.history.flushPending();
  }
  return c;
}

const count = (c: RealComposer) => c.elements.getAllElements().length;

function chord(target: EventTarget, init: KeyboardEventInit) {
  const e = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(e);
  return e;
}

/** Stage one radius edit on the card, the way a user does. */
async function stageRadiusEdit(utils: ReturnType<typeof render>) {
  openPage(utils, "kind-radius");
  const row = await waitFor(() => {
    const el = utils.container.querySelector<HTMLElement>(`[data-token-row="${SMALL_RADIUS_ID}"]`);
    if (!el) throw new Error(`${SMALL_RADIUS_ID} row not rendered`);
    return el;
  });
  fireEvent.click(row);
  fireEvent.click(utils.getByTestId("brand-token-action-replace"));
  const input = await waitFor(() => utils.getByLabelText("Value") as HTMLInputElement);
  fireEvent.change(input, { target: { value: "7px" } });
  fireEvent.blur(input);
  await waitFor(() => expect(document.querySelector('[data-screen-savebar="true"]')).toBeTruthy());
  return input;
}

describe("BRD-24 — ⌘Z while Brand is open", () => {
  it("control: with Brand closed the shell's ⌘Z undoes a canvas step", () => {
    const c = seededComposer();
    const before = count(c);
    render(wrap(<Shell composer={c} brandOpen={false} />));
    chord(document.body, { key: "z", metaKey: true });
    c.history.flushPending();
    expect(count(c)).toBe(before - 1);
  });

  it.each([
    ["⌘Z", { key: "z", metaKey: true }],
    ["⌃Z", { key: "z", ctrlKey: true }],
    ["⇧⌘Z", { key: "Z", metaKey: true, shiftKey: true }],
    ["⌃Y", { key: "y", ctrlKey: true }],
  ] as const)("%s leaves the canvas history and the staged edit alone", async (_label, init) => {
    const c = seededComposer();
    /* One canvas step undone BEFORE Brand opens, so redo has something it
       could wrongly replay too. */
    c.history.undo();
    c.history.flushPending();
    const utils = render(wrap(<Shell composer={c} brandOpen />));
    await stageRadiusEdit(utils);
    c.history.flushPending();
    const before = { n: count(c), undo: c.history.getUndoCount(), redo: c.history.getRedoCount() };
    const savebar = () => document.querySelector('[data-screen-savebar="true"]')?.textContent ?? "";
    const dirtyText = savebar();
    expect(dirtyText).toMatch(/unsaved/i);

    let e: KeyboardEvent | undefined;
    act(() => { e = chord(document.body, init); });
    act(() => { chord(document.body, init); });
    c.history.flushPending();

    expect(e!.defaultPrevented).toBe(true);
    expect({ n: count(c), undo: c.history.getUndoCount(), redo: c.history.getRedoCount() }).toEqual(before);
    /* The draft is still staged: the footer still reports it. */
    expect(savebar()).toBe(dirtyText);
  });

  it("a text field inside Brand keeps the browser's own undo and still never reaches the canvas", async () => {
    const c = seededComposer();
    const before = count(c);
    const utils = render(wrap(<Shell composer={c} brandOpen />));
    const input = await stageRadiusEdit(utils);
    input.focus();
    let e: KeyboardEvent | undefined;
    act(() => { e = chord(input, { key: "z", metaKey: true }); });
    expect(e!.defaultPrevented).toBe(false);
    c.history.flushPending();
    expect(count(c)).toBe(before);
  });

  it("closing Brand gives ⌘Z back to the canvas", async () => {
    const c = seededComposer();
    const before = count(c);
    const utils = render(wrap(<Shell composer={c} brandOpen />));
    utils.rerender(wrap(<Shell composer={c} brandOpen={false} />));
    chord(document.body, { key: "z", metaKey: true });
    c.history.flushPending();
    expect(count(c)).toBe(before - 1);
  });
});

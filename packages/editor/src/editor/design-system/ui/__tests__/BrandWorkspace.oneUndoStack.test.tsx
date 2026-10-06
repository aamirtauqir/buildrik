/**
 * Spec §4 / test 7 — Brand and the canvas share ONE undo stack.
 *
 * This file used to pin BRD-24's interim block (⌘Z swallowed while Brand was
 * open, because one ⌘Z dropped a STAGED edit and undid a canvas step out of
 * sight). Task 10 removed the staging: a Brand edit is a composer transaction
 * the moment it is made, so ⌘Z is allowed through again and undoes exactly
 * that edit — the canvas history is untouched until the next ⌘Z.
 *
 * Real Composer, real history (flushed so each step is on the stack), the
 * shell's real shortcut hook, the real workspace.
 *
 * @license BSD-3-Clause
 */
import { render, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import * as React from "react";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import { mergeProjectTokens } from "@/engine/designSystem/projectTokens";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "@/engine/__tests__/test-utils/realComposer";
import { useEditorShortcuts } from "@/editor/shell/hooks/useEditorShortcuts";
import { BrandWorkspace } from "../BrandWorkspace";
import { installDomShims, openPage, wrap, type ComposerProp } from "./brandWorkspaceHarness";

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
/** The site's radius-sm as the canvas and Brand see it (saved tokens over the seed). */
const radius = (c: RealComposer) => {
  const s = c.getProjectSettings();
  return resolveTokenLiteral(mergeProjectTokens(s.designTokens ?? [], s.designTokensSchemaVersion), "radius-sm", "light");
};

function chord(target: EventTarget, init: KeyboardEventInit) {
  const e = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(e);
  return e;
}

/** One radius edit on the card, the way a user makes it. */
async function editRadius(utils: ReturnType<typeof render>, value: string) {
  openPage(utils, "kind-radius");
  const row = await waitFor(() => {
    const el = utils.container.querySelector<HTMLElement>('[data-token-row="radius-sm"]');
    if (!el) throw new Error("radius-sm row not rendered");
    return el;
  });
  fireEvent.click(row);
  fireEvent.click(utils.getByTestId("brand-token-action-replace"));
  const input = await waitFor(() => utils.getByLabelText("Value") as HTMLInputElement);
  fireEvent.change(input, { target: { value } });
  fireEvent.blur(input);
  return input;
}

const tableValue = (utils: ReturnType<typeof render>) => utils.getByTestId("brand-token-value-radius-sm").textContent;

describe("one undo stack — Brand edits and canvas edits", () => {
  it("a Brand edit is in the project at once — one history step, nothing staged", async () => {
    const c = seededComposer();
    const steps = c.history.getUndoCount();
    const utils = render(wrap(<Shell composer={c} brandOpen />, c as unknown as ComposerProp));
    await editRadius(utils, "7px");
    c.history.flushPending();

    expect(radius(c)).toBe("7px");
    expect(c.history.getUndoCount()).toBe(steps + 1);
    expect(document.querySelector('[data-screen-savebar="true"]')).toBeNull();
    expect(utils.queryByText(/unsaved/i)).toBeNull();
  });

  it("⌘Z with Brand open undoes the Brand edit — and only it; the next ⌘Z undoes the canvas", async () => {
    const c = seededComposer();
    const elements = count(c);
    const utils = render(wrap(<Shell composer={c} brandOpen />, c as unknown as ComposerProp));
    const before = radius(c);
    await editRadius(utils, "7px");
    c.history.flushPending();
    await waitFor(() => expect(tableValue(utils)).toBe("7px"));

    act(() => {
      chord(document.body, { key: "z", metaKey: true });
    });
    c.history.flushPending();
    expect(radius(c)).toBe(before);
    expect(count(c)).toBe(elements);
    /* The workspace follows the undo — it reads the project. */
    await waitFor(() => expect(tableValue(utils)).toBe(before));

    act(() => {
      chord(document.body, { key: "z", metaKey: true });
    });
    c.history.flushPending();
    expect(count(c)).toBe(elements - 1);
  });

  it("⇧⌘Z redoes the Brand edit", async () => {
    const c = seededComposer();
    const utils = render(wrap(<Shell composer={c} brandOpen />, c as unknown as ComposerProp));
    await editRadius(utils, "7px");
    c.history.flushPending();
    act(() => {
      chord(document.body, { key: "z", metaKey: true });
    });
    c.history.flushPending();
    act(() => {
      chord(document.body, { key: "Z", metaKey: true, shiftKey: true });
    });
    c.history.flushPending();
    expect(radius(c)).toBe("7px");
    await waitFor(() => expect(tableValue(utils)).toBe("7px"));
  });

  it("a text field inside Brand keeps the browser's own undo", async () => {
    const c = seededComposer();
    const utils = render(wrap(<Shell composer={c} brandOpen />, c as unknown as ComposerProp));
    const input = await editRadius(utils, "7px");
    c.history.flushPending();
    input.focus();
    let e: KeyboardEvent | undefined;
    act(() => {
      e = chord(input, { key: "z", metaKey: true });
    });
    expect(e!.defaultPrevented).toBe(false);
    c.history.flushPending();
    expect(radius(c)).toBe("7px");
  });
});

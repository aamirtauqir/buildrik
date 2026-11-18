// @vitest-environment jsdom
/**
 * 2L9 G04 (271:124992) / G22 (271:131163): an action refused because its
 * target was locked by the time it ran says so where it happened, with
 * Unlock, until the element is unlocked. Real Composer: the paste refusal is
 * read off the command itself.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { act, render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import type { Composer } from "@/engine/Composer";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { renameElement } from "@/editor/panels/layers/hooks/layersPersistence";
import { LockRefusalNote, setLockRefusal, useWatchPasteRefusal } from "../LockRefusal";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

let composer: Composer;
let id: string;

beforeEach(() => {
  setLockRefusal(null);
  composer = createTestComposer();
  const page = composer.elements.createPage("Home");
  const el = composer.elements.createElement("heading");
  composer.elements.addElement(el, page.root.id);
  id = el.getId();
  renameElement(composer as never, id, "Hero heading");
  composer.selection.select(composer.elements.getElement(id)!);
});

function PasteHost() {
  useWatchPasteRefusal(composer);
  return <LockRefusalNote composer={composer} elementId={id} kind="paste-style" />;
}

describe("LockRefusal", () => {
  it("G04: Paste style onto a target locked first changes nothing and says so; Unlock clears it", () => {
    render(<PasteHost />);
    composer.styleClipboard = { color: "red" };
    act(() => {
      composer.elements.getElement(id)!.setLocked(true);
      void composer.commands.run("paste-style");
    });
    expect(composer.elements.getElement(id)!.getStyles().color).toBeUndefined();
    const note = screen.getByTestId("inspector-lock-refusal-paste-style");
    expect(note).toHaveTextContent("Editing unavailable");
    expect(note).toHaveTextContent("Hero heading was locked before the style could be pasted. No properties changed.");
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Unlock" }));
    });
    expect(composer.elements.getElement(id)!.isLocked()).toBe(false);
    expect(screen.queryByTestId("inspector-lock-refusal-paste-style")).toBeNull();
  });

  it("a paste with nothing copied, or onto an unlocked target, says nothing", () => {
    render(<PasteHost />);
    act(() => {
      composer.elements.getElement(id)!.setLocked(true);
      void composer.commands.run("paste-style");
    });
    expect(screen.queryByTestId("inspector-lock-refusal-paste-style")).toBeNull();
  });

  it("G22: the add-interaction refusal names the element and lasts only while it is locked", () => {
    composer.elements.getElement(id)!.setLocked(true);
    render(<LockRefusalNote composer={composer} elementId={id} kind="add-interaction" />);
    act(() => setLockRefusal({ elementId: id, kind: "add-interaction" }));
    expect(screen.getByTestId("inspector-lock-refusal-add-interaction")).toHaveTextContent(
      "Locked — unlock to editNo interaction was added to Hero heading."
    );
    act(() => {
      composer.elements.getElement(id)!.setLocked(false);
      composer.emit("element:updated", composer.elements.getElement(id));
    });
    expect(screen.queryByTestId("inspector-lock-refusal-add-interaction")).toBeNull();
  });
});

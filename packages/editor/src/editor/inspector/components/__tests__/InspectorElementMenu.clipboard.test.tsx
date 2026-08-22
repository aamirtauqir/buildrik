// @vitest-environment jsdom
/**
 * The inspector's Copy styles / Paste styles against the canvas's.
 *
 * There were two style clipboards. The canvas keyboard (⌘⌥C/⌘⌥V) and the
 * right-click menu both wrote `composer.styleClipboard`; this menu kept its
 * own module-level `let`. So "Copy styles" in the inspector left ⌘⌥V with
 * nothing to paste, and ⌘⌥C left this menu's Paste row greyed out — two
 * controls with the same name, the same icon, and no connection.
 *
 * Driven against a real Composer, because the bug is exactly that a fake
 * clipboard would have agreed with either implementation.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Composer } from "@/engine/Composer";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "@/engine/__tests__/test-utils/realComposer";
import { InspectorElementMenu } from "../InspectorElementMenu";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

let composer: Composer;
let sourceId: string;
let targetId: string;

beforeEach(() => {
  composer = createTestComposer();
  const page = composer.elements.createPage("Home");
  const rootId = page.root.id;
  const source = composer.elements.createElement("heading");
  const target = composer.elements.createElement("paragraph");
  composer.elements.addElement(source, rootId);
  composer.elements.addElement(target, rootId);
  sourceId = source.getId();
  targetId = target.getId();
  source.setStyle?.("color", "rgb(26, 86, 219)");
});

const open = (elementId: string) => {
  const view = render(
    <InspectorElementMenu
      composer={composer}
      selectedElementId={elementId}
      onRequestDelete={() => {}}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: /element actions|more/i }));
  return view;
};

describe("InspectorElementMenu style clipboard", () => {
  it("writes the clipboard the canvas reads", () => {
    open(sourceId);
    fireEvent.click(screen.getByText("Copy styles"));
    expect(composer.styleClipboard).toMatchObject({ color: "rgb(26, 86, 219)" });
  });

  it("pastes what the canvas copied", () => {
    /* A value the source element does not carry, so a paste that quietly came
       from this menu's own earlier copy cannot masquerade as a pass. */
    composer.styleClipboard = { color: "rgb(1, 2, 3)" };
    open(targetId);
    const paste = screen.getByText("Paste styles").closest("button");
    expect(paste).not.toBeDisabled();
    fireEvent.click(screen.getByText("Paste styles"));
    expect(composer.elements.getElement(targetId)?.getStyles?.().color).toBe("rgb(1, 2, 3)");
  });

  /* Runs after the copy above on purpose: a module-level `let` survives the
     project, so the old clipboard stayed offerable in a site that never
     copied anything. Per-composer state ends with the composer. */
  it("offers nothing to paste in a project where nothing has been copied", () => {
    open(targetId);
    expect(screen.getByText("Paste styles").closest("button")).toBeDisabled();
  });
});

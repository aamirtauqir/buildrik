/**
 * RenameAssetModal — Clone 3701:20353 "Rename hero-dark.jpg" and its
 * validation frame 3701:20400 "A file with that name exists".
 *
 * The field shows and accepts the FULL filename ("hero-home.jpg"); the engine
 * keeps its stem-only `name` contract (MediaManager strips the extension at
 * upload, `toLibraryItem` restores it for display), so saving strips the real
 * extension back off before the name reaches `renameItem`.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { RenameAssetModal } from "../RenameAssetModal";
import { TEN, makeItem } from "../../__tests__/libraryFixture";

const HERO = makeItem({ key: "hero", name: "hero-dark", displayName: "hero-dark.jpg", mimeType: "image/jpeg" });
const LIBRARY = [HERO, ...TEN.filter((i) => i.key !== "hero").map((i) => ({ ...i, displayName: i.name }))];

function mount(over: Partial<React.ComponentProps<typeof RenameAssetModal>> = {}) {
  const onRename = vi.fn(() => Promise.resolve());
  const onClose = vi.fn();
  render(<RenameAssetModal item={HERO} libraryItems={LIBRARY} onRename={onRename} onClose={onClose} {...over} />);
  return { onRename, onClose };
}

const input = () => screen.getByTestId("mgr-rename-input") as HTMLInputElement;
const footButtons = () =>
  within(screen.getByTestId("mgr-rename-foot"))
    .getAllByRole("button")
    .map((b) => b.textContent?.trim());

describe("Clone 3701:20353 · Rename hero-dark.jpg", () => {
  it("titles with the current full filename, states the usage promise, and pre-fills the field with the full filename", () => {
    mount();
    expect(screen.getByTestId("mgr-rename-title")).toHaveTextContent("Rename hero-dark.jpg");
    expect(screen.getByTestId("mgr-rename-body")).toHaveTextContent(
      "Changing the file name will not move or replace its site usages.",
    );
    expect(input().value).toBe("hero-dark.jpg");
    expect(footButtons()).toEqual(["Cancel", "Save name"]);
  });

  it("Save name stays disabled while the name is unchanged or blank", () => {
    mount();
    const save = screen.getByTestId("mgr-rename-save");
    expect(save).toBeDisabled();
    fireEvent.change(input(), { target: { value: "   " } });
    expect(save).toBeDisabled();
    fireEvent.change(input(), { target: { value: "hero-home.jpg" } });
    expect(save).toBeEnabled();
  });

  it("saves the stem — the engine's contract — so the display name still ends in the real extension", async () => {
    const { onRename, onClose } = mount();
    fireEvent.change(input(), { target: { value: "hero-home.jpg" } });
    fireEvent.click(screen.getByTestId("mgr-rename-save"));
    expect(onRename).toHaveBeenCalledWith("hero", "hero-home");
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("a name typed without the extension keeps the real one", () => {
    const { onRename } = mount();
    fireEvent.change(input(), { target: { value: "hero-home" } });
    fireEvent.click(screen.getByTestId("mgr-rename-save"));
    expect(onRename).toHaveBeenCalledWith("hero", "hero-home");
  });

  it("an asset the engine already stores with its extension keeps the full name", () => {
    const { onRename } = mount({
      item: makeItem({ key: "menu", name: "menu-cover.png", displayName: "menu-cover.png", mimeType: "image/png" }),
    });
    fireEvent.change(input(), { target: { value: "menu-front" } });
    fireEvent.click(screen.getByTestId("mgr-rename-save"));
    expect(onRename).toHaveBeenCalledWith("menu", "menu-front.png");
  });

  it("Enter saves; Cancel closes without renaming", () => {
    const { onRename, onClose } = mount();
    fireEvent.change(input(), { target: { value: "hero-home.jpg" } });
    fireEvent.keyDown(input(), { key: "Enter" });
    expect(onRename).toHaveBeenCalledWith("hero", "hero-home");

    onRename.mockClear();
    fireEvent.click(screen.getByTestId("mgr-rename-cancel"));
    expect(onClose).toHaveBeenCalled();
    expect(onRename).not.toHaveBeenCalled();
  });

  it("Escape cancels", () => {
    const { onClose, onRename } = mount();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onRename).not.toHaveBeenCalled();
  });
});

describe("Clone 3701:20400 · A file with that name exists", () => {
  it("refuses a display name another asset already carries, and the original name is untouched", () => {
    const { onRename, onClose } = mount();
    fireEvent.change(input(), { target: { value: "team-photo.jpg" } });
    fireEvent.click(screen.getByTestId("mgr-rename-save"));
    expect(onRename).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId("mgr-rename-title")).toHaveTextContent("A file with that name exists");
    expect(screen.getByTestId("mgr-rename-body")).toHaveTextContent(
      "Choose a different file name. The original file name has not changed.",
    );
    expect(footButtons()).toEqual(["Cancel", "Edit name"]);
    expect(screen.queryByTestId("mgr-rename-input")).toBeNull();
  });

  it("the clash is on the DISPLAY name, so typing the stem of a taken file is refused too", () => {
    const { onRename } = mount();
    fireEvent.change(input(), { target: { value: "team-photo" } });
    fireEvent.click(screen.getByTestId("mgr-rename-save"));
    expect(onRename).not.toHaveBeenCalled();
    expect(screen.getByTestId("mgr-rename-title")).toHaveTextContent("A file with that name exists");
  });

  it("Edit name returns to the rename modal with the typed value kept", () => {
    mount();
    fireEvent.change(input(), { target: { value: "team-photo.jpg" } });
    fireEvent.click(screen.getByTestId("mgr-rename-save"));
    fireEvent.click(screen.getByTestId("mgr-rename-edit"));
    expect(screen.getByTestId("mgr-rename-title")).toHaveTextContent("Rename hero-dark.jpg");
    expect(input().value).toBe("team-photo.jpg");
  });

  it("Cancel on the clash closes everything, nothing renamed", () => {
    const { onRename, onClose } = mount();
    fireEvent.change(input(), { target: { value: "team-photo.jpg" } });
    fireEvent.click(screen.getByTestId("mgr-rename-save"));
    fireEvent.click(screen.getByTestId("mgr-rename-cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onRename).not.toHaveBeenCalled();
  });

  it("the asset's own name is not a clash with itself (case only)", () => {
    const { onRename } = mount();
    fireEvent.change(input(), { target: { value: "Hero-Dark.jpg" } });
    fireEvent.click(screen.getByTestId("mgr-rename-save"));
    expect(onRename).toHaveBeenCalledWith("hero", "Hero-Dark");
  });
});

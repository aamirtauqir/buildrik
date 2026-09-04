/**
 * The delete confirm has to describe what delete actually does.
 *
 * It used to promise the file was removed "from every page using it".
 * `MediaManager.deleteAsset` clears the library entry, the stored blob, the
 * object URL and the server row — it never touches the element tree, and no
 * subscriber to MEDIA_DELETED walks it either. Measured in the running editor
 * against a real asset: after the delete the library no longer held it while
 * the page's <img> kept the identical src, in engine state AND in the DOM.
 *
 * The Media TAB's own confirm has always said the true thing ("N files are
 * currently used on the canvas. Deleting will break those elements") — this
 * picker was the one surface disagreeing with it.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { MediaAsset } from "../../../shared/types/media";

const managerMock = vi.hoisted(() => ({
  assets: [] as MediaAsset[],
  isLoading: false,
  uploadFile: vi.fn(async () => ({ success: true })),
  deleteAsset: vi.fn(async () => {}),
  updateAsset: vi.fn(async () => null),
  getAsset: vi.fn(),
  getAssets: vi.fn(),
}));

vi.mock("../../shell/hooks", () => ({ useMediaManager: () => managerMock }));
vi.mock("../OptimizationPanel", () => ({ OptimizationPanel: () => <div /> }));
vi.mock("../VideoPreview", () => ({ VideoPreview: () => <div /> }));

import { MediaLibraryPanel } from "../MediaLibraryPanel";
/* The delete offers Undo via a toast; the studio wraps everything in this
   provider and only these tests rendered the panel bare. */
import { ToastProvider } from "@/editor/chrome-ui";

const asset: MediaAsset = {
  id: "a1",
  type: "image",
  name: "hero.png",
  originalName: "hero.png",
  src: "data:image/png;base64,xx",
  size: 1024,
  mimeType: "image/png",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as MediaAsset;

beforeEach(() => {
  managerMock.assets = [asset];
  managerMock.getAssets.mockReset();
  managerMock.getAssets.mockImplementation(() => managerMock.assets);
});

function openConfirm() {
  render(<ToastProvider><MediaLibraryPanel isOpen onClose={vi.fn()} /></ToastProvider>);
  /* The card's delete control is reached by its accessible name, which is the
     point: it used to be a bare "✕" with none. */
  const del = screen.getByRole("button", { name: /delete hero\.png/i });
  fireEvent.click(del);
  return document.body.textContent ?? "";
}

describe("media picker delete confirmation", () => {
  it("does not claim the file is pulled off the pages that use it", () => {
    expect(openConfirm()).not.toMatch(/from every page using it/i);
  });

  it("warns that the pages keep the dead link", () => {
    const text = openConfirm();
    expect(text).toMatch(/keep the link/i);
    expect(text).toMatch(/breaks/i);
  });

  it("still says the delete is permanent", () => {
    expect(openConfirm()).toMatch(/cannot be undone/i);
  });

  it("matches the code: deleteAsset never reaches the element tree", () => {
    const manager = readFileSync(
      join(__dirname, "..", "..", "..", "engine", "media", "MediaManager.ts"),
      "utf8"
    );
    const body = manager.slice(manager.indexOf("async deleteAsset("));
    expect(body.slice(0, body.indexOf("\n  async updateAsset("))).not.toMatch(/elements/);
  });
});

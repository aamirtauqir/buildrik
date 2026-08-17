/**
 * Project settings — board 1172:4867.
 *
 * The tab row was three `Button`s inside a flex div: no `role="tablist"`, no
 * `role="tab"`, no arrow keys and no `aria-selected`, so a screen reader read
 * three unrelated buttons and could not say which section was showing. The
 * fields had `<label>` elements bound to nothing, which left every input
 * without an accessible name. Both were invisible on screen, which is why
 * neither the board walk nor a screenshot would have caught them — the third
 * delta, the primary button reading "Save changes" where the board says
 * "Save", is the one that was visible.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProjectSettingsModal } from "../ProjectSettingsModal";

afterEach(cleanup);

vi.mock("@/editor/chrome-ui", async () => {
  const actual = await vi.importActual<typeof import("@/editor/chrome-ui")>("@/editor/chrome-ui");
  return { ...actual, useToast: () => ({ addToast: vi.fn() }) };
});

const composer = {
  getProjectMetadata: () => ({ name: "Bella Cucina", author: "Ayesha" }),
  getProjectSettings: () => ({ seo: { siteName: "Bella Cucina" } }),
  getState: () => ({ gridSize: 8, snapToGrid: true }),
  updateProjectMetadata: vi.fn(),
  setGridSize: vi.fn(),
  setSnapToGrid: vi.fn(),
  setProjectSettings: vi.fn(),
} as unknown as Parameters<typeof ProjectSettingsModal>[0]["composer"];

const open = () =>
  render(<ProjectSettingsModal isOpen onClose={vi.fn()} composer={composer} />);

describe("Project settings — the board's three sections", () => {
  it("is a real tablist, not a row of buttons", () => {
    open();
    expect(screen.getByRole("tablist")).toBeTruthy();
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual([
      "General",
      "Canvas",
      "SEO",
    ]);
  });

  it("says which section is showing", () => {
    open();
    expect(screen.getByRole("tab", { name: "General" }).getAttribute("aria-selected")).toBe("true");
    fireEvent.click(screen.getByRole("tab", { name: "SEO" }));
    expect(screen.getByRole("tab", { name: "SEO" }).getAttribute("aria-selected")).toBe("true");
  });

  it("moves between sections with the arrow keys", () => {
    open();
    fireEvent.keyDown(screen.getByRole("tablist"), { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Canvas" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByLabelText("Grid size (px)")).toBeTruthy();
  });
});

describe("Project settings — fields carry their own names", () => {
  it("names the General fields", () => {
    open();
    expect((screen.getByLabelText("Project name") as HTMLInputElement).value).toBe("Bella Cucina");
    expect((screen.getByLabelText("Author / description") as HTMLInputElement).value).toBe("Ayesha");
  });

  it("names the SEO field", () => {
    open();
    fireEvent.click(screen.getByRole("tab", { name: "SEO" }));
    expect((screen.getByLabelText("Site name (SEO default)") as HTMLInputElement).value).toBe(
      "Bella Cucina",
    );
  });
});

describe("Project settings — the footer the board draws", () => {
  it("commits with Save", () => {
    open();
    fireEvent.change(screen.getByLabelText("Project name"), { target: { value: "Trattoria" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(composer!.updateProjectMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Trattoria" }),
    );
  });

  it("closes without saving on Cancel", () => {
    const onClose = vi.fn();
    render(<ProjectSettingsModal isOpen onClose={onClose} composer={composer} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
  });
});

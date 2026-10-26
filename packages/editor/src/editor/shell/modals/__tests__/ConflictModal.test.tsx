/**
 * ConflictModal.test.tsx — the site changed somewhere else (2L9 B7-G14–G17).
 * Covers the board's choice (Overwrite… · Download a copy · Reload latest…),
 * the Reload and Overwrite confirms, "Before overwrite" kept first (and the
 * stop when it cannot be), the brand-format variant, the overlay contract
 * (no scrim dismiss, focus trap) and the kept-behind-copy discard rules.
 *
 * Rewritten 2026-10-26 (L-F S4): the old suite pinned "Your copy is behind",
 * "Save a backup" and the inline "Yes, overwrite" arm, none of which the
 * 2L9 board draws.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act, waitFor } from "@testing-library/react";
import { ConflictModal, type ConflictModalProps } from "../ConflictModal";
import type { ProjectData } from "@shared/types";

const keepBeforeOverwrite = vi.hoisted(() => vi.fn(() => Promise.resolve({})));
vi.mock("@/services/versionSync", () => ({ keepBeforeOverwrite }));

const EMPTY_PROJECT: ProjectData = { version: "1", pages: [], styles: [], assets: [] };

function makeProps(over: Partial<ConflictModalProps> = {}): ConflictModalProps {
  return {
    open: true,
    siteId: "s1",
    onReload: vi.fn(),
    onSaveBackup: vi.fn(),
    onOverwrite: vi.fn(),
    onClose: vi.fn(),
    ...over,
  };
}

let createObjectURL: ReturnType<typeof vi.fn>;

beforeEach(() => {
  createObjectURL = vi.fn(() => "blob:mock");
  Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true, writable: true });
  Object.defineProperty(URL, "revokeObjectURL", { value: vi.fn(), configurable: true, writable: true });
});

afterEach(() => {
  delete (URL as unknown as Record<string, unknown>).createObjectURL;
  delete (URL as unknown as Record<string, unknown>).revokeObjectURL;
  cleanup();
  keepBeforeOverwrite.mockClear();
  localStorage.clear();
});

const overwriteThrough = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Overwrite…" }));
  fireEvent.click(screen.getByRole("button", { name: "Overwrite" }));
};

describe("ConflictModal — the choice (G14)", () => {
  it("renders nothing when closed", () => {
    render(<ConflictModal {...makeProps({ open: false })} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("title, the board's body and its three actions in order", () => {
    render(<ConflictModal {...makeProps()} />);
    expect(screen.getByRole("dialog", { name: "This site changed somewhere else" })).toBeInTheDocument();
    expect(screen.getByTestId("conflict-body").textContent).toBe(
      "Changed in another tab or on another device. Your changes in this tab haven’t been saved.",
    );
    const names = screen.getAllByRole("button").map((b) => b.textContent);
    expect(names).toEqual(["Overwrite…", "Download a copy", "Reload latest…"]);
  });

  it("names the server's time once the conflict is raised", () => {
    render(<ConflictModal {...makeProps()} />);
    act(() => {
      window.dispatchEvent(
        new CustomEvent("buildrik:save-conflict", { detail: { serverLastEditedAt: new Date(2026, 9, 26, 10, 31).toISOString() } }),
      );
    });
    expect(screen.getByTestId("conflict-body").textContent).toMatch(/^Changed at 10:31 in another tab or on another device\./);
  });

  it("opens on Reload latest…, and Tab stays inside", () => {
    render(<ConflictModal {...makeProps()} />);
    const dialog = screen.getByRole("dialog", { name: "This site changed somewhere else" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Reload latest…" }));
    fireEvent.keyDown(document, { key: "Tab" });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("a scrim click does NOT dismiss; Escape does", () => {
    const props = makeProps();
    render(<ConflictModal {...props} />);
    fireEvent.mouseDown(screen.getByTestId("overlay-scrim"));
    fireEvent.click(screen.getByTestId("overlay-scrim"));
    expect(props.onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("the role=dialog node itself carries the name, not the scrim", () => {
    render(<ConflictModal {...makeProps()} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBe(screen.getByTestId("conflict-title").id);
  });
});

describe("ConflictModal — Download a copy", () => {
  it("downloads this tab's kept work and stays open", () => {
    localStorage.setItem("bk-unsaved-v1-s1", JSON.stringify({ project: EMPTY_PROJECT, at: "2026-10-26T00:00:00.000Z" }));
    const props = makeProps();
    render(<ConflictModal {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Download a copy" }));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(props.onSaveBackup).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("with no work readable here, falls back to the shell's download — discarding the behind copy first", () => {
    const props = makeProps();
    render(<ConflictModal {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Download a copy" }));
    expect(props.onSaveBackup).toHaveBeenCalledTimes(1);
  });
});

describe("ConflictModal — Reload latest… asks first (G15)", () => {
  it("confirm copy, Cancel focused and goes back, Reload reloads", () => {
    const props = makeProps();
    render(<ConflictModal {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Reload latest…" }));
    expect(screen.getByTestId("conflict-title").textContent).toBe("Reload the latest version?");
    expect(screen.getByText("Your changes in this tab will be replaced. A download, if you started one, isn’t checked.")).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(props.onReload).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Reload latest…" }));
    fireEvent.click(screen.getByRole("button", { name: "Reload" }));
    expect(props.onReload).toHaveBeenCalledTimes(1);
  });
});

describe("ConflictModal — Overwrite… keeps the newer version first (G16 / G17)", () => {
  it("confirm copy, then \"Before overwrite\" is kept BEFORE onOverwrite", async () => {
    const order: string[] = [];
    keepBeforeOverwrite.mockImplementationOnce(async () => {
      order.push("keep");
      return {};
    });
    const onOverwrite = vi.fn(() => order.push("overwrite"));
    render(<ConflictModal {...makeProps({ onOverwrite })} />);
    fireEvent.click(screen.getByRole("button", { name: "Overwrite…" }));
    expect(screen.getByTestId("conflict-title").textContent).toBe("Overwrite the newer version?");
    expect(
      screen.getByText("The newer version is kept in History › Saves as “Before overwrite” first. Then your changes replace it."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Overwrite" }));
    await waitFor(() => expect(onOverwrite).toHaveBeenCalledTimes(1));
    expect(keepBeforeOverwrite).toHaveBeenCalledWith("s1");
    expect(order).toEqual(["keep", "overwrite"]);
  });

  it("when the newer version can't be kept, nothing is overwritten and Retry is offered", async () => {
    keepBeforeOverwrite.mockRejectedValueOnce(new Error("offline"));
    const props = makeProps();
    render(<ConflictModal {...props} />);
    await overwriteThrough();
    expect(await screen.findByText("Couldn’t keep the newer version — nothing was overwritten.")).toBeInTheDocument();
    expect(props.onOverwrite).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(props.onOverwrite).toHaveBeenCalledTimes(1));
  });

  it("re-opening returns to the choice", () => {
    const props = makeProps();
    const { rerender } = render(<ConflictModal {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Overwrite…" }));
    rerender(<ConflictModal {...props} open={false} />);
    rerender(<ConflictModal {...props} open={true} />);
    expect(screen.getByTestId("conflict-title").textContent).toBe("This site changed somewhere else");
  });
});

describe("ConflictModal — a brand-format conflict", () => {
  it("offers no Overwrite — the same save would be refused again — and says to reload", () => {
    render(<ConflictModal {...makeProps({ brandFormat: true })} />);
    expect(screen.queryByRole("button", { name: /overwrite/i })).toBeNull();
    expect(screen.getByRole("button", { name: "Reload latest…" })).toBeTruthy();
    expect(screen.getByTestId("conflict-body").textContent).toMatch(/reload/i);
  });
});

/* The conflict hold keeps the held edit in `bk-unsaved-v1-*` so a reload can
   offer it back. Choosing Reload is the user discarding that behind copy — if
   the record survived, the reload would offer "Restore my edits" and Restore
   would autosave the stale project over the teammate's with the FRESH token. */
describe("ConflictModal — the kept behind copy", () => {
  const KEY = "bk-unsaved-v1-s1";
  const kept = () => JSON.stringify({ project: { pages: [] }, at: "2026-09-26T00:00:00.000Z" });
  beforeEach(() => localStorage.setItem(KEY, kept()));

  const reloadThrough = () => {
    fireEvent.click(screen.getByRole("button", { name: "Reload latest…" }));
    fireEvent.click(screen.getByRole("button", { name: "Reload" }));
  };

  it("Reload clears the site's unsaved record before reloading", () => {
    let atReload: string | null = "not called";
    const onReload = vi.fn(() => {
      atReload = localStorage.getItem(KEY);
    });
    render(<ConflictModal {...makeProps({ onReload })} />);
    reloadThrough();
    expect(atReload).toBeNull();
  });

  it("Overwrite keeps it — the local copy is the one being saved", async () => {
    const props = makeProps();
    render(<ConflictModal {...props} />);
    await overwriteThrough();
    await waitFor(() => expect(props.onOverwrite).toHaveBeenCalled());
    expect(localStorage.getItem(KEY)).toBe(kept());
  });

  it("an autosave hold that fires after Reload cannot write it back", async () => {
    const { keepUnsaved, readUnsaved } = await import("@/services/unsavedRecovery");
    render(<ConflictModal {...makeProps()} />);
    reloadThrough();
    keepUnsaved("s1", EMPTY_PROJECT);
    expect(readUnsaved("s1")).toBeNull();
    keepUnsaved("s2", EMPTY_PROJECT);
    expect(readUnsaved("s2")).not.toBeNull();
  });

  /* The reload can be cancelled (the unsaved-changes prompt) and the page
     lives on; the discard latch must not outlive an Overwrite after it. */
  it("choosing Overwrite after a cancelled reload keeps work again", async () => {
    const { keepUnsaved, readUnsaved } = await import("@/services/unsavedRecovery");
    const props = makeProps();
    render(<ConflictModal {...props} />);
    reloadThrough();
    await overwriteThrough();
    await waitFor(() => expect(props.onOverwrite).toHaveBeenCalled());
    keepUnsaved("s1", EMPTY_PROJECT);
    expect(readUnsaved("s1")).not.toBeNull();
  });
});

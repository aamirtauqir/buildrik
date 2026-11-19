/**
 * ConflictModal.test.tsx — one resolver, two variants (design decision 11,
 * eng re-review T1), at the boards' geometry (2L9 B7-G14 choice, G15 / G16
 * confirms): "save" (a save was refused because the server moved) and
 * "restore" (the load found edits that never reached the server, BK-04).
 * The shared contract runs table-driven over both; variant-only rules follow.
 *
 * Saving to History and keeping the server copy before a replace are the
 * parent's (useServerConflict, BD-35 / BK-59); at this boundary the contract
 * is the callback and what is discarded around it.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, act, within } from "@testing-library/react";
import { ConflictModal, type ConflictModalProps } from "../ConflictModal";
import type { ProjectData } from "@shared/types";
import type { VersionChange } from "@/shared/types/versions";
import { keepUnsaved, readUnsaved, resumeKeepingUnsaved } from "@/services/unsavedRecovery";

const EMPTY_PROJECT: ProjectData = { version: "1", pages: [], styles: [], assets: [] };
const KEY = "bk-unsaved-v1-s1";
const kept = () => JSON.stringify({ project: { pages: [] }, at: "2026-09-26T00:00:00.000Z" });

const change = (i: number): VersionChange => ({
  type: "content",
  property: `Heading ${i}`,
  before: `“mine ${i}”`,
  after: `“theirs ${i}”`,
});

function makeProps(over: Partial<ConflictModalProps> = {}): ConflictModalProps {
  return {
    open: true,
    siteId: "s1",
    server: { status: "ready", by: { name: "Sara Khan", isViewer: false }, at: new Date().toISOString(), differences: [] },
    onKeep: vi.fn(),
    onSaveToHistory: vi.fn(() => true),
    onReplace: vi.fn(),
    onClose: vi.fn(),
    ...over,
  };
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  resumeKeepingUnsaved();
});

const actionNames = () =>
  within(screen.getByTestId("conflict-actions"))
    .getAllByRole("button")
    .map((b) => b.textContent);

/* The save variant's Keep reloads, so it asks first (G15); the restore
   variant's stays on the copy already on screen. */
const keepSave = () => {
  fireEvent.click(screen.getByRole("button", { name: "Reload latest…" }));
  fireEvent.click(screen.getByRole("button", { name: "Reload" }));
};
const keepRestore = () => fireEvent.click(screen.getByRole("button", { name: "Keep the server version" }));

/* Restore with a server that moved since the edits ("server-newer") shares
   the save variant's three ways out; the safe restore ("unchanged") is below. */
const VARIANTS = [
  {
    variant: "save" as const,
    extra: {},
    title: "This site changed somewhere else",
    actions: ["Overwrite…", "Save my edits to History", "Reload latest…"],
    replaceLabel: "Overwrite…",
    primary: "Reload latest…",
    keep: keepSave,
  },
  {
    variant: "restore" as const,
    extra: { relation: "server-newer" as const, keptAt: new Date().toISOString() },
    title: "Someone saved this site after your edits",
    actions: ["Replace with mine…", "Save my edits to History", "Keep the server version"],
    replaceLabel: "Replace with mine…",
    primary: "Keep the server version",
    keep: keepRestore,
  },
];

describe.each(VARIANTS)("ConflictModal — $variant variant", ({ variant, extra, title, actions, replaceLabel, primary, keep }) => {
  const props = (over: Partial<ConflictModalProps> = {}) => makeProps({ variant, ...extra, ...over });
  const replace = () => {
    fireEvent.click(screen.getByRole("button", { name: replaceLabel }));
    fireEvent.click(screen.getByRole("button", { name: "Overwrite" }));
  };

  it("renders nothing when closed", () => {
    render(<ConflictModal {...props({ open: false })} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("names the dialog and offers the three ways out, in the board's order", () => {
    render(<ConflictModal {...props()} />);
    expect(screen.getByRole("dialog", { name: title })).toBeInTheDocument();
    expect(actionNames()).toEqual(actions);
    expect(screen.getByTestId("conflict-modal").getAttribute("data-step")).toBe("choose");
  });

  it("says who saved, from the server", () => {
    render(<ConflictModal {...props()} />);
    expect(screen.getByTestId("conflict-body").textContent).toMatch(/Sara Khan saved changes/);
  });

  it("Replace asks first (G16): Cancel goes back, Overwrite fires onReplace", () => {
    const p = props();
    render(<ConflictModal {...p} />);
    fireEvent.click(screen.getByRole("button", { name: replaceLabel }));
    expect(p.onReplace).not.toHaveBeenCalled();
    expect(screen.getByTestId("conflict-title").textContent).toBe("Overwrite the newer version?");
    expect(screen.getByTestId("conflict-modal").getAttribute("data-step")).toBe("overwrite");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(p.onReplace).not.toHaveBeenCalled();
    replace();
    expect(p.onReplace).toHaveBeenCalledTimes(1);
  });

  it("re-opening returns to the choice and closes the differences list", () => {
    const p = props();
    const { rerender } = render(<ConflictModal {...p} />);
    fireEvent.click(screen.getByTestId("conflict-review-differences"));
    fireEvent.click(screen.getByRole("button", { name: replaceLabel }));
    rerender(<ConflictModal {...p} open={false} />);
    rerender(<ConflictModal {...p} open />);
    expect(screen.getByTestId("conflict-modal").getAttribute("data-step")).toBe("choose");
    expect(screen.queryByTestId("conflict-differences")).toBeNull();
  });

  it("a scrim click does NOT dismiss; Escape does", () => {
    const p = props();
    render(<ConflictModal {...p} />);
    fireEvent.mouseDown(screen.getByTestId("overlay-scrim"));
    fireEvent.click(screen.getByTestId("overlay-scrim"));
    expect(p.onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(p.onClose).toHaveBeenCalledTimes(1);
  });

  it("opens with focus on the least destructive way out and keeps Tab inside", () => {
    render(<ConflictModal {...props()} />);
    const dialog = screen.getByRole("dialog", { name: title });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: primary }));
    fireEvent.keyDown(document, { key: "Tab" });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("the role=dialog node itself carries the name, not the scrim", () => {
    render(<ConflictModal {...props()} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog).not.toBe(screen.getByTestId("overlay-scrim"));
    expect(dialog.getAttribute("aria-labelledby")).toBe(screen.getByTestId("conflict-title").id);
  });

  it("Keep discards the kept copy, then calls onKeep", () => {
    localStorage.setItem(KEY, kept());
    let atKeep: string | null = "not called";
    const onKeep = vi.fn(() => {
      atKeep = localStorage.getItem(KEY);
    });
    render(<ConflictModal {...props({ onKeep })} />);
    keep();
    expect(onKeep).toHaveBeenCalledTimes(1);
    expect(atKeep).toBeNull();
  });

  it("Replace keeps the kept copy — it is the one being saved", () => {
    localStorage.setItem(KEY, kept());
    render(<ConflictModal {...props()} />);
    replace();
    expect(localStorage.getItem(KEY)).toBe(kept());
  });

  it("a failed save to History deletes nothing and says so", async () => {
    localStorage.setItem(KEY, kept());
    render(<ConflictModal {...props({ onSaveToHistory: vi.fn(() => Promise.reject(new Error("blocked"))) })} />);
    fireEvent.click(screen.getByRole("button", { name: "Save my edits to History" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't save your edits to History. Nothing was deleted.");
    expect(localStorage.getItem(KEY)).toBe(kept());
  });

  /* The save variant's Keep hands over to a reload: nothing may be kept
     after it. (The restore variant stays on the page — see below.) */
  it.runIf(variant === "save")("an autosave hold that fires after Keep cannot write the copy back", () => {
    render(<ConflictModal {...props()} />);
    keep();
    keepUnsaved("s1", EMPTY_PROJECT, null);
    expect(readUnsaved("s1")).toBeNull();
    // Another site's work is untouched by this site's discard.
    keepUnsaved("s2", EMPTY_PROJECT, null);
    expect(readUnsaved("s2")).not.toBeNull();
  });

  it("Replace after a Keep whose reload was cancelled keeps work again", () => {
    render(<ConflictModal {...props()} />);
    keep();
    replace();
    keepUnsaved("s1", EMPTY_PROJECT, null);
    expect(readUnsaved("s1")).not.toBeNull();
  });

  describe("Review differences", () => {
    it("lists up to 8 rows, then '+ N more', and says what it compares", () => {
      const differences = Array.from({ length: 11 }, (_, i) => change(i));
      render(<ConflictModal {...props({ server: { status: "ready", by: null, at: null, differences } })} />);
      fireEvent.click(screen.getByTestId("conflict-review-differences"));
      const list = screen.getByTestId("conflict-differences");
      expect(list.querySelectorAll("li")).toHaveLength(9);
      expect(list.textContent).toContain("+ 3 more");
      expect(list.textContent).toContain("yours: “mine 0”");
      expect(list.textContent).toContain("server: “theirs 0”");
      expect(list.textContent).toContain("Compares element content only");
    });

    it("says when the server copy is still loading or could not be read", () => {
      const { rerender } = render(<ConflictModal {...props({ server: { status: "loading" } })} />);
      fireEvent.click(screen.getByTestId("conflict-review-differences"));
      expect(screen.getByTestId("conflict-differences").textContent).toContain("Checking what changed");
      rerender(<ConflictModal {...props({ server: { status: "unavailable" } })} />);
      expect(screen.getByTestId("conflict-differences").textContent).toContain("Couldn't load what changed");
    });
  });
});

describe("ConflictModal — save variant only", () => {
  it("the board's body when the server names no editor, with the server's time", () => {
    render(
      <ConflictModal
        {...makeProps({ server: { status: "ready", by: null, at: new Date(2026, 9, 26, 10, 31).toISOString(), differences: [] } })}
      />,
    );
    expect(screen.getByTestId("conflict-body").textContent).toBe(
      "Changed at 10:31 in another tab or on another device. Your changes in this tab haven’t been saved.",
    );
  });

  it("Reload latest… asks first (G15): copy, Cancel focused and goes back", () => {
    const p = makeProps();
    render(<ConflictModal {...p} />);
    fireEvent.click(screen.getByRole("button", { name: "Reload latest…" }));
    expect(screen.getByTestId("conflict-title").textContent).toBe("Reload the latest version?");
    expect(screen.getByTestId("conflict-modal").getAttribute("data-step")).toBe("reload");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(p.onKeep).not.toHaveBeenCalled();
    expect(screen.getByTestId("conflict-modal").getAttribute("data-step")).toBe("choose");
  });

  it("the overwrite confirm names the server's time", () => {
    render(
      <ConflictModal
        {...makeProps({ server: { status: "ready", by: null, at: new Date(2026, 9, 26, 10, 31).toISOString(), differences: [] } })}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Overwrite…" }));
    expect(screen.getByText("The version from 10:31 is kept in History as “Before overwrite” first. Then your changes replace it.")).toBeInTheDocument();
  });

  it("a version saved to History discards the kept copy (the reload follows)", async () => {
    localStorage.setItem(KEY, kept());
    const onSaveToHistory = vi.fn(() => Promise.resolve(true));
    render(<ConflictModal {...makeProps({ onSaveToHistory })} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save my edits to History" }));
    });
    expect(onSaveToHistory).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(localStorage.getItem(KEY)).toBeNull());
  });

  it("names the viewer's own save from another tab", () => {
    render(
      <ConflictModal
        {...makeProps({ server: { status: "ready", by: { name: "Me", isViewer: true }, at: null, differences: [] } })}
      />,
    );
    expect(screen.getByTestId("conflict-body").textContent).toMatch(/You saved from another tab or device\./);
  });

  it("a legacy row without an editor still reads plainly", () => {
    render(<ConflictModal {...makeProps({ server: { status: "ready", by: null, at: null, differences: [] } })} />);
    expect(screen.getByTestId("conflict-body").textContent).toMatch(/^Changed in another tab or on another device\./);
    expect(screen.getByTestId("conflict-body").textContent).not.toMatch(/null|undefined/);
  });

  describe("a brand-format conflict (the tab's brand is an older format)", () => {
    it("offers no Overwrite — the same save would be refused again — and says to reload", () => {
      render(<ConflictModal {...makeProps({ brandFormat: true })} />);
      expect(screen.queryByRole("button", { name: /overwrite|replace/i })).toBeNull();
      expect(actionNames()).toEqual(["Save my edits to History", "Reload latest…"]);
      expect(screen.getByTestId("conflict-body").textContent).toMatch(/newer format/);
    });
  });

  describe("a style-model conflict (the site moved to classes after this tab loaded it)", () => {
    it("offers Reload only and says why", () => {
      render(<ConflictModal {...makeProps({ styleModel: true })} />);
      expect(screen.queryByRole("button", { name: /overwrite|replace/i })).toBeNull();
      expect(actionNames()).toEqual(["Save my edits to History", "Reload latest…"]);
      expect(screen.getByTestId("conflict-body").textContent).toMatch(/now uses classes/);
    });
  });

  it("a new conflict raised after a Keep whose reload was cancelled keeps work again", async () => {
    const { raiseSaveConflict, setBaselineLastEditedAt } = await import("@/services/BuildrikSyncProvider");
    render(<ConflictModal {...makeProps()} />);
    keepSave();
    raiseSaveConflict(new Error("SAVE_CONFLICT:2026-09-26T01:00:00.000Z"));
    keepUnsaved("s1", EMPTY_PROJECT, null);
    expect(readUnsaved("s1")).not.toBeNull();
    setBaselineLastEditedAt(null); // leave no hold behind for other tests
  });
});

describe("ConflictModal — restore variant only", () => {
  const restore = (over: Partial<ConflictModalProps> = {}) =>
    makeProps({ variant: "restore", relation: "unchanged", keptAt: new Date().toISOString(), ...over });

  /* Keep here does not reload: the user goes on editing the server's copy.
     Latching the discard stopped every later recovery copy for the rest of
     the session — offline, a held conflict, an expired session. */
  it("Keep drops the old copy but later unsaved work is still kept", () => {
    localStorage.setItem(KEY, kept());
    const p = restore({ relation: "server-newer" });
    render(<ConflictModal {...p} />);
    keepRestore();
    expect(p.onKeep).toHaveBeenCalledTimes(1);
    expect(readUnsaved("s1")).toBeNull();
    keepUnsaved("s1", EMPTY_PROJECT, null);
    expect(readUnsaved("s1")).not.toBeNull();
  });

  it("a version saved to History keeps the kept copy and the dialog", async () => {
    localStorage.setItem(KEY, kept());
    const p = restore({ relation: "server-newer" });
    render(<ConflictModal {...p} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save my edits to History" }));
    });
    expect(p.onSaveToHistory).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(KEY)).toBe(kept());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("edits made on the copy still on the server: Restore first, one step, no differences", () => {
    const p = restore();
    render(<ConflictModal {...p} />);
    expect(screen.getByRole("dialog", { name: "Some work never reached the server" })).toBeInTheDocument();
    const restoreBtn = screen.getByRole("button", { name: "Restore my edits" });
    expect(document.activeElement).toBe(restoreBtn);
    expect(screen.queryByRole("button", { name: /Replace/ })).toBeNull();
    expect(screen.queryByTestId("conflict-review-differences")).toBeNull();
    fireEvent.click(restoreBtn);
    expect(p.onReplace).toHaveBeenCalledTimes(1);
  });

  it("the restore confirm names what is kept first", () => {
    render(<ConflictModal {...restore({ relation: "server-newer" })} />);
    fireEvent.click(screen.getByRole("button", { name: "Replace with mine…" }));
    expect(screen.getByText("The newer version is kept in History as “Before restore” first. Then your edits replace it.")).toBeInTheDocument();
  });

  it("a record without a base asks plainly and offers the differences", () => {
    render(<ConflictModal {...restore({ relation: "unknown" })} />);
    expect(screen.getByRole("dialog", { name: "We can't confirm what changed since your edits" })).toBeInTheDocument();
    expect(screen.getByTestId("conflict-body").textContent).toMatch(/may have been saved since/);
    expect(screen.getByTestId("conflict-review-differences")).toBeInTheDocument();
  });

  it("names the viewer's own later save", () => {
    render(
      <ConflictModal
        {...restore({
          relation: "server-newer",
          server: { status: "ready", by: { name: "Me", isViewer: true }, at: null, differences: [] },
        })}
      />,
    );
    expect(screen.getByRole("dialog", { name: "You saved this site from another tab after these edits" })).toBeInTheDocument();
  });
});

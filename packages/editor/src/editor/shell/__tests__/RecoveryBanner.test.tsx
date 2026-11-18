/**
 * RecoveryBanner — the one surface for unsaved work kept from an earlier
 * visit (2L9 B7-G07–G10). Two sources speak here in the board's words: the
 * dashboard site's kept copy (published by the load path as a keptWorkOffer)
 * and the local draft's crash sentinel. What it offers follows the server's
 * last edit: older → Discard… / Restore my edits; newer or unknown → Download
 * my copy only.
 *
 * Rewritten 2026-10-26 (L-F S3): the old suite pinned "Recovered your work",
 * the page-count scope and "Keep changes", none of which the 2L9 board draws.
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup, waitFor, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RecoveryBanner, formatKeptAt } from "../RecoveryBanner";
import { setKeptWorkOffer } from "../keptWorkOffer";

vi.mock("@/services/unsavedRecovery", () => ({
  takeOffScreenUnsaved: vi.fn(() => null),
  clearUnsaved: vi.fn(),
  readUnsaved: vi.fn(() => null),
}));
import { clearUnsaved, takeOffScreenUnsaved } from "@/services/unsavedRecovery";

const SENTINEL = "buildrick:last-crash";
const OLD_SERVER = async () => new Date(0).toISOString();

function seedCrash(atMsAgo = 30_000) {
  sessionStorage.setItem(SENTINEL, JSON.stringify({ at: Date.now() - atMsAgo, source: "error", reason: "boom" }));
}

function offer(over: Partial<Parameters<typeof setKeptWorkOffer>[0] & object> = {}) {
  const restore = vi.fn();
  act(() =>
    setKeptWorkOffer({
      siteId: "site-1",
      at: "2026-09-28T10:12:00.000Z",
      project: { pages: [] } as never,
      restore,
      ...over,
    }),
  );
  return restore;
}

function renderBanner(props: Parameters<typeof RecoveryBanner>[0] = {}) {
  return render(<RecoveryBanner {...props} />);
}

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  act(() => setKeptWorkOffer(null));
  vi.clearAllMocks();
});

describe("RecoveryBanner — dashboard kept copy (G07–G10)", () => {
  it("server older: the board's line, Discard… and Restore my edits (G07)", async () => {
    offer();
    renderBanner({ localDraftShown: false, serverEditedAt: async () => "2026-09-28T09:00:00.000Z" });
    expect(await screen.findByText(/^Unsaved edits from your last visit \(.+\) were kept in this browser\. The site hasn’t changed since\.$/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Discard…" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Restore my edits" })).toBeInTheDocument();
  });

  it("Restore my edits runs the published restore once and the offer goes", async () => {
    const restore = offer();
    renderBanner({ localDraftShown: false, serverEditedAt: OLD_SERVER });
    fireEvent.click(await screen.findByRole("button", { name: "Restore my edits" }));
    expect(restore).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("recovery-banner")).toBeNull();
  });

  it("Discard… asks first (G10), Cancel keeps the copy", async () => {
    offer();
    renderBanner({ localDraftShown: false, serverEditedAt: OLD_SERVER });
    fireEvent.click(await screen.findByRole("button", { name: "Discard…" }));
    expect(await screen.findByText("Delete the kept copy?")).toBeInTheDocument();
    expect(screen.getByText("This can’t be undone. The site stays as it was last saved.")).toBeInTheDocument();
    await waitFor(() => expect((document.activeElement as HTMLElement | null)?.textContent).toBe("Cancel"));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(clearUnsaved).not.toHaveBeenCalled();
    expect(screen.getByTestId("recovery-banner")).toBeInTheDocument();
  });

  it("Delete copy hands the copy over and clears it — without latching later saves", async () => {
    offer();
    renderBanner({ localDraftShown: false, serverEditedAt: OLD_SERVER });
    fireEvent.click(await screen.findByRole("button", { name: "Discard…" }));
    fireEvent.click(await screen.findByRole("button", { name: "Delete copy" }));
    expect(takeOffScreenUnsaved).toHaveBeenCalledWith("site-1");
    expect(clearUnsaved).toHaveBeenCalledWith("site-1");
    await waitFor(() => expect(screen.queryByTestId("recovery-banner")).toBeNull());
  });

  it("server newer: Download my copy, no restore (G08, RT-10)", async () => {
    offer();
    renderBanner({ localDraftShown: false, serverEditedAt: async () => "2026-09-28T10:31:00.000Z" });
    expect(await screen.findByText(/^Someone saved this site after your copy was kept \(.+\)\. Your copy is still in this browser\.$/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Restore my edits" })).toBeNull();
    const createObjectURL = vi.fn(() => "blob:x");
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
    fireEvent.click(screen.getByRole("button", { name: "Download my copy" }));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
  });

  it("server unknown: its own line and Download my copy only (G09, P0-F)", async () => {
    offer();
    renderBanner({ localDraftShown: false, serverEditedAt: async () => null });
    expect(
      await screen.findByText("Couldn’t check the server version, so your kept copy can’t be restored safely right now."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Restore my edits" })).toBeNull();
    expect(screen.getByRole("button", { name: "Download my copy" })).toBeInTheDocument();
  });
});

describe("RecoveryBanner — local draft crash sentinel", () => {
  it("renders nothing when nothing was kept", () => {
    const { container } = renderBanner();
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the G07 line once the server is known older, and consumes the sentinel", async () => {
    seedCrash();
    renderBanner({ serverEditedAt: OLD_SERVER });
    expect(await screen.findByText(/^Unsaved edits from your last visit/)).toBeInTheDocument();
    expect(sessionStorage.getItem(SENTINEL)).toBeNull();
  });

  /* L5-074: on a dashboard site the screen is the SERVER copy unless the load failed. */
  it("stays hidden, and leaves the sentinel, while the screen shows the server copy", async () => {
    seedCrash();
    const { container } = renderBanner({ localDraftShown: false, serverEditedAt: OLD_SERVER });
    await new Promise((r) => setTimeout(r, 0));
    expect(container).toBeEmptyDOMElement();
    expect(sessionStorage.getItem(SENTINEL)).not.toBeNull();
  });

  it("shows once the local draft is what loaded (server load failed)", async () => {
    seedCrash();
    const { rerender } = renderBanner({ localDraftShown: false, serverEditedAt: OLD_SERVER });
    rerender(<RecoveryBanner localDraftShown serverEditedAt={OLD_SERVER} />);
    expect(await screen.findByText(/^Unsaved edits from your last visit/)).toBeInTheDocument();
  });

  it("Restore my edits keeps the draft that is already on screen", async () => {
    seedCrash();
    renderBanner({ serverEditedAt: OLD_SERVER });
    fireEvent.click(await screen.findByRole("button", { name: "Restore my edits" }));
    expect(screen.queryByTestId("recovery-banner")).toBeNull();
  });

  it("Delete copy clears the local draft and reloads", async () => {
    seedCrash();
    localStorage.setItem("buildrick-project", JSON.stringify({ project: {} }));
    const reload = vi.fn();
    renderBanner({ reloadFn: reload, serverEditedAt: OLD_SERVER });
    fireEvent.click(await screen.findByRole("button", { name: "Discard…" }));
    fireEvent.click(await screen.findByRole("button", { name: "Delete copy" }));
    expect(localStorage.getItem("buildrick-project")).toBeNull();
    expect(reload).toHaveBeenCalled();
  });

  /* The local draft is on screen; "can't be restored" would contradict it. */
  it.each([
    ["unknown", async () => null],
    ["newer", async () => new Date(Date.now() + 60_000).toISOString()],
  ])("stays hidden when the server is %s", async (_label, serverEditedAt) => {
    seedCrash();
    const { container } = renderBanner({ serverEditedAt });
    await new Promise((r) => setTimeout(r, 0));
    expect(container).toBeEmptyDOMElement();
  });
});

describe("formatKeptAt — the board's \"(today 10:12)\"", () => {
  const now = new Date(2026, 9, 26, 15, 0).getTime();
  it("today, yesterday, then a date", () => {
    expect(formatKeptAt(new Date(2026, 9, 26, 10, 12).getTime(), now)).toBe("today 10:12");
    expect(formatKeptAt(new Date(2026, 9, 25, 18, 40).getTime(), now)).toBe("yesterday 18:40");
    expect(formatKeptAt(new Date(2026, 10, 12, 9, 5).getTime(), now)).toBe("12 Nov 09:05");
  });
});

/**
 * RecoveryBanner (C6) — surfaces the previously-dead crash sentinel. On reopen
 * after a crash it tells the user their work was recovered (timestamp + scope)
 * and offers Keep / Discard-and-reload. No crash → nothing renders.
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RecoveryBanner } from "../RecoveryBanner";

const SENTINEL = "buildrick:last-crash";

function seedCrash(atMsAgo = 30_000) {
  sessionStorage.setItem(
    SENTINEL,
    JSON.stringify({ at: Date.now() - atMsAgo, source: "error", reason: "boom" }),
  );
}

function renderBanner(props: Parameters<typeof RecoveryBanner>[0] = {}) {
  return render(
    <RecoveryBanner pageCount={3} {...props} />,
  );
}

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});
afterEach(cleanup);

describe("RecoveryBanner", () => {
  it("renders nothing when there was no crash", () => {
    const { container } = renderBanner();
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a recovery banner after a crash, with scope, and clears the sentinel", async () => {
    seedCrash();
    /* P0-F (audit 2026-09-30): server state known AND older than the local copy
       is the only safe way to show the banner. Pass an old server clock so the
       banner reveals. */
    renderBanner({ serverEditedAt: async () => new Date(0).toISOString() });
    await waitFor(() => expect(screen.getByText(/recovered your work/i)).toBeInTheDocument());
    expect(screen.getByText(/3 pages/i)).toBeInTheDocument();
    // consuming the sentinel means a re-render / reload won't re-show it
    expect(sessionStorage.getItem(SENTINEL)).toBeNull();
  });

  /* L5-074: on a dashboard site the editor loads the SERVER copy; the local
     draft this banner describes is only loaded when that load fails. Shown over
     the server copy it said "Recovered your work … Keep changes" beside the
     toast saying "The version on screen is the server's" — and "Keep changes"
     kept nothing. */
  it("stays hidden, and leaves the sentinel, while the screen shows the server copy", async () => {
    seedCrash();
    const { container } = renderBanner({ localDraftShown: false, serverEditedAt: async () => new Date(0).toISOString() });
    await new Promise((r) => setTimeout(r, 0));
    expect(container).toBeEmptyDOMElement();
    expect(sessionStorage.getItem(SENTINEL)).not.toBeNull();
  });

  it("shows once the local draft is what loaded (server load failed)", async () => {
    seedCrash();
    const { rerender } = renderBanner({ localDraftShown: false, serverEditedAt: async () => new Date(0).toISOString() });
    rerender(<RecoveryBanner pageCount={3} localDraftShown serverEditedAt={async () => new Date(0).toISOString()} />);
    await waitFor(() => expect(screen.getByText(/recovered your work/i)).toBeInTheDocument());
  });

  it("Keep changes dismisses the banner", async () => {
    seedCrash();
    renderBanner({ serverEditedAt: async () => new Date(0).toISOString() });
    await waitFor(() => screen.getByText(/recovered your work/i));
    fireEvent.click(screen.getByRole("button", { name: /keep changes/i }));
    expect(screen.queryByText(/recovered your work/i)).not.toBeInTheDocument();
  });

  it("Discard & reload clears the local draft and reloads", async () => {
    seedCrash();
    localStorage.setItem("buildrick-project", JSON.stringify({ project: {} }));
    const reload = vi.fn();
    renderBanner({ reloadFn: reload, serverEditedAt: async () => new Date(0).toISOString() });
    await waitFor(() => screen.getByText(/recovered your work/i));
    fireEvent.click(screen.getByRole("button", { name: /discard/i }));
    expect(localStorage.getItem("buildrick-project")).toBeNull();
    expect(reload).toHaveBeenCalled();
  });

  it("stays hidden when the server state is unknown (P0-F safety inversion)", async () => {
    /* Audit 2026-09-30: previous default flipped on null to `serverNewer=false`,
       showing the banner on every network failure. Showing "Keep changes" then
       silently keeps local work over a server we couldn't reach — the inverse
       of the safe default. The banner must stay hidden until the server is
       reachable. */
    seedCrash();
    renderBanner({ serverEditedAt: async () => null });
    await waitFor(() => expect(screen.queryByRole("status", { name: /recovered work/i })).toBeNull());
  });

  it("stays hidden when the server holds newer work than the recovered copy (RT-10)", async () => {
    /* The crash happened at 10:00 UTC, but the server's last edit is 10:16 —
       offering "Keep changes" would stomp on the server's work. */
    sessionStorage.setItem(
      SENTINEL,
      JSON.stringify({ at: Date.parse("2026-09-28T10:00:00Z"), source: "error", reason: "boom" }),
    );
    renderBanner({ serverEditedAt: async () => "2026-09-28T10:16:00.000Z" });
    await waitFor(() => expect(screen.queryByRole("status", { name: /recovered work/i })).toBeNull());
  });

  it("still shows when the recovered copy is newer than the server", async () => {
    /* Sentinel is later than the server's last edit → local is the truth. */
    sessionStorage.setItem(
      SENTINEL,
      JSON.stringify({ at: Date.parse("2026-09-28T10:20:00Z"), source: "error", reason: "boom" }),
    );
    renderBanner({ serverEditedAt: async () => "2026-09-28T10:16:00.000Z" });
    expect(await screen.findByRole("status", { name: /recovered work/i })).toBeInTheDocument();
  });
});

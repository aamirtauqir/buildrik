// @vitest-environment jsdom
/**
 * Time-travel (4418:74736 / 76095): global ⌃⇧T, opens on the newest point,
 * steps back through this session, previews the REAL past state, and restores
 * only after saving the draft as a version.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, act } from "@testing-library/react";
import * as React from "react";

const renderProjectPages = vi.fn();
vi.mock("../exportPublishPages", () => ({ renderProjectPages: (...a: unknown[]) => renderProjectPages(...a) }));

import { TimeTravelHost } from "../TimeTravelHost";
import { EVENTS } from "@/shared/constants/events";

afterEach(() => {
  cleanup();
  renderProjectPages.mockReset();
});

function makeComposer() {
  const handlers: Record<string, (() => void)[]> = {};
  const t = Date.now();
  // getHistoryStack is newest-first.
  const stack = [
    { id: "e3", index: 3, timestamp: t, label: "Added Button", type: "patch", changes: [], userId: null },
    { id: "e2", index: 2, timestamp: t - 1000, label: "Added Text", type: "patch", changes: [], userId: null },
    { id: "e1", index: 1, timestamp: t - 2000, label: "Added Heading", type: "patch", changes: [], userId: null },
  ];
  return {
    on: (e: string, fn: () => void) => (handlers[e] ||= []).push(fn),
    off: () => {},
    emit: vi.fn(),
    fire: (e: string) => act(() => handlers[e]?.forEach((f) => f())),
    history: {
      getHistoryStack: () => stack,
      getEntrySnapshot: vi.fn((id: string) => ({ pages: [{ id: "p1" }], id })),
      restoreEntry: vi.fn(),
    },
    versions: { autoCheckpoint: vi.fn(() => Promise.resolve(null)) },
    elements: { getActivePage: () => ({ id: "p1" }) },
  };
}

const chord = () => fireEvent.keyDown(document, { key: "T", ctrlKey: true, shiftKey: true });

describe("TimeTravelHost", () => {
  it("⌃⇧T works with History closed: opens History, starts on the newest point, shows the live canvas", () => {
    const c = makeComposer();
    render(<TimeTravelHost composer={c as never} />);
    chord();
    const band = screen.getByTestId("tt-band");
    expect(band).toHaveAttribute("data-index", "2");
    expect(band).toHaveAttribute("data-count", "3");
    expect(screen.getByTestId("tt-band-text")).toHaveTextContent("Now — the draft as it is");
    expect(c.emit).toHaveBeenCalledWith(EVENTS.UI_PANEL_OPEN, { panel: "history", screen: "session" });
    expect(screen.queryByTestId("tt-preview")).toBeNull();
    chord();
    expect(screen.queryByTestId("tt-band")).toBeNull();
  });

  it("← steps back and previews that point's reconstructed state, rendered off the live composer", async () => {
    renderProjectPages.mockResolvedValue([{ path: "index.html", html: "<h1>then</h1>", name: "Home", slug: "" }]);
    const frameEl = document.createElement("div");
    frameEl.className = "buildrick-canvas";
    document.body.appendChild(frameEl);
    const c = makeComposer();
    render(<TimeTravelHost composer={c as never} />);
    c.fire(EVENTS.UI_TIME_TRAVEL_TOGGLE);
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(screen.getByTestId("tt-band")).toHaveAttribute("data-index", "0");
    expect(screen.getByTestId("tt-band-text")).toHaveTextContent(/Previewing .*Added Heading — nothing is written until you restore/);
    expect(c.history.getEntrySnapshot).toHaveBeenLastCalledWith("e1");
    await waitFor(() => expect(screen.getByTestId("tt-preview")).toHaveAttribute("data-status", "ready"));
    expect(c.history.restoreEntry).not.toHaveBeenCalled();
    frameEl.remove();
  });

  it("Restore… asks (76095), saves a version first, then restores that point", async () => {
    renderProjectPages.mockResolvedValue([]);
    const c = makeComposer();
    render(<TimeTravelHost composer={c as never} />);
    chord();
    expect(screen.getByTestId("tt-restore")).toBeDisabled();
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    fireEvent.click(screen.getByTestId("tt-restore"));
    expect(screen.getByTestId("tt-confirm")).toHaveTextContent("This discards 1 later change");
    fireEvent.click(screen.getByTestId("tt-confirm-restore"));
    await waitFor(() => expect(c.history.restoreEntry).toHaveBeenCalledWith("e2"));
    expect(c.versions.autoCheckpoint).toHaveBeenCalled();
    expect(screen.queryByTestId("tt-band")).toBeNull();
  });

  it("restoring with 2+ prior session edits exits Time-Travel immediately — no stale 'Previewing' band (flow-check DEF-history-restore-stale-banner)", async () => {
    renderProjectPages.mockResolvedValue([]);
    const c = makeComposer();
    render(<TimeTravelHost composer={c as never} />);
    chord();
    // 3 prior edits in this session (newest = index 2) — the ledger's repro
    // needed >=2 prior edits; a single-edit session reset correctly even
    // before this fix.
    expect(screen.getByTestId("tt-band")).toHaveAttribute("data-count", "3");
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    fireEvent.click(screen.getByTestId("tt-restore"));
    fireEvent.click(screen.getByTestId("tt-confirm-restore"));

    // The band and confirm must be gone RIGHT AWAY, not just once the
    // checkpoint/restore promises settle — this is what the stale banner
    // bug got wrong (the band kept saying "nothing is written until you
    // restore" and Restore… stayed enabled after the write had landed).
    expect(screen.queryByTestId("tt-band")).toBeNull();
    expect(screen.queryByTestId("tt-confirm")).toBeNull();

    await waitFor(() => expect(c.history.restoreEntry).toHaveBeenCalledWith("e2"));
    expect(c.versions.autoCheckpoint).toHaveBeenCalled();
    // Still gone after the async work resolves.
    expect(screen.queryByTestId("tt-band")).toBeNull();
  });

  it("Esc closes the confirm first, then time-travel", () => {
    renderProjectPages.mockResolvedValue([]);
    const c = makeComposer();
    render(<TimeTravelHost composer={c as never} />);
    chord();
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    fireEvent.keyDown(document, { key: "Enter" });
    expect(screen.getByTestId("tt-confirm")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("tt-confirm")).toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("tt-band")).toBeNull();
  });
});

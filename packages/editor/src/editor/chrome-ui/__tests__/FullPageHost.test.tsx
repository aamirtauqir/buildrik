/**
 * FullPageHost (design decision 14, BK-65): heading focus on entry, the
 * editor behind inert (topbar kept live), Tab stays inside, focus returns to
 * the opener on exit.
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FullPageHost } from "../FullPageHost";

function shell() {
  document.body.innerHTML = `
    <header class="layout-shell__topbar"><button id="pill">Saved</button></header>
    <nav class="layout-shell__rail"><button id="opener" aria-pressed="true">Settings</button></nav>
    <main class="layout-shell__canvas"><button id="canvas-btn">x</button></main>`;
}

beforeEach(shell);
afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

const flush = () => act(() => new Promise((r) => requestAnimationFrame(() => r(undefined))));

describe("FullPageHost", () => {
  it("focuses the heading, inerts the editor but not the topbar, traps Tab, returns focus", async () => {
    document.getElementById("opener")!.focus();
    const { unmount } = render(
      <FullPageHost data-testid="set-host">
        <h1>Settings</h1>
        <button>First</button>
        <button>Last</button>
      </FullPageHost>,
    );
    await flush();
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Settings" }));
    expect(document.querySelector(".layout-shell__canvas")!.hasAttribute("inert")).toBe(true);
    expect(document.querySelector(".layout-shell__rail")!.hasAttribute("inert")).toBe(true);
    expect(document.querySelector(".layout-shell__topbar")!.hasAttribute("inert")).toBe(false);
    expect(screen.getByTestId("set-host")).toHaveAttribute("data-bk-surface", "fullpage");

    const last = screen.getByRole("button", { name: "Last" });
    last.focus();
    fireEvent.keyDown(last, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "First" }));

    unmount();
    expect(document.querySelector(".layout-shell__canvas")!.hasAttribute("inert")).toBe(false);
    expect(document.activeElement).toBe(document.getElementById("opener"));
  });

  it("Brand's host keeps ⌘Z for tokens (D36)", () => {
    render(
      <FullPageHost data-testid="brand-host" history="tokens">
        <h1>Brand</h1>
      </FullPageHost>,
    );
    expect(screen.getByTestId("brand-host")).toHaveAttribute("data-bk-history", "tokens");
  });
});

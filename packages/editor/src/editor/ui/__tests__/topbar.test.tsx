/**
 * Topbar — contract tests against the Figma component (681:122).
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Topbar, SaveStatus, Presence, toneFor } from "../index";

describe("Topbar", () => {
  it("is a banner carrying the site name", () => {
    render(<Topbar siteName="Bella Cucina" save="saved" />);
    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByText("Bella Cucina")).toBeTruthy();
  });

  it("long names get a title attribute so the full name stays reachable", () => {
    const long = "Bella Cucina Trattoria & Wood-Fired Pizzeria — Northgate";
    render(<Topbar siteName={long} save="saved" />);
    expect(screen.getByText(long).getAttribute("title")).toBe(long);
  });

  it("publish=disabled blocks the click and explains itself", () => {
    const onPublish = vi.fn();
    render(
      <Topbar siteName="x" save="saved" publish="disabled" publishBlockedReason="Needs approval" onPublish={onPublish} />,
    );
    const btn = screen.getByRole("button", { name: "Publish" });
    expect(btn).toBeDisabled();
    expect(btn.getAttribute("title")).toBe("Needs approval");
    fireEvent.click(btn);
    expect(onPublish).not.toHaveBeenCalled();
  });

  it("publish=anyway renames the action rather than hiding the block", () => {
    render(<Topbar siteName="x" save="saved" publish="anyway" />);
    expect(screen.getByRole("button", { name: "Publish anyway" })).toBeTruthy();
  });

  it("the review pill appears only when a round is in flight", () => {
    const { rerender } = render(<Topbar siteName="x" save="saved" />);
    expect(screen.queryByText(/In review/)).toBeNull();
    rerender(<Topbar siteName="x" save="saved" review={{ label: "In review · 3 open", tone: "info" }} />);
    expect(screen.getByText("In review · 3 open")).toBeTruthy();
  });

  it("the review pill is a button only when it goes somewhere", () => {
    const onClick = vi.fn();
    const { rerender } = render(<Topbar siteName="x" save="saved" review={{ label: "Approved", tone: "success" }} />);
    expect(screen.queryByRole("button", { name: "Approved" })).toBeNull();
    rerender(
      <Topbar siteName="x" save="saved" review={{ label: "Approved", tone: "success", onClick }} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Approved" }));
    expect(onClick).toHaveBeenCalled();
  });

  it("the action slot replaces Publish entirely", () => {
    render(<Topbar siteName="x" save="saved" action={<button>Send for review</button>} />);
    expect(screen.getByRole("button", { name: "Send for review" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Publish" })).toBeNull();
  });

  it("the unread count is in the button name, not only the dot", () => {
    render(<Topbar siteName="x" save="saved" unreadCount={4} />);
    expect(screen.getByRole("button", { name: "Notifications, 4 unread" })).toBeTruthy();
  });
});

describe("SaveStatus", () => {
  it.each(["saving", "unsaved", "conflict", "offline"] as const)("renders the %s truth", (state) => {
    render(<SaveStatus state={state} />);
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("a conflict interrupts — everything else waits", () => {
    const { rerender } = render(<SaveStatus state="saved" savedAt={Date.now()} />);
    expect(screen.getByRole("status").getAttribute("aria-live")).toBe("polite");
    rerender(<SaveStatus state="conflict" />);
    expect(screen.getByRole("status").getAttribute("aria-live")).toBe("assertive");
    expect(screen.getByText("Conflict — reload")).toBeTruthy();
  });

  it("formats the saved timestamp", () => {
    render(<SaveStatus state="saved" savedAt={Date.now() - 120_000} />);
    expect(screen.getByText("Saved 2m ago")).toBeTruthy();
  });
});

describe("Presence", () => {
  const others = [
    { id: "u1", name: "Sara Ahmed", self: true },
    { id: "u2", name: "Imran Q." },
    { id: "u3", name: "Hina Raza" },
  ];

  it("renders nothing when you are alone and connected", () => {
    const { container } = render(<Presence users={[{ id: "u1", name: "Sara", self: true }]} />);
    expect(container.firstChild).toBeNull();
  });

  it("still speaks up when you are alone but offline", () => {
    render(<Presence users={[{ id: "u1", name: "Sara", self: true }]} connection="offline" />);
    expect(screen.getByText("Offline")).toBeTruthy();
  });

  it("shows an overflow badge past the max", () => {
    const many = [...others, { id: "u4", name: "Zoya M." }, { id: "u5", name: "Kamran" }];
    render(<Presence users={many} />);
    expect(screen.getByLabelText("2 more")).toBeTruthy();
  });

  it("offline is announced assertively — the user must not miss it", () => {
    render(<Presence users={others} connection="offline" />);
    expect(screen.getByRole("status").getAttribute("aria-live")).toBe("assertive");
  });

  it("tone is stable for the same id", () => {
    expect(toneFor("u2")).toBe(toneFor("u2"));
  });
});

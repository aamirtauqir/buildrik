/**
 * Topbar — contract tests against the Figma component (681:122).
 *
 * SaveStatus's describe block moved to `chrome-ui/__tests__/SaveStatus.test.tsx`
 * (Task 6, flowbite big-bang, Group B) when SaveStatus ported. Topbar/Presence
 * stay here until they port too (same batch, later in the sequence).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Topbar, Presence, toneFor } from "../index";

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

  it("publish=disabled blocks the click but stays focusable, with the reason in a tooltip", () => {
    const onPublish = vi.fn();
    render(
      <Topbar siteName="x" save="saved" publish="disabled" publishBlockedReason="Needs approval" onPublish={onPublish} />,
    );
    const btn = screen.getByRole("button", { name: "Publish" });
    expect(btn.getAttribute("aria-disabled")).toBe("true");
    expect(btn).not.toBeDisabled();
    expect(btn.getAttribute("title")).toBeNull();
    fireEvent.click(btn);
    expect(onPublish).not.toHaveBeenCalled();
    btn.focus();
    expect(btn).toHaveFocus();
    fireEvent.focus(btn);
    expect(screen.getByRole("tooltip").textContent).toBe("Needs approval");
  });

  it("Enter and Space on a blocked Publish are no-ops", () => {
    const onPublish = vi.fn();
    render(
      <Topbar siteName="x" save="saved" publish="disabled" publishBlockedReason="Needs approval" onPublish={onPublish} />,
    );
    const btn = screen.getByRole("button", { name: "Publish" });
    // Keyboard activation of a native button routes through click.
    fireEvent.keyDown(btn, { key: "Enter" });
    fireEvent.keyUp(btn, { key: " " });
    fireEvent.click(btn);
    expect(onPublish).not.toHaveBeenCalled();
  });

  it("publishBusy is truly disabled — a double-publish cannot fire", () => {
    const onPublish = vi.fn();
    const { rerender } = render(<Topbar siteName="x" save="saved" publish="ready" onPublish={onPublish} />);
    const btn = screen.getByRole("button", { name: "Publish" });
    fireEvent.click(btn);
    expect(onPublish).toHaveBeenCalledTimes(1);
    rerender(<Topbar siteName="x" save="saved" publish="ready" publishBusy onPublish={onPublish} />);
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(onPublish).toHaveBeenCalledTimes(1);
  });

  it("blocked + busy keeps native disabled — busy semantics protect", () => {
    render(
      <Topbar siteName="x" save="saved" publish="disabled" publishBusy publishBlockedReason="Needs approval" />,
    );
    const btn = screen.getByRole("button", { name: "Publish" });
    expect(btn).toBeDisabled();
    expect(btn.getAttribute("aria-disabled")).toBe("true");
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

  // ── tools cluster (plan §2, eng D12) ──────────────────────────────────────
  it("no tools, no cluster — the bar renders exactly what it receives", () => {
    render(<Topbar siteName="x" save="saved" />);
    expect(screen.queryByRole("button", { name: "Quick preview" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Comments" })).toBeNull();
  });

  it("the container composes the cluster: only passed fields render", () => {
    render(<Topbar siteName="x" save="saved" tools={{ onToggleComments: vi.fn() }} />);
    expect(screen.getByRole("button", { name: "Comments" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Quick preview" })).toBeNull();
  });

  it("previewBusy is disabled + aria-busy — re-clicks cannot stack exports", () => {
    const onPreview = vi.fn();
    render(<Topbar siteName="x" save="saved" tools={{ onPreview, previewBusy: true }} />);
    const btn = screen.getByRole("button", { name: "Quick preview" });
    expect(btn).toBeDisabled();
    expect(btn.getAttribute("aria-busy")).toBe("true");
    fireEvent.click(btn);
    expect(onPreview).not.toHaveBeenCalled();
  });

  it("Comments carries aria-pressed from the container's mirrored state", () => {
    const { rerender } = render(
      <Topbar siteName="x" save="saved" tools={{ onToggleComments: vi.fn(), commentsPressed: false }} />,
    );
    expect(screen.getByRole("button", { name: "Comments" }).getAttribute("aria-pressed")).toBe("false");
    rerender(
      <Topbar siteName="x" save="saved" tools={{ onToggleComments: vi.fn(), commentsPressed: true }} />,
    );
    expect(screen.getByRole("button", { name: "Comments" }).getAttribute("aria-pressed")).toBe("true");
  });

  // ── publish=published (plan D10, eng D11) ─────────────────────────────────
  it("published is the 2s success transient — disabled, restyled, honest label", () => {
    render(<Topbar siteName="x" save="saved" publish="published" />);
    const btn = screen.getByRole("button", { name: "✓ Published" });
    expect(btn).toBeDisabled();
    expect(btn.className).toContain("bk-topbar__published");
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

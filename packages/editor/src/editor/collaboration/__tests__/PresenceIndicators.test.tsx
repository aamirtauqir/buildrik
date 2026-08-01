/**
 * PresenceIndicators — the adapter's contract, not the organism's.
 *
 * What belongs here is the mapping: which users reach `Presence`, which
 * connection state they arrive with, and who is marked as you. The stacking,
 * overflow and pill copy are the organism's own tests (`ui/__tests__`).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { PresenceIndicators } from "../PresenceIndicators";
import type { CollaborationUser } from "@/shared/types/collaboration";

function makeUser(id: string, name: string, extra: Partial<CollaborationUser> = {}): CollaborationUser {
  return { id, name, color: "", lastActive: 0, ...extra };
}

describe("PresenceIndicators — MOCK_USERS fallback (pinned behavior)", () => {
  // PIN (2026-07-25, audit F2): the MOCK_USERS demo pair ("You" + "Ana") is
  // DEV-BUILD-ONLY (IS_DEV_BUILD). In any non-dev context — including this
  // test env — a disconnected session with zero users shows no collaborators.
  // Fake collaborators must never appear in production.
  it("invents no collaborators when disconnected with no users", () => {
    render(<PresenceIndicators users={[]} currentUser={null} state="disconnected" />);
    expect(screen.queryByRole("img")).toBeNull();
    // Offline is still announced — an empty room is not the same as a lost connection.
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });

  it("does NOT fall back to mock users when disconnected but real users exist", () => {
    render(
      <PresenceIndicators users={[makeUser("u1", "Real Person")]} currentUser={null} state="disconnected" />,
    );
    expect(screen.getByRole("img", { name: "Real Person" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Ana" })).toBeNull();
  });

  it("renders nothing at all when connected with zero users", () => {
    const { container } = render(<PresenceIndicators users={[]} currentUser={null} state="connected" />);
    expect(container.firstChild).toBeNull();
  });
});

describe("PresenceIndicators — connection states", () => {
  it("connecting and reconnecting both read as Reconnecting", () => {
    const { rerender } = render(
      <PresenceIndicators users={[makeUser("u1", "User One")]} currentUser={null} state="connecting" />,
    );
    expect(screen.getByText("Reconnecting…")).toBeInTheDocument();
    rerender(<PresenceIndicators users={[]} currentUser={null} state="reconnecting" />);
    expect(screen.getByText("Reconnecting…")).toBeInTheDocument();
  });

  it("keeps the collaborators visible while reconnecting", () => {
    // Hiding them mid-drop implies they left, which is a worse lie than a stale avatar.
    render(<PresenceIndicators users={[makeUser("u1", "User One")]} currentUser={null} state="connecting" />);
    expect(screen.getByRole("img", { name: "User One" })).toBeInTheDocument();
  });

  it("connected reports the head count", () => {
    render(
      <PresenceIndicators
        users={[makeUser("u1", "A B"), makeUser("u2", "C D")]}
        currentUser={null}
        state="connected"
      />,
    );
    expect(screen.getByText("2 editing")).toBeInTheDocument();
  });
});

describe("PresenceIndicators — who is shown", () => {
  const five = ["One", "Two", "Three", "Four", "Five"].map((n, i) => makeUser(`u${i + 1}`, `User ${n}`));

  it("passes maxVisible through to the overflow badge", () => {
    render(<PresenceIndicators users={five} currentUser={null} state="connected" />);
    expect(screen.getAllByRole("img")).toHaveLength(3);
    expect(screen.getByLabelText("2 more")).toBeInTheDocument();
  });

  it("respects a custom maxVisible", () => {
    render(
      <PresenceIndicators users={five.slice(0, 3)} currentUser={null} state="connected" maxVisible={1} />,
    );
    expect(screen.getAllByRole("img")).toHaveLength(1);
    expect(screen.getByLabelText("2 more")).toBeInTheDocument();
  });

  it("marks the avatar matching currentUser.id as you", () => {
    const me = makeUser("me", "Me Self");
    render(<PresenceIndicators users={[me, makeUser("u2", "Other Person")]} currentUser={me} state="connected" />);
    expect(screen.getByRole("img", { name: "Me Self" }).className).toContain("tw:outline-blue-700");
    expect(screen.getByRole("img", { name: "Other Person" }).className).not.toContain("tw:outline-blue-700");
  });

  it("uses the profile image when there is one, initials when there is not", () => {
    const { container } = render(
      <PresenceIndicators
        users={[makeUser("u1", "Pic User", { avatar: "https://example.com/a.png" }), makeUser("u2", "Jane Doe")]}
        currentUser={null}
        state="connected"
      />,
    );
    expect(container.querySelector("img")?.getAttribute("src")).toBe("https://example.com/a.png");
    expect(screen.getByRole("img", { name: "Jane Doe" }).textContent).toBe("JD");
  });

  it("colours avatars from the token ramp, never from a per-user hex", () => {
    // The old component carried its own Tailwind palette and honoured
    // `user.color`. One tone scale, derived from the id, is the whole point.
    render(
      <PresenceIndicators
        users={[makeUser("u1", "Colored User", { color: "rgb(1, 2, 3)" })]}
        currentUser={null}
        state="connected"
      />,
    );
    const avatar = screen.getByRole("img", { name: "Colored User" });
    expect(avatar.style.backgroundColor).toBe("");
    const initialsBubble = avatar.querySelector('[data-testid="flowbite-avatar-initials-placeholder"]');
    expect(initialsBubble?.className).toMatch(/tw:bg-(gray|blue|green|purple|yellow)-(100|200)/);
  });
});

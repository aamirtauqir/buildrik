import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { PresenceIndicators } from "../PresenceIndicators";
import type { CollaborationUser } from "../../../shared/types/collaboration";

function makeUser(
  id: string,
  name: string,
  extra: Partial<CollaborationUser> = {},
): CollaborationUser {
  return { id, name, color: "", lastActive: 0, ...extra };
}

describe("PresenceIndicators — MOCK_USERS fallback (pinned behavior)", () => {
  // PIN (2026-07-25, audit F2): the MOCK_USERS demo pair ("You" + "Ana") is
  // DEV-BUILD-ONLY (IS_DEV_BUILD). In any non-dev context — including this
  // test env — a disconnected session with zero users renders NOTHING.
  // Fake collaborators must never appear in production.
  it("renders nothing when disconnected with no users (no fake collaborators)", () => {
    const { container } = render(
      <PresenceIndicators users={[]} currentUser={null} state="disconnected" />,
    );

    expect(screen.queryByText("You")).not.toBeInTheDocument();
    expect(screen.queryByText("Ana")).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it("does NOT fall back to mock users when disconnected but real users exist", () => {
    render(
      <PresenceIndicators
        users={[makeUser("u1", "Real Person")]}
        currentUser={null}
        state="disconnected"
      />,
    );

    expect(screen.getByText("Real Person")).toBeInTheDocument();
    expect(screen.queryByText("Ana")).not.toBeInTheDocument();
  });

  it("renders nothing when connected with zero users (no mock fallback)", () => {
    const { container } = render(
      <PresenceIndicators users={[]} currentUser={null} state="connected" />,
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("PresenceIndicators — connecting/reconnecting spinner states", () => {
  it("shows Connecting... and no avatars while connecting", () => {
    render(
      <PresenceIndicators
        users={[makeUser("u1", "User One")]}
        currentUser={null}
        state="connecting"
      />,
    );
    expect(screen.getByText("Connecting...")).toBeInTheDocument();
    expect(screen.queryByText("User One")).not.toBeInTheDocument();
  });

  it("shows Reconnecting... while reconnecting", () => {
    render(<PresenceIndicators users={[]} currentUser={null} state="reconnecting" />);
    expect(screen.getByText("Reconnecting...")).toBeInTheDocument();
  });
});

describe("PresenceIndicators — avatar stacking + overflow", () => {
  const five = [
    makeUser("u1", "User One"),
    makeUser("u2", "User Two"),
    makeUser("u3", "User Three"),
    makeUser("u4", "User Four"),
    makeUser("u5", "User Five"),
  ];

  it("shows at most maxVisible (default 3) avatars plus a +N overflow badge", () => {
    render(<PresenceIndicators users={five} currentUser={null} state="connected" />);

    expect(screen.getByText("User One")).toBeInTheDocument();
    expect(screen.getByText("User Two")).toBeInTheDocument();
    expect(screen.getByText("User Three")).toBeInTheDocument();
    expect(screen.queryByText("User Four")).not.toBeInTheDocument();
    expect(screen.queryByText("User Five")).not.toBeInTheDocument();

    expect(screen.getByText("+2")).toBeInTheDocument();
    expect(screen.getByText("2 more collaborators")).toBeInTheDocument();
  });

  it("uses singular tooltip copy for a single overflow user", () => {
    render(
      <PresenceIndicators users={five.slice(0, 4)} currentUser={null} state="connected" />,
    );
    expect(screen.getByText("+1")).toBeInTheDocument();
    expect(screen.getByText("1 more collaborator")).toBeInTheDocument();
  });

  it("renders no overflow badge when users fit within maxVisible", () => {
    render(
      <PresenceIndicators users={five.slice(0, 3)} currentUser={null} state="connected" />,
    );
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });

  it("respects a custom maxVisible", () => {
    render(
      <PresenceIndicators
        users={five.slice(0, 3)}
        currentUser={null}
        state="connected"
        maxVisible={1}
      />,
    );
    expect(screen.getByText("User One")).toBeInTheDocument();
    expect(screen.queryByText("User Two")).not.toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });
});

describe("PresenceIndicators — real users rendering", () => {
  it("shows up to two initials per avatar", () => {
    render(
      <PresenceIndicators
        users={[makeUser("u1", "Jane Doe"), makeUser("u2", "Ana Belle Carter")]}
        currentUser={null}
        state="connected"
      />,
    );
    expect(screen.getByText("JD")).toBeInTheDocument();
    // Three name parts still clamp to 2 initials.
    expect(screen.getByText("AB")).toBeInTheDocument();
  });

  it("renders an <img> when the user has an avatar url", () => {
    render(
      <PresenceIndicators
        users={[makeUser("u1", "Pic User", { avatar: "https://example.com/a.png" })]}
        currentUser={null}
        state="connected"
      />,
    );
    const img = screen.getByAltText("Pic User") as HTMLImageElement;
    expect(img.tagName).toBe("IMG");
    expect(img.src).toBe("https://example.com/a.png");
  });

  it("rings the avatar matching currentUser.id", () => {
    const me = makeUser("me", "Me Self");
    render(
      <PresenceIndicators
        users={[me, makeUser("u2", "Other Person")]}
        currentUser={me}
        state="connected"
      />,
    );
    expect(screen.getByText("MS").style.outlineOffset).toBe("2px");
    expect(screen.getByText("OP").style.outlineOffset).not.toBe("2px");
  });

  it("prefers the user's provided color over the hashed palette color", () => {
    render(
      <PresenceIndicators
        users={[makeUser("u1", "Colored User", { color: "rgb(1, 2, 3)" })]}
        currentUser={null}
        state="connected"
      />,
    );
    expect(screen.getByText("CU").style.backgroundColor).toBe("rgb(1, 2, 3)");
  });
});

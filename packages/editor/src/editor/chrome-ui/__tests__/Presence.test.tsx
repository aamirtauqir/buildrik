/**
 * Presence — contract tests against the Figma component (692:472).
 *
 * Moved from `editor/ui/__tests__/topbar.test.tsx` (Task 6, flowbite
 * big-bang) when Presence ported to chrome-ui. No changes needed — already
 * role/text/label based, no bk-* class assertions.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Presence, toneFor } from "../Presence";

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

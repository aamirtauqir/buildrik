// @vitest-environment jsdom
/**
 * B5-D88…D97: the Link row's "Create collection page" — the page is made, the
 * editor stays on the Card's page with the Card selected; a link the server
 * did not take leaves the page and offers a link-only retry.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, renderHook, render, screen } from "@testing-library/react";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";

const make = vi.hoisted(() => ({
  buildCollectionPage: vi.fn(),
  saveCollectionLink: vi.fn(),
  retryCollectionLink: vi.fn(),
}));
vi.mock("../createCollectionPage", () => make);

import { useLinkRowCollectionPage } from "../useLinkRowCollectionPage";
import { unsavedCollectionLinks } from "../unsavedCollectionLinks";
import { recordPageReturn } from "../recordPageReturn";
import { RecordPageReturnRow } from "@/editor/inspector/components/RecordPageReturnRow";

const card = { id: "card", getCustomData: () => "Card", getType: () => "link" };
function composer() {
  let active = "home";
  return {
    elements: {
      getActivePage: () => ({ id: active, name: active === "home" ? "Home" : "Team profile" }),
      setActivePage: vi.fn((id: string) => { active = id; }),
      getElement: (id: string) => (id === "card" ? card : null),
    },
    selection: { select: vi.fn() },
  };
}
const team = { id: "team", name: "Team" } as never;
const choice = { plan: [], layout: "Profile", pattern: "/team/{slug}" } as never;
const wrapper = ({ children }: { children: React.ReactNode }) => <ToastProvider>{children}</ToastProvider>;

beforeEach(() => {
  vi.clearAllMocks();
  unsavedCollectionLinks.clear("team");
  recordPageReturn.reset();
  make.buildCollectionPage.mockResolvedValue({ pageId: "p-team", name: "Team profile", file: "team-profile.html" });
});

describe("useLinkRowCollectionPage", () => {
  it("makes the page, keeps the Card's page and selection, then reads ready", async () => {
    const c = composer();
    make.saveCollectionLink.mockResolvedValue(true);
    const { result } = renderHook(() => useLinkRowCollectionPage(c as never, team, "card"), { wrapper });
    await act(() => result.current.create(choice));
    expect(result.current.phase).toBe("ready");
    expect(result.current.pageName).toBe("Team profile");
    expect(c.selection.select).toHaveBeenCalledWith(card);
    expect(c.elements.getActivePage().id).toBe("home");
  });

  it("a link the server did not take: unlinked, and Retry saves the link only", async () => {
    const c = composer();
    make.saveCollectionLink.mockResolvedValue(false);
    const { result } = renderHook(() => useLinkRowCollectionPage(c as never, team, "card"), { wrapper });
    await act(() => result.current.create(choice));
    expect(result.current.phase).toBe("unlinked");
    make.retryCollectionLink.mockResolvedValue(true);
    await act(() => result.current.retry());
    expect(make.buildCollectionPage).toHaveBeenCalledTimes(1);
    expect(make.retryCollectionLink).toHaveBeenCalledWith(c, "team");
    expect(result.current.phase).toBe("ready");
  });

  it("Open page leaves a way back on the made page: '‹ Home · Team card' returns to the Card (B5-D98)", async () => {
    const c = composer();
    make.saveCollectionLink.mockResolvedValue(true);
    const { result } = renderHook(() => useLinkRowCollectionPage(c as never, team, "card"), { wrapper });
    await act(() => result.current.create(choice));
    fireEvent.click(screen.getByRole("button", { name: "Open page" }));
    expect(c.elements.getActivePage().id).toBe("p-team");
    expect(recordPageReturn.forPage("p-team")).toMatchObject({ originPageId: "home", originElementId: "card", label: "Home · Team card" });

    render(<RecordPageReturnRow composer={c as never} pageId="p-team" />);
    c.selection.select.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "‹ Home · Team card" }));
    expect(c.elements.getActivePage().id).toBe("home");
    expect(c.selection.select).toHaveBeenCalledWith(card);
    expect(recordPageReturn.forPage("p-team")).toBeNull();
    expect(screen.queryByTestId("inspector-record-page-return")).toBeNull();
  });
});

// @vitest-environment jsdom
/**
 * B5-D88…D97: the Link row's "Create collection page" — the page is made, the
 * editor stays on the Card's page with the Card selected; a link the server
 * did not take leaves the page and offers a link-only retry.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
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

const card = { id: "card" };
function composer() {
  let active = "home";
  return {
    elements: {
      getActivePage: () => ({ id: active }),
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
});

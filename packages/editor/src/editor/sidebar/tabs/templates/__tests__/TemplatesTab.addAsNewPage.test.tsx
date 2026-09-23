/**
 * "Add as new page" must land the template on the page it just made.
 *
 * The regression this locks: `createPage` adopts the new page only when there
 * is no active one (PageManager:87), so on any real site the import that
 * followed went to the page the user was looking at. Asking for a template as
 * a NEW page replaced the page they were on and left the new one empty.
 *
 * Walked live before the fix: Page 1 held "SaaS Landing", "Add as new page"
 * with Portfolio, and Page 1 came back as Portfolio.
 */
import * as React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/* Same boundary the other TemplatesTab suites stub: the panel calls useToast
   at the top of its body, and this test is about the apply order, not toasts. */
vi.mock("@/editor/chrome-ui", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/editor/chrome-ui");
  return {
    ...actual,
    useToast: () => ({ addToast: vi.fn(), removeToast: vi.fn(), toasts: [] }),
    ToastProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

import { TemplatesTab } from "../TemplatesTab";
import { SITE_TEMPLATES } from "../templatesData";

function makeComposer() {
  const calls: string[] = [];
  const created = { id: "page-new", name: "New" };
  return {
    calls,
    composer: {
      elements: {
        getActivePage: vi.fn(() => ({ id: "page-1", name: "Page 1", root: { id: "root-1" } })),
        getAllPages: vi.fn(() => [{ id: "page-1", name: "Page 1" }]),
        createPage: vi.fn(() => {
          calls.push("createPage");
          return created;
        }),
        setActivePage: vi.fn((id: string) => {
          calls.push(`setActivePage:${id}`);
        }),
        importHTMLToActivePage: vi.fn(() => {
          calls.push("import");
        }),
        recordAppliedTemplate: vi.fn(),
        getElement: vi.fn(() => null),
      },
      styles: { clear: vi.fn() },
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
  };
}

afterEach(cleanup);

describe("Templates — add as new page", () => {
  it("switches to the page it created BEFORE importing into it", async () => {
    const { calls, composer } = makeComposer();
    render(<TemplatesTab composer={composer as never} />);

    // Open a template's preview, then choose the new-page route.
    const first = SITE_TEMPLATES[0];
    /* The sidebar row opens the same preview as the grid card (decision #24).
       Test ids, not role queries: role + accessible-name resolution over the
       whole catalogue took ~8 s and timed this test out under load. */
    fireEvent.click(await screen.findByTestId(`tpl-ws-item-${first.id}`));
    /* The card opens the preview (decision #24); Create page is the new-page route. */
    fireEvent.click(await screen.findByText("Create page"));

    await waitFor(() => expect(calls).toContain("import"), { timeout: 5000 });

    expect(calls).toEqual(["createPage", "setActivePage:page-new", "import"]);
    // The import must never run while the old page is still the active one.
    expect(calls.indexOf("setActivePage:page-new")).toBeLessThan(calls.indexOf("import"));
  });
});

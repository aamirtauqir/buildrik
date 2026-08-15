/**
 * The create-page-from-template modals — board 1169:4725 (confirm · success ·
 * error), pinned by test because the flow has no route today: `newPageMode` is
 * turned on only by Pages › "From template", which renders only in the Pages
 * EMPTY state, and a project always has at least one page. The modals are
 * correct and unreachable; the ledger names the entry point as a founder call.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CreatePageConfirmModal,
  CreatePageSuccessModal,
  CreatePageErrorModal,
} from "../TemplatesTabModals";

afterEach(cleanup);

describe("create page from template (board 1169:4725)", () => {
  it("the question names the template, the answer names the page", () => {
    render(
      <CreatePageConfirmModal
        templateName="Bistro Menu"
        newPageName="Menu 2"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByText(/Create a page from ‘Bistro Menu’\?/)).toBeInTheDocument();
    expect(
      screen.getByText(/A new page ‘Menu 2’ will be added after your current pages\./),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create page" })).toBeInTheDocument();
  });

  /* "you're on it now" is only true because the apply switches to the page it
     created — see TemplatesTab.addAsNewPage.test.tsx. */
  it("success says which page exists and that you are already on it", () => {
    render(
      <CreatePageSuccessModal pageName="Menu 2" onClose={vi.fn()} onOpenPageSettings={vi.fn()} />,
    );
    expect(screen.getByText(/‘Menu 2’ is ready — you’re on it now\./)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open page settings" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
    // The old copy promised a trip the apply no longer needs.
    expect(screen.queryByRole("button", { name: /go to page/i })).not.toBeInTheDocument();
  });

  it("the failure reassures that nothing of theirs changed, and says what broke when it knows", () => {
    render(<CreatePageErrorModal onCancel={vi.fn()} onRetry={vi.fn()} />);
    expect(screen.getByText(/Couldn't create the page/)).toBeInTheDocument();
    expect(screen.getByText(/Your pages are unchanged\./)).toBeInTheDocument();

    cleanup();
    render(
      <CreatePageErrorModal reason="Template has no content." onCancel={vi.fn()} onRetry={vi.fn()} />,
    );
    expect(screen.getByText(/Template has no content\. Your pages are unchanged\./)).toBeInTheDocument();
  });
});

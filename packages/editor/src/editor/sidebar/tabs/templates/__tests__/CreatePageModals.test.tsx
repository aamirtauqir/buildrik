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

describe("create page from template (boards 1169:4725, 4418:54243)", () => {
  it("the question names the template, the answer names the page", () => {
    render(
      <CreatePageConfirmModal
        templateName="Bistro Menu"
        newPageName="Menu 2"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    /* Re-baseline: design-2l9 106:29182's question and copy. */
    expect(screen.getByText("Create Menu 2 from Bistro Menu?")).toBeInTheDocument();
    expect(
      screen.getByText("A new page will be created. Your other pages and Brand settings will stay unchanged."),
    ).toBeInTheDocument();
    expect(screen.getByText("After creation, Menu 2 opens in the Editor.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create page" })).toBeInTheDocument();
  });

  it("names site navigation only when the New-page choice adds it", () => {
    render(
      <CreatePageConfirmModal templateName="SaaS Landing" newPageName="Services" addToNavigation onCancel={vi.fn()} onConfirm={vi.fn()} />,
    );
    expect(
      screen.getByText("A new page will be created and added to site navigation. Your other pages and Brand settings will stay unchanged."),
    ).toBeInTheDocument();
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

  it("the failure reassures that nothing of theirs changed, and says what broke when it knows (2L9 222:47163)", () => {
    render(<CreatePageErrorModal onCancel={vi.fn()} onRetry={vi.fn()} />);
    expect(screen.getByText("Couldn’t create the page")).toBeInTheDocument();
    expect(screen.getByText("Nothing was changed. No empty page was left behind.")).toBeInTheDocument();
    expect(screen.queryByTestId("tpl-create-error-reason")).toBeNull();

    cleanup();
    render(
      <CreatePageErrorModal reason="Template has no content." onCancel={vi.fn()} onRetry={vi.fn()} />,
    );
    expect(screen.getByTestId("tpl-create-error-reason")).toHaveTextContent("Template has no content.");
  });
});

/* design-2l9 106:37032 — the create run names the page and, past the point
   of no return, says what it is doing instead of offering Cancel. */
describe("ApplyProgressOverlay — creating a page", () => {
  it("reads 'Creating Services…' with the keep-open note and the disabled status", async () => {
    const { ApplyProgressOverlay } = await import("../ApplyProgressOverlay");
    render(
      <ApplyProgressOverlay
        templateName="SaaS Landing"
        creating="Services"
        steps={[
          { id: "tokens", label: "Resolving brand tokens", state: "done" },
          { id: "import", label: "Importing template HTML", state: "active" },
        ]}
      />,
    );
    expect(screen.getByTestId("tpl-applying-title")).toHaveTextContent("Creating Services…");
    expect(screen.getByTestId("tpl-applying-sub")).toHaveTextContent("The page is being created and the template layout is being applied.");
    expect(screen.getByTestId("tpl-applying-note")).toHaveTextContent("Another creation cannot start while this operation is running.");
    expect(screen.getByTestId("tpl-applying-status")).toBeDisabled();
    expect(screen.getByTestId("tpl-applying-step-import")).toHaveTextContent("Importing template HTML — applying…");
  });
});

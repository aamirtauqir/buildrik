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

describe("ApplyProgressOverlay — preparing (107:31110)", () => {
  it("before the import: 'Preparing SaaS Landing…', still cancellable", async () => {
    const { ApplyProgressOverlay } = await import("../ApplyProgressOverlay");
    render(
      <ApplyProgressOverlay
        templateName="SaaS Landing"
        creating="Services"
        steps={[
          { id: "tokens", label: "Resolving brand tokens", state: "active" },
          { id: "import", label: "Importing template HTML", state: "queued" },
        ]}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByTestId("tpl-applying-title")).toHaveTextContent("Preparing SaaS Landing…");
    expect(screen.getByTestId("tpl-applying-sub")).toHaveTextContent("Preparing the template for Services. You can still cancel before import starts.");
    expect(screen.getByTestId("tpl-applying-note")).toHaveTextContent("Your other pages and Brand settings remain unchanged.");
    expect(screen.getByTestId("tpl-applying-cancel")).toBeInTheDocument();
  });
});

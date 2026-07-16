// @vitest-environment jsdom
/**
 * TemplateDetail — inline detail panel CTA + state tests.
 *
 * Verifies each CTA fires its callback, premium templates gate to an upgrade
 * button (no add-as-new-page / info note), the usage pill, and the
 * loading/error/applied preview states.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { TemplateDetail } from "../TemplateDetail";
import type { TemplateItem } from "../../templatesData";

const freeTpl: TemplateItem = {
  id: "t-free",
  name: "Free One",
  type: "hero",
  icon: "🎨",
  html: "<div/>",
  description: "A nice template",
  category: "site-pages",
  status: "free",
};

const premiumTpl: TemplateItem = { ...freeTpl, id: "t-pro", name: "Pro One", status: "premium" };

function renderDetail(props: Partial<React.ComponentProps<typeof TemplateDetail>> = {}) {
  const handlers = {
    onApplyToCurrent: vi.fn(),
    onAddAsNewPage: vi.fn(),
    onPreview: vi.fn(),
  };
  const utils = render(
    <TemplateDetail template={freeTpl} {...handlers} {...props} />
  );
  return { ...utils, ...handlers };
}

describe("TemplateDetail — content", () => {
  it("renders the title, description, and type/status meta pills", () => {
    renderDetail();
    expect(screen.getByText("Free One")).toBeTruthy();
    expect(screen.getByText("A nice template")).toBeTruthy();
    expect(screen.getByText("Hero")).toBeTruthy(); // typeLabel from type "hero"
    expect(screen.getByText("Free")).toBeTruthy(); // statusLabel
  });
});

describe("TemplateDetail — CTAs (free template)", () => {
  it("fires onApplyToCurrent from the primary button with the template id", () => {
    const { onApplyToCurrent } = renderDetail();
    fireEvent.click(screen.getByText("Apply to current page (current page)"));
    expect(onApplyToCurrent).toHaveBeenCalledTimes(1);
    expect(onApplyToCurrent).toHaveBeenCalledWith("t-free");
  });

  it("labels the primary CTA with the current page name when provided", () => {
    renderDetail({ currentPageName: "Home" });
    expect(screen.getByText("Apply to current page (Home)")).toBeTruthy();
  });

  it("fires onAddAsNewPage from the outline button", () => {
    const { onAddAsNewPage } = renderDetail();
    fireEvent.click(screen.getByText("Add as new page"));
    expect(onAddAsNewPage).toHaveBeenCalledTimes(1);
    expect(onAddAsNewPage).toHaveBeenCalledWith("t-free");
  });

  it("fires onAddAsNewPage from the info-note link", () => {
    const { onAddAsNewPage } = renderDetail();
    fireEvent.click(screen.getByText("Add as new page instead?"));
    expect(onAddAsNewPage).toHaveBeenCalledTimes(1);
    expect(onAddAsNewPage).toHaveBeenCalledWith("t-free");
  });

  it("fires onPreview from the preview button", () => {
    const { onPreview } = renderDetail();
    fireEvent.click(screen.getByText("Preview full-screen"));
    expect(onPreview).toHaveBeenCalledTimes(1);
    expect(onPreview).toHaveBeenCalledWith("t-free");
  });
});

describe("TemplateDetail — premium gating", () => {
  it("shows an upgrade button and hides add-as-new-page + info note", () => {
    const onApplyToCurrent = vi.fn();
    render(
      <TemplateDetail
        template={premiumTpl}
        onApplyToCurrent={onApplyToCurrent}
        onAddAsNewPage={vi.fn()}
        onPreview={vi.fn()}
      />
    );
    const upgrade = screen.getByText("🔒 Upgrade to use");
    fireEvent.click(upgrade);
    expect(onApplyToCurrent).toHaveBeenCalledWith("t-pro");
    expect(screen.queryByText("Add as new page")).toBeNull();
    expect(screen.queryByText("Add as new page instead?")).toBeNull();
    // Preview is still offered for premium templates.
    expect(screen.getByText("Preview full-screen")).toBeTruthy();
    expect(screen.getByText("Pro")).toBeTruthy();
  });
});

describe("TemplateDetail — usage pill", () => {
  it("shows a pluralized usage pill and fires onShowUsage on click", () => {
    const onShowUsage = vi.fn();
    renderDetail({ usageCount: 3, onShowUsage });
    const pill = screen.getByText("Used in 3 pages →");
    fireEvent.click(pill);
    expect(onShowUsage).toHaveBeenCalledTimes(1);
  });

  it("uses singular 'page' for a usage count of 1", () => {
    renderDetail({ usageCount: 1, onShowUsage: vi.fn() });
    expect(screen.getByText("Used in 1 page →")).toBeTruthy();
  });

  it("omits the usage pill when count is undefined or zero", () => {
    const { rerender } = renderDetail({ onShowUsage: vi.fn() });
    expect(screen.queryByText(/Used in/)).toBeNull();
    rerender(
      <TemplateDetail
        template={freeTpl}
        onApplyToCurrent={vi.fn()}
        onAddAsNewPage={vi.fn()}
        onPreview={vi.fn()}
        usageCount={0}
        onShowUsage={vi.fn()}
      />
    );
    expect(screen.queryByText(/Used in/)).toBeNull();
  });
});

describe("TemplateDetail — preview states", () => {
  it("renders a spinner while loading", () => {
    const { container } = renderDetail({ previewState: "loading" });
    expect(container.querySelector(".tpl-apply-spinner")).toBeTruthy();
  });

  it("renders the error state with a working Retry button", () => {
    const onPreviewRetry = vi.fn();
    renderDetail({ previewState: "error", onPreviewRetry });
    expect(screen.getByText("Preview unavailable")).toBeTruthy();
    fireEvent.click(screen.getByText("Retry"));
    expect(onPreviewRetry).toHaveBeenCalledTimes(1);
  });

  it("does not show the error state when ready", () => {
    renderDetail({ previewState: "ready" });
    expect(screen.queryByText("Preview unavailable")).toBeNull();
  });

  it("shows the APPLIED HERE badge only when applied to the current page and ready", () => {
    const { rerender } = renderDetail({ appliedToCurrentPage: true, previewState: "ready" });
    expect(screen.getByText("APPLIED HERE")).toBeTruthy();
    rerender(
      <TemplateDetail
        template={freeTpl}
        onApplyToCurrent={vi.fn()}
        onAddAsNewPage={vi.fn()}
        onPreview={vi.fn()}
        appliedToCurrentPage={false}
      />
    );
    expect(screen.queryByText("APPLIED HERE")).toBeNull();
  });
});

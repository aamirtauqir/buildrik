// @vitest-environment jsdom
/**
 * PublishTab — pre-publish readiness checks.
 *
 * Companion to PublishTab.test.tsx (which covers SEO readiness text +
 * canonical publish wiring). This file covers the checks-computation logic:
 * the "pages" check now reads the real pages API, all 7 computed checks
 * render, plus honest coverage of the settings-driven checks that vary.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import type { PublishTabProps } from "../PublishTab";

vi.mock("@/editor/ui", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/editor/ui");
  return {
    ...actual,
    useToast: () => ({ addToast: vi.fn(), removeToast: vi.fn(), toasts: [] }),
    ToastProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

import { PublishTab } from "../PublishTab";

type ComposerProp = PublishTabProps["composer"];

/** Minimal composer exposing the surface PublishTab's checks read. */
function composerWith(
  seo: Record<string, unknown> = {},
  extra: Record<string, unknown> = {}
): ComposerProp {
  return {
    getProjectSettings: () => ({ seo }),
    elements: {
      getActivePage: () => null,
      getElement: () => null,
    },
    ...extra,
  } as unknown as ComposerProp;
}

describe("PublishTab — pages check reflects the real page count", () => {
  // FIXED §2-B2: the check now reads the real pages API
  // (composer.elements.getAllPages), so an empty project reads "incomplete"
  // instead of falsely green. The old code read a nonexistent `composer.pages`
  // bag and fell through to `return true`.
  it("renders 'At least 1 page' as incomplete when the project reports zero pages", () => {
    const composer = composerWith({}, {
      elements: { getAllPages: () => [], getActivePage: () => null, getElement: () => null },
    });
    render(<PublishTab composer={composer} />);
    expect(screen.getByLabelText("At least 1 page: incomplete")).toBeTruthy();
  });

  it("renders 'At least 1 page' as complete once the project has pages", () => {
    const composer = composerWith({}, {
      elements: {
        getAllPages: () => [{ id: "p1" }],
        getActivePage: () => null,
        getElement: () => null,
      },
    });
    render(<PublishTab composer={composer} />);
    expect(screen.getByLabelText("At least 1 page: complete")).toBeTruthy();
  });

  it("renders 'At least 1 page' as incomplete with no composer at all", () => {
    render(<PublishTab composer={null} />);
    expect(screen.getByLabelText("At least 1 page: incomplete")).toBeTruthy();
  });
});

describe("PublishTab — all 7 computed checks are rendered", () => {
  // FIXED: the checks useMemo computes 7 booleans (hasContent, hasPageTitle,
  // hasFavicon, hasPages, hasSeoTitle, hasMetaDesc, hasSocialImg) and the
  // checklist now renders a row for every one — hasContent and hasSocialImg
  // are no longer computed-then-dropped.
  it("renders exactly 7 checklist rows", () => {
    const { container } = render(<PublishTab composer={composerWith()} />);
    // Every ChecklistItem carries aria-label `<label>: (in)complete`; both
    // suffixes end in "complete". StatusBadge ends in "Published"/"Draft".
    const rows = container.querySelectorAll('[aria-label$="complete"]');
    expect(rows.length).toBe(7);
  });

  it("renders all 7 checklist labels, including the previously-dropped two", () => {
    render(<PublishTab composer={composerWith()} />);
    expect(screen.getByText("Page title set")).toBeTruthy();
    expect(screen.getByText("Favicon uploaded")).toBeTruthy();
    expect(screen.getByText("At least 1 page")).toBeTruthy();
    expect(screen.getByText("SEO title set")).toBeTruthy();
    expect(screen.getByText("Meta description added")).toBeTruthy();
    // hasContent / hasSocialImg now each have a checklist row.
    expect(screen.getByText("Page has content")).toBeTruthy();
    expect(screen.getByText("Social share image")).toBeTruthy();
  });
});

describe("PublishTab — settings-driven checks (honest)", () => {
  it("Page title check reflects seo.siteName", () => {
    const { rerender } = render(
      <PublishTab composer={composerWith({ siteName: "My Site" })} />
    );
    expect(screen.getByLabelText("Page title set: complete")).toBeTruthy();

    rerender(<PublishTab composer={composerWith({ siteName: "   " })} />);
    expect(screen.getByLabelText("Page title set: incomplete")).toBeTruthy();
  });

  it("Favicon check reflects seo.favicon", () => {
    const { rerender } = render(
      <PublishTab composer={composerWith({ favicon: "/favicon.ico" })} />
    );
    expect(screen.getByLabelText("Favicon uploaded: complete")).toBeTruthy();

    rerender(<PublishTab composer={composerWith({})} />);
    expect(screen.getByLabelText("Favicon uploaded: incomplete")).toBeTruthy();
  });

  it("SEO title + meta description checks reflect their settings", () => {
    const { rerender } = render(
      <PublishTab
        composer={composerWith({ metaTitle: "Title", metaDescription: "Desc" })}
      />
    );
    expect(screen.getByLabelText("SEO title set: complete")).toBeTruthy();
    expect(screen.getByLabelText("Meta description added: complete")).toBeTruthy();

    rerender(<PublishTab composer={composerWith({})} />);
    expect(screen.getByLabelText("SEO title set: incomplete")).toBeTruthy();
    expect(screen.getByLabelText("Meta description added: incomplete")).toBeTruthy();
  });
});

// @vitest-environment jsdom
/**
 * PublishTab — pre-publish readiness checks.
 *
 * Companion to PublishTab.test.tsx (which covers SEO readiness text +
 * canonical publish wiring). This file pins the checks-computation logic:
 * the two KNOWN quirks (always-green "pages" check; 7-computed-vs-5-rendered)
 * plus honest coverage of the settings-driven checks that actually vary.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import type { PublishTabProps } from "../PublishTab";

vi.mock("@/editor/shared/vibcoder", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/editor/shared/vibcoder");
  return {
    ...actual,
    useToast: () => ({ addToast: vi.fn(), removeToast: vi.fn(), toasts: [] }),
    ToastProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

vi.mock("@/shared/extensions/PanelHeader", () => ({
  PanelHeader: ({ title }: { title: string }) => {
    const React = require("react");
    return React.createElement("div", { "data-testid": "panel-header" }, title);
  },
}));

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

describe("PublishTab — KNOWN §2-B2 (pin): pages check is always green", () => {
  // KNOWN §2-B2 (pin): pages check is always green — do not fix without product decision.
  // The check reads `composer.pages.getAll`, an API the real Composer does not
  // expose (pages live under `composer.elements`), so it falls through to
  // `return true` regardless of how many pages actually exist — even zero.
  it("renders 'At least 1 page' as complete even when the project reports zero pages", () => {
    // getAllPages returns [] here, yet the check never consults it, so it stays green.
    const composer = composerWith({}, {
      elements: { getAllPages: () => [], getActivePage: () => null, getElement: () => null },
    });
    render(<PublishTab composer={composer} />);
    expect(screen.getByLabelText("At least 1 page: complete")).toBeTruthy();
  });

  it("renders 'At least 1 page' as complete even with no composer at all", () => {
    render(<PublishTab composer={null} />);
    expect(screen.getByLabelText("At least 1 page: complete")).toBeTruthy();
  });
});

describe("PublishTab — KNOWN (pin): 7 checks computed, 5 rendered", () => {
  // KNOWN (pin): the checks useMemo computes 7 booleans (hasContent,
  // hasPageTitle, hasFavicon, hasPages, hasSeoTitle, hasMetaDesc, hasSocialImg)
  // but the checklist renders only 5 rows — hasContent and hasSocialImg are
  // computed and then never displayed. Pin the current rendered count.
  it("renders exactly 5 checklist rows", () => {
    const { container } = render(<PublishTab composer={composerWith()} />);
    // Every ChecklistItem carries aria-label `<label>: (in)complete`; both
    // suffixes end in "complete". StatusBadge ends in "Published"/"Draft".
    const rows = container.querySelectorAll('[aria-label$="complete"]');
    expect(rows.length).toBe(5);
  });

  it("renders the 5 known checklist labels and no row for the 2 unrendered checks", () => {
    render(<PublishTab composer={composerWith()} />);
    expect(screen.getByText("Page title set")).toBeTruthy();
    expect(screen.getByText("Favicon uploaded")).toBeTruthy();
    expect(screen.getByText("At least 1 page")).toBeTruthy();
    expect(screen.getByText("SEO title set")).toBeTruthy();
    expect(screen.getByText("Meta description added")).toBeTruthy();
    // hasContent / hasSocialImg have no checklist row.
    expect(screen.queryByText(/social image/i)).toBeNull();
    expect(screen.queryByText(/has content/i)).toBeNull();
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

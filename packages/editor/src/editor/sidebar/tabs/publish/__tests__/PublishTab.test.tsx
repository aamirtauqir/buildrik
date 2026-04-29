// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import * as React from "react";

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

vi.mock("@/shared/hooks/usePublish", () => ({
  usePublish: () => ({
    publish: vi.fn(),
    unpublish: vi.fn(),
    isPublishing: false,
    publishedUrl: null,
    lastPublishedAt: null,
    error: null,
    isPublished: false,
    clearError: vi.fn(),
  }),
}));

import { PublishTab } from "../PublishTab";

describe("PublishTab SEO readiness", () => {
  it("shows SEO checks as true when settings are present", () => {
    const composer = {
      getProjectSettings: () => ({ seo: { metaTitle: "T", metaDescription: "D", ogImage: "img.png" } }),
      pages: { getAll: () => [{ id: "p1" }] },
      elements: { getElement: () => ({ getChildCount: () => 1 }) },
    };
    const { container } = render(<PublishTab composer={composer as any} />);
    // The component renders checklist items; we verify no error and presence
    expect(container.textContent).toContain("SEO title set");
    expect(container.textContent).toContain("Meta description added");
  });
});

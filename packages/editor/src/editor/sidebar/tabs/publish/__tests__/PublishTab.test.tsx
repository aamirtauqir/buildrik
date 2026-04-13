import * as React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../shared/ui/Toast", () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock("../../../../../shared/hooks/usePublish", () => ({
  usePublish: () => ({
    publish: vi.fn(),
    unpublish: vi.fn(),
    isPublishing: false,
    publishedUrl: "https://acme.com",
    lastPublishedAt: null,
    error: null,
    isPublished: true,
    clearError: vi.fn(),
  }),
}));

vi.mock("../../../shared/PanelHeader", () => ({
  PanelHeader: ({ title }: { title: string }) => <div>{title}</div>,
}));

import { PublishTab } from "../PublishTab";

function makeComposer() {
  return {
    getProjectSettings: vi.fn(() => ({
      seo: { siteName: "Acme" },
      publishing: {
        defaultDomain: "project.builder.aquibra.com",
        customDomain: {
          hostname: "acme.com",
          status: "connected",
          dnsTarget: "builder.aquibra.com",
          sslStatus: "active",
        },
      },
    })),
    on: vi.fn(),
    off: vi.fn(),
    elements: {
      getActivePage: vi.fn(() => ({ root: { id: "root-1" } })),
      getElement: vi.fn(() => ({ getChildCount: () => 1 })),
    },
    pages: {
      getAll: vi.fn(() => [{ id: "page-1" }]),
    },
  };
}

describe("PublishTab", () => {
  it("shows connected custom domain in publish panel", () => {
    render(
      <PublishTab
        composer={makeComposer() as never}
        projectId="proj_123"
        isProjectPublished
      />
    );

    expect(screen.getAllByText(/acme\.com/i)).toHaveLength(2);
    expect(screen.getByText(/publishing to/i)).toHaveTextContent("acme.com");
  });
});

import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { TemplateUsageDrawer } from "../TemplateUsageDrawer";

const sampleUsage = [
  { pageId: "p1", pageName: "Home", appliedAt: "2026-05-08T10:00:00Z" },
  { pageId: "p2", pageName: "About", appliedAt: "2026-05-07T09:00:00Z", version: "1.2.0" },
];

describe("TemplateUsageDrawer", () => {
  it("renders nothing when not open", () => {
    const { container } = render(
      <TemplateUsageDrawer
        open={false}
        onOpenChange={() => {}}
        templateId="t1"
        templateName="Hero"
        usage={[]}
      />
    );
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("shows 'Used in' tab by default with the usage list", () => {
    const { getByText } = render(
      <TemplateUsageDrawer
        open
        onOpenChange={() => {}}
        templateId="t1"
        templateName="Hero"
        usage={sampleUsage}
      />
    );
    expect(getByText("Used in")).toBeTruthy();
    expect(getByText("Home")).toBeTruthy();
    expect(getByText("About")).toBeTruthy();
  });

  it("shows version chip when a usage has a version", () => {
    const { getByText } = render(
      <TemplateUsageDrawer
        open
        onOpenChange={() => {}}
        templateId="t1"
        templateName="Hero"
        usage={sampleUsage}
      />
    );
    expect(getByText(/1\.2\.0/)).toBeTruthy();
  });

  it("shows empty state when usage list is empty", () => {
    const { getByText } = render(
      <TemplateUsageDrawer
        open
        onOpenChange={() => {}}
        templateId="t1"
        templateName="Hero"
        usage={[]}
      />
    );
    expect(getByText(/not applied to any page/i)).toBeTruthy();
  });

  it("clicking a page row calls onJumpToPage with pageId", () => {
    const onJumpToPage = vi.fn();
    const { getByText } = render(
      <TemplateUsageDrawer
        open
        onOpenChange={() => {}}
        templateId="t1"
        templateName="Hero"
        usage={sampleUsage}
        onJumpToPage={onJumpToPage}
      />
    );
    fireEvent.click(getByText("Home"));
    expect(onJumpToPage).toHaveBeenCalledWith("p1");
  });

  it("Versions tab renders the P9-pending placeholder", () => {
    const { getByText } = render(
      <TemplateUsageDrawer
        open
        onOpenChange={() => {}}
        templateId="t1"
        templateName="Hero"
        usage={[]}
      />
    );
    fireEvent.click(getByText("Versions"));
    expect(getByText(/version pinning is coming/i)).toBeTruthy();
  });

  it("close button calls onOpenChange(false)", () => {
    const onOpenChange = vi.fn();
    const { getByLabelText } = render(
      <TemplateUsageDrawer
        open
        onOpenChange={onOpenChange}
        templateId="t1"
        templateName="Hero"
        usage={[]}
      />
    );
    fireEvent.click(getByLabelText(/close drawer/i));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

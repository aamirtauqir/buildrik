/**
 * L2-014 (editor audit 2026-10-08): the preview iframe got the template's raw
 * HTML, so a saved template's {{token…}} placeholders reached the browser as
 * invalid colours — primary CTAs grey with invisible text. The preview now
 * resolves them the way apply does.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { TemplatePreview } from "../TemplatePreview";
import type { TemplateItem } from "../templatesData";

describe("TemplatePreview — token placeholders", () => {
  it("the iframe gets resolved values, not {{token…}} placeholders", () => {
    render(
      <TemplatePreview
        template={{ id: "t", name: "Saved", html: '<a style="background:{{token.color.primary}}">Book</a>' } as TemplateItem}
        onCreatePage={vi.fn()}
        onReplacePage={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    const doc = screen.getByTitle("Preview: Saved").getAttribute("srcdoc") ?? "";
    expect(doc).toContain("Book");
    expect(doc).not.toContain("{{token.");
  });
});

/* design-2l9 105:29094: a New-page visit makes that page — no Replace page…;
   Desktop · Tablet · Mobile set the preview width, one picked. */
describe("TemplatePreview — creating a page", () => {
  const t = { id: "t", name: "SaaS Landing", html: "<p>x</p>" } as TemplateItem;
  it("offers Create page alone while creating", () => {
    render(<TemplatePreview template={t} creating onCreatePage={vi.fn()} onReplacePage={vi.fn()} onBack={vi.fn()} />);
    expect(screen.queryByTestId("tpl-ws-replace")).toBeNull();
    expect(screen.getByRole("button", { name: "Create page" })).toBeTruthy();
  });

  it("the width row picks one device", async () => {
    const { fireEvent } = await import("@testing-library/react");
    render(<TemplatePreview template={t} onCreatePage={vi.fn()} onReplacePage={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByTestId("tpl-ws-viewport-desktop").getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByTestId("tpl-ws-viewport-tablet"));
    expect(screen.getByTestId("tpl-ws-viewport-tablet").getAttribute("aria-pressed")).toBe("true");
    expect((screen.getByTitle("Preview: SaaS Landing") as HTMLIFrameElement).style.width).toBe("768px");
  });
});

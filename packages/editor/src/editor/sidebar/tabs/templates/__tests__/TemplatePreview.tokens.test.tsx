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

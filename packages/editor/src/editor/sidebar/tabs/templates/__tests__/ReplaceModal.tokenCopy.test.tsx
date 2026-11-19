/**
 * L2-026 (editor audit 2026-10-08): the Replace confirm said "your brand
 * tokens are not applied" for every template, while a template saved from a
 * page carries {{token…}} placeholders that apply DOES resolve to this site's
 * brand (resolveTemplateTokens). The sentence follows the template now.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { ReplaceModal } from "../TemplatesTabModals";
import type { TemplateItem } from "../templatesData";

const modal = (html: string) =>
  render(
    <ReplaceModal
      template={{ id: "t", name: "Bistro", html } as TemplateItem}
      currentPageName="Home"
      currentPageCount={3}
      backupCurrentPage={false}
      onBackupChange={vi.fn()}
      onCancel={vi.fn()}
      onApply={vi.fn()}
    />,
  );

describe("ReplaceModal — what happens to brand tokens", () => {
  it("names the page, the template and what is removed (2L9 223:44891)", () => {
    modal("<section>Hi</section>");
    expect(screen.getByText("Replace Home with Bistro?")).toBeTruthy();
    expect(screen.getByText(/Home’s 3 elements are removed and replaced\./)).toBeTruthy();
    expect(screen.getByText("Save a backup first (History › Saves)")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Replace Home" })).toBeTruthy();
  });

  it("a template with raw colours (an older saved one) brings its own colours", () => {
    modal('<section style="color:#111827">Hi</section>');
    expect(screen.getByText(/Bistro has its own colors and fonts — your Brand is not changed\./)).toBeTruthy();
  });

  it("a template authored on the Brand tokens' var()s (L4-024) picks up this site's brand", () => {
    modal('<section style="color:var(--buildrick-design-color-text)">Hi</section>');
    expect(screen.getByText(/Bistro uses this site’s Brand colors and fonts — your Brand is not changed\./)).toBeTruthy();
  });

  it("a saved template (token placeholders) picks up this site's brand", () => {
    modal('<section style="color:{{token.color.primary}}">Hi</section>');
    expect(screen.getByText(/Bistro uses this site’s Brand colors and fonts — your Brand is not changed\./)).toBeTruthy();
    expect(screen.queryByText(/has its own colors/)).toBeNull();
  });
});

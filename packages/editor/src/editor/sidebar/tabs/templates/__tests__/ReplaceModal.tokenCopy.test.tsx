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
  it("a built-in template (raw colours) brings its own colours", () => {
    modal('<section style="color:#111827">Hi</section>');
    expect(screen.getByText(/brings its own colours and type/)).toBeTruthy();
  });

  it("a saved template (token placeholders) picks up this site's brand", () => {
    modal('<section style="color:{{token.color.primary}}">Hi</section>');
    expect(screen.getByText(/takes this site’s brand colours and type/)).toBeTruthy();
    expect(screen.queryByText(/brand tokens are not/)).toBeNull();
  });
});

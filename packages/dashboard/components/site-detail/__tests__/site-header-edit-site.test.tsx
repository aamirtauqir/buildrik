/**
 * L1-025 (owner 2026-10-10): the site Overview's primary action is "Edit
 * site". It used to be reachable only as More → "Edit in Editor".
 */
import type * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { UnifiedEditorFlagContext } from "@/components/editor-route/unified-flag";

vi.mock("@lib/trpc/client", async () => (await import("@/components/__test-utils__/trpc-stub")).trpcStub());
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(), useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/dashboard/toast-provider", () => ({ useToast: () => ({ addToast: vi.fn() }) }));

import { SiteHeader } from "../site-header";
import { Button, ButtonLink } from "@/components/dashboard/primitives";

/* The primitives carry no variant attribute; a variant is its class list. */
function classesOf(node: React.ReactElement): string {
  const { container, unmount } = render(node);
  const cls = (container.firstElementChild as HTMLElement).className;
  unmount();
  return cls;
}

const site = { id: "site-9", name: "Bella", slug: "bella", status: "DRAFT", publishedUrl: null };

describe("SiteHeader — Edit site", () => {
  it("is a visible link to the editor, styled as the primary action", () => {
    const primary = classesOf(<ButtonLink href="/x">x</ButtonLink>);
    const ghost = classesOf(<Button variant="ghost">x</Button>);
    render(
      <UnifiedEditorFlagContext.Provider value={true}>
        <SiteHeader site={site} onPublish={vi.fn()} />
      </UnifiedEditorFlagContext.Provider>,
    );
    const edit = screen.getByRole("link", { name: /Edit site/ });
    expect(edit).toHaveAttribute("href", "/edit/site-9");
    expect(edit.className).toBe(primary);
    /* One primary per header: Publish steps down beside it, and More no
       longer repeats the action. */
    expect(screen.getByRole("button", { name: "Publish" }).className).toBe(ghost);
    expect(screen.queryByText("Edit in Editor")).toBeNull();
  });
});

// @vitest-environment jsdom
/**
 * A-26 (2L9 187:22071): "Collection link not saved" on the page panel while
 * L-A's unsaved-link state holds the page, gone when it lands; Retry opens
 * the collection's Dynamic pages.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { unsavedCollectionLinks } from "@/editor/cms/unsavedCollectionLinks";
import { cmsWorkspace } from "@/editor/cms/cmsWorkspaceStore";
import { UnsavedLinkNotice } from "../UnsavedLinkNotice";

afterEach(() => {
  cleanup();
  unsavedCollectionLinks.reset();
});

describe("UnsavedLinkNotice", () => {
  it("shows while the page's link is unsaved, opens Dynamic pages on Retry, and clears with the link", () => {
    const emit = vi.fn();
    const open = vi.spyOn(cmsWorkspace, "openRequest");
    render(<UnsavedLinkNotice composer={{ emit } as never} pageId="p1" />);
    expect(screen.queryByTestId("inspector-unsaved-link")).toBeNull();
    act(() => unsavedCollectionLinks.set({ collectionId: "blog", collectionName: "Blog", pageId: "p1", name: "Blog post", file: "blog-post.html", pattern: "{slug}" }));
    expect(screen.getByTestId("inspector-unsaved-link")).toHaveTextContent("Collection link not savedThe page is safe here. Retry the link in CMS.Retry in CMS ›");
    fireEvent.click(screen.getByTestId("inspector-unsaved-link-retry"));
    expect(open).toHaveBeenCalledWith({ collectionId: "blog", tab: "dynamic-pages" });
    expect(emit).toHaveBeenCalledWith("panel:open", { panel: "content" });
    act(() => unsavedCollectionLinks.clear("blog"));
    expect(screen.queryByTestId("inspector-unsaved-link")).toBeNull();
  });
});

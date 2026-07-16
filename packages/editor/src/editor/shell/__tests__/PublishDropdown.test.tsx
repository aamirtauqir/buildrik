/**
 * PublishDropdown.test.tsx — the 4 publish-state configs (draft / in-review /
 * approved / published), wired-vs-no-op menu items (pinned), and the
 * copy-URL / view-live actions.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { PublishDropdown } from "../PublishDropdown";

const LIVE_URL = "https://my-site.vercel.app";

let writeText: ReturnType<typeof vi.fn>;
let openSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
});

afterEach(() => {
  cleanup();
  openSpy.mockRestore();
});

const mainButton = () => screen.getByLabelText(/click to open publish options/i);

describe("PublishDropdown", () => {
  // ── the 4 state configs ────────────────────────────────────────────────────
  describe("state configs", () => {
    it("draft: 'Publish' label + Draft badge + separate chevron segment", () => {
      render(<PublishDropdown publishState="draft" onPublish={vi.fn()} />);
      expect(mainButton()).toHaveTextContent("Publish");
      expect(screen.getByText("Draft")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Open publish options" })).toBeInTheDocument();
    });

    it("in-review: 'In Review' label, no badge", () => {
      render(<PublishDropdown publishState="in-review" onPublish={vi.fn()} />);
      expect(mainButton()).toHaveTextContent("In Review");
      expect(screen.queryByText("Draft")).toBeNull();
    });

    it("approved: 'Approved · Publish Now' label and NO chevron — main click publishes directly", () => {
      const onPublish = vi.fn();
      render(<PublishDropdown publishState="approved" onPublish={onPublish} />);
      expect(mainButton()).toHaveTextContent("Approved · Publish Now");
      expect(screen.queryByRole("button", { name: "Open publish options" })).toBeNull();
      fireEvent.click(mainButton());
      expect(onPublish).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("menu")).toBeNull(); // no menu opened
    });

    it("published: 'Published' label", () => {
      render(<PublishDropdown publishState="published" onPublish={vi.fn()} />);
      expect(mainButton()).toHaveTextContent("Published");
    });

    it("defaults to draft when no state given", () => {
      render(<PublishDropdown onPublish={vi.fn()} />);
      expect(mainButton()).toHaveTextContent("Publish");
      expect(screen.getByText("Draft")).toBeInTheDocument();
    });

    it("loading: 'Publishing…', disabled, badge hidden", () => {
      render(<PublishDropdown publishState="draft" loading onPublish={vi.fn()} />);
      expect(mainButton()).toHaveTextContent("Publishing…");
      expect(mainButton()).toBeDisabled();
      expect(screen.queryByText("Draft")).toBeNull();
    });
  });

  // ── menu open/close ────────────────────────────────────────────────────────
  describe("menu", () => {
    it("main click toggles the menu for non-approved states", () => {
      render(<PublishDropdown publishState="draft" onPublish={vi.fn()} />);
      fireEvent.click(mainButton());
      expect(screen.getByRole("menu", { name: "Publish options" })).toBeInTheDocument();
      fireEvent.click(mainButton());
      expect(screen.queryByRole("menu")).toBeNull();
    });

    it("chevron segment opens the menu", () => {
      render(<PublishDropdown publishState="published" onPublish={vi.fn()} />);
      fireEvent.click(screen.getByRole("button", { name: "Open publish options" }));
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    it("draft menu lists its 3 options", () => {
      render(<PublishDropdown publishState="draft" onPublish={vi.fn()} />);
      fireEvent.click(mainButton());
      const items = screen.getAllByRole("menuitem");
      expect(items.map((i) => i.textContent)).toEqual([
        "Submit for Review",
        "Publish DirectlyAdmin only for non-admin users",
        "View Live SiteShown only if previously published",
      ]);
    });

    it("published menu lists its 6 options", () => {
      render(
        <PublishDropdown publishState="published" publishedUrl={LIVE_URL} onPublish={vi.fn()} />
      );
      fireEvent.click(mainButton());
      expect(screen.getAllByRole("menuitem")).toHaveLength(6);
    });
  });

  // ── wired vs no-op items ───────────────────────────────────────────────────
  // PIN: wired vs no-op items — only three families of menu items have real
  // handlers today:
  //   WIRED:  "Publish Now" / "Publish Directly" / "Publish Update" → onPublish
  //           "View Live Site"       → window.open (disabled without publishedUrl)
  //           "Copy Published URL"   → navigator.clipboard.writeText (disabled
  //                                    without publishedUrl)
  //   NO-OP (decorative until Phase 7 backend RBAC lands):
  //           "Submit for Review", "Request Changes", "Unpublish",
  //           "Deployment Status" — no onClick; clicking only closes the menu.
  //           "Approve" (in-review) is hard-disabled.
  describe("wired vs no-op items", () => {
    it("'Publish Directly' (draft) is wired to onPublish", () => {
      const onPublish = vi.fn();
      render(<PublishDropdown publishState="draft" onPublish={onPublish} />);
      fireEvent.click(mainButton());
      fireEvent.click(screen.getByRole("menuitem", { name: /Publish Directly/ }));
      expect(onPublish).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("menu")).toBeNull(); // closes after action
    });

    it("'Publish Update' (published) is wired to onPublish", () => {
      const onPublish = vi.fn();
      render(
        <PublishDropdown publishState="published" publishedUrl={LIVE_URL} onPublish={onPublish} />
      );
      fireEvent.click(mainButton());
      fireEvent.click(screen.getByRole("menuitem", { name: /Publish Update/ }));
      expect(onPublish).toHaveBeenCalledTimes(1);
    });

    it("'Submit for Review' (draft) is a NO-OP — closes the menu, fires nothing", () => {
      const onPublish = vi.fn();
      render(<PublishDropdown publishState="draft" onPublish={onPublish} />);
      fireEvent.click(mainButton());
      fireEvent.click(screen.getByRole("menuitem", { name: "Submit for Review" }));
      expect(onPublish).not.toHaveBeenCalled();
      expect(writeText).not.toHaveBeenCalled();
      expect(openSpy).not.toHaveBeenCalled();
      expect(screen.queryByRole("menu")).toBeNull();
    });

    it("'Unpublish' and 'Deployment Status' (published) are NO-OPs", () => {
      const onPublish = vi.fn();
      render(
        <PublishDropdown publishState="published" publishedUrl={LIVE_URL} onPublish={onPublish} />
      );
      fireEvent.click(mainButton());
      fireEvent.click(screen.getByRole("menuitem", { name: "Unpublish" }));
      expect(onPublish).not.toHaveBeenCalled();
      fireEvent.click(mainButton());
      fireEvent.click(screen.getByRole("menuitem", { name: "Deployment Status" }));
      expect(onPublish).not.toHaveBeenCalled();
      expect(openSpy).not.toHaveBeenCalled();
    });

    it("'Approve' (in-review) is hard-disabled — click does not close the menu", () => {
      render(<PublishDropdown publishState="in-review" onPublish={vi.fn()} />);
      fireEvent.click(mainButton());
      const approve = screen.getByRole("menuitem", { name: /Approve/ });
      expect(approve).toBeDisabled();
      fireEvent.click(approve);
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    it("'Request Changes' (in-review) is a NO-OP", () => {
      const onPublish = vi.fn();
      render(<PublishDropdown publishState="in-review" onPublish={onPublish} />);
      fireEvent.click(mainButton());
      fireEvent.click(screen.getByRole("menuitem", { name: "Request Changes" }));
      expect(onPublish).not.toHaveBeenCalled();
      expect(screen.queryByRole("menu")).toBeNull();
    });
  });

  // ── live-site actions ──────────────────────────────────────────────────────
  describe("live-site actions", () => {
    it("'Copy Published URL' writes the URL to the clipboard", () => {
      render(
        <PublishDropdown publishState="published" publishedUrl={LIVE_URL} onPublish={vi.fn()} />
      );
      fireEvent.click(mainButton());
      fireEvent.click(screen.getByRole("menuitem", { name: "Copy Published URL" }));
      expect(writeText).toHaveBeenCalledWith(LIVE_URL);
    });

    it("'Copy Published URL' is disabled without a publishedUrl", () => {
      render(<PublishDropdown publishState="published" onPublish={vi.fn()} />);
      fireEvent.click(mainButton());
      const copy = screen.getByRole("menuitem", { name: "Copy Published URL" });
      expect(copy).toBeDisabled();
      fireEvent.click(copy);
      expect(writeText).not.toHaveBeenCalled();
    });

    it("'View Live Site' opens the URL in a new tab", () => {
      render(
        <PublishDropdown publishState="published" publishedUrl={LIVE_URL} onPublish={vi.fn()} />
      );
      fireEvent.click(mainButton());
      fireEvent.click(screen.getByRole("menuitem", { name: /View Live Site/ }));
      expect(openSpy).toHaveBeenCalledWith(LIVE_URL, "_blank", "noopener,noreferrer");
    });

    it("'View Live Site' is disabled without a publishedUrl", () => {
      render(<PublishDropdown publishState="draft" onPublish={vi.fn()} />);
      fireEvent.click(mainButton());
      expect(screen.getByRole("menuitem", { name: /View Live Site/ })).toBeDisabled();
    });
  });
});

/**
 * PublishDropdown.test.tsx — the 2 reachable publish states (draft /
 * published), the every-item-is-wired invariant, and the copy-URL /
 * view-live actions.
 *
 * The in-review / approved states and their no-op actions (Submit for
 * Review, Approve, Request Changes, Unpublish, Deployment Status) were
 * removed 2026-07-25 — see the component header. When the S5 review arc
 * reintroduces them WIRED, extend these tests rather than restoring the
 * old no-op pins.
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
  // ── state configs ──────────────────────────────────────────────────────────
  describe("state configs", () => {
    it("draft: 'Publish' label + Draft badge + separate chevron segment", () => {
      render(<PublishDropdown publishState="draft" onPublish={vi.fn()} />);
      expect(mainButton()).toHaveTextContent("Publish");
      expect(screen.getByText("Draft")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Open publish options" })).toBeInTheDocument();
    });

    it("published: 'Published' label, no badge", () => {
      render(<PublishDropdown publishState="published" onPublish={vi.fn()} />);
      expect(mainButton()).toHaveTextContent("Published");
      expect(screen.queryByText("Draft")).toBeNull();
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
    it("main click toggles the menu", () => {
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

    it("draft menu lists exactly its 2 wired options", () => {
      render(<PublishDropdown publishState="draft" onPublish={vi.fn()} />);
      fireEvent.click(mainButton());
      const items = screen.getAllByRole("menuitem");
      expect(items.map((i) => i.textContent)).toEqual([
        "Publish Directly",
        "View Live Site",
      ]);
    });

    it("published menu lists exactly its 3 wired options", () => {
      render(
        <PublishDropdown publishState="published" publishedUrl={LIVE_URL} onPublish={vi.fn()} />
      );
      fireEvent.click(mainButton());
      const items = screen.getAllByRole("menuitem");
      expect(items.map((i) => i.textContent)).toEqual([
        "Publish UpdateDeploy latest edits — replaces the live site",
        "View Live Site",
        "Copy Published URL",
      ]);
    });
  });

  // ── every item wired ───────────────────────────────────────────────────────
  // PIN: no decorative menu items. Every option either fires a real handler
  // or is disabled with a stated reason (missing publishedUrl).
  describe("wired items", () => {
    it("'Publish Directly' (draft) fires onPublish and closes the menu", () => {
      const onPublish = vi.fn();
      render(<PublishDropdown publishState="draft" onPublish={onPublish} />);
      fireEvent.click(mainButton());
      fireEvent.click(screen.getByRole("menuitem", { name: /Publish Directly/ }));
      expect(onPublish).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("menu")).toBeNull();
    });

    it("'Publish Update' (published) fires onPublish", () => {
      const onPublish = vi.fn();
      render(
        <PublishDropdown publishState="published" publishedUrl={LIVE_URL} onPublish={onPublish} />
      );
      fireEvent.click(mainButton());
      fireEvent.click(screen.getByRole("menuitem", { name: /Publish Update/ }));
      expect(onPublish).toHaveBeenCalledTimes(1);
    });

    it("no former no-op items render in any state", () => {
      for (const state of ["draft", "published"] as const) {
        render(<PublishDropdown publishState={state} onPublish={vi.fn()} />);
        fireEvent.click(mainButton());
        for (const gone of [
          "Submit for Review",
          "Approve",
          "Request Changes",
          "Unpublish",
          "Deployment Status",
        ]) {
          expect(screen.queryByRole("menuitem", { name: gone })).toBeNull();
        }
        cleanup();
      }
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

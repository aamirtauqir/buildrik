/**
 * Molecules — contract tests.
 *
 * Assert the API and the accessibility wiring. Geometry comes from tokens and
 * is verified by the conformance runner, not here.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  Row, ListRow, TreeRow, VersionRow, RecordRow, FormatRow, IntegrationRow, CommentRow,
  FieldRow, NavItem, SectionHeader, PanelHeader, EmptyState,
  MediaCard, SiteCard,
} from "../index";
import { Button } from "flowbite-react";

describe("Row", () => {
  it("is inert by default — no tab stop, no role", () => {
    const { container } = render(<Row>plain</Row>);
    const row = container.firstElementChild as HTMLElement;
    expect(row.getAttribute("tabindex")).toBeNull();
    expect(row.getAttribute("role")).toBeNull();
  });

  it("interactive rows answer the keyboard, not just the mouse", () => {
    const onClick = vi.fn();
    render(<Row interactive onClick={onClick}>go</Row>);
    const row = screen.getByRole("button", { name: "go" });
    expect(row.getAttribute("tabindex")).toBe("0");
    fireEvent.keyDown(row, { key: "Enter" });
    fireEvent.keyDown(row, { key: " " });
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("a disabled row ignores clicks", () => {
    const onClick = vi.fn();
    render(<Row interactive disabled onClick={onClick}>no</Row>);
    fireEvent.click(screen.getByText("no"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("lets the caller override the role for tree and listbox surfaces", () => {
    render(<Row interactive role="option">opt</Row>);
    expect(screen.getByRole("option", { name: "opt" })).toBeTruthy();
  });
});

describe("ListRow", () => {
  it("renders label, count and chevron", () => {
    render(<ListRow label="Menu items" count={24} chevron />);
    expect(screen.getByText("Menu items")).toBeTruthy();
    expect(screen.getByText("24")).toBeTruthy();
  });
});

describe("TreeRow", () => {
  it("exposes depth as aria-level so traversal is announced", () => {
    render(<TreeRow label="Hero" depth={2} />);
    expect(screen.getByRole("treeitem").getAttribute("aria-level")).toBe("3");
  });

  it("the twisty toggles without selecting the row", () => {
    const onToggle = vi.fn();
    const onClick = vi.fn();
    render(<TreeRow label="Section" expandable expanded={false} onToggle={onToggle} onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: "Expand Section" }));
    expect(onToggle).toHaveBeenCalledOnce();
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("VersionRow", () => {
  it("marks the current version", () => {
    render(<VersionRow title="v14" meta="2 Jul, 14:22" state="live" current />);
    expect(screen.getByText("CURRENT")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Live" })).toBeTruthy();
  });
});

describe("RecordRow", () => {
  it("says published in text, not only in colour", () => {
    render(<RecordRow label="Margherita" published />);
    expect(screen.getByRole("img", { name: "Published" })).toBeTruthy();
  });
});

describe("FormatRow", () => {
  it("is a real radio, so arrow keys work inside the group", () => {
    const onChange = vi.fn();
    render(
      <FormatRow name="fmt" value="html" title="Static HTML" description="No build step" onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole("radio"));
    expect(onChange).toHaveBeenCalledWith("html");
  });
});

describe("IntegrationRow", () => {
  it("shows connection status and the pro gate", () => {
    render(<IntegrationRow name="Stripe" scope="Payments" status="connected" pro />);
    expect(screen.getByText("CONNECTED")).toBeTruthy();
    expect(screen.getByText("PRO")).toBeTruthy();
  });

  it("defaults to available", () => {
    render(<IntegrationRow name="Zapier" scope="Automations" />);
    expect(screen.getByText("AVAILABLE")).toBeTruthy();
  });
});

describe("CommentRow", () => {
  it("names the client rather than relying on the tint", () => {
    render(<CommentRow author="Hina Raza" authorKind="client" body="Move the hero up" />);
    expect(screen.getByText(/Hina Raza · Client/)).toBeTruthy();
  });
});

describe("FieldRow", () => {
  it("ties the label to its control", () => {
    render(
      <FieldRow label="Radius" htmlFor="radius">
        <input id="radius" />
      </FieldRow>,
    );
    expect(screen.getByLabelText("Radius")).toBeTruthy();
  });
});

describe("NavItem", () => {
  it("answers 'where am I' with aria-current", () => {
    render(<NavItem current>Domains</NavItem>);
    expect(screen.getByRole("button", { name: "Domains" }).getAttribute("aria-current")).toBe("page");
  });
});

describe("SectionHeader / PanelHeader", () => {
  it("both are headings so the panel has an outline", () => {
    render(
      <>
        <PanelHeader title="Pages" />
        <SectionHeader count={3}>Collections</SectionHeader>
      </>,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Pages" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3 })).toBeTruthy();
  });
});

describe("EmptyState", () => {
  it("carries an action, because an empty state without one is a dead end", () => {
    render(<EmptyState title="No pages yet" body="Add your first page." action={<Button>Add page</Button>} />);
    expect(screen.getByRole("button", { name: "Add page" })).toBeTruthy();
  });
});

describe("MediaCard / SiteCard", () => {
  it("decorative images get an empty alt so they are skipped, not read out", () => {
    const { container } = render(<MediaCard name="hero.jpg" src="/hero.jpg" badge="NEW" />);
    expect(container.querySelector("img")?.getAttribute("alt")).toBe("");
    expect(screen.getByText("NEW")).toBeTruthy();
  });

  it("SiteCard states are labelled in text", () => {
    render(<SiteCard name="Bella Cucina" state="live" stateLabel="Live" meta="2h ago" />);
    expect(screen.getByRole("img", { name: "Live" })).toBeTruthy();
    expect(screen.getByText("Bella Cucina")).toBeTruthy();
  });
});

/* ── BreakpointSwitcher · ported from vibcoder ──────────────────────────── */
import { BreakpointSwitcher } from "../BreakpointSwitcher";

describe("BreakpointSwitcher", () => {
  it("is a labelled group of three type=button cells, four with includeWide", () => {
    const { container, rerender } = render(
      <BreakpointSwitcher value="desktop" onChange={() => {}} />,
    );
    const group = screen.getByRole("group", { name: "Breakpoint" });
    expect(group.className).toContain("bk-bp-switcher");
    const btns = container.querySelectorAll("button.bk-bp-switcher__btn");
    expect(btns.length).toBe(3);
    btns.forEach((b) => expect(b.getAttribute("type")).toBe("button"));
    rerender(<BreakpointSwitcher value="desktop" onChange={() => {}} includeWide />);
    expect(container.querySelectorAll("button.bk-bp-switcher__btn").length).toBe(4);
  });

  it("marks only the active breakpoint aria-pressed and reports clicks", () => {
    const onChange = vi.fn();
    render(<BreakpointSwitcher value="tablet" onChange={onChange} />);
    expect(screen.getByRole("button", { name: "Tablet" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Desktop" }).getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Mobile" }));
    expect(onChange).toHaveBeenCalledWith("mobile");
  });

  it("labelled mode swaps glyphs for full names", () => {
    const { container } = render(
      <BreakpointSwitcher value="desktop" onChange={() => {}} labelled />,
    );
    expect(container.querySelector(".bk-bp-switcher")!.className).toContain("bk-bp-switcher--labelled");
    const texts = Array.from(container.querySelectorAll("button")).map((b) => b.textContent);
    expect(texts).toEqual(["Desktop", "Tablet", "Mobile"]);
  });
});

/* ── Extensions drain · ported from shared/extensions ───────────────────── */
import { PanelHeaderActions, CopyButton, UpgradeModal, ToastProvider } from "../index";

describe("PanelHeaderActions", () => {
  it("renders only the buttons whose callbacks are provided, labelled by context", () => {
    const onPinToggle = vi.fn();
    const onClose = vi.fn();
    render(<PanelHeaderActions label="panel" isPinned onPinToggle={onPinToggle} onClose={onClose} />);
    const pin = screen.getByRole("button", { name: "Unpin panel" });
    expect(pin.getAttribute("aria-pressed")).toBe("true");
    expect(screen.queryByRole("button", { name: "Help" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Close panel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(pin);
    expect(onPinToggle).toHaveBeenCalledTimes(1);
  });
});

describe("CopyButton", () => {
  it("copies the content and flips to a Copied state", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(
      <ToastProvider>
        <CopyButton content="hello" label="HTML" variant="solid" />
      </ToastProvider>,
    );
    const btn = screen.getByRole("button", { name: "Copy HTML" });
    expect(btn.className).toContain("bk-copy-btn--solid");
    fireEvent.click(btn);
    expect(writeText).toHaveBeenCalledWith("hello");
    expect(await screen.findByRole("button", { name: "Copied" })).toBeTruthy();
    expect(screen.getByText("Copied!")).toBeTruthy();
  });
});

describe("UpgradeModal", () => {
  it("stays closed until the upgrade-modal-open event arrives, then names the feature", () => {
    render(<UpgradeModal />);
    expect(screen.queryByText("Upgrade Your Plan")).toBeNull();
    fireEvent(
      window,
      new CustomEvent("upgrade-modal-open", { detail: { feature: "Export", requiredPlan: "Business" } }),
    );
    expect(screen.getByText("Upgrade Your Plan")).toBeTruthy();
    expect(screen.getByText("Export requires the Business plan.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Upgrade to Business" })).toBeTruthy();
  });

  it("supports controlled open state and closes via Maybe Later", () => {
    const onClose = vi.fn();
    render(<UpgradeModal isOpen onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Maybe Later" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

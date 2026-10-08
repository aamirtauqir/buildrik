/**
 * A premium template opens the boarded upgrade prompt — board 1175:4804.
 *
 * It opened `ProModal` instead: a second upgrade modal, local to this tab,
 * with no board of its own and a benefit list that sold "AI alt-text
 * generation" — a path removed from the repo. `UpgradeModal`, the one the
 * board draws, was mounted globally in `AquibraStudio` and opened only on an
 * `upgrade-modal-open` event that nothing in `src/` dispatched, so it was
 * unreachable.
 *
 * `ProModal` also named the wrong template. Both premium branches returned
 * BEFORE setting `pendingId.current`, and the modal read its title from
 * `pendingId` — so it showed the previously-opened template's name, or the
 * literal fallback "Pro Template" on the first click of a session.
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/editor/chrome-ui", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/editor/chrome-ui");
  return {
    ...actual,
    useToast: () => ({ addToast: vi.fn(), removeToast: vi.fn(), toasts: [] }),
    ToastProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

const plan = vi.hoisted(() => ({ tier: "starter" as "starter" | "pro" | "enterprise" }));
vi.mock("@/services/BuildrikSyncProvider", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/BuildrikSyncProvider")>()),
  getEditorPlanTier: () => plan.tier,
}));

import { TemplatesTab } from "../TemplatesTab";
import { UpgradeModal } from "@/editor/chrome-ui";
import { SITE_TEMPLATES } from "../templatesData";

function makeComposer() {
  return {
    elements: {
      getActivePage: vi.fn(() => ({ id: "page-1", name: "Page 1", root: { id: "root-1" } })),
      getAllPages: vi.fn(() => [{ id: "page-1", name: "Page 1" }]),
      createPage: vi.fn(() => ({ id: "page-new", name: "New" })),
      setActivePage: vi.fn(),
      importHTMLToActivePage: vi.fn(),
      recordAppliedTemplate: vi.fn(),
      getElement: vi.fn(() => null),
    },
    styles: { clear: vi.fn() },
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  };
}

afterEach(() => {
  cleanup();
  plan.tier = "starter";
});

const premium = () => {
  const t = SITE_TEMPLATES.find((x) => x.status === "premium");
  if (!t) throw new Error("no premium template in SITE_TEMPLATES");
  return t;
};

/** The shell mounts `UpgradeModal` once, globally; this mirrors that. */
const renderTab = () =>
  render(
    <>
      <TemplatesTab composer={makeComposer() as never} />
      <UpgradeModal />
    </>,
  );

describe("Templates — a premium template reaches the boarded prompt", () => {
  /** A card opens the preview (decision #24); its Create page meets the gate. */
  const openDetail = async (name: string) =>
    fireEvent.click(await screen.findByRole("option", { name: `${name} template` }));

  it("opens it from the preview, naming the template the user clicked", async () => {
    const t = premium();
    renderTab();

    await openDetail(t.name);
    fireEvent.click(screen.getByRole("button", { name: "Create page" }));

    expect(screen.getByText("Upgrade Your Plan")).toBeTruthy();
    // This is the first premium click of the session, which is exactly where
    // `ProModal` printed its fallback: it read the title from
    // `pendingId.current`, and both premium branches return before setting it.
    expect(screen.getByText(`${t.name} requires the Pro plan.`)).toBeTruthy();
    expect(screen.queryByText(/Pro Template/)).toBeNull();
  });

  it("does not apply the template it just blocked", async () => {
    const t = premium();
    const composer = makeComposer();
    render(
      <>
        <TemplatesTab composer={composer as never} />
        <UpgradeModal />
      </>,
    );

    await openDetail(t.name);
    fireEvent.click(screen.getByRole("button", { name: "Create page" }));

    expect(composer.elements.importHTMLToActivePage).not.toHaveBeenCalled();
  });

  /* L2-009: a BUSINESS workspace was told "requires the Pro plan" — the gate
     never read the plan. Pro and Business use premium templates. */
  it.each(["pro", "enterprise"] as const)("a %s-tier workspace is not gated", async (tier) => {
    plan.tier = tier;
    const t = premium();
    renderTab();

    await openDetail(t.name);
    fireEvent.click(screen.getByRole("button", { name: "Create page" }));

    expect(screen.queryByText("Upgrade Your Plan")).toBeNull();
  });
});

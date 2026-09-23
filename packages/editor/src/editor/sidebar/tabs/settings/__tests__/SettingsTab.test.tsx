/**
 * SettingsTab — the Clone shell (3397:32011 around a screen, 3397:32915 the
 * Overview, 3953:26363 / 3953:26503 / 3950:26309 the footer's states).
 *
 * Covers:
 *   Shell: the persistent sidebar (Back to canvas · Settings · site · Overview
 *     · five groups · Pro on locked rows · ↗ dashboard rows), the pane header
 *     per screen, the footer per state, the deep link.
 *   Doors: Fonts & colours → the Brand panel · Export → `ui:open-exporter` and
 *     out · Back / Done / Cancel / Escape → out.
 *   Guard: every door and every nav click while dirty raises Unsaved
 *     settings; Keep editing keeps; Discard rolls composer back and finishes
 *     the intent (out, or the clicked screen).
 *   Save: success → Settings saved; failure → `Changes not saved` + `Retry
 *     save` + the screen's `saveError`; retry → saved.
 *   Load: the screen's `onLoadStateChange` drives the footer and disables Save.
 *   Search: a result opens its screen and lands on its field.
 *
 * E3's dialogs and the Search modal are stubbed to their prop contracts here;
 * `useSettingsScreen` is mocked as before (the production hook re-creates
 * selectors per render and loops under jsdom).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, within, act } from "@testing-library/react";
import * as React from "react";

const sync = vi.hoisted(() => ({
  saveProject: vi.fn(async (_siteId: string, _data: unknown) => ({ success: true, savedAt: new Date() })),
}));
vi.mock("@/services/BuildrikSyncProvider", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/BuildrikSyncProvider")>()),
  saveProject: sync.saveProject,
  getEditorPlanTier: () => "starter",
}));

vi.mock("../hooks/useSettingsScreen", () => ({
  useSettingsScreen: vi.fn(
    (
      composer: { getProjectSettings?: () => unknown } | null | undefined,
      selector: (s: unknown) => unknown,
      defaultValue: unknown,
    ) => {
      const raw = composer?.getProjectSettings?.() ?? {};
      const initialValue = (() => {
        try {
          return selector(raw) ?? defaultValue;
        } catch {
          return defaultValue;
        }
      })();
      const [value, setValue] = React.useState(initialValue);
      const [isDirty, setIsDirty] = React.useState(false);
      return {
        value,
        isDirty,
        setValue: (v: unknown) => {
          setValue(v);
          setIsDirty(true);
        },
        markDirty: () => setIsDirty(true),
        markClean: () => setIsDirty(false),
      };
    },
  ),
}));

/* E3's three components, by the brief's prop contracts. */
vi.mock("../components/UnsavedSettingsDialog", () => ({
  UnsavedSettingsDialog: ({
    open,
    onKeepEditing,
    onDiscard,
  }: {
    open: boolean;
    onKeepEditing: () => void;
    onDiscard: () => void;
  }) =>
    open ? (
      <div role="dialog" data-testid="set-unsaved">
        <button type="button" data-testid="set-unsaved-keep" onClick={onKeepEditing}>
          Keep editing
        </button>
        <button type="button" data-testid="set-unsaved-discard" onClick={onDiscard}>
          Discard and return to canvas
        </button>
      </div>
    ) : null,
}));
vi.mock("../components/SettingsSavedDialog", () => ({
  SettingsSavedDialog: ({ open, siteName, onReturn }: { open: boolean; siteName: string; onReturn: () => void }) =>
    open ? (
      <div role="dialog" data-testid="set-saved">
        {siteName} · Configuration saved.
        <button type="button" data-testid="set-saved-return" onClick={onReturn}>
          Return to settings
        </button>
      </div>
    ) : null,
}));
vi.mock("../components/SearchSettingsModal", () => ({
  SearchSettingsModal: ({
    open,
    onClose,
    onOpen,
  }: {
    open: boolean;
    onClose: () => void;
    onOpen: (screen: string, field?: string) => void;
  }) =>
    open ? (
      <div role="dialog" data-testid="set-search">
        <button type="button" data-testid="set-search-row-0" onClick={() => onOpen("seo", "seo-meta-title")}>
          SEO defaults
        </button>
        <button type="button" data-testid="set-search-row-1" onClick={() => onOpen("general", "site-name")}>
          Site name
        </button>
        <button type="button" data-testid="set-search-row-2" onClick={() => onOpen("members")}>
          Members
        </button>
        <button type="button" data-testid="set-search-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    ) : null,
}));

/* A screen that exercises the shell's load-state and save-error contract
   without a server: SEO stands in. */
const seoFlushes = vi.hoisted(() => [] as string[]);
vi.mock("../screens/SeoScreen", () => ({
  SeoScreen: ({
    onLoadStateChange,
    onDirtyChange,
    saveError,
    registerHeaderAction,
    registerFlushHandler,
    registerHeader,
  }: {
    onLoadStateChange?: (s: "loading" | "ready" | "error") => void;
    onDirtyChange?: (d: boolean) => void;
    saveError?: string | null;
    registerHeaderAction?: (node: React.ReactNode | null) => void;
    registerFlushHandler?: (handler: (() => void) | null) => void;
    registerHeader?: (header: { title?: string; subtitle?: string } | null) => void;
  }) => {
    /* Registered the way the real screens do it — in a mount effect. */
    React.useEffect(() => {
      registerFlushHandler?.(() => seoFlushes.push("flushed"));
      return () => registerFlushHandler?.(null);
    }, [registerFlushHandler]);
    return (
    <div data-testid="fake-seo">
      {saveError ? <div data-testid="set-save-error">{saveError}</div> : null}
      <button type="button" onClick={() => registerHeaderAction?.(<button type="button" data-testid="set-head-action">Add thing</button>)}>
        register header action
      </button>
      <input id="seo-meta-title" aria-label="Meta title" onChange={() => onDirtyChange?.(true)} />
      <button type="button" onClick={() => registerHeader?.({ title: "Browse all", subtitle: "All available things" })}>
        sub-view header
      </button>
      <button type="button" onClick={() => registerHeader?.(null)}>
        own header
      </button>
      <button type="button" onClick={() => onLoadStateChange?.("loading")}>
        go loading
      </button>
      <button type="button" onClick={() => onLoadStateChange?.("error")}>
        go error
      </button>
      <button type="button" onClick={() => onLoadStateChange?.("ready")}>
        go ready
      </button>
    </div>
    );
  },
}));

vi.mock("../screens/OverviewScreen", () => ({
  OverviewScreen: ({ onOpenScreen }: { onOpenScreen: (id: string) => void }) => (
    <div data-testid="fake-overview">
      <button type="button" data-testid="set-ov-row-domains" onClick={() => onOpenScreen("domains")}>
        Domains
      </button>
    </div>
  ),
}));

/* The Redirects screen, reduced to what the shell hands it: the Pages
   door's repair draft and the `done` it answers with (3519:19920). */
vi.mock("../screens/RedirectsScreen", () => ({
  RedirectsScreen: ({
    repair,
    onRepairDone,
  }: {
    repair?: { pageName: string; from: string; to: string } | null;
    onRepairDone?: () => void;
  }) => (
    <div data-testid="fake-redirects">
      {repair ? (
        <div data-testid="fake-repair">
          Redirect for {repair.pageName} · {repair.from} → {repair.to}
          <button type="button" onClick={onRepairDone}>repair done</button>
        </div>
      ) : null}
    </div>
  ),
}));

import { SettingsTab } from "../SettingsTab";
import { SETTINGS_MIRROR_ERROR_EVENT } from "@/services/BuildrikSyncProvider";

afterEach(() => {
  cleanup();
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});

beforeEach(() => {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});

const makeComposer = (saveProject: () => Promise<void> = () => Promise.resolve()) => ({
  getProjectSettings: () => ({ seo: { siteName: "Test Site" } }),
  setProjectSettings: vi.fn(),
  getProjectMetadata: () => ({ name: "Bella Cucina" }),
  saveProject: vi.fn(saveProject),
  exportProject: () => ({ pages: [] }),
  markSaved: vi.fn(),
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
});
type FakeComposer = ReturnType<typeof makeComposer>;
const asComposer = (c: FakeComposer) => c as unknown as React.ComponentProps<typeof SettingsTab>["composer"];

const headTitle = () => screen.getByTestId("set-head-title").textContent;
const footStatus = () => screen.getByTestId("set-foot-status").textContent;

async function openGeneralAndEdit() {
  fireEvent.click(screen.getByTestId("set-nav-general"));
  const siteNameInput = (await screen.findByLabelText("Site name")) as HTMLInputElement;
  fireEvent.change(siteNameInput, { target: { value: "Edited Site" } });
  await waitFor(() => expect(footStatus()).toBe("Unsaved changes"));
  return siteNameInput;
}

// ─── Shell ────────────────────────────────────────────────────────────────

describe("SettingsTab — the shell", () => {
  it("draws the sidebar: Back to canvas, Settings, the site, Overview and the five groups", () => {
    render(<SettingsTab composer={asComposer(makeComposer())} userPlan="enterprise" />);
    expect(screen.getByTestId("set-back").textContent).toContain("Back to canvas");
    expect(screen.getByTestId("set-title").textContent).toBe("Settings");
    expect(screen.getByTestId("set-site").textContent).toBe("Bella Cucina");
    const nav = screen.getByRole("navigation", { name: /settings sections/i });
    const labels = Array.from(nav.querySelectorAll('[data-testid^="set-nav-"]')).map((el) => ({
      id: el.getAttribute("data-testid"),
      text: el.textContent?.trim(),
    }));
    expect(labels).toEqual([
      { id: "set-nav-overview", text: "Overview" },
      { id: "set-nav-general", text: "General" },
      { id: "set-nav-branding", text: "Fonts & colours" },
      { id: "set-nav-localization", text: "Localization" },
      { id: "set-nav-seo", text: "SEO defaults" },
      { id: "set-nav-domains", text: "Domains" },
      { id: "set-nav-redirects", text: "Redirects" },
      { id: "set-nav-export", text: "Export" },
      { id: "set-nav-analytics", text: "Analytics" },
      { id: "set-nav-forms", text: "Forms" },
      { id: "set-nav-custom-code", text: "Custom code" },
      { id: "set-nav-headers", text: "Headers" },
      { id: "set-nav-integrations", text: "Integrations" },
      { id: "set-nav-webhooks", text: "Webhooks" },
      { id: "set-nav-members", text: "Members" },
      { id: "set-nav-billing", text: "Billing" },
    ]);
    const groups = Array.from(nav.children)
      .filter((el) => el.tagName === "DIV")
      .map((el) => el.textContent);
    expect(groups).toEqual(["Site setup", "SEO & publishing", "Visitors", "Advanced", "Workspace"]);
    expect(screen.getByTestId("set-nav-overview").getAttribute("aria-current")).toBe("page");
    for (const id of ["members", "billing"]) {
      const link = screen.getByTestId(`set-nav-${id}`);
      expect(link.tagName).toBe("A");
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toContain("noopener");
    }
    expect(screen.getByTestId("set-nav-members").getAttribute("href")).toContain("/dashboard/settings/team");
    expect(screen.getByTestId("set-nav-billing").getAttribute("href")).toContain("/dashboard/settings/billing");
  });

  it("keeps the Pro badge on the locked rows for a starter plan", () => {
    render(<SettingsTab composer={asComposer(makeComposer())} userPlan="starter" />);
    expect(within(screen.getByTestId("set-nav-custom-code")).getByText("Pro")).toBeTruthy();
    expect(within(screen.getByTestId("set-nav-integrations")).getByText("Pro")).toBeTruthy();
    expect(within(screen.getByTestId("set-nav-general")).queryByText("Pro")).toBeNull();
  });

  it("lands on the Overview: its header, the Search field, and a Done footer that is Back to canvas", () => {
    const onClose = vi.fn();
    render(<SettingsTab composer={asComposer(makeComposer())} onClose={onClose} />);
    expect(headTitle()).toBe("Settings");
    expect(screen.getByTestId("set-head-sub").textContent).toBe(
      "Bella Cucina · everything on this page is scoped to this project.",
    );
    expect(screen.getByTestId("set-search-open")).toBeTruthy();
    expect(screen.getByTestId("fake-overview")).toBeTruthy();
    expect(footStatus()).toBe("Pick a section to edit its settings");
    expect(screen.queryByTestId("set-foot-save")).toBeNull();
    fireEvent.click(screen.getByTestId("set-ov-done"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("an Overview row is the same nav as the sidebar", async () => {
    render(<SettingsTab composer={asComposer(makeComposer())} projectId="site-1" />);
    fireEvent.click(screen.getByTestId("set-ov-row-domains"));
    await waitFor(() => expect(headTitle()).toBe("SEO & publishing / Domains"));
    expect(screen.getByTestId("set-nav-domains").getAttribute("aria-current")).toBe("page");
  });

  it("a screen gets `Group / Screen`, its subtitle, the current row on the tint, and the saved footer", async () => {
    render(<SettingsTab composer={asComposer(makeComposer())} />);
    fireEvent.click(screen.getByTestId("set-nav-general"));
    await waitFor(() => expect(headTitle()).toBe("Site setup / General"));
    expect(screen.getByTestId("set-head-sub").textContent).toBe(
      "Manage your site identity, language and social profiles.",
    );
    const row = screen.getByTestId("set-nav-general");
    expect(row.getAttribute("aria-current")).toBe("page");
    expect(row.className).toContain("tw:bg-[var(--bk-accent-tint)]");
    expect(screen.getByTestId("set-nav-overview").getAttribute("aria-current")).toBeNull();
    expect(footStatus()).toBe("All changes saved");
    expect(screen.getByTestId("set-foot-cancel").textContent).toBe("Cancel");
    expect(screen.getByTestId("set-foot-save").textContent).toBe("Save changes");
    expect(screen.queryByTestId("set-search-open")).toBeNull();
    expect(screen.getByTestId("set-card-site-identity")).toBeTruthy();
  });

  it("the plan gate puts Upgrade in the header and the locked card in the body", async () => {
    render(<SettingsTab composer={asComposer(makeComposer())} userPlan="starter" />);
    fireEvent.click(screen.getByTestId("set-nav-custom-code"));
    await waitFor(() => expect(headTitle()).toBe("Advanced / Custom code"));
    expect(screen.getByTestId("set-head-upgrade").textContent).toBe("Upgrade");
    expect(screen.getByText(/Custom code is a Pro feature/)).toBeTruthy();
    /* 3397:32859 draws no footer under the locked card. */
    expect(screen.queryByTestId("set-foot-save")).toBeNull();
    expect(screen.queryByTestId("set-foot-status")).toBeNull();
    cleanup();
    render(<SettingsTab composer={asComposer(makeComposer())} userPlan="enterprise" />);
    fireEvent.click(screen.getByTestId("set-nav-custom-code"));
    await waitFor(() => expect(headTitle()).toBe("Advanced / Custom code"));
    expect(screen.queryByTestId("set-head-upgrade")).toBeNull();
    expect(screen.getByTestId("set-foot-save").textContent).toBe("Save changes");
  });

  it("deep-links: 'plugins' opens Integrations; an id that names no screen stays on the Overview", async () => {
    render(<SettingsTab composer={asComposer(makeComposer())} userPlan="enterprise" initialScreen="plugins" />);
    await waitFor(() => expect(headTitle()).toBe("Advanced / Integrations"));
    cleanup();
    localStorage.clear(); // the nav position persists per project
    render(<SettingsTab composer={asComposer(makeComposer())} initialScreen="not-a-screen" />);
    await new Promise((r) => setTimeout(r, 30));
    expect(headTitle()).toBe("Settings");
  });
});

// ─── Doors ────────────────────────────────────────────────────────────────

describe("SettingsTab — doors", () => {
  it("Fonts & colours opens the Brand panel and stays where it was", () => {
    const onOpenDesignTab = vi.fn();
    render(<SettingsTab composer={asComposer(makeComposer())} onOpenDesignTab={onOpenDesignTab} />);
    fireEvent.click(screen.getByTestId("set-nav-branding"));
    expect(onOpenDesignTab).toHaveBeenCalledTimes(1);
    expect(headTitle()).toBe("Settings");
  });

  it("Export opens the exporter and leaves Settings", () => {
    const composer = makeComposer();
    const onClose = vi.fn();
    render(<SettingsTab composer={asComposer(composer)} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("set-nav-export"));
    expect(composer.emit).toHaveBeenCalledWith("ui:open-exporter", undefined);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Back to canvas, Cancel and Escape all leave a clean screen", async () => {
    const onClose = vi.fn();
    render(<SettingsTab composer={asComposer(makeComposer())} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("set-nav-general"));
    await waitFor(() => expect(headTitle()).toBe("Site setup / General"));
    fireEvent.click(screen.getByTestId("set-back"));
    fireEvent.click(screen.getByTestId("set-foot-cancel"));
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(3);
    // An input keeps its own Escape.
    const input = await screen.findByLabelText("Site name");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});

// ─── The guard ────────────────────────────────────────────────────────────

describe("SettingsTab — Unsaved settings", () => {
  it("Back to canvas while dirty raises the dialog; Keep editing keeps the edits", async () => {
    const onClose = vi.fn();
    render(<SettingsTab composer={asComposer(makeComposer())} onClose={onClose} />);
    await openGeneralAndEdit();
    fireEvent.click(screen.getByTestId("set-back"));
    expect(screen.getByTestId("set-unsaved")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("set-unsaved-keep"));
    expect(screen.queryByTestId("set-unsaved")).toBeNull();
    expect(footStatus()).toBe("Unsaved changes");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("Discard rolls composer back to the mount-time snapshot and returns to the canvas", async () => {
    const composer = makeComposer();
    const onClose = vi.fn();
    render(<SettingsTab composer={asComposer(composer)} onClose={onClose} />);
    await openGeneralAndEdit();
    const snapshot = composer.getProjectSettings();
    fireEvent.click(screen.getByTestId("set-foot-cancel"));
    fireEvent.click(screen.getByTestId("set-unsaved-discard"));
    expect(composer.setProjectSettings).toHaveBeenCalledTimes(1);
    const arg = composer.setProjectSettings.mock.calls[0][0];
    expect(arg).toEqual(snapshot);
    expect(arg).not.toBe(snapshot);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Escape while dirty raises the dialog instead of leaving", async () => {
    const onClose = vi.fn();
    render(<SettingsTab composer={asComposer(makeComposer())} onClose={onClose} />);
    await openGeneralAndEdit();
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(screen.getByTestId("set-unsaved")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("a nav click while dirty raises the dialog; Discard finishes that click", async () => {
    const onClose = vi.fn();
    render(<SettingsTab composer={asComposer(makeComposer())} onClose={onClose} />);
    await openGeneralAndEdit();
    fireEvent.click(screen.getByTestId("set-nav-seo"));
    expect(screen.getByTestId("set-unsaved")).toBeTruthy();
    expect(headTitle()).toBe("Site setup / General");
    fireEvent.click(screen.getByTestId("set-unsaved-discard"));
    await waitFor(() => expect(headTitle()).toBe("SEO & publishing / SEO defaults"));
    expect(onClose).not.toHaveBeenCalled();
    expect(footStatus()).toBe("All changes saved");
  });

  it("a door while dirty is guarded too", async () => {
    const onOpenDesignTab = vi.fn();
    render(<SettingsTab composer={asComposer(makeComposer())} onOpenDesignTab={onOpenDesignTab} />);
    await openGeneralAndEdit();
    fireEvent.click(screen.getByTestId("set-nav-branding"));
    expect(screen.getByTestId("set-unsaved")).toBeTruthy();
    expect(onOpenDesignTab).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("set-unsaved-discard"));
    expect(onOpenDesignTab).toHaveBeenCalledTimes(1);
  });
});

// ─── Save ─────────────────────────────────────────────────────────────────

describe("SettingsTab — Save changes", () => {
  it("a successful save shows Settings saved and settles the footer", async () => {
    const composer = makeComposer();
    render(<SettingsTab composer={asComposer(composer)} />);
    await openGeneralAndEdit();
    fireEvent.click(screen.getByTestId("set-foot-save"));
    expect(composer.saveProject).toHaveBeenCalledTimes(1);
    const saved = await screen.findByTestId("set-saved");
    expect(saved.textContent).toContain("Bella Cucina");
    expect(footStatus()).toBe("All changes saved");
    fireEvent.click(screen.getByTestId("set-saved-return"));
    expect(screen.queryByTestId("set-saved")).toBeNull();
  });

  it("a failed save: `Changes not saved`, `Retry save`, the screen's banner — and the retry saves", async () => {
    let attempt = 0;
    const composer = makeComposer(() => (attempt++ === 0 ? Promise.reject(new Error("503")) : Promise.resolve()));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<SettingsTab composer={asComposer(composer)} />);
    fireEvent.click(screen.getByTestId("set-nav-seo"));
    await waitFor(() => expect(headTitle()).toBe("SEO & publishing / SEO defaults"));
    fireEvent.change(screen.getByLabelText("Meta title"), { target: { value: "x" } });
    await waitFor(() => expect(footStatus()).toBe("Unsaved changes"));
    fireEvent.click(screen.getByTestId("set-foot-save"));
    await waitFor(() => expect(footStatus()).toBe("Changes not saved"));
    expect(screen.getByTestId("set-foot-status").className).toContain("var(--bk-error)");
    expect(screen.getByTestId("set-foot-save").textContent).toBe("Retry save");
    expect(screen.getByTestId("set-save-error").textContent).toBe(
      "SEO defaults were not saved. Your changes are still here. Review the values, then retry.",
    );
    expect(screen.queryByTestId("set-saved")).toBeNull();
    fireEvent.click(screen.getByTestId("set-foot-save"));
    await screen.findByTestId("set-saved");
    expect(composer.saveProject).toHaveBeenCalledTimes(2);
    expect(screen.queryByTestId("set-save-error")).toBeNull();
    expect(screen.getByTestId("set-foot-save").textContent).toBe("Save changes");
    errorSpy.mockRestore();
  });
});

/* The shipping editor (a site id in the URL) persists through the sync
   provider, not `composer.saveProject()`: the server mirror is the save.
   Walked live 2026-09-14 — an invalid OG image read `Settings saved` while
   the server answered 207 and kept the old value. */
describe("SettingsTab — Save changes with a site id goes through the sync provider", () => {
  beforeEach(() => sync.saveProject.mockClear());

  /* The SEO screen is mocked above (a real General would read the server). */
  async function openSeoAndEdit() {
    fireEvent.click(screen.getByTestId("set-nav-seo"));
    await waitFor(() => expect(headTitle()).toBe("SEO & publishing / SEO defaults"));
    fireEvent.change(screen.getByLabelText("Meta title"), { target: { value: "x" } });
    await waitFor(() => expect(footStatus()).toBe("Unsaved changes"));
  }

  it("awaits the provider's save and marks the composer saved; composer.saveProject is not used", async () => {
    const composer = makeComposer();
    render(<SettingsTab composer={asComposer(composer)} projectId="site-1" />);
    await openSeoAndEdit();
    fireEvent.click(screen.getByTestId("set-foot-save"));
    await screen.findByTestId("set-saved");
    expect(sync.saveProject).toHaveBeenCalledTimes(1);
    expect(sync.saveProject.mock.calls[0][0]).toBe("site-1");
    expect(composer.saveProject).not.toHaveBeenCalled();
    expect(composer.markSaved).toHaveBeenCalledTimes(1);
  });

  it("a refused settings mirror (the provider's window event) is this save's failure", async () => {
    const composer = makeComposer();
    sync.saveProject.mockImplementationOnce(async () => {
      window.dispatchEvent(new CustomEvent(SETTINGS_MIRROR_ERROR_EVENT, { detail: { message: "ogImage: Invalid url" } }));
      return { success: true, savedAt: new Date() };
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<SettingsTab composer={asComposer(composer)} projectId="site-1" />);
    await openSeoAndEdit();
    fireEvent.click(screen.getByTestId("set-foot-save"));
    await waitFor(() => expect(footStatus()).toBe("Changes not saved"));
    expect(screen.getByTestId("set-save-error").textContent).toBe(
      "SEO defaults were not saved. Your changes are still here. Review the values, then retry.",
    );
    expect(screen.queryByTestId("set-saved")).toBeNull();
    fireEvent.click(screen.getByTestId("set-foot-save"));
    await screen.findByTestId("set-saved");
    expect(sync.saveProject).toHaveBeenCalledTimes(2);
    errorSpy.mockRestore();
  });
});

// ─── Header action + immediate screens (S2) ───────────────────────────────

describe("SettingsTab — a screen's own header action, and screens whose actions apply at once", () => {
  it("renders what the screen registers at the header's right and clears it on a screen change", async () => {
    render(<SettingsTab composer={asComposer(makeComposer())} />);
    fireEvent.click(screen.getByTestId("set-nav-seo"));
    await waitFor(() => expect(headTitle()).toBe("SEO & publishing / SEO defaults"));
    /* The mocked SEO screen registers `Add thing` when told to. */
    fireEvent.click(screen.getByText("register header action"));
    expect(screen.getByTestId("set-head-action")).toHaveTextContent("Add thing");
    fireEvent.click(screen.getByTestId("set-nav-general"));
    await waitFor(() => expect(headTitle()).toBe("Site setup / General"));
    expect(screen.queryByTestId("set-head-action")).toBeNull();
  });

  it("a sub-view renames the header (`… / Browse all` + its line) until the screen returns it or changes", async () => {
    render(<SettingsTab composer={asComposer(makeComposer())} />);
    fireEvent.click(screen.getByTestId("set-nav-seo"));
    await waitFor(() => expect(headTitle()).toBe("SEO & publishing / SEO defaults"));
    fireEvent.click(screen.getByText("sub-view header"));
    expect(headTitle()).toBe("SEO & publishing / SEO defaults / Browse all");
    expect(screen.getByTestId("set-head-sub")).toHaveTextContent("All available things");
    fireEvent.click(screen.getByText("own header"));
    expect(headTitle()).toBe("SEO & publishing / SEO defaults");
    fireEvent.click(screen.getByText("sub-view header"));
    fireEvent.click(screen.getByTestId("set-nav-general"));
    await waitFor(() => expect(headTitle()).toBe("Site setup / General"));
  });

  it("Domains (3397:32206) has no Cancel / Save — `Actions apply immediately · nothing to save here` and Done", async () => {
    render(<SettingsTab composer={asComposer(makeComposer())} />);
    fireEvent.click(screen.getByTestId("set-nav-domains"));
    await waitFor(() => expect(headTitle()).toBe("SEO & publishing / Domains"));
    expect(footStatus()).toBe("Actions apply immediately · nothing to save here");
    expect(screen.queryByTestId("set-foot-save")).toBeNull();
    expect(screen.getByTestId("set-foot-done")).toHaveTextContent("Done");
  });
});

// ─── Load states ──────────────────────────────────────────────────────────

describe("SettingsTab — the footer follows the screen's load", () => {
  it("Loading settings… and Settings could not load, Save disabled in both", async () => {
    render(<SettingsTab composer={asComposer(makeComposer())} />);
    fireEvent.click(screen.getByTestId("set-nav-seo"));
    await waitFor(() => expect(headTitle()).toBe("SEO & publishing / SEO defaults"));
    const save = () => screen.getByTestId("set-foot-save") as HTMLButtonElement;
    fireEvent.click(screen.getByText("go loading"));
    expect(footStatus()).toBe("Loading settings…");
    expect(save().disabled).toBe(true);
    fireEvent.click(screen.getByText("go error"));
    expect(footStatus()).toBe("Settings could not load");
    expect(screen.getByTestId("set-foot-status").className).toContain("var(--bk-error)");
    expect(save().disabled).toBe(true);
    fireEvent.click(screen.getByText("go ready"));
    expect(footStatus()).toBe("All changes saved");
    expect(save().disabled).toBe(false);
  });
});

// ─── Search ───────────────────────────────────────────────────────────────

describe("SettingsTab — Search settings", () => {
  it("opens from the Overview header; a result opens its screen and lands on the field", async () => {
    render(<SettingsTab composer={asComposer(makeComposer())} />);
    fireEvent.click(screen.getByTestId("set-search-open"));
    expect(screen.getByTestId("set-search")).toBeTruthy();
    fireEvent.click(screen.getByTestId("set-search-row-0"));
    expect(screen.queryByTestId("set-search")).toBeNull();
    await waitFor(() => expect(headTitle()).toBe("SEO & publishing / SEO defaults"));
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));
    });
    expect(document.activeElement).toBe(document.getElementById("seo-meta-title"));
  });

  it("a field whose control has no id lands on its Field anchor's control", async () => {
    render(<SettingsTab composer={asComposer(makeComposer())} />);
    fireEvent.click(screen.getByTestId("set-search-open"));
    fireEvent.click(screen.getByTestId("set-search-row-1"));
    await waitFor(() => expect(headTitle()).toBe("Site setup / General"));
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));
    });
    const input = within(screen.getByTestId("set-field-site-name")).getByRole("textbox");
    expect(document.activeElement).toBe(input);
  });

  it("a dashboard section takes the same door as its sidebar row", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<SettingsTab composer={asComposer(makeComposer())} />);
    fireEvent.click(screen.getByTestId("set-search-open"));
    fireEvent.click(screen.getByTestId("set-search-row-2"));
    expect(open).toHaveBeenCalledWith(expect.stringContaining("/dashboard/settings/team"), "_blank", "noopener,noreferrer");
    expect(headTitle()).toBe("Settings");
    open.mockRestore();
  });
});

// ─── The Pages door (3519:19920) ──────────────────────────────────────────

describe("SettingsTab — ui:settings-open lands on a screen with the repair draft", () => {
  const request = (from: string) => ({
    screen: "redirects" as const,
    repair: { pageId: "p1", pageName: "About", from, to: "/about-us" },
  });

  it("opens Redirects with the draft; the screen's done drops it", async () => {
    const composer = asComposer(makeComposer());
    render(<SettingsTab composer={composer} openRequest={request("/about")} />);
    await waitFor(() => expect(headTitle()).toBe("SEO & publishing / Redirects"));
    expect(screen.getByTestId("fake-repair")).toHaveTextContent("Redirect for About · /about → /about-us");
    fireEvent.click(screen.getByText("repair done"));
    expect(screen.queryByTestId("fake-repair")).toBeNull();
    expect(headTitle()).toBe("SEO & publishing / Redirects");
  });

  it("leaving Redirects drops the draft; a fresh request brings a fresh one", async () => {
    const composer = asComposer(makeComposer());
    const { rerender } = render(<SettingsTab composer={composer} openRequest={request("/about")} />);
    await waitFor(() => expect(screen.getByTestId("fake-repair")).toBeTruthy());
    fireEvent.click(screen.getByTestId("set-nav-general"));
    await waitFor(() => expect(headTitle()).toBe("Site setup / General"));
    fireEvent.click(screen.getByTestId("set-nav-redirects"));
    await waitFor(() => expect(headTitle()).toBe("SEO & publishing / Redirects"));
    expect(screen.queryByTestId("fake-repair")).toBeNull();
    rerender(<SettingsTab composer={composer} openRequest={request("/team")} />);
    await waitFor(() => expect(screen.getByTestId("fake-repair")).toHaveTextContent("/team → /about-us"));
  });

  it("a request without a draft is a plain deep link", async () => {
    render(<SettingsTab composer={asComposer(makeComposer())} openRequest={{ screen: "headers" }} />);
    await waitFor(() => expect(headTitle()).toBe("Advanced / Headers"));
  });
});

// ─── Handlers registered in the shell's own mount commit ──────────────────

describe("SettingsTab — a screen mounted with the shell keeps its handlers", () => {
  it("reopening on the persisted screen: the screen's flush runs on Save (the shell's reset ran before the register)", async () => {
    /* The nav position persists per project; Settings reopens on it, so the
       screen mounts in the SAME commit as the shell. React runs a child's
       effects before its parent's: the screen registered its flush, then the
       shell's screen-change reset nulled it — Save flushed nothing and said
       Settings saved (found live on Redirects' suggester switch). */
    localStorage.setItem("buildrick-nav-settings-panel", JSON.stringify({ currentScreen: "seo" }));
    seoFlushes.length = 0;
    const composer = makeComposer();
    render(<SettingsTab composer={asComposer(composer)} />);
    await waitFor(() => expect(headTitle()).toBe("SEO & publishing / SEO defaults"));
    fireEvent.change(screen.getByLabelText("Meta title"), { target: { value: "x" } });
    fireEvent.click(screen.getByTestId("set-foot-save"));
    await waitFor(() => expect(composer.saveProject).toHaveBeenCalled());
    expect(seoFlushes).toEqual(["flushed"]);
  });
});

/**
 * SettingsTab — the Settings shell, Phase B IA (§25 / M0): the sidebar's
 * groups and doors, the scope line (M1), the read-only state (M2,
 * SCREEN_MIN_ROLE), the Overview, the footer's states, the deep link.
 *
 * Covers:
 *   Shell: the persistent sidebar (Back to canvas · Settings · site · Overview
 *     · six groups · the workspace doors under a separator · Pro on locked
 *     rows · the plan on Billing · the role + Permissions foot), the pane
 *     header per screen (title, scope line, subtitle), the footer per state.
 *   Doors: Brand ↗ → the Brand workspace · Members / Billing / Integrations &
 *     webhooks → the dashboard · Back / Escape → out. No Export, no Integrations.
 *   Guard: every door and every nav click while dirty raises Unsaved
 *     settings; Keep editing keeps; Discard remounts the screen and finishes
 *     the intent (out, or the clicked screen).
 *   Save (BE-3): the flush RETURNS the settings; with a site they go through
 *     the settings mutations (`saveSiteSettings`), never `sites.saveProject`,
 *     and the composer adopts them as saved; a refusal is `Not saved` +
 *     `Retry save` + the banner + the refused fields handed to the screen; a
 *     screen's own invalid fields disable Save.
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
import { ToastProvider } from "@/editor/chrome-ui";
/* The shell reports a save through the toast (4418:165469). */
const renderS = (ui: React.ReactElement) => render(ui, { wrapper: ToastProvider });
import * as React from "react";

const sync = vi.hoisted(() => ({
  saveProject: vi.fn(async (_siteId: string, _data: unknown) => ({ success: true, savedAt: new Date() })),
  saveSiteSettings: vi.fn(async (_siteId: string, _plan: unknown) => ({ legacyAnalyticsIds: [] as string[] })),
}));
vi.mock("@/services/BuildrikSyncProvider", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/BuildrikSyncProvider")>()),
  saveProject: sync.saveProject,
  saveSiteSettings: sync.saveSiteSettings,
  getEditorPlanTier: () => "starter",
}));

const role = vi.hoisted(() => ({ value: null as string | null }));
vi.mock("@/editor/shell/hooks/useEditorRole", () => ({ useEditorRole: () => role.value }));

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
    onSaveAndContinue,
  }: {
    open: boolean;
    onKeepEditing: () => void;
    onDiscard: () => void;
    onSaveAndContinue: () => void;
  }) =>
    open ? (
      <div role="dialog" data-testid="set-unsaved">
        <button type="button" data-testid="set-unsaved-keep" onClick={onKeepEditing}>
          Keep editing
        </button>
        <button type="button" data-testid="set-unsaved-discard" onClick={onDiscard}>
          Discard changes
        </button>
        <button type="button" data-testid="set-unsaved-save" onClick={onSaveAndContinue}>
          Save and continue
        </button>
      </div>
    ) : null,
}));

/* A screen that exercises the shell's load-state and save-error contract
   without a server: SEO stands in. */
const seoFlushes = vi.hoisted(() => [] as string[]);
vi.mock("../screens/SeoScreen", () => ({
  SeoScreen: ({
    composer,
    onLoadStateChange,
    onDirtyChange,
    saveError,
    registerHeaderAction,
    registerFlushHandler,
    registerHeader,
    registerFieldErrors,
    fieldErrors,
  }: {
    composer?: { getProjectSettings?: () => Record<string, unknown> } | null;
    onLoadStateChange?: (s: "loading" | "ready" | "error") => void;
    onDirtyChange?: (d: boolean) => void;
    saveError?: string | null;
    registerHeaderAction?: (node: React.ReactNode | null) => void;
    registerFlushHandler?: (handler: (() => Record<string, unknown> | void) | null) => void;
    registerHeader?: (header: { title?: string; subtitle?: string } | null) => void;
    registerFieldErrors?: (errors: Record<string, string> | null) => void;
    fieldErrors?: Record<string, string>;
  }) => {
    const typed = React.useRef<{ metaTitle?: string; twitterHandle?: string }>({});
    /* Registered the way the real screens do it — in a mount effect. The flush
       returns the settings to save (BE-3) and writes nothing itself. */
    React.useEffect(() => {
      registerFlushHandler?.(() => {
        seoFlushes.push("flushed");
        const current = composer?.getProjectSettings?.() ?? {};
        const seo = (current.seo ?? {}) as Record<string, unknown>;
        return { ...current, seo: { ...seo, ...typed.current } };
      });
      return () => registerFlushHandler?.(null);
    }, [registerFlushHandler, composer]);
    return (
    <div data-testid="fake-seo">
      {saveError ? <div data-testid="set-save-error">{saveError}</div> : null}
      {fieldErrors?.["seo.metaTitle"] ? <div data-testid="fake-seo-field-error">{fieldErrors["seo.metaTitle"]}</div> : null}
      <input
        id="seo-twitter"
        aria-label="Twitter handle"
        onChange={(e) => {
          typed.current.twitterHandle = e.target.value;
          onDirtyChange?.(true);
        }}
      />
      <button type="button" onClick={() => registerFieldErrors?.({ "seo.metaTitle": "Too long" })}>
        report invalid
      </button>
      <button type="button" onClick={() => registerFieldErrors?.(null)}>
        report valid
      </button>
      <button type="button" onClick={() => registerHeaderAction?.(<button type="button" data-testid="set-head-action">Add thing</button>)}>
        register header action
      </button>
      <input
        id="seo-meta-title"
        aria-label="Meta title"
        onChange={(e) => {
          typed.current.metaTitle = e.target.value;
          onDirtyChange?.(true);
        }}
      />
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
import { shellDirty } from "@/editor/shell/shellDirtyRegistry";
import { SettingsSaveError } from "@/services/BuildrikSyncProvider";

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
  adoptSavedProjectSettings: vi.fn(),
  isDirty: () => false,
  getProjectMetadata: () => ({ name: "Bella Cucina" }),
  updateProjectMetadata: vi.fn(),
  mergeProjectMetadata: vi.fn(),
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
  it("draws the sidebar: Back to canvas, Settings, the site, Overview, the §25 groups and the workspace doors", () => {
    renderS(<SettingsTab composer={asComposer(makeComposer())} userPlan="enterprise" />);
    expect(screen.getByTestId("set-back").textContent).toContain("Back to canvas");
    expect(screen.getByTestId("set-title").textContent).toBe("Settings");
    expect(screen.getByTestId("set-site").textContent).toBe("Bella Cucina");
    const nav = screen.getByRole("navigation", { name: /settings sections/i });
    const rows = Array.from(nav.querySelectorAll('[data-testid^="set-nav-"]'))
      .map((el) => el.getAttribute("data-testid")!)
      .filter((id) => !id.startsWith("set-nav-group-") && id !== "set-nav-plan");
    expect(rows).toEqual([
      "set-nav-overview",
      "set-nav-general",
      "set-nav-localization",
      "set-nav-branding",
      "set-nav-seo",
      "set-nav-domains",
      "set-nav-redirects",
      "set-nav-access",
      "set-nav-analytics",
      "set-nav-forms",
      "set-nav-custom-code",
      "set-nav-headers",
      "set-nav-danger-zone",
      "set-nav-members",
      "set-nav-billing",
      "set-nav-webhooks",
    ]);
    const text = (id: string) => screen.getByTestId(`set-nav-${id}`).textContent?.trim();
    expect(text("localization")).toBe("Languages");
    expect(text("seo")).toBe("SEO");
    expect(text("forms")).toBe("Form submissions");
    expect(text("headers")).toBe("Security headers");
    expect(text("webhooks")).toBe("Integrations & webhooks");
    expect(text("billing")).toBe("BillingBusiness");
    // PD-2 / §24: no Integrations screen, no Export row.
    expect(screen.queryByTestId("set-nav-integrations")).toBeNull();
    expect(screen.queryByTestId("set-nav-export")).toBeNull();
    const groups = Array.from(nav.querySelectorAll('[data-testid^="set-nav-group-"]')).map((el) => el.textContent);
    expect(groups).toEqual([
      "Site",
      "Search & sharing",
      "Publishing",
      "Visitors",
      "Advanced",
      "Danger zone",
      "Managed in workspace settings ↗",
    ]);
    // M0: the workspace doors sit under a separator, the label carrying ↗.
    expect(screen.getByTestId("set-nav-group-workspace").previousElementSibling?.tagName).toBe("HR");
    expect(screen.getByTestId("set-nav-overview").getAttribute("aria-current")).toBe("page");
    // The search field is always there (8134:212121).
    expect(screen.getByRole("searchbox", { name: "Search site settings" })).toBeTruthy();
    // M0: Billing carries the plan.
    expect(within(screen.getByTestId("set-nav-billing")).getByTestId("set-nav-plan").textContent).toBe("Business");
  });

  it("puts a Pro pill on the plan-locked rows (Custom code, Access) for a starter plan", () => {
    renderS(<SettingsTab composer={asComposer(makeComposer())} userPlan="starter" />);
    expect(screen.getByTestId("set-nav-pro-custom-code").textContent).toBe("Pro");
    expect(screen.getByTestId("set-nav-pro-access").textContent).toBe("Pro");
    expect(screen.getByTestId("set-nav-custom-code").querySelector("[data-locked]")).toBeTruthy();
    expect(screen.queryByTestId("set-nav-pro-general")).toBeNull();
    expect(within(screen.getByTestId("set-nav-billing")).getByTestId("set-nav-plan").textContent).toBe("Free");
    cleanup();
    renderS(<SettingsTab composer={asComposer(makeComposer())} userPlan="pro" />);
    expect(screen.queryByTestId("set-nav-pro-custom-code")).toBeNull();
    expect(screen.queryByTestId("set-nav-pro-access")).toBeNull();
  });

  it("lands on the Overview (4418:128917): a bare title, no subtitle, no header search and no footer", () => {
    const onClose = vi.fn();
    renderS(<SettingsTab composer={asComposer(makeComposer())} onClose={onClose} />);
    expect(headTitle()).toBe("Overview");
    expect(screen.queryByTestId("set-head-sub")).toBeNull();
    expect(screen.queryByTestId("set-search-open")).toBeNull();
    expect(screen.getByTestId("fake-overview")).toBeTruthy();
    expect(screen.queryByTestId("set-foot-status")).toBeNull();
    expect(screen.queryByTestId("set-foot-save")).toBeNull();
    // Back to canvas is the way out.
    fireEvent.click(screen.getByTestId("set-back"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("an Overview row is the same nav as the sidebar", async () => {
    renderS(<SettingsTab composer={asComposer(makeComposer())} projectId="site-1" />);
    fireEvent.click(screen.getByTestId("set-ov-row-domains"));
    await waitFor(() => expect(headTitle()).toBe("Domains"));
    expect(screen.getByTestId("set-nav-domains").getAttribute("aria-current")).toBe("page");
  });

  it("a screen gets its title and scope line (8134:212121), the current row on the tint, and its save bar", async () => {
    renderS(<SettingsTab composer={asComposer(makeComposer())} />);
    fireEvent.click(screen.getByTestId("set-nav-general"));
    await waitFor(() => expect(headTitle()).toBe("General"));
    expect(screen.getByTestId("set-head-scope").textContent).toBe("Bella Cucina · all pages · applies on next publish");
    expect(screen.queryByTestId("set-head-sub")).toBeNull();
    const row = screen.getByTestId("set-nav-general");
    expect(row.getAttribute("aria-current")).toBe("page");
    expect(row.className).toContain("tw:bg-[var(--bk-accent-tint)]");
    expect(screen.getByTestId("set-nav-overview").getAttribute("aria-current")).toBeNull();
    // 8134:212718: a clean footer screen keeps its save bar, both actions disabled.
    expect(footStatus()).toBe("All changes saved");
    expect((screen.getByTestId("set-foot-save") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTestId("set-foot-discard") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByTestId("set-card-site-identity")).toBeTruthy();
  });

  it("the plan gate puts Upgrade in the header and the locked card in the body", async () => {
    renderS(<SettingsTab composer={asComposer(makeComposer())} userPlan="starter" />);
    fireEvent.click(screen.getByTestId("set-nav-custom-code"));
    await waitFor(() => expect(headTitle()).toBe("Custom code"));
    expect(screen.getByTestId("set-head-upgrade").textContent).toBe("Upgrade");
    expect(screen.getByText(/Custom code is a Pro feature/)).toBeTruthy();
    /* 3397:32859 draws no footer under the locked card. */
    expect(screen.queryByTestId("set-foot-save")).toBeNull();
    expect(screen.queryByTestId("set-foot-status")).toBeNull();
    cleanup();
    renderS(<SettingsTab composer={asComposer(makeComposer())} userPlan="enterprise" />);
    fireEvent.click(screen.getByTestId("set-nav-custom-code"));
    await waitFor(() => expect(headTitle()).toBe("Custom code"));
    expect(screen.queryByTestId("set-head-upgrade")).toBeNull();
    expect(screen.queryByText(/Custom code is a Pro feature/)).toBeNull();
  });

  it("deep-links to a screen; the removed Integrations (and any id that names no screen) stays on the Overview", async () => {
    renderS(<SettingsTab composer={asComposer(makeComposer())} userPlan="enterprise" initialScreen="access" />);
    await waitFor(() => expect(headTitle()).toBe("Access"));
    cleanup();
    localStorage.clear(); // the nav position persists per project
    for (const gone of ["integrations", "plugins", "not-a-screen"]) {
      renderS(<SettingsTab composer={asComposer(makeComposer())} initialScreen={gone} />);
      await new Promise((r) => setTimeout(r, 30));
      expect(headTitle()).toBe("Overview");
      cleanup();
    }
  });

  it("a saved nav position naming a removed screen lands on the Overview", async () => {
    localStorage.setItem("buildrick-nav-settings-panel", JSON.stringify({ currentScreen: "integrations" }));
    renderS(<SettingsTab composer={asComposer(makeComposer())} />);
    await new Promise((r) => setTimeout(r, 30));
    expect(headTitle()).toBe("Overview");
  });
});

// ─── Doors ────────────────────────────────────────────────────────────────

describe("SettingsTab — doors", () => {
  it("Brand ↗ opens the Brand workspace and stays where it was", () => {
    const onOpenDesignTab = vi.fn();
    renderS(<SettingsTab composer={asComposer(makeComposer())} onOpenDesignTab={onOpenDesignTab} />);
    fireEvent.click(screen.getByTestId("set-nav-branding"));
    expect(onOpenDesignTab).toHaveBeenCalledTimes(1);
    expect(headTitle()).toBe("Overview");
  });

  it("the role foot opens the Permissions dialog for every known role", () => {
    role.value = "EDITOR";
    const composer = makeComposer();
    renderS(<SettingsTab composer={asComposer(composer)} />);
    expect(screen.getByTestId("set-role").textContent).toContain("Your role: Editor");
    fireEvent.click(screen.getByTestId("set-role-permissions"));
    expect(composer.emit).toHaveBeenCalledWith("ui:open-permissions", undefined);
    role.value = null;
    cleanup();
    renderS(<SettingsTab composer={asComposer(makeComposer())} />);
    expect(screen.queryByTestId("set-role")).toBeNull();
  });

  it("Back to canvas and Escape both leave a clean screen", async () => {
    const onClose = vi.fn();
    renderS(<SettingsTab composer={asComposer(makeComposer())} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("set-nav-general"));
    await waitFor(() => expect(headTitle()).toBe("General"));
    fireEvent.click(screen.getByTestId("set-back"));
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
    // A clean screen's Discard is disabled (8134:212718).
    expect((screen.getByTestId("set-foot-discard") as HTMLButtonElement).disabled).toBe(true);
    // An input keeps its own Escape.
    const input = await screen.findByLabelText("Site name");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

// ─── The guard ────────────────────────────────────────────────────────────

describe("SettingsTab — Unsaved settings", () => {
  it("Back to canvas while dirty raises the dialog; Keep editing keeps the edits", async () => {
    const onClose = vi.fn();
    renderS(<SettingsTab composer={asComposer(makeComposer())} onClose={onClose} />);
    await openGeneralAndEdit();
    fireEvent.click(screen.getByTestId("set-back"));
    expect(screen.getByTestId("set-unsaved")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("set-unsaved-keep"));
    expect(screen.queryByTestId("set-unsaved")).toBeNull();
    expect(footStatus()).toBe("Unsaved changes");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("the footer's Discard (4418:127966 save bar) rolls back in place and stays on the screen", async () => {
    const composer = makeComposer();
    const onClose = vi.fn();
    renderS(<SettingsTab composer={asComposer(composer)} onClose={onClose} />);
    await openGeneralAndEdit();
    fireEvent.click(screen.getByTestId("set-foot-discard"));
    // The edit lived only in the screen; Discard remounts it — the composer is untouched.
    expect(composer.setProjectSettings).not.toHaveBeenCalled();
    expect(((await screen.findByLabelText("Site name")) as HTMLInputElement).value).not.toBe("Edited Site");
    expect(screen.queryByTestId("set-unsaved")).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    expect(headTitle()).toBe("General");
    expect(footStatus()).toBe("All changes saved");
  });

  it("the guard's Discard drops the edits without touching the composer and returns to the canvas", async () => {
    const composer = makeComposer();
    const onClose = vi.fn();
    renderS(<SettingsTab composer={asComposer(composer)} onClose={onClose} />);
    await openGeneralAndEdit();
    fireEvent.click(screen.getByTestId("set-back"));
    fireEvent.click(screen.getByTestId("set-unsaved-discard"));
    expect(composer.setProjectSettings).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Escape while dirty raises the dialog instead of leaving", async () => {
    const onClose = vi.fn();
    renderS(<SettingsTab composer={asComposer(makeComposer())} onClose={onClose} />);
    await openGeneralAndEdit();
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(screen.getByTestId("set-unsaved")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("a nav click while dirty raises the dialog; Discard finishes that click", async () => {
    const onClose = vi.fn();
    renderS(<SettingsTab composer={asComposer(makeComposer())} onClose={onClose} />);
    await openGeneralAndEdit();
    fireEvent.click(screen.getByTestId("set-nav-seo"));
    expect(screen.getByTestId("set-unsaved")).toBeTruthy();
    expect(headTitle()).toBe("General");
    fireEvent.click(screen.getByTestId("set-unsaved-discard"));
    await waitFor(() => expect(headTitle()).toBe("SEO"));
    expect(onClose).not.toHaveBeenCalled();
    expect(footStatus()).toBe("All changes saved");
  });

  it("Save and continue (4418:165478) saves, then finishes the nav that raised the guard", async () => {
    const composer = makeComposer();
    renderS(<SettingsTab composer={asComposer(composer)} />);
    await openGeneralAndEdit();
    fireEvent.click(screen.getByTestId("set-nav-seo"));
    fireEvent.click(screen.getByTestId("set-unsaved-save"));
    await waitFor(() => expect(headTitle()).toBe("SEO"));
    expect(composer.saveProject).toHaveBeenCalledTimes(1);
    // No Saved toast on the way through — the nav is the answer.
    expect(screen.queryByText("Saved · applies on next publish")).toBeNull();
    expect(screen.queryByTestId("set-unsaved")).toBeNull();
  });

  it("Save and continue on the way out saves, then leaves", async () => {
    const composer = makeComposer();
    const onClose = vi.fn();
    renderS(<SettingsTab composer={asComposer(composer)} onClose={onClose} />);
    await openGeneralAndEdit();
    fireEvent.click(screen.getByTestId("set-back"));
    fireEvent.click(screen.getByTestId("set-unsaved-save"));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(composer.saveProject).toHaveBeenCalledTimes(1);
  });

  it("a door while dirty is guarded too", async () => {
    const onOpenDesignTab = vi.fn();
    renderS(<SettingsTab composer={asComposer(makeComposer())} onOpenDesignTab={onOpenDesignTab} />);
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
  it("a successful save (no site: the demo's own storage) shows the Saved toast with Publish, and settles the footer", async () => {
    const composer = makeComposer();
    renderS(<SettingsTab composer={asComposer(composer)} />);
    await openGeneralAndEdit();
    fireEvent.click(screen.getByTestId("set-foot-save"));
    await screen.findByText("Saved · applies on next publish");
    expect(composer.setProjectSettings).toHaveBeenCalledWith(
      expect.objectContaining({ seo: expect.objectContaining({ siteName: "Edited Site" }) }),
    );
    expect(composer.saveProject).toHaveBeenCalledTimes(1);
    // Settled: nothing left to save.
    expect(footStatus()).toBe("All changes saved");
    // M19: Publish opens the Publish panel — it does not publish.
    fireEvent.click(screen.getByText("Publish"));
    expect(composer.emit).toHaveBeenCalledWith("panel:open", { panel: "publish" });
  });

  it("a failed save: `Not saved`, `Retry save`, the screen's banner — and the retry saves", async () => {
    let attempt = 0;
    const composer = makeComposer(() => (attempt++ === 0 ? Promise.reject(new Error("503")) : Promise.resolve()));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    renderS(<SettingsTab composer={asComposer(composer)} />);
    fireEvent.click(screen.getByTestId("set-nav-seo"));
    await waitFor(() => expect(headTitle()).toBe("SEO"));
    fireEvent.change(screen.getByLabelText("Meta title"), { target: { value: "x" } });
    await waitFor(() => expect(footStatus()).toBe("Unsaved changes"));
    fireEvent.click(screen.getByTestId("set-foot-save"));
    await waitFor(() => expect(footStatus()).toBe("Not saved"));
    expect(screen.getByTestId("set-foot-status").className).toContain("var(--bk-error)");
    expect(screen.getByTestId("set-foot-save").textContent).toBe("Retry save");
    expect(screen.getByTestId("set-save-error").textContent).toBe(
      "SEO settings were not saved. Your changes are still here. Review the values, then retry.",
    );
    expect(screen.queryByText("Saved · applies on next publish")).toBeNull();
    fireEvent.click(screen.getByTestId("set-foot-save"));
    await screen.findByText("Saved · applies on next publish");
    expect(composer.saveProject).toHaveBeenCalledTimes(2);
    expect(screen.queryByTestId("set-save-error")).toBeNull();
    expect(footStatus()).toBe("All changes saved");
    errorSpy.mockRestore();
  });
});

/* BE-3: the shipping editor (a site id) saves Settings through the two
   settings mutations — `saveSiteSettings` — never `sites.saveProject`, and the
   composer takes the values as SAVED state (no dirty flag, no autosave). */
describe("SettingsTab — Save with a site id goes through the settings mutations", () => {
  beforeEach(() => {
    sync.saveProject.mockClear();
    sync.saveSiteSettings.mockReset().mockResolvedValue({ legacyAnalyticsIds: [] });
  });

  /* The SEO screen is mocked above (a real General would read the server). */
  async function openSeoAndEdit(field = "Meta title", value = "x") {
    fireEvent.click(screen.getByTestId("set-nav-seo"));
    await waitFor(() => expect(headTitle()).toBe("SEO"));
    fireEvent.change(screen.getByLabelText(field), { target: { value } });
    await waitFor(() => expect(footStatus()).toBe("Unsaved changes"));
  }

  it("sends the changed column, never sites.saveProject; the composer adopts the values as saved", async () => {
    const composer = makeComposer();
    renderS(<SettingsTab composer={asComposer(composer)} projectId="site-1" />);
    await openSeoAndEdit();
    fireEvent.click(screen.getByTestId("set-foot-save"));
    await screen.findByText("Saved · applies on next publish");
    expect(sync.saveSiteSettings).toHaveBeenCalledTimes(1);
    expect(sync.saveSiteSettings).toHaveBeenCalledWith("site-1", { columns: { metaTitle: "x" }, projectSettings: null, unrouted: false });
    expect(sync.saveProject).not.toHaveBeenCalled();
    expect(composer.saveProject).not.toHaveBeenCalled();
    expect(composer.setProjectSettings).not.toHaveBeenCalled();
    expect(composer.adoptSavedProjectSettings).toHaveBeenCalledWith({ seo: { siteName: "Test Site", metaTitle: "x" } });
    // Nothing else was waiting, so the document is as saved as it was.
    expect(composer.markSaved).toHaveBeenCalledTimes(1);
  });

  it("a refusal: Not saved, the banner, the refused field handed back to the screen — and the retry saves", async () => {
    const composer = makeComposer();
    sync.saveSiteSettings.mockRejectedValueOnce(new SettingsSaveError("metaTitle: Too long", { "seo.metaTitle": "Too long" }));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    renderS(<SettingsTab composer={asComposer(composer)} projectId="site-1" />);
    await openSeoAndEdit();
    fireEvent.click(screen.getByTestId("set-foot-save"));
    await waitFor(() => expect(footStatus()).toBe("Not saved"));
    expect(screen.getByTestId("set-save-error").textContent).toBe(
      "SEO settings were not saved. Your changes are still here. Review the values, then retry.",
    );
    expect(screen.getByTestId("fake-seo-field-error").textContent).toBe("Too long");
    expect(composer.adoptSavedProjectSettings).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("set-foot-save"));
    await screen.findByText("Saved · applies on next publish");
    expect(sync.saveSiteSettings).toHaveBeenCalledTimes(2);
    expect(screen.queryByTestId("fake-seo-field-error")).toBeNull();
    errorSpy.mockRestore();
  });

  it("a change no settings mutation covers yet is handed to the composer as an edit, so the project save carries it", async () => {
    const composer = makeComposer();
    renderS(<SettingsTab composer={asComposer(composer)} projectId="site-1" />);
    await openSeoAndEdit("Twitter handle", "@bella");
    fireEvent.click(screen.getByTestId("set-foot-save"));
    await screen.findByText("Saved · applies on next publish");
    expect(sync.saveSiteSettings).toHaveBeenCalledWith("site-1", { columns: {}, projectSettings: null, unrouted: true });
    expect(composer.setProjectSettings).toHaveBeenCalledWith({ seo: { siteName: "Test Site", twitterHandle: "@bella" } });
    expect(composer.adoptSavedProjectSettings).not.toHaveBeenCalled();
  });

  it("the screen's own invalid fields disable Save until they are fixed (§27)", async () => {
    renderS(<SettingsTab composer={asComposer(makeComposer())} projectId="site-1" />);
    await openSeoAndEdit();
    const save = () => screen.getByTestId("set-foot-save") as HTMLButtonElement;
    expect(save().disabled).toBe(false);
    fireEvent.click(screen.getByText("report invalid"));
    expect(save().disabled).toBe(true);
    fireEvent.click(screen.getByText("report valid"));
    expect(save().disabled).toBe(false);
  });
});

// ─── Header action + immediate screens (S2) ───────────────────────────────

describe("SettingsTab — a screen's own header action, and screens whose actions apply at once", () => {
  it("renders what the screen registers at the header's right and clears it on a screen change", async () => {
    renderS(<SettingsTab composer={asComposer(makeComposer())} />);
    fireEvent.click(screen.getByTestId("set-nav-seo"));
    await waitFor(() => expect(headTitle()).toBe("SEO"));
    /* The mocked SEO screen registers `Add thing` when told to. */
    fireEvent.click(screen.getByText("register header action"));
    expect(screen.getByTestId("set-head-action")).toHaveTextContent("Add thing");
    fireEvent.click(screen.getByTestId("set-nav-general"));
    await waitFor(() => expect(headTitle()).toBe("General"));
    expect(screen.queryByTestId("set-head-action")).toBeNull();
  });

  it("a sub-view renames the header (`… / Browse all` + its line) until the screen returns it or changes", async () => {
    renderS(<SettingsTab composer={asComposer(makeComposer())} />);
    fireEvent.click(screen.getByTestId("set-nav-seo"));
    await waitFor(() => expect(headTitle()).toBe("SEO"));
    fireEvent.click(screen.getByText("sub-view header"));
    expect(headTitle()).toBe("SEO / Browse all");
    expect(screen.getByTestId("set-head-sub")).toHaveTextContent("All available things");
    fireEvent.click(screen.getByText("own header"));
    expect(headTitle()).toBe("SEO");
    fireEvent.click(screen.getByText("sub-view header"));
    fireEvent.click(screen.getByTestId("set-nav-general"));
    await waitFor(() => expect(headTitle()).toBe("General"));
  });

  it("Domains (8134:212529) has no footer; its scope line says it is live at once", async () => {
    renderS(<SettingsTab composer={asComposer(makeComposer())} />);
    fireEvent.click(screen.getByTestId("set-nav-domains"));
    await waitFor(() => expect(headTitle()).toBe("Domains"));
    expect(screen.getByTestId("set-head-scope").textContent).toBe("Live immediately · no publish needed");
    expect(screen.queryByTestId("set-foot-status")).toBeNull();
    expect(screen.queryByTestId("set-foot-save")).toBeNull();
  });
});

// ─── Load states ──────────────────────────────────────────────────────────

describe("SettingsTab — the footer follows the screen's load", () => {
  it("Loading settings… and Settings could not load, Save disabled in both", async () => {
    renderS(<SettingsTab composer={asComposer(makeComposer())} />);
    fireEvent.click(screen.getByTestId("set-nav-seo"));
    await waitFor(() => expect(headTitle()).toBe("SEO"));
    const save = () => screen.getByTestId("set-foot-save") as HTMLButtonElement;
    fireEvent.click(screen.getByText("go loading"));
    expect(footStatus()).toBe("Loading settings…");
    expect(save().disabled).toBe(true);
    fireEvent.click(screen.getByText("go error"));
    expect(footStatus()).toBe("Settings could not load");
    expect(screen.getByTestId("set-foot-status").className).toContain("var(--bk-error)");
    expect(save().disabled).toBe(true);
    fireEvent.click(screen.getByText("go ready"));
    // Ready and clean: the save bar says so, Save disabled (8134:212718).
    expect(footStatus()).toBe("All changes saved");
    expect(save().disabled).toBe(true);
  });
});

// ─── Search ───────────────────────────────────────────────────────────────

/* G3-097 · 6816:60270: search is an inline sidebar filter, not a modal —
   the ⌕ opens a field under the site name, the nav narrows to matching rows
   (a field's label matches its screen), and "Search everywhere" hands the
   query to ⌘K. A row reached through a field still lands on that field. */
describe("SettingsTab — Search settings (inline filter)", () => {
  const field = () => screen.getByRole("searchbox", { name: "Search site settings" }) as HTMLInputElement;
  const navIds = () =>
    Array.from(screen.getByRole("navigation", { name: "Settings sections" }).querySelectorAll("[data-testid^='set-nav-']")).map((e) =>
      e.getAttribute("data-testid")!.slice("set-nav-".length),
    );

  it("the field is always there (8134:212121); typing narrows the nav to matches, with their group label", () => {
    renderS(<SettingsTab composer={asComposer(makeComposer())} />);
    expect(field().placeholder).toBe("Search site settings");
    expect(navIds()).toContain("overview");
    fireEvent.change(field(), { target: { value: "dns" } });
    expect(navIds()).toEqual(["group-publishing", "domains"]);
    const nav = screen.getByRole("navigation", { name: "Settings sections" });
    expect(within(nav).getByText("Publishing", { exact: false })).toBeTruthy();
    expect(within(nav).queryByText("Search & sharing", { exact: false })).toBeNull();
    fireEvent.change(field(), { target: { value: "domain" } });
    expect(screen.getByTestId("set-search-everywhere").textContent).toContain('"domain"');
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("a row matched by a field label opens its screen and lands on the field", async () => {
    renderS(<SettingsTab composer={asComposer(makeComposer())} />);
    fireEvent.change(field(), { target: { value: "meta title" } });
    expect(navIds()).toEqual(["group-search-sharing", "seo"]);
    fireEvent.click(screen.getByTestId("set-nav-seo"));
    await waitFor(() => expect(headTitle()).toBe("SEO"));
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));
    });
    expect(document.activeElement).toBe(document.getElementById("seo-meta-title"));
    // The filter stays while the screen is open (the board shows both).
    expect(field().value).toBe("meta title");
  });

  it("a field whose control has no id lands on its Field anchor's control", async () => {
    renderS(<SettingsTab composer={asComposer(makeComposer())} />);
    fireEvent.change(field(), { target: { value: "site name" } });
    fireEvent.click(screen.getByTestId("set-nav-general"));
    await waitFor(() => expect(headTitle()).toBe("General"));
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));
    });
    const input = within(screen.getByTestId("set-field-site-name")).getByRole("textbox");
    expect(document.activeElement).toBe(input);
  });

  it("Search everywhere hands the query to the ⌘K palette", () => {
    const composer = makeComposer();
    renderS(<SettingsTab composer={asComposer(composer)} />);
    fireEvent.change(field(), { target: { value: "domain" } });
    fireEvent.click(screen.getByTestId("set-search-everywhere"));
    expect(composer.emit).toHaveBeenCalledWith("ui:toggle:command-palette", { query: "domain" });
  });

  it("no match says so; ✕ closes the field and brings the whole nav back", () => {
    renderS(<SettingsTab composer={asComposer(makeComposer())} />);
    fireEvent.change(field(), { target: { value: "zzqx" } });
    expect(navIds()).toEqual([]);
    expect(screen.getByTestId("set-search-empty").textContent).toContain("zzqx");
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(field().value).toBe("");
    expect(navIds()).toContain("general");
  });

  it("Escape in the field closes the search, not Settings", () => {
    const onClose = vi.fn();
    renderS(<SettingsTab composer={asComposer(makeComposer())} onClose={onClose} />);
    fireEvent.change(field(), { target: { value: "seo" } });
    fireEvent.keyDown(field(), { key: "Escape" });
    expect(field().value).toBe("");
    expect(onClose).not.toHaveBeenCalled();
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
    renderS(<SettingsTab composer={composer} openRequest={request("/about")} />);
    await waitFor(() => expect(headTitle()).toBe("Redirects"));
    expect(screen.getByTestId("fake-repair")).toHaveTextContent("Redirect for About · /about → /about-us");
    fireEvent.click(screen.getByText("repair done"));
    expect(screen.queryByTestId("fake-repair")).toBeNull();
    expect(headTitle()).toBe("Redirects");
  });

  it("leaving Redirects drops the draft; a fresh request brings a fresh one", async () => {
    const composer = asComposer(makeComposer());
    const { rerender } = renderS(<SettingsTab composer={composer} openRequest={request("/about")} />);
    await waitFor(() => expect(screen.getByTestId("fake-repair")).toBeTruthy());
    fireEvent.click(screen.getByTestId("set-nav-general"));
    await waitFor(() => expect(headTitle()).toBe("General"));
    fireEvent.click(screen.getByTestId("set-nav-redirects"));
    await waitFor(() => expect(headTitle()).toBe("Redirects"));
    expect(screen.queryByTestId("fake-repair")).toBeNull();
    rerender(<SettingsTab composer={composer} openRequest={request("/team")} />);
    await waitFor(() => expect(screen.getByTestId("fake-repair")).toHaveTextContent("/team → /about-us"));
  });

  it("a request without a draft is a plain deep link", async () => {
    renderS(<SettingsTab composer={asComposer(makeComposer())} openRequest={{ screen: "headers" }} />);
    await waitFor(() => expect(headTitle()).toBe("Security headers"));
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
    renderS(<SettingsTab composer={asComposer(composer)} />);
    await waitFor(() => expect(headTitle()).toBe("SEO"));
    fireEvent.change(screen.getByLabelText("Meta title"), { target: { value: "x" } });
    fireEvent.click(screen.getByTestId("set-foot-save"));
    await waitFor(() => expect(composer.saveProject).toHaveBeenCalled());
    expect(seoFlushes).toEqual(["flushed"]);
  });
});

/* SA-21 / M2: below a screen's SCREEN_MIN_ROLE the whole screen is
   read-only — the banner says who can change it, every native control is
   disabled, and the header action and footer go. Unknown role: editable, the
   server decides. */
describe("SettingsTab — read-only below the screen's role", () => {
  afterEach(() => {
    role.value = null;
  });

  it("an EDITOR on General (ADMIN): the banner, every control disabled, no footer", async () => {
    role.value = "EDITOR";
    renderS(<SettingsTab composer={asComposer(makeComposer())} />);
    fireEvent.click(screen.getByTestId("set-nav-general"));
    const siteName = (await screen.findByLabelText("Site name")) as HTMLInputElement;
    expect(screen.getByTestId("set-readonly").textContent).toBe("Only admins can change General");
    expect(siteName.matches(":disabled")).toBe(true);
    expect((screen.getByLabelText("Author") as HTMLInputElement).matches(":disabled")).toBe(true);
    expect(screen.queryByTestId("set-foot-save")).toBeNull();
  });

  it("an EDITOR on Security headers (ADMIN) — the plan's done-condition screen", async () => {
    role.value = "EDITOR";
    renderS(<SettingsTab composer={asComposer(makeComposer())} />);
    fireEvent.click(screen.getByTestId("set-nav-headers"));
    await waitFor(() => expect(headTitle()).toBe("Security headers"));
    expect(screen.getByTestId("set-readonly").textContent).toBe("Only admins can change Security headers");
    expect(screen.getByTestId("set-readonly-screen").matches(":disabled")).toBe(true);
    expect(screen.queryByTestId("set-foot-save")).toBeNull();
  });

  it("an EDITOR on Analytics (EDITOR) edits as before; an ADMIN on the Danger zone (OWNER) reads", async () => {
    role.value = "EDITOR";
    renderS(<SettingsTab composer={asComposer(makeComposer())} />);
    fireEvent.click(screen.getByTestId("set-nav-analytics"));
    await waitFor(() => expect(headTitle()).toBe("Analytics"));
    expect(screen.queryByTestId("set-readonly")).toBeNull();
    cleanup();
    role.value = "ADMIN";
    renderS(<SettingsTab composer={asComposer(makeComposer())} />);
    fireEvent.click(screen.getByTestId("set-nav-danger-zone"));
    await waitFor(() => expect(headTitle()).toBe("Danger zone"));
    expect(screen.getByTestId("set-readonly").textContent).toBe("Only the workspace owner can change Danger zone");
  });

  it("a read-only screen shows no header action", async () => {
    role.value = "EDITOR";
    renderS(<SettingsTab composer={asComposer(makeComposer())} />);
    fireEvent.click(screen.getByTestId("set-nav-seo"));
    await waitFor(() => expect(headTitle()).toBe("SEO"));
    // The mocked SEO screen's buttons are inside the disabled fieldset.
    expect(screen.getByText("register header action").matches(":disabled")).toBe(true);
    expect(screen.queryByTestId("set-head-action")).toBeNull();
    expect(screen.queryByTestId("set-head-immediate")).toBeNull();
  });

  it("an ADMIN, and an unknown role (demo, lookup failed), edit General", async () => {
    for (const value of ["ADMIN", null]) {
      role.value = value;
      renderS(<SettingsTab composer={asComposer(makeComposer())} />);
      fireEvent.click(screen.getByTestId("set-nav-general"));
      const siteName = (await screen.findByLabelText("Site name")) as HTMLInputElement;
      expect(siteName.matches(":disabled")).toBe(false);
      expect(screen.queryByTestId("set-readonly")).toBeNull();
      cleanup();
    }
  });
});

/* B-1: Settings owns its entry in the shell dirty registry — the one source
   the shell's tab-switch guard, the exit guard and beforeunload read. It is
   cleared only when Settings actually unmounts (its buffers are gone then). */
describe("SettingsTab — shell dirty registry entry", () => {
  it("registers dirty while a screen has unsaved edits and clears it on unmount", async () => {
    const composer = makeComposer();
    const { unmount } = renderS(<SettingsTab composer={asComposer(composer)} />);
    expect(shellDirty.get()).toBe(false);
    fireEvent.click(screen.getByTestId("set-nav-seo"));
    await waitFor(() => expect(headTitle()).toBe("SEO"));
    fireEvent.change(screen.getByLabelText("Meta title"), { target: { value: "x" } });
    await waitFor(() => expect(shellDirty.get()).toBe(true));
    unmount();
    expect(shellDirty.get()).toBe(false);
  });
});

/* B-1 fix. The shell's tab-switch guard reads the registry the moment
   Settings' own door runs onClose — Settings' own Discard / Save and
   continue already answered the question, so by then its entry must be
   clear, or the user is asked twice. And the shell's "Leave anyway" runs
   Settings' registered discard: the screens write to the composer live, so
   leaving without a rollback would keep the "lost" values for the next save. */
describe("SettingsTab — its registry entry is honest at every door", () => {
  async function editGeneral() {
    fireEvent.click(screen.getByTestId("set-nav-general"));
    await waitFor(() => expect(headTitle()).toBe("General"));
    fireEvent.change(screen.getByLabelText("Site name"), { target: { value: "x" } });
    await waitFor(() => expect(shellDirty.get()).toBe(true));
  }

  it("Discard in Settings' own dialog clears the entry before leaving — the shell guard sees nothing", async () => {
    let dirtyAtClose: boolean | null = null;
    const onClose = vi.fn(() => (dirtyAtClose = shellDirty.get()));
    renderS(<SettingsTab composer={asComposer(makeComposer())} onClose={onClose} />);
    await editGeneral();
    fireEvent.click(screen.getByTestId("set-back"));
    fireEvent.click(screen.getByTestId("set-unsaved-discard"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(dirtyAtClose).toBe(false);
  });

  it("Save and continue clears the entry before leaving — the shell guard sees nothing", async () => {
    let dirtyAtClose: boolean | null = null;
    const onClose = vi.fn(() => (dirtyAtClose = shellDirty.get()));
    renderS(<SettingsTab composer={asComposer(makeComposer())} onClose={onClose} />);
    await editGeneral();
    fireEvent.click(screen.getByTestId("set-back"));
    fireEvent.click(screen.getByTestId("set-unsaved-save"));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(dirtyAtClose).toBe(false);
  });

  it("the shell's Leave anyway (discardDirty) drops the edits and clears the entry, leaving the composer alone", async () => {
    const composer = makeComposer();
    renderS(<SettingsTab composer={asComposer(composer)} />);
    await editGeneral();
    act(() => shellDirty.discardDirty());
    expect(composer.setProjectSettings).not.toHaveBeenCalled();
    expect(shellDirty.get()).toBe(false);
  });
});

/* 8139:217358: a workspace row opens its door card in the pane. */
describe("SettingsTab — workspace doors", () => {
  it("Integrations & webhooks: the row is current, the card names the workspace, Open leaves for the dashboard, Close returns", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    renderS(<SettingsTab composer={asComposer(makeComposer())} />);
    fireEvent.click(screen.getByTestId("set-nav-webhooks"));
    await waitFor(() => expect(headTitle()).toBe("Integrations & webhooks"));
    expect(screen.getByTestId("set-nav-webhooks").getAttribute("aria-current")).toBe("page");
    expect(screen.getByTestId("set-head-scope").textContent).toBe("Your workspace · all sites · managed in workspace settings");
    expect(screen.getByTestId("set-door-webhooks").textContent).toContain("Your workspace · Integrations & webhooks");
    expect(screen.queryByTestId("set-foot-save")).toBeNull();
    fireEvent.click(screen.getByTestId("set-door-open"));
    expect(String(openSpy.mock.calls[0][0])).toMatch(/\/dashboard\/settings\/integrations$/);
    fireEvent.click(screen.getByTestId("set-door-close"));
    await waitFor(() => expect(headTitle()).toBe("Overview"));
    openSpy.mockRestore();
  });
});

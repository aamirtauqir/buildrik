/**
 * SettingsTab — the Clone shell (3397:32011), every frame of the section
 * around whichever screen is open.
 *
 *   ┌ sidebar 256 ─────────┬ pane ─────────────────────────────────────────┐
 *   │ ‹ Back to canvas     │ Group / Screen          [Upgrade | Search]     │
 *   │ Settings             │ subtitle                                       │
 *   │ <site>               ├────────────────────────────────────────────────┤
 *   │                      │ body on the subtle ground — the screen's cards │
 *   │ ▸ Overview           │                                                │
 *   │ SITE SETUP …         ├────────────────────────────────────────────────┤
 *   │ WORKSPACE …          │ status                   Cancel  Save changes  │
 *   └──────────────────────┴────────────────────────────────────────────────┘
 *
 * The sidebar is always there — there is no root/section drill-in any more.
 * The shell owns: the footer and its four states (`All changes saved` ·
 * `Changes not saved` + `Retry save` · `Loading settings…` · `Settings could
 * not load`), the save path, the Settings saved dialog, the Unsaved settings
 * guard (Back to canvas / Cancel / Done / Escape / any nav click while
 * dirty), the plan gate's `Upgrade`, and the doors: Fonts & colours → the
 * Brand panel, Export → the Export modal, Members / Billing → the dashboard.
 * The screen owns its cards, its load card and its save-error banner
 * (`ScreenProps.onLoadStateChange` / `saveError`).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ArrowUpRight, ChevronLeft, Search as SearchIcon } from "lucide-react";
import { Button } from "@/editor/chrome-ui";
import { usePanelNavigation } from "../../shared/usePanelNavigation";
import {
  type SettingsTabProps,
  type PlanTier,
  type SettingsNavId,
  type SettingsNavDef,
  type SettingsNavGroupId,
  type ScreenLoadState,
  SCREEN_PLAN_REQUIREMENTS,
  SETTINGS_NAV,
  SETTINGS_NAV_GROUPS,
  WORKSPACE_LINKS,
  NAV_ICONS,
  SET_BTN,
  SET_EYEBROW,
  SiteSettingsScreen,
  LockedScreen,
  AnalyticsScreen,
  AdvancedScreen,
  SeoScreen,
  IntegrationsHub,
  RedirectsScreen,
  FormsScreen,
  HeadersScreen,
  LocalizationScreen,
  DomainsScreen,
  WebhooksScreen,
  OverviewScreen,
} from "./index";
import { UnsavedSettingsDialog } from "./components/UnsavedSettingsDialog";
import { SettingsSavedDialog } from "./components/SettingsSavedDialog";
import { SearchSettingsModal } from "./components/SearchSettingsModal";
import type { ProjectSettings } from "@/shared/types/project";
import { getEditorPlanTier } from "@/services/BuildrikSyncProvider";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { EVENTS } from "@/shared/constants/events";
import { currentSiteId } from "@/services/ReviewService";
import "./settings.css";

// ─── Module-scope data ───────────────────────────────────────────────────────

/** What `usePanelNavigation` may land on: Overview plus every in-pane screen.
 *  Doors and dashboard links are not screens and never persist. */
const SETTINGS_SCREENS = [
  { id: "overview", title: "Overview" },
  ...SETTINGS_NAV.filter((n) => n.kind === "screen").map(({ id, title }) => ({ id, title })),
];

const GROUP_ORDER: SettingsNavGroupId[] = ["site-setup", "seo-publishing", "visitors", "advanced", "workspace"];

/** 3950:26309 / 3951:26319 / 3951:26607 — the banner each S1 screen draws
 *  when its Save fails. Other screens get the same sentence with their own
 *  name in it. */
const SAVE_ERROR_MESSAGES: Partial<Record<SettingsNavId, string>> = {
  general: "Site settings were not saved. Your changes are still here. Review the values, then retry.",
  seo: "SEO defaults were not saved. Your changes are still here. Review the values, then retry.",
  "custom-code": "Custom code was not saved. Your changes are still here. Review the values, then retry.",
};

const OVERVIEW_SUBTITLE = " · everything on this page is scoped to this project.";

function isScreenLocked(screenId: string, userPlan: PlanTier): boolean {
  const required = SCREEN_PLAN_REQUIREMENTS[screenId];
  if (!required) return false;
  return required === "pro" ? userPlan === "starter" : userPlan !== "enterprise";
}

// ─── Row chrome ──────────────────────────────────────────────────────────────

/* A sidebar row: 32 high, icon + label, on the accent tint when current.
   `size="xs"` gives the Button its 32; everything else is replaced per
   property through twMerge (padding, alignment, type). The <a> rows for
   Members / Billing wear the same string — nothing in it needs a button. */
const NAV_ROW =
  "tw:flex tw:h-8 tw:w-full tw:items-center tw:justify-start tw:gap-2 tw:rounded-[var(--bk-radius-md)] tw:border-0 " +
  "tw:bg-transparent tw:px-3 tw:text-left tw:text-[length:var(--bk-text-13)] tw:font-normal tw:leading-5 " +
  "tw:text-[var(--bk-ink)] tw:no-underline tw:enabled:hover:bg-[var(--bk-bg-subtle)] tw:hover:bg-[var(--bk-bg-subtle)] " +
  "tw:focus:ring-0 tw:focus:shadow-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";
const NAV_ROW_ON =
  "tw:bg-[var(--bk-accent-tint)] tw:font-medium tw:text-[var(--bk-accent)] " +
  "tw:enabled:hover:bg-[var(--bk-accent-tint)] tw:enabled:hover:text-[var(--bk-accent)]";

const NavRowIcon: React.FC<{ id: SettingsNavId }> = ({ id }) => {
  const Icon = NAV_ICONS[id];
  return (
    <span className="tw:flex tw:size-4 tw:shrink-0 tw:items-center tw:justify-center" aria-hidden>
      <Icon size={16} strokeWidth={1.5} />
    </span>
  );
};

// ─── Component ───────────────────────────────────────────────────────────────

export const SettingsTab: React.FC<
  SettingsTabProps & {
    /** Switch to the Brand (`design`) tab — the `Fonts & colours` door. */
    onOpenDesignTab?: () => void;
    /** Deep-link screen id from `openLeftPanelToTab("settings", <id>)`. */
    initialScreen?: string;
  }
> = ({ composer, initialScreen, onClose, userPlan, projectId: projectIdProp, onDirtyChange, onOpenDesignTab }) => {
  // The standalone shell (:5050/?siteId=) never threads projectId through
  // AquibraStudio → StudioPanels; the URL param is the same source
  // BuildrikSyncProvider loads from.
  const projectId = projectIdProp ?? currentSiteId();
  // Effective plan: explicit prop wins; otherwise the real workspace tier
  // captured at project load.
  const effectivePlan: PlanTier = userPlan ?? getEditorPlanTier();
  const { currentScreen, navigateTo } = usePanelNavigation({
    storageKey: `settings-panel${projectId ? `-${projectId}` : ""}`,
    screens: SETTINGS_SCREENS,
    defaultScreen: "overview",
  });

  // The site name, read from the composer the way the topbar reads it.
  const [siteName, setSiteName] = React.useState("Untitled site");
  React.useEffect(() => {
    if (!composer) return;
    const read = () => setSiteName(composer.getProjectMetadata?.()?.name || "Untitled site");
    read();
    composer.on(EVENTS.PROJECT_LOADED, read);
    composer.on(EVENTS.PROJECT_METADATA_CHANGED, read);
    return () => {
      composer.off(EVENTS.PROJECT_LOADED, read);
      composer.off(EVENTS.PROJECT_METADATA_CHANGED, read);
    };
  }, [composer]);

  const [screenIsDirty, setScreenIsDirty] = React.useState(false);
  // Click handlers read the LATEST dirty value synchronously through this
  // ref, not the post-render state: screens push dirty via an effect, and a
  // click in the same gesture as an edit would otherwise read stale false.
  const screenIsDirtyRef = React.useRef(false);
  React.useEffect(() => {
    screenIsDirtyRef.current = screenIsDirty;
  }, [screenIsDirty]);

  /* What the Unsaved settings dialog was raised for. Its Discard finishes
     that intent — the door out, or the screen that was clicked — after the
     edits are rolled back. */
  type Pending = { kind: "leave" } | { kind: "nav"; id: SettingsNavId };
  const [guardOpen, setGuardOpen] = React.useState(false);
  const pendingRef = React.useRef<Pending | null>(null);
  const [savedOpen, setSavedOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [loadState, setLoadState] = React.useState<ScreenLoadState>("ready");
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [resetKey, setResetKey] = React.useState(0);
  /* A Search result names a field; it is scrolled to once its screen is on. */
  const pendingFieldRef = React.useRef<string | null>(null);

  // Snapshot composer.projectSettings on every screen mount so Discard can
  // restore the user's pre-edit state. Composer-backed screens push edits
  // live; without this the canvas and the footer would disagree after a
  // discard. structuredClone — getProjectSettings() returns a reference.
  const screenSnapshotRef = React.useRef<ProjectSettings | null>(null);

  // Server-side screens (Redirects/Headers/Localization) write via tRPC, not
  // composer state; they register their own save so the footer's Save runs
  // the right write path instead of a saveProject() that no-ops their fields.
  const screenSaveHandlerRef = React.useRef<(() => Promise<void>) | null>(null);
  const registerSaveHandler = React.useCallback((handler: (() => Promise<void>) | null) => {
    screenSaveHandlerRef.current = handler;
  }, []);

  // Composer-backed screens flush their local edit buffer into composer right
  // before saveProject() so PROJECT_CHANGED fires once per Save, not per key.
  const screenFlushHandlerRef = React.useRef<(() => void) | null>(null);
  const registerFlushHandler = React.useCallback((handler: (() => void) | null) => {
    screenFlushHandlerRef.current = handler;
  }, []);

  React.useEffect(() => {
    setScreenIsDirty(false);
    setGuardOpen(false);
    setSaveError(null);
    setLoadState("ready");
    screenSaveHandlerRef.current = null;
    screenFlushHandlerRef.current = null;
    screenSnapshotRef.current = composer ? structuredClone(composer.getProjectSettings()) : null;
  }, [currentScreen, composer]);

  React.useEffect(() => {
    onDirtyChange?.(screenIsDirty);
  }, [screenIsDirty, onDirtyChange]);

  const handleScreenDirty = React.useCallback((dirty: boolean) => {
    setScreenIsDirty(dirty);
  }, []);

  /* A field reached through Search: once its screen has rendered (and, for a
     server-backed screen, loaded), scroll it into view and focus it. The id
     is the field's label slug — the S1 screens set it on the control; for
     the rest, the `Field` wrapper's `set-field-<slug>` anchor is the landing. */
  React.useEffect(() => {
    const fieldId = pendingFieldRef.current;
    if (!fieldId || loadState !== "ready") return;
    const frame = requestAnimationFrame(() => {
      const el =
        document.getElementById(fieldId) ??
        document.querySelector<HTMLElement>(`[data-testid="set-field-${fieldId}"]`);
      if (!el) return;
      pendingFieldRef.current = null;
      el.scrollIntoView({ block: "center" });
      (el.matches("input, select, textarea") ? el : el.querySelector<HTMLElement>("input, select, textarea") ?? el).focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [currentScreen, loadState, resetKey]);

  // ─── Doors and navigation ─────────────────────────────────────────────

  const leave = React.useCallback(() => {
    onClose?.();
  }, [onClose]);

  const performNav = React.useCallback(
    (id: SettingsNavId) => {
      switch (id) {
        case "branding":
          onOpenDesignTab?.();
          return;
        case "export":
          /* The Export modal is the surface (plan: the row LEAVES Settings);
             StudioHeader opens it beside its own Export button. */
          composer?.emit(EVENTS.UI_OPEN_EXPORTER, undefined);
          onClose?.();
          return;
        case "members":
        case "billing":
          /* The sidebar's rows are links; a Search result or an Overview
             `Open ›` naming these takes the same door. */
          window.open(`${DASHBOARD_URL}${WORKSPACE_LINKS[id]}`, "_blank", "noopener,noreferrer");
          return;
        default:
          navigateTo(id);
      }
    },
    [composer, navigateTo, onClose, onOpenDesignTab],
  );

  const requestNav = React.useCallback(
    (id: SettingsNavId) => {
      if (id === currentScreen) return;
      if (screenIsDirtyRef.current) {
        pendingRef.current = { kind: "nav", id };
        setGuardOpen(true);
        return;
      }
      performNav(id);
    },
    [currentScreen, performNav],
  );

  const requestLeave = React.useCallback(() => {
    if (screenIsDirtyRef.current) {
      pendingRef.current = { kind: "leave" };
      setGuardOpen(true);
      return;
    }
    leave();
  }, [leave]);

  /* Deep links arrive by the name the DOOR uses, which is not always the name
     the screen has: the site menu says "Plugins"; the screen is
     "integrations". An id matching no screen is left alone rather than
     guessed at. */
  React.useEffect(() => {
    if (!initialScreen) return;
    const target = initialScreen === "plugins" ? "integrations" : initialScreen;
    if (SETTINGS_SCREENS.some((s) => s.id === target)) navigateTo(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialScreen]);

  // Escape is one more door out — guarded like the rest. The dialogs own
  // their own Escape while they are up; an input keeps its own.
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (guardOpen || savedOpen || searchOpen) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) return;
      e.preventDefault();
      requestLeave();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [guardOpen, savedOpen, searchOpen, requestLeave]);

  // ─── The guard ────────────────────────────────────────────────────────

  const handleKeepEditing = React.useCallback(() => {
    pendingRef.current = null;
    setGuardOpen(false);
  }, []);

  const handleDiscard = React.useCallback(() => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    setGuardOpen(false);
    // Roll composer back to the snapshot taken when the screen mounted (or
    // last saved). structuredClone on the way out so later composer
    // mutations don't poison the snapshot we still hold.
    if (composer && screenSnapshotRef.current) {
      composer.setProjectSettings(structuredClone(screenSnapshotRef.current));
    }
    setResetKey((k) => k + 1);
    setScreenIsDirty(false);
    setSaveError(null);
    // Prime the ref synchronously — the effect that mirrors it has not run
    // yet, and the intent below reads it.
    screenIsDirtyRef.current = false;
    if (!pending || pending.kind === "leave") {
      leave();
      return;
    }
    performNav(pending.id);
  }, [composer, leave, performNav]);

  // ─── Save ─────────────────────────────────────────────────────────────

  const current = SETTINGS_NAV.find((n) => n.id === currentScreen);
  const isOverview = currentScreen === "overview";

  const handleSave = React.useCallback(() => {
    if (saving) return;
    const failed = (err: unknown) => {
      console.error("[settings] save failed", err);
      setSaveError(SAVE_ERROR_MESSAGES[currentScreen as SettingsNavId] ??
        `Changes to ${current?.title ?? "settings"} were not saved. Your changes are still here. Review the values, then retry.`);
    };
    const succeeded = () => {
      if (composer) screenSnapshotRef.current = structuredClone(composer.getProjectSettings());
      setSaveError(null);
      setScreenIsDirty(false);
      setSavedOpen(true);
    };
    const screenHandler = screenSaveHandlerRef.current;
    let run: Promise<void> | void;
    if (screenHandler) {
      // Server-side screen owns persistence; composer.saveProject() would
      // silently drop its fields.
      run = screenHandler();
    } else {
      if (!composer) return;
      // Flush the screen's local edits into composer once, then persist.
      screenFlushHandlerRef.current?.();
      run = composer.saveProject?.();
    }
    if (!run) {
      succeeded();
      return;
    }
    setSaving(true);
    run.then(succeeded, failed).finally(() => setSaving(false));
  }, [composer, current, currentScreen, saving]);

  const openBilling = React.useCallback(() => {
    window.open(`${DASHBOARD_URL}${WORKSPACE_LINKS.billing}`, "_blank", "noopener,noreferrer");
  }, []);

  // ─── Pane content ─────────────────────────────────────────────────────

  const locked = !isOverview && isScreenLocked(currentScreen, effectivePlan);

  const renderScreen = (): React.ReactNode => {
    if (isOverview) return <OverviewScreen projectId={projectId} onOpenScreen={requestNav} />;
    if (locked) return <LockedScreen variant={SCREEN_PLAN_REQUIREMENTS[currentScreen]} onUpgrade={openBilling} />;
    const common = {
      composer,
      projectId,
      onDirtyChange: handleScreenDirty,
      registerSaveHandler,
      registerFlushHandler,
      onLoadStateChange: setLoadState,
      saveError,
    };
    switch (currentScreen as SettingsNavId) {
      case "general":
        return <SiteSettingsScreen {...common} />;
      case "seo":
        return <SeoScreen {...common} />;
      case "analytics":
        return <AnalyticsScreen {...common} />;
      case "custom-code":
        return <AdvancedScreen {...common} />;
      case "integrations":
        return (
          <IntegrationsHub composer={composer} onDirtyChange={handleScreenDirty} registerFlushHandler={registerFlushHandler} />
        );
      case "localization":
        return <LocalizationScreen {...common} />;
      case "redirects":
        return <RedirectsScreen {...common} />;
      case "headers":
        return <HeadersScreen {...common} />;
      case "forms":
        return <FormsScreen {...common} />;
      case "domains":
        return <DomainsScreen {...common} />;
      case "webhooks":
        return <WebhooksScreen {...common} />;
      default:
        return null;
    }
  };

  const headTitle = isOverview || !current ? "Settings" : `${SETTINGS_NAV_GROUPS[current.group]} / ${current.title}`;
  const headSub = isOverview || !current ? `${siteName}${OVERVIEW_SUBTITLE}` : current.subtitle;

  const footStatus: { text: string; tone: "muted" | "danger" | "warning" } = isOverview
    ? { text: "Pick a section to edit its settings", tone: "muted" }
    : loadState === "loading"
      ? { text: "Loading settings…", tone: "muted" }
      : loadState === "error"
        ? { text: "Settings could not load", tone: "danger" }
        : saveError
          ? { text: "Changes not saved", tone: "danger" }
          : screenIsDirty
            ? { text: "Unsaved changes", tone: "warning" }
            : { text: "All changes saved", tone: "muted" };
  const FOOT_TONE = {
    muted: "tw:text-[var(--bk-ink-muted)]",
    danger: "tw:text-[var(--bk-error)]",
    warning: "tw:text-[var(--bk-warning-text)]",
  } as const;

  // ─── Sidebar rows ─────────────────────────────────────────────────────

  const renderRow = (n: SettingsNavDef) => {
    const active = currentScreen === n.id;
    if (n.kind === "external") {
      return (
        <a
          key={n.id}
          href={`${DASHBOARD_URL}${WORKSPACE_LINKS[n.id] ?? "/dashboard"}`}
          target="_blank"
          rel="noopener noreferrer"
          className={NAV_ROW}
          data-testid={`set-nav-${n.id}`}
        >
          <NavRowIcon id={n.id} />
          <span className="tw:min-w-0 tw:flex-1 tw:truncate">{n.title}</span>
          <ArrowUpRight size={12} className="tw:shrink-0 tw:text-[var(--bk-ink-muted)]" aria-hidden />
        </a>
      );
    }
    const rowLocked = isScreenLocked(n.id, effectivePlan);
    return (
      <Button
        key={n.id}
        type="button"
        variant="ghost"
        size="xs"
        className={`${NAV_ROW}${active ? ` ${NAV_ROW_ON}` : ""}`}
        aria-current={active ? "page" : undefined}
        onClick={() => requestNav(n.id)}
        data-testid={`set-nav-${n.id}`}
      >
        <NavRowIcon id={n.id} />
        <span className="tw:min-w-0 tw:flex-1 tw:truncate">{n.title}</span>
        {rowLocked ? (
          <span className="tw:shrink-0 tw:rounded-[var(--bk-radius-sm)] tw:bg-[var(--bk-accent-tint)] tw:px-1.5 tw:text-[length:var(--bk-text-11)] tw:font-medium tw:leading-4 tw:text-[var(--bk-accent)]">
            Pro
          </span>
        ) : null}
      </Button>
    );
  };

  return (
    <div className="tw:flex tw:h-full tw:min-h-0 tw:w-full tw:bg-[var(--bk-bg-panel)] tw:[font-family:var(--bk-font-ui)]" data-testid="set-root">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="tw:flex tw:w-64 tw:shrink-0 tw:flex-col tw:overflow-y-auto tw:border-r tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)]">
        <div className="tw:flex tw:flex-col tw:px-5 tw:pt-4">
          <Button
            type="button"
            variant="link"
            className="tw:h-auto tw:min-h-0 tw:self-start tw:gap-0.5 tw:px-0 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-soft)] tw:enabled:hover:text-[var(--bk-ink)] tw:enabled:hover:no-underline"
            onClick={requestLeave}
            data-testid="set-back"
          >
            <ChevronLeft size={12} aria-hidden />
            Back to canvas
          </Button>
          <h2
            className="tw:m-0 tw:mt-4 tw:text-[length:var(--bk-text-20)] tw:font-semibold tw:leading-7 tw:text-[var(--bk-ink)]"
            data-testid="set-title"
          >
            Settings
          </h2>
          <div className="tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="set-site">
            {siteName}
          </div>
        </div>
        <nav className="tw:flex tw:flex-col tw:px-3 tw:pb-4 tw:pt-20" aria-label="Settings sections">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className={`${NAV_ROW}${isOverview ? ` ${NAV_ROW_ON}` : ""}`}
            aria-current={isOverview ? "page" : undefined}
            onClick={() => requestNav("overview")}
            data-testid="set-nav-overview"
          >
            <NavRowIcon id="overview" />
            <span className="tw:min-w-0 tw:flex-1 tw:truncate">Overview</span>
          </Button>
          {GROUP_ORDER.map((group) => (
            <React.Fragment key={group}>
              <div className={`${SET_EYEBROW} tw:px-3 tw:pb-1 tw:pt-3`}>{SETTINGS_NAV_GROUPS[group]}</div>
              {SETTINGS_NAV.filter((n) => n.group === group).map(renderRow)}
            </React.Fragment>
          ))}
        </nav>
      </aside>

      {/* ── Pane ────────────────────────────────────────────────────────── */}
      <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
        <header
          className={`tw:flex tw:shrink-0 tw:items-start tw:justify-between tw:gap-6 tw:px-12 tw:pt-7 ${
            isOverview ? "tw:pb-2" : "tw:border-b tw:border-[var(--bk-border)] tw:pb-6"
          }`}
        >
          <div className="tw:flex tw:min-w-0 tw:flex-col tw:gap-1">
            <h2
              className="tw:m-0 tw:text-[length:var(--bk-text-20)] tw:font-semibold tw:leading-7 tw:text-[var(--bk-ink)]"
              data-testid="set-head-title"
            >
              {headTitle}
            </h2>
            <p className="tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]" data-testid="set-head-sub">
              {headSub}
            </p>
          </div>
          {isOverview ? (
            <Button
              type="button"
              variant="secondary"
              size="xs"
              className={`${SET_BTN} tw:w-70 tw:shrink-0 tw:justify-start tw:gap-2 tw:font-normal tw:text-[var(--bk-ink-muted)]`}
              onClick={() => setSearchOpen(true)}
              data-testid="set-search-open"
            >
              <SearchIcon size={14} aria-hidden />
              Search settings
            </Button>
          ) : null}
          {locked ? (
            <Button type="button" size="xs" className={`${SET_BTN} tw:shrink-0`} onClick={openBilling} data-testid="set-head-upgrade">
              Upgrade
            </Button>
          ) : null}
        </header>

        <div
          key={resetKey}
          className={`tw:flex tw:min-h-0 tw:flex-1 tw:flex-col tw:gap-6 tw:overflow-y-auto tw:px-12 tw:pb-8 ${
            isOverview ? "tw:bg-[var(--bk-bg-panel)] tw:pt-2" : "tw:bg-[var(--bk-bg-subtle)] tw:pt-8"
          }`}
          data-testid="set-body"
        >
          {renderScreen()}
        </div>

        <footer className="tw:flex tw:h-14 tw:shrink-0 tw:items-center tw:justify-between tw:gap-4 tw:border-t tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:px-12">
          <span
            className={`tw:text-[length:var(--bk-text-13)] tw:leading-5 ${FOOT_TONE[footStatus.tone]}`}
            role="status"
            data-testid="set-foot-status"
          >
            {footStatus.text}
          </span>
          {isOverview ? (
            <Button type="button" size="xs" className={SET_BTN} onClick={requestLeave} data-testid="set-ov-done">
              Done
            </Button>
          ) : (
            <div className="tw:flex tw:items-center tw:gap-2">
              <Button type="button" variant="ghost" size="xs" className={SET_BTN} onClick={requestLeave} data-testid="set-foot-cancel">
                Cancel
              </Button>
              <Button
                type="button"
                size="xs"
                className={SET_BTN}
                disabled={loadState !== "ready" || saving}
                onClick={handleSave}
                data-testid="set-foot-save"
              >
                {saveError ? "Retry save" : "Save changes"}
              </Button>
            </div>
          )}
        </footer>
      </div>

      <UnsavedSettingsDialog open={guardOpen} siteName={siteName} onKeepEditing={handleKeepEditing} onDiscard={handleDiscard} />
      <SettingsSavedDialog open={savedOpen} siteName={siteName} onReturn={() => setSavedOpen(false)} />
      <SearchSettingsModal
        open={searchOpen}
        siteName={siteName}
        onClose={() => setSearchOpen(false)}
        onOpen={(screenId, fieldId) => {
          setSearchOpen(false);
          pendingFieldRef.current = fieldId ?? null;
          if (SETTINGS_NAV.some((n) => n.id === screenId)) requestNav(screenId as SettingsNavId);
        }}
      />
    </div>
  );
};

export type { SettingsTabProps } from "./index";
export default SettingsTab;

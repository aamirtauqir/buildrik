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
 * dirty), the plan gate's `Upgrade`, and the doors: Brand ↗ → the
 * Brand panel, Export → the Export modal, Members / Billing → the dashboard.
 * The screen owns its cards, its load card and its save-error banner
 * (`ScreenProps.onLoadStateChange` / `saveError`).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ArrowUpRight, ChevronLeft, Search as SearchIcon, X } from "lucide-react";
import { Button, IconButton, Kbd, TextInput, useToast } from "@/editor/chrome-ui";
import { usePanelNavigation } from "../../shared/usePanelNavigation";
import {
  type SettingsTabProps,
  type PlanTier,
  type SettingsNavId,
  type SettingsNavDef,
  type SettingsNavGroupId,
  type ScreenLoadState,
  type SettingsOpenRequest,
  type RedirectRepair,
  SCREEN_PLAN_REQUIREMENTS,
  SETTINGS_NAV,
  SETTINGS_NAV_GROUPS,
  WORKSPACE_LINKS,
  SAVE_ERROR_MESSAGES,
  NAV_ICONS,
  SET_BTN,
  SET_EYEBROW,
  SiteSettingsScreen,
  LockedScreen,
  LOCKED_COPY,
  AnalyticsScreen,
  AdvancedScreen,
  SeoScreen,
  IntegrationsScreen,
  RedirectsScreen,
  FormsScreen,
  HeadersScreen,
  LocalizationScreen,
  DomainsScreen,
  WebhooksScreen,
  OverviewScreen,
} from "./index";
import { UnsavedSettingsDialog } from "./components/UnsavedSettingsDialog";
import { searchSettings } from "./searchIndex";
import type { ProjectSettings } from "@/shared/types/project";
import { getEditorPlanTier, saveProject as syncSaveProject, SETTINGS_MIRROR_ERROR_EVENT } from "@/services/BuildrikSyncProvider";
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

/* Screens whose actions apply as they happen — the frame draws them with no
   Cancel / Save (3397:32206 Domains: `Actions apply immediately · nothing to
   save here` · Done). */
const IMMEDIATE_SCREENS = new Set<SettingsNavId>(["domains", "forms", "integrations"]);

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
/* 4418:127313: 36-tall rows (--bk-size-row-nav), 14px. */
const NAV_ROW =
  "tw:flex tw:h-[var(--bk-size-row-nav)] tw:w-full tw:items-center tw:justify-start tw:gap-2 tw:rounded-[var(--bk-radius-md)] tw:border-0 " +
  "tw:bg-transparent tw:px-3 tw:text-left tw:text-[length:var(--bk-text-14)] tw:font-normal tw:leading-5 " +
  "tw:text-[var(--bk-ink)] tw:no-underline tw:enabled:hover:bg-[var(--bk-bg-subtle)] tw:hover:bg-[var(--bk-bg-subtle)] " +
  "tw:focus:ring-0 tw:focus:[box-shadow:none] tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";
const NAV_ROW_ON =
  "tw:bg-[var(--bk-accent-tint)] tw:font-medium tw:text-[var(--bk-accent)] " +
  "tw:enabled:hover:bg-[var(--bk-accent-tint)] tw:enabled:hover:text-[var(--bk-accent)]";

const NavRowIcon: React.FC<{ id: SettingsNavId }> = ({ id }) => {
  /* 4418:127313 marks Overview with a dot, not a glyph. */
  if (id === "overview") {
    return (
      <span className="tw:flex tw:size-4 tw:shrink-0 tw:items-center tw:justify-center" aria-hidden>
        <span className="tw:size-1.5 tw:rounded-full tw:bg-current" />
      </span>
    );
  }
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
    /** Switch to the Brand (`design`) tab — the `Brand ↗` door. */
    onOpenDesignTab?: () => void;
    /** Deep-link screen id from `openLeftPanelToTab("settings", <id>)`. */
    initialScreen?: string;
    /** `ui:settings-open`, held by StudioPanels — a screen to land on, and
     *  the Pages panel's URL-repair draft when there is one (3519:19920). */
    openRequest?: SettingsOpenRequest | null;
  }
> = ({ composer, initialScreen, openRequest, onClose, userPlan, projectId: projectIdProp, onDirtyChange, onOpenDesignTab }) => {
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
  const { addToast } = useToast();
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

  /* The screen's own header primary (`Add domain`, `Add locale`) — see
     ScreenProps.registerHeaderAction. Cleared whenever the screen changes. */
  const [headerAction, setHeaderAction] = React.useState<React.ReactNode | null>(null);
  const registerHeaderAction = React.useCallback((node: React.ReactNode | null) => setHeaderAction(node), []);
  React.useEffect(() => setHeaderAction(null), [currentScreen]);
  /* A sub-view's header (`… / Browse all` · its own line) — see ScreenProps.registerHeader. */
  const [screenHeader, setScreenHeader] = React.useState<{ title?: string; subtitle?: string } | null>(null);
  const registerHeader = React.useCallback((header: { title?: string; subtitle?: string } | null) => setScreenHeader(header), []);
  React.useEffect(() => setScreenHeader(null), [currentScreen]);

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
  /* G3-097 · 6816:60270: Search is an inline sidebar filter. null = closed;
     a string (possibly empty) = the field is open with that query. */
  const [query, setQuery] = React.useState<string | null>(null);
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

  /* A LAYOUT effect, deliberately: the screens register their save / flush
     handlers and report their load in passive effects, and React runs a
     child's passive effects before its parent's. When Settings reopens on
     the persisted screen (or a door lands on one), the screen mounts in the
     same commit as the shell — as a passive effect this reset ran AFTER the
     screen's register and nulled it: Save flushed nothing and said Settings
     saved (found live on Redirects' suggester switch). Layout effects run
     before every passive effect of the commit, so the reset always precedes
     the register, on mount and on a screen change alike. */
  React.useLayoutEffect(() => {
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

  /* The Pages door (3519:19920): land on the named screen with the repair
     draft. Each request is a new object, so the same page renamed twice
     opens Redirects twice. The draft is the screen's until it is saved or
     dropped — `onRepairDone` — and a screen change drops it too. */
  const [repair, setRepair] = React.useState<RedirectRepair | null>(null);
  React.useEffect(() => {
    if (!openRequest) return;
    setRepair(openRequest.repair ?? null);
    navigateTo(openRequest.screen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRequest]);
  /* Dropped on the way OUT of Redirects — not on mount, where the landing
     screen is still the persisted one and the request's draft would be
     cleared in the same batch that set it. */
  const wasOnRedirects = React.useRef(false);
  React.useEffect(() => {
    if (wasOnRedirects.current && currentScreen !== "redirects") setRepair(null);
    wasOnRedirects.current = currentScreen === "redirects";
  }, [currentScreen]);
  const clearRepair = React.useCallback(() => setRepair(null), []);

  // Escape is one more door out — guarded like the rest. The dialogs own
  // their own Escape while they are up; an input keeps its own.
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (guardOpen) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) return;
      e.preventDefault();
      requestLeave();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [guardOpen, requestLeave]);

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

  /* `then` runs after a save succeeds: the Saved toast after the footer's
     Save, the pending nav / exit after the guard's Save and continue. */
  const handleSave = React.useCallback((then?: () => void) => {
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
      screenIsDirtyRef.current = false;
      if (then) then();
      /* 4418:165469 draws "Settings saved" as a toast (bottom-left, dark),
         not a centred dialog: title, the site's line, "Return to settings". */
      else
        addToast({
          title: "Settings saved",
          description: `${siteName ? `${siteName} · ` : ""}Configuration saved. Your canvas content is unchanged.`,
          action: { label: "Return to settings", onClick: () => {} },
        });
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
      /* The shipping editor persists through BuildrikSyncProvider, not through
         `composer.saveProject()` — that one writes the engine's own storage,
         and the server mirror (`siteDetail.settings.update`, where General /
         SEO / Custom code actually live) only ran on the autosave tick seconds
         later. Walked live 2026-09-14: an invalid OG image showed `Settings
         saved` while the server answered 207 and kept the old value. With a
         site id the save is the provider's, awaited here; the provider resolves
         even when the mirror is refused and reports that as a window event
         (so the page save is not undone by a settings 4xx), and here the
         mirror IS the save — its failure is the 3950:26309 banner + Retry save. */
      run = new Promise<void>((resolve, reject) => {
        let mirrorError: string | null = null;
        const onMirror = (e: Event) => {
          mirrorError = (e as CustomEvent<{ message?: string }>).detail?.message ?? "Settings were not saved.";
        };
        window.addEventListener(SETTINGS_MIRROR_ERROR_EVENT, onMirror);
        const snapshot = projectId ? composer.exportProject() : null;
        const write = snapshot
          ? syncSaveProject(projectId!, snapshot).then(() => composer.markSaved(snapshot))
          : Promise.resolve(composer.saveProject?.());
        write
          .then(() => (mirrorError ? reject(new Error(mirrorError)) : resolve()), reject)
          .finally(() => window.removeEventListener(SETTINGS_MIRROR_ERROR_EVENT, onMirror));
      });
    }
    if (!run) {
      succeeded();
      return;
    }
    setSaving(true);
    run.then(succeeded, failed).finally(() => setSaving(false));
  }, [composer, current, currentScreen, saving, projectId, addToast, siteName]);

  /* The guard's Save and continue (4418:165478): save, then finish whatever
     raised the guard. A failed save leaves the dialog down and the screen's
     save-error banner up, with the edits still there. */
  const handleSaveAndContinue = React.useCallback(() => {
    const pending = pendingRef.current;
    handleSave(() => {
      pendingRef.current = null;
      setGuardOpen(false);
      if (!pending || pending.kind === "leave") leave();
      else performNav(pending.id);
    });
  }, [handleSave, leave, performNav]);

  const openBilling = React.useCallback(() => {
    window.open(`${DASHBOARD_URL}${WORKSPACE_LINKS.billing}`, "_blank", "noopener,noreferrer");
  }, []);

  // ─── Pane content ─────────────────────────────────────────────────────

  const locked = !isOverview && isScreenLocked(currentScreen, effectivePlan);

  const renderScreen = (): React.ReactNode => {
    if (isOverview) return <OverviewScreen projectId={projectId} onOpenScreen={requestNav} />;
    if (locked) {
      return <LockedScreen variant={SCREEN_PLAN_REQUIREMENTS[currentScreen]} {...LOCKED_COPY[currentScreen]} onUpgrade={openBilling} />;
    }
    const common = {
      composer,
      projectId,
      onDirtyChange: handleScreenDirty,
      registerSaveHandler,
      registerFlushHandler,
      onLoadStateChange: setLoadState,
      saveError,
      registerHeaderAction,
      registerHeader,
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
        return <IntegrationsScreen {...common} />;
      case "localization":
        return <LocalizationScreen {...common} />;
      case "redirects":
        return <RedirectsScreen {...common} repair={repair} onRepairDone={clearRepair} />;
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

  const headTitle =
    isOverview || !current
      ? "Settings"
      : `${SETTINGS_NAV_GROUPS[current.group]} / ${current.title}${screenHeader?.title ? ` / ${screenHeader.title}` : ""}`;
  const headSub = isOverview || !current ? `${siteName}${OVERVIEW_SUBTITLE}` : (screenHeader?.subtitle ?? current.subtitle);

  const immediate = IMMEDIATE_SCREENS.has(currentScreen as SettingsNavId);
  const footStatus: { text: string; tone: "muted" | "danger" | "warning" } = isOverview
    ? { text: "Pick a section to edit its settings", tone: "muted" }
    : immediate && loadState === "ready"
      ? { text: "Actions apply immediately · nothing to save here", tone: "muted" }
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

  /* The filter: a screen matches on its own title / description / group, or
     through one of its fields — then the row lands on that field (the
     retired dialog's jump & focus). */
  const trimmed = query?.trim() ?? "";
  const matchField = React.useMemo(() => {
    if (!trimmed) return null;
    const byScreen = new Map<string, string | null>();
    for (const e of searchSettings(trimmed)) {
      const prev = byScreen.get(e.screen);
      if (e.fieldId === undefined) byScreen.set(e.screen, null);
      else if (prev === undefined) byScreen.set(e.screen, e.fieldId);
    }
    return byScreen;
  }, [trimmed]);
  const openFromRow = (id: SettingsNavId) => {
    pendingFieldRef.current = matchField?.get(id) ?? null;
    requestNav(id);
  };
  const closeSearch = () => setQuery(null);

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
          {/* "Members ↗" — the arrow rides the label, as on the board. */}
          <span className="tw:min-w-0 tw:truncate">{n.title}</span>
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
        onClick={() => openFromRow(n.id)}
        data-testid={`set-nav-${n.id}`}
      >
        <NavRowIcon id={n.id} />
        {/* No "Pro" pill on the row (not drawn): a locked screen says so
            itself, with its header's Upgrade. */}
        <span className="tw:min-w-0 tw:flex-1 tw:truncate" data-locked={rowLocked || undefined}>{n.title}</span>
      </Button>
    );
  };

  return (
    <div className="tw:flex tw:h-full tw:min-h-0 tw:w-full tw:bg-[var(--bk-bg-panel)] tw:[font-family:var(--bk-font-ui)]" data-testid="set-root">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="tw:flex tw:w-64 tw:shrink-0 tw:flex-col tw:overflow-y-auto tw:border-r tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)]">
        {/* 4418:127313 — the Brand workspace's head: back link centred on the
            first line, 24px title (with the search door at its right), the
            site name under it. */}
        <div className="tw:flex tw:justify-center tw:pt-5">
          <Button
            type="button"
            variant="link"
            className="tw:h-auto tw:min-h-0 tw:gap-0.5 tw:px-0 tw:text-[length:var(--bk-text-13)] tw:leading-4 tw:text-[var(--bk-ink)] tw:enabled:hover:text-[var(--bk-accent)] tw:enabled:hover:no-underline"
            onClick={requestLeave}
            data-testid="set-back"
          >
            <ChevronLeft size={12} aria-hidden />
            Back to canvas
          </Button>
        </div>
        <div className="tw:flex tw:flex-col tw:px-4 tw:pt-4">
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
            <h2
              className="tw:m-0 tw:text-[length:var(--bk-text-24)] tw:font-semibold tw:leading-8 tw:text-[var(--bk-ink)]"
              data-testid="set-title"
            >
              Settings
            </h2>
            {query === null ? (
              <IconButton label="Search settings" onClick={() => setQuery("")} data-testid="set-search-icon" className="tw:size-6 tw:min-h-0 tw:min-w-0 tw:text-[var(--bk-ink-muted)]">
                <SearchIcon size={14} aria-hidden />
              </IconButton>
            ) : null}
          </div>
          <div className="tw:truncate tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]" data-testid="set-site">
            {siteName}
          </div>
          {query !== null ? (
            <div className="tw:relative tw:mt-4" data-testid="set-search">
              <TextInput
                type="search"
                autoFocus
                icon={SearchIcon}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    e.stopPropagation();
                    closeSearch();
                  }
                }}
                placeholder="Search settings"
                aria-label="Search settings"
                theme={{ field: { input: { base: "tw:pr-8 tw:[&::-webkit-search-cancel-button]:hidden" } } }}
                data-testid="set-search-input"
              />
              <IconButton
                label="Clear search"
                onClick={closeSearch}
                className="tw:absolute tw:right-1 tw:top-1 tw:size-6 tw:min-h-0 tw:min-w-0 tw:text-[var(--bk-ink-muted)]"
                data-testid="set-search-clear"
              >
                <X size={14} aria-hidden />
              </IconButton>
            </div>
          ) : null}
        </div>
        <nav className="tw:flex tw:flex-col tw:gap-px tw:px-4 tw:pb-4 tw:pt-4" aria-label="Settings sections">
          {matchField ? null : (
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
          )}
          {GROUP_ORDER.map((group) => {
            const rows = SETTINGS_NAV.filter((n) => n.group === group && (!matchField || matchField.has(n.id)));
            if (rows.length === 0) return null;
            return (
              <React.Fragment key={group}>
                <div className={`${SET_EYEBROW} tw:flex tw:h-7 tw:items-center tw:px-3`}>{SETTINGS_NAV_GROUPS[group]}</div>
                {rows.map(renderRow)}
              </React.Fragment>
            );
          })}
          {matchField && matchField.size === 0 ? (
            <p className="tw:m-0 tw:px-3 tw:py-2 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]" data-testid="set-search-empty">
              {`No settings match "${trimmed}"`}
            </p>
          ) : null}
          {trimmed ? (
            /* 6816:60270's hand-off: the same query, everywhere (⌘K). */
            <Button
              type="button"
              variant="secondary"
              size="xs"
              className="tw:mt-4 tw:h-auto tw:min-h-0 tw:w-full tw:items-start tw:justify-between tw:gap-2 tw:rounded-md tw:px-2.5 tw:py-2 tw:text-left tw:text-[length:var(--bk-text-12)] tw:font-normal tw:leading-4 tw:text-[var(--bk-ink)]"
              onClick={() => composer?.emit?.(EVENTS.UI_TOGGLE_COMMAND_PALETTE, { query: trimmed })}
              data-testid="set-search-everywhere"
            >
              <span className="tw:min-w-0 tw:break-words">{`Search everywhere for "${trimmed}"`}</span>
              <Kbd>⌘K</Kbd>
            </Button>
          ) : null}
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
              className="tw:m-0 tw:text-[length:var(--bk-text-24)] tw:font-semibold tw:leading-8 tw:text-[var(--bk-ink)]"
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
              onClick={() => setQuery((q) => q ?? "")}
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
          ) : (
            headerAction
          )}
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

        {/* A locked screen has nothing to save and the frame (3397:32859)
            draws no footer under it — its only action is the header's Upgrade. */}
        {/* 4418:127313 draws no footer on a clean screen: the bar appears
            while there is something to save, a save failed, or loading did —
            and on the Overview, whose Done is its way out. */}
        {locked || (!isOverview && !immediate && footStatus.text === "All changes saved") ? null : (
        <footer className="tw:flex tw:h-14 tw:shrink-0 tw:items-center tw:justify-between tw:gap-4 tw:border-t tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:px-12">
          <span
            className={`tw:text-[length:var(--bk-text-13)] tw:leading-5 ${FOOT_TONE[footStatus.tone]}`}
            role="status"
            data-testid="set-foot-status"
          >
            {footStatus.text}
          </span>
          {isOverview || immediate ? (
            <Button type="button" size="xs" className={SET_BTN} onClick={requestLeave} data-testid={isOverview ? "set-ov-done" : "set-foot-done"}>
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
                onClick={() => handleSave()}
                data-testid="set-foot-save"
              >
                {saveError ? "Retry save" : "Save changes"}
              </Button>
            </div>
          )}
        </footer>
        )}
      </div>

      <UnsavedSettingsDialog
        open={guardOpen}
        siteName={siteName}
        onKeepEditing={handleKeepEditing}
        onDiscard={handleDiscard}
        onSaveAndContinue={handleSaveAndContinue}
        saving={saving}
      />
    </div>
  );
};

export type { SettingsTabProps } from "./index";
export default SettingsTab;

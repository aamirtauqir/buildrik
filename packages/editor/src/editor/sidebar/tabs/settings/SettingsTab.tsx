/**
 * SettingsTab — the Settings shell around whichever screen is open (Phase B
 * IA, proposal §25 / plan M0; visuals stay the existing shell's until the M0
 * boards land).
 *
 *   ┌ sidebar 256 ─────────┬ pane ─────────────────────────────────────────┐
 *   │ ‹ Back to canvas     │ Group / Screen               [action | Upgrade]│
 *   │ Settings        ⌕    │ <site> · all pages · applies on next publish   │
 *   │ <site>               │ subtitle                                       │
 *   │ ▸ Overview           ├────────────────────────────────────────────────┤
 *   │ SITE · SEARCH & …    │ [read-only banner] the screen's cards          │
 *   │ … DANGER ZONE        ├────────────────────────────────────────────────┤
 *   │ ── Managed in        │ Discard  Save   status   (only when needed)    │
 *   │    workspace ↗       │                                                │
 *   │ Your role · Perms    │                                                │
 *   └──────────────────────┴────────────────────────────────────────────────┘
 *
 * The shell owns: the nav and its doors (Brand ↗ → the Brand panel; Members /
 * Billing / Integrations & webhooks → the dashboard), the scope line, the
 * read-only state (`SCREEN_MIN_ROLE`), the plan gate's `Upgrade`, the footer
 * and its states, the save path (BE-3: the settings mutations, never
 * `sites.saveProject`), the Saved toast, field errors, and the Unsaved
 * settings guard (Back to canvas / Escape / any nav click while dirty). The
 * screen owns its cards, its load card and its save-error banner.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ChevronLeft, Search as SearchIcon, X } from "lucide-react";
import { Badge, Button, IconButton, Kbd, TextInput, useToast } from "@/editor/chrome-ui";
import { usePanelNavigation } from "../../shared/usePanelNavigation";
import {
  type SettingsTabProps,
  type PlanTier,
  type SettingsNavId,
  type SettingsNavDef,
  type SettingsFieldErrors,
  type SettingsFlush,
  type SettingsFlushResult,
  type SettingsScreenId,
  type SettingsPaneId,
  type ScreenLoadState,
  type SettingsOpenRequest,
  type RedirectRepair,
  SCREEN_PLAN_REQUIREMENTS,
  SCREENS_WITH_OWN_PLAN_LOCK,
  SETTINGS_NAV,
  SETTINGS_NAV_GROUPS,
  SETTINGS_NAV_GROUP_ORDER,
  SCREEN_MIN_ROLE,
  SCREEN_SAVE_MODEL,
  SCREEN_SCOPE,
  scopeLine,
  workspaceScopeLine,
  WORKSPACE_LINKS,
  SAVE_ERROR_MESSAGES,
  isSettingsScreenId,
  isSettingsPaneId,
  NAV_ICONS,
  SET_BTN,
  SET_HEAD_BTN,
  SET_EYEBROW,
  ReadOnlyBanner,
  SiteColumnsLockedContext,
  SiteSettingsScreen,
  LockedScreen,
  LOCKED_COPY,
  AnalyticsScreen,
  AdvancedScreen,
  SeoScreen,
  RedirectsScreen,
  FormsScreen,
  HeadersScreen,
  LocalizationScreen,
  DomainsScreen,
  OverviewScreen,
  AccessScreen,
  DangerZoneScreen,
  WorkspaceDoorScreen,
} from "./index";
import { UnsavedSettingsDialog } from "./components/UnsavedSettingsDialog";
import { shellDirty } from "@/editor/shell/shellDirtyRegistry";
import { searchSettings } from "./searchIndex";
import type { ProjectSettings } from "@/shared/types/project";
import {
  getEditorPlanTier,
  getEditorWorkspaceName,
  getSiteIdFromUrl,
  planSettingsSave,
  saveSiteSettings,
  SettingsSaveCancelled,
  SettingsSaveError,
} from "@/services/BuildrikSyncProvider";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { EVENTS } from "@/shared/constants/events";
import { roleAtLeast } from "@/services/RoleService";
import { useEditorRole } from "@/editor/shell/hooks/useEditorRole";

import "./settings.css";

// ─── Module-scope data ───────────────────────────────────────────────────────

/** What `usePanelNavigation` may land on: Overview plus every in-pane screen.
 *  Doors and dashboard links are not screens and never persist. */
const SETTINGS_SCREENS = [
  { id: "overview", title: "Overview" },
  ...SETTINGS_NAV.flatMap((n) => (n.kind === "door" ? [] : [{ id: n.id, title: n.title }])),
];

/** "Only admins can change …" — who the read-only banner names. */
const ROLE_NOUN = { VIEWER: "viewers", EDITOR: "editors", DESIGNER: "editors", ADMIN: "admins", OWNER: "the workspace owner" } as const;

const PLAN_LABEL: Record<PlanTier, string> = { starter: "Free", pro: "Pro", enterprise: "Business" };

/** A flush's result as one shape: plain settings are a flush with no extra columns. */
function asFlush(result: ProjectSettings | SettingsFlush): SettingsFlush {
  return "settings" in result ? result : { settings: result };
}

function isScreenLocked(screenId: SettingsNavId, userPlan: PlanTier): boolean {
  const required = isSettingsScreenId(screenId) ? SCREEN_PLAN_REQUIREMENTS[screenId] : undefined;
  if (!required) return false;
  return required === "pro" ? userPlan === "starter" : userPlan !== "enterprise";
}

// ─── Row chrome ──────────────────────────────────────────────────────────────

/* M0 (4418:144988, drawn on 8134:212121): 32-tall rows, 8 in, a 20 icon
   slot 8 from a 12px label; the current row sits on the accent tint with a
   14/600 accent label. `size="xs"` gives the Button its 32; everything else
   is replaced per property through twMerge. */
const NAV_ROW =
  "tw:flex tw:h-8 tw:w-full tw:items-center tw:justify-start tw:gap-2 tw:rounded-[var(--bk-radius-lg)] tw:border-0 " +
  "tw:bg-transparent tw:px-2 tw:py-1.5 tw:text-left tw:text-[length:var(--bk-text-12)] tw:font-normal tw:leading-5 " +
  "tw:text-[var(--bk-ink)] tw:no-underline tw:enabled:hover:bg-[var(--bk-bg-subtle)] tw:hover:bg-[var(--bk-bg-subtle)] " +
  "tw:focus:ring-0 tw:focus:[box-shadow:none] tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";
const NAV_ROW_ON =
  "tw:bg-[var(--bk-accent-tint)] tw:text-[length:var(--bk-text-14)] tw:font-semibold tw:text-[var(--bk-accent)] " +
  "tw:enabled:hover:bg-[var(--bk-accent-tint)] tw:enabled:hover:text-[var(--bk-accent)]";

/* M0's pill — Billing's plan, a locked row's "Pro": 22 tall, accent hairline
   on the accent tint, 11/500. */
const NAV_PILL =
  "tw:inline-flex tw:h-5.5 tw:shrink-0 tw:items-center tw:rounded-full tw:border tw:border-[var(--bk-accent)] tw:bg-[var(--bk-accent-tint)] tw:px-2 tw:py-0 " +
  "tw:text-[length:var(--bk-text-11)] tw:font-medium tw:leading-4 tw:text-[var(--bk-accent)]";

/* M0's group label: 24 tall, 8 in, 11px uppercase in ink. */
const NAV_GROUP = "tw:flex tw:h-6 tw:items-center tw:pl-2 tw:text-[length:var(--bk-text-11)] tw:uppercase tw:leading-4 tw:text-[var(--bk-ink)]";

const NavRowIcon: React.FC<{ id: SettingsNavId }> = ({ id }) => {
  /* 4418:127313 marks Overview with a dot, not a glyph. */
  if (id === "overview") {
    return (
      <span className="tw:flex tw:size-5 tw:shrink-0 tw:items-center tw:justify-center" aria-hidden>
        <span className="tw:size-1.5 tw:rounded-full tw:bg-current" />
      </span>
    );
  }
  const Icon = NAV_ICONS[id];
  return (
    <span className="tw:flex tw:size-5 tw:shrink-0 tw:items-center tw:justify-center" aria-hidden>
      <Icon size={18} strokeWidth={1.5} />
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
> = ({ composer, initialScreen, openRequest, onClose, userPlan, projectId: projectIdProp, onOpenDesignTab }) => {
  // The standalone shell (:5050/?siteId=) never threads projectId through
  // AquibraStudio → StudioPanels; the URL param is the same source
  // BuildrikSyncProvider loads from.
  const projectId = projectIdProp ?? getSiteIdFromUrl();
  // Effective plan: explicit prop wins; otherwise the real workspace tier
  // captured at project load.
  const effectivePlan: PlanTier = userPlan ?? getEditorPlanTier();
  const { currentScreen: persistedScreen, navigateTo } = usePanelNavigation({
    storageKey: `settings-panel${projectId ? `-${projectId}` : ""}`,
    screens: SETTINGS_SCREENS,
    defaultScreen: "overview",
  });
  /* A position saved before Phase B can name a screen that no longer exists
     (`integrations`): it lands on the Overview. */
  const currentScreen: SettingsPaneId = isSettingsPaneId(persistedScreen) ? persistedScreen : "overview";

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
  /* The screen's own footer sentence — see ScreenProps.registerFooterMessage. */
  const [footerMessage, setFooterMessage] = React.useState<string | null>(null);
  const registerHeader = React.useCallback((header: { title?: string; subtitle?: string } | null) => setScreenHeader(header), []);
  React.useEffect(() => setScreenHeader(null), [currentScreen]);

  const [screenIsDirty, setScreenIsDirty] = React.useState(false);
  // Click handlers read the LATEST dirty value synchronously through this
  // ref, not the post-render state: screens push dirty via an effect, and a
  // click in the same gesture as an edit would otherwise read stale false.
  const screenIsDirtyRef = React.useRef(false);
  /* The ONE writer of the dirty flag: state (renders the footer), the ref
     (same-gesture click handlers) and this tab's shell-registry entry, all
     synchronously. The registry must not lag an effect behind: Discard /
     Save and continue clear it and leave in the same handler, and the
     shell's tab-switch guard reads it as the leave lands (B-1). */
  const markScreenDirty = React.useCallback((dirty: boolean) => {
    setScreenIsDirty(dirty);
    screenIsDirtyRef.current = dirty;
    shellDirty.set("settings", dirty);
  }, []);

  /* What the Unsaved settings dialog was raised for. Its Discard finishes
     that intent — the door out, or the screen that was clicked — after the
     edits are rolled back. */
  type Pending = { kind: "leave" } | { kind: "nav"; id: SettingsNavId };
  const [guardOpen, setGuardOpen] = React.useState(false);
  const pendingRef = React.useRef<Pending | null>(null);
  /* G3-097 · 6816:60270: Search is an inline sidebar filter, always on screen (8134:212121). */
  const [query, setQuery] = React.useState("");
  const [loadState, setLoadState] = React.useState<ScreenLoadState>("ready");
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [resetKey, setResetKey] = React.useState(0);
  /* A Search result names a field; it is scrolled to once its screen is on. */
  const pendingFieldRef = React.useRef<string | null>(null);
  /* The screen's own invalid fields (they disable Save) and the fields the
     server refused on the last Save (handed back to the screen). */
  const [clientFieldErrors, setClientFieldErrors] = React.useState<SettingsFieldErrors | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = React.useState<SettingsFieldErrors | undefined>(undefined);
  const registerFieldErrors = React.useCallback((errors: SettingsFieldErrors | null) => {
    setClientFieldErrors(errors && Object.keys(errors).length > 0 ? errors : null);
  }, []);

  // Server-side screens (Redirects/Headers/Localization) write via tRPC, not
  // composer state; they register their own save so the footer's Save runs
  // the right write path instead of a saveProject() that no-ops their fields.
  const screenSaveHandlerRef = React.useRef<(() => Promise<void>) | null>(null);
  const registerSaveHandler = React.useCallback((handler: (() => Promise<void>) | null) => {
    screenSaveHandlerRef.current = handler;
  }, []);

  // Composer-backed screens hand their edits over on Save: the flush returns
  // the ProjectSettings to save (ScreenProps.registerFlushHandler).
  type FlushHandler = () => SettingsFlushResult | Promise<SettingsFlushResult>;
  const screenFlushHandlerRef = React.useRef<FlushHandler | null>(null);
  const registerFlushHandler = React.useCallback((handler: FlushHandler | null) => {
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
    markScreenDirty(false);
    setGuardOpen(false);
    setSaveError(null);
    setLoadState("ready");
    setClientFieldErrors(null);
    setServerFieldErrors(undefined);
    setFooterMessage(null);
    screenSaveHandlerRef.current = null;
    screenFlushHandlerRef.current = null;
  }, [currentScreen, markScreenDirty]);

  /* This tab owns its entry in the shell dirty registry (B-1): the shell's
     tab-switch guard, the exit guard and beforeunload all read it (written
     by markScreenDirty). Cleared on unmount so a closed Settings never
     leaves a stale block behind. */
  React.useEffect(() => () => shellDirty.set("settings", false), []);

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
        default:
          /* Workspace rows (Members, Billing, Integrations & webhooks) open
             their door card in the pane (8139:217358); its button leaves for
             the dashboard. */
          navigateTo(id);
      }
    },
    [navigateTo, onOpenDesignTab],
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

  /* `openLeftPanelToTab("settings", <id>)`. An id matching no screen (an old
     link to the removed Integrations screen) is left alone rather than
     guessed at. */
  React.useEffect(() => {
    if (!initialScreen) return;
    if (isSettingsScreenId(initialScreen)) navigateTo(initialScreen);
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

  /* Drop the screen's edits by remounting it (it re-reads the composer, a
     server screen its row). Edits live only in the screen until Save — the
     flush hands them over then (BE-3) — so there is nothing in the composer
     to roll back. The footer's Discard (4418:127966 save bar) stops here; the
     guard's Discard then goes where the user was going. */
  const rollBack = React.useCallback(() => {
    setResetKey((k) => k + 1);
    markScreenDirty(false);
    setSaveError(null);
    setServerFieldErrors(undefined);
  }, [markScreenDirty]);

  /* The shell's "Leave anyway" runs this too, so the registry entry clears
     with the edits. */
  React.useEffect(() => {
    shellDirty.setDiscard("settings", rollBack);
    return () => shellDirty.setDiscard("settings", null);
  }, [rollBack]);

  const handleDiscard = React.useCallback(() => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    setGuardOpen(false);
    rollBack();
    if (!pending || pending.kind === "leave") {
      leave();
      return;
    }
    performNav(pending.id);
  }, [rollBack, leave, performNav]);

  // ─── Save ─────────────────────────────────────────────────────────────

  const current = SETTINGS_NAV.find((n) => n.id === currentScreen);
  const isOverview = currentScreen === "overview";
  const workspaceDoor =
    currentScreen === "members" || currentScreen === "billing" || currentScreen === "webhooks" ? currentScreen : null;
  /* A screen with its own rules — not the Overview, not a workspace door. */
  const screenId =
    currentScreen === "overview" || currentScreen === "members" || currentScreen === "billing" || currentScreen === "webhooks"
      ? null
      : currentScreen;
  const screenRules = screenId
    ? { minRole: SCREEN_MIN_ROLE[screenId], saveModel: SCREEN_SAVE_MODEL[screenId], scope: SCREEN_SCOPE[screenId] }
    : null;
  const workspaceName = getEditorWorkspaceName() ?? "Your workspace";

  /* BE-3: what a composer-backed screen's Save does with the settings its
     flush returned. With a site: the changed Site columns and JSON-only keys
     go through the two settings mutations (never `sites.saveProject`), and
     only once the server has them does the composer take them — as saved
     state, so autosave sends nothing for them. A change no mutation covers yet
     (SEO's Twitter handle until Lane 1) is handed to the composer as an edit,
     so the project save still carries it. Without a site (the standalone
     demo) the engine's own storage is the save. */
  const persistSettings = React.useCallback(
    async (flush: SettingsFlush) => {
      if (!composer) return;
      const next = flush.settings;
      if (!projectId) {
        composer.setProjectSettings(next);
        await composer.saveProject?.();
        flush.onSaved?.();
        return;
      }
      const wasDirty = composer.isDirty?.() ?? true;
      const plan = planSettingsSave(composer.getProjectSettings(), next);
      /* Columns with no settings path (General's slug, SEO's canonical URL)
         ride in the same `settings.update` as the settings' own. */
      await saveSiteSettings(projectId, { ...plan, columns: { ...plan.columns, ...flush.columns } });
      if (plan.unrouted) composer.setProjectSettings(next);
      else {
        composer.adoptSavedProjectSettings(next);
        /* A flush may touch the project metadata (General's name / author);
           when nothing else was waiting, the document is as saved as it was. */
        if (!wasDirty) composer.markSaved?.();
      }
      flush.onSaved?.();
    },
    [composer, projectId],
  );

  /* `then` runs after a save succeeds: the Saved toast after the footer's
     Save, the pending nav / exit after the guard's Save and continue. */
  const handleSave = React.useCallback((then?: () => void) => {
    if (saving) return;
    const failed = (err: unknown) => {
      /* Called off by the user (General's slug confirm → Cancel): nothing was
         sent, so nothing failed — the edits stay, unsaved, with no banner. A
         guard that raised the save closes; the user stays here. */
      if (err instanceof SettingsSaveCancelled) {
        pendingRef.current = null;
        setGuardOpen(false);
        return;
      }
      console.error("[settings] save failed", err);
      setServerFieldErrors(err instanceof SettingsSaveError && Object.keys(err.fieldErrors).length > 0 ? err.fieldErrors : undefined);
      setSaveError(SAVE_ERROR_MESSAGES[currentScreen] ??
        `Changes to ${current?.title ?? "settings"} were not saved. Your changes are still here. Review the values, then retry.`);
    };
    const succeeded = () => {
      setSaveError(null);
      setServerFieldErrors(undefined);
      markScreenDirty(false);
      if (then) then();
      /* 4418:165469 / M19: a toast (bottom-left, dark), the change's scope and
         the way to ship it. Publish opens the Publish panel — it does not
         publish. */
      else
        addToast({
          title: "Saved · applies on next publish",
          description: "Your site settings are saved.",
          action: { label: "Publish", onClick: () => composer?.emit(EVENTS.UI_PANEL_OPEN, { panel: "publish" }) },
        });
    };
    const screenHandler = screenSaveHandlerRef.current;
    let run: Promise<void> | void;
    if (screenHandler) {
      // A screen that writes its own rows (Headers, Languages, the rules on
      // Redirects) saves them itself.
      run = screenHandler();
    } else {
      let result: SettingsFlushResult | Promise<SettingsFlushResult>;
      try {
        result = screenFlushHandlerRef.current?.();
      } catch (err) {
        failed(err);
        return;
      }
      /* A flush may ask first (General's slug confirm) — then it is a promise. */
      run =
        result instanceof Promise
          ? result.then((r) => (r ? persistSettings(asFlush(r)) : undefined))
          : result
            ? persistSettings(asFlush(result))
            : undefined;
    }
    if (!run) {
      succeeded();
      return;
    }
    setSaving(true);
    run.then(succeeded, failed).finally(() => setSaving(false));
  }, [composer, current, currentScreen, saving, addToast, siteName, markScreenDirty, persistSettings]);

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
  /* 8136:216758: Access draws its own lock (the password card) and keeps Share
     links — no centred LockedScreen, no header Upgrade. */
  const ownsLock = locked && isSettingsScreenId(currentScreen) && SCREENS_WITH_OWN_PLAN_LOCK.has(currentScreen);
  const editorRole = useEditorRole();
  /* PD-1 (M7): Site columns are the dashboard's, mirrored from the editor only
     for an ADMIN. Below ADMIN (a KNOWN role — unknown stays editable, the
     server decides) the fields that edit them are read-only and say why; the
     rest of each screen is project data and stays editable. */
  const siteColumnsLocked = roleAtLeast(editorRole, "ADMIN") === false;
  /* SA-21 / M2: below the screen's role the whole screen is read-only — the
     banner says who can change it, every native control is disabled, and the
     header action and the footer go. Unknown role (demo, failed lookup): not
     read-only; the server decides. */
  const readOnly = !!screenRules && !locked && roleAtLeast(editorRole, screenRules.minRole) === false;

  const renderScreen = (): React.ReactNode => {
    if (workspaceDoor && current) {
      return (
        <WorkspaceDoorScreen door={workspaceDoor} title={current.title} workspaceName={workspaceName} onClose={() => requestNav("overview")} />
      );
    }
    if (!screenId) return <OverviewScreen projectId={projectId} siteName={siteName} onOpenScreen={requestNav} />;
    const required = SCREEN_PLAN_REQUIREMENTS[screenId];
    if (locked && required && !ownsLock) {
      return <LockedScreen variant={required} {...LOCKED_COPY[screenId]} onUpgrade={openBilling} />;
    }
    const screenNode = (
      /* A read-only screen says so once, in its notice (8134:212323) — not again under every field. */
      <SiteColumnsLockedContext.Provider value={siteColumnsLocked && !readOnly}>{renderEditableScreen(screenId)}</SiteColumnsLockedContext.Provider>
    );
    /* The Danger zone's actions do not share one rule — its creator may
       transfer (Q-B5) — so it draws its own notice and disables each action
       itself (8137:216834). */
    if (!readOnly || !screenRules || !current || screenId === "danger-zone") return screenNode;
    return (
      <>
        <ReadOnlyBanner who={ROLE_NOUN[screenRules.minRole]} screen={current.title} />
        {/* A disabled fieldset disables every native control inside it; its
            cards sit 16 apart, as on the editable screen (set-body's gap). */}
        <fieldset disabled className="tw:m-0 tw:flex tw:min-w-0 tw:flex-col tw:gap-4 tw:border-0 tw:p-0" data-testid="set-readonly-screen">
          {screenNode}
        </fieldset>
      </>
    );
  };

  const renderEditableScreen = (screenId: Exclude<SettingsScreenId, "overview">): React.ReactNode => {
    const common = {
      composer,
      projectId,
      onDirtyChange: markScreenDirty,
      registerSaveHandler,
      registerFlushHandler,
      onLoadStateChange: setLoadState,
      saveError,
      registerHeaderAction,
      registerHeader,
      saveModel: SCREEN_SAVE_MODEL[screenId],
      readOnly,
      registerFieldErrors,
      registerFooterMessage: setFooterMessage,
      onOpenScreen: requestNav,
      planLocked: locked,
      onUpgrade: openBilling,
      fieldErrors: serverFieldErrors,
    };
    switch (screenId) {
      case "general":
        return <SiteSettingsScreen {...common} />;
      case "localization":
        return <LocalizationScreen {...common} />;
      case "seo":
        return <SeoScreen {...common} />;
      case "domains":
        return <DomainsScreen {...common} />;
      case "redirects":
        return <RedirectsScreen {...common} repair={repair} onRepairDone={clearRepair} />;
      case "access":
        return <AccessScreen {...common} />;
      case "analytics":
        return <AnalyticsScreen {...common} />;
      case "forms":
        return <FormsScreen {...common} />;
      case "custom-code":
        return <AdvancedScreen {...common} />;
      case "headers":
        return <HeadersScreen {...common} />;
      case "danger-zone":
        return <DangerZoneScreen {...common} />;
    }
  };

  /* 8134:212121: the screen's own title, a sub-view's after it, and the
     scope line (M1) under it. */
  const headTitle = isOverview || !current
    ? "Overview"
    : `${current.title.replace(/ ↗$/, "")}${screenHeader?.title ? ` / ${screenHeader.title}` : ""}`;
  const headScope = screenRules
    ? scopeLine(screenRules.scope, siteName)
    : workspaceDoor
      ? workspaceScopeLine(workspaceName)
      : scopeLine("lifecycle", siteName);

  const immediate = screenRules?.saveModel === "immediate";
  const footStatus: { text: string; tone: "muted" | "danger" } =
    loadState === "loading"
      ? { text: "Loading settings…", tone: "muted" }
      : loadState === "error"
        ? { text: "Settings could not load", tone: "danger" }
        : footerMessage
          ? { text: footerMessage, tone: "muted" }
          : saveError
            ? { text: "Not saved", tone: "danger" }
            : screenIsDirty
              ? { text: "Unsaved changes", tone: "muted" }
              : { text: "All changes saved", tone: "muted" };
  /* The footer is there while something waits to be saved, a save failed, or
     a footer screen's read is pending or failed — never on the Overview, a
     locked or read-only screen. An immediate screen gets it only while it
     still holds an edit (Redirects' 404 switch, until it applies at once). */
  const showFooter =
    !!screenRules && !locked && !readOnly && (!immediate || screenIsDirty || !!saveError);
  const FOOT_TONE = {
    muted: "tw:text-[var(--bk-ink-muted)]",
    danger: "tw:text-[var(--bk-error)]",
  } as const;

  // ─── Sidebar rows ─────────────────────────────────────────────────────

  /* The filter: a screen matches on its own title / description / group, or
     through one of its fields — then the row lands on that field (the
     retired dialog's jump & focus). */
  const trimmed = query.trim();
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
  const clearSearch = () => setQuery("");

  const renderRow = (n: SettingsNavDef) => {
    const active = currentScreen === n.id;
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
        <span className="tw:min-w-0 tw:flex-1 tw:truncate" data-locked={rowLocked || undefined}>{n.title}</span>
        {/* M0: a plan-locked row says so before it is opened; Billing carries the plan. */}
        {rowLocked ? (
          <span className={NAV_PILL} data-testid={`set-nav-pro-${n.id}`}>
            Pro
          </span>
        ) : n.id === "billing" ? (
          <span className={NAV_PILL} data-testid="set-nav-plan">
            {PLAN_LABEL[effectivePlan]}
          </span>
        ) : null}
      </Button>
    );
  };

  return (
    <div className="tw:flex tw:h-full tw:min-h-0 tw:w-full tw:bg-[var(--bk-bg-panel)] tw:[font-family:var(--bk-font-ui)]" data-testid="set-root">
      {/* ── Sidebar (M0, 8134:212121) ───────────────────────────────────── */}
      <aside className="tw:flex tw:w-64 tw:shrink-0 tw:flex-col tw:border-r tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)]">
        <div className="tw:flex tw:shrink-0 tw:flex-col tw:px-4 tw:pt-3">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="tw:h-8 tw:w-54 tw:justify-center tw:gap-0.5 tw:px-3 tw:text-[length:var(--bk-text-13)] tw:font-medium tw:leading-5 tw:text-[var(--bk-gray-700)] tw:enabled:hover:bg-[var(--bk-bg-subtle)]"
            onClick={requestLeave}
            data-testid="set-back"
          >
            <ChevronLeft size={12} aria-hidden />
            Back to canvas
          </Button>
          <h2
            className="tw:m-0 tw:mt-2.5 tw:text-[length:var(--bk-text-24)] tw:font-semibold tw:leading-8 tw:tracking-[-0.015em] tw:text-[var(--bk-ink)]"
            data-testid="set-title"
          >
            Settings
          </h2>
          <div className="tw:truncate tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-gray-500)]" data-testid="set-site">
            {siteName}
          </div>
        </div>
        <nav className="tw:flex tw:min-h-0 tw:flex-1 tw:flex-col tw:overflow-y-auto tw:px-4 tw:pb-4 tw:pt-3" aria-label="Settings sections">
          {/* 8134:212121 / 6816:60270: the search field is always there, at the top of the nav. */}
          <div className="tw:relative tw:mb-1 tw:shrink-0" data-testid="set-search">
            <TextInput
              type="search"
              icon={trimmed ? SearchIcon : undefined}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  e.stopPropagation();
                  clearSearch();
                  e.currentTarget.blur();
                }
              }}
              placeholder="Search site settings"
              aria-label="Search site settings"
              theme={{
                field: {
                  input: {
                    base: "tw:pr-8 tw:[&::-webkit-search-cancel-button]:hidden tw:rounded-[var(--bk-radius-sm)]! tw:placeholder:text-[var(--bk-ink)]",
                    /* 36 tall, 12px — the theme's own `md` is 32 / 13. */
                    sizes: { md: "tw:h-9 tw:py-0 tw:text-[length:var(--bk-text-12)]" },
                    colors: {
                      gray:
                        "tw:border-transparent tw:bg-[var(--bk-bg-subtle)] tw:focus:border-[var(--bk-accent)] tw:focus:bg-[var(--bk-bg-panel)] tw:focus:ring-[var(--bk-accent)]",
                    },
                  },
                },
              }}
              data-testid="set-search-input"
            />
            {trimmed ? (
              <IconButton
                label="Clear search"
                onClick={clearSearch}
                className="tw:absolute tw:right-1.5 tw:top-1.5 tw:size-6 tw:min-h-0 tw:min-w-0 tw:text-[var(--bk-ink-muted)]"
                data-testid="set-search-clear"
              >
                <X size={14} aria-hidden />
              </IconButton>
            ) : null}
          </div>
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
          {SETTINGS_NAV_GROUP_ORDER.map((group) => {
            const rows = SETTINGS_NAV.filter((n) => n.group === group && (!matchField || matchField.has(n.id)));
            if (rows.length === 0) return null;
            /* M0: the workspace doors sit apart, under a separator, as
               "Managed in workspace settings ↗" — they are not this site's. */
            if (group === "workspace") {
              return (
                <React.Fragment key={group}>
                  <hr className="tw:my-0 tw:h-px tw:w-full tw:shrink-0 tw:border-0 tw:bg-[var(--bk-border)]" aria-hidden />
                  <div
                    className="tw:flex tw:h-10 tw:shrink-0 tw:items-center tw:pl-2 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink)]"
                    data-testid={`set-nav-group-${group}`}
                  >
                    {`${SETTINGS_NAV_GROUPS[group]} ↗`}
                  </div>
                  {rows.map(renderRow)}
                </React.Fragment>
              );
            }
            return (
              <React.Fragment key={group}>
                <div className={`${NAV_GROUP} tw:shrink-0`} data-testid={`set-nav-group-${group}`}>
                  {SETTINGS_NAV_GROUPS[group]}
                </div>
                {rows.map(renderRow)}
              </React.Fragment>
            );
          })}
          {matchField && matchField.size === 0 ? (
            <p className="tw:m-0 tw:px-2 tw:py-2 tw:text-[length:var(--bk-text-12)] tw:leading-5 tw:text-[var(--bk-ink-muted)]" data-testid="set-search-empty">
              {`No settings match "${trimmed}"`}
            </p>
          ) : null}
          {trimmed ? (
            /* 6816:60270's hand-off: the same query, everywhere (⌘K). */
            <Button
              type="button"
              variant="secondary"
              size="xs"
              className="tw:mt-4 tw:h-auto tw:min-h-0 tw:w-full tw:shrink-0 tw:items-start tw:justify-between tw:gap-2 tw:rounded-md tw:px-2.5 tw:py-2 tw:text-left tw:text-[length:var(--bk-text-12)] tw:font-normal tw:leading-4 tw:text-[var(--bk-ink)]"
              onClick={() => composer?.emit?.(EVENTS.UI_TOGGLE_COMMAND_PALETTE, { query: trimmed })}
              data-testid="set-search-everywhere"
            >
              <span className="tw:min-w-0 tw:break-words">{`Search everywhere for "${trimmed}"`}</span>
              <Kbd>⌘K</Kbd>
            </Button>
          ) : null}
        </nav>
        {/* S5 Q1: every role sees who they are and can open what that allows
            (the Permissions dialog, PermissionsHost). Not on the M0 board —
            an owner decision (2026-10-02) the board predates. */}
        {editorRole ? (
          <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-1 tw:border-t tw:border-[var(--bk-border)] tw:px-6 tw:py-2 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="set-role">
            <span>{`Your role: ${editorRole.charAt(0)}${editorRole.slice(1).toLowerCase()}`}</span>
            <span aria-hidden>·</span>
            <Button
              type="button"
              variant="link"
              className="tw:h-auto tw:min-h-0 tw:px-0 tw:text-[length:var(--bk-text-11)] tw:leading-4"
              onClick={() => composer?.emit(EVENTS.UI_OPEN_PERMISSIONS, undefined)}
              data-testid="set-role-permissions"
            >
              Permissions
            </Button>
          </div>
        ) : null}
      </aside>

      {/* ── Pane ────────────────────────────────────────────────────────── */}
      <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
        {/* 8134:212121: a 112 white band — the screen's title (20/28) and the
            scope line under it (M1); the screen's own action or the plan
            gate's Upgrade at the right. */}
        <header className="tw:flex tw:h-28 tw:shrink-0 tw:items-start tw:justify-between tw:gap-3 tw:bg-[var(--bk-bg-panel)] tw:px-12 tw:pt-6">
          <div className="tw:flex tw:min-w-0 tw:flex-col tw:gap-1">
            <h2
              className="tw:m-0 tw:truncate tw:text-[length:var(--bk-text-20)] tw:font-semibold tw:leading-7 tw:tracking-[-0.24px] tw:text-[var(--bk-ink)]"
              data-testid="set-head-title"
            >
              {headTitle}
            </h2>
            <p className="tw:m-0 tw:truncate tw:text-[length:var(--bk-text-12)] tw:leading-5 tw:text-[var(--bk-gray-500)]" data-testid="set-head-scope">
              {headScope}
            </p>
            {screenHeader?.subtitle ? (
              <p className="tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-5 tw:text-[var(--bk-gray-500)]" data-testid="set-head-sub">
                {screenHeader.subtitle}
              </p>
            ) : null}
          </div>
          {locked && !ownsLock ? (
            <Button type="button" size="xs" className={SET_HEAD_BTN} onClick={openBilling} data-testid="set-head-upgrade">
              Upgrade
            </Button>
          ) : readOnly || locked ? null : (
            headerAction
          )}
        </header>

        <div
          key={resetKey}
          className="tw:flex tw:min-h-0 tw:flex-1 tw:flex-col tw:gap-4 tw:overflow-y-auto tw:bg-[var(--bk-gray-50)] tw:px-12 tw:py-6"
          data-testid="set-body"
        >
          {renderScreen()}
        </div>

        {/* 8134:212121 / 8134:212718: a footer screen always has its save bar —
            status at the left, Discard and Save at the right, both disabled
            while there is nothing to save. None on the Overview, a workspace
            door, a locked or read-only screen; an immediate screen gets it
            only while it still holds an edit. */}
        {!showFooter ? null : (
          <footer className="tw:flex tw:h-11 tw:shrink-0 tw:items-center tw:justify-end tw:gap-2 tw:border-t tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:px-4">
            <span
              className={`tw:min-w-0 tw:flex-1 tw:text-[length:var(--bk-text-12)] tw:leading-[18px] ${FOOT_TONE[footStatus.tone]}`}
              role="status"
              data-testid="set-foot-status"
            >
              {footStatus.text}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className={`${SET_BTN} tw:h-7 tw:px-3 tw:text-[var(--bk-gray-700)]`}
              disabled={!screenIsDirty && !saveError}
              onClick={rollBack}
              data-testid="set-foot-discard"
            >
              Discard
            </Button>
            <Button
              type="button"
              size="xs"
              className={`${SET_BTN} tw:h-7 tw:px-3`}
              disabled={loadState !== "ready" || saving || clientFieldErrors !== null || (!screenIsDirty && !saveError)}
              onClick={() => handleSave()}
              data-testid="set-foot-save"
            >
              {saveError && !footerMessage ? "Retry save" : "Save"}
            </Button>
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

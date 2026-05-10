import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * SettingsTab — prototype-aligned shell.
 *
 * Layout: 140px snav + 1fr pane. Central dirty counter + sticky savebar.
 * Branding renders a placeholder linking to the Palette tab (no embedded
 * DesignSystemTab chrome).
 *
 * Spec: docs/reference/left-panel/tab-settings.html
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { TabFrame } from "@/shared/extensions/TabFrame";
import { usePanelNavigation } from "../../shared/usePanelNavigation";
import { DrillInHeader } from "../../shared/DrillInHeader";
import {
  type SettingsTabProps,
  type PlanTier,
  SCREEN_PLAN_REQUIREMENTS,
  SiteSettingsIcon,
  IntegrationsIcon,
  TourIcon,
  SeoIcon,
  BillingIcon,
  DesignSystemIcon,
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
} from "./index";
import { ConfirmDialog } from "@/shared/extensions/ConfirmDialog";
import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
import "./settings.css";

// ─── Nav definition ──────────────────────────────────────────────────────────
//
// A1 day-1: nav reshuffle to 10 in-tab sections + 8 workspace deep-links,
// per locked prototype at:
//   ~/.gstack/projects/aamirtauqir-buildrik/designs/settings-industrial-20260507/prototype.html
//
// In-tab sections live in 3 groups (SITE / DISTRIBUTION / PLUMBING). The 4th
// group (WORKSPACE) is deep-link only — clicking opens the dashboard URL.
//
// Existing screens reused: General/Branding/SEO/Analytics/Custom code (Advanced)/Integrations.
// A1 day-3: all 4 originally-stubbed sections (Redirects/Forms/Headers/Localization) now real.

type InTabNavId =
  | "general" | "branding" | "seo"
  | "analytics" | "localization"
  | "custom-code" | "redirects" | "headers" | "forms" | "integrations";

type NavGroupId = "site" | "distribution" | "plumbing";

interface NavDef {
  id: InTabNavId;
  title: string;
  subtitle?: string;
  group: NavGroupId;
  icon: React.FC;
}

const NAV: NavDef[] = [
  // SITE
  { id: "general", title: "General", subtitle: "Project metadata", group: "site", icon: SiteSettingsIcon },
  { id: "branding", title: "Branding", subtitle: "Colors, type, favicon", group: "site", icon: DesignSystemIcon },
  { id: "seo", title: "SEO", subtitle: "Search & social preview", group: "site", icon: SeoIcon },
  // DISTRIBUTION
  { id: "analytics", title: "Analytics", subtitle: "GA4, Plausible, PostHog, Pixel", group: "distribution", icon: IntegrationsIcon },
  { id: "localization", title: "Localization", subtitle: "Locale claim and preview", group: "distribution", icon: IntegrationsIcon },
  // PLUMBING
  { id: "custom-code", title: "Custom code", subtitle: "Head, body, CSS injections", group: "plumbing", icon: IntegrationsIcon },
  { id: "redirects", title: "Redirects", subtitle: "301 / 302 + 404 suggester", group: "plumbing", icon: IntegrationsIcon },
  { id: "headers", title: "Headers", subtitle: "CSP, HSTS, security policy", group: "plumbing", icon: IntegrationsIcon },
  { id: "forms", title: "Forms", subtitle: "Submissions inbox + config", group: "plumbing", icon: IntegrationsIcon },
  { id: "integrations", title: "Integrations", subtitle: "Third-party OAuth", group: "plumbing", icon: IntegrationsIcon },
];

const GROUP_LABELS: Record<NavGroupId, string> = {
  site: "SITE",
  distribution: "DISTRIBUTION",
  plumbing: "PLUMBING",
};

// Workspace deep-links — open dashboard URLs in new tab. Not in-tab screens.
//
// Only links to dashboard pages that actually exist ship here. A1 day-1
// shipped 8 links optimistically; subsequent verification revealed only
// 3 had real backing pages (Domains + Members under /dashboard/team +
// Billing under /dashboard/billing). API tokens / Webhooks / Environments /
// Audit log / Versions are deferred until their dashboard pages exist —
// linking to 404s silently is worse than not linking at all.
const DASHBOARD_URL = (import.meta as { env?: { VITE_DASHBOARD_URL?: string } }).env?.VITE_DASHBOARD_URL || "http://localhost:3000";

interface WorkspaceLink {
  id: string;
  title: string;
  /**
   * Site-scoped: path appended to `${DASHBOARD_URL}/dashboard/sites/${siteId}/`.
   * Workspace-scoped: full path appended to `${DASHBOARD_URL}` (must include
   * the leading `/dashboard/...` segment — see Members / Billing below).
   */
  path: string;
  scope: "site" | "workspace";
}

const WORKSPACE_LINKS: WorkspaceLink[] = [
  { id: "domains", title: "Domains", path: "domains", scope: "site" },
  { id: "members", title: "Members", path: "/dashboard/team", scope: "workspace" },
  { id: "billing", title: "Billing", path: "/dashboard/billing", scope: "workspace" },
];

function buildWorkspaceUrl(link: WorkspaceLink, siteId: string | null): string {
  if (link.scope === "workspace") return `${DASHBOARD_URL}${link.path}`;
  if (!siteId) return `${DASHBOARD_URL}/dashboard`; // graceful fallback when siteId unknown
  return `${DASHBOARD_URL}/dashboard/sites/${siteId}/${link.path}`;
}

const SETTINGS_SCREENS = NAV.map(({ id, title }) => ({ id, title }));

// ─── Branding section ─────────────────────────────────────────────────────────
//
// Branding spans two canonical homes: the Palette tab owns design tokens
// (colors, type, spacing) and the General section owns site identity
// (favicon, social links). Rather than duplicate either as a fake passthrough
// here, the section is a navigation map with deep-jumps to the real fields.

interface BrandingFieldRow {
  label: string;
  /** Where the field actually lives. Rendered as a muted secondary line. */
  location: string;
  /** Optional in-tab nav target for sibling screens (general / seo). */
  jumpTo?: "general" | "seo";
}

const BRANDING_FIELD_MAP: BrandingFieldRow[] = [
  { label: "Brand color", location: "Palette → Colors" },
  { label: "Brand font", location: "Palette → Type" },
  { label: "Favicon", location: "General → Site Identity", jumpTo: "general" },
  { label: "Social card image", location: "SEO → Default OG Image", jumpTo: "seo" },
  { label: "Social handles", location: "General → Social Links", jumpTo: "general" },
];

interface BrandingSectionProps {
  onOpenPalette?: () => void;
  onJumpTo?: (screenId: "general" | "seo") => void;
}

const BrandingSection: React.FC<BrandingSectionProps> = ({ onOpenPalette, onJumpTo }) => (
  <>
    <div className="bd-set-section">
      <h3 className="bd-set-section-h">Where Branding lives</h3>
      <div className="bd-set-section-d">
        Branding splits across Palette (design tokens) and the General + SEO
        sections (site identity). Each row below jumps to the canonical home
        for that field.
      </div>
      <ul className="bd-set-branding-map" aria-label="Branding field map">
        {BRANDING_FIELD_MAP.map((row) => {
          const handleJump =
            row.jumpTo && onJumpTo ? () => onJumpTo(row.jumpTo!) : undefined;
          return (
            <li key={row.label} className="bd-set-branding-map-row">
              <div className="bd-set-branding-map-text">
                <div className="bd-set-branding-map-label">{row.label}</div>
                <div className="bd-set-branding-map-loc">{row.location}</div>
              </div>
              {handleJump ? (
                <Button
                  type="button"
                  className="bd-set-btn sec"
                  onClick={handleJump}
                  aria-label={`Jump to ${row.location}`}
                >
                  Open →
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>

    <div className="bd-set-section">
      <h3 className="bd-set-section-h">Design tokens</h3>
      <div className="bd-set-section-d">
        Colors, typography, spacing, and other brand tokens live in the Palette tab.
        Changes there apply to every page on the site.
      </div>
      <div className="bd-set-branding-placeholder">
        <Button
          type="button"
          className="bd-set-btn pri"
          onClick={onOpenPalette}
          disabled={!onOpenPalette}
        >
          Open Palette →
        </Button>
      </div>
    </div>
  </>
);

// ─── Module-scope helpers ─────────────────────────────────────────────────────

function isScreenLocked(screenId: string, userPlan: PlanTier): boolean {
  const required = SCREEN_PLAN_REQUIREMENTS[screenId];
  if (!required) return false;
  return required === "pro" ? userPlan === "starter" : userPlan !== "enterprise";
}

// ─── Component ───────────────────────────────────────────────────────────────

export const SettingsTab: React.FC<
  SettingsTabProps & {
    /**
     * Switch to the Palette (`design`) tab. Threaded from
     * LeftSidebar → TabRouter → SettingsTab so the Branding section's
     * "Open Palette →" button can navigate cross-tab.
     */
    onOpenDesignTab?: () => void;
  }
> = ({
  composer,
  isPinned: _isPinned,
  onPinToggle: _onPinToggle,
  onHelpClick,
  onClose,
  userPlan = "starter",
  onReplayTour,
  projectId,
  onDirtyChange,
  onOpenDesignTab,
}) => {
  const { currentScreen, navigateTo } = usePanelNavigation({
    storageKey: `settings-panel${projectId ? `-${projectId}` : ""}`,
    screens: SETTINGS_SCREENS,
    defaultScreen: "general",
  });

  const [screenIsDirty, setScreenIsDirty] = React.useState(false);
  const [dirtyCount, setDirtyCount] = React.useState(0);
  const [guardOpen, setGuardOpen] = React.useState(false);
  const pendingNavRef = React.useRef<InTabNavId | null>(null);
  const [resetKey, setResetKey] = React.useState(0);

  const prefersReducedMotion = useReducedMotion();

  // v2 layout state — see docs/designs/settings-v2.md §3.
  //
  // `isRoot=true` shows the snav root; `isRoot=false` shows the drilled-in
  // section. `sectionMounted` is the lifecycle gate: section is mounted when
  // user clicks a row (BEFORE isRoot flips, so CSS has a node to animate),
  // unmounted only after pop transitionend completes. `transitioning` blocks
  // re-entrant nav during the 180ms animation window (D20).
  const [isRoot, setIsRoot] = React.useState(true);
  const [sectionMounted, setSectionMounted] = React.useState(false);
  const [transitioning, setTransitioning] = React.useState(false);
  const sectionRef = React.useRef<HTMLDivElement | null>(null);

  // Codex P0 #1: shadow screenIsDirty into a ref so click-handlers (navigate,
  // Escape) read the LATEST value synchronously, not the post-render state.
  // Screens push dirty via a post-render useEffect — without this ref, a click
  // in the same gesture as an edit reads stale false.
  //
  // Codex pass-3 acknowledged limitation: BOTH the screen's onDirtyChange
  // effect AND this ref-mirror effect are post-render. A truly synchronous
  // edit+click within the SAME microtask (no event-loop boundary) could still
  // see stale false. This is unreachable for human input — browser keystroke
  // and click events are separated by paint cycles, so React commits the
  // edit's effects before processing the click. Tests drive both via
  // `fireEvent` + `waitFor` so the propagation chain has time to land.
  //
  // Architectural fix (deferred): change useSettingsScreen to publish dirty
  // SYNCHRONOUSLY via a ref prop instead of via post-render onDirtyChange.
  // Touches 4 screens (Site, Advanced, SEO, Analytics) + the hook contract.
  // Out of v2 scope — separate arc when programmatic edit+nav becomes a real
  // path (e.g., hotkey-driven save+navigate gesture).
  const screenIsDirtyRef = React.useRef(false);
  React.useEffect(() => {
    screenIsDirtyRef.current = screenIsDirty;
  }, [screenIsDirty]);

  // Codex P0 #2: track last-focused snav row so pop can restore focus.
  // Set in renderRow's onClick (Task 4); read in navigateToRoot transitionend.
  const lastFocusedRowRef = React.useRef<HTMLButtonElement | null>(null);

  // Server-side screens (Redirects/Headers/Localization) write directly via
  // tRPC, not through composer state. They register their own save handler so
  // the central savebar's Save invokes the right write path instead of a
  // composer.saveProject() that silently no-ops their fields.
  const screenSaveHandlerRef = React.useRef<(() => Promise<void>) | null>(null);
  const registerSaveHandler = React.useCallback(
    (handler: (() => Promise<void>) | null) => {
      screenSaveHandlerRef.current = handler;
    },
    []
  );

  React.useEffect(() => {
    setScreenIsDirty(false);
    setDirtyCount(0);
    setGuardOpen(false);
    // Clear stale handler on screen change — old screen unmounts, new screen
    // re-registers if applicable.
    screenSaveHandlerRef.current = null;
  }, [currentScreen]);

  React.useEffect(() => {
    onDirtyChange?.(screenIsDirty);
  }, [screenIsDirty, onDirtyChange]);

  const handleScreenDirty = React.useCallback((dirty: boolean) => {
    setScreenIsDirty(dirty);
    setDirtyCount(dirty ? 1 : 0);
  }, []);

  // Push: snav root → section. Mounts section first, then flips isRoot on next
  // rAF tick so CSS transition has a starting state. Reduced-motion path skips
  // both the animation AND the input lock — render is instant.
  //
  // Codex P0 #1: read screenIsDirtyRef.current (not state) — click in same
  // gesture as edit must see latest dirty.
  // Codex P0 #2: blur active element before flipping isRoot so focus does not
  // remain inside what becomes aria-hidden=true. DrillInHeader's mount effect
  // will then place focus on breadcrumb-current.
  //
  // Codex P0 #3 hardening (Task-7 follow-up): dirty check applies to BOTH
  // push and section→section paths. Without this, a section-to-section jump
  // (e.g., Branding's "Open General →" button) silently clears dirty edits
  // instead of routing through ConfirmDialog. ConfirmDialog's onConfirm
  // already handles all 4 (isRoot × pendingNav) quadrants — pass-2 wiring.
  const navigate = React.useCallback(
    (nextId: InTabNavId) => {
      if (transitioning) return;
      if (nextId === currentScreen && !isRoot) return;
      // Universal dirty check FIRST — applies to push + section→section.
      // ConfirmDialog's onConfirm handles routing based on (isRoot, pendingNav)
      // post-discard.
      if (screenIsDirtyRef.current) {
        pendingNavRef.current = nextId;
        setGuardOpen(true);
        return;
      }
      // Section→section nav (clean): drilled-in user clicking another section
      // (Branding's onJumpTo path). Routes through navigateBetweenSections to
      // avoid the push state-machine deadlock + skip animation.
      if (!isRoot) {
        navigateBetweenSections(nextId);
        return;
      }
      // Codex P0 #2: blur the clicked snav row before root becomes aria-hidden.
      (document.activeElement as HTMLElement | null)?.blur?.();
      navigateTo(nextId);
      setSectionMounted(true);

      if (prefersReducedMotion) {
        setIsRoot(false);
        return;
      }
      setTransitioning(true);
      requestAnimationFrame(() => setIsRoot(false));
    },
    // navigateBetweenSections is omitted from deps because it only closes over
    // currentScreen / transitioning / navigateTo + stable setters — all
    // non-setter deps are already listed below, so navigate is rebuilt
    // whenever they change and the new closure picks up the latest
    // navigateBetweenSections function. (Function declarations DO get
    // re-instantiated every render; the safety comes from closure-over-deps,
    // not declaration identity.)
    [currentScreen, isRoot, navigateTo, transitioning, prefersReducedMotion],
  );

  // Pop: section → snav. Section stays mounted during animation; transitionend
  // handler unmounts it AND restores focus to the originating snav row.
  // Reduced-motion path unmounts immediately + restores focus inline.
  //
  // Codex P0 #1 pass-2 hardening: navigateToRoot also reads
  // screenIsDirtyRef.current (NOT the prop chain through DrillInHeader's
  // isDirty) so back-button + Escape + any other pop path are guarded.
  // DrillInHeader's onBackAttempt prop fires on stale-but-positive isDirty
  // reads; navigateToRoot fires on stale-and-negative isDirty reads. Both
  // safety paths converge here.
  //
  // Codex P0 #2: blur active element so focus does not stay inside the
  // section as it becomes aria-hidden=true.
  const navigateToRoot = React.useCallback(() => {
    if (transitioning) return;
    // Codex P0 #1: dirty re-check at navigate-time, not just at click-time.
    // A dirty edit landing in the same gesture as a back-click can leave
    // DrillInHeader's prop view as isDirty=false; trust the ref.
    if (screenIsDirtyRef.current) {
      pendingNavRef.current = null; // null = back-attempt path (not pending-nav)
      setGuardOpen(true);
      return;
    }
    (document.activeElement as HTMLElement | null)?.blur?.();
    if (prefersReducedMotion) {
      setIsRoot(true);
      setSectionMounted(false);
      // Restore focus to the row that opened this section (best effort).
      setTimeout(() => lastFocusedRowRef.current?.focus(), 0);
      return;
    }
    setTransitioning(true);
    setIsRoot(true);
  }, [transitioning, prefersReducedMotion]);

  // Section→section nav (in-section→in-section, no animation, no lock).
  // Used by:
  //   - Branding section's onJumpTo (jumps to general / seo)
  //   - ConfirmDialog discard branch when pendingNav targets a different
  //     section while user is already drilled-in
  //
  // Force-remounts the section content via resetKey so focus + screen-state
  // fully reset; sectionMounted stays true; isRoot stays false.
  //
  // Function declaration form (not useCallback). The render closure rebuilds
  // it each time, but its callers (navigate, JSX onClick handlers in Task 4)
  // are themselves rebuilt by React when their deps change, so they pick up
  // the freshest navigateBetweenSections automatically.
  function navigateBetweenSections(nextId: InTabNavId) {
    if (nextId === currentScreen) return;
    if (transitioning) return;
    navigateTo(nextId);
    setResetKey((k) => k + 1);
    setScreenIsDirty(false);
    setDirtyCount(0);
    // DrillInHeader unmounts + remounts because of resetKey-keyed wrapper —
    // its own mount effect will refire and focus breadcrumb-current.
  }

  const handleStackTransitionEnd = React.useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      // Only act on transform completion (filter out opacity events).
      if (e.propertyName !== "transform") return;
      // Section's pop animation completed → unmount it + restore focus.
      if (e.target === sectionRef.current && isRoot) {
        setSectionMounted(false);
        // Codex P0 #2: focus the row that opened this section so keyboard
        // users land back in a meaningful place after the pop.
        setTimeout(() => lastFocusedRowRef.current?.focus(), 0);
      }
      // Either screen finishing its transform clears the navigation block.
      setTransitioning(false);
    },
    [isRoot],
  );

  // Settings v2 owns Escape. DrillInHeader is opted out via
  // enableDocumentEscape={false}. ConfirmDialog handles its own Escape via
  // onEscapeKeyDown preventDefault (Task 2).
  //
  // Codex P0 #1: read screenIsDirtyRef.current (sync), not state — Escape in
  // the same tick as an edit must see the latest dirty value. The ref-shadow
  // effect (Step 1) guarantees ref is at-most-one-render stale; for click +
  // keydown handlers, that's already the latest value.
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (guardOpen) return; // ConfirmDialog will handle via onEscapeKeyDown
      if (isRoot) return;    // already at root, nothing to pop
      if (transitioning) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) {
        return; // input handles its own Escape (blur/clear)
      }
      e.preventDefault();
      if (screenIsDirtyRef.current) {
        setGuardOpen(true);
      } else {
        navigateToRoot();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [guardOpen, isRoot, transitioning, navigateToRoot]);

  const handleDiscard = React.useCallback(() => {
    setResetKey((k) => k + 1);
    setScreenIsDirty(false);
    setDirtyCount(0);
  }, []);

  const handleSave = React.useCallback(() => {
    const screenHandler = screenSaveHandlerRef.current;
    if (screenHandler) {
      // Server-side screen owns persistence. Skip composer.saveProject() —
      // it would silently drop Redirects/Headers/Localization fields.
      screenHandler()
        .then(() => {
          setScreenIsDirty(false);
          setDirtyCount(0);
        })
        .catch((err) => {
          console.error("[settings] screen save failed", err);
          // Screen renders its own error banner; keep dirty so savebar stays visible.
        });
      return;
    }
    if (!composer) return;
    const maybePromise = composer.saveProject?.();
    if (!maybePromise) {
      setScreenIsDirty(false);
      setDirtyCount(0);
      return;
    }
    maybePromise
      .then(() => {
        setScreenIsDirty(false);
        setDirtyCount(0);
      })
      .catch((err) => {
        console.error("[settings] save failed", err);
      });
  }, [composer]);

  const current = NAV.find((n) => n.id === currentScreen) ?? NAV[0];

  const renderContent = (): React.ReactNode => {
    if (isScreenLocked(currentScreen, userPlan)) {
      const requiredPlan = SCREEN_PLAN_REQUIREMENTS[currentScreen];
      return <LockedScreen variant={requiredPlan} />;
    }
    switch (currentScreen) {
      case "general":
        return <SiteSettingsScreen composer={composer} onDirtyChange={handleScreenDirty} />;
      case "branding":
        return (
          <BrandingSection
            onOpenPalette={onOpenDesignTab}
            // Codex P0 #3 (post-Task-7 hardening): route through navigate() so
            // the dirty guard applies. navigate detects !isRoot and delegates to
            // navigateBetweenSections only when clean. When dirty, opens
            // ConfirmDialog with pendingNav=screenId.
            onJumpTo={(screenId) => navigate(screenId)}
          />
        );
      case "seo":
        return <SeoScreen composer={composer} onDirtyChange={handleScreenDirty} />;
      case "analytics":
        return <AnalyticsScreen composer={composer} onDirtyChange={handleScreenDirty} />;
      case "custom-code":
        return <AdvancedScreen composer={composer} onDirtyChange={handleScreenDirty} />;
      case "integrations":
        return <IntegrationsHub composer={composer} onDirtyChange={handleScreenDirty} />;
      // A1 day-3 complete: all 4 stubs drained (Redirects, Forms, Headers, Localization).
      // Redirects/Headers/Localization own server-side save — register handler so
      // the savebar's Save calls their write path instead of composer.saveProject().
      case "localization":
        return (
          <LocalizationScreen
            projectId={projectId}
            onDirtyChange={handleScreenDirty}
            registerSaveHandler={registerSaveHandler}
          />
        );
      case "redirects":
        return (
          <RedirectsScreen
            projectId={projectId}
            onDirtyChange={handleScreenDirty}
            registerSaveHandler={registerSaveHandler}
          />
        );
      case "headers":
        return (
          <HeadersScreen
            projectId={projectId}
            onDirtyChange={handleScreenDirty}
            registerSaveHandler={registerSaveHandler}
          />
        );
      case "forms":
        return <FormsScreen projectId={projectId} onDirtyChange={handleScreenDirty} />;
      default:
        return null;
    }
  };

  const renderRow = (n: NavDef) => {
    const active = currentScreen === n.id;
    const locked = isScreenLocked(n.id, userPlan);
    const Icon = n.icon;
    return (
      <Button
        key={n.id}
        type="button"
        onClick={(e) => {
          // Codex P0 #2: capture clicked row so navigateToRoot's transitionend
          // can restore focus when the user pops back.
          lastFocusedRowRef.current = e.currentTarget as HTMLButtonElement;
          navigate(n.id);
        }}
        className={`bd-set-snav-row${active ? " on" : ""}`}
        aria-current={active ? "page" : undefined}
      >
        <span className="bd-set-snav-icon">
          <Icon />
        </span>
        <span className="bd-set-snav-label">{n.title}</span>
        {locked ? <span className="bd-set-snav-badge">Pro</span> : null}
      </Button>
    );
  };

  // Workspace deep-links: open dashboard URL in new tab.
  // Only renders when projectId is known (siteId equivalent) for site-scoped links.
  const renderWorkspaceLink = (link: WorkspaceLink) => (
    <a
      key={link.id}
      href={buildWorkspaceUrl(link, projectId ?? null)}
      target="_blank"
      rel="noopener noreferrer"
      className="bd-set-snav-row bd-set-snav-row-external"
    >
      <span className="bd-set-snav-icon" aria-hidden>↗</span>
      <span className="bd-set-snav-label">{link.title}</span>
      <span className="bd-set-snav-arrow" aria-hidden>open</span>
    </a>
  );

  // Group rows by group id for rendering, preserving NAV array order within each group.
  const navByGroup: Record<NavGroupId, NavDef[]> = { site: [], distribution: [], plumbing: [] };
  NAV.forEach((n) => navByGroup[n.group].push(n));

  return (
    <TabFrame>
      <div className="bd-set-panel-h">
        <div className="bd-set-panel-h-ttl">
          <h2>{isRoot ? "Settings" : current.title}</h2>
          {!isRoot && current.subtitle ? (
            <span className="bd-set-panel-sub">{current.subtitle}</span>
          ) : null}
        </div>
        <div className="bd-set-panel-acts">
          {onHelpClick ? (
            <Button
              type="button"
              className="bd-set-icon-btn"
              onClick={onHelpClick}
              aria-label="Help"
              title="Help"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 17v-.5 M12 8a2 2 0 012 2c0 2-2 2-2 3.5" />
              </svg>
            </Button>
          ) : null}
          {onClose ? (
            <Button
              type="button"
              className="bd-set-icon-btn"
              onClick={onClose}
              aria-label="Close"
              title="Close"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4l16 16M20 4L4 20" />
              </svg>
            </Button>
          ) : null}
        </div>
      </div>
      <TabFrame.Body noScroll>
        <div
          className={`bd-set-stack${transitioning ? " transitioning" : ""}${prefersReducedMotion ? " no-motion" : ""}`}
          onTransitionEnd={handleStackTransitionEnd}
        >
          {/* Root screen — ALWAYS mounted (codex P2 #7 contract: aria-hidden flips, mount stays).
              inert + aria-hidden={!isRoot} means assistive tech ignores it AND focus cannot land
              inside it during the section animation. Codex P0 #2 focus contract relies on this. */}
          <div
            className={`bd-set-screen bd-set-screen--root${isRoot ? " on" : " off"}`}
            aria-hidden={!isRoot}
            inert={!isRoot}
          >
            <nav className="bd-set-snav" aria-label="Settings sections">
              <div className="bd-set-snav-list">
                {(Object.keys(navByGroup) as NavGroupId[]).map((groupId) => (
                  <React.Fragment key={groupId}>
                    <div className="bd-set-snav-group">{GROUP_LABELS[groupId]}</div>
                    {navByGroup[groupId].map(renderRow)}
                  </React.Fragment>
                ))}
                <div className="bd-set-snav-group">
                  WORKSPACE <span className="bd-set-snav-group-hint">opens dashboard ↗</span>
                </div>
                {WORKSPACE_LINKS.map(renderWorkspaceLink)}
                {onReplayTour ? (
                  <Button
                    type="button"
                    onClick={onReplayTour}
                    className="bd-set-snav-row bd-set-snav-row-sep"
                  >
                    <span className="bd-set-snav-icon">
                      <TourIcon />
                    </span>
                    <span className="bd-set-snav-label">Tour</span>
                  </Button>
                ) : null}
              </div>
            </nav>
          </div>
          {/* Section screen — mount-on-push, unmount-on-pop-transitionend.
              inert + aria-hidden={isRoot} during the pop animation prevents focus retention
              inside the departing subtree (codex P0 #2). */}
          {sectionMounted && (
            <div
              ref={sectionRef}
              className={`bd-set-screen bd-set-screen--section${isRoot ? " departing" : " entered"}`}
              aria-hidden={isRoot}
              inert={isRoot}
            >
              <DrillInHeader
                title={current.title}
                parentName="Settings"
                breadcrumb={[GROUP_LABELS[current.group], current.title]}
                focusTarget="breadcrumb-current"
                enableDocumentEscape={false}
                onBack={navigateToRoot}
                isDirty={screenIsDirty}
                onBackAttempt={() => setGuardOpen(true)}
                onHelpClick={onHelpClick}
                onClose={onClose}
              />
              <div className="bd-set-pane-body" key={resetKey}>
                {renderContent()}
              </div>
              <div
                className={`bd-set-savebar${screenIsDirty ? " on" : ""}`}
                role="region"
                aria-label="Unsaved changes"
                aria-hidden={!screenIsDirty}
              >
                <span className="bd-set-savebar-note">
                  <span>{dirtyCount} unsaved</span>
                </span>
                <div className="bd-set-savebar-actions">
                  <Button type="button" className="bd-set-btn sec" onClick={handleDiscard}>
                    Discard
                  </Button>
                  <Button type="button" className="bd-set-btn pri" onClick={handleSave}>
                    Save
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </TabFrame.Body>
      <ConfirmDialog
        isOpen={guardOpen}
        onClose={() => {
          pendingNavRef.current = null;
          setGuardOpen(false);
        }}
        onConfirm={() => {
          const next = pendingNavRef.current;
          // Codex P1 #6 pass-3 hardening: warn FIRST (with full state snapshot)
          // before any setters mutate the state we want to diagnose.
          //
          //   isRoot=false, next=null  → back-attempt while dirty → pop to root
          //   isRoot=false, next=id    → pending-nav while dirty (in-section) →
          //                              swap section content (no animation)
          //   isRoot=true,  next=null  → UNREACHABLE: root view has no dirty
          //                              state (section is unmounted; savebar
          //                              never shows). Guard openable only from
          //                              section-mounted view.
          //   isRoot=true,  next=id    → UNREACHABLE: navigate() opens dialog
          //                              when entering section while parent
          //                              still has stale dirty (impossible —
          //                              dirty resets on screen change).
          if (isRoot) {
            console.warn(
              "[settings-v2] ConfirmDialog onConfirm reached unreachable branch — pre-mutation state:",
              {
                isRoot,
                next,
                screenIsDirty: screenIsDirtyRef.current,
                guardOpen: true,
              },
            );
          }
          pendingNavRef.current = null;
          setGuardOpen(false);
          setScreenIsDirty(false);
          setDirtyCount(0);
          // Codex C1 fix: prime screenIsDirtyRef synchronously so navigateToRoot's
          // dirty-check (which reads the ref) sees the cleared value. Without
          // this, the ref-mirror useEffect hasn't flushed yet (we're still
          // inside the synchronous click handler), and navigateToRoot would
          // re-open the guard instead of popping to root.
          screenIsDirtyRef.current = false;
          if (!isRoot && next === null) {
            navigateToRoot();
            return;
          }
          if (!isRoot && next !== null) {
            navigateBetweenSections(next);
            return;
          }
          // Defensive — does NOT touch state past the mutations above. If we
          // ever land here, the branch is genuinely impossible AND stateful
          // operations have already been committed; log alone is sufficient.
          if (next !== null) navigate(next);
        }}
        title="Discard changes?"
        message="You have unsaved changes. Switching will discard them."
        confirmText="Discard"
        cancelText="Keep editing"
        variant="danger"
      />
    </TabFrame>
  );
};

export type { SettingsTabProps } from "./index";
export default SettingsTab;

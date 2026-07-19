"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Globe,
  FileText,
  Users,
  Settings,
  Zap,
  HelpCircle,
  Clock,
  CornerUpRight,
  Compass,
} from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { getEditorHref, useUnifiedEditorFlag } from "@/components/editor-route/unified-flag";
import { NAV_GROUPS } from "@/components/dashboard/shell/nav";

const RECENT_ITEMS_KEY = "buildrik_recent_items";
const MAX_RECENT = 5;

interface RecentItem {
  label: string;
  href: string;
  type: string;
}

interface ResultItem {
  id: string;
  label: string;
  description?: string;
  href: string;
  scope: string;
}

const SETTINGS_ITEMS: ResultItem[] = [
  { id: "s-workspace", label: "Workspace", description: "Workspace settings & branding", href: "/dashboard/settings", scope: "settings" },
  { id: "s-team", label: "Team", description: "Members & invites", href: "/dashboard/settings/team", scope: "settings" },
  { id: "s-domains", label: "Domains", description: "Custom domains", href: "/dashboard/settings/domains", scope: "settings" },
  { id: "s-integrations", label: "Integrations", description: "Connected services", href: "/dashboard/settings/integrations", scope: "settings" },
  { id: "s-ai", label: "AI & Credits", description: "AI usage and credits", href: "/dashboard/settings/ai", scope: "settings" },
  { id: "s-tokens", label: "API Tokens", description: "Tokens for scripting & CI", href: "/dashboard/settings/api-tokens", scope: "settings" },
  { id: "s-plans", label: "Plans", description: "Plan & upgrades", href: "/dashboard/settings/plans", scope: "settings" },
  { id: "s-billing", label: "Billing", description: "Invoices & payment", href: "/dashboard/settings/billing", scope: "settings" },
  { id: "s-usage", label: "Usage", description: "Limits & quotas", href: "/dashboard/settings/usage", scope: "settings" },
  { id: "s-profile", label: "Profile", description: "Edit your profile", href: "/dashboard/settings/profile", scope: "settings" },
  { id: "s-account", label: "Account", description: "Account preferences", href: "/dashboard/settings/account", scope: "settings" },
  { id: "s-security", label: "Security", description: "Password & 2FA", href: "/dashboard/settings/security", scope: "settings" },
  { id: "s-notifications", label: "Notifications", description: "Notification preferences", href: "/dashboard/settings/notifications", scope: "settings" },
  { id: "s-danger", label: "Danger Zone", description: "Delete workspace or account", href: "/dashboard/settings/danger", scope: "settings" },
];

const ACTION_ITEMS: ResultItem[] = [
  { id: "a-create-site", label: "Create Site", description: "Start a new site", href: "/dashboard/sites/new", scope: "actions" },
  { id: "a-invite", label: "Invite Member", description: "Add a team member", href: "/dashboard/settings/team?invite=true", scope: "actions" },
  { id: "a-ai", label: "Generate with AI", description: "AI-powered generation", href: "/dashboard/sites/new?ai=true", scope: "actions" },
  { id: "a-domain", label: "Connect Domain", description: "Link a custom domain", href: "/dashboard/settings/domains", scope: "actions" },
];

// "Where did X go": IA v2 (19 nav items → 6+2) relocated these concepts.
// Searching an old name resolves to its destination so nobody has to relearn
// the map. `aliases` are the old/searched terms; `label` is the new home,
// `description` says where it moved.
interface MovedItem extends ResultItem {
  aliases: string[];
  /** agency-layer-only destination — hidden in solo workspaces */
  agencyOnly?: boolean;
}
const MOVED_ITEMS: MovedItem[] = [
  { id: "m-sites", label: "Sites", description: "Moved → Projects", href: "/dashboard/projects", scope: "moved", aliases: ["sites", "my sites", "websites", "all projects"] },
  { id: "m-apps", label: "Apps", description: "Moved → Marketplace", href: "/dashboard/marketplace", scope: "moved", aliases: ["apps", "applications", "integrations marketplace"] },
  { id: "m-libraries", label: "Libraries & Templates", description: "Moved → Templates", href: "/dashboard/templates", scope: "moved", aliases: ["libraries", "library", "templates"] },
  { id: "m-clients", label: "Clients", description: "Moved → Agency › Clients", href: "/dashboard/agency", scope: "moved", aliases: ["clients", "client management"], agencyOnly: true },
  { id: "m-reviews", label: "Reviews", description: "Moved → Agency › Reviews", href: "/dashboard/agency/reviews", scope: "moved", aliases: ["reviews", "approval", "approve", "publishing"], agencyOnly: true },
  { id: "m-comments", label: "Comments", description: "Moved → Agency › Reviews", href: "/dashboard/agency/reviews", scope: "moved", aliases: ["comments", "review comments"], agencyOnly: true },
  { id: "m-shared-theme", label: "Shared theme", description: "Moved → Agency › Shared theme", href: "/dashboard/agency/theme", scope: "moved", aliases: ["shared theme", "design system", "theme", "tokens", "ds"], agencyOnly: true },
  { id: "m-partner", label: "Partner program", description: "Moved → Agency › Partner", href: "/dashboard/agency/partner", scope: "moved", aliases: ["partner", "partner program", "referral"], agencyOnly: true },
  { id: "m-team", label: "Team", description: "Moved → Settings › Team", href: "/dashboard/settings/team", scope: "moved", aliases: ["team", "members", "invite"] },
  { id: "m-plans", label: "Plans", description: "Moved → Settings › Plans", href: "/dashboard/settings/plans", scope: "moved", aliases: ["plans", "pricing", "upgrade"] },
  { id: "m-billing", label: "Billing", description: "Moved → Settings › Billing", href: "/dashboard/settings/billing", scope: "moved", aliases: ["billing", "invoices", "payment"] },
  { id: "m-usage", label: "Usage", description: "Moved → Settings › Usage", href: "/dashboard/settings/usage", scope: "moved", aliases: ["usage", "limits", "quota"] },
  { id: "m-domains", label: "Domains", description: "Moved → Settings › Domains", href: "/dashboard/settings/domains", scope: "moved", aliases: ["domains", "dns", "custom domain"] },
  { id: "m-traffic", label: "Traffic", description: "Moved → Site › Analytics", href: "/dashboard/projects", scope: "moved", aliases: ["traffic", "analytics", "visitors", "stats"] },
  { id: "m-redirects", label: "Redirects", description: "Moved → Site › Redirects", href: "/dashboard/projects", scope: "moved", aliases: ["redirects", "url forwarding", "301", "302"] },
  { id: "m-assets", label: "Assets", description: "Moved → Media", href: "/dashboard/media", scope: "moved", aliases: ["assets", "images", "files", "uploads"] },
  { id: "m-tokens", label: "API tokens", description: "Moved → Settings › API Tokens", href: "/dashboard/settings/api-tokens", scope: "moved", aliases: ["api tokens", "ci", "api key"] },
];

const SCOPE_ICONS: Record<string, typeof Globe> = {
  sites: Globe,
  pages: FileText,
  team: Users,
  settings: Settings,
  actions: Zap,
  help: HelpCircle,
  recent: Clock,
  moved: CornerUpRight,
  navigate: Compass,
};

// Primary nav destinations. Sidebar entries DERIVE from NAV_GROUPS (the SSOT) so
// nav drift is structurally impossible; only the topbar's own destinations
// (Marketplace/Learn/Resources) are hand-written here.
const NAV_ITEMS: Array<ResultItem & { agencyOnly?: boolean }> = [
  ...NAV_GROUPS.flatMap((g) => g.items).map((it) => ({
    id: `nav-${it.href === "/dashboard" ? "home" : it.href.slice("/dashboard/".length)}`,
    label: it.label,
    href: it.href,
    scope: "navigate",
    agencyOnly: it.agencyOnly,
  })),
  { id: "nav-marketplace", label: "Marketplace", description: "Apps & integrations", href: "/dashboard/marketplace", scope: "navigate" },
  { id: "nav-learn", label: "Learn", description: "Academy", href: "/dashboard/learn", scope: "navigate" },
  { id: "nav-resources", label: "Resources", description: "Docs & guides", href: "/dashboard/resources", scope: "navigate" },
];

export const SEARCH_SCOPES = [
  { key: "sites", label: "Sites" },
  { key: "pages", label: "Pages" },
  { key: "team", label: "Team" },
  { key: "settings", label: "Settings" },
  { key: "actions", label: "Actions" },
  { key: "help", label: "Help" },
];

// Every static destination the palette can navigate to (nav + settings + actions
// + moved aliases). The IA v2 contract test (E2) asserts each one resolves
// against the live route table — no entry may point at a deleted route.
export const PALETTE_HREFS: string[] = [
  ...NAV_ITEMS,
  ...SETTINGS_ITEMS,
  ...ACTION_ITEMS,
  ...MOVED_ITEMS,
].map((i) => i.href);

function getRecentItems(): RecentItem[] {
  try {
    const raw = localStorage.getItem(RECENT_ITEMS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentItem[];
  } catch {
    return [];
  }
}

function saveRecentItem(item: RecentItem) {
  const items = getRecentItems().filter((i) => i.href !== item.href);
  items.unshift(item);
  localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(items.slice(0, MAX_RECENT)));
}

function parseScope(query: string): { scope: string | null; term: string } {
  for (const s of SEARCH_SCOPES) {
    const prefix = `${s.label}: `;
    if (query.startsWith(prefix)) {
      return { scope: s.key, term: query.slice(prefix.length).trim() };
    }
  }
  return { scope: null, term: query.trim() };
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const unified = useUnifiedEditorFlag();
  const features = trpc.features.list.useQuery(undefined, { staleTime: 60_000 });
  const agency = !!features.data?.agency_layer;
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { scope, term } = useMemo(() => parseScope(debouncedQuery), [debouncedQuery]);
  const isSearching = term.length >= 2;

  useEffect(() => {
    if (open) {
      setQuery("");
      setDebouncedQuery("");
      setSelectedIndex(0);
      setRecentItems(getRecentItems());
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // tRPC queries - only fire when searching and scope matches
  const shouldSearchSites = isSearching && (scope === null || scope === "sites");
  const shouldSearchTeam = isSearching && (scope === null || scope === "team");
  const shouldSearchHelp = isSearching && (scope === null || scope === "help");

  const sitesQuery = trpc.sites.list.useQuery(
    { search: term, perPage: 5, page: 1 },
    { enabled: shouldSearchSites },
  );

  const teamQuery = trpc.team.list.useQuery(
    { page: 1, perPage: 10 },
    { enabled: shouldSearchTeam },
  );

  const helpQuery = trpc.help.search.useQuery(
    { query: term },
    { enabled: shouldSearchHelp },
  );

  // Build flat result list grouped by scope
  const groupedResults = useMemo(() => {
    const groups: { scope: string; label: string; items: ResultItem[] }[] = [];

    if (!isSearching) {
      // Show recent items when not searching
      if (recentItems.length > 0) {
        groups.push({
          scope: "recent",
          label: "Recent",
          items: recentItems.map((r, i) => ({
            id: `recent-${i}`,
            label: r.label,
            href: r.href,
            scope: "recent",
            description: r.type,
          })),
        });
      }
      return groups;
    }

    const lowerTerm = term.toLowerCase();

    // Sites
    if (shouldSearchSites && sitesQuery.data) {
      const sites = sitesQuery.data.data;
      if (sites.length > 0) {
        groups.push({
          scope: "sites",
          label: "Sites",
          items: sites.map((s) => ({
            id: `site-${s.id}`,
            label: s.name,
            description: s.slug,
            href: `/dashboard/sites/${s.id}`,
            scope: "sites",
          })),
        });
      }
    }

    // Pages — since pages.list requires a siteId, we navigate to site editors
    if ((scope === "pages" || scope === null) && shouldSearchSites && sitesQuery.data) {
      const sites = sitesQuery.data.data;
      if (sites.length > 0 && scope === "pages") {
        groups.push({
          scope: "pages",
          label: "Pages",
          items: sites.map((s) => ({
            id: `page-${s.id}`,
            label: `${s.name} — Pages`,
            description: "Open in editor",
            href: getEditorHref(s.id, unified),
            scope: "pages",
          })),
        });
      }
    }

    // Team
    if (shouldSearchTeam && teamQuery.data) {
      const members = teamQuery.data.data;
      const filtered = members.filter(
        (m) =>
          m.fullName.toLowerCase().includes(lowerTerm) ||
          m.email.toLowerCase().includes(lowerTerm),
      );
      if (filtered.length > 0) {
        groups.push({
          scope: "team",
          label: "Team",
          items: filtered.slice(0, 5).map((m) => ({
            id: `team-${m.id}`,
            label: m.fullName || m.email,
            description: m.role,
            href: "/dashboard/team",
            scope: "team",
          })),
        });
      }
    }

    // Settings (static, client-filtered)
    if (scope === null || scope === "settings") {
      const filtered = SETTINGS_ITEMS.filter(
        (item) =>
          item.label.toLowerCase().includes(lowerTerm) ||
          item.description?.toLowerCase().includes(lowerTerm),
      );
      if (filtered.length > 0) {
        groups.push({ scope: "settings", label: "Settings", items: filtered });
      }
    }

    // Moved — "where did X go" aliases resolve old names to their new homes.
    if (scope === null) {
      const moved = MOVED_ITEMS.filter(
        (item) =>
          (!item.agencyOnly || agency) &&
          (item.label.toLowerCase().includes(lowerTerm) ||
            item.aliases.some((a) => a.includes(lowerTerm) || lowerTerm.includes(a))),
      );
      if (moved.length > 0) {
        groups.push({ scope: "moved", label: "Moved", items: moved });
      }
    }

    // Go to — primary nav destinations reflecting the two-level IA.
    if (scope === null) {
      const nav = NAV_ITEMS.filter((item) => (!item.agencyOnly || agency) && item.label.toLowerCase().includes(lowerTerm));
      if (nav.length > 0) groups.push({ scope: "navigate", label: "Go to", items: nav });
    }

    // Actions (static, client-filtered)
    if (scope === null || scope === "actions") {
      const filtered = ACTION_ITEMS.filter(
        (item) =>
          item.label.toLowerCase().includes(lowerTerm) ||
          item.description?.toLowerCase().includes(lowerTerm),
      );
      if (filtered.length > 0) {
        groups.push({ scope: "actions", label: "Actions", items: filtered });
      }
    }

    // Help
    if (shouldSearchHelp && helpQuery.data) {
      const articles = helpQuery.data;
      if (articles.length > 0) {
        groups.push({
          scope: "help",
          label: "Help",
          items: articles.slice(0, 5).map((a) => ({
            id: `help-${a.slug}`,
            label: a.title,
            description: a.excerpt ?? undefined,
            href: `/dashboard/help/${a.slug}`,
            scope: "help",
          })),
        });
      }
    }

    return groups;
  }, [isSearching, term, scope, recentItems, shouldSearchSites, shouldSearchTeam, shouldSearchHelp, sitesQuery.data, teamQuery.data, helpQuery.data, unified, agency]);

  const flatItems = useMemo(
    () => groupedResults.flatMap((g) => g.items),
    [groupedResults],
  );

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const selectItem = useCallback(
    (item: ResultItem) => {
      saveRecentItem({ label: item.label, href: item.href, type: item.scope });
      if (/^https?:\/\//i.test(item.href)) window.location.href = item.href;
      else router.push(item.href);
      onClose();
    },
    [router, onClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % Math.max(flatItems.length, 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + flatItems.length) % Math.max(flatItems.length, 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = flatItems[selectedIndex];
        if (item) selectItem(item);
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [flatItems, selectedIndex, onClose, selectItem],
  );

  if (!open) return null;

  let itemCounter = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0" style={{ backgroundColor: "rgba(18, 22, 32, 0.45)" }} onClick={onClose} />
      <div
        className="relative w-full overflow-hidden rounded-xl border bg-white shadow-2xl"
        style={{ maxWidth: 640, maxHeight: 480, borderColor: "var(--color-border-default)" }}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 border-b px-4"
          style={{ borderColor: "var(--color-border-default)" }}
        >
          <Search className="h-4 w-4 shrink-0" style={{ color: "var(--color-text-secondary)" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search or jump to..."
            aria-label="Search Buildrick"
            className="flex-1 border-0 bg-transparent py-3 text-sm outline-none"
            style={{ color: "var(--color-text-primary)" }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ color: "var(--color-text-secondary)" }}>
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">
          {isSearching && flatItems.length === 0 ? (
            <p
              className="px-4 py-8 text-center text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              No results for &ldquo;{term}&rdquo;
            </p>
          ) : (
            groupedResults.map((group) => {
              const ScopeIcon = SCOPE_ICONS[group.scope] ?? Search;
              return (
                <div key={group.scope}>
                  <p
                    className="px-4 py-1.5 text-xs font-medium uppercase tracking-wide"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {group.label}
                  </p>
                  {group.items.map((item) => {
                    const idx = itemCounter++;
                    return (
                      <button
                        key={item.id}
                        data-index={idx}
                        onClick={() => selectItem(item)}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors"
                        style={{
                          color: "var(--color-text-primary)",
                          backgroundColor:
                            selectedIndex === idx ? "var(--color-bg-subtle)" : "transparent",
                        }}
                      >
                        <ScopeIcon
                          className="h-4 w-4 shrink-0"
                          style={{ color: "var(--color-text-secondary)" }}
                        />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.description && (
                          <span
                            className="truncate text-xs"
                            style={{ color: "var(--color-text-secondary)" }}
                          >
                            {item.description}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Scope shortcuts */}
        <div
          className="flex items-center gap-4 border-t px-4 py-2"
          style={{ borderColor: "var(--color-border-default)" }}
        >
          {SEARCH_SCOPES.map((s) => (
            <button
              key={s.key}
              className="text-xs transition-colors hover:underline"
              style={{ color: "var(--color-text-secondary)" }}
              onClick={() => {
                setQuery(`${s.label}: `);
                inputRef.current?.focus();
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

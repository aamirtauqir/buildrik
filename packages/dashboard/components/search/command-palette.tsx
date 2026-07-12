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
  { id: "s-profile", label: "Profile", description: "Edit your profile", href: "/dashboard/settings", scope: "settings" },
  { id: "s-account", label: "Account", description: "Account preferences", href: "/dashboard/settings/account", scope: "settings" },
  { id: "s-security", label: "Security", description: "Password & 2FA", href: "/dashboard/settings/security", scope: "settings" },
  { id: "s-notifications", label: "Notifications", description: "Notification preferences", href: "/dashboard/settings/notifications", scope: "settings" },
  { id: "s-workspace", label: "Workspace", description: "Workspace settings", href: "/dashboard/settings/workspace", scope: "settings" },
  { id: "s-integrations", label: "Integrations", description: "Connected services", href: "/dashboard/settings/integrations", scope: "settings" },
  { id: "s-ai", label: "AI & Credits", description: "AI usage and credits", href: "/dashboard/settings/ai", scope: "settings" },
  { id: "s-tokens", label: "API Tokens", description: "Tokens for scripting & CI", href: "/dashboard/settings/api-tokens", scope: "settings" },
  { id: "s-danger", label: "Danger Zone", description: "Delete workspace", href: "/dashboard/settings/danger", scope: "settings" },
];

const ACTION_ITEMS: ResultItem[] = [
  { id: "a-create-site", label: "Create Site", description: "Start a new site", href: "/dashboard/sites/new", scope: "actions" },
  { id: "a-invite", label: "Invite Member", description: "Add a team member", href: "/dashboard/team?invite=true", scope: "actions" },
  { id: "a-ai", label: "Generate with AI", description: "AI-powered generation", href: "/dashboard/sites/new?ai=true", scope: "actions" },
  { id: "a-domain", label: "Connect Domain", description: "Link a custom domain", href: "/dashboard/domains", scope: "actions" },
];

// 71-command-palette "where did X go": the reconciled IA moved several concepts
// to new homes. Searching an old name resolves to its destination so nobody has
// to relearn the map. `aliases` are the old/searched terms; `label` is the
// new home, `description` says where it moved.
interface MovedItem extends ResultItem {
  aliases: string[];
  /** agency-layer-only destination — hidden in solo workspaces */
  agencyOnly?: boolean;
}
const MOVED_ITEMS: MovedItem[] = [
  { id: "m-traffic", label: "Traffic", description: "Moved → Site › Analytics", href: "/dashboard/sites", scope: "moved", aliases: ["traffic", "analytics", "visitors", "stats"] },
  { id: "m-shared-theme", label: "Shared theme", description: "Moved → Workspace › Shared theme", href: "/dashboard/theme", scope: "moved", aliases: ["shared theme", "design system", "theme", "tokens", "ds"], agencyOnly: true },
  { id: "m-assets", label: "Assets", description: "Moved → Media", href: "/dashboard/media", scope: "moved", aliases: ["assets", "media", "images", "files", "uploads"] },
  { id: "m-redirects", label: "Redirects", description: "Moved → Site › Redirects", href: "/dashboard/sites", scope: "moved", aliases: ["redirects", "url forwarding", "301", "302"] },
  { id: "m-domains", label: "Domains", description: "Moved → Domains (all sites)", href: "/dashboard/domains", scope: "moved", aliases: ["domains", "dns", "custom domain"] },
  { id: "m-tokens", label: "API tokens", description: "Moved → Settings › API Tokens", href: "/dashboard/settings/api-tokens", scope: "moved", aliases: ["api tokens", "tokens", "ci", "api key"] },
  { id: "m-reviews", label: "Reviews", description: "Approve client edits", href: "/dashboard/reviews", scope: "moved", aliases: ["reviews", "approval", "approve", "publishing"], agencyOnly: true },
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

// Primary nav destinations — the reconciled two-level IA (top nav + sidebar).
// Agency destinations are hidden in solo workspaces.
const NAV_ITEMS: Array<ResultItem & { agencyOnly?: boolean }> = [
  { id: "nav-dashboard", label: "Dashboard", description: "Home", href: "/dashboard", scope: "navigate" },
  { id: "nav-marketplace", label: "Marketplace", description: "Apps & integrations", href: "/dashboard/marketplace", scope: "navigate" },
  { id: "nav-learn", label: "Learn", description: "Academy", href: "/dashboard/learn", scope: "navigate" },
  { id: "nav-resources", label: "Resources", description: "Docs & guides", href: "/dashboard/resources", scope: "navigate" },
  { id: "nav-projects", label: "All projects", href: "/dashboard/projects", scope: "navigate" },
  { id: "nav-sites", label: "My Sites", href: "/dashboard/sites", scope: "navigate" },
  { id: "nav-media", label: "Media", href: "/dashboard/media", scope: "navigate" },
  { id: "nav-getting-started", label: "Getting started", href: "/dashboard/getting-started", scope: "navigate" },
  { id: "nav-apps", label: "Apps", href: "/dashboard/apps", scope: "navigate" },
  { id: "nav-libraries", label: "Libraries & Templates", href: "/dashboard/libraries", scope: "navigate" },
  { id: "nav-clients", label: "Clients", href: "/dashboard/clients", scope: "navigate", agencyOnly: true },
  { id: "nav-reviews", label: "Reviews", href: "/dashboard/reviews", scope: "navigate", agencyOnly: true },
  { id: "nav-comments", label: "Comments", href: "/dashboard/comments", scope: "navigate", agencyOnly: true },
  { id: "nav-theme", label: "Shared theme", href: "/dashboard/theme", scope: "navigate", agencyOnly: true },
  { id: "nav-partner", label: "Partner program", href: "/dashboard/partner", scope: "navigate", agencyOnly: true },
  { id: "nav-team", label: "Team", href: "/dashboard/team", scope: "navigate" },
  { id: "nav-billing", label: "Billing", href: "/dashboard/billing", scope: "navigate" },
  { id: "nav-plans", label: "Plans", href: "/dashboard/plans", scope: "navigate" },
  { id: "nav-usage", label: "Usage", href: "/dashboard/usage", scope: "navigate" },
  { id: "nav-domains", label: "Domains", href: "/dashboard/domains", scope: "navigate" },
  { id: "nav-settings", label: "Settings", href: "/dashboard/settings", scope: "navigate" },
  { id: "nav-help", label: "Help", href: "/dashboard/help", scope: "navigate" },
];

export const SEARCH_SCOPES = [
  { key: "sites", label: "Sites" },
  { key: "pages", label: "Pages" },
  { key: "team", label: "Team" },
  { key: "settings", label: "Settings" },
  { key: "actions", label: "Actions" },
  { key: "help", label: "Help" },
];

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
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
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

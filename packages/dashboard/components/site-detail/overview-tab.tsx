"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Eye,
  Calendar,
  Users,
  MessageSquare,
  Heart,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  ArrowLeft,
  Shield,
  Image,
  Search,
  FileCheck,
} from "lucide-react";
import { StatCard, SectionCard, MetricValue, Pill } from "@/components/dashboard/primitives";

export const HEALTH_METRICS = [
  { label: "SEO", key: "seo" as const, icon: Search, tab: "settings" },
  { label: "Content Fill", key: "content" as const, icon: FileCheck, tab: "settings" },
  { label: "SSL", key: "ssl" as const, icon: Shield, tab: "domains" },
  { label: "Favicon", key: "favicon" as const, icon: Image, tab: "settings" },
];

interface HealthBreakdown {
  seo: number;
  content: number;
  ssl: number;
  favicon: number;
}

interface OverviewStats {
  totalPages: number;
  monthlyVisitors: number;
  visitorsChange: number;
  teamMembers: number;
  formSubmissions: number;
  unreadSubmissions: number;
  healthScore: number;
  healthBreakdown: HealthBreakdown;
}

interface ActivityEntry {
  id: string;
  action: string;
  description: string | null;
  createdAt: Date;
}

interface FormBlock {
  id: string;
  name: string;
  _count: { submissions: number };
}

interface OverviewTabProps {
  siteId: string;
  stats: OverviewStats;
  activity: ActivityEntry[];
  lastPublishedAt: Date | null;
  lastPublishedBy?: string | null;
  formBlocks: FormBlock[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function OverviewTab({
  siteId,
  stats,
  activity,
  lastPublishedAt,
  lastPublishedBy,
  formBlocks,
  isLoading,
  isError,
  onRetry,
}: OverviewTabProps) {
  const [healthExpanded, setHealthExpanded] = useState(false);
  const [expandedFormId, setExpandedFormId] = useState<string | null>(null);

  if (isLoading) return <OverviewSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-white py-16" style={{ borderColor: "var(--color-border-default)" }}>
        <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Failed to load site details</p>
        <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>Something went wrong. Please try again.</p>
        <div className="mt-4 flex items-center gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          )}
          <Link
            href="/dashboard/sites"
            className="flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-medium"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Sites
          </Link>
        </div>
      </div>
    );
  }

  const healthColor = stats.healthScore > 70 ? "var(--color-success)" : stats.healthScore > 40 ? "var(--color-warning)" : "var(--color-primary)";

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="Total Pages"
          value={<MetricValue>{stats.totalPages}</MetricValue>}
          delta={stats.totalPages > 0 ? `${stats.totalPages} page${stats.totalPages === 1 ? "" : "s"} total` : undefined}
        />
        <StatCard
          icon={<Eye className="h-5 w-5" />}
          label="Monthly Visitors"
          value={<MetricValue>{formatNumber(stats.monthlyVisitors)}</MetricValue>}
          delta={
            <span style={{ color: stats.visitorsChange >= 0 ? "var(--color-success)" : "var(--color-primary)" }}>
              {stats.visitorsChange >= 0 ? "\u2191" : "\u2193"} <MetricValue>{Math.abs(stats.visitorsChange)}%</MetricValue>
            </span>
          }
        />
        <StatCard
          icon={<Calendar className="h-5 w-5" />}
          label="Last Published"
          value={<MetricValue>{lastPublishedAt ? timeAgo(lastPublishedAt) : "Never"}</MetricValue>}
          delta={lastPublishedBy ? `by ${lastPublishedBy}` : undefined}
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Team Members"
          value={<MetricValue>{stats.teamMembers}</MetricValue>}
          href={`/dashboard/sites/${siteId}/settings`}
          delta={"Manage \u2192"}
        />
        <StatCard
          icon={<MessageSquare className="h-5 w-5" />}
          label="Form Submissions"
          mono={false}
          value={<><MetricValue>{stats.formSubmissions}</MetricValue> this month</>}
          delta={stats.unreadSubmissions > 0 ? <Pill tone="accent"><MetricValue>{stats.unreadSubmissions}</MetricValue> unread</Pill> : undefined}
        />
        <StatCard
          icon={<Heart className="h-5 w-5" />}
          label="Site Health"
          value={<span style={{ color: healthColor }}><MetricValue>{stats.healthScore}</MetricValue>/100</span>}
        />
      </div>

      {/* Health Score Expandable Panel */}
      <SectionCard padding="none">
        <button
          onClick={() => setHealthExpanded(!healthExpanded)}
          className="flex w-full items-center justify-between p-5"
        >
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Health Score</h3>
            <span className="text-sm font-bold" style={{ color: healthColor }}>{stats.healthScore}/100</span>
          </div>
          {healthExpanded ? (
            <ChevronDown className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} />
          ) : (
            <ChevronRight className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} />
          )}
        </button>

        {/* Composite bar (always visible) */}
        <div className="px-5 pb-4">
          <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${stats.healthScore}%`, backgroundColor: healthColor }}
            />
          </div>
        </div>

        {healthExpanded && (
          <div className="border-t px-5 pb-5 pt-4" style={{ borderColor: "var(--color-bg-subtle)" }}>
            <div className="grid grid-cols-2 gap-4">
              {HEALTH_METRICS.map((m) => {
                const score = stats.healthBreakdown[m.key];
                const barColor = score > 70 ? "var(--color-success)" : score > 40 ? "var(--color-warning)" : "var(--color-primary)";
                const Icon = m.icon;
                return (
                  <Link
                    key={m.key}
                    href={`/dashboard/sites/${siteId}/${m.tab}`}
                    className="group rounded-lg border p-3 transition-colors hover:border-[var(--color-primary)]/30"
                    style={{ borderColor: "var(--color-border-default)" }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} />
                        <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>{m.label}</p>
                      </div>
                      <span className="text-xs font-bold" style={{ color: barColor }}>{score}%</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${score}%`, backgroundColor: barColor }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </SectionCard>

      {/* Form Submissions Section */}
      {formBlocks.length > 0 && (
        <SectionCard
          title="Form Blocks"
          actions={
            <Link
              href={`/dashboard/sites/${siteId}/feedback`}
              className="text-xs font-medium"
              style={{ color: "var(--color-primary)" }}
            >
              View all submissions →
            </Link>
          }
        >
          <div className="space-y-2">
            {formBlocks.map((fb) => (
              <div key={fb.id} className="rounded-lg border" style={{ borderColor: "var(--color-bg-subtle)" }}>
                <button
                  onClick={() => setExpandedFormId(expandedFormId === fb.id ? null : fb.id)}
                  className="flex w-full items-center justify-between p-3"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} />
                    <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{fb.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      <MetricValue>{fb._count.submissions}</MetricValue> submission{fb._count.submissions === 1 ? "" : "s"}
                    </span>
                    {expandedFormId === fb.id ? (
                      <ChevronDown className="h-3.5 w-3.5" style={{ color: "var(--color-text-secondary)" }} />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" style={{ color: "var(--color-text-secondary)" }} />
                    )}
                  </div>
                </button>
                {expandedFormId === fb.id && (
                  <div className="border-t px-3 py-2" style={{ borderColor: "var(--color-bg-subtle)" }}>
                    {fb._count.submissions === 0 ? (
                      <p className="py-2 text-xs" style={{ color: "var(--color-text-muted)" }}>No submissions yet.</p>
                    ) : (
                      <p className="py-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        <MetricValue>{fb._count.submissions}</MetricValue> total submission{fb._count.submissions === 1 ? "" : "s"}.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Recent Activity */}
      <SectionCard title="Recent Activity">
        {activity.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No activity yet. Start editing to see updates here.</p>
        ) : (
          <div className="space-y-3">
            {activity.map((a) => (
              <div key={a.id} className="flex items-start gap-2">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
                <div>
                  <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>{a.description ?? a.action}</p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}><MetricValue>{timeAgo(a.createdAt)}</MetricValue></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl border bg-white p-4" style={{ borderColor: "var(--color-border-default)" }}>
            <div className="h-3 w-20 animate-pulse rounded" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
            <div className="mt-3 h-6 w-16 animate-pulse rounded" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
            <div className="mt-2 h-3 w-24 animate-pulse rounded" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-white p-5" style={{ borderColor: "var(--color-border-default)" }}>
        <div className="h-4 w-32 animate-pulse rounded" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
        <div className="mt-3 h-2 w-full animate-pulse rounded-full" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
      </div>
      <div className="rounded-xl border bg-white p-5" style={{ borderColor: "var(--color-border-default)" }}>
        <div className="h-4 w-28 animate-pulse rounded" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="mt-1 h-2 w-2 shrink-0 animate-pulse rounded-full" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
              <div className="flex-1">
                <div className="h-3 w-3/4 animate-pulse rounded" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
                <div className="mt-1 h-2.5 w-16 animate-pulse rounded" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

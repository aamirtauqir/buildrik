"use client";

import { useState, useCallback } from "react";
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
  ChevronLeft,
  RefreshCw,
  ArrowLeft,
  Shield,
  Image,
  Search,
  FileCheck,
  Download,
} from "lucide-react";
import { trpc } from "@lib/trpc/client";
import {
  SubmissionDrawer,
  type FormSubmissionData,
} from "@/components/site-detail/submission-drawer";

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
  const [submissionsPage, setSubmissionsPage] = useState(1);
  const [filterFormBlockId, setFilterFormBlockId] = useState<string | undefined>(undefined);
  const [drawerSubmission, setDrawerSubmission] = useState<FormSubmissionData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const submissionsQuery = trpc.forms.listSubmissions.useQuery(
    { siteId, formBlockId: filterFormBlockId, page: submissionsPage, perPage: 20 },
    { enabled: formBlocks.length > 0 },
  );

  const utils = trpc.useUtils();

  const updateMutation = trpc.forms.updateSubmission.useMutation({
    onSuccess: () => {
      utils.forms.listSubmissions.invalidate();
    },
  });

  const deleteMutation = trpc.forms.deleteSubmission.useMutation({
    onSuccess: () => {
      utils.forms.listSubmissions.invalidate();
      setDrawerOpen(false);
      setDrawerSubmission(null);
    },
  });

  const handleDrawerUpdate = useCallback(
    (id: string, data: Partial<{ isRead: boolean; isSpam: boolean; isArchived: boolean }>) => {
      updateMutation.mutate({ id, ...data });
      if (drawerSubmission && drawerSubmission.id === id) {
        setDrawerSubmission({ ...drawerSubmission, ...data });
      }
    },
    [updateMutation, drawerSubmission],
  );

  const handleDrawerDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate({ id });
    },
    [deleteMutation],
  );

  const handleOpenDrawer = useCallback((sub: FormSubmissionData) => {
    setDrawerSubmission(sub);
    setDrawerOpen(true);
    if (!sub.isRead) {
      updateMutation.mutate({ id: sub.id, isRead: true });
    }
  }, [updateMutation]);

  const handleExportCsv = useCallback(() => {
    const submissions = submissionsQuery.data?.data;
    if (!submissions || submissions.length === 0) return;

    const allKeys = Array.from(
      new Set(submissions.flatMap((s) => Object.keys(s.data as Record<string, string>))),
    );
    const headers = ["ID", "Submitted", "Form", ...allKeys, "Read", "Spam", "Archived"];
    const rows = submissions.map((s) => {
      const data = s.data as Record<string, string>;
      const formName = (s as FormSubmissionData).formBlock?.name ?? "";
      return [
        s.id,
        new Date(s.createdAt).toISOString(),
        formName,
        ...allKeys.map((k) => data[k] ?? ""),
        String(s.isRead),
        String(s.isSpam),
        String(s.isArchived),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `submissions-${siteId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [submissionsQuery.data, siteId]);

  if (isLoading) return <OverviewSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-white py-16" style={{ borderColor: "#E8E8E8" }}>
        <p className="text-sm font-medium" style={{ color: "#0D0D0D" }}>Failed to load site details</p>
        <p className="mt-1 text-xs" style={{ color: "#7A7A7A" }}>Something went wrong. Please try again.</p>
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
            style={{ borderColor: "#E8E8E8", color: "#7A7A7A" }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Sites
          </Link>
        </div>
      </div>
    );
  }

  const healthColor = stats.healthScore > 70 ? "#22C55E" : stats.healthScore > 40 ? "#EA580C" : "var(--color-primary)";

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatBox
          icon={<FileText className="h-5 w-5" />}
          label="Total Pages"
          value={String(stats.totalPages)}
          subtitle={stats.totalPages > 0 ? `${stats.totalPages} page${stats.totalPages === 1 ? "" : "s"} total` : undefined}
        />
        <StatBox
          icon={<Eye className="h-5 w-5" />}
          label="Monthly Visitors"
          value={formatNumber(stats.monthlyVisitors)}
          trend={stats.visitorsChange}
        />
        <StatBox
          icon={<Calendar className="h-5 w-5" />}
          label="Last Published"
          value={lastPublishedAt ? timeAgo(lastPublishedAt) : "Never"}
          subtitle={lastPublishedBy ? `by ${lastPublishedBy}` : undefined}
        />
        <StatBox
          icon={<Users className="h-5 w-5" />}
          label="Team Members"
          value={String(stats.teamMembers)}
          link={{ label: "Manage \u2192", href: `/dashboard/sites/${siteId}/settings` }}
        />
        <StatBox
          icon={<MessageSquare className="h-5 w-5" />}
          label="Form Submissions"
          value={`${stats.formSubmissions} this month`}
          badge={stats.unreadSubmissions > 0 ? `${stats.unreadSubmissions} unread` : undefined}
        />
        <StatBox
          icon={<Heart className="h-5 w-5" />}
          label="Site Health"
          value={`${stats.healthScore}/100`}
          valueColor={healthColor}
        />
      </div>

      {/* Health Score Expandable Panel */}
      <div className="rounded-xl border bg-white" style={{ borderColor: "#E8E8E8" }}>
        <button
          onClick={() => setHealthExpanded(!healthExpanded)}
          className="flex w-full items-center justify-between p-5"
        >
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold" style={{ color: "#0D0D0D" }}>Health Score</h3>
            <span className="text-sm font-bold" style={{ color: healthColor }}>{stats.healthScore}/100</span>
          </div>
          {healthExpanded ? (
            <ChevronDown className="h-4 w-4" style={{ color: "#7A7A7A" }} />
          ) : (
            <ChevronRight className="h-4 w-4" style={{ color: "#7A7A7A" }} />
          )}
        </button>

        {/* Composite bar (always visible) */}
        <div className="px-5 pb-4">
          <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "#F4F4F4" }}>
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${stats.healthScore}%`, backgroundColor: healthColor }}
            />
          </div>
        </div>

        {healthExpanded && (
          <div className="border-t px-5 pb-5 pt-4" style={{ borderColor: "#F4F4F4" }}>
            <div className="grid grid-cols-2 gap-4">
              {HEALTH_METRICS.map((m) => {
                const score = stats.healthBreakdown[m.key];
                const barColor = score > 70 ? "#22C55E" : score > 40 ? "#EA580C" : "var(--color-primary)";
                const Icon = m.icon;
                return (
                  <Link
                    key={m.key}
                    href={`/dashboard/sites/${siteId}/${m.tab}`}
                    className="group rounded-lg border p-3 transition-colors hover:border-[var(--color-primary)]/30"
                    style={{ borderColor: "#E8E8E8" }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" style={{ color: "#7A7A7A" }} />
                        <p className="text-xs font-medium" style={{ color: "#7A7A7A" }}>{m.label}</p>
                      </div>
                      <span className="text-xs font-bold" style={{ color: barColor }}>{score}%</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "#F4F4F4" }}>
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
      </div>

      {/* Form Submissions Section */}
      {formBlocks.length > 0 && (
        <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#E8E8E8" }}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: "#0D0D0D" }}>Form Blocks</h3>
            <Link
              href={`/dashboard/sites/${siteId}/submissions`}
              className="text-xs font-medium"
              style={{ color: "var(--color-primary)" }}
            >
              View All Submissions
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {formBlocks.map((fb) => (
              <div key={fb.id} className="rounded-lg border" style={{ borderColor: "#F4F4F4" }}>
                <button
                  onClick={() => setExpandedFormId(expandedFormId === fb.id ? null : fb.id)}
                  className="flex w-full items-center justify-between p-3"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" style={{ color: "#7A7A7A" }} />
                    <span className="text-sm font-medium" style={{ color: "#0D0D0D" }}>{fb.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "#7A7A7A" }}>
                      {fb._count.submissions} submission{fb._count.submissions === 1 ? "" : "s"}
                    </span>
                    {expandedFormId === fb.id ? (
                      <ChevronDown className="h-3.5 w-3.5" style={{ color: "#7A7A7A" }} />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" style={{ color: "#7A7A7A" }} />
                    )}
                  </div>
                </button>
                {expandedFormId === fb.id && (
                  <div className="border-t px-3 py-2" style={{ borderColor: "#F4F4F4" }}>
                    {fb._count.submissions === 0 ? (
                      <p className="py-2 text-xs" style={{ color: "#B0B0B0" }}>No submissions yet.</p>
                    ) : (
                      <p className="py-2 text-xs" style={{ color: "#7A7A7A" }}>
                        {fb._count.submissions} total submission{fb._count.submissions === 1 ? "" : "s"}.{" "}
                        <Link
                          href={`/dashboard/sites/${siteId}/submissions?form=${fb.id}`}
                          className="font-medium"
                          style={{ color: "var(--color-primary)" }}
                        >
                          View details
                        </Link>
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submissions Table */}
      {formBlocks.length > 0 && (
        <div className="rounded-xl border bg-white" style={{ borderColor: "#E8E8E8" }}>
          <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "#E8E8E8" }}>
            <h3 className="text-sm font-semibold" style={{ color: "#0D0D0D" }}>All Submissions</h3>
            <div className="flex items-center gap-3">
              <select
                value={filterFormBlockId ?? ""}
                onChange={(e) => {
                  setFilterFormBlockId(e.target.value || undefined);
                  setSubmissionsPage(1);
                }}
                className="rounded-lg border px-3 py-1.5 text-xs"
                style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
              >
                <option value="">All Forms</option>
                {formBlocks.map((fb) => (
                  <option key={fb.id} value={fb.id}>{fb.name}</option>
                ))}
              </select>
              <button
                onClick={handleExportCsv}
                disabled={!submissionsQuery.data?.data.length}
                className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50 disabled:opacity-40"
                style={{ borderColor: "#E8E8E8", color: "#7A7A7A" }}
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </button>
            </div>
          </div>

          {submissionsQuery.isLoading ? (
            <div className="px-5 py-8">
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 w-full animate-pulse rounded" style={{ backgroundColor: "#F4F4F4" }} />
                ))}
              </div>
            </div>
          ) : submissionsQuery.data && submissionsQuery.data.data.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "#F4F4F4" }}>
                      <th className="px-5 py-3 text-xs font-medium" style={{ color: "#7A7A7A" }}>Submitted</th>
                      <th className="px-5 py-3 text-xs font-medium" style={{ color: "#7A7A7A" }}>Form</th>
                      <th className="px-5 py-3 text-xs font-medium" style={{ color: "#7A7A7A" }}>Data Preview</th>
                      <th className="px-5 py-3 text-xs font-medium" style={{ color: "#7A7A7A" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissionsQuery.data.data.map((sub) => {
                      const s = sub as unknown as FormSubmissionData;
                      const dataEntries = Object.entries(s.data);
                      const preview = dataEntries
                        .slice(0, 2)
                        .map(([k, v]) => `${k}: ${String(v).slice(0, 30)}${String(v).length > 30 ? "\u2026" : ""}`)
                        .join(" | ");
                      return (
                        <tr
                          key={s.id}
                          onClick={() => handleOpenDrawer(s)}
                          className="cursor-pointer border-b transition-colors hover:bg-gray-50"
                          style={{ borderColor: "#F4F4F4" }}
                        >
                          <td className="whitespace-nowrap px-5 py-3 text-xs" style={{ color: "#0D0D0D" }}>
                            {new Date(s.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-5 py-3 text-xs" style={{ color: "#7A7A7A" }}>
                            {s.formBlock?.name ?? "Unknown"}
                          </td>
                          <td className="max-w-[300px] truncate px-5 py-3 text-xs" style={{ color: "#7A7A7A" }}>
                            {preview || "\u2014"}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1.5">
                              {!s.isRead && (
                                <span
                                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                                  style={{ backgroundColor: "#DBEAFE", color: "#2563EB" }}
                                >
                                  Unread
                                </span>
                              )}
                              {s.isSpam && (
                                <span
                                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                                  style={{ backgroundColor: "#FEF2F2", color: "var(--color-primary)" }}
                                >
                                  Spam
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {submissionsQuery.data.total > 20 && (
                <div
                  className="flex items-center justify-between border-t px-5 py-3"
                  style={{ borderColor: "#E8E8E8" }}
                >
                  <p className="text-xs" style={{ color: "#7A7A7A" }}>
                    Page {submissionsQuery.data.page} of {Math.ceil(submissionsQuery.data.total / 20)}
                    {" "}({submissionsQuery.data.total} total)
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSubmissionsPage((p) => Math.max(1, p - 1))}
                      disabled={submissionsPage <= 1}
                      className="rounded-lg border p-1.5 transition-colors hover:bg-gray-50 disabled:opacity-40"
                      style={{ borderColor: "#E8E8E8" }}
                    >
                      <ChevronLeft className="h-4 w-4" style={{ color: "#7A7A7A" }} />
                    </button>
                    <button
                      onClick={() => setSubmissionsPage((p) => p + 1)}
                      disabled={submissionsPage >= Math.ceil(submissionsQuery.data.total / 20)}
                      className="rounded-lg border p-1.5 transition-colors hover:bg-gray-50 disabled:opacity-40"
                      style={{ borderColor: "#E8E8E8" }}
                    >
                      <ChevronRight className="h-4 w-4" style={{ color: "#7A7A7A" }} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="px-5 py-8 text-center">
              <p className="text-sm" style={{ color: "#B0B0B0" }}>No submissions found.</p>
            </div>
          )}
        </div>
      )}

      {/* Submission Drawer */}
      <SubmissionDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerSubmission(null);
        }}
        submission={drawerSubmission}
        onUpdate={handleDrawerUpdate}
        onDelete={handleDrawerDelete}
      />

      {/* Recent Activity */}
      <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#E8E8E8" }}>
        <h3 className="text-sm font-semibold" style={{ color: "#0D0D0D" }}>Recent Activity</h3>
        {activity.length === 0 ? (
          <p className="mt-3 text-sm" style={{ color: "#B0B0B0" }}>No activity yet. Start editing to see updates here.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {activity.map((a) => (
              <div key={a.id} className="flex items-start gap-2">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
                <div>
                  <p className="text-sm" style={{ color: "#0D0D0D" }}>{a.description ?? a.action}</p>
                  <p className="text-xs" style={{ color: "#B0B0B0" }}>{timeAgo(a.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl border bg-white p-4" style={{ borderColor: "#E8E8E8" }}>
            <div className="h-3 w-20 animate-pulse rounded" style={{ backgroundColor: "#F4F4F4" }} />
            <div className="mt-3 h-6 w-16 animate-pulse rounded" style={{ backgroundColor: "#F4F4F4" }} />
            <div className="mt-2 h-3 w-24 animate-pulse rounded" style={{ backgroundColor: "#F4F4F4" }} />
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#E8E8E8" }}>
        <div className="h-4 w-32 animate-pulse rounded" style={{ backgroundColor: "#F4F4F4" }} />
        <div className="mt-3 h-2 w-full animate-pulse rounded-full" style={{ backgroundColor: "#F4F4F4" }} />
      </div>
      <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#E8E8E8" }}>
        <div className="h-4 w-28 animate-pulse rounded" style={{ backgroundColor: "#F4F4F4" }} />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="mt-1 h-2 w-2 shrink-0 animate-pulse rounded-full" style={{ backgroundColor: "#F4F4F4" }} />
              <div className="flex-1">
                <div className="h-3 w-3/4 animate-pulse rounded" style={{ backgroundColor: "#F4F4F4" }} />
                <div className="mt-1 h-2.5 w-16 animate-pulse rounded" style={{ backgroundColor: "#F4F4F4" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
  trend,
  badge,
  link,
  subtitle,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: number;
  badge?: string;
  link?: { label: string; href: string };
  subtitle?: string;
  valueColor?: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-4" style={{ borderColor: "#E8E8E8" }}>
      <div className="flex items-center gap-2" style={{ color: "#7A7A7A" }}>
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-xl font-bold" style={{ color: valueColor ?? "#0D0D0D" }}>{value}</p>
      {subtitle && <p className="mt-1 text-xs" style={{ color: "#B0B0B0" }}>{subtitle}</p>}
      {trend !== undefined && (
        <p className="mt-1 text-xs font-medium" style={{ color: trend >= 0 ? "#22C55E" : "var(--color-primary)" }}>
          {trend >= 0 ? "\u2191" : "\u2193"} {Math.abs(trend)}%
        </p>
      )}
      {badge && (
        <span
          className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ backgroundColor: "#FEF2F2", color: "var(--color-primary)" }}
        >
          {badge}
        </span>
      )}
      {link && (
        <Link href={link.href} className="mt-1 block text-xs font-medium" style={{ color: "var(--color-primary)" }}>
          {link.label}
        </Link>
      )}
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

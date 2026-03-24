"use client";
import Link from "next/link";
import { FileText, Eye, Calendar, Users, MessageSquare, Heart } from "lucide-react";

export const HEALTH_METRICS = [
  { label: "SEO", key: "seo" },
  { label: "Performance", key: "lighthouse" },
  { label: "Content Fill", key: "contentFill" },
  { label: "SSL", key: "ssl" },
] as const;

interface OverviewStats {
  totalPages: number;
  monthlyVisitors: number;
  visitorsChange: number;
  teamMembers: number;
  formSubmissions: number;
  unreadSubmissions: number;
  healthScore: number;
}

interface ActivityEntry {
  id: string;
  action: string;
  description: string | null;
  createdAt: Date;
}

interface OverviewTabProps {
  siteId: string;
  stats: OverviewStats;
  activity: ActivityEntry[];
  lastPublishedAt: Date | null;
}

export function OverviewTab({ siteId, stats, activity, lastPublishedAt }: OverviewTabProps) {
  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatBox icon={<FileText className="h-5 w-5" />} label="Total Pages" value={String(stats.totalPages)} />
        <StatBox icon={<Eye className="h-5 w-5" />} label="Monthly Visitors" value={String(stats.monthlyVisitors)} trend={stats.visitorsChange} />
        <StatBox icon={<Calendar className="h-5 w-5" />} label="Last Published" value={lastPublishedAt ? timeAgo(lastPublishedAt) : "Never"} />
        <StatBox icon={<Users className="h-5 w-5" />} label="Team Members" value={String(stats.teamMembers)} link={{ label: "Manage →", href: "/dashboard/team" }} />
        <StatBox icon={<MessageSquare className="h-5 w-5" />} label="Form Submissions" value={`${stats.formSubmissions} this month`} badge={stats.unreadSubmissions > 0 ? `${stats.unreadSubmissions} unread` : undefined} />
        <StatBox icon={<Heart className="h-5 w-5" />} label="Site Health" value={`${stats.healthScore}/100`} />
      </div>

      {/* Health Breakdown */}
      <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#E8E8E8" }}>
        <h3 className="text-sm font-semibold" style={{ color: "#0D0D0D" }}>Health Score Breakdown</h3>
        <div className="mt-3 grid grid-cols-4 gap-4">
          {HEALTH_METRICS.map((m) => (
            <div key={m.key}>
              <p className="text-xs font-medium" style={{ color: "#7A7A7A" }}>{m.label}</p>
              <div className="mt-1 h-2 rounded-full" style={{ backgroundColor: "#F4F4F4" }}>
                <div className="h-2 rounded-full" style={{ width: "75%", backgroundColor: "#22C55E" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity */}
      <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#E8E8E8" }}>
        <h3 className="text-sm font-semibold" style={{ color: "#0D0D0D" }}>Recent Activity</h3>
        {activity.length === 0 ? (
          <p className="mt-3 text-sm" style={{ color: "#B0B0B0" }}>No activity yet. Start editing to see updates here.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {activity.map((a) => (
              <div key={a.id} className="flex items-start gap-2">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "#E42313" }} />
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

function StatBox({ icon, label, value, trend, badge, link }: { icon: React.ReactNode; label: string; value: string; trend?: number; badge?: string; link?: { label: string; href: string } }) {
  return (
    <div className="rounded-xl border bg-white p-4" style={{ borderColor: "#E8E8E8" }}>
      <div className="flex items-center gap-2" style={{ color: "#7A7A7A" }}>{icon}<span className="text-xs font-medium">{label}</span></div>
      <p className="mt-2 text-xl font-bold" style={{ color: "#0D0D0D" }}>{value}</p>
      {trend !== undefined && <p className="mt-1 text-xs font-medium" style={{ color: trend >= 0 ? "#22C55E" : "#E42313" }}>{trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%</p>}
      {badge && <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: "#FEF2F2", color: "#E42313" }}>{badge}</span>}
      {link && <Link href={link.href} className="mt-1 block text-xs font-medium" style={{ color: "#E42313" }}>{link.label}</Link>}
    </div>
  );
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

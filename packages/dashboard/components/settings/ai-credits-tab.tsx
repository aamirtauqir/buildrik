"use client";

import Link from "next/link";

interface GenerationRecord {
  id: string;
  siteId: string | null;
  createdAt: Date;
  status: string;
  businessType: string;
}

interface AICreditsTabProps {
  used?: number;
  limit?: number;
  history?: GenerationRecord[];
}

const COMING_SOON_TOOLS = [
  { name: "Content Generation", description: "Generate page copy, headlines, and CTAs from a brief" },
  { name: "Design Suggestions", description: "Get AI-powered layout and color scheme recommendations" },
  { name: "Page Creation", description: "Build entire pages from a text description" },
  { name: "SEO Optimization", description: "Auto-optimize meta tags, alt text, and content for search" },
];

const STATUS_MAP: Record<string, { bg: string; color: string; label: string }> = {
  COMPLETED: { bg: "#dcfce7", color: "#16a34a", label: "Completed" },
  FAILED: { bg: "#fee2e2", color: "#991b1b", label: "Failed" },
  QUEUED: { bg: "#fef9c3", color: "#854d0e", label: "In Progress" },
  PROCESSING: { bg: "#fef9c3", color: "#854d0e", label: "In Progress" },
};

const DEFAULT_STATUS = { bg: "#f3f4f6", color: "#6b7280", label: "Unknown" };

function getBarColor(percent: number): string {
  if (percent > 85) return "#dc2626";
  if (percent > 60) return "#ca8a04";
  return "#16a34a";
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AICreditsTab({
  used = 0,
  limit = 10,
  history = [],
}: AICreditsTabProps) {
  const remaining = Math.max(0, limit - used);
  const usagePercent = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-base font-semibold mb-3" style={{ color: "#0D0D0D" }}>
          AI site generation credits
        </h2>
        <div
          className="p-4 rounded-lg border"
          style={{ borderColor: "#E8E8E8" }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm" style={{ color: "#0D0D0D" }}>
              <span className="font-semibold text-lg">{remaining}</span> remaining this month
            </p>
            <p className="text-sm font-medium" style={{ color: "#7A7A7A" }}>
              {used}/{limit} credits used
            </p>
          </div>
          <div className="h-2.5 w-full rounded-full" style={{ backgroundColor: "#E8E8E8" }}>
            <div
              className="h-2.5 rounded-full transition-all"
              style={{
                width: `${usagePercent}%`,
                backgroundColor: getBarColor(usagePercent),
              }}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: "#7A7A7A" }}>
            Credits reset on the 1st of each month.
          </p>
        </div>

        <div className="flex justify-end mt-3">
          <Link
            href="/dashboard/sites/new?method=ai"
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white ${
              remaining === 0 ? "pointer-events-none opacity-50" : ""
            }`}
            style={{ backgroundColor: "var(--color-primary)" }}
            aria-disabled={remaining === 0}
          >
            Generate New Site
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-3" style={{ color: "#0D0D0D" }}>
          Generation history
        </h2>
        <div
          className="rounded-lg border overflow-hidden"
          style={{ borderColor: "#E8E8E8" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #E8E8E8", backgroundColor: "#fafafa" }}>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#7A7A7A" }}>
                  Date
                </th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#7A7A7A" }}>
                  Business Type
                </th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#7A7A7A" }}>
                  Status
                </th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#7A7A7A" }}>
                  Site
                </th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-sm"
                    style={{ color: "#B0B0B0" }}
                  >
                    No generations yet. Use your credits to create your first AI site.
                  </td>
                </tr>
              )}
              {history.map((record) => {
                const statusStyle = STATUS_MAP[record.status] ?? DEFAULT_STATUS;
                const isComplete = record.status === "COMPLETED";
                const isProcessing = record.status === "QUEUED" || record.status === "PROCESSING";
                return (
                  <tr key={record.id} style={{ borderBottom: "1px solid #E8E8E8" }}>
                    <td className="px-4 py-3" style={{ color: "#7A7A7A" }}>
                      {formatDate(record.createdAt)}
                    </td>
                    <td className="px-4 py-3" style={{ color: "#7A7A7A" }}>
                      {record.businessType}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                      >
                        {statusStyle.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isComplete && record.siteId ? (
                        <Link
                          href={`/dashboard/sites/${record.siteId}`}
                          className="text-sm font-medium"
                          style={{ color: "var(--color-primary)" }}
                        >
                          View site
                        </Link>
                      ) : isProcessing ? (
                        <span className="text-xs" style={{ color: "#854d0e" }}>
                          Generating...
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: "#B0B0B0" }}>
                          --
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-3" style={{ color: "#0D0D0D" }}>
          More AI tools
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {COMING_SOON_TOOLS.map((tool) => (
            <div
              key={tool.name}
              className="relative p-4 rounded-lg border cursor-default select-none"
              style={{ borderColor: "#E8E8E8", opacity: 0.6 }}
              aria-disabled="true"
            >
              <div className="absolute top-3 right-3">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "#E8E8E8", color: "#7A7A7A" }}
                >
                  Coming Soon
                </span>
              </div>
              <p className="text-sm font-semibold pr-24" style={{ color: "#0D0D0D" }}>
                {tool.name}
              </p>
              <p className="text-xs mt-1" style={{ color: "#7A7A7A" }}>
                {tool.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

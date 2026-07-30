"use client";

import Link from "next/link";
import { SectionCard, ProgressBar, Pill, MetricValue, type PillTone } from "@/components/dashboard/primitives";

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
  // The per-day, per-user in-editor AI prompt limit — the one that actually
  // blocks AI edits. -1 = unlimited.
  dailyPromptsUsed?: number;
  dailyPromptsLimit?: number;
}

const COMING_SOON_TOOLS = [
  { name: "Content Generation", description: "Generate page copy, headlines, and CTAs from a brief" },
  { name: "Design Suggestions", description: "Get AI-powered layout and color scheme recommendations" },
  { name: "Page Creation", description: "Build entire pages from a text description" },
  { name: "SEO Optimization", description: "Auto-optimize meta tags, alt text, and content for search" },
];

const STATUS_MAP: Record<string, { tone: PillTone; label: string }> = {
  COMPLETED: { tone: "success", label: "Completed" },
  FAILED: { tone: "error", label: "Failed" },
  QUEUED: { tone: "warning", label: "In Progress" },
  PROCESSING: { tone: "warning", label: "In Progress" },
};

const DEFAULT_STATUS: { tone: PillTone; label: string } = { tone: "neutral", label: "Unknown" };

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
  dailyPromptsUsed = 0,
  dailyPromptsLimit = 0,
}: AICreditsTabProps) {
  const remaining = Math.max(0, limit - used);
  const usagePercent = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const promptsUnlimited = dailyPromptsLimit < 0;
  const promptsPercent = dailyPromptsLimit > 0 ? Math.min(100, (dailyPromptsUsed / dailyPromptsLimit) * 100) : 0;

  return (
    <div className="space-y-8">
      <SectionCard
        title="AI site generation credits"
        actions={
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
        }
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>
            <MetricValue className="text-lg font-semibold">{remaining}</MetricValue> remaining this month
          </p>
          <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
            <MetricValue>{used}/{limit}</MetricValue> credits used
          </p>
        </div>
        <ProgressBar pct={usagePercent} tone="accent" />
        <p className="text-xs mt-2" style={{ color: "var(--color-text-secondary)" }}>
          Credits reset on the 1st of each month.
        </p>
      </SectionCard>

      {/* The daily per-user prompt limit is what actually gates in-editor AI —
          surfacing it so users aren't blocked by a number shown nowhere. */}
      <SectionCard title="In-editor AI prompts">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>
            {promptsUnlimited ? (
              <MetricValue className="text-lg font-semibold">Unlimited</MetricValue>
            ) : (
              <><MetricValue className="text-lg font-semibold">{Math.max(0, dailyPromptsLimit - dailyPromptsUsed)}</MetricValue> remaining today</>
            )}
          </p>
          {!promptsUnlimited && (
            <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
              <MetricValue>{dailyPromptsUsed}/{dailyPromptsLimit}</MetricValue> prompts used
            </p>
          )}
        </div>
        {!promptsUnlimited && <ProgressBar pct={promptsPercent} tone="accent" />}
        <p className="text-xs mt-2" style={{ color: "var(--color-text-secondary)" }}>
          Each AI edit in the editor uses one prompt. Resets daily at midnight UTC.
        </p>
      </SectionCard>

      <section>
        <h2 className="text-base font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
          Generation history
        </h2>
        <div
          className="rounded-lg border overflow-hidden"
          style={{ borderColor: "var(--color-border-default)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border-default)", backgroundColor: "var(--color-bg-page)" }}>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--color-text-secondary)" }}>
                  Date
                </th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--color-text-secondary)" }}>
                  Business Type
                </th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--color-text-secondary)" }}>
                  Status
                </th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--color-text-secondary)" }}>
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
                    style={{ color: "var(--color-text-muted)" }}
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
                  <tr key={record.id} style={{ borderBottom: "1px solid var(--color-border-default)" }}>
                    <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)" }}>
                      <MetricValue>{formatDate(record.createdAt)}</MetricValue>
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)" }}>
                      {record.businessType}
                    </td>
                    <td className="px-4 py-3">
                      <Pill tone={statusStyle.tone}>{statusStyle.label}</Pill>
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
                        <span className="text-xs" style={{ color: "#723B13" }}>
                          Generating...
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
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
        <h2 className="text-base font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
          More AI tools
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {COMING_SOON_TOOLS.map((tool) => (
            <div
              key={tool.name}
              className="relative p-4 rounded-lg border cursor-default select-none"
              style={{ borderColor: "var(--color-border-default)", opacity: 0.6 }}
              aria-disabled="true"
            >
              <div className="absolute top-3 right-3">
                <Pill tone="neutral">Coming Soon</Pill>
              </div>
              <p className="text-sm font-semibold pr-24" style={{ color: "var(--color-text-primary)" }}>
                {tool.name}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                {tool.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

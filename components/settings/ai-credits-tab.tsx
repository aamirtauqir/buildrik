"use client";

interface GenerationRecord {
  id: string;
  siteName: string;
  date: string;
  status: "completed" | "failed" | "processing";
  businessType: string;
}

interface AICreditsTabProps {
  creditsUsed?: number;
  creditsTotal?: number;
  generationHistory?: GenerationRecord[];
  onGenerateNew?: () => void;
}

const COMING_SOON_TOOLS = [
  { name: "AI Copywriter", description: "Generate page copy from a brief" },
  { name: "AI Image Generator", description: "Create custom images for your sites" },
  { name: "AI SEO Optimizer", description: "Auto-optimize meta tags and content" },
  { name: "AI Form Builder", description: "Build smart forms from descriptions" },
];

const STATUS_STYLES: Record<GenerationRecord["status"], { bg: string; color: string; label: string }> = {
  completed: { bg: "#dcfce7", color: "#16a34a", label: "Completed" },
  failed: { bg: "#fee2e2", color: "#991b1b", label: "Failed" },
  processing: { bg: "#fef9c3", color: "#854d0e", label: "Processing" },
};

export function AICreditsTab({
  creditsUsed = 0,
  creditsTotal = 10,
  generationHistory = [],
  onGenerateNew,
}: AICreditsTabProps) {
  const creditsRemaining = Math.max(0, creditsTotal - creditsUsed);
  const usagePercent = Math.min(100, (creditsUsed / creditsTotal) * 100);

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
              <span className="font-semibold text-lg">{creditsRemaining}</span> remaining this month
            </p>
            <p className="text-xs" style={{ color: "#7A7A7A" }}>
              {creditsUsed} / {creditsTotal} used
            </p>
          </div>
          <div className="h-2 w-full rounded-full" style={{ backgroundColor: "#E8E8E8" }}>
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${usagePercent}%`,
                backgroundColor: usagePercent >= 90 ? "#E42313" : "#E42313",
                opacity: usagePercent >= 90 ? 1 : 0.7,
              }}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: "#7A7A7A" }}>
            Credits reset on the 1st of each month.
          </p>
        </div>

        <div className="flex justify-end mt-3">
          <button
            type="button"
            onClick={onGenerateNew}
            disabled={creditsRemaining === 0}
            className="px-4 py-2 text-sm font-medium rounded-md text-white disabled:opacity-50"
            style={{ backgroundColor: "#E42313" }}
          >
            Generate new site
          </button>
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
                  Site name
                </th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#7A7A7A" }}>
                  Date
                </th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#7A7A7A" }}>
                  Status
                </th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "#7A7A7A" }}>
                  Business type
                </th>
              </tr>
            </thead>
            <tbody>
              {generationHistory.length === 0 && (
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
              {generationHistory.map((record) => {
                const style = STATUS_STYLES[record.status];
                return (
                  <tr key={record.id} style={{ borderBottom: "1px solid #E8E8E8" }}>
                    <td className="px-4 py-3 font-medium" style={{ color: "#0D0D0D" }}>
                      {record.siteName}
                    </td>
                    <td className="px-4 py-3" style={{ color: "#7A7A7A" }}>
                      {record.date}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: style.bg, color: style.color }}
                      >
                        {style.label}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: "#7A7A7A" }}>
                      {record.businessType}
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
              className="relative p-4 rounded-lg border overflow-hidden"
              style={{ borderColor: "#E8E8E8", opacity: 0.7 }}
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

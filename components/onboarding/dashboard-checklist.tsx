"use client";

import { useState } from "react";
import { CheckCircle2, Circle, ChevronUp, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const DASHBOARD_CHECKLIST_ITEMS = [
  {
    id: "create-site",
    label: "Create your first site",
    description: "Get started with a template or AI",
  },
  {
    id: "customize",
    label: "Customize your site",
    description: "Edit content and design",
  },
  {
    id: "publish",
    label: "Publish your site",
    description: "Make it live for the world",
  },
  {
    id: "invite",
    label: "Invite a team member",
    description: "Collaborate with others",
  },
  {
    id: "domain",
    label: "Connect a custom domain",
    description: "Use your own URL",
  },
] as const;

type ChecklistItemId = (typeof DASHBOARD_CHECKLIST_ITEMS)[number]["id"];

interface DashboardChecklistProps {
  completedIds?: ChecklistItemId[];
  onDismiss?: () => void;
}

export function DashboardChecklist({ completedIds = [], onDismiss }: DashboardChecklistProps) {
  const [collapsed, setCollapsed] = useState(false);
  const completedSet = new Set(completedIds);
  const completedCount = DASHBOARD_CHECKLIST_ITEMS.filter((item) =>
    completedSet.has(item.id)
  ).length;
  const total = DASHBOARD_CHECKLIST_ITEMS.length;
  const progressPct = Math.round((completedCount / total) * 100);

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl border border-[#E8E8E8] bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E8E8]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#0D0D0D]">Getting Started</span>
          <span className="text-xs font-medium text-[#7A7A7A]">
            {completedCount}/{total}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="rounded-md p-1 text-[#7A7A7A] hover:bg-[#F4F4F4] transition-colors"
            aria-label={collapsed ? "Expand checklist" : "Collapse checklist"}
          >
            {collapsed ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="rounded-md p-1 text-[#7A7A7A] hover:bg-[#F4F4F4] transition-colors"
              aria-label="Dismiss checklist"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pt-2 pb-1">
        <div className="h-1.5 w-full rounded-full bg-[#F4F4F4]">
          <div
            className="h-1.5 rounded-full bg-[#E42313] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Items */}
      {!collapsed && (
        <ul className="px-4 pb-4 pt-2 space-y-2">
          {DASHBOARD_CHECKLIST_ITEMS.map((item) => {
            const done = completedSet.has(item.id);
            return (
              <li key={item.id} className="flex items-start gap-3">
                {done ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#C0C0C0]" />
                )}
                <div>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      done ? "text-[#B0B0B0] line-through" : "text-[#0D0D0D]"
                    )}
                  >
                    {item.label}
                  </p>
                  {!done && (
                    <p className="text-xs text-[#7A7A7A]">{item.description}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

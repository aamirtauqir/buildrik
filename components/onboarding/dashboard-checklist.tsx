"use client";

import { useState } from "react";
import { CheckCircle2, Circle, ChevronUp, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";

export const FULL_CHECKLIST_ITEMS = [
  {
    id: "add-text-block",
    label: "Add your first text block",
    description: "Start building with content",
  },
  {
    id: "upload-image",
    label: "Upload an image",
    description: "Add visuals to your site",
  },
  {
    id: "change-site-name",
    label: "Change your site name",
    description: "Make it yours",
  },
  {
    id: "add-second-page",
    label: "Add a second page",
    description: "Expand your site structure",
  },
  {
    id: "preview-site",
    label: "Preview your site",
    description: "See how it looks to visitors",
  },
  {
    id: "invite-team-member",
    label: "Invite a team member",
    description: "Collaborate with others",
  },
  {
    id: "publish-site",
    label: "Publish your site",
    description: "Make it live for the world",
  },
] as const;

export const INVITED_CHECKLIST_ITEMS = [
  {
    id: "edit-page",
    label: "Edit a page",
    description: "Make changes to existing content",
  },
  {
    id: "preview-site",
    label: "Preview your site",
    description: "See how it looks to visitors",
  },
  {
    id: "invite-team-member",
    label: "Invite a team member",
    description: "Collaborate with others",
  },
] as const;

/** @deprecated Use FULL_CHECKLIST_ITEMS or INVITED_CHECKLIST_ITEMS */
export const DASHBOARD_CHECKLIST_ITEMS = FULL_CHECKLIST_ITEMS;

type FullChecklistItemId = (typeof FULL_CHECKLIST_ITEMS)[number]["id"];
type InvitedChecklistItemId = (typeof INVITED_CHECKLIST_ITEMS)[number]["id"];
export type ChecklistItemId = FullChecklistItemId | InvitedChecklistItemId;

interface DashboardChecklistProps {
  variant?: "full" | "invited";
  completedIds?: string[];
  onDismiss?: () => void;
}

export function DashboardChecklist({
  variant = "full",
  completedIds = [],
  onDismiss,
}: DashboardChecklistProps) {
  const [collapsed, setCollapsed] = useState(false);

  const items = variant === "invited" ? INVITED_CHECKLIST_ITEMS : FULL_CHECKLIST_ITEMS;
  const completedSet = new Set(completedIds);
  const completedCount = items.filter((item) => completedSet.has(item.id)).length;
  const total = items.length;
  const progressPct = Math.round((completedCount / total) * 100);

  const utils = trpc.useUtils();
  const completeStepMutation = trpc.onboarding.completeStep.useMutation({
    onSuccess: () => {
      utils.onboarding.getState.invalidate();
    },
  });
  const dismissMutation = trpc.onboarding.dismiss.useMutation({
    onSuccess: () => {
      utils.onboarding.getState.invalidate();
      onDismiss?.();
    },
  });

  function handleTaskClick(itemId: string) {
    if (completedSet.has(itemId)) return;
    completeStepMutation.mutate({ step: itemId });
  }

  function handleDismiss() {
    dismissMutation.mutate();
  }

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
          <button
            onClick={handleDismiss}
            className="rounded-md p-1 text-[#7A7A7A] hover:bg-[#F4F4F4] transition-colors"
            aria-label="Dismiss checklist"
          >
            <X className="h-4 w-4" />
          </button>
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
          {items.map((item) => {
            const done = completedSet.has(item.id);
            return (
              <li
                key={item.id}
                className={cn(
                  "flex items-start gap-3",
                  !done && "cursor-pointer"
                )}
                onClick={() => handleTaskClick(item.id)}
              >
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

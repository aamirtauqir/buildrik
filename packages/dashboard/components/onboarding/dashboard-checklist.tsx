"use client";

import { useState } from "react";
import { CheckCircle2, Circle, ChevronUp, ChevronDown, X } from "lucide-react";
import { cn } from "@lib/utils";
import { trpc } from "@lib/trpc/client";

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

type FullChecklistItemId = (typeof FULL_CHECKLIST_ITEMS)[number]["id"];
type InvitedChecklistItemId = (typeof INVITED_CHECKLIST_ITEMS)[number]["id"];
export type ChecklistItemId = FullChecklistItemId | InvitedChecklistItemId;

interface DashboardChecklistProps {
  /**
   * The viewer's role in the workspace, straight off `stats.memberRole` — the
   * same value the dashboard picks its empty state from. This used to be a
   * `variant` prop defaulting to "full" that no caller ever passed, so the
   * invited list below was unreachable and every invited member was handed
   * the owner checklist, "Publish your site" and all. Anything that is not a
   * confirmed OWNER gets the invited list, including undefined while the
   * query is still in flight — showing owner-only tasks to a non-owner is the
   * failure worth avoiding, not a first paint with three items.
   */
  memberRole?: string | null;
  completedIds?: string[];
  onDismiss?: () => void;
}

export function DashboardChecklist({
  memberRole,
  completedIds = [],
  onDismiss,
}: DashboardChecklistProps) {
  // Opens collapsed. This panel is `fixed bottom-6 right-6` and 393px tall, which
  // lands exactly on the dashboard's "Quick actions" card — opening expanded made
  // Create a site / Invite teammate / Browse templates unclickable for every new
  // user, on the one screen where those CTAs matter most. Collapsed still shows
  // the "Getting Started 0/7" bar, so the checklist stays discoverable.
  const [collapsed, setCollapsed] = useState(true);

  const items = memberRole === "OWNER" ? FULL_CHECKLIST_ITEMS : INVITED_CHECKLIST_ITEMS;
  const completedSet = new Set(completedIds);
  const completedCount = items.filter((item) => completedSet.has(item.id)).length;
  const total = items.length;
  const progressPct = Math.round((completedCount / total) * 100);

  const utils = trpc.useUtils();
  // Per-task completion — task ids are NOT steps; sending them through
  // completeStep used to mark ALL of onboarding completed in one click.
  const completeTaskMutation = trpc.onboarding.completeDashboardTask.useMutation({
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

  function handleTaskClick(itemId: ChecklistItemId) {
    if (completedSet.has(itemId)) return;
    completeTaskMutation.mutate({ taskId: itemId });
  }

  function handleDismiss() {
    dismissMutation.mutate();
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 rounded-lg border border-[var(--color-border-default)] bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-default)]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">Getting Started</span>
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
            {completedCount}/{total}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="rounded-md p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] transition-colors"
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
            className="rounded-md p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] transition-colors"
            aria-label="Dismiss checklist"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pt-2 pb-1">
        <div className="h-1.5 w-full rounded-full bg-[var(--color-bg-subtle)]">
          <div
            className="h-1.5 rounded-full bg-[var(--color-primary)] transition-all duration-300"
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
                      done ? "text-[var(--color-text-muted)] line-through" : "text-[var(--color-text-primary)]"
                    )}
                  >
                    {item.label}
                  </p>
                  {!done && (
                    <p className="text-xs text-[var(--color-text-secondary)]">{item.description}</p>
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

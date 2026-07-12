"use client";

import Link from "next/link";
import {
  Plus,
  UserPlus,
  Globe,
  BarChart3,
  Settings,
  CreditCard,
  Headphones,
  LayoutTemplate,
  type LucideIcon,
} from "lucide-react";

export const QUICK_ACTION_ICONS: Record<string, LucideIcon> = {
  Plus,
  UserPlus,
  Globe,
  BarChart3,
  Settings,
  CreditCard,
  Headphones,
  LayoutTemplate,
};

type QuickAction = {
  icon: string;
  label: string;
  description: string;
  href: string;
};

type QuickActionsProps = {
  actions: QuickAction[];
};

export function QuickActions({ actions }: QuickActionsProps) {
  const visible = actions.slice(0, 4);

  return (
    <div className="flex flex-row gap-3">
      {visible.map((action) => {
        const Icon = QUICK_ACTION_ICONS[action.icon] ?? Plus;
        return (
          <Link
            key={action.label}
            href={action.href}
            className="flex flex-1 items-center gap-3 rounded-xl border border-[var(--color-border-default)] bg-white p-4 hover:border-[var(--color-primary)]/30 transition-colors"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-subtle)]">
              <Icon className="h-4 w-4 text-[var(--color-primary)]" />
            </span>
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">{action.label}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{action.description}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

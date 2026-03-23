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
            key={action.href}
            href={action.href}
            className="flex flex-1 items-center gap-3 rounded-xl border border-[#E8E8E8] bg-white p-4 hover:border-[#E42313]/30 transition-colors"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50">
              <Icon className="h-4 w-4 text-[#E42313]" />
            </span>
            <div>
              <p className="text-sm font-medium text-[#0D0D0D]">{action.label}</p>
              <p className="text-xs text-[#B0B0B0]">{action.description}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

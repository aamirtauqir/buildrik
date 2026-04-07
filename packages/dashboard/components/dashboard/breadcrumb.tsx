"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  if (items.length <= 1) return null;
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5" style={{ color: "#B0B0B0" }} />}
              {isLast || !item.href ? (
                <span className="font-medium" style={{ color: isLast ? "#0D0D0D" : "#7A7A7A" }}>{item.label}</span>
              ) : (
                <Link href={item.href} className="transition-colors hover:underline" style={{ color: "#7A7A7A" }}>{item.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

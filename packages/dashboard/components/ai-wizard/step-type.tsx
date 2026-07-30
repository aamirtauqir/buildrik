"use client";
import { Briefcase, Palette, BookOpen, UtensilsCrossed, Building2, ShoppingBag, Sparkles } from "lucide-react";
import { cn } from "@lib/utils";

export const BUSINESS_TYPES = [
  { value: "PORTFOLIO", label: "Portfolio", description: "Showcase your creative work", icon: "Palette", pages: ["Home", "Work", "About", "Contact"] },
  { value: "BUSINESS", label: "Business", description: "Professional company site", icon: "Briefcase", pages: ["Home", "About", "Services", "Contact"] },
  { value: "BLOG", label: "Blog", description: "Share stories and articles", icon: "BookOpen", pages: ["Home", "Blog", "About", "Contact"] },
  { value: "RESTAURANT", label: "Restaurant", description: "Menu and reservations", icon: "UtensilsCrossed", pages: ["Home", "Menu", "About", "Contact"] },
  { value: "AGENCY", label: "Agency", description: "Attract clients and showcase projects", icon: "Building2", pages: ["Home", "Work", "Team", "Contact"] },
  { value: "ECOMMERCE", label: "E-commerce", description: "Sell products online", icon: "ShoppingBag", pages: ["Home", "Products", "About", "Contact"] },
] as const;

const iconMap = { Palette, Briefcase, BookOpen, UtensilsCrossed, Building2, ShoppingBag } as const;

interface StepTypeProps {
  selected: string | null;
  onSelect: (type: string) => void;
  onNext: () => void;
}

export function StepType({ selected, onSelect, onNext }: StepTypeProps) {
  return (
    <div className="mx-auto max-w-[600px]">
      <div className="text-center">
        <div className="inline-flex items-center gap-2">
          <Sparkles className="h-6 w-6" style={{ color: "var(--color-primary)" }} />
          <h1 className="text-page-title" style={{ color: "var(--color-text-primary)" }}>What kind of site are you building?</h1>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3">
        {BUSINESS_TYPES.map((type) => {
          const Icon = iconMap[type.icon as keyof typeof iconMap];
          const isSelected = selected === type.value;
          return (
            <button key={type.value} onClick={() => onSelect(type.value)} className={cn("flex items-start gap-3 rounded-lg border p-4 text-left transition-all", isSelected ? "border-[var(--color-primary)] bg-[#EBF5FF] ring-1 ring-[var(--color-primary)]" : "hover:border-[var(--color-border-strong)]")} style={{ borderColor: isSelected ? "var(--color-primary)" : "var(--color-border-default)" }}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: isSelected ? "#E1EFFE" : "var(--color-bg-subtle)" }}>
                <Icon className="h-5 w-5" style={{ color: isSelected ? "var(--color-primary)" : "var(--color-text-secondary)" }} />
              </div>
              <div>
                <p className="text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>{type.label}</p>
                <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>{type.description}</p>
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-8 text-center">
        <button onClick={onNext} disabled={!selected} className="rounded-lg px-8 py-2.5 text-body font-medium text-white disabled:opacity-50" style={{ backgroundColor: "var(--color-primary)" }}>Next</button>
      </div>
    </div>
  );
}

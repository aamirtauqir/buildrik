"use client";

import { useState } from "react";
import { Sparkles, LayoutTemplate, File, ArrowLeft } from "lucide-react";
import { cn } from "@lib/utils";

export const CREATION_METHODS = [
  {
    value: "ai",
    label: "Generate with AI",
    description: "AI builds your site in minutes",
    icon: "Sparkles",
    primary: true,
  },
  {
    value: "template",
    label: "Use a Template",
    description: "Choose from 50+ designs",
    icon: "LayoutTemplate",
    primary: false,
  },
  {
    value: "blank",
    label: "Start Blank",
    description: "Full creative control",
    icon: "File",
    primary: false,
  },
] as const;

type MethodValue = (typeof CREATION_METHODS)[number]["value"];

const iconMap = { Sparkles, LayoutTemplate, File } as const;

interface OnboardingProjectSetupProps {
  onContinue: (data: { projectName: string; method: MethodValue }) => void;
  onBack: () => void;
  loading?: boolean;
}

export function OnboardingProjectSetup({ onContinue, onBack, loading }: OnboardingProjectSetupProps) {
  const [projectName, setProjectName] = useState("");
  const [method, setMethod] = useState<MethodValue | null>(null);

  const isValid = projectName.trim().length >= 2 && projectName.trim().length <= 100 && method !== null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-md px-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2 text-center font-[family-name:var(--font-space-grotesk)]">
          Set up your first project
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] text-center mb-8">
          Give it a name and choose how you want to start.
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
            Project name
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. My Portfolio"
            minLength={2}
            maxLength={100}
            className="w-full rounded-xl border-2 border-[var(--color-border-default)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none transition-colors focus:border-[var(--color-primary)]"
          />
          {projectName.trim().length > 0 && projectName.trim().length < 2 && (
            <p className="mt-1 text-xs text-[var(--color-primary)]">Name must be at least 2 characters</p>
          )}
        </div>

        <div className="space-y-3 mb-8">
          {CREATION_METHODS.map((m) => {
            const Icon = iconMap[m.icon as keyof typeof iconMap];
            const isSelected = method === m.value;
            return (
              <button
                key={m.value}
                onClick={() => setMethod(m.value)}
                className={cn(
                  "w-full flex items-center gap-4 rounded-xl border-2 px-5 py-4 text-left transition-all",
                  isSelected
                    ? "border-[var(--color-primary)] bg-red-50"
                    : "border-[var(--color-border-default)] bg-white hover:border-[#C0C0C0]"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg",
                    isSelected
                      ? "bg-[var(--color-primary)]"
                      : m.primary
                      ? "bg-[var(--color-text-primary)]"
                      : "bg-[var(--color-bg-subtle)]"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      isSelected || m.primary ? "text-white" : "text-[var(--color-text-secondary)]",
                      isSelected && "text-white"
                    )}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{m.label}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{m.description}</p>
                </div>
                {m.primary && !isSelected && (
                  <span className="ml-auto text-xs font-medium text-[var(--color-primary)] bg-red-50 px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() =>
            isValid && onContinue({ projectName: projectName.trim(), method: method! })
          }
          disabled={!isValid || loading}
          className={cn(
            "w-full rounded-xl py-3 text-sm font-semibold transition-colors",
            isValid && !loading
              ? "bg-[var(--color-primary)] text-white hover:bg-[#c91d0e]"
              : "bg-[var(--color-border-default)] text-[var(--color-text-muted)] cursor-not-allowed"
          )}
        >
          {loading ? "Saving…" : "Continue"}
        </button>
      </div>
    </div>
  );
}

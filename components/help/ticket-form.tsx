"use client";

import { useState } from "react";
import type { SupportTicketInput } from "@/lib/validations/help";

const TICKET_CATEGORIES: { value: SupportTicketInput["category"]; label: string }[] = [
  { value: "GENERAL", label: "General Question" },
  { value: "BILLING", label: "Billing & Payments" },
  { value: "TECHNICAL", label: "Technical Issue" },
  { value: "ACCOUNT", label: "Account & Profile" },
  { value: "FEATURE", label: "Feature Request" },
  { value: "BUG", label: "Bug Report" },
];

interface TicketFormProps {
  onSubmit: (data: SupportTicketInput) => void;
  isSubmitting?: boolean;
}

export function TicketForm({ onSubmit, isSubmitting = false }: TicketFormProps) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<SupportTicketInput["category"]>("GENERAL");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (subject.length < 5) next.subject = "Subject must be at least 5 characters";
    if (subject.length > 200) next.subject = "Subject must be under 200 characters";
    if (description.length < 20) next.description = "Description must be at least 20 characters";
    if (description.length > 5000) next.description = "Description must be under 5000 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ subject, category, description });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Subject */}
      <div>
        <label className="mb-1.5 block text-sm font-medium" style={{ color: "#0D0D0D" }}>
          Subject
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief summary of your issue"
          maxLength={200}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style={{ borderColor: errors.subject ? "#E42313" : "#E8E8E8", color: "#0D0D0D" }}
        />
        {errors.subject && (
          <p className="mt-1 text-xs" style={{ color: "#E42313" }}>{errors.subject}</p>
        )}
        <p className="mt-1 text-right text-xs" style={{ color: "#7A7A7A" }}>{subject.length}/200</p>
      </div>

      {/* Category */}
      <div>
        <label className="mb-1.5 block text-sm font-medium" style={{ color: "#0D0D0D" }}>
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as SupportTicketInput["category"])}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
        >
          {TICKET_CATEGORIES.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-sm font-medium" style={{ color: "#0D0D0D" }}>
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your issue in detail. Include steps to reproduce if it's a bug."
          rows={6}
          maxLength={5000}
          className="w-full resize-none rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style={{ borderColor: errors.description ? "#E42313" : "#E8E8E8", color: "#0D0D0D" }}
        />
        {errors.description && (
          <p className="mt-1 text-xs" style={{ color: "#E42313" }}>{errors.description}</p>
        )}
        <p className="mt-1 text-right text-xs" style={{ color: "#7A7A7A" }}>{description.length}/5000</p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-60"
        style={{ backgroundColor: "#E42313" }}
      >
        {isSubmitting ? "Submitting..." : "Submit Ticket"}
      </button>
    </form>
  );
}

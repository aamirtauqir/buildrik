"use client";

import { useState, useRef } from "react";
import { Paperclip, X, CheckCircle } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import type { SupportTicketInput } from "@lib/validations/help";

const TICKET_CATEGORIES: { value: SupportTicketInput["category"]; label: string }[] = [
  { value: "GENERAL", label: "General Question" },
  { value: "BILLING", label: "Billing & Payments" },
  { value: "TECHNICAL", label: "Technical Issue" },
  { value: "ACCOUNT", label: "Account & Profile" },
  { value: "FEATURE", label: "Feature Request" },
  { value: "BUG", label: "Bug Report" },
];

const ALLOWED_TYPES = ["image/png", "image/jpeg", "application/pdf"];
const MAX_ATTACHMENTS = 5;

const SLA_BY_PLAN: Record<string, string> = {
  FREE: "Help docs only — no email support on Free plan",
  PRO: "48-hour email response",
  BUSINESS: "4-hour priority response",
};

interface TicketConfirmation {
  id: string;
  ticketNumber: number;
  plan: string;
}

export function TicketForm() {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<SupportTicketInput["category"]>("GENERAL");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmation, setConfirmation] = useState<TicketConfirmation | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createTicket = trpc.help.createTicket.useMutation({
    onSuccess(data) {
      const ticket = data as { id: string; ticketNumber?: number; plan?: string };
      setConfirmation({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber ?? 0,
        plan: ticket.plan ?? "FREE",
      });
    },
  });

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (subject.length < 5) next.subject = "Subject must be at least 5 characters";
    if (subject.length > 200) next.subject = "Subject must be under 200 characters";
    if (description.length < 20) next.description = "Description must be at least 20 characters";
    if (description.length > 5000) next.description = "Description must be under 5000 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const nextErrors = { ...errors };
    delete nextErrors.attachments;

    const newFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        nextErrors.attachments = "Only PNG, JPG, and PDF files are allowed";
        break;
      }
      newFiles.push(file);
    }

    const total = attachments.length + newFiles.length;
    if (total > MAX_ATTACHMENTS) {
      nextErrors.attachments = `Maximum ${MAX_ATTACHMENTS} attachments allowed`;
    }

    setErrors(nextErrors);
    if (!nextErrors.attachments) {
      setAttachments((prev) => [...prev, ...newFiles].slice(0, MAX_ATTACHMENTS));
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.attachments;
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    createTicket.mutate({ subject, category, description });
  }

  if (confirmation) {
    const sla = SLA_BY_PLAN[confirmation.plan] ?? SLA_BY_PLAN.FREE;
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: "#F0FDF4" }}
        >
          <CheckCircle className="h-6 w-6" style={{ color: "#16A34A" }} />
        </div>
        <div>
          <h3 className="text-lg font-semibold" style={{ color: "#0D0D0D" }}>
            Ticket #{confirmation.ticketNumber} Created
          </h3>
          <p className="mt-1 text-sm" style={{ color: "#7A7A7A" }}>
            We&apos;ve received your support request.
          </p>
        </div>
        <div
          className="w-full rounded-lg border px-4 py-3 text-left text-sm"
          style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
        >
          <p className="font-medium">Expected response time</p>
          <p className="mt-0.5" style={{ color: "#7A7A7A" }}>{sla}</p>
        </div>
      </div>
    );
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

      {/* Attachments */}
      <div>
        <label className="mb-1.5 block text-sm font-medium" style={{ color: "#0D0D0D" }}>
          Attachments
          <span className="ml-1 font-normal" style={{ color: "#7A7A7A" }}>
            (optional, max {MAX_ATTACHMENTS})
          </span>
        </label>

        {attachments.length > 0 && (
          <div className="mb-2 space-y-1.5">
            {attachments.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
                style={{ borderColor: "#E8E8E8" }}
              >
                <span className="truncate text-sm" style={{ color: "#0D0D0D" }}>
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="ml-2 shrink-0 rounded p-0.5 transition-colors hover:bg-[#F4F4F4]"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" style={{ color: "#7A7A7A" }} />
                </button>
              </div>
            ))}
          </div>
        )}

        {attachments.length < MAX_ATTACHMENTS && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-[#F4F4F4]"
            style={{ borderColor: "#E8E8E8", color: "#7A7A7A" }}
          >
            <Paperclip className="h-4 w-4" />
            Attach file (PNG, JPG, PDF)
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.pdf"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {errors.attachments && (
          <p className="mt-1 text-xs" style={{ color: "#E42313" }}>{errors.attachments}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={createTicket.isPending}
        className="w-full rounded-lg py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-60"
        style={{ backgroundColor: "#E42313" }}
      >
        {createTicket.isPending ? "Submitting..." : "Submit Ticket"}
      </button>
    </form>
  );
}

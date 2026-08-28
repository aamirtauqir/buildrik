"use client";

import { useState, useRef } from "react";
import { Paperclip, X, CheckCircle } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { InputField, SelectField } from "@/components/dashboard/primitives";
import type { SupportTicketInput } from "@buildrik/shared/schemas/help";

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

  const [uploading, setUploading] = useState(false);
  const presignMutation = trpc.upload.presign.useMutation();
  const confirmMutation = trpc.upload.confirm.useMutation();

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

  async function uploadAttachments(): Promise<string[]> {
    const urls: string[] = [];
    for (const file of attachments) {
      const { fileId, uploadUrl } = await presignMutation.mutateAsync({
        fileName: file.name,
        fileType: file.type,
        context: "ticket",
      });
      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { cdnUrl } = await confirmMutation.mutateAsync({ fileId });
      urls.push(cdnUrl);
    }
    return urls;
  }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    let attachmentUrls: string[] = [];
    if (attachments.length > 0) {
      setUploading(true);
      try {
        attachmentUrls = await uploadAttachments();
      } catch {
        setErrors((prev) => ({ ...prev, attachments: "Upload failed — please retry." }));
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    createTicket.mutate({
      subject,
      category,
      description,
      attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined,
    });
  }

  if (confirmation) {
    const sla = SLA_BY_PLAN[confirmation.plan] ?? SLA_BY_PLAN.FREE;
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: "#F3FAF7" }}
        >
          <CheckCircle className="h-6 w-6" style={{ color: "#0E9F6E" }} />
        </div>
        <div>
          <h3 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Ticket #{confirmation.ticketNumber} Created
          </h3>
          <p className="mt-1 text-body" style={{ color: "var(--color-text-secondary)" }}>
            We&apos;ve received your support request.
          </p>
        </div>
        <div
          className="w-full rounded-lg border px-4 py-3 text-left text-body"
          style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
        >
          <p className="font-medium">Expected response time</p>
          <p className="mt-0.5" style={{ color: "var(--color-text-secondary)" }}>{sla}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Subject */}
      <div>
        <label className="mb-1.5 block text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
          Subject
        </label>
        <InputField
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief summary of your issue"
          maxLength={200}
          invalid={!!errors.subject}
          aria-invalid={!!errors.subject}
        />
        {errors.subject && (
          <p className="mt-1 text-body-sm" style={{ color: "var(--color-error-text)" }}>{errors.subject}</p>
        )}
        <p className="mt-1 text-right text-body-sm" style={{ color: "var(--color-text-secondary)" }}>{subject.length}/200</p>
      </div>

      {/* Category */}
      <div>
        <label className="mb-1.5 block text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
          Category
        </label>
        <SelectField value={category} onChange={(e) => setCategory(e.target.value as SupportTicketInput["category"])}>
          {TICKET_CATEGORIES.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </SelectField>
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your issue in detail. Include steps to reproduce if it's a bug."
          rows={6}
          maxLength={5000}
          className="w-full resize-none rounded-lg border px-3 py-2 text-body focus:outline-none focus:ring-2"
          style={{ borderColor: errors.description ? "var(--color-error)" : "var(--color-border-default)", color: "var(--color-text-primary)" }}
        />
        {errors.description && (
          <p className="mt-1 text-body-sm" style={{ color: "var(--color-error-text)" }}>{errors.description}</p>
        )}
        <p className="mt-1 text-right text-body-sm" style={{ color: "var(--color-text-secondary)" }}>{description.length}/5000</p>
      </div>

      {/* Attachments */}
      <div>
        <label className="mb-1.5 block text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
          Attachments
          <span className="ml-1 font-normal" style={{ color: "var(--color-text-secondary)" }}>
            (optional, max {MAX_ATTACHMENTS})
          </span>
        </label>

        {attachments.length > 0 && (
          <div className="mb-2 space-y-1.5">
            {attachments.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
                style={{ borderColor: "var(--color-border-default)" }}
              >
                <span className="truncate text-body" style={{ color: "var(--color-text-primary)" }}>
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="ml-2 shrink-0 rounded p-0.5 transition-colors hover:bg-[var(--color-bg-subtle)]"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} />
                </button>
              </div>
            ))}
          </div>
        )}

        {attachments.length < MAX_ATTACHMENTS && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-body transition-colors hover:bg-[var(--color-bg-subtle)]"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
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
          <p className="mt-1 text-body-sm" style={{ color: "var(--color-error-text)" }}>{errors.attachments}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={uploading || createTicket.isPending}
        className="w-full rounded-lg py-2.5 text-body font-medium text-white transition-opacity disabled:opacity-60"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        {uploading ? "Uploading attachments…" : createTicket.isPending ? "Submitting..." : "Submit Ticket"}
      </button>
    </form>
  );
}

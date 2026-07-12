"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";

interface SendReviewModalProps {
  open: boolean;
  onClose: () => void;
  siteId: string;
  siteName: string;
}

export function SendReviewModal({ open, onClose, siteId, siteName }: SendReviewModalProps) {
  const { addToast } = useToast();
  const [note, setNote] = useState("");

  const utils = trpc.useUtils();

  const submitMutation = trpc.reviews.submit.useMutation({
    onSuccess: () => {
      utils.reviews.list.invalidate();
      addToast("success", "Sent for review", "An admin has been notified.");
      setNote("");
      onClose();
    },
    onError: (err) => addToast("error", "Couldn't send for review", err.message),
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "#0000004D" }} onClick={onClose}>
      <div className="w-[440px] rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>Send for Review</h2>
          <button onClick={onClose}><X className="h-5 w-5" style={{ color: "var(--color-text-secondary)" }} /></button>
        </div>

        <p className="mt-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Submit &apos;{siteName}&apos; for admin review. Reviewers approve it for publishing or ask for changes.
        </p>

        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
            Note{" "}
            <span className="font-normal" style={{ color: "var(--color-text-muted)" }}>(optional)</span>
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="Add context for the reviewer, e.g. what changed since last time..."
            className="w-full resize-none rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-primary)]"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
            autoFocus
          />
        </div>

        <div className="mt-4 flex gap-2 justify-end">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm" style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}>
            Cancel
          </button>
          <button
            disabled={submitMutation.isPending}
            onClick={() => submitMutation.mutate({ siteId, note: note.trim() || undefined })}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {submitMutation.isPending ? "Sending..." : "Send for Review"}
          </button>
        </div>
      </div>
    </div>
  );
}

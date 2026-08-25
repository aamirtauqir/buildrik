"use client";
import { useState } from "react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { Modal } from "@/components/dashboard/primitives";

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
    onSuccess: (result) => {
      utils.reviews.list.invalidate();
      /* This said "An admin has been notified." unconditionally. On a one-seat
         workspace the requester is the only admin and the notify filter excludes
         them, so nobody is emailed — which is every new workspace. */
      addToast(
        "success",
        "Sent for review",
        result.adminsNotified > 0
          ? `${result.adminsNotified} admin${result.adminsNotified === 1 ? "" : "s"} notified.`
          : "You're the only admin on this workspace, so no notification was sent.",
      );
      setNote("");
      onClose();
    },
    onError: (err) => addToast("error", "Couldn't send for review", err.message),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Send for Review"
      width={440}
      footer={
        <>
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-body" style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}>
            Cancel
          </button>
          <button
            disabled={submitMutation.isPending}
            onClick={() => submitMutation.mutate({ siteId, note: note.trim() || undefined })}
            className="rounded-lg px-4 py-2 text-body font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {submitMutation.isPending ? "Sending..." : "Send for Review"}
          </button>
        </>
      }
    >
      <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>
        Submit &apos;{siteName}&apos; for admin review. Reviewers approve it for publishing or ask for changes.
      </p>

      <div className="mt-4">
        <label className="mb-1.5 block text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
          Note{" "}
          <span className="font-normal" style={{ color: "var(--color-text-muted)" }}>(optional)</span>
        </label>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          placeholder="Add context for the reviewer, e.g. what changed since last time..."
          className="w-full resize-none rounded-lg border px-3 py-2.5 text-body outline-none transition-colors focus:border-[var(--color-primary)]"
          style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
          autoFocus
        />
      </div>
    </Modal>
  );
}

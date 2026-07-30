"use client";

import { useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { LoadingSkeleton, ErrorState } from "@/components/states";

interface DraftPin {
  x: number;
  y: number;
}

/**
 * Comment viewer-overlay (redesign E7). A viewer pins change-requests directly on
 * the site preview — click anywhere to drop a pin + write a note (no canvas
 * access); the agency resolves. Pins are stored as 0..1 fractions so they sit on
 * the same spot at any size. Renders the published site in an iframe when there
 * is one, otherwise the site thumbnail as a stand-in preview.
 */
export function CommentPreview({
  siteId,
  siteName,
  previewUrl,
  thumbnail,
  canResolve,
}: {
  siteId: string;
  siteName: string;
  previewUrl: string | null;
  thumbnail: string | null;
  canResolve: boolean;
}) {
  const { addToast } = useToast();
  const stageRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<DraftPin | null>(null);
  const [draftBody, setDraftBody] = useState("");
  const [openPinId, setOpenPinId] = useState<string | null>(null);

  const pinsQuery = trpc.comments.list.useQuery({ siteId, status: "OPEN" });

  const createMut = trpc.comments.create.useMutation({
    onSuccess: () => {
      addToast("success", "Comment added");
      setDraft(null);
      setDraftBody("");
      pinsQuery.refetch();
    },
    onError: (err) => addToast("error", "Couldn't add comment", err.message),
  });
  const resolveMut = trpc.comments.resolve.useMutation({
    onSuccess: () => {
      addToast("success", "Resolved");
      setOpenPinId(null);
      pinsQuery.refetch();
    },
    onError: (err) => addToast("error", "Couldn't resolve", err.message),
  });

  function onStageClick(e: React.MouseEvent) {
    if (draft || openPinId) {
      setDraft(null);
      setOpenPinId(null);
      return;
    }
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    setDraft({ x, y });
    setDraftBody("");
  }

  const pins = pinsQuery.data ?? [];

  return (
    <div>
      <header className="mb-4">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Feedback — {siteName}</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Click anywhere on the preview to pin a change-request.
        </p>
      </header>

      {pinsQuery.isLoading ? (
        <LoadingSkeleton rows={2} variant="card" />
      ) : pinsQuery.isError ? (
        <ErrorState title="Couldn't load comments" onRetry={() => pinsQuery.refetch()} />
      ) : (
        <div
          ref={stageRef}
          onClick={onStageClick}
          className="relative mx-auto w-full max-w-3xl cursor-crosshair overflow-hidden rounded-lg border"
          style={{ borderColor: "var(--color-border-default)", aspectRatio: "16 / 10", backgroundColor: "var(--color-bg-subtle)" }}
        >
          {previewUrl ? (
            <iframe src={previewUrl} title="Site preview" className="pointer-events-none h-full w-full" />
          ) : thumbnail ? (
            <img src={thumbnail} alt={siteName} className="pointer-events-none h-full w-full object-cover object-top" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm" style={{ color: "var(--color-text-muted)" }}>
              Publish this site to preview it — pins still work for now.
            </div>
          )}

          {pins.map((pin, i) => (
            <button
              key={pin.id}
              onClick={(e) => {
                e.stopPropagation();
                setOpenPinId(openPinId === pin.id ? null : pin.id);
                setDraft(null);
              }}
              className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[11px] font-bold text-white shadow"
              style={{ left: `${(pin.x ?? 0) * 100}%`, top: `${(pin.y ?? 0) * 100}%`, backgroundColor: "var(--color-primary)" }}
              aria-label={`Comment ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}

          {pins.map((pin) =>
            openPinId === pin.id ? (
              <div
                key={`pop-${pin.id}`}
                onClick={(e) => e.stopPropagation()}
                className="absolute z-10 w-56 -translate-x-1/2 rounded-lg border bg-white p-3 shadow-lg"
                style={{ left: `${(pin.x ?? 0) * 100}%`, top: `calc(${(pin.y ?? 0) * 100}% + 16px)`, borderColor: "var(--color-border-default)" }}
              >
                <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>{pin.body}</p>
                {canResolve && (
                  <button
                    onClick={() => resolveMut.mutate({ id: pin.id, siteId, status: "RESOLVED" })}
                    disabled={resolveMut.isPending}
                    className="mt-2 flex items-center gap-1 text-xs font-medium disabled:opacity-50"
                    style={{ color: "var(--color-primary)" }}
                  >
                    <Check className="h-3.5 w-3.5" /> Resolve
                  </button>
                )}
              </div>
            ) : null,
          )}

          {draft && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute z-10 w-60 -translate-x-1/2 rounded-lg border bg-white p-3 shadow-lg"
              style={{ left: `${draft.x * 100}%`, top: `calc(${draft.y * 100}% + 8px)`, borderColor: "var(--color-border-default)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>New comment</span>
                <button onClick={() => setDraft(null)} aria-label="Cancel"><X className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} /></button>
              </div>
              <textarea
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
                placeholder="Describe the change…"
                rows={2}
                autoFocus
                className="mt-2 w-full rounded border px-2 py-1.5 text-sm"
                style={{ borderColor: "var(--color-border-default)" }}
              />
              <button
                onClick={() => createMut.mutate({ siteId, x: draft.x, y: draft.y, body: draftBody.trim() })}
                disabled={!draftBody.trim() || createMut.isPending}
                className="mt-2 w-full rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {createMut.isPending ? "Adding…" : "Add comment"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

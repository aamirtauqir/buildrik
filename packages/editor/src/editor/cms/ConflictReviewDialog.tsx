/**
 * ConflictReviewDialog — "Review record changes" (design-2l9 165:2414): the
 * fields where this device's copy and the latest saved record differ, read
 * from the server when the review opens (the CONFLICT answer carries only a
 * stamp). Keep mine applies YOUR changed fields — those you edited since the
 * record was opened — over the latest saved record; every other field takes
 * the latest version. Use theirs takes the server's copy whole.
 *
 * If the latest copy cannot be read the dialog says so and still offers the
 * whole-record choice (Keep mine re-sends this device's copy unmerged).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { CMSField } from "@/shared/types/cms";
import type { CmsConflict } from "@/services/cmsSync";
import { Button, Modal } from "@/editor/chrome-ui";

export interface ConflictReviewDialogProps {
  open: boolean;
  conflict: CmsConflict;
  fields: CMSField[];
  /** The record's values when this sheet opened it — what "your changes" are measured from. */
  base: Record<string, unknown>;
  resolving: boolean;
  onCancel: () => void;
  onKeepMine: (merged: Record<string, unknown> | undefined) => void;
  onUseTheirs: () => void;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? "") === JSON.stringify(b ?? "");
const shown = (v: unknown): string => {
  if (v === undefined || v === null || v === "") return "Empty";
  const text = typeof v === "string" ? v.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : Array.isArray(v) ? v.join(", ") : String(v);
  return text.length > 140 ? `${text.slice(0, 140)}…` : text;
};

export function ConflictReviewDialog({ open, conflict, fields, base, resolving, onCancel, onKeepMine, onUseTheirs }: ConflictReviewDialogProps) {
  const [theirs, setTheirs] = React.useState<Record<string, unknown> | null | "loading" | "failed">("loading");
  React.useEffect(() => {
    if (!open) return;
    let live = true;
    setTheirs("loading");
    if (!conflict.theirs) {
      setTheirs("failed");
      return;
    }
    conflict.theirs().then(
      (t) => live && setTheirs(t),
      () => live && setTheirs("failed"),
    );
    return () => {
      live = false;
    };
  }, [open, conflict]);

  const mine = conflict.mine ?? {};
  const loaded = theirs !== "loading" && theirs !== "failed" && theirs !== null;
  const diff = loaded ? fields.filter((f) => !same(mine[f.slug], theirs[f.slug])) : [];
  const merged = () => {
    if (!loaded) return undefined;
    const out: Record<string, unknown> = { ...theirs };
    for (const f of fields) if (!same(mine[f.slug], base[f.slug])) out[f.slug] = mine[f.slug];
    return out;
  };

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Review record changes"
      kind="form"
      /* 165:2414 — a 720 dialog. */
      width="xl"
      testId="cms-conflict-review"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} data-testid="cms-conflict-cancel">
            Cancel
          </Button>
          <Button variant="secondary" disabled={resolving} onClick={onUseTheirs} data-testid="cms-sheet-use-theirs">
            Use theirs
          </Button>
          <Button disabled={resolving || theirs === "loading"} onClick={() => onKeepMine(merged())} data-testid="cms-sheet-keep-mine">
            Keep mine
          </Button>
        </>
      }
    >
      <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
        {loaded
          ? "Only changed fields are shown. Keep mine applies your changed fields to the latest saved record; untouched fields use the latest version."
          : theirs === "loading"
            ? "Reading the latest saved record…"
            : theirs === null
              ? "The latest saved record could not be found. Keep mine saves your copy again; Use theirs takes what the server holds."
              : "The latest saved record couldn’t be read. Keep mine saves your whole copy over it; Use theirs takes the server’s copy."}
      </p>
      {diff.map((f) => (
        <div key={f.id} className="tw:mt-4 tw:flex tw:flex-col tw:gap-2" data-testid={`cms-conflict-field-${f.slug}`}>
          <span className="tw:text-[12px] tw:font-semibold tw:leading-[18px] tw:text-[var(--bk-ink)]">{f.name}</span>
          <span className="tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">{`Mine: ${shown(mine[f.slug])}`}</span>
          <span className="tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">{`Theirs · latest saved: ${shown(loaded ? theirs[f.slug] : undefined)}`}</span>
        </div>
      ))}
      {loaded && diff.length === 0 ? (
        <p className="tw:m-0 tw:mt-4 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-soft)]">No field differs from the latest saved record.</p>
      ) : null}
    </Modal>
  );
}

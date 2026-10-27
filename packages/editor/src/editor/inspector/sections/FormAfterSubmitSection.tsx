/**
 * Behavior › After submit — 2L9 boards 156:6055 (F10) … 156:10131 (F17):
 * Then (Show message / Redirect), Message or Redirect to; Notifications ›
 * Send to; Spam protection › "Block automated submissions" (Applies on next
 * publish — the honeypot field is written into the published form); the
 * Form settings status row (Saved / Saving… / "Couldn’t save — your message
 * is still here." + Retry / "Choose a destination to save") and the note
 * "Saved separately from page edits; outside document Undo."
 *
 * The board also tags After submit "Applies on next publish". The code says
 * otherwise — the public form route reads the action, message and redirect
 * from the server row at submit time, so they apply on save — so that tag is
 * not drawn (`authority: code:after-submit-live-on-save`). The Fields rows
 * (`FormFieldsSection.tsx`) edit the form's own children; these rows edit the
 * form's server-side FormBlock row (`forms.getBlock` / `forms.updateBlock`) —
 * what happens once a visitor submits: show a message or redirect, who gets
 * notified, and whether the honeypot spam guard is on.
 *
 * The row is keyed by (siteId, blockId = the form element's own id):
 * `lib/publish-forms.ts` wires a published form to
 * `/api/public/forms/<siteId>/<elementId>`, and the publish worker upserts the
 * FormBlock row under that same (siteId, blockId) — so a setting saved here
 * before the form is ever published still lands on the row publish later
 * updates. The row's own `id` is a surrogate.
 *
 * `successAction`/`redirectUrl` are validated together server-side (a
 * REDIRECT row needs a URL) — `save()` always sends both when either
 * changes, using the latest known value of the other, and skips the network
 * call entirely for the one genuinely incomplete state (REDIRECT just
 * selected, no URL typed yet) rather than firing a call the schema will
 * reject and leaving the optimistic UI lying about what's actually saved.
 *
 * `notifyEmail` requires the ADMIN site role server-side (same precedent as
 * the outbound-webhook gate, `account.ts` integrations.add — reading who a
 * form's submissions get emailed to is a data-exfil surface). The editor does
 * not know the role up front: a non-admin's edit is reverted on the
 * FORBIDDEN the server sends back, and the row then reads the board's
 * "Changing Send to needs Admin access." (F15); every other field here stays
 * EDITOR-writable.
 *
 * A failed save keeps what the user typed (F12): the row is not reverted,
 * the status says so and Retry sends the same change again. A refusal the
 * server explains (a Zod message) shows that sentence instead — retrying it
 * would fail the same way.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { getBuildrikClient } from "@/services/api-client";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { Button } from "@/editor/chrome-ui";
import { Section, SelectRow, type SectionTier } from "../shared/controls";
import { GROUP_TITLE } from "../shared/controls/controlClasses";
import { pageFileNames } from "@/engine/export/pageFiles";
import { CommitRow, NoteRow } from "./behaviourRows";
import { CheckRow } from "../shared/controls/CheckRow";

export interface FormAfterSubmitSectionProps {
  elementId: string;
  composer: Composer | null;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  tier?: SectionTier;
}

interface Settings {
  successMessage: string | null;
  successAction: "MESSAGE" | "REDIRECT";
  redirectUrl: string | null;
  notifyEmail: string | null;
  spamProtection: boolean;
}

/** Validated together server-side — always travel together in one call. */
const LINKED_FIELDS = new Set<keyof Settings>(["successAction", "redirectUrl"]);

type Status =
  | { kind: "saved" }
  | { kind: "saving" }
  | { kind: "incomplete" }
  | { kind: "failed"; retry: () => void }
  | { kind: "refused"; message: string };

function isForbidden(e: unknown): boolean {
  return e instanceof Error && (e as { data?: { code?: string } }).data?.code === "FORBIDDEN";
}

/** "" and null both mean "unset" — a blur that didn't change anything must
 *  look identical to one that did, regardless of which of the two the
 *  server/local state happens to be holding. */
function valuesEqual(a: unknown, b: unknown): boolean {
  const normalize = (v: unknown) => (v === null || v === undefined || v === "" ? "" : v);
  return normalize(a) === normalize(b);
}

const CUSTOM = "__custom";

/** A page's served path, as the published site writes it (`pageFileNames`):
 *  the home page is "/", every other "/<slug>.html". */
const pagePath = (file: string) => (file === "index.html" ? "/" : `/${file}`);

/**
 * "Redirect to" (2L9 156:11319, F19): the site's pages in one select, the
 * same list a link chooses from, then "Custom URL…" for anything else — a
 * value that is not one of the pages is a custom URL.
 */
function RedirectRow({ composer, value, onCommit }: { composer: Composer | null; value: string; onCommit: (v: string) => void }) {
  const pages = composer?.elements.getAllPages() ?? [];
  const files = pageFileNames(pages);
  const options = pages.map((p) => ({ value: pagePath(files.get(p.id) ?? "index.html"), label: p.name }));
  const onPage = options.some((o) => o.value === value);
  const [custom, setCustom] = React.useState(Boolean(value) && !onPage);
  return (
    <>
      <SelectRow
        label="Redirect to"
        value={custom ? CUSTOM : onPage ? value : ""}
        placeholder="Choose page or URL…"
        options={[...options, { value: CUSTOM, label: "Custom URL…" }]}
        onChange={(v) => {
          setCustom(v === CUSTOM);
          if (v && v !== CUSTOM) onCommit(v);
        }}
      />
      {custom && (
        <CommitRow label="URL" type="text" placeholder="https://example.com/thanks" value={onPage ? "" : value} onCommit={onCommit} />
      )}
    </>
  );
}

export const FormAfterSubmitSection: React.FC<FormAfterSubmitSectionProps> = ({
  elementId,
  composer,
  isOpen,
  onToggle,
  tier = "tertiary",
}) => {
  const [settings, setSettings] = React.useState<Settings | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<Status>({ kind: "saved" });
  /* Learned from a FORBIDDEN: Send to is Admin-only for this user. */
  const [adminOnly, setAdminOnly] = React.useState(false);
  const projectId = React.useMemo(() => getSiteIdFromUrl(), []);
  // A FORBIDDEN reverts Send to, but the optimistic update and the revert can
  // land in one render — the text row would see no change and keep the
  // draft. Bumping this remounts it (`key`) so the revert is visible.
  const [revertToken, setRevertToken] = React.useState(0);

  const form = composer?.elements.getElement(elementId);

  React.useEffect(() => {
    let cancelled = false;
    if (!projectId || !elementId) return;
    setSettings(null);
    setLoadError(null);
    setStatus({ kind: "saved" });
    getBuildrikClient(DASHBOARD_URL)
      .forms.getBlock.query({ siteId: projectId, blockId: elementId })
      .then((s) => {
        if (!cancelled) setSettings(s);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Failed to load form settings.");
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, elementId]);

  /** One write to the server row. `previousNotify` is what Send to goes back
   *  to if the server refuses it as Admin-only. */
  const send = (payload: Partial<Settings>, previousNotify: string | null) => {
    if (!projectId) return;
    setStatus({ kind: "saving" });
    // The wire schema takes `string | undefined`, not `null` — the local
    // Settings shape mirrors the server's read shape (`null` = "unset").
    const wire = Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, v === null ? undefined : v]));
    getBuildrikClient(DASHBOARD_URL)
      .forms.updateBlock.mutate({ siteId: projectId, blockId: elementId, ...wire })
      .then(() => setStatus({ kind: "saved" }))
      .catch((e) => {
        if (isForbidden(e) && "notifyEmail" in payload) {
          setSettings((s) => (s ? { ...s, notifyEmail: previousNotify } : s));
          setRevertToken((n) => n + 1);
          setAdminOnly(true);
          setStatus({ kind: "saved" });
          return;
        }
        /* L3-028: the field's own sentence, not "notifyEmail: …" — the
           formatter's structured issues carry it without the key. */
        const message = (e as { data?: { zodIssues?: Array<{ message: string }> } }).data?.zodIssues?.[0]?.message;
        setStatus(message ? { kind: "refused", message } : { kind: "failed", retry: () => send(payload, previousNotify) });
      });
  };

  const save = (patch: Partial<Settings>) => {
    if (!projectId || !settings) return;

    // A blur that didn't actually change the field (an EDITOR tabbing
    // through, or re-blurring an already-saved value) must not fire a
    // write — for `notifyEmail` specifically, an EDITOR would otherwise
    // hit a server FORBIDDEN having never touched the value.
    const changed = Object.entries(patch).some(([k, v]) => !valuesEqual(v, settings[k as keyof Settings]));
    if (!changed) return;

    const next = { ...settings, ...patch };
    setSettings(next);

    // successAction/redirectUrl are one server-side invariant — bundle both
    // current values whenever either is touched, so an edit to one never
    // strands the other at a stale value on the row.
    const linked = Object.keys(patch).some((k) => LINKED_FIELDS.has(k as keyof Settings));
    const payload: Partial<Settings> = linked ? { ...patch, successAction: next.successAction, redirectUrl: next.redirectUrl } : { ...patch };

    // A REDIRECT with no URL yet — the instant after switching the select,
    // before the URL field has been typed into — is genuinely incomplete.
    // Don't send it (the schema would reject it anyway); wait for the URL.
    if (linked && next.successAction === "REDIRECT" && !next.redirectUrl) {
      setStatus({ kind: "incomplete" });
      return;
    }
    send(payload, settings.notifyEmail);
  };

  if (!composer || !form) return null;

  return (
    <Section title="After submit" icon="Send" isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-form-after-submit">
      {!projectId ? (
        <NoteRow>Open this site from the dashboard to edit form settings.</NoteRow>
      ) : !settings ? (
        <NoteRow tone={loadError ? "error" : "muted"}>{loadError ?? "Loading form settings…"}</NoteRow>
      ) : (
        <>
          <SelectRow
            label="Then"
            /* "Show message" is the select's empty choice (SelectRow always draws one). */
            value={settings.successAction === "MESSAGE" ? "" : settings.successAction}
            onChange={(v) => save({ successAction: (v || "MESSAGE") as Settings["successAction"] })}
            options={[{ value: "REDIRECT", label: "Redirect" }]}
            placeholder="Show message"
          />
          {settings.successAction === "MESSAGE" ? (
            <CommitRow
              stacked
              label="Message"
              placeholder="Thanks — your message was sent."
              value={settings.successMessage ?? ""}
              onCommit={(v) => save({ successMessage: v })}
            />
          ) : (
            <RedirectRow composer={composer} value={settings.redirectUrl ?? ""} onCommit={(v) => save({ redirectUrl: v })} />
          )}
          <div className={GROUP_TITLE}>Notifications</div>
          {adminOnly ? (
            <NoteRow testId="form-after-submit-admin-only">Changing Send to needs Admin access.</NoteRow>
          ) : (
            <CommitRow
              key={`notify-email-${revertToken}`}
              label="Send to"
              type="email"
              placeholder="you@company.com"
              value={settings.notifyEmail ?? ""}
              onCommit={(v) => save({ notifyEmail: v })}
            />
          )}
          <div className={GROUP_TITLE}>Spam protection</div>
          <NoteRow testId="form-spam-next-publish">Applies on next publish</NoteRow>
          <CheckRow
            label="Block automated submissions"
            checked={settings.spamProtection}
            onChange={(checked) => save({ spamProtection: checked })}
          />
          <div className={GROUP_TITLE}>Form settings status</div>
          {/* A Redirect with no destination is not saved, whether it was just
              chosen or loaded that way (156:11319). */}
          <FormSettingsStatus
            status={status.kind === "saved" && settings.successAction === "REDIRECT" && !settings.redirectUrl ? { kind: "incomplete" } : status}
          />
          <NoteRow testId="form-after-submit-note">Saved separately from page edits; outside document Undo.</NoteRow>
        </>
      )}
    </Section>
  );
};

function FormSettingsStatus({ status }: { status: Status }) {
  switch (status.kind) {
    case "saving":
      return <NoteRow testId="form-settings-status">Saving…</NoteRow>;
    case "incomplete":
      return <NoteRow testId="form-settings-status">Choose a destination to save</NoteRow>;
    case "refused":
      return (
        <NoteRow tone="error" testId="form-settings-status">
          {status.message}
        </NoteRow>
      );
    case "failed":
      /* 156:7230: a red line (no band) and a bordered Retry under it. */
      return (
        <>
          <p role="alert" data-testid="form-settings-status" className="tw:m-0 tw:py-2 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-error-text)]">
            Couldn’t save — your message is still here.
          </p>
          <Button
            color="light"
            size="xs"
            data-testid="form-settings-retry"
            onClick={status.retry}
            className="tw:h-8 tw:w-24 tw:text-[13px] tw:font-normal tw:text-[var(--bk-ink)] tw:focus:ring-0"
          >
            Retry
          </Button>
        </>
      );
    default:
      return <NoteRow testId="form-settings-status">Saved</NoteRow>;
  }
}

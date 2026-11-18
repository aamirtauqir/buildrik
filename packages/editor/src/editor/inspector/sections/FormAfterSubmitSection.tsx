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
import { InspectorFieldContext, useInspectorField } from "@/editor/inspector/shared/controls/InspectorFieldContext";
import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus";
import * as React from "react";
import type { Composer } from "@/engine";
import { getBuildrikClient } from "@/services/api-client";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { Button, Popover, TextField } from "@/editor/chrome-ui";
import { Section, SelectRow, type SectionTier } from "../shared/controls";
import { GROUP_TITLE, WIDE_BUTTON } from "../shared/controls/controlClasses";
import { pageFileNames } from "@/engine/export/pageFiles";
import { CommitRow, NoteRow, PickRow } from "./behaviourRows";
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

/** A page's served path, as the published site writes it (`pageFileNames`):
 *  the home page is "/", every other "/<slug>.html". */
const pagePath = (file: string) => (file === "index.html" ? "/" : `/${file}`);

/**
 * "Redirect to" (2L9 F25, 159:8570): the row opens "Choose page or URL" beside
 * the column — a search, the site's real pages as "{name} · {path}" (the
 * same served paths a link uses), then "Or use an absolute URL" with its
 * own Use URL. A value that is not one of the pages is a URL.
 */
function RedirectRow({ composer, value, onCommit }: { composer: Composer | null; value: string; onCommit: (v: string) => void }) {
  const field = useInspectorField();
  const pages = composer?.elements.getAllPages() ?? [];
  const files = pageFileNames(pages);
  const options = pages.map((p) => ({ value: pagePath(files.get(p.id) ?? "index.html"), label: p.name }));
  const current = options.find((o) => o.value === value);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [url, setUrl] = React.useState(current ? "" : value);
  const [urlError, setUrlError] = React.useState(false);
  const urlErrorId = React.useId();
  const shown = options.filter((o) => `${o.label} ${o.value}`.toLowerCase().includes(query.trim().toLowerCase()));

  const close = () => {
    setOpen(false);
    setQuery("");
    setUrlError(false);
  };
  const choose = (v: string) => {
    onCommit(v);
    close();
  };
  const applyUrl = () => {
    /* An incomplete URL is refused here, the draft kept, nothing saved. */
    if (!COMPLETE_URL.test(url.trim())) return setUrlError(true);
    choose(url.trim());
  };

  return (
    <Popover
      open={open}
      onClose={close}
      placement="bottom-end"
      beside=".layout-shell__inspector"
      label="Choose page or URL"
      block
      className="tw:w-[240px] tw:p-2"
      trigger={
        <div className="tw:min-w-0 tw:flex-1">
          <PickRow
            label="Redirect to"
            value={current ? current.label : value || "Choose page or URL…"}
            onOpen={() => {
              if (!field.readOnly) setOpen((v) => !v);
            }}
            testId="form-redirect-to"
          />
        </div>
      }
    >
      <div className="tw:flex tw:flex-col tw:gap-1" data-testid="form-redirect-picker">
        <div className="tw:px-1 tw:pb-1 tw:text-[12px] tw:font-semibold tw:text-[var(--bk-ink)]">Choose page or URL</div>
        <TextField
          aria-label="Search pages"
          placeholder="Search pages…"
          className="bdi-text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="tw:flex tw:flex-col" role="list" aria-label="Pages">
          {shown.map((o) => (
            <Button
              key={o.value}
              type="button"
              variant="ghost"
              size="xs"
              role="listitem"
              aria-current={o.value === value || undefined}
              className="tw:h-8 tw:w-full tw:justify-start tw:px-1 tw:text-[12px] tw:font-normal tw:text-[var(--bk-ink)]"
              onClick={() => choose(o.value)}
            >
              {o.label} · {o.value}
            </Button>
          ))}
          {shown.length === 0 ? <NoteRow>No page matches “{query}”.</NoteRow> : null}
        </div>
        <label htmlFor="form-redirect-url" className="tw:px-1 tw:pt-1 tw:text-[12px] tw:text-[var(--bk-ink-muted)]">
          Or use an absolute URL
        </label>
        <TextField
          id="form-redirect-url"
          className={`bdi-text${urlError ? " tw:border-[var(--bk-error)]!" : ""}`}
          placeholder="https://example.com/thanks"
          value={url}
          aria-invalid={urlError || undefined}
          aria-describedby={urlError ? urlErrorId : undefined}
          onChange={(e) => {
            setUrl(e.target.value);
            setUrlError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") applyUrl();
          }}
        />
        <Button type="button" variant="ghost" size="xs" className="tw:h-8 tw:w-full tw:justify-start tw:px-1 tw:text-[12px] tw:font-normal" onClick={close}>
          Cancel
        </Button>
        {urlError ? (
          <p id={urlErrorId} role="alert" className="tw:m-0 tw:px-1 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-error-text)]" data-testid="form-redirect-url-error">
            Enter a complete https:// or http:// URL.
          </p>
        ) : null}
        <Button color="light" size="xs" className={WIDE_BUTTON} disabled={!url.trim()} onClick={applyUrl} data-testid="form-redirect-use-url">
          Use URL
        </Button>
      </div>
    </Popover>
  );
}

/** A URL a visitor can be sent to: http(s), a host with a dot, no spaces. */
const COMPLETE_URL = /^https?:\/\/[^\s/?#]+\.[^\s/?#]+(?:[/?#]\S*)?$/i;

export const FormAfterSubmitSection: React.FC<FormAfterSubmitSectionProps> = ({
  elementId,
  composer,
  isOpen,
  onToggle,
  tier = "tertiary",
}) => {
  const fieldCtx = React.useContext(InspectorFieldContext);
  const online = useOnlineStatus();
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
        /* 2L9 F14: offline, the service settings cannot save — shown, read
           only, and said; the form's fields (Content) stay editable. */
        <InspectorFieldContext.Provider value={online ? fieldCtx : { ...fieldCtx, readOnly: true }}>
          {/* 2L9 F14 (156:8406): offline the settings read as shut — their
              controls and the checkbox row greyed, labels left at ink. */}
          <div
            className={online ? "tw:contents" : "tw:contents tw:[&_.bdi-row-content]:opacity-70 tw:[&_input[type=checkbox]]:opacity-50 tw:[&_[data-testid=inspector-row-block-automated-submissions]_label]:text-[var(--bk-ink-muted)]!"}
            data-offline={online ? undefined : "true"}
            data-testid="form-settings-controls"
          >
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
          {online ? null : (
            <p className="tw:m-0 tw:py-1 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-warning-text)]" data-testid="form-settings-offline">
              Needs a connection. You can still edit form fields.
            </p>
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
          </div>
          <div className={GROUP_TITLE}>Form settings status</div>
          {/* A Redirect with no destination is not saved, whether it was just
              chosen or loaded that way (156:11319). */}
          {online ? (
            <FormSettingsStatus
              status={status.kind === "saved" && settings.successAction === "REDIRECT" && !settings.redirectUrl ? { kind: "incomplete" } : status}
            />
          ) : (
            <NoteRow testId="form-settings-status">Needs a connection</NoteRow>
          )}
          <NoteRow testId="form-after-submit-note">Saved separately from page edits; outside document Undo.</NoteRow>
        </InspectorFieldContext.Provider>
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

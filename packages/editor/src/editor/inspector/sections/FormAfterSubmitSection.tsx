/**
 * Form › AFTER SUBMIT + PROTECTION — board 4428:141878. The FIELDS rows
 * (`FormFieldsSection.tsx`) edit the form's own children; these rows edit the
 * form's server-side FormBlock row (`forms.getBlock` / `forms.updateBlock`) —
 * what happens once a visitor submits: show a message or redirect, who gets
 * notified, and whether the honeypot spam guard is on.
 *
 * The block's id IS the form element's own id (`lib/publish-forms.ts` wires a
 * published form to `/api/public/forms/<siteId>/<elementId>`, and the publish
 * worker upserts the FormBlock row under that same id) — so a setting saved
 * here before the form is ever published still lands on the row publish
 * later creates.
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
 * form's submissions get emailed to is a data-exfil surface). A non-admin's
 * edit is reverted on the FORBIDDEN the server sends back; every other field
 * here stays EDITOR-writable.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { getBuildrikClient } from "@/services/api-client";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { Select, TextInput, ToggleSwitch } from "@/editor/chrome-ui";
import { Section, type SectionTier } from "../shared/controls";

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

const ROW = "tw:flex tw:items-center tw:gap-2 tw:min-h-8";
const LABEL = "tw:w-[88px] tw:flex-none tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink-muted)]";

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

export const FormAfterSubmitSection: React.FC<FormAfterSubmitSectionProps> = ({
  elementId,
  composer,
  isOpen,
  onToggle,
  tier = "tertiary",
}) => {
  const [settings, setSettings] = React.useState<Settings | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const projectId = React.useMemo(() => getSiteIdFromUrl(), []);
  // The text fields below are uncontrolled (`defaultValue` + commit-on-blur,
  // so typing doesn't fight a re-render) — reverting `settings` alone
  // wouldn't touch their DOM value, since `defaultValue` only applies on
  // mount. Bumping this remounts them (`key`) so a revert is actually
  // visible, not just true in state.
  const [revertToken, setRevertToken] = React.useState(0);

  const form = composer?.elements.getElement(elementId);

  React.useEffect(() => {
    let cancelled = false;
    if (!projectId || !elementId) return;
    setSettings(null);
    setError(null);
    getBuildrikClient(DASHBOARD_URL)
      .forms.getBlock.query({ siteId: projectId, blockId: elementId })
      .then((s) => {
        if (!cancelled) setSettings(s);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load form settings.");
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, elementId]);

  const save = (patch: Partial<Settings>) => {
    if (!projectId || !settings) return;

    // A blur that didn't actually change the field (an EDITOR tabbing
    // through, or re-blurring an already-saved value) must not fire a
    // write — for `notifyEmail` specifically, an EDITOR would otherwise
    // hit a server FORBIDDEN having never touched the value.
    const changed = Object.entries(patch).some(
      ([k, v]) => !valuesEqual(v, settings[k as keyof Settings]),
    );
    if (!changed) return;

    const prev = settings;
    const next = { ...settings, ...patch };
    setSettings(next);

    // successAction/redirectUrl are one server-side invariant — bundle both
    // current values whenever either is touched, so an edit to one never
    // strands the other at a stale value on the row.
    const linked = Object.keys(patch).some((k) => LINKED_FIELDS.has(k as keyof Settings));
    const payload: Partial<Settings> = linked
      ? { ...patch, successAction: next.successAction, redirectUrl: next.redirectUrl }
      : { ...patch };

    // A REDIRECT with no URL yet — the instant after switching the select,
    // before the URL field has been typed into — is genuinely incomplete.
    // Don't send it (the schema would reject it anyway); wait for the URL.
    if (linked && next.successAction === "REDIRECT" && !next.redirectUrl) return;

    setSaving(true);
    setError(null);
    // The wire schema takes `string | undefined`, not `null` — the local
    // Settings shape mirrors the server's read shape (`null` = "unset").
    const wire = Object.fromEntries(
      Object.entries(payload).map(([k, v]) => [k, v === null ? undefined : v]),
    );
    getBuildrikClient(DASHBOARD_URL)
      .forms.updateBlock.mutate({ siteId: projectId, blockId: elementId, ...wire })
      .catch((e) => {
        // Revert the optimistic update — otherwise the UI keeps showing a
        // value that was never actually saved (exactly I1's failure mode).
        setSettings(prev);
        setRevertToken((n) => n + 1);
        setError(
          isForbidden(e) && "notifyEmail" in patch
            ? "Only workspace Admins can change the notification email."
            : e instanceof Error
              ? e.message
              : "Failed to save.",
        );
      })
      .finally(() => setSaving(false));
  };

  if (!composer || !form) return null;

  return (
    <Section title="After submit" icon="Send" isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-form-after-submit">
      {!projectId ? (
        <div className="tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink-muted)]">
          Open this site from the dashboard to edit form settings.
        </div>
      ) : !settings ? (
        <div className="tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink-muted)]">
          {error ?? "Loading…"}
        </div>
      ) : (
        <>
          <div className={ROW}>
            <span className={LABEL}>Action</span>
            <Select
              sizing="sm"
              className="tw:flex-1 tw:min-w-0"
              aria-label="After-submit action"
              value={settings.successAction}
              onChange={(e) => save({ successAction: e.target.value as Settings["successAction"] })}
            >
              <option value="MESSAGE">Show message</option>
              <option value="REDIRECT">Redirect</option>
            </Select>
          </div>
          {settings.successAction === "MESSAGE" ? (
            <div className={ROW}>
              <span className={LABEL}>Message</span>
              <TextInput
                key={`message-${revertToken}`}
                sizing="sm"
                className="tw:flex-1 tw:min-w-0"
                aria-label="Success message"
                placeholder="Thanks — your message was sent."
                defaultValue={settings.successMessage ?? ""}
                onBlur={(e) => save({ successMessage: e.target.value })}
              />
            </div>
          ) : (
            <div className={ROW}>
              <span className={LABEL}>Redirect to</span>
              <TextInput
                key={`redirect-${revertToken}`}
                sizing="sm"
                type="url"
                className="tw:flex-1 tw:min-w-0"
                aria-label="Redirect URL"
                placeholder="https://example.com/thanks"
                defaultValue={settings.redirectUrl ?? ""}
                onBlur={(e) => save({ redirectUrl: e.target.value })}
              />
            </div>
          )}
          <div className={ROW}>
            <span className={LABEL}>Send to email</span>
            <TextInput
              key={`notify-email-${revertToken}`}
              sizing="sm"
              type="email"
              className="tw:flex-1 tw:min-w-0"
              aria-label="Notification email"
              placeholder="you@company.com"
              defaultValue={settings.notifyEmail ?? ""}
              onBlur={(e) => save({ notifyEmail: e.target.value })}
            />
          </div>
          <div className={ROW}>
            <span className={LABEL} id="form-spam-protection-label">Spam protection</span>
            <ToggleSwitch
              checked={settings.spamProtection}
              aria-labelledby="form-spam-protection-label"
              onChange={(checked) => save({ spamProtection: checked })}
            />
          </div>
          {error ? (
            <div className="tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-error)]">{error}</div>
          ) : saving ? (
            <div className="tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink-muted)]">Saving…</div>
          ) : null}
        </>
      )}
    </Section>
  );
};

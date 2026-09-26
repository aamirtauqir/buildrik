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

const ROW = "tw:flex tw:items-center tw:gap-2 tw:min-h-8";
const LABEL = "tw:w-[88px] tw:flex-none tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink-muted)]";

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
    const next = { ...settings, ...patch };
    setSettings(next);
    setSaving(true);
    setError(null);
    // The wire schema takes `string | undefined`, not `null` — the local
    // Settings shape mirrors the server's read shape (`null` = "unset").
    const wire = Object.fromEntries(
      Object.entries(patch).map(([k, v]) => [k, v === null ? undefined : v]),
    );
    getBuildrikClient(DASHBOARD_URL)
      .forms.updateBlock.mutate({ siteId: projectId, blockId: elementId, ...wire })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to save."))
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
            <span className={LABEL}>Spam protection</span>
            <ToggleSwitch
              checked={settings.spamProtection}
              label=""
              onChange={(checked) => save({ spamProtection: checked })}
            />
          </div>
          {error ? (
            <div className="tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-danger)]">{error}</div>
          ) : saving ? (
            <div className="tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink-muted)]">Saving…</div>
          ) : null}
        </>
      )}
    </Section>
  );
};

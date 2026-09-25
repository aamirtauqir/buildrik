/**
 * RedirectRepairCard — Clone 3519:19920 URL repair draft → 3519:20096 saved
 * (and the Our story pair, 3519:20272 → 3519:20448: same shape).
 *
 * The Pages door: after a page's slug is changed and saved in Page settings,
 * Settings → Redirects opens with this above the Redirects card. Draft:
 * `Redirect for <Page>` · `<site> · URL change /<old> → /<new>` · `From
 * path` / `To path` prefilled and editable · `301 · Permanent redirect` ·
 * `Save redirect` · Cancel · `Unsaved redirect · Save this rule for
 * <site>.` Save → `redirects.create` (301, the caller's) → saved: `Redirect
 * saved` · `/<old> → /<new> · 301` · `Back to <Page> SEO` (the caller
 * emits the two composer events). Cancel drops the draft. The frame draws
 * this on the pane itself, not in a card.
 *
 * Validation is the dialog's (3397:33620's copy, which drew exactly this
 * inline form); a refused create stays inline here, the draft intact.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { BK_LABEL_CLASS, Button, type CustomFlowbiteTheme, Label, TextInput } from "@/editor/chrome-ui";
import { SCREEN_FIELD_ERROR, SET_BTN } from "../shared";
import { FROM_PATH_ERROR, TO_URL_ERROR, isValidFromPath, isValidToUrl } from "./RedirectDialog";

export interface RedirectRepairCardProps {
  pageName: string;
  siteName: string;
  /** The slug change, as paths. */
  from: string;
  to: string;
  /** Set once the rule is on the server — the draft becomes `Redirect saved`. */
  saved: { fromPath: string; toUrl: string } | null;
  /** `redirects.create` (301). Resolve = the caller flips `saved`; reject = the reason stays under the fields. */
  onSave(fromPath: string, toUrl: string): Promise<void>;
  onCancel(): void;
  /** `Back to <Page> SEO`. */
  onBack(): void;
}

const PATH_INPUT_THEME: NonNullable<CustomFlowbiteTheme["textInput"]> = {
  field: { input: { sizes: { md: "tw:h-8 tw:py-0 tw:text-[13px] tw:[font-family:var(--bk-font-mono)]" } } },
};

const TITLE = "tw:m-0 tw:text-[length:var(--bk-text-14)] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]";
const LINE = "tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-soft)]";
const MUTED = "tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const LABEL = `${BK_LABEL_CLASS} tw:block tw:leading-4`;
const FIELD = "tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-1.5";

export function RedirectRepairCard({ pageName, siteName, from, to, saved, onSave, onCancel, onBack }: RedirectRepairCardProps) {
  const [fromPath, setFromPath] = React.useState(from);
  const [toPath, setToPath] = React.useState(to);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  /* A new slug change replaces the draft — the fields follow the door, not
     the last edit. Only on a CHANGE of door: useState already seeded the
     fields on mount, and re-running the reset then raced a keystroke made
     before the passive effect flushed — the typed path was overwritten with
     the prop (seen as a CI flake in RedirectsScreen's rerender test). */
  const doorRef = React.useRef({ from, to });
  React.useEffect(() => {
    if (doorRef.current.from === from && doorRef.current.to === to) return;
    doorRef.current = { from, to };
    setFromPath(from);
    setToPath(to);
    setBusy(false);
    setError(null);
  }, [from, to]);

  const fromValue = fromPath.trim();
  const toValue = toPath.trim();
  const fromError = fromValue !== "" && !isValidFromPath(fromValue) ? FROM_PATH_ERROR : null;
  const toError = toValue !== "" && !isValidToUrl(toValue) ? TO_URL_ERROR : null;
  const valid = fromValue !== "" && toValue !== "" && !fromError && !toError;

  const save = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSave(fromValue, toValue);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Couldn't save the redirect.");
    } finally {
      setBusy(false);
    }
  };

  if (saved) {
    return (
      <section className="tw:flex tw:flex-col tw:items-start tw:gap-2" data-testid="set-rd-repair-saved" aria-live="polite">
        <h3 className={TITLE}>Redirect saved</h3>
        <div className={LINE} data-testid="set-rd-repair-saved-line">
          {saved.fromPath} → {saved.toUrl} · 301
        </div>
        <Button type="button" size="xs" className={SET_BTN} onClick={onBack} data-testid="set-rd-repair-back">
          Back to {pageName} SEO
        </Button>
      </section>
    );
  }

  return (
    <section className="tw:flex tw:flex-col tw:gap-3" data-testid="set-rd-repair" aria-labelledby="set-rd-repair-title">
      <div className="tw:flex tw:flex-col tw:gap-1">
        <h3 id="set-rd-repair-title" className={TITLE}>
          Redirect for {pageName}
        </h3>
        <div className={LINE} data-testid="set-rd-repair-line">
          {siteName ? `${siteName} · ` : ""}URL change {from} → {to}
        </div>
      </div>

      <div className="tw:flex tw:gap-6 tw:pl-4">
        <div className={FIELD}>
          <Label htmlFor="set-rd-repair-from" className={LABEL}>
            From path
          </Label>
          <TextInput
            id="set-rd-repair-from"
            type="text"
            value={fromPath}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromPath(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            theme={PATH_INPUT_THEME}
            aria-invalid={fromError ? true : undefined}
            aria-describedby={fromError ? "set-rd-repair-from-error" : undefined}
            disabled={busy}
            data-testid="set-rd-repair-from"
          />
          {fromError ? (
            <div id="set-rd-repair-from-error" role="alert" className={SCREEN_FIELD_ERROR} data-testid="set-rd-repair-from-error">
              {fromError}
            </div>
          ) : null}
        </div>
        <div className={FIELD}>
          <Label htmlFor="set-rd-repair-to" className={LABEL}>
            To path
          </Label>
          <TextInput
            id="set-rd-repair-to"
            type="text"
            value={toPath}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToPath(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            theme={PATH_INPUT_THEME}
            aria-invalid={toError ? true : undefined}
            aria-describedby={toError ? "set-rd-repair-to-error" : undefined}
            disabled={busy}
            data-testid="set-rd-repair-to"
          />
          {toError ? (
            <div id="set-rd-repair-to-error" role="alert" className={SCREEN_FIELD_ERROR} data-testid="set-rd-repair-to-error">
              {toError}
            </div>
          ) : null}
        </div>
      </div>

      <div className={LINE}>301 · Permanent redirect</div>

      <div className="tw:flex tw:items-center tw:gap-2">
        <Button
          type="button"
          size="xs"
          className={SET_BTN}
          disabled={!valid || busy}
          onClick={() => void save()}
          data-testid="set-rd-repair-save"
        >
          {busy ? "Saving…" : "Save redirect"}
        </Button>
        <Button
          type="button"
          size="xs"
          variant="ghost"
          className={SET_BTN}
          disabled={busy}
          onClick={onCancel}
          data-testid="set-rd-repair-cancel"
        >
          Cancel
        </Button>
      </div>

      {error ? (
        <div role="alert" className={SCREEN_FIELD_ERROR} data-testid="set-rd-repair-error">
          {error}
        </div>
      ) : null}

      <div className={MUTED} data-testid="set-rd-repair-note">
        Unsaved redirect · Save this rule for {siteName || "this site"}.
      </div>
    </section>
  );
}

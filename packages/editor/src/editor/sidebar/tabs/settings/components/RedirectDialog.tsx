/**
 * RedirectDialog — Clone 4254:75736 `Add redirect` and 4254:75747 `Edit
 * redirect` (640), one component in two modes.
 *
 * Opened by the header's `Add redirect` (and the empty card's), or by a
 * table row's `Edit`. `<Add|Edit> redirect` · `<site> · Redirects` · `From
 * path` (`/old-url`) · `To URL` (`/new-url`) · `Redirect type` segmented
 * `301 Permanent · 302 Temporary` · the boxed `Match query strings` row +
 * toggle · `Notes` · the 301/302 note · Cancel · `Add redirect` /
 * `Save redirect`, enabled only once both paths are valid; edit mode adds
 * `Delete redirect` (danger, left) which deletes AT ONCE — the frame draws
 * no confirm. Validation is 3397:33620's copy: a From path must start with
 * `/`, a To URL with `/` or `http(s)://`. A refused create / update / delete
 * keeps the dialog open with the server's reason under the form (`A
 * redirect from <path> already exists.`); success is the caller's to close
 * (it re-lists).
 *
 * The dialog is pure UI: the server calls come in as props, so the screen
 * stays the one place the settings tab talks to tRPC.
 *
 * Shape from `libraryModal.ts` (title 16/600, body 13 ink-soft, 32-high
 * buttons, 8 gap) at the Clone's 640; controls 32 (density-32).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  BK_LABEL_CLASS,
  Button,
  type CustomFlowbiteTheme,
  Label,
  ModalBody,
  ModalContent,
  ModalRoot,
  TextInput,
  ToggleSwitch,
} from "@/editor/chrome-ui";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_BTN_SECONDARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "@/editor/media/components/libraryModal";
import { SCREEN_FIELD_ERROR, SET_BTN } from "../shared";
import type { RedirectType } from "../screens/redirectsContract";

export interface RedirectDraft {
  fromPath: string;
  toUrl: string;
  type: RedirectType;
  matchQuery: boolean;
  /** Trimmed; empty → null. */
  notes: string | null;
}

export interface RedirectDialogProps {
  open: boolean;
  mode: "add" | "edit";
  siteName: string;
  /** Edit mode: the row the fields are prefilled from. */
  initial?: RedirectDraft | null;
  /** `redirects.create` / `redirects.update`. Resolve = the caller closes and re-lists; reject = the reason stays under the form. */
  onSubmit(draft: RedirectDraft): Promise<void>;
  /** Edit mode: `redirects.delete`, at once. Same resolve / reject contract as `onSubmit`. */
  onDelete?(): Promise<void>;
  /** Cancel, Escape, the scrim. */
  onCancel(): void;
}

export const FROM_PATH_ERROR = "From path must start with / (e.g. /old-page)";
export const TO_URL_ERROR = "To URL must start with / or http(s):// (e.g. /new-page)";

/** The server's own rule (`createRedirectSchema.fromPath`). */
export const isValidFromPath = (value: string): boolean => value.startsWith("/");

/**
 * A redirect target is either a same-site path (single leading slash) or an
 * absolute http(s) URL. Everything else — javascript:/data: schemes,
 * protocol-relative "//host", bare domains, free text — is refused before
 * it can be persisted and later served to a visitor.
 */
export function isValidToUrl(value: string): boolean {
  if (value.startsWith("/")) return !value.startsWith("//");
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

const TYPES: { id: RedirectType; label: string }[] = [
  { id: "301", label: "301 Permanent" },
  { id: "302", label: "302 Temporary" },
];

const BLANK: RedirectDraft = { fromPath: "", toUrl: "", type: "301", matchQuery: false, notes: null };

/** The two path fields are mono, as the frame draws them; `sizes.md` is the
 *  slot the wrapper's height and size already live in, restated with the face. */
const PATH_INPUT_THEME: NonNullable<CustomFlowbiteTheme["textInput"]> = {
  field: { input: { sizes: { md: "tw:h-8 tw:py-0 tw:text-[13px] tw:[font-family:var(--bk-font-mono)]" } } },
};

const LABEL = `${BK_LABEL_CLASS} tw:block tw:leading-4`;
const NOTE = "tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const FIELD = "tw:flex tw:flex-col tw:gap-1.5";
/* `Delete redirect` — red text on nothing, at the footer's left (4254:75747).
   Ghost gives the quiet fill and the 32; the error ink is this button's own. */
const DELETE_BTN =
  `${SET_BTN} tw:text-[var(--bk-error)] tw:enabled:hover:bg-[var(--bk-error-tint)] tw:enabled:hover:text-[var(--bk-error-text)]`;

export function RedirectDialog({ open, mode, siteName, initial, onSubmit, onDelete, onCancel }: RedirectDialogProps) {
  const [fromPath, setFromPath] = React.useState("");
  const [toUrl, setToUrl] = React.useState("");
  const [type, setType] = React.useState<RedirectType>("301");
  const [matchQuery, setMatchQuery] = React.useState(false);
  const [notes, setNotes] = React.useState("");
  const [busy, setBusy] = React.useState<"submit" | "delete" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  /* A reopened dialog starts from its row (edit) or clean (add) — the last
     attempt's values and reason are never what the next door meant. */
  React.useEffect(() => {
    if (!open) return;
    const seed = (mode === "edit" && initial) || BLANK;
    setFromPath(seed.fromPath);
    setToUrl(seed.toUrl);
    setType(seed.type);
    setMatchQuery(seed.matchQuery);
    setNotes(seed.notes ?? "");
    setBusy(null);
    setError(null);
  }, [open, mode, initial]);

  const from = fromPath.trim();
  const to = toUrl.trim();
  const fromError = from !== "" && !isValidFromPath(from) ? FROM_PATH_ERROR : null;
  const toError = to !== "" && !isValidToUrl(to) ? TO_URL_ERROR : null;
  const valid = from !== "" && to !== "" && !fromError && !toError;

  const submit = async () => {
    if (!valid || busy) return;
    setBusy("submit");
    setError(null);
    try {
      await onSubmit({ fromPath: from, toUrl: to, type, matchQuery, notes: notes.trim() || null });
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Couldn't save the redirect.");
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!onDelete || busy) return;
    setBusy("delete");
    setError(null);
    try {
      await onDelete();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Couldn't delete the redirect.");
      setBusy(null);
    }
  };

  const title = mode === "edit" ? "Edit redirect" : "Add redirect";

  return (
    <ModalRoot open={open} onClose={busy ? undefined : onCancel}>
      <ModalContent size="table" srTitle={siteName ? `${title} · ${siteName}` : title} data-testid="set-rd-dialog" data-mode={mode}>
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="set-rd-dialog-title">
          {title}
        </h2>
        <ModalBody className="tw:flex tw:flex-col tw:gap-3">
          <p className={LIBRARY_MODAL_BODY} data-testid="set-rd-dialog-scope">
            {siteName ? `${siteName} · ` : ""}Redirects
          </p>

          <div className={FIELD}>
            <Label htmlFor="set-rd-from" className={LABEL}>
              From path
            </Label>
            <TextInput
              id="set-rd-from"
              type="text"
              value={fromPath}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromPath(e.target.value)}
              placeholder="/old-url"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              theme={PATH_INPUT_THEME}
              aria-invalid={fromError ? true : undefined}
              aria-describedby={fromError ? "set-rd-from-error" : undefined}
              disabled={busy !== null}
              data-testid="set-rd-from"
            />
            {fromError ? (
              <div id="set-rd-from-error" role="alert" className={SCREEN_FIELD_ERROR} data-testid="set-rd-from-error">
                {fromError}
              </div>
            ) : null}
          </div>

          <div className={FIELD}>
            <Label htmlFor="set-rd-to" className={LABEL}>
              To URL
            </Label>
            <TextInput
              id="set-rd-to"
              type="text"
              value={toUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToUrl(e.target.value)}
              placeholder="/new-url"
              autoComplete="off"
              spellCheck={false}
              theme={PATH_INPUT_THEME}
              aria-invalid={toError ? true : undefined}
              aria-describedby={toError ? "set-rd-to-error" : undefined}
              disabled={busy !== null}
              data-testid="set-rd-to"
            />
            {toError ? (
              <div id="set-rd-to-error" role="alert" className={SCREEN_FIELD_ERROR} data-testid="set-rd-to-error">
                {toError}
              </div>
            ) : null}
          </div>

          <div className={FIELD}>
            <span id="set-rd-type-label" className={LABEL}>
              Redirect type
            </span>
            <div role="group" aria-labelledby="set-rd-type-label" className="tw:flex tw:items-center tw:gap-2">
              {TYPES.map((t) => (
                <Button
                  key={t.id}
                  type="button"
                  size="xs"
                  variant={type === t.id ? "primary" : "secondary"}
                  className={SET_BTN}
                  aria-pressed={type === t.id}
                  disabled={busy !== null}
                  onClick={() => setType(t.id)}
                  data-testid={`set-rd-type-${t.id}`}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="tw:flex tw:items-center tw:justify-between tw:gap-4 tw:rounded-[var(--bk-radius-md)] tw:border tw:border-[var(--bk-border)] tw:px-3 tw:py-2">
            <div className="tw:flex tw:min-w-0 tw:flex-col tw:gap-0.5">
              <span id="set-rd-match-query-label" className="tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]">
                Match query strings
              </span>
              <span className="tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
                Forward ?utm_source and other parameters to the destination.
              </span>
            </div>
            <ToggleSwitch
              id="set-rd-match-query"
              checked={matchQuery}
              onChange={setMatchQuery}
              disabled={busy !== null}
              sizing="sm"
              aria-labelledby="set-rd-match-query-label"
              data-testid="set-rd-match-query"
            />
          </div>

          <div className={FIELD}>
            <Label htmlFor="set-rd-notes" className={LABEL}>
              Notes
            </Label>
            <TextInput
              id="set-rd-notes"
              type="text"
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)}
              placeholder="Optional — why this redirect exists."
              autoComplete="off"
              disabled={busy !== null}
              data-testid="set-rd-notes"
            />
          </div>

          <span className={NOTE}>
            Paths must start with /. A 301 is cached by browsers — use it for permanent moves; a 302 stays uncached
            while you test.
          </span>

          {error ? (
            <div role="alert" className={SCREEN_FIELD_ERROR} data-testid="set-rd-error">
              {error}
            </div>
          ) : null}
        </ModalBody>
        <div className={`${LIBRARY_MODAL_FOOT} tw:justify-end`} data-testid="set-rd-dialog-foot">
          {mode === "edit" && onDelete ? (
            <Button
              type="button"
              size="xs"
              variant="ghost"
              className={`${DELETE_BTN} tw:mr-auto`}
              disabled={busy !== null}
              onClick={() => void remove()}
              data-testid="set-rd-delete"
            >
              {busy === "delete" ? "Deleting…" : "Delete redirect"}
            </Button>
          ) : null}
          <Button
            type="button"
            size="xs"
            variant="secondary"
            className={LIBRARY_MODAL_BTN_SECONDARY}
            disabled={busy !== null}
            onClick={onCancel}
            data-testid="set-rd-cancel"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="xs"
            className={LIBRARY_MODAL_BTN_PRIMARY}
            disabled={!valid || busy !== null}
            onClick={() => void submit()}
            data-testid="set-rd-submit"
          >
            {mode === "edit" ? "Save redirect" : "Add redirect"}
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}

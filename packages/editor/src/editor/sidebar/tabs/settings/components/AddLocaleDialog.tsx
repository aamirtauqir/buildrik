/**
 * AddLocaleDialog — Clone 3737:44855 "Add locale" (640).
 *
 * Opened from the Localization header's `Add locale`. `Add locale` ·
 * `<site> · Localization` · a `Language` select of the locales not yet
 * enabled, each `<Language> — <Native> · <code>` · `Locale code`, read-only,
 * with `URL prefix /<code>` at its right · a `Set as default locale` row
 * with its toggle (`Visitors without a matching language land here.`) ·
 * `Starts as a draft. Translate every required page before this locale can
 * be published.` · Cancel · `Create locale`.
 *
 * Create is a save, at once: `settings.update` with the enabled list plus
 * the code (and the code as `defaultLocale` when the toggle is on), then
 * the dialog closes and the screen re-reads. A refused write stays in the
 * dialog as one error line above the buttons; nothing closes.
 *
 * The codes are BARE (`es`, `/es`) where the frame draws `es-ES`: the
 * product keys `enabledLocales` and every page's translations by the bare
 * code (phase2-backend.md §1). Shape from `libraryModal.ts` (title 16/600,
 * body 13 ink-soft, 32-high buttons, 8 gap) at the Clone's 640.
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
import { SITE_LOCALES } from "../constants";
import { SCREEN_FIELD_ERROR, Select } from "../shared";

export interface AddLocaleDialogProps {
  open: boolean;
  siteName: string;
  /** The codes already on the site — the select lists the rest. */
  enabledLocales: ReadonlyArray<string>;
  /** Cancel, Escape, the scrim. */
  onClose(): void;
  /**
   * The write. Resolves once the locale is saved (the caller closes and
   * re-reads); rejects with the failure the dialog shows.
   */
  onCreate(input: { code: string; setAsDefault: boolean }): Promise<void>;
}

/* `URL prefix /es` sits inside the field's box at the right, so the value
   needs room. `withRightIcon.off` is the slot the input's padding is merged
   from after its size — the one place a `pr-*` reliably wins. */
const CODE_INPUT_THEME: NonNullable<CustomFlowbiteTheme["textInput"]> = {
  field: { input: { withRightIcon: { off: "tw:pr-32" } } },
};

const LABEL = `${BK_LABEL_CLASS} tw:mt-3 tw:block`;
const HINT = "tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
/* The frame's boxed toggle row: title 13 ink over description 12 muted, the
   switch at the right, on a --bk-border hairline. */
const DEFAULT_ROW =
  "tw:mt-3 tw:flex tw:items-center tw:justify-between tw:gap-4 tw:rounded-[var(--bk-radius-md)] " +
  "tw:border tw:border-[var(--bk-border)] tw:px-3 tw:py-2";

export function AddLocaleDialog({ open, siteName, enabledLocales, onClose, onCreate }: AddLocaleDialogProps) {
  const addable = SITE_LOCALES.filter((l) => !enabledLocales.includes(l.code));
  const [code, setCode] = React.useState(addable[0]?.code ?? "");
  const [setAsDefault, setSetAsDefault] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  /* A reopened dialog starts clean — the first locale still to add, the
     toggle off, no stale failure. The list is read through a ref so the
     reset is keyed on opening alone, not on every parent render. */
  const firstAddableRef = React.useRef(addable[0]?.code ?? "");
  firstAddableRef.current = addable[0]?.code ?? "";
  React.useEffect(() => {
    if (!open) return;
    setCode(firstAddableRef.current);
    setSetAsDefault(false);
    setPending(false);
    setError(null);
  }, [open]);

  const create = async () => {
    if (!code || pending) return;
    setPending(true);
    setError(null);
    try {
      await onCreate({ code, setAsDefault });
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "The locale was not created. Try again.");
      setPending(false);
    }
  };

  return (
    <ModalRoot open={open} onClose={pending ? undefined : onClose}>
      <ModalContent size="table" srTitle="Add locale" data-testid="set-loc-dialog">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="set-loc-dialog-title">
          Add locale
        </h2>
        <ModalBody>
          <p className={LIBRARY_MODAL_BODY} data-testid="set-loc-dialog-scope">
            {siteName ? `${siteName} · ` : ""}Localization
          </p>

          <Label htmlFor="set-loc-language" className={LABEL}>
            Language
          </Label>
          <Select
            id="set-loc-language"
            className="tw:mt-1"
            value={code}
            disabled={pending || addable.length === 0}
            onChange={(e) => setCode(e.target.value)}
            data-testid="set-loc-language"
          >
            {addable.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label} — {l.native} · {l.code}
              </option>
            ))}
          </Select>

          <Label htmlFor="set-loc-code" className={LABEL}>
            Locale code
          </Label>
          <div className="tw:relative tw:mt-1">
            <TextInput
              id="set-loc-code"
              type="text"
              value={code}
              readOnly
              aria-describedby="set-loc-prefix"
              theme={CODE_INPUT_THEME}
              data-testid="set-loc-code"
            />
            <span
              id="set-loc-prefix"
              className={`${HINT} tw:pointer-events-none tw:absolute tw:top-1/2 tw:right-3 tw:-translate-y-1/2`}
              data-testid="set-loc-prefix"
            >
              URL prefix /{code}
            </span>
          </div>

          <div className={DEFAULT_ROW}>
            <span className="tw:flex tw:min-w-0 tw:flex-col tw:gap-0.5">
              <span
                id="set-loc-set-default-label"
                className="tw:text-[length:var(--bk-text-13)] tw:leading-4 tw:font-medium tw:text-[var(--bk-ink)]"
              >
                Set as default locale
              </span>
              <span className={HINT}>Visitors without a matching language land here.</span>
            </span>
            <ToggleSwitch
              checked={setAsDefault}
              disabled={pending}
              onChange={setSetAsDefault}
              aria-labelledby="set-loc-set-default-label"
              sizing="sm"
              data-testid="set-loc-set-default"
            />
          </div>

          <p className={`${HINT} tw:mt-3`} data-testid="set-loc-draft-note">
            Starts as a draft. Translate every required page before this locale can be published.
          </p>

          {error ? (
            <p role="alert" className={`${SCREEN_FIELD_ERROR} tw:mt-3`} data-testid="set-loc-error">
              {error}
            </p>
          ) : null}
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT} data-testid="set-loc-dialog-foot">
          <Button
            size="xs"
            variant="secondary"
            className={LIBRARY_MODAL_BTN_SECONDARY}
            disabled={pending}
            onClick={onClose}
            data-testid="set-loc-cancel"
          >
            Cancel
          </Button>
          <Button
            size="xs"
            className={LIBRARY_MODAL_BTN_PRIMARY}
            disabled={pending || !code}
            onClick={create}
            data-testid="set-loc-create"
          >
            Create locale
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}

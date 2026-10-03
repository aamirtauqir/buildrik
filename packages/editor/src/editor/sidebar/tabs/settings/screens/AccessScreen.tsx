/**
 * AccessScreen — PUBLISHING › Access (plan row #31; boards 8136:216089
 * password-set, 8136:216319 password-off, 8136:216535 set-password,
 * 8136:216758 pro-locked).
 *
 * Below Pro the shell mounts this screen with `planLocked`
 * (`SCREENS_WITH_OWN_PLAN_LOCK`) rather than its centred LockedScreen: only
 * the password card is the plan's — it says so, with `Upgrade to Pro` — and
 * Share links stays, since every plan has them.
 *
 * Card **Password protection · Pro**: a purpose line, the switch, then — on,
 * with a password stored — "A password is set" with `Change` (opens a `New
 * password` field) and `Remove`; on, with none — the `Password` field, focused
 * the moment the switch turns on; switched off over a stored one — "Password
 * protection will be off after the next publish."
 *
 * OWNER OVERRIDE 2026-10-04 ("no form, no flow, what is it for?"; boards
 * 8136:216089 / 8136:216319 / 8136:216535 to update): the purpose line is new
 * on every state, and the stored state shows Change + Remove with the New
 * password field behind Change — 8136:216089 draws the field always open. The
 * stored
 * value is never read back (the server redacts it; `settings.get` says only
 * `hasPublishedPassword`). Save is the footer's: a save handler writes
 * `publishedPassword` through `siteDetail.settings.update` (ADMIN, Pro) —
 * the new value, or `null` to remove — and the screen re-reads the flag.
 * Turning the switch on without a password is refused before Save
 * (`registerFieldErrors`). Card **Share links**: "Manage share links ↗" opens
 * the dashboard's Sharing tab. Field anchors: `access-password`,
 * `access-share-links`.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ToggleSwitch } from "@/editor/chrome-ui";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { updateSiteColumns } from "@/services/BuildrikSyncProvider";
import { Input, LoadCard, SET_BTN, SET_CARD, SET_ROW_LABEL, SCREEN_FIELD_ERROR, SaveErrorBanner, Screen } from "../shared";
import { useServerLoad } from "../hooks/useServerLoad";
import type { ScreenProps } from "../types";

/** The settings path the password's refusals are keyed by (BuildrikSyncProvider's column map). */
const PASSWORD_PATH = "publishing.publishedPassword";
const NEED_PASSWORD = "Enter a password to turn protection on";
const PURPOSE =
  "Visitors must enter a password before they can see the published site. Useful for client previews and staging.";
const QUIET_BTN = `${SET_BTN} tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-bg-subtle)]`;

/* 8136:216089: the card — 24 in, 16 between its rows, title 16/600. */
const CARD = `${SET_CARD} tw:flex tw:flex-col tw:items-start tw:gap-4 tw:p-6`;
const TITLE =
  "tw:m-0 tw:text-[length:var(--bk-text-16)] tw:font-semibold tw:leading-6 tw:tracking-[-0.16px] tw:text-[var(--bk-ink)]";
const NOTE_12 = "tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-5 tw:text-[var(--bk-ink-muted)]";
const LABEL_11 = "tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink)]";
const DOOR_LINK =
  "tw:text-[length:var(--bk-text-13)] tw:font-medium tw:leading-5 tw:text-[var(--bk-accent)] tw:no-underline tw:hover:underline " +
  "tw:focus-visible:[box-shadow:var(--bk-shadow-focus)] tw:outline-none";

export const AccessScreen: React.FC<ScreenProps> = ({
  projectId,
  onDirtyChange,
  onLoadStateChange,
  registerRetryLoad,
  registerSaveHandler,
  registerFieldErrors,
  fieldErrors,
  saveError,
  planLocked,
  onUpgrade,
}) => {
  const [hasPassword, setHasPassword] = React.useState(false);
  const [enabled, setEnabled] = React.useState(false);
  const [password, setPassword] = React.useState("");
  /* Stored password: the New password field is open (Change). */
  const [changing, setChanging] = React.useState(false);

  const load = useServerLoad<{ hasPublishedPassword?: boolean }>(
    projectId,
    (client, siteId) => client.siteDetail.settings.get.query({ siteId }),
    (row) => {
      const set = !!row.hasPublishedPassword;
      setHasPassword(set);
      setEnabled(set);
      setPassword("");
      setChanging(false);
    },
    { onLoadStateChange, registerRetryLoad },
  );

  const dirty = enabled !== hasPassword || (enabled && password.length > 0);
  const invalid = enabled && !hasPassword && password.trim() === "";

  React.useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  React.useEffect(() => {
    registerFieldErrors?.(invalid ? { [PASSWORD_PATH]: NEED_PASSWORD } : null);
  }, [invalid, registerFieldErrors]);
  React.useEffect(() => () => registerFieldErrors?.(null), [registerFieldErrors]);

  /* Save: the new value, or null to remove — only on an explicit change, so a
     save never clears a password nobody touched. */
  const stateRef = React.useRef({ enabled, password, hasPassword });
  stateRef.current = { enabled, password, hasPassword };
  React.useEffect(() => {
    if (!registerSaveHandler) return;
    if (!dirty || !projectId) {
      registerSaveHandler(null);
      return;
    }
    registerSaveHandler(async () => {
      const s = stateRef.current;
      const publishedPassword = s.enabled ? s.password : null;
      await updateSiteColumns(projectId, { publishedPassword });
      setHasPassword(publishedPassword !== null);
      setEnabled(publishedPassword !== null);
      setPassword("");
      setChanging(false);
    });
    return () => registerSaveHandler(null);
  }, [dirty, projectId, registerSaveHandler]);

  const shareLinks = (
    <section className={CARD} data-testid="set-card-share-links">
      <h3 className={TITLE}>Share links</h3>
      {/* Navigation: it stays on the read-only screen. */}
      {!projectId ? null : (
        <a
          id="access-share-links"
          className={DOOR_LINK}
          href={`${DASHBOARD_URL}/dashboard/sites/${projectId}/access`}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="set-access-share-links"
        >
          Manage share links ↗
        </a>
      )}
    </section>
  );

  /* 8136:216758: the password card locked — what it is, the plan line, Upgrade
     to Pro — and Share links as on every plan. Nothing here waits on the read. */
  if (planLocked) {
    return (
      <Screen>
        <section className={CARD} data-testid="set-card-password-protection">
          <h3 className={TITLE}>Password protection</h3>
          <p className="tw:m-0 tw:text-[length:var(--bk-text-12)] tw:font-medium tw:leading-5 tw:text-[var(--bk-accent)]" data-testid="set-access-pro">
            Pro
          </p>
          <p className="tw:m-0 tw:text-[length:var(--bk-text-14)] tw:leading-5 tw:text-[var(--bk-ink)]">
            Protect your published site with a password.
          </p>
          <p className="tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]">
            Upgrade to Pro to control who can view your site.
          </p>
          <Button type="button" size="xs" className={`${SET_BTN} tw:h-8 tw:px-3`} onClick={onUpgrade} data-testid="set-access-upgrade">
            Upgrade to Pro
          </Button>
        </section>
        {shareLinks}
      </Screen>
    );
  }

  if (load.state !== "ready") {
    return (
      <Screen>
        <LoadCard
          title="Password protection"
          line="Keep the published site private behind a password."
          state={load.state}
          errorLine="Couldn't load your access settings. Check your connection, then try again."
          onRetry={load.retry}
        />
      </Screen>
    );
  }

  const fieldError = fieldErrors?.[PASSWORD_PATH];

  return (
    <Screen>
      {saveError ? <SaveErrorBanner message={saveError} /> : null}

      <section className={CARD} data-testid="set-card-password-protection">
        <h3 className={TITLE}>Password protection · Pro</h3>
        <p className="tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]" data-testid="set-access-purpose">
          {PURPOSE}
        </p>
        <div className="tw:flex tw:min-h-8 tw:items-center tw:gap-4">
          <span id="access-password-toggle-label" className={SET_ROW_LABEL}>
            Password protection
          </span>
          <ToggleSwitch
            checked={enabled}
            onChange={(next) => {
              setEnabled(next);
              setChanging(false);
              if (!next) setPassword("");
            }}
            aria-labelledby="access-password-toggle-label"
            sizing="md"
            data-testid="set-access-toggle"
          />
        </div>

        {enabled && hasPassword ? (
          <p className="tw:m-0 tw:text-[length:var(--bk-text-13)] tw:font-medium tw:leading-5 tw:text-[var(--bk-ink)]" data-testid="set-access-is-set">
            A password is set
          </p>
        ) : null}

        {/* The field mounts only on a person's action (the switch, or Change),
            so autoFocus never steals focus on open. */}
        {enabled && (!hasPassword || changing) ? (
          <div className="tw:flex tw:w-full tw:flex-col tw:gap-1" data-testid="set-field-access-password">
            <label htmlFor="access-password" className={LABEL_11}>
              {hasPassword ? "New password" : "Password"}
            </label>
            <Input
              id="access-password"
              type="password"
              autoComplete="new-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={hasPassword ? "Enter a new password to change it" : "Enter a password"}
              aria-invalid={fieldError ? true : undefined}
              data-testid="set-access-password"
            />
            {fieldError ? <span className={SCREEN_FIELD_ERROR}>{fieldError}</span> : null}
          </div>
        ) : null}

        {enabled && hasPassword ? (
          <div className="tw:flex tw:items-center tw:gap-2">
            {changing ? (
              <Button
                type="button"
                size="xs"
                variant="ghost"
                className={QUIET_BTN}
                onClick={() => {
                  setChanging(false);
                  setPassword("");
                }}
                aria-label="Cancel password change"
                data-testid="set-access-change-cancel"
              >
                Cancel
              </Button>
            ) : (
              <Button
                type="button"
                size="xs"
                variant="ghost"
                className={QUIET_BTN}
                onClick={() => setChanging(true)}
                aria-label="Change password"
                data-testid="set-access-change"
              >
                Change
              </Button>
            )}
            <Button
              type="button"
              size="xs"
              variant="ghost"
              className={QUIET_BTN}
              onClick={() => {
                setEnabled(false);
                setChanging(false);
                setPassword("");
              }}
              aria-label="Remove password"
              data-testid="set-access-remove"
            >
              Remove
            </Button>
          </div>
        ) : null}

        {!enabled ? (
          <p className="tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]" data-testid="set-access-off">
            {hasPassword
              ? "Password protection will be off after the next publish."
              : "Anyone with the address can view the published site."}
          </p>
        ) : null}

        <p className={NOTE_12}>Applies on next publish</p>
      </section>

      {shareLinks}
    </Screen>
  );
};

/**
 * Domains — PUBLISHING / Domains (8136:214348 several, 8136:214574
 * set-primary-confirm; states from 4418:127680 / 4418:129084 loading /
 * 4418:129186 empty / 4418:129290 load-error / 4418:129393 save-error).
 *
 * Nothing on this screen is saved by the footer — every action lands on the
 * server as it is confirmed, so the screen is never dirty (scope line "Live
 * immediately"). The rows come from `domains.list` on open; none → the one
 * empty card, and right after a remove that card carries `<domain> removed…`.
 *
 * The list (2L9 B8-S09 238:12413): one `Domains` card, primary first, a
 * ruled row per domain — the name, its status ("Primary · connected · SSL
 * active", "Redirects to primary", "Waiting for DNS"), and one action: `Make
 * primary` on a verified domain (→ SetPrimaryDomainDialog →
 * `domains.setPrimary`, then a toast "<domain> is now primary" with Undo),
 * `Check again` on one still waiting (`domains.check`). `+ Add domain` closes
 * the card (→ AddDomainDialog → `domains.connect`). A second card lists the
 * DNS records of the first domain still waiting. `Manage DNS` stays on every
 * row by owner decision (2026-10-04) — the only way to Force HTTPS and Remove.
 *
 * `Manage DNS` opens the domain's own view (the header reads `Domains /
 * <domain>`): the Custom domain card — status, `Force HTTPS` (writes
 * `domains.update` at once), `Remove <domain>…` (→ RemoveDomainDialog →
 * `domains.remove`) — and the DNS records card, whose `Check DNS` runs
 * `domains.check`. A refused remove, toggle or check shows the banner over
 * the cards, which stay as the server has them.
 *
 * Connect, remove, set-primary and the toggle are ADMIN actions: a non-admin
 * sees them DISABLED with the reason attached, never hidden; the server
 * enforces.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, TextInput, ToggleSwitch, useToast } from "@/editor/chrome-ui";
import { getBuildrikClient } from "@/services/api-client";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { useEditorRole } from "@/editor/shell/hooks/useEditorRole";
import { roleAtLeast } from "@/services/RoleService";
import {
  LoadCard,
  SET_BTN,
  SET_TABLE,
  SET_TD,
  SET_TH,
  pillClass,
  type PillTone,
  SET_CARD,
  SET_EYEBROW,
  SET_ROW,
  SET_ROW_LABEL,
  SaveErrorBanner,
  Screen,
  Section,
} from "../shared";
import { ACTION_ERROR_MESSAGES } from "../constants";
import { useServerLoad } from "../hooks/useServerLoad";
import type { ScreenProps } from "../types";
import { AddDomainDialog, type AddDomainSubmission } from "../components/AddDomainDialog";
import { RemoveDomainDialog } from "../components/RemoveDomainDialog";
import { SetPrimaryDomainDialog } from "../components/SetPrimaryDomainDialog";
import { devWarn } from "@/shared/utils/devLogger";

export interface DnsRecordRow {
  type: string;
  host: string;
  value: string;
  verified: boolean;
}

/** What this screen reads of a `Domain` row (`domains.list` returns a superset). */
export interface DomainRow {
  id: string;
  domain: string;
  /** PENDING | VERIFIED | FAILED */
  status: string;
  /** PENDING | ACTIVE — the certificate, issued once the domain points here. */
  sslStatus: string;
  isPrimary: boolean;
  /** PRIMARY | REDIRECT | SUBDOMAIN */
  kind: string;
  forceHttps: boolean;
  dnsProvider: string | null;
  dnsRecords: DnsRecordRow[];
}

const CARD_LINE = "Point your own domain at this site. DNS changes happen at your domain registrar.";
const ADMIN_REASON = "Only an admin can change the domain";
const VERIFY_FIRST = "Verify this domain before making it primary";

type Busy = { kind: "https" | "check" | "remove" | "primary"; id: string } | null;

const primaryFirst = (rows: DomainRow[]): DomainRow[] =>
  [...rows].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));

/** `dom-domain`, `dom-domain-1`, … — the first domain's controls carry the
 *  bare ids the search registry points at; the rest stay unique. */
const nth = (stem: string, i: number) => (i === 0 ? stem : `${stem}-${i}`);

/** 2L9 B8-S09 238:12413: the row's status — "Primary · connected · SSL
 *  active", "Redirects to primary", "Waiting for DNS". */
function connectionLine(row: Pick<DomainRow, "status" | "sslStatus" | "isPrimary" | "kind">): string {
  if (row.status === "FAILED") return "DNS not found · check your records";
  if (row.status !== "VERIFIED") return "Waiting for DNS";
  const ssl = row.sslStatus === "ACTIVE" ? "SSL active" : "SSL pending";
  if (row.isPrimary) return `Primary · connected · ${ssl}`;
  if (row.kind === "REDIRECT") return "Redirects to primary";
  return `Connected · ${ssl}`;
}

/** The server's sentence for a refused set-primary, else ours. */
const refusal = (e: unknown) =>
  e instanceof Error && e.message ? e.message : "The primary domain was not changed. Try again.";

// ─── Status pill ─────────────────────────────────────────────────────────────

const PILL_TONE: Record<string, PillTone> = { VERIFIED: "success", PENDING: "warning", FAILED: "error" };

const StatusPill: React.FC<{ status: string; "data-testid"?: string }> = ({ status, ...rest }) => {
  return (
    <span className={pillClass(PILL_TONE[status] ?? "neutral")} data-status={status} {...rest}>
      {status}
    </span>
  );
};

/** A record's public-DNS reading (L3-033) — detected, not the domain's status. */
const DetectedPill: React.FC<{ detected: boolean; "data-testid"?: string }> = ({ detected, ...rest }) => (
  <span className={pillClass(detected ? "success" : "warning")} data-status={detected ? "DETECTED" : "NOT_DETECTED"} {...rest}>
    {detected ? "Detected" : "Not detected"}
  </span>
);

// ─── Chrome ──────────────────────────────────────────────────────────────────

const LINE = "tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-soft)]";

/* 2L9 B8-S09: one `Domains` card — a hairline-ruled row per domain (name ·
   status · one action), then `+ Add domain`; a second card lists the DNS
   records of the first domain still waiting for DNS. */
const LIST_CARD = `${SET_CARD} tw:flex tw:w-full tw:max-w-180 tw:flex-col tw:p-4`;
const CARD_TITLE = "tw:m-0 tw:mb-1 tw:text-[length:var(--bk-text-14)] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]";
const LIST_ROW =
  "tw:grid tw:min-h-12 tw:grid-cols-[240px_minmax(0,1fr)_auto] tw:items-center tw:gap-3 tw:border-b tw:border-[var(--bk-border)] tw:py-2";
const ROW_NAME = "tw:truncate tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]";
const DOMAIN_LINE = "tw:min-w-0 tw:truncate tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]";
/* The row's actions are accent text links (B8-S09 "Make primary", "Check again"). */
const ROW_LINK = "tw:h-8 tw:shrink-0 tw:px-0 tw:text-[length:var(--bk-text-13)] tw:font-normal tw:no-underline tw:hover:underline";
/* The Manage DNS view's back link — ink, no box. */
const ROW_ACTION = `${SET_BTN} tw:shrink-0 tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-bg-subtle)]`;

// ─── Screen ──────────────────────────────────────────────────────────────────

export const DomainsScreen: React.FC<ScreenProps> = ({
  composer,
  projectId,
  onDirtyChange,
  onLoadStateChange,
  registerRetryLoad,
  registerHeader,
  saveError,
  readOnly,
}) => {
  const role = useEditorRole();
  const { addToast } = useToast();
  // null role = unknown → don't gate in chrome; the server still enforces.
  const canManage = !readOnly && roleAtLeast(role, "ADMIN") !== false;
  const siteName = composer?.getProjectMetadata?.()?.name ?? "";

  const [rows, setRows] = React.useState<DomainRow[]>([]);
  const [busy, setBusy] = React.useState<Busy>(null);
  const [actionFailed, setActionFailed] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  /** Unknown (still loading, or the read failed) counts as "no": the dialog then keeps drawing the TXT. */
  const [vercelConnected, setVercelConnected] = React.useState(false);
  const [removeTarget, setRemoveTarget] = React.useState<DomainRow | null>(null);
  const [primaryTarget, setPrimaryTarget] = React.useState<DomainRow | null>(null);
  const [primaryError, setPrimaryError] = React.useState<string | null>(null);
  /** The domain whose `Manage DNS` view is open; null = the list. */
  const [managingId, setManagingId] = React.useState<string | null>(null);
  /** The domain a remove just took away — gone on the next visit. */
  const [removedDomain, setRemovedDomain] = React.useState<string | null>(null);

  // Nothing here waits for Save: the footer has no Save to enable.
  React.useEffect(() => {
    onDirtyChange?.(false);
  }, [onDirtyChange]);

  const load = useServerLoad<DomainRow[]>(
    projectId,
    (client, siteId) => client.siteDetail.domains.list.query({ siteId }),
    (list) => setRows(primaryFirst(list)),
    { onLoadStateChange, registerRetryLoad },
  );

  const api = () => getBuildrikClient(DASHBOARD_URL).siteDetail.domains;

  React.useEffect(() => {
    if (!projectId) return;
    let stale = false;
    getBuildrikClient(DASHBOARD_URL)
      .siteDetail.domains.usesVercel.query({ siteId: projectId })
      .then((r) => {
        if (!stale) setVercelConnected(r.vercelConnected);
      })
      /* Unknown stays "not connected", which only adds the TXT ownership row
         to the expected records — the conservative answer. Logged, not
         silent (DQ-012). */
      .catch((error) => devWarn("DomainsScreen", "Vercel connection check failed", error));
    return () => {
      stale = true;
    };
  }, [projectId]);

  /* After an action: the rows as the server now has them, without the load
     card in between. A read that fails here goes back through the load path,
     so the failure is the load-error card and its Try again, not stale rows. */
  const relist = React.useCallback(async () => {
    if (!projectId) return;
    try {
      setRows(primaryFirst(await getBuildrikClient(DASHBOARD_URL).siteDetail.domains.list.query({ siteId: projectId })));
    } catch {
      load.retry();
    }
  }, [projectId, load.retry]);

  const managing = managingId ? rows.find((r) => r.id === managingId) ?? null : null;

  // The Manage DNS view names its domain in the shell's header.
  React.useEffect(() => {
    if (!registerHeader) return;
    registerHeader(managing ? { title: managing.domain } : null);
  }, [registerHeader, managing?.domain]);
  React.useEffect(() => () => registerHeader?.(null), [registerHeader]);

  const setForceHttps = async (row: DomainRow, next: boolean) => {
    setBusy({ kind: "https", id: row.id });
    setActionFailed(false);
    try {
      const updated = await api().update.mutate({ id: row.id, forceHttps: next });
      setRows((current) => current.map((r) => (r.id === row.id ? { ...r, forceHttps: updated.forceHttps } : r)));
    } catch {
      setActionFailed(true);
    } finally {
      setBusy(null);
    }
  };

  const checkDns = async (row: DomainRow) => {
    if (!projectId) return;
    setBusy({ kind: "check", id: row.id });
    setActionFailed(false);
    try {
      await api().check.mutate({ id: row.id, siteId: projectId });
      await relist();
    } catch {
      setActionFailed(true);
    } finally {
      setBusy(null);
    }
  };

  const removeDomain = async () => {
    const target = removeTarget;
    if (!target) return;
    setBusy({ kind: "remove", id: target.id });
    setActionFailed(false);
    try {
      await api().remove.mutate({ id: target.id });
      setRemoveTarget(null);
      setManagingId(null);
      setRemovedDomain(target.domain);
      await relist();
    } catch {
      setRemoveTarget(null);
      setActionFailed(true);
    } finally {
      setBusy(null);
    }
  };

  /* B8-S09: "<domain> is now primary · Undo" — Undo makes the previous
     primary primary again through the same mutation. */
  const setPrimary = async () => {
    const target = primaryTarget;
    if (!target || !projectId) return;
    const previous = rows.find((r) => r.isPrimary && r.id !== target.id) ?? null;
    setBusy({ kind: "primary", id: target.id });
    setPrimaryError(null);
    try {
      await api().setPrimary.mutate({ id: target.id, siteId: projectId });
      setPrimaryTarget(null);
      await relist();
      addToast({
        description: `${target.domain} is now primary`,
        ...(previous
          ? {
              action: {
                label: "Undo",
                onClick: () => {
                  void api()
                    .setPrimary.mutate({ id: previous.id, siteId: projectId })
                    .then(relist, () => setActionFailed(true));
                },
              },
              duration: 8000,
            }
          : {}),
      });
    } catch (e) {
      setPrimaryError(refusal(e));
    } finally {
      setBusy(null);
    }
  };

  const connect = async (input: AddDomainSubmission) => {
    if (!projectId) return;
    await api().connect.mutate({ siteId: projectId, ...input });
    setAddOpen(false);
    setRemovedDomain(null);
    await relist();
  };

  const isBusy = (kind: NonNullable<Busy>["kind"], id: string) => busy?.kind === kind && busy.id === id;

  if (!projectId) {
    return (
      <Screen>
        <Section title="Custom domain" desc="Open a real site to connect a domain.">
          <div className={LINE}>The demo project can't have a custom domain.</div>
        </Section>
      </Screen>
    );
  }

  if (load.state !== "ready") {
    return (
      <Screen>
        <LoadCard
          title="Domains"
          state={load.state}
          errorLine="Couldn't load your domains. Try again."
          failure={load.failure}
          onRetry={load.retry}
        />
      </Screen>
    );
  }

  const banner = saveError ?? (actionFailed ? ACTION_ERROR_MESSAGES.domains : null);
  const addButton = (
    <Button
      type="button"
      size="xs"
      className={`${SET_BTN} tw:w-fit`}
      disabled={!canManage}
      title={canManage ? undefined : ADMIN_REASON}
      onClick={() => setAddOpen(true)}
      data-testid="set-dom-add"
    >
      Add a domain
    </Button>
  );
  const addLink = (
    <Button
      type="button"
      variant="link"
      size="xs"
      className={`${ROW_LINK} tw:mt-2 tw:w-fit tw:px-3`}
      disabled={!canManage}
      title={canManage ? undefined : ADMIN_REASON}
      onClick={() => setAddOpen(true)}
      data-testid="set-dom-add"
    >
      + Add domain
    </Button>
  );
  /* The DNS card follows the first domain still waiting for DNS. */
  const waiting = rows.find((r) => r.status !== "VERIFIED") ?? null;

  const dialogs = (
    <>
      <AddDomainDialog
        open={addOpen}
        siteName={siteName}
        vercelConnected={vercelConnected}
        checkAvailability={(domain) => api().checkAvailability.query({ domain })}
        onSubmit={connect}
        onCancel={() => setAddOpen(false)}
      />
      <RemoveDomainDialog
        domain={removeTarget?.domain ?? null}
        siteName={siteName}
        busy={removeTarget !== null && isBusy("remove", removeTarget.id)}
        onCancel={() => setRemoveTarget(null)}
        onRemove={() => void removeDomain()}
      />
      <SetPrimaryDomainDialog
        domain={primaryTarget?.domain ?? null}
        busy={primaryTarget !== null && isBusy("primary", primaryTarget.id)}
        error={primaryError}
        onCancel={() => {
          setPrimaryTarget(null);
          setPrimaryError(null);
        }}
        onConfirm={() => void setPrimary()}
      />
    </>
  );

  // ── Manage DNS: one domain's settings and records ──
  if (managing) {
    const i = rows.indexOf(managing);
    const row = managing;
    return (
      <Screen>
        {banner ? <SaveErrorBanner message={banner} /> : null}
        <Button
          type="button"
          size="xs"
          variant="ghost"
          className={`${ROW_ACTION} tw:w-fit tw:px-0`}
          onClick={() => setManagingId(null)}
          data-testid="set-dom-back"
        >
          ‹ All domains
        </Button>

        <div data-testid={`set-dom-card-${row.id}`}>
          <Section title="Custom domain" anchor={nth("custom-domain", i)}>
            <div className={SET_ROW}>
              <span id={`${nth("dom-domain", i)}-label`} className={SET_ROW_LABEL}>
                Domain
              </span>
              <TextInput
                id={nth("dom-domain", i)}
                type="text"
                value={row.domain}
                readOnly
                aria-labelledby={`${nth("dom-domain", i)}-label`}
                className="tw:min-w-0 tw:flex-1"
              />
            </div>
            <div className={SET_ROW}>
              <span className={SET_ROW_LABEL}>Status</span>
              <StatusPill status={row.status} data-testid={`set-dom-status-${row.id}`} />
            </div>
            <div className={SET_ROW}>
              <span id={`${nth("dom-force-https", i)}-label`} className={SET_ROW_LABEL}>
                Force HTTPS
              </span>
              <ToggleSwitch
                id={nth("dom-force-https", i)}
                checked={row.forceHttps}
                onChange={(next) => void setForceHttps(row, next)}
                disabled={!canManage || isBusy("https", row.id)}
                title={canManage ? undefined : ADMIN_REASON}
                aria-labelledby={`${nth("dom-force-https", i)}-label`}
                sizing="md"
                data-testid={`set-dom-https-${row.id}`}
              />
            </div>
            <div className="tw:col-span-full">
              <Button
                type="button"
                size="xs"
                variant="danger"
                className={SET_BTN}
                disabled={!canManage}
                title={canManage ? undefined : ADMIN_REASON}
                onClick={() => setRemoveTarget(row)}
                data-testid={`set-dom-remove-${row.id}`}
              >
                Remove {row.domain}…
              </Button>
            </div>
          </Section>
        </div>

        <div data-testid={`set-dom-dns-${row.id}`}>
          <Section title="DNS records" anchor={nth("dns-records", i)}>
            <table className={SET_TABLE} id={nth("dom-dns-records", i)} aria-label={`DNS records for ${row.domain}`}>
              <thead>
                <tr>
                  <th scope="col" className={`${SET_TH} tw:w-14`}>
                    Type
                  </th>
                  <th scope="col" className={`${SET_TH} tw:w-26`}>
                    Name
                  </th>
                  <th scope="col" className={`${SET_TH} tw:w-62`}>
                    Value
                  </th>
                  <th scope="col" className={`${SET_TH} tw:pr-0`}>
                    Detected
                  </th>
                </tr>
              </thead>
              <tbody>
                {row.dnsRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={`${SET_TD} tw:text-[var(--bk-ink-muted)]`}>
                      No DNS records for this domain.
                    </td>
                  </tr>
                ) : (
                  row.dnsRecords.map((rec, j) => (
                    <tr key={`${rec.type}-${rec.host}-${j}`} data-testid={`set-dom-dns-row-${row.id}-${j}`}>
                      <td className={SET_TD}>{rec.type}</td>
                      <td className={`${SET_TD} tw:truncate`}>{rec.host}</td>
                      <td className={`${SET_TD} tw:truncate tw:text-[var(--bk-ink-soft)]`} title={rec.value}>
                        {rec.value}
                      </td>
                      <td className={`${SET_TD} tw:pr-0`}>
                        <DetectedPill detected={rec.verified} data-testid={`set-dom-dns-state-${row.id}-${j}`} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {/* L3-033: the rows are what this domain REQUIRES (the server's list
                — Vercel's for this project when connected); the last column is
                a public-DNS reading, which never decides the domain's status. */}
            <p className={`${LINE} tw:col-span-full tw:m-0`} data-testid={`set-dom-dns-caption-${row.id}`}>
              Required records. Detected is what public DNS answers right now.
            </p>
            <div className="tw:col-span-full">
              <Button
                type="button"
                size="xs"
                variant="secondary"
                className={SET_BTN}
                disabled={isBusy("check", row.id)}
                onClick={() => void checkDns(row)}
                data-testid={`set-dom-check-${row.id}`}
              >
                {isBusy("check", row.id) ? "Checking…" : "Check DNS"}
              </Button>
            </div>
          </Section>
        </div>
        {dialogs}
      </Screen>
    );
  }

  // ── The list (8136:214348) ──
  return (
    <Screen>
      {banner ? <SaveErrorBanner message={banner} /> : null}

      {rows.length === 0 ? (
        <section className={`${SET_CARD} tw:flex tw:flex-col tw:items-start tw:gap-2 tw:p-4`} data-testid="set-dom-empty">
          <div className={SET_EYEBROW}>Custom domain</div>
          <div className={LINE}>{CARD_LINE}</div>
          {removedDomain ? (
            <div className={LINE} role="status" data-testid="set-dom-removed">
              {removedDomain} removed. This site is still available at its default vercel.app address.
            </div>
          ) : (
            <div className={LINE}>No custom domain. The site uses its default vercel.app address until you connect one.</div>
          )}
          <div className="tw:mt-1">{addButton}</div>
        </section>
      ) : (
        <>
          {removedDomain ? (
            <div className={LINE} role="status" data-testid="set-dom-removed">
              {removedDomain} removed.
            </div>
          ) : null}
          <section className={LIST_CARD} data-testid="set-card-domains">
            <h3 className={CARD_TITLE}>Domains</h3>
            {rows.map((row, i) => (
              <div key={row.id} className={LIST_ROW} data-testid={`set-dom-item-${row.id}`}>
                <span className={ROW_NAME} id={i === 0 ? "dom-domain" : undefined}>
                  {row.domain}
                </span>
                <span className={DOMAIN_LINE} id={row.isPrimary && i === 0 ? "dom-primary" : undefined} data-testid={`set-dom-line-${row.id}`}>
                  {connectionLine(row)}
                </span>
                <span className="tw:flex tw:items-center tw:gap-4">
                  {/* B8-S19: a read-only screen draws no write actions. */}
                  {row.isPrimary || readOnly ? null : row.status === "VERIFIED" ? (
                    <Button
                      type="button"
                      variant="link"
                      size="xs"
                      className={ROW_LINK}
                      disabled={!canManage}
                      title={canManage ? undefined : ADMIN_REASON}
                      onClick={() => {
                        setPrimaryError(null);
                        setPrimaryTarget(row);
                      }}
                      data-testid={`set-dom-make-primary-${row.id}`}
                    >
                      Make primary
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="link"
                      size="xs"
                      className={ROW_LINK}
                      disabled={isBusy("check", row.id)}
                      onClick={() => void checkDns(row)}
                      data-testid={`set-dom-check-again-${row.id}`}
                    >
                      {isBusy("check", row.id) ? "Checking…" : "Check again"}
                    </Button>
                  )}
                  {/* Owner 2026-10-04: Manage DNS stays — the only way to a
                      domain's Force HTTPS and Remove (undrawn on 2L9). */}
                  <Button
                    type="button"
                    variant="link"
                    size="xs"
                    className={`${ROW_LINK} tw:text-[var(--bk-ink-muted)]`}
                    onClick={() => setManagingId(row.id)}
                    data-testid={`set-dom-manage-${row.id}`}
                  >
                    Manage DNS
                  </Button>
                </span>
              </div>
            ))}
            {readOnly ? null : addLink}
          </section>
          {waiting ? (
            <section className={LIST_CARD} data-testid="set-card-dns-waiting">
              <h3 className={CARD_TITLE}>{`DNS records for ${waiting.domain}`}</h3>
              <p className="tw:m-0 tw:mb-1 tw:text-[length:var(--bk-text-12)] tw:leading-5 tw:text-[var(--bk-ink-muted)]">
                Add these at your DNS provider. Editing DNS here is Planned.
              </p>
              {waiting.dnsRecords.map((rec, j) => (
                <div
                  key={`${rec.type}-${rec.host}-${j}`}
                  className="tw:grid tw:min-h-11 tw:grid-cols-[240px_minmax(0,1fr)] tw:items-center tw:gap-3 tw:border-b tw:border-[var(--bk-border)] tw:text-[length:var(--bk-text-13)] tw:leading-5"
                  data-testid={`set-dom-waiting-row-${j}`}
                >
                  <span className="tw:whitespace-pre tw:text-[var(--bk-ink)]">{`${rec.type}   ${rec.host}`}</span>
                  <span className="tw:truncate tw:text-[var(--bk-ink-muted)]" title={rec.value}>
                    {rec.value}
                  </span>
                </div>
              ))}
            </section>
          ) : null}
        </>
      )}
      {dialogs}
    </Screen>
  );
};

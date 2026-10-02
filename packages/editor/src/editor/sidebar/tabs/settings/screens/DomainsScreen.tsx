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
 * The list (8136:214348): one card per domain, primary first — the name, the
 * PRIMARY badge on the primary, its connection line (`Connected · SSL
 * active`), `Set as primary` on every other domain (→ 8136:214574 →
 * `domains.setPrimary`, ADMIN, verified domains only) and `Manage DNS`; under
 * the cards `Add a domain` (→ AddDomainDialog → `domains.connect`).
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
import { Button, TextInput, ToggleSwitch } from "@/editor/chrome-ui";
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
import { SAVE_ERROR_MESSAGES } from "../constants";
import { useServerLoad } from "../hooks/useServerLoad";
import type { ScreenProps } from "../types";
import { AddDomainDialog, type AddDomainSubmission } from "../components/AddDomainDialog";
import { RemoveDomainDialog } from "../components/RemoveDomainDialog";
import { SetPrimaryDomainDialog } from "../components/SetPrimaryDomainDialog";

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

/** 8136:214348's line under each name: where the domain is, and its certificate. */
export function connectionLine(row: Pick<DomainRow, "status" | "sslStatus">): string {
  if (row.status === "VERIFIED") return `Connected · ${row.sslStatus === "ACTIVE" ? "SSL active" : "SSL pending"}`;
  if (row.status === "FAILED") return "DNS not found · check your records";
  return "Waiting for DNS · not connected yet";
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

// ─── Chrome ──────────────────────────────────────────────────────────────────

const LINE = "tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-soft)]";

/* 8136:214348: a card per domain — 24 in, 16 between the name and its row. */
const DOMAIN_CARD = `${SET_CARD} tw:flex tw:flex-col tw:gap-4 tw:p-6`;
const DOMAIN_NAME =
  "tw:m-0 tw:text-[length:var(--bk-text-16)] tw:font-semibold tw:leading-6 tw:tracking-[-0.16px] tw:text-[var(--bk-ink)]";
const DOMAIN_LINE = "tw:min-w-0 tw:flex-1 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]";
/* The board's PRIMARY badge: the accent on its tint, not a status tone. */
const PRIMARY_BADGE =
  "tw:inline-flex tw:h-5.5 tw:shrink-0 tw:items-center tw:rounded-full tw:border tw:border-[var(--bk-accent)] tw:bg-[var(--bk-accent-tint)] " +
  "tw:px-2 tw:text-[length:var(--bk-text-11)] tw:font-medium tw:uppercase tw:leading-4 tw:text-[var(--bk-accent)]";
/* The row's actions are text buttons — ink 13/500, no box (8136:214538). */
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
  // null role = unknown → don't gate in chrome; the server still enforces.
  const canManage = !readOnly && roleAtLeast(role, "ADMIN") !== false;
  const siteName = composer?.getProjectMetadata?.()?.name ?? "";

  const [rows, setRows] = React.useState<DomainRow[]>([]);
  const [busy, setBusy] = React.useState<Busy>(null);
  const [actionFailed, setActionFailed] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
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

  const setPrimary = async () => {
    const target = primaryTarget;
    if (!target || !projectId) return;
    setBusy({ kind: "primary", id: target.id });
    setPrimaryError(null);
    try {
      await api().setPrimary.mutate({ id: target.id, siteId: projectId });
      setPrimaryTarget(null);
      await relist();
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
          title="Custom domain"
          line={CARD_LINE}
          state={load.state}
          errorLine="Couldn't load your domains. Check your connection, then try again."
          onRetry={load.retry}
        />
      </Screen>
    );
  }

  const banner = saveError ?? (actionFailed ? SAVE_ERROR_MESSAGES.domains : null);
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

  const dialogs = (
    <>
      <AddDomainDialog
        open={addOpen}
        siteName={siteName}
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
                    Status
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
                        <StatusPill status={rec.verified ? "VERIFIED" : "PENDING"} data-testid={`set-dom-dns-state-${row.id}-${j}`} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
              {removedDomain} removed. This site is still available at its buildrick.app address.
            </div>
          ) : (
            <div className={LINE}>No custom domain. Using the free buildrick.app address until you connect one.</div>
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
          {rows.map((row, i) => (
            <section key={row.id} className={DOMAIN_CARD} data-testid={`set-dom-item-${row.id}`}>
              <h3 className={DOMAIN_NAME} id={i === 0 ? "dom-domain" : undefined}>
                {row.domain}
              </h3>
              <div className="tw:flex tw:min-h-8 tw:items-center tw:gap-4">
                {row.isPrimary ? (
                  <span className={PRIMARY_BADGE} id={i === 0 ? "dom-primary" : undefined} data-testid={`set-dom-primary-${row.id}`}>
                    Primary
                  </span>
                ) : null}
                <span className={DOMAIN_LINE} data-testid={`set-dom-line-${row.id}`}>
                  {connectionLine(row)}
                </span>
                {row.isPrimary ? null : (
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    className={ROW_ACTION}
                    disabled={!canManage || row.status !== "VERIFIED"}
                    title={!canManage ? ADMIN_REASON : row.status !== "VERIFIED" ? VERIFY_FIRST : undefined}
                    onClick={() => {
                      setPrimaryError(null);
                      setPrimaryTarget(row);
                    }}
                    data-testid={`set-dom-make-primary-${row.id}`}
                  >
                    Set as primary
                  </Button>
                )}
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  className={ROW_ACTION}
                  onClick={() => setManagingId(row.id)}
                  data-testid={`set-dom-manage-${row.id}`}
                >
                  Manage DNS
                </Button>
              </div>
            </section>
          ))}
          {addButton}
        </>
      )}
      {dialogs}
    </Screen>
  );
};

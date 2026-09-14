/**
 * Domains — Clone 3397:32206 (`SEO & publishing / Domains`): the site's
 * custom domains and the DNS behind each one.
 *
 * Nothing on this screen is saved by the footer — every action lands on the
 * server as it is confirmed, so the screen is never dirty and the shell's
 * footer reads `Actions apply immediately · nothing to save here` · Done.
 * The rows come from `domains.list` on open (3397:32985 loading, 3397:33085
 * load-error with Try again); none → the one empty card (3397:33034), and
 * right after a remove that card carries `<domain> removed…` (3455:15509).
 * Per domain, primary first: a **Custom domain** card — the name, its
 * status pill, `Force HTTPS` (writes `domains.update` at once) and
 * `Remove <domain>…` (3397:34402 confirm → `domains.remove`) — and a **DNS
 * records** card whose pills are `DnsRecord.verified` and whose `Check DNS`
 * runs `domains.check`, the real resolver. `Add domain` sits in the shell's
 * header (`registerHeaderAction`) and opens 3737:43669, which connects and
 * re-lists. A refused remove, toggle or check shows the banner (3397:33134)
 * over the cards, which stay as the server has them.
 *
 * Connect, remove and the toggle are ADMIN actions: a non-admin sees them
 * DISABLED with the reason attached, never hidden; the server enforces.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Badge, Button, TextInput, ToggleSwitch } from "@/editor/chrome-ui";
import { getBuildrikClient } from "@/services/api-client";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { useEditorRole } from "@/editor/shell/hooks/useEditorRole";
import { roleAtLeast } from "@/services/RoleService";
import { LoadCard, SCREEN_INFO, SET_BTN, SET_CARD, SET_EYEBROW, SaveErrorBanner, Screen, Section } from "../shared";
import { useServerLoad } from "../hooks/useServerLoad";
import type { ScreenProps } from "../types";
import { AddDomainDialog, type AddDomainSubmission } from "../components/AddDomainDialog";
import { RemoveDomainDialog } from "../components/RemoveDomainDialog";
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
  isPrimary: boolean;
  /** PRIMARY | REDIRECT | SUBDOMAIN */
  kind: string;
  forceHttps: boolean;
  dnsProvider: string | null;
  dnsRecords: DnsRecordRow[];
}

/** 3397:33134 — the banner a refused remove, toggle or check leaves over the cards. */
export const DOMAINS_SAVE_ERROR =
  "Domain changes were not saved. Your changes are still here. Review the values, then retry.";

const CARD_LINE = "Point your own domain at this site. DNS changes happen at your domain registrar.";
const ADMIN_REASON = "Only an admin can change the domain";

type Busy = { kind: "https" | "check" | "remove"; id: string } | null;

const primaryFirst = (rows: DomainRow[]): DomainRow[] =>
  [...rows].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));

/** `dom-domain`, `dom-domain-1`, … — the first domain's controls carry the
 *  bare ids the search registry points at; the rest stay unique. */
const nth = (stem: string, i: number) => (i === 0 ? stem : `${stem}-${i}`);

// ─── Status pill ─────────────────────────────────────────────────────────────

const PILL =
  "tw:inline-flex tw:h-5 tw:w-fit tw:items-center tw:rounded-full tw:border tw:px-2 tw:py-0 " +
  "tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:font-semibold tw:uppercase tw:tracking-[0.04em]";
const PILL_TONE: Record<string, { color: string; className: string }> = {
  VERIFIED: {
    color: "success",
    className: "tw:border-[var(--bk-success)] tw:bg-[var(--bk-success-tint)] tw:text-[var(--bk-success-text)]",
  },
  PENDING: {
    color: "warning",
    className: "tw:border-[var(--bk-warning)] tw:bg-[var(--bk-warning-tint)] tw:text-[var(--bk-warning-text)]",
  },
  FAILED: {
    color: "failure",
    className: "tw:border-[var(--bk-error)] tw:bg-[var(--bk-error-tint)] tw:text-[var(--bk-error-text)]",
  },
};
const PILL_OTHER = {
  color: "gray",
  className: "tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-subtle)] tw:text-[var(--bk-ink-soft)]",
};

const StatusPill: React.FC<{ status: string; "data-testid"?: string }> = ({ status, ...rest }) => {
  const tone = PILL_TONE[status] ?? PILL_OTHER;
  return (
    <Badge color={tone.color} className={`${PILL} ${tone.className}`} data-status={status} {...rest}>
      {status}
    </Badge>
  );
};

// ─── Row chrome ──────────────────────────────────────────────────────────────

/* Label-left rows, as 3397:32206 draws them (the SEO screen's Indexing card
   has the same shape). `col-span-full` keeps each on its own line in the
   Section's grid. */
const ROW = "tw:col-span-full tw:flex tw:items-center tw:gap-4";
const ROW_LABEL = "tw:w-48 tw:shrink-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-soft)]";

const RESTORE_STRIP =
  "tw:rounded tw:border tw:border-[var(--bk-warning)] tw:bg-[var(--bk-warning-tint)] tw:px-3 tw:py-2.5 " +
  "tw:text-[length:var(--bk-text-12)] tw:font-medium tw:leading-normal tw:text-[var(--bk-warning-text)]";

const TABLE = "tw:w-full tw:border-collapse tw:text-left tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]";
const TH =
  "tw:h-7 tw:border-b tw:border-[var(--bk-border)] tw:pr-4 tw:text-[length:var(--bk-text-11)] tw:font-medium " +
  "tw:uppercase tw:leading-4 tw:tracking-[0.06em] tw:text-[var(--bk-ink-muted)]";
const TD = "tw:h-8 tw:pr-4 tw:align-middle";
const TD_VALUE = `${TD} tw:max-w-0 tw:truncate tw:[font-family:var(--bk-font-mono)] tw:text-[length:var(--bk-text-12)]`;

const LINE = "tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-soft)]";

// ─── Screen ──────────────────────────────────────────────────────────────────

export const DomainsScreen: React.FC<ScreenProps> = ({
  composer,
  projectId,
  onDirtyChange,
  onLoadStateChange,
  registerRetryLoad,
  registerHeaderAction,
  saveError,
}) => {
  const role = useEditorRole();
  // null role = unknown → don't gate in chrome; the server still enforces.
  const canManage = roleAtLeast(role, "ADMIN") !== false;
  const siteName = composer?.getProjectMetadata?.()?.name ?? "";

  const [rows, setRows] = React.useState<DomainRow[]>([]);
  const [busy, setBusy] = React.useState<Busy>(null);
  const [actionFailed, setActionFailed] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [removeTarget, setRemoveTarget] = React.useState<DomainRow | null>(null);
  /** The domain a remove just took away — 3455:15509, gone on the next visit. */
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

  const ready = load.state === "ready";
  const hasRows = rows.length > 0;

  // The header's `Add domain` (3397:32206) — the shell renders it. On the
  // empty card the button is the card's own, so the header carries none.
  React.useEffect(() => {
    if (!registerHeaderAction) return;
    if (!ready || !hasRows) {
      registerHeaderAction(null);
      return;
    }
    registerHeaderAction(
      <Button
        type="button"
        size="xs"
        className={`${SET_BTN} tw:shrink-0`}
        disabled={!canManage}
        title={canManage ? undefined : ADMIN_REASON}
        onClick={() => setAddOpen(true)}
        data-testid="set-dom-add"
      >
        Add domain
      </Button>,
    );
    return () => registerHeaderAction(null);
  }, [registerHeaderAction, ready, hasRows, canManage]);

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
      setRemovedDomain(target.domain);
      await relist();
    } catch {
      setRemoveTarget(null);
      setActionFailed(true);
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

  const banner = saveError ?? (actionFailed ? DOMAINS_SAVE_ERROR : null);

  return (
    <Screen>
      {banner ? <SaveErrorBanner message={banner} /> : null}

      <div className={SCREEN_INFO} data-testid="set-dom-strip">
        Domain actions apply as soon as you confirm them. There is nothing to save on this screen.
      </div>
      <div className={RESTORE_STRIP} data-testid="set-dom-restore">
        Restoring a site version leaves this configuration unchanged.
      </div>

      {!hasRows ? (
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
          <Button
            type="button"
            size="xs"
            className={`${SET_BTN} tw:mt-1`}
            disabled={!canManage}
            title={canManage ? undefined : ADMIN_REASON}
            onClick={() => setAddOpen(true)}
            data-testid="set-dom-add"
          >
            Add domain
          </Button>
        </section>
      ) : null}

      {rows.map((row, i) => (
        <React.Fragment key={row.id}>
          <div data-testid={`set-dom-card-${row.id}`}>
            <Section title="Custom domain" anchor={nth("custom-domain", i)}>
              <div className={ROW}>
                <span id={`${nth("dom-domain", i)}-label`} className={ROW_LABEL}>
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
              <div className={ROW}>
                <span className={ROW_LABEL}>Status</span>
                <StatusPill status={row.status} data-testid={`set-dom-status-${row.id}`} />
              </div>
              <div className={ROW}>
                <span id={`${nth("dom-force-https", i)}-label`} className={ROW_LABEL}>
                  Force HTTPS
                </span>
                <ToggleSwitch
                  id={nth("dom-force-https", i)}
                  checked={row.forceHttps}
                  onChange={(next) => void setForceHttps(row, next)}
                  disabled={!canManage || isBusy("https", row.id)}
                  title={canManage ? undefined : ADMIN_REASON}
                  aria-labelledby={`${nth("dom-force-https", i)}-label`}
                  sizing="sm"
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
              <table className={TABLE} id={nth("dom-dns-records", i)} aria-label={`DNS records for ${row.domain}`}>
                <thead>
                  <tr>
                    <th scope="col" className={`${TH} tw:w-16`}>
                      Type
                    </th>
                    <th scope="col" className={`${TH} tw:w-32`}>
                      Name
                    </th>
                    <th scope="col" className={TH}>
                      Value
                    </th>
                    <th scope="col" className={`${TH} tw:w-28 tw:pr-0`}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {row.dnsRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className={`${TD} tw:text-[var(--bk-ink-muted)]`}>
                        No DNS records for this domain.
                      </td>
                    </tr>
                  ) : (
                    row.dnsRecords.map((rec, j) => (
                      <tr key={`${rec.type}-${rec.host}-${j}`} data-testid={`set-dom-dns-row-${row.id}-${j}`}>
                        <td className={`${TD} tw:font-medium`}>{rec.type}</td>
                        <td className={TD}>{rec.host}</td>
                        <td className={TD_VALUE} title={rec.value}>
                          {rec.value}
                        </td>
                        <td className={`${TD} tw:pr-0`}>
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
        </React.Fragment>
      ))}

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
    </Screen>
  );
};

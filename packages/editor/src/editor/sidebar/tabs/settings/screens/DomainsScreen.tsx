/**
 * DomainsScreen — custom-domain lifecycle inside the editor (P6, Figma Site
 * boards: none / adding / pending-dns / verified / failed / ssl-provisioning).
 *
 * Was a workspace deep-link into the dashboard; now an in-tab screen so the
 * "connect a domain" job never leaves the editor. Server owns everything —
 * this screen only reads siteDetail.domains.* and renders the six states.
 * Connect/remove are ADMIN actions: non-admins see the control DISABLED with
 * the reason attached, never hidden (Permissions boards).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { createBuildrikApiClient } from "@/services/api-client";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { useEditorRole } from "@/editor/shell/hooks/useEditorRole";
import { roleAtLeast } from "@/services/RoleService";
import { Field, Input, Screen, Section } from "../shared";
import type { ScreenProps } from "../types";
import { Button } from "@/editor/chrome-ui";

interface DnsRecordRow {
  id: string;
  type: string;
  host: string;
  value: string;
  verified: boolean;
}

interface DomainRow {
  id: string;
  domain: string;
  status: string; // PENDING | VERIFIED | FAILED
  sslStatus: string; // PENDING | ACTIVE | ...
  isPrimary: boolean;
  dnsRecords: DnsRecordRow[];
}

let _client: ReturnType<typeof createBuildrikApiClient> | null = null;
function client() {
  if (!_client) _client = createBuildrikApiClient(DASHBOARD_URL);
  return _client;
}

const RECHECK_MS = 30_000;
const ADMIN_REASON = "Only an admin can change the domain";

function CopyValue({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <Button
      color="light"
      size="xs"
      onClick={() => {
        void navigator.clipboard?.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }} className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]"
    >
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export const DomainsScreen: React.FC<ScreenProps> = ({ projectId, onDirtyChange }) => {
  const role = useEditorRole();
  // null role = unknown → don't gate in chrome; the server still enforces.
  const canManage = roleAtLeast(role, "ADMIN") !== false;

  const [rows, setRows] = React.useState<DomainRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [adding, setAdding] = React.useState(false);
  const [domainInput, setDomainInput] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const [checkingId, setCheckingId] = React.useState<string | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = React.useState<number | null>(null);

  React.useEffect(() => {
    onDirtyChange?.(adding && domainInput.trim().length > 0);
  }, [adding, domainInput, onDirtyChange]);

  const reload = React.useCallback(async () => {
    if (!projectId) {
      setRows([]);
      setLoading(false);
      return;
    }
    try {
      const list = (await client().siteDetail.domains.list.query({ siteId: projectId })) as DomainRow[];
      setRows(list);
      setLoadError(null);
    } catch {
      setLoadError("Couldn't load domains. Is the dashboard running?");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const runCheck = React.useCallback(
    async (domainId: string) => {
      if (!projectId) return;
      setCheckingId(domainId);
      try {
        await client().siteDetail.domains.check.mutate({ id: domainId, siteId: projectId });
        setLastCheckedAt(Date.now());
        await reload();
      } catch {
        // Board copy handles the failure state; a check that errors just
        // leaves the previous status on screen.
      } finally {
        setCheckingId(null);
      }
    },
    [projectId, reload],
  );

  // Boards: while DNS is pending the screen rechecks on its own every 30s —
  // "Checked 30s ago · rechecking every 30 seconds".
  const pendingId = rows.find((r) => r.status === "PENDING")?.id ?? null;
  React.useEffect(() => {
    if (!pendingId) return;
    const t = window.setInterval(() => void runCheck(pendingId), RECHECK_MS);
    return () => window.clearInterval(t);
  }, [pendingId, runCheck]);

  const handleConnect = async () => {
    if (!projectId) return;
    const domain = domainInput.trim().toLowerCase();
    if (!domain) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await client().siteDetail.domains.connect.mutate({ siteId: projectId, domain });
      setAdding(false);
      setDomainInput("");
      await reload();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Couldn't connect the domain.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (row: DomainRow) => {
    if (!window.confirm(`Remove ${row.domain}? The site keeps serving on its buildrick.app address.`)) return;
    try {
      await client().siteDetail.domains.remove.mutate({ id: row.id });
      await reload();
    } catch {
      setLoadError("Couldn't remove the domain.");
    }
  };

  const renderStatus = (row: DomainRow) => {
    if (row.status === "VERIFIED" && row.sslStatus !== "ACTIVE") {
      // Board: ssl-provisioning — verified DNS, certificate still issuing.
      return (
        <div className="bd-set-domain-status" data-tone="pending">
          ◷ DNS verified · issuing certificate — the domain isn't live until the certificate is ready.
          Usually under a minute.
        </div>
      );
    }
    if (row.status === "VERIFIED") {
      return (
        <div className="bd-set-domain-status" data-tone="ok">
          ✓ Connected — {row.domain} is live{row.isPrimary ? " (primary)" : ""}.
        </div>
      );
    }
    if (row.status === "FAILED") {
      return (
        <div className="bd-set-domain-status" data-tone="err">
          ⚠ DNS not found. Records can take up to 48 hours to propagate — if you added them recently,
          that's normal. Double-check the values below with your DNS provider.
        </div>
      );
    }
    return (
      <div className="bd-set-domain-status" data-tone="pending">
        Waiting for DNS. Add these records with your DNS provider, then check again.
      </div>
    );
  };

  if (!projectId) {
    return (
      <Screen>
        <Section title="Custom domain" desc="Open a real site to connect a domain.">
          <div className="bd-set-section-d">The demo project can't have a custom domain.</div>
        </Section>
      </Screen>
    );
  }

  return (
    <Screen>
      <Section
        title="Custom domain"
        desc="Point your own domain at this site. DNS changes happen at your domain registrar."
      >
        {loading && <div className="bd-set-section-d">Loading domains…</div>}
        {loadError && <div className="bd-set-section-d">{loadError}</div>}

        {!loading && !loadError && rows.length === 0 && !adding && (
          <div className="bd-set-domain-empty">
            <div className="bd-set-section-d">
              No custom domain. Using the free buildrick.app address until you connect one.
            </div>
            <Button
              color="light"
              size="xs"
              disabled={!canManage}
              title={canManage ? undefined : ADMIN_REASON}
              onClick={() => setAdding(true)}
            >
              Add domain
            </Button>
            {!canManage && <div className="bd-set-section-d">{ADMIN_REASON}.</div>}
          </div>
        )}

        {adding && (
          <div className="bd-set-domain-add">
            <Field label="Domain" hint="e.g. bellastudio.com or www.bellastudio.com">
              <Input
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="yourdomain.com"
                autoFocus
              />
            </Field>
            {submitError && <div className="bd-set-section-d">{submitError}</div>}
            <div className="bd-set-domain-actions">
              <Button size="xs" disabled={submitting || !domainInput.trim()} onClick={() => void handleConnect()}>
                {submitting ? "Connecting…" : "Connect"}
              </Button>
              <Button color="light" size="xs" onClick={() => { setAdding(false); setSubmitError(null); }} className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {rows.map((row) => (
          <div key={row.id} className="bd-set-domain-card">
            <div className="bd-set-domain-name">{row.domain}</div>
            {renderStatus(row)}

            {row.status !== "VERIFIED" && row.dnsRecords.length > 0 && (
              <div className="bd-set-domain-records">
                {row.dnsRecords.map((rec) => (
                  <div key={rec.id} className="bd-set-domain-record">
                    <span className="bd-set-domain-rec-type">{rec.type}</span>
                    <span className="bd-set-domain-rec-host">{rec.host}</span>
                    <span className="bd-set-domain-rec-value" title={rec.value}>{rec.value}</span>
                    <span className="bd-set-domain-rec-state">{rec.verified ? "✓" : "…"}</span>
                    <CopyValue value={rec.value} />
                  </div>
                ))}
              </div>
            )}

            <div className="bd-set-domain-actions">
              {row.status !== "VERIFIED" && (
                <Button
                  color="light"
                  size="xs"
                  disabled={checkingId === row.id}
                  onClick={() => void runCheck(row.id)}
                >
                  {checkingId === row.id ? "Checking…" : row.status === "FAILED" ? "⟳ Check again" : "⟳ Check now"}
                </Button>
              )}
              <Button
                color="light"
                size="xs"
                disabled={!canManage}
                title={canManage ? undefined : ADMIN_REASON}
                onClick={() => void handleRemove(row)} className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]"
              >
                Remove
              </Button>
            </div>
            {row.status === "PENDING" && lastCheckedAt && (
              <div className="bd-set-section-d">
                Checked {Math.max(1, Math.round((Date.now() - lastCheckedAt) / 1000))}s ago · rechecking every 30 seconds.
              </div>
            )}
          </div>
        ))}
      </Section>
    </Screen>
  );
};

/**
 * AddDomainDialog — Clone 3737:43669 `Add a domain` (640).
 *
 * Opened by the header's `Add domain` (and the empty card's). `Add a domain`
 * · `<site> · Domains` · `Domain name` with an `Available` / `Already
 * connected` / `Not a valid domain` tag at its right — the shape check is the
 * server's own hostname rule (`connectDomainSchema`, so the field refuses
 * exactly what `connect` would), the rest `domains.checkAvailability`,
 * debounced 300 ms · `Domain type` segmented `Primary · Redirect ·
 * Subdomain` · `DNS provider` + hint · `Nameservers` (read-only mono, per
 * provider) · `DNS records` (read-only mono: the SHAPE `connect` will create;
 * the real values are the server's, on the screen once it answers) · `Force
 * HTTPS` + toggle · the propagation note · Cancel · `Add domain`, enabled
 * only once the name is valid and available. A refused connect keeps the
 * dialog open with the reason under the form; success is the caller's to
 * close (it re-lists).
 *
 * The dialog is pure UI: the two server calls come in as props, so the
 * screen stays the one place the settings tab talks to tRPC.
 *
 * Shape from `libraryModal.ts` (title 16/600, body 13 ink-soft, 32-high
 * buttons, 8 gap) at the Clone's 640; controls 32 (density-32).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { connectDomainSchema } from "@buildrik/shared/schemas/site-detail";
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
import { SCREEN_FIELD_ERROR, SET_BTN, Select } from "../shared";
import {
  DNS_PROVIDERS,
  type DnsProviderId,
  type DomainAvailability,
  type DomainKind,
} from "@buildrik/shared/schemas/site-detail";

export interface AddDomainSubmission {
  domain: string;
  kind: DomainKind;
  dnsProvider: DnsProviderId;
  forceHttps: boolean;
}

export interface AddDomainDialogProps {
  open: boolean;
  siteName: string;
  /** `domains.checkAvailability` — called 300 ms after the last keystroke of a well-formed name. */
  checkAvailability(domain: string): Promise<DomainAvailability>;
  /** `domains.connect`. Resolve = the caller closes the dialog and re-lists; reject = the reason stays under the form. */
  onSubmit(input: AddDomainSubmission): Promise<void>;
  /** Cancel, Escape, the scrim. */
  onCancel(): void;
}

export const AVAILABILITY_DEBOUNCE_MS = 300;

const KINDS: { id: DomainKind; label: string }[] = [
  { id: "PRIMARY", label: "Primary" },
  { id: "REDIRECT", label: "Redirect" },
  { id: "SUBDOMAIN", label: "Subdomain" },
];

/* The three records `connect` writes (phase2-backend §1). The values are the
   server's to issue — the A target, the CNAME target and the `_buildrick`
   token — so before it answers the dialog draws the shape and nothing more. */
const EXPECTED_DNS_RECORDS: { type: string; host: string; value: string }[] = [
  { type: "A", host: "@", value: "<ip>" },
  { type: "CNAME", host: "www", value: "<target>" },
  { type: "TXT", host: "_buildrick", value: "brk-verify-…" },
];

type Availability = "idle" | "checking" | "failed" | DomainAvailability;

const TAG: Record<"checking" | "failed" | "available" | "connected" | "invalid", { label: string; tone: string }> = {
  checking: { label: "Checking…", tone: "tw:text-[var(--bk-ink-muted)]" },
  failed: { label: "Couldn't check", tone: "tw:text-[var(--bk-error-text)]" },
  available: { label: "Available", tone: "tw:text-[var(--bk-success-text)]" },
  connected: { label: "Already connected", tone: "tw:text-[var(--bk-error-text)]" },
  invalid: { label: "Not a valid domain", tone: "tw:text-[var(--bk-error-text)]" },
};

function tagFor(availability: Availability): keyof typeof TAG | null {
  if (availability === "idle") return null;
  if (availability === "checking" || availability === "failed") return availability;
  if (availability.available) return "available";
  return availability.reason === "connected" ? "connected" : "invalid";
}

/** The tag sits inside the field's box, so the text needs room to its right
 *  (`withRightIcon.off` is the slot the input's padding is merged from). */
const NAME_INPUT_THEME: NonNullable<CustomFlowbiteTheme["textInput"]> = {
  field: { input: { withRightIcon: { off: "tw:pr-36" } } },
};

const LABEL = `${BK_LABEL_CLASS} tw:block tw:leading-4`;
const NOTE = "tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const LABEL_ROW = "tw:flex tw:items-baseline tw:justify-between tw:gap-3";
const MONO_BLOCK =
  "tw:flex tw:flex-col tw:gap-1 tw:rounded-[var(--bk-radius-md)] tw:bg-[var(--bk-bg-subtle)] tw:px-3 tw:py-2 " +
  "tw:[font-family:var(--bk-font-mono)] tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-soft)]";
const RECORDS_TABLE =
  "tw:w-full tw:border-separate tw:border-spacing-0 tw:overflow-hidden tw:rounded-[var(--bk-radius-md)] tw:border tw:border-[var(--bk-border)] " +
  "tw:text-left tw:[font-family:var(--bk-font-mono)] tw:text-[length:var(--bk-text-12)] tw:leading-4";
const RECORDS_HEAD =
  "tw:h-7 tw:bg-[var(--bk-bg-subtle)] tw:px-3 tw:[font-family:var(--bk-font-ui)] tw:text-[length:var(--bk-text-11)] tw:font-medium " +
  "tw:uppercase tw:tracking-[0.06em] tw:text-[var(--bk-ink-muted)]";
const RECORDS_CELL = "tw:h-7 tw:border-t tw:border-[var(--bk-border)] tw:px-3 tw:text-[var(--bk-ink-soft)]";

export function AddDomainDialog({ open, siteName, checkAvailability, onSubmit, onCancel }: AddDomainDialogProps) {
  const [domain, setDomain] = React.useState("");
  const [kind, setKind] = React.useState<DomainKind>("PRIMARY");
  const [provider, setProvider] = React.useState<DnsProviderId>("namecheap");
  const [forceHttps, setForceHttps] = React.useState(true);
  const [availability, setAvailability] = React.useState<Availability>("idle");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  /* A reopened dialog starts clean — the last attempt's name and reason are
     never what the next door meant. */
  React.useEffect(() => {
    if (!open) return;
    setDomain("");
    setKind("PRIMARY");
    setProvider("namecheap");
    setForceHttps(true);
    setAvailability("idle");
    setSubmitting(false);
    setError(null);
  }, [open]);

  const name = domain.trim().toLowerCase();

  const checkRef = React.useRef(checkAvailability);
  checkRef.current = checkAvailability;

  React.useEffect(() => {
    if (!open) return;
    if (name === "") {
      setAvailability("idle");
      return;
    }
    if (!connectDomainSchema.shape.domain.safeParse(name).success) {
      setAvailability({ available: false, reason: "invalid" });
      return;
    }
    let stale = false;
    setAvailability("checking");
    const timer = window.setTimeout(() => {
      checkRef
        .current(name)
        .then((result) => {
          if (!stale) setAvailability(result);
        })
        .catch(() => {
          if (!stale) setAvailability("failed");
        });
    }, AVAILABILITY_DEBOUNCE_MS);
    return () => {
      stale = true;
      window.clearTimeout(timer);
    };
  }, [open, name]);

  const tag = tagFor(availability);
  const available = typeof availability === "object" && availability.available;
  const chosen = DNS_PROVIDERS.find((p) => p.id === provider) ?? DNS_PROVIDERS[0];

  const submit = async () => {
    if (!available || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ domain: name, kind, dnsProvider: provider, forceHttps });
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Couldn't add the domain.");
      setSubmitting(false);
    }
  };

  return (
    <ModalRoot open={open} onClose={submitting ? undefined : onCancel}>
      <ModalContent size="table" srTitle={siteName ? `Add a domain · ${siteName}` : "Add a domain"} data-testid="set-dom-dialog">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="set-dom-dialog-title">
          Add a domain
        </h2>
        <ModalBody className="tw:flex tw:flex-col tw:gap-3">
          <p className={LIBRARY_MODAL_BODY} data-testid="set-dom-dialog-scope">
            {siteName ? `${siteName} · ` : ""}Domains
          </p>

          <div className="tw:flex tw:flex-col tw:gap-1.5">
            <Label htmlFor="set-dom-name" className={LABEL}>
              Domain name
            </Label>
            <div className="tw:relative">
              <TextInput
                id="set-dom-name"
                type="text"
                value={domain}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDomain(e.target.value)}
                placeholder="yourdomain.com"
                autoFocus
                autoComplete="off"
                spellCheck={false}
                theme={NAME_INPUT_THEME}
                aria-invalid={tag === "connected" || tag === "invalid" ? true : undefined}
                aria-describedby={tag ? "set-dom-avail" : undefined}
                data-testid="set-dom-name"
              />
              {tag ? (
                <span
                  id="set-dom-avail"
                  className={`tw:pointer-events-none tw:absolute tw:top-0 tw:right-3 tw:flex tw:h-8 tw:items-center tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:font-medium ${TAG[tag].tone}`}
                  data-state={tag}
                  data-testid="set-dom-avail"
                >
                  {TAG[tag].label}
                </span>
              ) : null}
            </div>
          </div>

          <div className="tw:flex tw:flex-col tw:gap-1.5">
            <span id="set-dom-kind-label" className={LABEL}>
              Domain type
            </span>
            <div role="group" aria-labelledby="set-dom-kind-label" className="tw:flex tw:items-center tw:gap-2">
              {KINDS.map((k) => (
                <Button
                  key={k.id}
                  type="button"
                  size="xs"
                  variant={kind === k.id ? "primary" : "secondary"}
                  className={SET_BTN}
                  aria-pressed={kind === k.id}
                  onClick={() => setKind(k.id)}
                  data-testid={`set-dom-kind-${k.id.toLowerCase()}`}
                >
                  {k.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="tw:flex tw:flex-col tw:gap-1.5">
            <Label htmlFor="set-dom-provider" className={LABEL}>
              DNS provider
            </Label>
            <Select
              id="set-dom-provider"
              value={provider}
              onChange={(e) => {
                const next = DNS_PROVIDERS.find((p) => p.id === e.target.value);
                if (next) setProvider(next.id);
              }}
              data-testid="set-dom-provider"
            >
              {DNS_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </Select>
            <span className={NOTE}>Cloudflare, GoDaddy and Other are also supported.</span>
          </div>

          <div className="tw:flex tw:flex-col tw:gap-1.5">
            <div className={LABEL_ROW}>
              <span id="set-dom-ns-label" className={LABEL}>
                Nameservers
              </span>
              <span className={NOTE}>Read-only · set at your registrar</span>
            </div>
            <div className={MONO_BLOCK} aria-labelledby="set-dom-ns-label" data-testid="set-dom-ns">
              {chosen.nameservers.length === 0 ? (
                <span>Set at your registrar.</span>
              ) : (
                chosen.nameservers.map((ns, i) => <span key={i}>{ns}</span>)
              )}
            </div>
          </div>

          <div className="tw:flex tw:flex-col tw:gap-1.5">
            <div className={LABEL_ROW}>
              <span id="set-dom-records-label" className={LABEL}>
                DNS records
              </span>
              <span className={NOTE}>Add these at {chosen.id === "other" ? "your registrar" : chosen.label}</span>
            </div>
            <table className={RECORDS_TABLE} aria-labelledby="set-dom-records-label" data-testid="set-dom-records">
              <thead>
                <tr>
                  <th scope="col" className={RECORDS_HEAD}>
                    Type
                  </th>
                  <th scope="col" className={RECORDS_HEAD}>
                    Name
                  </th>
                  <th scope="col" className={`${RECORDS_HEAD} tw:w-full`}>
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {EXPECTED_DNS_RECORDS.map((rec) => (
                  <tr key={rec.type}>
                    <td className={`${RECORDS_CELL} tw:whitespace-nowrap tw:text-[var(--bk-ink)]`}>{rec.type}</td>
                    <td className={`${RECORDS_CELL} tw:whitespace-nowrap`}>{rec.host}</td>
                    <td className={`${RECORDS_CELL} tw:text-[var(--bk-ink-muted)]`}>{rec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="tw:flex tw:items-center tw:justify-between tw:gap-4 tw:rounded-[var(--bk-radius-md)] tw:border tw:border-[var(--bk-border)] tw:px-3 tw:py-2">
            <div className="tw:flex tw:min-w-0 tw:flex-col tw:gap-0.5">
              <span id="set-dom-force-https-label" className="tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]">
                Force HTTPS
              </span>
              <span className="tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
                Redirect every http:// request to https://.
              </span>
            </div>
            <ToggleSwitch
              id="set-dom-force-https"
              checked={forceHttps}
              onChange={setForceHttps}
              sizing="sm"
              aria-labelledby="set-dom-force-https-label"
              data-testid="set-dom-force-https"
            />
          </div>

          <span className={NOTE}>DNS can take up to 48 hours to propagate. SSL is issued automatically.</span>

          {error ? (
            <div role="alert" className={SCREEN_FIELD_ERROR} data-testid="set-dom-dialog-error">
              {error}
            </div>
          ) : null}
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT} data-testid="set-dom-dialog-foot">
          <Button
            type="button"
            size="xs"
            variant="secondary"
            className={LIBRARY_MODAL_BTN_SECONDARY}
            disabled={submitting}
            onClick={onCancel}
            data-testid="set-dom-cancel"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="xs"
            className={LIBRARY_MODAL_BTN_PRIMARY}
            disabled={!available || submitting}
            onClick={() => void submit()}
            data-testid="set-dom-submit"
          >
            Add domain
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}

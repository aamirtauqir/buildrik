/**
 * Vercel Deployments API helper.
 *
 * Used by the publish worker (`app/api/workers/publish/[jobId]/route.ts`)
 * to deploy site HTML to Vercel and read deployment status.
 *
 * Env:
 *   VERCEL_TOKEN          — read only by `isVercelConfigured()` as a dev-mode
 *                           probe. HTTP helpers receive the token as a param.
 *   VERCEL_TEAM_ID        — read only by callers, passed in as `teamId` param.
 *   VERCEL_PROJECT_PREFIX — optional. Defaults to "buildrik-site-".
 *
 * See docs/plans/2026-05-06-phase-1-vercel-publish.md for design rationale.
 */

const VERCEL_API_BASE = "https://api.vercel.com";
const DEFAULT_PROJECT_PREFIX = "buildrik-site-";
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60_000;

export interface VercelFile {
  /** Relative path inside the deployment, e.g. "index.html" or "about/index.html". */
  file: string;
  /** UTF-8 string contents. Will be base64-encoded for transport. */
  data: string;
}

export interface DeploymentResult {
  id: string;
  /** Deployment-specific URL — includes hash + team suffix, may be SSO-gated. */
  url: string;
  /**
   * Production aliases assigned to this deployment. The shortest entry is
   * the canonical project URL (`<project>.vercel.app`) which is the public
   * public face of the site; the longer team-scoped entries are typically
   * gated by Vercel's deployment protection.
   */
  alias?: string[];
  readyState: "QUEUED" | "INITIALIZING" | "BUILDING" | "READY" | "ERROR" | "CANCELED";
}

export interface DeploymentStatus extends DeploymentResult {
  errorMessage?: string;
}

/**
 * Pick the public-facing URL from a deployment.
 *
 * Order of preference:
 * 1. Shortest entry from `alias[]` — Vercel's production canonical, public
 *    on hobby+pro accounts regardless of team deployment-protection.
 * 2. `${projectName}.vercel.app` — Vercel always assigns this for production
 *    deploys but the alias field can be empty for a few seconds after
 *    readyState=READY. This is the deterministic fallback when we know
 *    the project name.
 * 3. The deployment-specific `url` — only used when both above are absent.
 *    Note that this URL is SSO-gated on Pro+ teams and will serve the
 *    Vercel auth wall to end users, so we avoid it whenever possible.
 */
export function pickPublicUrl(
  d: { url: string; alias?: string[] },
  projectNameFallback?: string,
): string {
  if (d.alias && d.alias.length > 0) {
    const shortest = [...d.alias].sort((a, b) => a.length - b.length)[0];
    return `https://${shortest}`;
  }
  if (projectNameFallback) {
    return `https://${projectNameFallback}.vercel.app`;
  }
  return `https://${d.url}`;
}

export class VercelApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "VercelApiError";
  }
}

/**
 * Returns whether Vercel is configured. Worker uses this to decide
 * between real deployment and dev simulation fallback.
 */
export function isVercelConfigured(): boolean {
  return Boolean(process.env.VERCEL_TOKEN);
}

/**
 * DNS-safe project name from a site slug.
 * Vercel accepts [a-z0-9-]+ up to 100 chars.
 */
export function slugifyProjectName(slug: string): string {
  const prefix = process.env.VERCEL_PROJECT_PREFIX ?? DEFAULT_PROJECT_PREFIX;
  const safe = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const name = `${prefix}${safe}`;
  return name.slice(0, 100);
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function teamQueryString(teamId: string | null): string {
  return teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
}

/**
 * Create a new Vercel deployment.
 *
 * Returns the deployment id + initial URL. Caller must poll
 * `getDeploymentStatus(id)` until `readyState === "READY"` or "ERROR".
 *
 * Throws VercelApiError on non-2xx response.
 */
export async function createVercelDeployment({
  token,
  teamId,
  projectName,
  files,
}: {
  token: string;
  teamId: string | null;
  projectName: string;
  files: VercelFile[];
}): Promise<DeploymentResult> {
  const body = {
    name: projectName,
    target: "production",
    files: files.map((f) => ({
      file: f.file,
      data: Buffer.from(f.data, "utf-8").toString("base64"),
      encoding: "base64",
    })),
    projectSettings: { framework: null },
  };

  const res = await fetch(`${VERCEL_API_BASE}/v13/deployments${teamQueryString(teamId)}`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as {
      error?: { code?: string; message?: string };
    };
    throw new VercelApiError(
      res.status,
      errBody.error?.code ?? "UNKNOWN",
      errBody.error?.message ?? `Vercel API ${res.status}`,
    );
  }

  const data = (await res.json()) as {
    id: string;
    url: string;
    alias?: string[];
    readyState: DeploymentResult["readyState"];
  };
  return { id: data.id, url: data.url, alias: data.alias, readyState: data.readyState };
}

/**
 * Get current status of a deployment by id.
 */
export async function getDeploymentStatus({
  token,
  teamId,
  deploymentId,
}: {
  token: string;
  teamId: string | null;
  deploymentId: string;
}): Promise<DeploymentStatus> {
  const res = await fetch(
    `${VERCEL_API_BASE}/v13/deployments/${deploymentId}${teamQueryString(teamId)}`,
    { headers: authHeaders(token) },
  );

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as {
      error?: { code?: string; message?: string };
    };
    throw new VercelApiError(
      res.status,
      errBody.error?.code ?? "UNKNOWN",
      errBody.error?.message ?? `Vercel API ${res.status}`,
    );
  }

  const data = (await res.json()) as {
    id: string;
    url: string;
    alias?: string[];
    readyState: DeploymentResult["readyState"];
    errorMessage?: string;
  };

  return {
    id: data.id,
    url: data.url,
    alias: data.alias,
    readyState: data.readyState,
    errorMessage: data.errorMessage,
  };
}

/**
 * Poll a deployment until it reaches a terminal state (READY/ERROR/CANCELED)
 * or POLL_TIMEOUT_MS elapses.
 *
 * Caller should treat timeout as an error and surface to the user.
 */
export async function waitForDeploymentReady({
  token,
  teamId,
  deploymentId,
  signal,
}: {
  token: string;
  teamId: string | null;
  deploymentId: string;
  signal?: AbortSignal;
}): Promise<DeploymentStatus> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (signal?.aborted) throw new Error("ABORTED");

    const status = await getDeploymentStatus({ token, teamId, deploymentId });
    if (status.readyState === "READY" || status.readyState === "ERROR" || status.readyState === "CANCELED") {
      return status;
    }
    await delay(POLL_INTERVAL_MS);
  }

  throw new VercelApiError(408, "TIMEOUT", `Deployment ${deploymentId} did not become ready within ${POLL_TIMEOUT_MS}ms`);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** A DNS record Vercel requires for domain verification / routing. */
export interface VercelDomainVerification {
  type: string;
  domain: string;
  value: string;
  reason?: string;
}

export interface AddDomainResult {
  name: string;
  /** True once Vercel can serve the domain (DNS points at Vercel). */
  verified: boolean;
  /** Records the user must add at their DNS provider (when not yet verified). */
  verification: VercelDomainVerification[];
}

/**
 * Attach a custom domain to a Vercel project so the project actually serves it.
 * Without this call a "connected" domain in our DB resolved to nothing — the
 * DNS instructions pointed at a host Vercel was never told to route. Returns
 * Vercel's verification records (TXT/CNAME) for the user to add.
 *
 * `409 domain_already_in_use` is treated as success (idempotent re-connect):
 * the domain is already attached to this project.
 *
 * Throws VercelApiError on other non-2xx responses.
 */
export async function addDomainToVercelProject({
  token,
  teamId,
  projectName,
  domain,
}: {
  token: string;
  teamId: string | null;
  projectName: string;
  domain: string;
}): Promise<AddDomainResult> {
  const res = await fetch(
    `${VERCEL_API_BASE}/v10/projects/${encodeURIComponent(projectName)}/domains${teamQueryString(teamId)}`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ name: domain }),
    },
  );

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as {
      error?: { code?: string; message?: string };
    };
    const code = errBody.error?.code ?? "UNKNOWN";
    // Already attached → idempotent success.
    if (res.status === 409 || code === "domain_already_in_use") {
      return { name: domain, verified: true, verification: [] };
    }
    throw new VercelApiError(res.status, code, errBody.error?.message ?? `Vercel API ${res.status}`);
  }

  const data = (await res.json()) as {
    name?: string;
    verified?: boolean;
    verification?: VercelDomainVerification[];
  };
  return {
    name: data.name ?? domain,
    verified: Boolean(data.verified),
    verification: data.verification ?? [],
  };
}

/**
 * Detach a custom domain from a Vercel project. Called when a user removes a
 * domain in Buildrik — without it the domain stays attached to the Vercel
 * project (an orphan) even though our DB row is gone. A 404 means it was
 * already gone, which is an idempotent success.
 */
export async function removeDomainFromVercelProject({
  token,
  teamId,
  projectName,
  domain,
}: {
  token: string;
  teamId: string | null;
  projectName: string;
  domain: string;
}): Promise<void> {
  const res = await fetch(
    `${VERCEL_API_BASE}/v9/projects/${encodeURIComponent(projectName)}/domains/${encodeURIComponent(domain)}${teamQueryString(teamId)}`,
    {
      method: "DELETE",
      headers: authHeaders(token),
    },
  );
  if (!res.ok && res.status !== 404) {
    const errBody = (await res.json().catch(() => ({}))) as { error?: { code?: string; message?: string } };
    throw new VercelApiError(res.status, errBody.error?.code ?? "UNKNOWN", errBody.error?.message ?? `Vercel API ${res.status}`);
  }
}

/**
 * Delete a Vercel deployment. Used to take a site OFFLINE on unpublish: the
 * project and its custom domains stay attached, but removing the production
 * deployment means nothing serves until the next publish. A 404 (already gone)
 * is treated as success. Throws VercelApiError on other non-2xx.
 */
export async function deleteVercelDeployment({
  token,
  teamId,
  deploymentId,
}: {
  token: string;
  teamId: string | null;
  deploymentId: string;
}): Promise<void> {
  const res = await fetch(
    `${VERCEL_API_BASE}/v13/deployments/${encodeURIComponent(deploymentId)}${teamQueryString(teamId)}`,
    {
      method: "DELETE",
      headers: authHeaders(token),
    },
  );
  if (!res.ok && res.status !== 404) {
    const errBody = (await res.json().catch(() => ({}))) as { error?: { code?: string; message?: string } };
    throw new VercelApiError(res.status, errBody.error?.code ?? "UNKNOWN", errBody.error?.message ?? `Vercel API ${res.status}`);
  }
}

/**
 * Enable or disable Vercel deployment password protection on a project. This is
 * what actually enforces a published-site password on the public
 * `<project>.vercel.app` URL — the static deploy is otherwise world-readable.
 *
 * Pass a plaintext password to enable; pass null to disable. Password
 * protection is a Vercel Pro/Enterprise feature: on Hobby the API returns
 * 402/403. Callers should treat that as "not available on this plan" rather
 * than a hard publish failure (see VercelApiError.status).
 *
 * Throws VercelApiError on non-2xx (including the plan-gating 402/403).
 */
export async function setProjectPasswordProtection({
  token,
  teamId,
  projectName,
  password,
}: {
  token: string;
  teamId: string | null;
  projectName: string;
  password: string | null;
}): Promise<void> {
  const res = await fetch(
    `${VERCEL_API_BASE}/v9/projects/${encodeURIComponent(projectName)}${teamQueryString(teamId)}`,
    {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({
        passwordProtection: password
          ? { deploymentType: "all", password }
          : null,
      }),
    },
  );

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as {
      error?: { code?: string; message?: string };
    };
    throw new VercelApiError(
      res.status,
      errBody.error?.code ?? "UNKNOWN",
      errBody.error?.message ?? `Vercel API ${res.status}`,
    );
  }
}

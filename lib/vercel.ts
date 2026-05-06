/**
 * Vercel Deployments API helper.
 *
 * Used by the publish worker (`app/api/workers/publish/[jobId]/route.ts`)
 * to deploy site HTML to Vercel and read deployment status.
 *
 * Env:
 *   VERCEL_TOKEN          — required for real deployments. If unset, callers
 *                           should fall back to dev simulation.
 *   VERCEL_TEAM_ID        — optional. If set, deployments scope to this team.
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
  url: string;
  readyState: "QUEUED" | "INITIALIZING" | "BUILDING" | "READY" | "ERROR" | "CANCELED";
}

export interface DeploymentStatus extends DeploymentResult {
  errorMessage?: string;
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

function authHeaders(): HeadersInit {
  const token = process.env.VERCEL_TOKEN;
  if (!token) throw new Error("VERCEL_TOKEN is not set");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function teamQueryString(): string {
  const team = process.env.VERCEL_TEAM_ID;
  return team ? `?teamId=${encodeURIComponent(team)}` : "";
}

/**
 * Create a new Vercel deployment.
 *
 * Returns the deployment id + initial URL. Caller must poll
 * `getDeploymentStatus(id)` until `readyState === "READY"` or "ERROR".
 *
 * Throws VercelApiError on non-2xx response.
 */
export async function createVercelDeployment(
  projectName: string,
  files: VercelFile[],
): Promise<DeploymentResult> {
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

  const res = await fetch(`${VERCEL_API_BASE}/v13/deployments${teamQueryString()}`, {
    method: "POST",
    headers: authHeaders(),
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
    readyState: DeploymentResult["readyState"];
  };
  return { id: data.id, url: data.url, readyState: data.readyState };
}

/**
 * Get current status of a deployment by id.
 */
export async function getDeploymentStatus(
  deploymentId: string,
): Promise<DeploymentStatus> {
  const res = await fetch(
    `${VERCEL_API_BASE}/v13/deployments/${deploymentId}${teamQueryString()}`,
    { headers: authHeaders() },
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
    readyState: DeploymentResult["readyState"];
    errorMessage?: string;
  };

  return {
    id: data.id,
    url: data.url,
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
export async function waitForDeploymentReady(
  deploymentId: string,
  signal?: AbortSignal,
): Promise<DeploymentStatus> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (signal?.aborted) throw new Error("ABORTED");

    const status = await getDeploymentStatus(deploymentId);
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

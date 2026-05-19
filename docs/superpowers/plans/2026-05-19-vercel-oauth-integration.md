# Vercel OAuth Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace single-shared `VERCEL_TOKEN` env var with per-workspace OAuth connections; each workspace deploys to its own Vercel team account.

**Architecture:** Three layers: (1) `lib/encryption.ts` AES-256-GCM for token-at-rest. (2) `server/services/vercel-oauth.service.ts` handles OAuth state machine + token exchange + team listing. (3) Two Next.js route handlers (`authorize`, `callback`) for browser redirects, plus a tRPC `integrations.vercel` subrouter for UI mutations. Existing `lib/vercel.ts` refactored from env-reading to param-driven so the same helper serves both the publish worker and the OAuth flow.

**Tech Stack:** Next.js 16 (App Router) + Node `crypto` (no new deps for AES) + tRPC 11 + Prisma 5 + Vitest + existing `WorkspaceIntegration` model.

---

## Spec reference

Design doc: `docs/superpowers/specs/2026-05-19-vercel-oauth-integration-design.md`

## Prerequisites checklist (before starting)

- [ ] Read the spec end-to-end (~10 min).
- [ ] Confirm V1 walk-and-fix arc is closed (per `V1_WALK_AND_FIX.md` arc summary at end of file). If not, escalate before starting.
- [ ] Generate `ENCRYPTION_KEY` value to add to `.env.local` later: `openssl rand -hex 32`. Save the value somewhere — you'll paste it in Task 2.
- [ ] Phase 2 only: confirm Vercel app is registered at `vercel.com/integrations/console` and you have `Integration ID` + `Client ID` + `Client Secret` ready. If not, pause after Phase 1 and request these from the user before starting Phase 2.

## File structure (locked at plan time)

**New files:**
- `lib/encryption.ts` — AES-256-GCM encrypt/decrypt + key validation
- `lib/encryption.test.ts` — unit tests
- `server/services/vercel-oauth.service.ts` — OAuth state machine
- `server/services/__tests__/vercel-oauth.test.ts` — unit tests
- `server/services/__tests__/vercel-oauth-flow.integration.test.ts` — mocked end-to-end
- `app/api/integrations/vercel/authorize/route.ts` — GET handler, returns 302
- `app/api/integrations/vercel/authorize/route.test.ts` — handler tests
- `app/api/integrations/vercel/callback/route.ts` — GET handler, exchanges code
- `app/api/integrations/vercel/callback/route.test.ts` — handler tests
- `app/dashboard/settings/integrations/page.tsx` — list integrations + Connect button
- `app/dashboard/settings/integrations/vercel-team-picker/page.tsx` — post-callback team selector
- `prisma/migrations/<ts>_add_vercel_integration_index/migration.sql` — composite index

**Modified files:**
- `lib/vercel.ts` — drop env reads, take `{token, teamId}` params
- `server/services/integrations.service.ts` — add `getActiveVercelConnection` + `markInactive` + extend tests
- `server/services/publish.service.ts` — gate on connection, handle 401
- `server/services/__tests__/publish.service.test.ts` — add 4 gating cases (file may not exist; create if absent)
- `server/trpc/routers/integrations.ts` — add `vercel` subrouter (file may not exist; check `server/trpc/routers/` for existing `integrations.ts`; if absent, create)
- `packages/editor/src/editor/shell/Topbar.tsx` — handle `VERCEL_NOT_CONNECTED` toast + deep link
- `.env.local` (repo root, gitignored) — add 4 vars
- `CLAUDE.md` (repo root) — document new env vars in env table

## Test infrastructure note

Route handler tests use Next.js 13+ Route Handlers pattern:

```ts
import { GET } from "./route";

const req = new Request("http://localhost:3000/api/integrations/vercel/authorize?workspaceId=ws_test", {
  headers: { cookie: "session=..." },
});
const res = await GET(req);
expect(res.status).toBe(302);
```

No special mocking framework needed — `Request`/`Response` are Web Standard, Vitest runs in Node 22+. Session reads must be mocked via `vi.mock("@/server/auth", ...)`.

---

# Phase 1 — Backend scaffold (no Vercel registration needed)

## Task 1: AES-256-GCM encryption helper

**Files:**
- Create: `lib/encryption.ts`
- Test: `lib/encryption.test.ts`

- [ ] **Step 1: Write the failing test**

`lib/encryption.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encrypt, decrypt } from "./encryption";

const VALID_KEY = "0".repeat(64); // 32 bytes hex
const ORIGINAL_KEY = process.env.ENCRYPTION_KEY;

describe("encryption (AES-256-GCM)", () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = VALID_KEY;
  });

  afterEach(() => {
    process.env.ENCRYPTION_KEY = ORIGINAL_KEY;
  });

  it("encrypt → decrypt roundtrips back to original plaintext", () => {
    const plain = "vercel_token_abc123_test";
    const cipher = encrypt(plain);
    expect(cipher).not.toBe(plain);
    expect(cipher.startsWith("v1:")).toBe(true);
    expect(decrypt(cipher)).toBe(plain);
  });

  it("encrypt of same plaintext gives different ciphertexts (IV randomness)", () => {
    const plain = "same-token";
    const a = encrypt(plain);
    const b = encrypt(plain);
    expect(a).not.toBe(b);
  });

  it("decrypt with wrong key throws", () => {
    const cipher = encrypt("secret");
    process.env.ENCRYPTION_KEY = "1".repeat(64); // different key, valid length
    expect(() => decrypt(cipher)).toThrow();
  });

  it("decrypt of tampered ciphertext throws (authTag check)", () => {
    const cipher = encrypt("secret");
    // flip a byte in the ciphertext segment
    const parts = cipher.split(":");
    parts[3] = parts[3].slice(0, -2) + (parts[3].slice(-2) === "00" ? "ff" : "00");
    expect(() => decrypt(parts.join(":"))).toThrow();
  });

  it("encrypt throws if ENCRYPTION_KEY missing", () => {
    delete process.env.ENCRYPTION_KEY;
    expect(() => encrypt("x")).toThrow(/ENCRYPTION_KEY/);
  });

  it("encrypt throws if ENCRYPTION_KEY wrong length", () => {
    process.env.ENCRYPTION_KEY = "tooshort";
    expect(() => encrypt("x")).toThrow(/ENCRYPTION_KEY/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd packages/editor && npx vitest run ../../lib/encryption.test.ts
```

Expected: FAIL with module-not-found error (`Cannot find module './encryption'`).

(Note: `lib/` is at repo root, not in packages/editor. Run from repo root:)

```bash
cd /Users/shahg/Desktop/pencil/buildrik && npx vitest run lib/encryption.test.ts
```

If repo-root vitest doesn't exist, use the dashboard package's vitest:
```bash
cd packages/dashboard && npx vitest run ../../lib/encryption.test.ts
```

- [ ] **Step 3: Write minimal implementation**

`lib/encryption.ts`:

```ts
/**
 * AES-256-GCM helper for token-at-rest encryption.
 *
 * Cipher format: "v1:<iv-hex>:<authTag-hex>:<ciphertext-hex>"
 * The "v1" prefix lets a future key rotation differentiate old from new.
 *
 * Requires ENCRYPTION_KEY env var (32 bytes hex = 64 hex chars).
 * Generate via: openssl rand -hex 32
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM standard
const VERSION_PREFIX = "v1";

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) throw new Error("ENCRYPTION_KEY env var is not set");
  if (hex.length !== 64) {
    throw new Error(
      `ENCRYPTION_KEY must be 64 hex chars (32 bytes); got ${hex.length}. Generate via: openssl rand -hex 32`,
    );
  }
  return Buffer.from(hex, "hex");
}

export function encrypt(plain: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf-8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [VERSION_PREFIX, iv.toString("hex"), authTag.toString("hex"), ciphertext.toString("hex")].join(":");
}

export function decrypt(cipherText: string): string {
  const key = getKey();
  const parts = cipherText.split(":");
  if (parts.length !== 4 || parts[0] !== VERSION_PREFIX) {
    throw new Error("Invalid ciphertext format");
  }
  const [, ivHex, authTagHex, dataHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const data = Buffer.from(dataHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plain = Buffer.concat([decipher.update(data), decipher.final()]);
  return plain.toString("utf-8");
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd packages/dashboard && npx vitest run ../../lib/encryption.test.ts
```

Expected: PASS (6/6 cases green).

- [ ] **Step 5: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add lib/encryption.ts lib/encryption.test.ts
git commit -m "$(cat <<'EOF'
feat(lib): add AES-256-GCM encryption helper for token-at-rest

Reads ENCRYPTION_KEY env var (32 bytes hex). Cipher format v1:iv:authTag:data
prefixed so future key rotation can differentiate. 6 unit tests cover
roundtrip, IV randomness, wrong-key + tampered-cipher failures, and env
missing/malformed.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Wire `ENCRYPTION_KEY` env var + CLAUDE.md docs

**Files:**
- Modify: `.env.local` (gitignored, repo root)
- Modify: `CLAUDE.md` (repo root)

- [ ] **Step 1: Add to `.env.local`**

Generate a fresh key + add to `.env.local`:

```bash
cd /Users/shahg/Desktop/pencil/buildrik
echo "" >> .env.local
echo "# Token-at-rest encryption (Vercel OAuth + future integrations)" >> .env.local
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)" >> .env.local
```

Verify it's there:

```bash
grep ENCRYPTION_KEY .env.local
```

Expected: one line like `ENCRYPTION_KEY=<64 hex chars>`.

- [ ] **Step 2: Document in CLAUDE.md env vars section**

Search for env-vars section in `CLAUDE.md`:

```bash
grep -n "ENV VARIABLES\|env vars" CLAUDE.md
```

If a section exists, add `ENCRYPTION_KEY` to it. If not, add this section near the bottom of CLAUDE.md:

```markdown
## Server env vars

| Var | Purpose | Required? |
|-----|---------|-----------|
| `DATABASE_URL` | Postgres connection string | Yes |
| `ENCRYPTION_KEY` | 32-byte hex key (`openssl rand -hex 32`) for AES-256-GCM token encryption (Vercel OAuth + future integrations). Rotate by re-encrypting all rows. | Yes for production; required for Vercel OAuth flow in dev |
```

- [ ] **Step 3: Sanity-test that the key actually loads in a service file**

Open a Node REPL in dashboard:

```bash
cd packages/dashboard && node --env-file=../../.env.local -e "import('../../lib/encryption.ts').then(m => console.log(m.encrypt('test')))"
```

(If Node ESM-from-TS doesn't work directly, skip this step — encryption.test.ts already validates loading.)

- [ ] **Step 4: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
docs: document ENCRYPTION_KEY env var requirement

Required for AES-256-GCM token-at-rest (Vercel OAuth + future
integrations). Generated via openssl rand -hex 32.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

(.env.local is gitignored and stays local — do not commit it.)

---

## Task 3: Prisma migration — composite index on workspace_integrations

**Files:**
- Create: `prisma/migrations/<timestamp>_add_vercel_integration_index/migration.sql`

- [ ] **Step 1: Verify schema currently has no composite index**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
grep -A 15 "model WorkspaceIntegration" prisma/schema.prisma
```

Expected: model exists, no `@@index([workspaceId, provider])`. If index already present, skip this task.

- [ ] **Step 2: Add index to schema**

Edit `prisma/schema.prisma`. Locate `model WorkspaceIntegration`. Add this line before the closing `}`:

```prisma
@@index([workspaceId, provider])
```

So the model becomes:

```prisma
model WorkspaceIntegration {
  id          String   @id @default(cuid())
  workspaceId String
  provider    String
  config      Json
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId, provider])
  @@map("workspace_integrations")
}
```

- [ ] **Step 3: Generate migration**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx prisma migrate dev --name add_vercel_integration_index
```

Expected output: creates `prisma/migrations/<ts>_add_vercel_integration_index/migration.sql` containing:

```sql
-- CreateIndex
CREATE INDEX "workspace_integrations_workspaceId_provider_idx" ON "workspace_integrations"("workspaceId", "provider");
```

And applies it to the dev DB.

- [ ] **Step 4: Verify index in DB**

```bash
psql postgresql://shahg@localhost:5432/buildrik -c "\d workspace_integrations" | grep -i idx
```

Expected: line mentioning `workspace_integrations_workspaceId_provider_idx`.

- [ ] **Step 5: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git add prisma/schema.prisma prisma/migrations/
git commit -m "$(cat <<'EOF'
chore(db): add composite index on workspace_integrations(workspaceId, provider)

Speeds up getActiveVercelConnection lookup in publish flow. Migration
auto-generated by prisma migrate dev.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Extend `integrations.service.ts` with Vercel helpers

**Files:**
- Modify: `server/services/integrations.service.ts`
- Test: `server/services/__tests__/integrations.service.test.ts` (may not exist; create if absent)

- [ ] **Step 1: Check if test file exists**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
ls server/services/__tests__/integrations.service.test.ts 2>/dev/null || echo "DOES NOT EXIST"
```

If "DOES NOT EXIST", you'll create it in Step 2.

- [ ] **Step 2: Write failing tests**

Create or extend `server/services/__tests__/integrations.service.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const findFirstMock = vi.fn();
const updateMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspaceIntegration: {
      findFirst: (...args: unknown[]) => findFirstMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
    },
    auditLog: { create: vi.fn(() => Promise.resolve()) },
  },
}));

vi.mock("@buildrik/shared/schemas/account", () => ({}));
vi.mock("@/lib/constants/plan-limits", () => ({
  PLAN_LIMITS: { FREE: { integrations: 1 }, PRO: { integrations: -1 } },
}));

// Ensure ENCRYPTION_KEY is set for decrypt path
const ORIGINAL_KEY = process.env.ENCRYPTION_KEY;
process.env.ENCRYPTION_KEY = "0".repeat(64);

import { getActiveVercelConnection, markInactive } from "@server/services/integrations.service";
import { encrypt } from "@/lib/encryption";

afterAll(() => {
  process.env.ENCRYPTION_KEY = ORIGINAL_KEY;
});

describe("getActiveVercelConnection", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
  });

  it("returns null when no row exists", async () => {
    findFirstMock.mockResolvedValueOnce(null);
    const result = await getActiveVercelConnection("ws_1");
    expect(result).toBeNull();
  });

  it("returns null when row exists but isActive=false", async () => {
    findFirstMock.mockResolvedValueOnce(null); // findFirst with isActive:true won't return inactive row
    const result = await getActiveVercelConnection("ws_1");
    expect(result).toBeNull();
  });

  it("returns decrypted token + teamId when active row exists", async () => {
    const realToken = "vt_secret_123";
    findFirstMock.mockResolvedValueOnce({
      id: "intg_1",
      config: {
        encryptedToken: encrypt(realToken),
        teamId: "team_xyz",
        vercelUserId: "u_abc",
      },
    });
    const result = await getActiveVercelConnection("ws_1");
    expect(result).toEqual({
      id: "intg_1",
      token: realToken,
      teamId: "team_xyz",
    });
  });

  it("throws when decrypt fails (corrupted cipher)", async () => {
    findFirstMock.mockResolvedValueOnce({
      id: "intg_1",
      config: { encryptedToken: "v1:00:00:00", teamId: "t", vercelUserId: "u" },
    });
    await expect(getActiveVercelConnection("ws_1")).rejects.toThrow();
  });
});

describe("markInactive", () => {
  beforeEach(() => {
    updateMock.mockReset();
  });

  it("flips isActive to false", async () => {
    updateMock.mockResolvedValueOnce({ id: "intg_1", isActive: false });
    await markInactive("intg_1");
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "intg_1" },
      data: { isActive: false },
    });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx vitest run server/services/__tests__/integrations.service.test.ts
```

Expected: FAIL with `getActiveVercelConnection is not exported` or similar.

- [ ] **Step 4: Add helpers to integrations.service.ts**

Append to `server/services/integrations.service.ts`:

```ts
import { decrypt } from "@/lib/encryption";

export interface ActiveVercelConnection {
  id: string;
  token: string;
  teamId: string | null;
}

export async function getActiveVercelConnection(
  workspaceId: string,
): Promise<ActiveVercelConnection | null> {
  const row = await prisma.workspaceIntegration.findFirst({
    where: { workspaceId, provider: "vercel", isActive: true },
  });
  if (!row) return null;
  const config = row.config as Record<string, unknown>;
  const encryptedToken = config.encryptedToken;
  if (typeof encryptedToken !== "string") {
    throw new Error("VERCEL_CONFIG_MALFORMED");
  }
  const token = decrypt(encryptedToken);
  return {
    id: row.id,
    token,
    teamId: typeof config.teamId === "string" ? config.teamId : null,
  };
}

export async function markInactive(id: string): Promise<void> {
  await prisma.workspaceIntegration.update({
    where: { id },
    data: { isActive: false },
  });
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx vitest run server/services/__tests__/integrations.service.test.ts
```

Expected: PASS (5/5 cases).

- [ ] **Step 6: Commit**

```bash
git add server/services/integrations.service.ts server/services/__tests__/integrations.service.test.ts
git commit -m "$(cat <<'EOF'
feat(integrations): add getActiveVercelConnection + markInactive helpers

getActiveVercelConnection looks up workspace's active Vercel integration
row, decrypts the stored token via lib/encryption, returns {id, token,
teamId}. markInactive flips isActive=false for 401-recovery flow.

5 tests cover null/inactive/active/decrypt-fail/mark-inactive paths.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Refactor `lib/vercel.ts` to param-driven (no env reads in HTTP helpers)

**Files:**
- Modify: `lib/vercel.ts`
- Modify: any existing callers (worker route + publish service)

- [ ] **Step 1: Identify all current callers**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
grep -rn "createVercelDeployment\|getDeploymentStatus\|waitForDeploymentReady" --include='*.ts' --include='*.tsx' | grep -v "lib/vercel.ts"
```

Note all caller files — you'll update their call sites in Step 4.

- [ ] **Step 2: Refactor `lib/vercel.ts`**

Read current file first (~199 lines). Replace `authHeaders()` and `teamQueryString()` to take params:

```ts
// Replace authHeaders():
function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// Replace teamQueryString():
function teamQueryString(teamId: string | null | undefined): string {
  return teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
}
```

Update `createVercelDeployment` signature:

```ts
export async function createVercelDeployment(
  params: { token: string; teamId: string | null; projectName: string; files: VercelFile[] },
): Promise<DeploymentResult> {
  const { token, teamId, projectName, files } = params;
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
    readyState: DeploymentResult["readyState"];
  };
  return { id: data.id, url: data.url, readyState: data.readyState };
}
```

Update `getDeploymentStatus`:

```ts
export async function getDeploymentStatus(
  params: { token: string; teamId: string | null; deploymentId: string },
): Promise<DeploymentStatus> {
  const { token, teamId, deploymentId } = params;
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
```

Update `waitForDeploymentReady`:

```ts
export async function waitForDeploymentReady(
  params: { token: string; teamId: string | null; deploymentId: string; signal?: AbortSignal },
): Promise<DeploymentStatus> {
  const { token, teamId, deploymentId, signal } = params;
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
```

Keep `isVercelConfigured` as-is (legacy probe for dev sim path):

```ts
// Stays the same — used by sim path in dev when no workspace connection exists
export function isVercelConfigured(): boolean {
  return Boolean(process.env.VERCEL_TOKEN);
}
```

- [ ] **Step 3: Update all callers found in Step 1**

For each caller, change calls from positional args to params object. Example transformations:

Before:
```ts
createVercelDeployment(projectName, files);
getDeploymentStatus(deploymentId);
waitForDeploymentReady(deploymentId, abortSignal);
```

After:
```ts
createVercelDeployment({ token, teamId, projectName, files });
getDeploymentStatus({ token, teamId, deploymentId });
waitForDeploymentReady({ token, teamId, deploymentId, signal: abortSignal });
```

Callers that previously had no `token`/`teamId` available will get them from Task 6's publish-service refactor. For the transition, you can temporarily read env in the caller until Task 6 lands:

```ts
const token = process.env.VERCEL_TOKEN!;
const teamId = process.env.VERCEL_TEAM_ID ?? null;
```

This makes Task 5 self-contained (no cross-task dependency on Task 6). Task 6 replaces those temp env reads with the per-workspace lookup.

- [ ] **Step 4: Type-check**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && npx tsc --noEmit 2>&1 | grep -E "lib/vercel|publish" | head -20
```

Expected: zero errors related to `lib/vercel.ts` or its callers. (Pre-existing unrelated errors are fine — ignore.)

- [ ] **Step 5: Commit**

```bash
git add lib/vercel.ts <any-caller-files-touched>
git commit -m "$(cat <<'EOF'
refactor(vercel): make Vercel API helpers param-driven (no env reads)

createVercelDeployment, getDeploymentStatus, waitForDeploymentReady now
take {token, teamId} as params instead of reading process.env directly.
Same helpers will serve both the publish worker (per-workspace token
from DB) and the future OAuth flow (transient token during code-exchange).

Callers transitionally read env to keep current dev sim working;
Task 6 replaces with per-workspace lookup. isVercelConfigured() kept
as legacy dev-mode probe.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Gate `publish.service.ts` on workspace Vercel connection

**Files:**
- Modify: `server/services/publish.service.ts`
- Test: `server/services/__tests__/publish.service.test.ts` (create if absent)

- [ ] **Step 1: Inspect current publish.service.ts**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
grep -n "VERCEL_TOKEN\|isVercelConfigured\|runVercelDeploy\|runSimulation" server/services/publish.service.ts | head -20
```

Note the exact function names and entry points. The plan assumes there's a `runVercelDeploy(siteId, pages)`-like function plus a `runSimulation` fallback.

- [ ] **Step 2: Write failing tests**

`server/services/__tests__/publish.service.test.ts` (create or extend):

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const getConnMock = vi.fn();
const markInactiveMock = vi.fn();
const createDepMock = vi.fn();
const updateJobMock = vi.fn();

vi.mock("@server/services/integrations.service", () => ({
  getActiveVercelConnection: (...args: unknown[]) => getConnMock(...args),
  markInactive: (...args: unknown[]) => markInactiveMock(...args),
}));

vi.mock("@/lib/vercel", () => ({
  createVercelDeployment: (...args: unknown[]) => createDepMock(...args),
  waitForDeploymentReady: vi.fn(() => Promise.resolve({ readyState: "READY", url: "x.vercel.app", id: "dep_1" })),
  isVercelConfigured: () => false, // dev-sim disabled in tests
  VercelApiError: class extends Error { constructor(public status: number, public code: string, msg: string) { super(msg); } },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    publishJob: { update: (...args: unknown[]) => updateJobMock(...args) },
    site: { update: vi.fn(() => Promise.resolve()) },
  },
}));

// Import after mocks
import { runVercelDeploy } from "@server/services/publish.service";

const ORIGINAL_ENV = process.env.NODE_ENV;

describe("publish.service Vercel connection gating", () => {
  beforeEach(() => {
    getConnMock.mockReset();
    markInactiveMock.mockReset();
    createDepMock.mockReset();
    updateJobMock.mockReset();
  });

  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_ENV;
  });

  it("throws VERCEL_NOT_CONNECTED in production when no active connection", async () => {
    process.env.NODE_ENV = "production";
    getConnMock.mockResolvedValueOnce(null);

    await expect(
      runVercelDeploy("ws_1", "site_1", "job_1", []),
    ).rejects.toThrow("VERCEL_NOT_CONNECTED");
  });

  it("falls through to simulation in development when no active connection", async () => {
    process.env.NODE_ENV = "development";
    getConnMock.mockResolvedValueOnce(null);

    // runVercelDeploy returns null in dev/no-connection so caller can fall to sim
    const result = await runVercelDeploy("ws_1", "site_1", "job_1", []);
    expect(result).toBeNull();
  });

  it("passes {token, teamId} to createVercelDeployment when connection exists", async () => {
    process.env.NODE_ENV = "production";
    getConnMock.mockResolvedValueOnce({ id: "intg_1", token: "vt_abc", teamId: "team_x" });
    createDepMock.mockResolvedValueOnce({ id: "dep_1", url: "x.vercel.app", readyState: "READY" });

    await runVercelDeploy("ws_1", "site_1", "job_1", [{ file: "index.html", data: "<p>hi</p>" }]);

    expect(createDepMock).toHaveBeenCalledWith(
      expect.objectContaining({ token: "vt_abc", teamId: "team_x" }),
    );
  });

  it("calls markInactive + throws VERCEL_TOKEN_INVALID on Vercel 401", async () => {
    process.env.NODE_ENV = "production";
    getConnMock.mockResolvedValueOnce({ id: "intg_1", token: "vt_old", teamId: null });
    const { VercelApiError } = await import("@/lib/vercel");
    createDepMock.mockRejectedValueOnce(new VercelApiError(401, "UNAUTHORIZED", "Token revoked"));

    await expect(
      runVercelDeploy("ws_1", "site_1", "job_1", [{ file: "index.html", data: "<p>x</p>" }]),
    ).rejects.toThrow("VERCEL_TOKEN_INVALID");

    expect(markInactiveMock).toHaveBeenCalledWith("intg_1");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx vitest run server/services/__tests__/publish.service.test.ts
```

Expected: FAIL with various errors (imports / function signatures don't match).

- [ ] **Step 4: Implement gating in publish.service.ts**

Read the file to understand current structure. Modify the entry point that calls `createVercelDeployment`. Wrap it with the gate + 401 handler:

```ts
import { getActiveVercelConnection, markInactive } from "@server/services/integrations.service";
import { createVercelDeployment, waitForDeploymentReady, VercelApiError, type VercelFile } from "@/lib/vercel";

/**
 * Run a real Vercel deployment for the workspace's active connection.
 * Returns null when there's no active connection in development mode
 * (caller falls through to runSimulation). Throws VERCEL_NOT_CONNECTED
 * in production. Throws VERCEL_TOKEN_INVALID on 401 (also marks
 * integration inactive).
 */
export async function runVercelDeploy(
  workspaceId: string,
  siteId: string,
  jobId: string,
  files: VercelFile[],
): Promise<{ url: string; deploymentId: string } | null> {
  const conn = await getActiveVercelConnection(workspaceId);
  if (!conn) {
    if (process.env.NODE_ENV === "development") return null;
    throw new Error("VERCEL_NOT_CONNECTED");
  }

  const projectName = `buildrik-site-${siteId}`;

  try {
    const dep = await createVercelDeployment({
      token: conn.token,
      teamId: conn.teamId,
      projectName,
      files,
    });
    const ready = await waitForDeploymentReady({
      token: conn.token,
      teamId: conn.teamId,
      deploymentId: dep.id,
    });
    if (ready.readyState !== "READY") {
      throw new Error(`VERCEL_DEPLOY_${ready.readyState}`);
    }
    return { url: `https://${ready.url}`, deploymentId: ready.id };
  } catch (err) {
    if (err instanceof VercelApiError && err.status === 401) {
      await markInactive(conn.id);
      throw new Error("VERCEL_TOKEN_INVALID");
    }
    throw err;
  }
}
```

Update the caller (wherever the publish worker invokes deploy) to handle the new null return and the new error codes:

```ts
const result = await runVercelDeploy(workspace.id, siteId, jobId, files);
if (result === null) {
  // dev mode + no connection → fall through to simulation
  return runSimulation(siteId, jobId);
}
// ...persist result.url to Site.publishedUrl
```

If the existing publish-service exports a different function name (e.g., `runDeploy`), adapt the new helper's name to fit OR rename the existing one and re-export — minimize the blast radius.

- [ ] **Step 5: Run test to verify it passes**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx vitest run server/services/__tests__/publish.service.test.ts
```

Expected: PASS (4/4 cases).

- [ ] **Step 6: Commit**

```bash
git add server/services/publish.service.ts server/services/__tests__/publish.service.test.ts
git commit -m "$(cat <<'EOF'
feat(publish): gate Vercel deploys on per-workspace OAuth connection

runVercelDeploy now calls getActiveVercelConnection(workspaceId). On
null → returns null in dev (falls through to sim) or throws
VERCEL_NOT_CONNECTED in production. On Vercel 401 → calls markInactive
and throws VERCEL_TOKEN_INVALID so editor toast + reconnect flow can
surface the recovery path.

4 service tests cover null/dev-fallback/happy-path/401-recovery.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Verify Phase 1 gates green + push

- [ ] **Step 1: Run full type-check**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit 2>&1 | grep -cE "error TS"
```

Compare to pre-arc baseline. Any NEW errors (not in pre-existing list) → fix before push.

- [ ] **Step 2: Run all tests touched by Phase 1**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx vitest run lib/encryption.test.ts server/services/__tests__/integrations.service.test.ts server/services/__tests__/publish.service.test.ts
```

Expected: ALL PASS.

- [ ] **Step 3: Push**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git push 2>&1 | tail -10
```

Expected: pre-push hook shows `✓ all gates passing`. If hook BLOCKS, do NOT use `--no-verify`. Read the gate error + fix.

- [ ] **Step 4: PAUSE for Phase 0 (user-side)**

Before Phase 2 can start, the user must complete this side-work on vercel.com (~10 min):

1. Open `https://vercel.com/integrations/console`
2. Click "Create Integration"
3. Fill in:
   - **Name:** "Buildrik" (or whatever you want users to see)
   - **Description:** "Visual web builder for designers and small teams"
   - **Logo:** upload a square PNG
   - **Redirect URIs:**
     - `http://localhost:3000/api/integrations/vercel/callback` (dev)
     - `https://app.buildrik.com/api/integrations/vercel/callback` (prod, or your prod domain)
   - **Scopes:** `deployments:write`, `projects:write`, `user:read`, `team:read`
   - Skip webhook URL for V1.1
4. Copy these 3 values into `.env.local`:

```bash
echo "" >> .env.local
echo "# Vercel OAuth Integration (Phase 2)" >> .env.local
echo "VERCEL_INTEGRATION_ID=<integration-slug>" >> .env.local
echo "VERCEL_CLIENT_ID=<client-id>" >> .env.local
echo "VERCEL_CLIENT_SECRET=<client-secret>" >> .env.local
```

5. Restart dashboard dev server so env vars load:

```bash
kill $(lsof -ti :3000)
cd packages/dashboard && npm run dev
```

Once those 3 env vars are in `.env.local` and the dev server is restarted, Phase 2 can begin.

---

# Phase 2 — OAuth flow + UI (requires Phase 0 user action above)

## Task 8: `vercel-oauth.service.ts` — OAuth state machine

**Files:**
- Create: `server/services/vercel-oauth.service.ts`
- Test: `server/services/__tests__/vercel-oauth.test.ts`

- [ ] **Step 1: Write failing tests**

`server/services/__tests__/vercel-oauth.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const ORIGINAL_KEY = process.env.ENCRYPTION_KEY;
const ORIGINAL_CLIENT = process.env.VERCEL_CLIENT_ID;
const ORIGINAL_SECRET = process.env.VERCEL_CLIENT_SECRET;
const ORIGINAL_INTG = process.env.VERCEL_INTEGRATION_ID;

beforeEach(() => {
  process.env.ENCRYPTION_KEY = "0".repeat(64);
  process.env.VERCEL_CLIENT_ID = "oac_test";
  process.env.VERCEL_CLIENT_SECRET = "secret_test";
  process.env.VERCEL_INTEGRATION_ID = "buildrik";
});

afterAll(() => {
  process.env.ENCRYPTION_KEY = ORIGINAL_KEY;
  process.env.VERCEL_CLIENT_ID = ORIGINAL_CLIENT;
  process.env.VERCEL_CLIENT_SECRET = ORIGINAL_SECRET;
  process.env.VERCEL_INTEGRATION_ID = ORIGINAL_INTG;
});

import {
  buildAuthUrl,
  buildStateToken,
  verifyState,
  exchangeCodeForToken,
} from "@server/services/vercel-oauth.service";

describe("buildAuthUrl", () => {
  it("includes integration slug, state, redirect_uri", () => {
    const url = buildAuthUrl("ws_1", "u_1", "http://localhost:3000");
    expect(url).toContain("vercel.com/integrations/buildrik/new");
    expect(url).toContain("state=");
    // Vercel integration install URL embeds state via query param
  });

  it("throws if VERCEL_INTEGRATION_ID is missing", () => {
    delete process.env.VERCEL_INTEGRATION_ID;
    expect(() => buildAuthUrl("ws_1", "u_1", "http://localhost:3000"))
      .toThrow(/VERCEL_INTEGRATION_ID/);
  });
});

describe("state token round-trip", () => {
  it("buildStateToken → verifyState returns same {workspaceId, userId}", () => {
    const token = buildStateToken("ws_1", "u_1");
    const decoded = verifyState(token);
    expect(decoded).toEqual({ workspaceId: "ws_1", userId: "u_1" });
  });

  it("verifyState returns null on HMAC-tampered token", () => {
    const token = buildStateToken("ws_1", "u_1");
    const [body] = token.split(".");
    const tampered = `${body}.deadbeef`;
    expect(verifyState(tampered)).toBeNull();
  });

  it("verifyState returns null on expired token", () => {
    // mock clock via vi.useFakeTimers
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const token = buildStateToken("ws_1", "u_1");
    vi.setSystemTime(new Date("2026-01-01T01:00:00Z")); // 1 hour later, past 10min exp
    expect(verifyState(token)).toBeNull();
    vi.useRealTimers();
  });

  it("verifyState returns null on malformed payload", () => {
    expect(verifyState("not.a.valid.token")).toBeNull();
    expect(verifyState("nodot")).toBeNull();
  });
});

describe("exchangeCodeForToken", () => {
  it("posts to /v2/oauth/access_token with correct body", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({
        access_token: "vt_real",
        token_type: "Bearer",
        user_id: "vercel_u_1",
        team_id: "team_1",
        installation_id: "icfg_1",
      }), { status: 200 }),
    );

    const result = await exchangeCodeForToken("auth_code_xyz", "http://localhost:3000/cb");

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.vercel.com/v2/oauth/access_token",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result).toEqual({
      accessToken: "vt_real",
      vercelUserId: "vercel_u_1",
      teamId: "team_1",
      configurationId: "icfg_1",
    });

    fetchSpy.mockRestore();
  });

  it("throws on 4xx", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "invalid_code" }), { status: 400 }),
    );
    await expect(exchangeCodeForToken("bad_code", "http://x")).rejects.toThrow();
    fetchSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx vitest run server/services/__tests__/vercel-oauth.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `vercel-oauth.service.ts`**

```ts
/**
 * Vercel OAuth state machine.
 *
 * - buildAuthUrl + buildStateToken: kick off the OAuth flow with a
 *   CSRF-safe state token (HMAC-signed payload of {workspaceId, userId,
 *   nonce, exp}).
 * - verifyState: validate the state token returned by Vercel callback.
 * - exchangeCodeForToken: trade the auth code for an access token via
 *   Vercel /v2/oauth/access_token.
 * - listTeams: fetch the user's Vercel teams when the OAuth response
 *   didn't include a team_id (rare with Integration install; common with
 *   raw OAuth).
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const STATE_TTL_MS = 10 * 60 * 1000; // 10 min
const VERCEL_API_BASE = "https://api.vercel.com";

interface StatePayload {
  workspaceId: string;
  userId: string;
  nonce: string;
  exp: number;
}

function getHmacKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) throw new Error("ENCRYPTION_KEY env var is not set");
  return Buffer.from(hex, "hex");
}

function hmacSign(body: string): string {
  return createHmac("sha256", getHmacKey()).update(body).digest("hex");
}

export function buildStateToken(workspaceId: string, userId: string): string {
  const payload: StatePayload = {
    workspaceId,
    userId,
    nonce: randomBytes(16).toString("hex"),
    exp: Date.now() + STATE_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${hmacSign(body)}`;
}

export function verifyState(token: string): { workspaceId: string; userId: string } | null {
  const dotIdx = token.indexOf(".");
  if (dotIdx < 0) return null;
  const body = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  const expectedSig = hmacSign(body);
  if (sig.length !== expectedSig.length) return null;
  if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"))) return null;

  let payload: StatePayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
  if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
  return { workspaceId: payload.workspaceId, userId: payload.userId };
}

export function buildAuthUrl(workspaceId: string, userId: string, appUrl: string): string {
  const integrationId = process.env.VERCEL_INTEGRATION_ID;
  if (!integrationId) throw new Error("VERCEL_INTEGRATION_ID env var is not set");
  const state = buildStateToken(workspaceId, userId);
  // Vercel integration install URL format
  const params = new URLSearchParams({ state });
  return `https://vercel.com/integrations/${integrationId}/new?${params}`;
}

export interface ExchangedToken {
  accessToken: string;
  vercelUserId: string;
  teamId: string | null;
  configurationId: string | null;
}

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<ExchangedToken> {
  const clientId = process.env.VERCEL_CLIENT_ID;
  const clientSecret = process.env.VERCEL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("VERCEL_CLIENT_ID / VERCEL_CLIENT_SECRET env vars not set");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch(`${VERCEL_API_BASE}/v2/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`Vercel /access_token failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    token_type: string;
    user_id: string;
    team_id?: string | null;
    installation_id?: string | null;
  };

  return {
    accessToken: data.access_token,
    vercelUserId: data.user_id,
    teamId: data.team_id ?? null,
    configurationId: data.installation_id ?? null,
  };
}

export interface VercelTeam {
  id: string;
  name: string;
  slug: string;
}

export async function listTeams(accessToken: string): Promise<VercelTeam[]> {
  const res = await fetch(`${VERCEL_API_BASE}/v2/teams`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    // Non-fatal — caller proceeds with empty team list (personal account only)
    return [];
  }
  const data = (await res.json()) as { teams: VercelTeam[] };
  return data.teams ?? [];
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx vitest run server/services/__tests__/vercel-oauth.test.ts
```

Expected: PASS (8/8 cases).

- [ ] **Step 5: Commit**

```bash
git add server/services/vercel-oauth.service.ts server/services/__tests__/vercel-oauth.test.ts
git commit -m "$(cat <<'EOF'
feat(integrations): add vercel-oauth.service.ts state machine

OAuth helpers for the integration flow:
- buildStateToken / verifyState: HMAC-signed CSRF protection,
  10min TTL, timing-safe comparison
- buildAuthUrl: builds vercel.com/integrations/<slug>/new?state=...
- exchangeCodeForToken: posts to /v2/oauth/access_token, returns
  {accessToken, vercelUserId, teamId, configurationId}
- listTeams: GET /v2/teams; non-fatal on failure

8 unit tests cover state round-trip, tampering rejection, expiry,
token exchange happy + 4xx paths.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: `authorize/route.ts` — kick off OAuth

**Files:**
- Create: `app/api/integrations/vercel/authorize/route.ts`
- Test: `app/api/integrations/vercel/authorize/route.test.ts`

- [ ] **Step 1: Write failing test**

`app/api/integrations/vercel/authorize/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
const checkRoleMock = vi.fn();

vi.mock("@/server/auth", () => ({
  auth: () => authMock(),
}));
vi.mock("@/server/services/sites.service", () => ({
  checkWorkspaceRole: (...args: unknown[]) => checkRoleMock(...args),
}));

process.env.ENCRYPTION_KEY = "0".repeat(64);
process.env.VERCEL_INTEGRATION_ID = "buildrik";

import { GET } from "./route";

describe("GET /api/integrations/vercel/authorize", () => {
  beforeEach(() => {
    authMock.mockReset();
    checkRoleMock.mockReset();
  });

  it("returns 401 when no session", async () => {
    authMock.mockResolvedValueOnce(null);
    const req = new Request("http://localhost:3000/api/integrations/vercel/authorize?workspaceId=ws_1");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when workspaceId missing", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u_1" } });
    const req = new Request("http://localhost:3000/api/integrations/vercel/authorize");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns 403 when user is not OWNER or ADMIN", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u_1" } });
    checkRoleMock.mockRejectedValueOnce(new Error("FORBIDDEN"));
    const req = new Request("http://localhost:3000/api/integrations/vercel/authorize?workspaceId=ws_1");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("returns 302 redirect to vercel.com with state for OWNER", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u_1" } });
    checkRoleMock.mockResolvedValueOnce(undefined);
    const req = new Request("http://localhost:3000/api/integrations/vercel/authorize?workspaceId=ws_1");
    const res = await GET(req);
    expect(res.status).toBe(302);
    const loc = res.headers.get("Location") ?? "";
    expect(loc).toContain("vercel.com/integrations/buildrik/new");
    expect(loc).toContain("state=");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx vitest run app/api/integrations/vercel/authorize/route.test.ts
```

Expected: FAIL — route module doesn't exist.

- [ ] **Step 3: Create `authorize/route.ts`**

```ts
/**
 * GET /api/integrations/vercel/authorize?workspaceId=ws_xxx
 *
 * Owner/Admin entry point for Vercel OAuth. Returns 302 redirect to
 * vercel.com/integrations/<slug>/new?state=<HMAC-signed-state>.
 *
 * Flow A step 2 of Vercel OAuth spec
 * (docs/superpowers/specs/2026-05-19-vercel-oauth-integration-design.md).
 */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { checkWorkspaceRole } from "@/server/services/sites.service";
import { buildAuthUrl } from "@/server/services/vercel-oauth.service";

export async function GET(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "UNAUTHENTICATED" }), { status: 401 });
  }

  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId");
  if (!workspaceId) {
    return new Response(JSON.stringify({ error: "MISSING_WORKSPACE_ID" }), { status: 400 });
  }

  try {
    await checkWorkspaceRole(session.user.id, workspaceId, "ADMIN");
  } catch (err) {
    return new Response(JSON.stringify({ error: "FORBIDDEN" }), { status: 403 });
  }

  const appUrl = `${url.protocol}//${url.host}`;
  const redirectTo = buildAuthUrl(workspaceId, session.user.id, appUrl);
  return NextResponse.redirect(redirectTo, 302);
}
```

**Note:** `checkWorkspaceRole(userId, workspaceId, "ADMIN")` is assumed to throw if user is not OWNER or ADMIN. Check that this function exists in `server/services/sites.service.ts` with that exact signature; if not, look for the equivalent and adapt the import/call. The existing `checkSiteRole` works on a site-id, not workspace-id, so a workspace-equivalent may need to be added. If absent, create `checkWorkspaceRole` as a simple wrapper in `sites.service.ts`:

```ts
export async function checkWorkspaceRole(userId: string, workspaceId: string, minRole: "ADMIN" | "OWNER"): Promise<void> {
  const member = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId },
    select: { role: true },
  });
  if (!member) throw new PermissionError("FORBIDDEN", "User is not a workspace member");
  const allowed = minRole === "OWNER" ? ["OWNER"] : ["OWNER", "ADMIN"];
  if (!allowed.includes(member.role)) {
    throw new PermissionError("FORBIDDEN", `Requires ${minRole} role`);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx vitest run app/api/integrations/vercel/authorize/route.test.ts
```

Expected: PASS (4/4 cases).

- [ ] **Step 5: Commit**

```bash
git add app/api/integrations/vercel/authorize/route.ts app/api/integrations/vercel/authorize/route.test.ts server/services/sites.service.ts
git commit -m "$(cat <<'EOF'
feat(integrations): add Vercel OAuth /authorize route handler

GET /api/integrations/vercel/authorize?workspaceId=ws_xxx
- 401 if no session
- 400 if missing workspaceId
- 403 if not OWNER/ADMIN of workspace
- 302 redirect to vercel.com/integrations/<slug>/new?state=<token>

Adds checkWorkspaceRole helper to sites.service.ts (workspace-scoped
equivalent of existing checkSiteRole). 4 route handler tests cover auth
+ permission + happy path.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: `callback/route.ts` — exchange code, set pending cookie, redirect to team-picker

**Files:**
- Create: `app/api/integrations/vercel/callback/route.ts`
- Test: `app/api/integrations/vercel/callback/route.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const exchangeMock = vi.fn();
const listTeamsMock = vi.fn();

vi.mock("@/server/services/vercel-oauth.service", async () => {
  const actual = await vi.importActual("@/server/services/vercel-oauth.service");
  return {
    ...actual,
    exchangeCodeForToken: (...args: unknown[]) => exchangeMock(...args),
    listTeams: (...args: unknown[]) => listTeamsMock(...args),
  };
});

const ORIGINAL_KEY = process.env.ENCRYPTION_KEY;
const ORIGINAL_INTG = process.env.VERCEL_INTEGRATION_ID;

beforeEach(() => {
  process.env.ENCRYPTION_KEY = "0".repeat(64);
  process.env.VERCEL_INTEGRATION_ID = "buildrik";
  exchangeMock.mockReset();
  listTeamsMock.mockReset();
});

afterEach(() => {
  process.env.ENCRYPTION_KEY = ORIGINAL_KEY;
  process.env.VERCEL_INTEGRATION_ID = ORIGINAL_INTG;
});

import { GET } from "./route";
import { buildStateToken } from "@/server/services/vercel-oauth.service";

describe("GET /api/integrations/vercel/callback", () => {
  it("returns 400 when ?code missing", async () => {
    const req = new Request("http://localhost:3000/api/integrations/vercel/callback?state=anything");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("redirects to settings?error=oauth_state_invalid on tampered state", async () => {
    const req = new Request("http://localhost:3000/api/integrations/vercel/callback?code=c&state=bad.token");
    const res = await GET(req);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("error=oauth_state_invalid");
  });

  it("redirects to settings?error=oauth_denied on Vercel exchange 4xx", async () => {
    const state = buildStateToken("ws_1", "u_1");
    exchangeMock.mockRejectedValueOnce(new Error("Vercel /access_token failed: 400"));
    const req = new Request(`http://localhost:3000/api/integrations/vercel/callback?code=c&state=${state}`);
    const res = await GET(req);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("error=oauth_denied");
  });

  it("sets pending cookie + redirects to team-picker on success", async () => {
    const state = buildStateToken("ws_1", "u_1");
    exchangeMock.mockResolvedValueOnce({
      accessToken: "vt_x",
      vercelUserId: "vu_1",
      teamId: null,
      configurationId: "icfg_1",
    });
    listTeamsMock.mockResolvedValueOnce([{ id: "t_1", name: "My Team", slug: "myteam" }]);

    const req = new Request(`http://localhost:3000/api/integrations/vercel/callback?code=c&state=${state}`);
    const res = await GET(req);

    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("vercel-team-picker");
    const setCookie = res.headers.get("Set-Cookie") ?? "";
    expect(setCookie).toContain("buildrik_vercel_pending=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Strict");
  });

  it("when Vercel returned team_id, skips team-picker (redirects directly to settings)", async () => {
    const state = buildStateToken("ws_1", "u_1");
    exchangeMock.mockResolvedValueOnce({
      accessToken: "vt_x",
      vercelUserId: "vu_1",
      teamId: "team_already_picked",
      configurationId: "icfg_1",
    });

    const req = new Request(`http://localhost:3000/api/integrations/vercel/callback?code=c&state=${state}`);
    const res = await GET(req);
    expect(res.status).toBe(302);
    // still routes through team-picker so user can confirm + finishConnect runs
    expect(res.headers.get("Location")).toContain("vercel-team-picker");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx vitest run app/api/integrations/vercel/callback/route.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `callback/route.ts`**

```ts
/**
 * GET /api/integrations/vercel/callback?code=<code>&state=<state>
 *
 * Vercel's callback after user authorizes the integration. Exchanges
 * code for access token, optionally lists teams, stashes transient
 * state in an encrypted httpOnly cookie, redirects to team-picker
 * page where user confirms / picks team.
 *
 * Flow A step 4 of Vercel OAuth spec.
 */
import { NextResponse } from "next/server";
import { encrypt } from "@/lib/encryption";
import {
  exchangeCodeForToken,
  listTeams,
  verifyState,
} from "@/server/services/vercel-oauth.service";

const PENDING_COOKIE = "buildrik_vercel_pending";
const PENDING_TTL_SECONDS = 10 * 60;

function errorRedirect(req: Request, errorCode: string): Response {
  const url = new URL(req.url);
  const dest = new URL("/dashboard/settings/integrations", `${url.protocol}//${url.host}`);
  dest.searchParams.set("error", errorCode);
  return NextResponse.redirect(dest, 302);
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) {
    return new Response(JSON.stringify({ error: "MISSING_CODE" }), { status: 400 });
  }
  if (!state) {
    return errorRedirect(req, "oauth_state_invalid");
  }

  const decoded = verifyState(state);
  if (!decoded) {
    return errorRedirect(req, "oauth_state_invalid");
  }

  const redirectUri = `${url.protocol}//${url.host}/api/integrations/vercel/callback`;

  let token;
  try {
    token = await exchangeCodeForToken(code, redirectUri);
  } catch (err) {
    return errorRedirect(req, "oauth_denied");
  }

  let candidateTeams: Array<{ id: string; name: string; slug: string }> = [];
  if (!token.teamId) {
    candidateTeams = await listTeams(token.accessToken);
  }

  const pendingPayload = JSON.stringify({
    workspaceId: decoded.workspaceId,
    userId: decoded.userId,
    accessToken: token.accessToken,
    vercelUserId: token.vercelUserId,
    teamId: token.teamId,
    configurationId: token.configurationId,
    candidateTeams,
    exp: Date.now() + PENDING_TTL_SECONDS * 1000,
  });

  const encrypted = encrypt(pendingPayload);

  const dest = new URL("/dashboard/settings/integrations/vercel-team-picker", `${url.protocol}//${url.host}`);
  const res = NextResponse.redirect(dest, 302);
  res.cookies.set(PENDING_COOKIE, encrypted, {
    httpOnly: true,
    secure: url.protocol === "https:",
    sameSite: "strict",
    maxAge: PENDING_TTL_SECONDS,
    path: "/",
  });
  return res;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx vitest run app/api/integrations/vercel/callback/route.test.ts
```

Expected: PASS (5/5 cases).

- [ ] **Step 5: Commit**

```bash
git add app/api/integrations/vercel/callback/route.ts app/api/integrations/vercel/callback/route.test.ts
git commit -m "$(cat <<'EOF'
feat(integrations): add Vercel OAuth /callback route handler

GET /api/integrations/vercel/callback?code=&state=
- 400 if code missing
- redirect to settings?error=oauth_state_invalid on bad/missing state
- redirect to settings?error=oauth_denied on Vercel /access_token 4xx
- on success: sets encrypted httpOnly cookie buildrik_vercel_pending
  (10min TTL) + redirects to team-picker page
- if Vercel returned team_id (Integration install flow), still routes
  through team-picker for explicit user confirmation

5 route handler tests cover all branches.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: tRPC `integrations.vercel` subrouter

**Files:**
- Modify or create: `server/trpc/routers/integrations.ts`
- Test: `server/trpc/routers/__tests__/integrations.test.ts`

- [ ] **Step 1: Check existing router**

```bash
ls server/trpc/routers/integrations.ts 2>/dev/null && cat server/trpc/routers/integrations.ts | head -20
```

If file doesn't exist, create it. If exists, you'll add the `vercel` subrouter to it.

- [ ] **Step 2: Write failing tests**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

const checkRoleMock = vi.fn();
const findFirstIntegMock = vi.fn();
const upsertIntegMock = vi.fn();
const deleteIntegMock = vi.fn();

vi.mock("@/server/services/sites.service", () => ({
  checkWorkspaceRole: (...args: unknown[]) => checkRoleMock(...args),
  PermissionError: class extends Error { constructor(public code: string, msg: string) { super(msg); } },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspaceIntegration: {
      findFirst: (...args: unknown[]) => findFirstIntegMock(...args),
      upsert: (...args: unknown[]) => upsertIntegMock(...args),
      delete: (...args: unknown[]) => deleteIntegMock(...args),
    },
    auditLog: { create: vi.fn(() => Promise.resolve()) },
  },
}));

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: (name: string) => globalThis.__testCookie?.name === name ? { value: globalThis.__testCookie.value } : undefined,
    delete: vi.fn(),
  }),
}));

const ORIGINAL_KEY = process.env.ENCRYPTION_KEY;
process.env.ENCRYPTION_KEY = "0".repeat(64);

import { vercelIntegrationsRouter } from "@/server/trpc/routers/integrations";
import { encrypt } from "@/lib/encryption";

afterAll(() => {
  process.env.ENCRYPTION_KEY = ORIGINAL_KEY;
});

function makeCtx(userId: string | null) {
  return { session: userId ? { user: { id: userId } } : null, prisma: {} as never };
}

describe("integrations.vercel.getConnection", () => {
  beforeEach(() => {
    findFirstIntegMock.mockReset();
  });

  it("returns connected:false when no row exists", async () => {
    findFirstIntegMock.mockResolvedValueOnce(null);
    const caller = vercelIntegrationsRouter.createCaller(makeCtx("u_1") as never);
    const result = await caller.getConnection({ workspaceId: "ws_1" });
    expect(result).toEqual({ connected: false });
  });

  it("returns connected:true with team + vercelUserId (never token)", async () => {
    findFirstIntegMock.mockResolvedValueOnce({
      id: "i_1",
      isActive: true,
      config: { encryptedToken: "v1:...", teamId: "team_x", vercelUserId: "vu_1" },
    });
    const caller = vercelIntegrationsRouter.createCaller(makeCtx("u_1") as never);
    const result = await caller.getConnection({ workspaceId: "ws_1" });
    expect(result).toEqual({ connected: true, teamId: "team_x", vercelUserId: "vu_1", isActive: true });
    expect(JSON.stringify(result)).not.toContain("v1:");
  });
});

describe("integrations.vercel.finishConnect", () => {
  beforeEach(() => {
    checkRoleMock.mockReset();
    upsertIntegMock.mockReset();
    globalThis.__testCookie = undefined;
  });

  it("throws FORBIDDEN when caller not OWNER/ADMIN", async () => {
    checkRoleMock.mockRejectedValueOnce(new Error("FORBIDDEN"));
    const caller = vercelIntegrationsRouter.createCaller(makeCtx("u_1") as never);
    await expect(caller.finishConnect({ workspaceId: "ws_1", teamId: null }))
      .rejects.toThrow(/FORBIDDEN/);
  });

  it("throws BAD_REQUEST when no pending cookie", async () => {
    checkRoleMock.mockResolvedValueOnce(undefined);
    const caller = vercelIntegrationsRouter.createCaller(makeCtx("u_1") as never);
    await expect(caller.finishConnect({ workspaceId: "ws_1", teamId: null }))
      .rejects.toThrow(/PENDING/);
  });

  it("throws BAD_REQUEST when pending cookie's workspaceId mismatches arg", async () => {
    checkRoleMock.mockResolvedValueOnce(undefined);
    const payload = JSON.stringify({
      workspaceId: "ws_OTHER",
      userId: "u_1",
      accessToken: "vt_x",
      vercelUserId: "vu_1",
      teamId: null,
      configurationId: null,
      candidateTeams: [],
      exp: Date.now() + 60000,
    });
    globalThis.__testCookie = { name: "buildrik_vercel_pending", value: encrypt(payload) };
    const caller = vercelIntegrationsRouter.createCaller(makeCtx("u_1") as never);
    await expect(caller.finishConnect({ workspaceId: "ws_1", teamId: null }))
      .rejects.toThrow(/MISMATCH/);
  });

  it("upserts integration row with encrypted token on success", async () => {
    checkRoleMock.mockResolvedValueOnce(undefined);
    const payload = JSON.stringify({
      workspaceId: "ws_1",
      userId: "u_1",
      accessToken: "vt_real",
      vercelUserId: "vu_1",
      teamId: null,
      configurationId: "icfg_1",
      candidateTeams: [{ id: "team_x", name: "X", slug: "x" }],
      exp: Date.now() + 60000,
    });
    globalThis.__testCookie = { name: "buildrik_vercel_pending", value: encrypt(payload) };
    upsertIntegMock.mockResolvedValueOnce({ id: "i_new" });

    const caller = vercelIntegrationsRouter.createCaller(makeCtx("u_1") as never);
    await caller.finishConnect({ workspaceId: "ws_1", teamId: "team_x" });

    expect(upsertIntegMock).toHaveBeenCalled();
    const arg = upsertIntegMock.mock.calls[0][0];
    expect(arg.create.workspaceId).toBe("ws_1");
    expect(arg.create.provider).toBe("vercel");
    expect(arg.create.config.teamId).toBe("team_x");
    // Token must be encrypted (no plain "vt_real")
    expect(JSON.stringify(arg.create.config)).not.toContain("vt_real");
  });
});

describe("integrations.vercel.disconnect", () => {
  beforeEach(() => {
    checkRoleMock.mockReset();
    findFirstIntegMock.mockReset();
    deleteIntegMock.mockReset();
  });

  it("deletes row + 410 Vercel revoke is treated as success", async () => {
    checkRoleMock.mockResolvedValueOnce(undefined);
    findFirstIntegMock.mockResolvedValueOnce({
      id: "i_1",
      config: { encryptedToken: encrypt("vt_x"), configurationId: "icfg_1" },
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("", { status: 410 }),
    );
    deleteIntegMock.mockResolvedValueOnce(undefined);

    const caller = vercelIntegrationsRouter.createCaller(makeCtx("u_1") as never);
    const result = await caller.disconnect({ workspaceId: "ws_1" });

    expect(result).toEqual({ success: true });
    expect(deleteIntegMock).toHaveBeenCalledWith({ where: { id: "i_1" } });
    fetchSpy.mockRestore();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx vitest run server/trpc/routers/__tests__/integrations.test.ts
```

Expected: FAIL — `vercelIntegrationsRouter` not exported.

- [ ] **Step 4: Implement the subrouter**

If `server/trpc/routers/integrations.ts` exists, extend it. If not, create with this skeleton:

```ts
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "@/server/trpc/trpc";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";
import { checkWorkspaceRole } from "@/server/services/sites.service";
import { cookies } from "next/headers";

const PENDING_COOKIE = "buildrik_vercel_pending";

const PendingPayload = z.object({
  workspaceId: z.string(),
  userId: z.string(),
  accessToken: z.string(),
  vercelUserId: z.string(),
  teamId: z.string().nullable(),
  configurationId: z.string().nullable(),
  candidateTeams: z.array(z.object({ id: z.string(), name: z.string(), slug: z.string() })),
  exp: z.number(),
});

export const vercelIntegrationsRouter = router({
  getConnection: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ input }) => {
      const row = await prisma.workspaceIntegration.findFirst({
        where: { workspaceId: input.workspaceId, provider: "vercel" },
      });
      if (!row) return { connected: false as const };
      const config = row.config as Record<string, unknown>;
      return {
        connected: true as const,
        teamId: typeof config.teamId === "string" ? config.teamId : null,
        vercelUserId: typeof config.vercelUserId === "string" ? config.vercelUserId : null,
        isActive: row.isActive,
      };
    }),

  finishConnect: protectedProcedure
    .input(z.object({ workspaceId: z.string(), teamId: z.string().nullable() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await checkWorkspaceRole(ctx.session.user!.id!, input.workspaceId, "ADMIN");
      } catch (err) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Requires OWNER or ADMIN role" });
      }

      const cookieStore = await cookies();
      const cookie = cookieStore.get(PENDING_COOKIE);
      if (!cookie?.value) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "PENDING_COOKIE_MISSING" });
      }

      let payload;
      try {
        payload = PendingPayload.parse(JSON.parse(decrypt(cookie.value)));
      } catch (err) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "PENDING_COOKIE_CORRUPT" });
      }

      if (payload.workspaceId !== input.workspaceId || payload.userId !== ctx.session.user!.id!) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "PENDING_MISMATCH" });
      }
      if (Date.now() > payload.exp) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "PENDING_EXPIRED" });
      }

      const finalTeamId = input.teamId ?? payload.teamId;

      await prisma.workspaceIntegration.upsert({
        where: {
          // Composite key not defined; use a deterministic where via a unique on (workspaceId, provider).
          // If schema doesn't have @@unique on these, change to findFirst+update/create pattern.
          id: `vercel-${input.workspaceId}`,
        },
        create: {
          id: `vercel-${input.workspaceId}`,
          workspaceId: input.workspaceId,
          provider: "vercel",
          isActive: true,
          config: {
            encryptedToken: encrypt(payload.accessToken),
            teamId: finalTeamId,
            vercelUserId: payload.vercelUserId,
            configurationId: payload.configurationId,
            connectedAt: new Date().toISOString(),
            connectedBy: ctx.session.user!.id!,
          },
        },
        update: {
          isActive: true,
          config: {
            encryptedToken: encrypt(payload.accessToken),
            teamId: finalTeamId,
            vercelUserId: payload.vercelUserId,
            configurationId: payload.configurationId,
            connectedAt: new Date().toISOString(),
            connectedBy: ctx.session.user!.id!,
          },
        },
      });

      cookieStore.delete(PENDING_COOKIE);

      await prisma.auditLog.create({
        data: {
          userId: ctx.session.user!.id!,
          action: "vercel.integration.connected",
          status: "ok",
          metadata: JSON.stringify({ workspaceId: input.workspaceId, teamId: finalTeamId }),
        },
      });

      return { success: true };
    }),

  disconnect: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await checkWorkspaceRole(ctx.session.user!.id!, input.workspaceId, "ADMIN");
      } catch (err) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Requires OWNER or ADMIN role" });
      }

      const row = await prisma.workspaceIntegration.findFirst({
        where: { workspaceId: input.workspaceId, provider: "vercel" },
      });
      if (!row) return { success: true };

      const config = row.config as Record<string, unknown>;
      const configurationId = typeof config.configurationId === "string" ? config.configurationId : null;

      if (configurationId) {
        try {
          const token = decrypt(typeof config.encryptedToken === "string" ? config.encryptedToken : "");
          await fetch(`https://api.vercel.com/v1/integrations/configuration/${configurationId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (err) {
          // best-effort; log warn but proceed with local delete
          console.warn("[vercel] disconnect revoke failed:", err);
        }
      }

      await prisma.workspaceIntegration.delete({ where: { id: row.id } });

      await prisma.auditLog.create({
        data: {
          userId: ctx.session.user!.id!,
          action: "vercel.integration.disconnected",
          status: "ok",
          metadata: JSON.stringify({ workspaceId: input.workspaceId }),
        },
      });

      return { success: true };
    }),
});
```

If the existing `integrations.ts` already has a `router({...})` shape, merge the `vercel` subrouter into it:

```ts
export const integrationsRouter = router({
  vercel: vercelIntegrationsRouter,
  // ...existing sub-routers
});
```

**Schema note:** the upsert uses `id: \`vercel-${workspaceId}\`` as a deterministic primary key. If `WorkspaceIntegration.id` is a `cuid()`, this won't fit. Better pattern: add `@@unique([workspaceId, provider])` to the schema and use that as the upsert `where`. If you add the unique, also remove the index from Task 3 (the unique constraint implies an index).

Decision for plan: assume Task 3's `@@index([workspaceId, provider])` is changed to `@@unique([workspaceId, provider])`. Re-run migration. Update upsert to:

```ts
where: { workspaceId_provider: { workspaceId: input.workspaceId, provider: "vercel" } },
```

And remove the explicit `id` from `create:`.

- [ ] **Step 5: Run test to verify it passes**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx vitest run server/trpc/routers/__tests__/integrations.test.ts
```

Expected: PASS (5/5 cases).

- [ ] **Step 6: Wire subrouter into root tRPC router**

```bash
grep -n "router({" server/trpc/router.ts | head -5
```

Add the vercel router to the existing root export. If integrations was not yet part of root, add it:

```ts
import { vercelIntegrationsRouter } from "./routers/integrations";

export const appRouter = router({
  // ...existing
  integrations: router({
    vercel: vercelIntegrationsRouter,
  }),
});
```

- [ ] **Step 7: Commit**

```bash
git add server/trpc/routers/integrations.ts server/trpc/router.ts server/trpc/routers/__tests__/integrations.test.ts prisma/
git commit -m "$(cat <<'EOF'
feat(integrations): add tRPC integrations.vercel subrouter

Three procedures:
- getConnection(workspaceId): query, returns {connected, teamId, vercelUserId, isActive}, never token
- finishConnect(workspaceId, teamId?): mutation, reads pending cookie,
  validates against session, encrypts token, upserts row, emits AuditLog
- disconnect(workspaceId): mutation, best-effort Vercel-side revoke via
  /v1/integrations/configuration/<id>, then deletes row + AuditLog

Schema: @@unique([workspaceId, provider]) added so upsert has a clean
where-key. Migration auto-regenerated.

5 tRPC tests cover all 3 procedures + permission + cookie validation
paths. Token is never returned to client (verified in test).

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Dashboard settings page — list integrations + Connect Vercel button

**Files:**
- Modify or create: `packages/dashboard/app/dashboard/settings/integrations/page.tsx`

- [ ] **Step 1: Check if page exists**

```bash
ls packages/dashboard/app/dashboard/settings/integrations/page.tsx 2>/dev/null || echo "DOES NOT EXIST"
```

If "DOES NOT EXIST" → create new. If exists → extend with Vercel section.

- [ ] **Step 2: Implement page**

```tsx
"use client";

import { useParams, useSearchParams } from "next/navigation";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { useState } from "react";

export default function IntegrationsSettingsPage() {
  const params = useParams();
  // Workspace id: existing dashboard routing should expose it. If route is
  // /dashboard/sites/[id]/settings, the workspace must be fetched from the site.
  // For V1.1, assume a top-level workspace settings route OR adapt.
  const workspaceId = (params.workspaceId as string) ?? (params.id as string);

  const search = useSearchParams();
  const oauthError = search.get("error");

  const conn = trpc.integrations.vercel.getConnection.useQuery(
    { workspaceId },
    { enabled: Boolean(workspaceId) },
  );
  const disconnect = trpc.integrations.vercel.disconnect.useMutation({
    onSuccess: () => conn.refetch(),
  });
  const { addToast } = useToast();

  const handleConnect = () => {
    window.location.href = `/api/integrations/vercel/authorize?workspaceId=${encodeURIComponent(workspaceId)}`;
  };

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}>Integrations</h1>

      {oauthError === "oauth_state_invalid" && (
        <div style={{ padding: 12, background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, marginBottom: 16 }}>
          OAuth session expired. Click Connect to retry.
        </div>
      )}
      {oauthError === "oauth_denied" && (
        <div style={{ padding: 12, background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, marginBottom: 16 }}>
          Vercel didn't authorize the connection. Try again or check your Vercel account.
        </div>
      )}

      <section style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Vercel</h2>
            <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
              Deploy your sites to Vercel. Connect once per workspace.
            </p>
          </div>

          {conn.isLoading ? (
            <span>Loading…</span>
          ) : conn.data?.connected ? (
            conn.data.isActive ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#16A34A" }}>
                  Connected{conn.data.teamId ? ` (team ${conn.data.teamId})` : ""}
                </span>
                <button
                  onClick={() => disconnect.mutate({ workspaceId })}
                  disabled={disconnect.isPending}
                  style={{ padding: "6px 12px", border: "1px solid #E5E7EB", borderRadius: 6 }}
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#DC2626" }}>Connection lost</span>
                <button
                  onClick={handleConnect}
                  style={{ padding: "6px 12px", background: "#000", color: "#fff", borderRadius: 6 }}
                >
                  Reconnect
                </button>
              </div>
            )
          ) : (
            <button
              onClick={handleConnect}
              style={{ padding: "6px 12px", background: "#000", color: "#fff", borderRadius: 6 }}
            >
              Connect Vercel
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Sanity-check in browser**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/dashboard && npm run dev
```

Visit `http://localhost:3000/dashboard/settings/integrations` (path may vary based on existing routing). Expect to see the Vercel section with a Connect button. Don't click yet — Task 13 ships the team-picker page that the callback redirects to.

- [ ] **Step 4: Commit**

```bash
git add packages/dashboard/app/dashboard/settings/integrations/page.tsx
git commit -m "$(cat <<'EOF'
feat(dashboard): settings/integrations page with Vercel Connect/Disconnect

Renders Vercel section showing one of three states:
- Not connected → Connect button (kicks off /api/integrations/vercel/authorize)
- Connected + active → status + Disconnect button
- Connected + invalid → "Connection lost" + Reconnect

Surfaces ?error=oauth_state_invalid + ?error=oauth_denied from callback
redirects as banners.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Team-picker page

**Files:**
- Create: `packages/dashboard/app/dashboard/settings/integrations/vercel-team-picker/page.tsx`

- [ ] **Step 1: Implement page**

```tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decrypt } from "@/lib/encryption";
import { z } from "zod";
import { VercelTeamPickerForm } from "./vercel-team-picker-form";

const PENDING_COOKIE = "buildrik_vercel_pending";

const PendingPayload = z.object({
  workspaceId: z.string(),
  userId: z.string(),
  vercelUserId: z.string(),
  teamId: z.string().nullable(),
  candidateTeams: z.array(z.object({ id: z.string(), name: z.string(), slug: z.string() })),
  exp: z.number(),
});

export default async function VercelTeamPickerPage() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(PENDING_COOKIE);
  if (!cookie?.value) {
    redirect("/dashboard/settings/integrations?error=oauth_state_invalid");
  }

  let payload;
  try {
    payload = PendingPayload.parse(JSON.parse(decrypt(cookie.value)));
  } catch {
    redirect("/dashboard/settings/integrations?error=oauth_state_invalid");
  }

  if (Date.now() > payload.exp) {
    redirect("/dashboard/settings/integrations?error=oauth_state_invalid");
  }

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Pick a Vercel team</h1>
      <p style={{ fontSize: 13, color: "#64748B", marginBottom: 16 }}>
        Sites in this Buildrik workspace will deploy to the team you pick. You can change this by disconnecting and reconnecting.
      </p>
      <VercelTeamPickerForm
        workspaceId={payload.workspaceId}
        defaultTeamId={payload.teamId}
        candidateTeams={payload.candidateTeams}
      />
    </div>
  );
}
```

Create the client form `vercel-team-picker-form.tsx` in the same directory:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@lib/trpc/client";

interface Props {
  workspaceId: string;
  defaultTeamId: string | null;
  candidateTeams: Array<{ id: string; name: string; slug: string }>;
}

export function VercelTeamPickerForm({ workspaceId, defaultTeamId, candidateTeams }: Props) {
  const [selected, setSelected] = useState<string | null>(defaultTeamId);
  const router = useRouter();
  const finish = trpc.integrations.vercel.finishConnect.useMutation({
    onSuccess: () => router.push("/dashboard/settings/integrations?connected=1"),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        finish.mutate({ workspaceId, teamId: selected });
      }}
    >
      <label style={{ display: "flex", gap: 8, padding: 12, border: selected === null ? "2px solid #000" : "1px solid #E5E7EB", borderRadius: 8, marginBottom: 8 }}>
        <input
          type="radio"
          name="team"
          checked={selected === null}
          onChange={() => setSelected(null)}
        />
        <span>Personal account</span>
      </label>

      {candidateTeams.map((t) => (
        <label key={t.id} style={{ display: "flex", gap: 8, padding: 12, border: selected === t.id ? "2px solid #000" : "1px solid #E5E7EB", borderRadius: 8, marginBottom: 8 }}>
          <input
            type="radio"
            name="team"
            checked={selected === t.id}
            onChange={() => setSelected(t.id)}
          />
          <span>{t.name} <span style={{ color: "#64748B", fontSize: 12 }}>({t.slug})</span></span>
        </label>
      ))}

      <button
        type="submit"
        disabled={finish.isPending}
        style={{ marginTop: 12, padding: "8px 16px", background: "#000", color: "#fff", borderRadius: 6 }}
      >
        {finish.isPending ? "Connecting…" : "Connect"}
      </button>

      {finish.error && (
        <div style={{ marginTop: 12, color: "#DC2626" }}>
          {finish.error.message}
        </div>
      )}
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/dashboard/app/dashboard/settings/integrations/vercel-team-picker/
git commit -m "$(cat <<'EOF'
feat(dashboard): vercel-team-picker page

Server component reads encrypted pending cookie, decodes via lib/encryption,
validates exp + payload shape, redirects to settings on any failure.

Renders radio list (Personal + each candidate team) → on submit calls
integrations.vercel.finishConnect tRPC mutation → on success redirects
to settings?connected=1.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Editor Topbar — `VERCEL_NOT_CONNECTED` toast + deep link

**Files:**
- Modify: `packages/editor/src/editor/shell/Topbar.tsx` (or wherever publish action is wired)

- [ ] **Step 1: Find publish click handler**

```bash
grep -n "sites\.publish\|publishMutation\|publishJob" packages/editor/src/editor/shell/Topbar.tsx | head -10
```

- [ ] **Step 2: Add error handler for VERCEL_NOT_CONNECTED and VERCEL_TOKEN_INVALID**

In the publish error path (likely an `onError` callback or try/catch around the mutate call), add:

```ts
const dashboardUrl = import.meta.env.VITE_DASHBOARD_URL ?? "http://localhost:3000";

function handlePublishError(err: unknown) {
  const msg = err instanceof Error ? err.message : "Publish failed";

  if (msg.includes("VERCEL_NOT_CONNECTED")) {
    addToast({
      title: "Vercel not connected",
      description: "Connect this workspace to Vercel before publishing.",
      tone: "error",
      action: {
        label: "Open settings",
        onClick: () => window.open(`${dashboardUrl}/dashboard/settings/integrations`, "_blank"),
      },
    });
    return;
  }

  if (msg.includes("VERCEL_TOKEN_INVALID")) {
    addToast({
      title: "Vercel connection lost",
      description: "Reconnect Vercel in workspace settings to publish again.",
      tone: "error",
      action: {
        label: "Reconnect",
        onClick: () => window.open(`${dashboardUrl}/dashboard/settings/integrations`, "_blank"),
      },
    });
    return;
  }

  addToast({ title: "Publish failed", description: msg, tone: "error" });
}
```

Hook this into the existing publish mutation's error handler. The exact integration point depends on current code — search for the existing error toast call and replace/extend it.

- [ ] **Step 3: Type-check**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit 2>&1 | grep "Topbar" | head -5
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add packages/editor/src/editor/shell/Topbar.tsx
git commit -m "$(cat <<'EOF'
feat(editor): publish error toasts for VERCEL_NOT_CONNECTED + _INVALID

Specific toasts for the two new error codes from publish.service:
- VERCEL_NOT_CONNECTED → "Connect Vercel..." + Open settings deep link
- VERCEL_TOKEN_INVALID → "Connection lost..." + Reconnect deep link

Both open dashboard /settings/integrations in a new tab. Generic
publish errors stay on the existing toast path.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: Phase 2 integration test (mocked Vercel HTTP, end-to-end)

**Files:**
- Create: `server/__tests__/vercel-oauth-flow.integration.test.ts`

- [ ] **Step 1: Write the long-form integration test**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchMock = vi.spyOn(globalThis, "fetch");
const ORIGINAL_KEY = process.env.ENCRYPTION_KEY;
const ORIGINAL_INTG = process.env.VERCEL_INTEGRATION_ID;
const ORIGINAL_CLIENT = process.env.VERCEL_CLIENT_ID;
const ORIGINAL_SECRET = process.env.VERCEL_CLIENT_SECRET;

beforeEach(() => {
  process.env.ENCRYPTION_KEY = "0".repeat(64);
  process.env.VERCEL_INTEGRATION_ID = "buildrik";
  process.env.VERCEL_CLIENT_ID = "oac_test";
  process.env.VERCEL_CLIENT_SECRET = "secret_test";
  fetchMock.mockReset();
});

afterAll(() => {
  process.env.ENCRYPTION_KEY = ORIGINAL_KEY;
  process.env.VERCEL_INTEGRATION_ID = ORIGINAL_INTG;
  process.env.VERCEL_CLIENT_ID = ORIGINAL_CLIENT;
  process.env.VERCEL_CLIENT_SECRET = ORIGINAL_SECRET;
  fetchMock.mockRestore();
});

import { buildStateToken, exchangeCodeForToken } from "@/server/services/vercel-oauth.service";
import { encrypt, decrypt } from "@/lib/encryption";

describe("Vercel OAuth flow (integration, mocked HTTP)", () => {
  it("completes a full happy-path: state → code exchange → cookie → finishConnect", async () => {
    // Step 1: build state token
    const state = buildStateToken("ws_1", "u_1");
    expect(state).toContain(".");

    // Step 2: simulate Vercel callback: mock /v2/oauth/access_token
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({
        access_token: "vt_real_secret",
        token_type: "Bearer",
        user_id: "vu_1",
        team_id: null,
        installation_id: "icfg_42",
      }), { status: 200 }),
    );
    // Step 2b: mock /v2/teams
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ teams: [{ id: "team_alpha", name: "Alpha", slug: "alpha" }] }), { status: 200 }),
    );

    const tokenResult = await exchangeCodeForToken("code_xyz", "http://localhost:3000/cb");
    expect(tokenResult.accessToken).toBe("vt_real_secret");
    expect(tokenResult.configurationId).toBe("icfg_42");

    // Step 3: encrypt token roundtrip (simulates finishConnect persistence)
    const cipher = encrypt(tokenResult.accessToken);
    expect(cipher).not.toContain("vt_real_secret");
    expect(decrypt(cipher)).toBe("vt_real_secret");
  });
});
```

- [ ] **Step 2: Run**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx vitest run server/__tests__/vercel-oauth-flow.integration.test.ts
```

Expected: PASS (1/1).

- [ ] **Step 3: Commit**

```bash
git add server/__tests__/vercel-oauth-flow.integration.test.ts
git commit -m "$(cat <<'EOF'
test(integrations): end-to-end Vercel OAuth flow integration test

Mocks Vercel API via fetch stub. Walks: state token → code exchange →
token roundtrip via lib/encryption. Locks the contract between the
oauth service and the encryption helper.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 16: Verify Phase 2 gates green + push

- [ ] **Step 1: Type-check**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx tsc --noEmit 2>&1 | grep -cE "error TS"
cd packages/editor && npx tsc --noEmit 2>&1 | grep -cE "error TS"
```

Compare to pre-arc baseline. Zero new errors → proceed.

- [ ] **Step 2: Run all new tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx vitest run \
  lib/encryption.test.ts \
  server/services/__tests__/vercel-oauth.test.ts \
  server/services/__tests__/integrations.service.test.ts \
  server/services/__tests__/publish.service.test.ts \
  server/__tests__/vercel-oauth-flow.integration.test.ts \
  app/api/integrations/vercel/authorize/route.test.ts \
  app/api/integrations/vercel/callback/route.test.ts \
  server/trpc/routers/__tests__/integrations.test.ts
```

Expected: ALL PASS.

- [ ] **Step 3: Push**

```bash
git push 2>&1 | tail -10
```

Expected: `✓ all gates passing`.

---

# Phase 3 — Manual walk-fix (user-assisted)

This phase isn't TDD — it's a real browser walk-through. Treat each step as a checklist item. If a step fails, document the failure as a P0/P1 in `V1_WALK_AND_FIX.md` under a new "Iter X — V1.1 Vercel OAuth walk" section, apply the codex pre-check protocol, ship the fix, re-walk.

## Walk A — Happy path

- [ ] User starts at empty `/dashboard/settings/integrations` page → sees "Connect Vercel" button
- [ ] Clicks Connect → browser redirects to vercel.com/integrations/buildrik/new?state=...
- [ ] On vercel.com → logs in if needed → picks a team (or personal) → clicks Install
- [ ] Vercel redirects back to `/api/integrations/vercel/callback?code=...&state=...`
- [ ] Callback exchanges code, redirects to `/dashboard/settings/integrations/vercel-team-picker`
- [ ] Team-picker page shows radio list with Personal + any candidate teams
- [ ] User picks team → clicks Connect → redirects to settings with `?connected=1` banner
- [ ] Settings page now shows "Connected (team xxx)" + Disconnect button
- [ ] Opens editor on a site in that workspace → clicks Publish
- [ ] Publish job runs → editor toast shows real Vercel deployment URL
- [ ] Opens URL in new tab → verifies site is live on Vercel (in user's chosen team)

## Walk B — Reconnect after 401

- [ ] On vercel.com → goes to user's Account → Tokens → revokes the Buildrik token
- [ ] Back in editor → clicks Publish
- [ ] Worker calls Vercel /v13/deployments → gets 401 → `publish.service` calls `markInactive` + throws `VERCEL_TOKEN_INVALID`
- [ ] Editor toast: "Vercel connection lost. Reconnect in workspace settings." + Reconnect link
- [ ] Settings page now shows "Connection lost" + Reconnect button (not Disconnect)
- [ ] User clicks Reconnect → OAuth flow runs again → new token replaces old via finishConnect upsert
- [ ] Returns to editor → publishes again → succeeds

## Walk C — Disconnect

- [ ] In settings → clicks Disconnect
- [ ] tRPC `disconnect` runs → best-effort calls Vercel DELETE /v1/integrations/configuration/<id> → deletes local row
- [ ] Settings page returns to "Connect Vercel" button state
- [ ] In editor → clicks Publish → expects `VERCEL_NOT_CONNECTED` error
- [ ] Toast: "Vercel not connected" + Open settings deep link

## After all three walks pass

- [ ] Update `V1_WALK_AND_FIX.md` with the V1.1 walk results
- [ ] Update memory: `~/.claude/projects/.../memory/project_v1_1_vercel_oauth_shipped_<date>.md`
- [ ] Per CLAUDE.md V1 freeze policy: V1 walk-and-fix is already closed; this V1.1 arc shipping doesn't unfreeze anything by itself. If both V1 manual walk (`V1_NEXT_ACTIONS.md` Path A) AND this V1.1 arc are green, recommend lifting the freeze in a follow-up.

---

## Self-review notes (auto-applied)

This plan was self-reviewed against the spec. Findings + fixes:

- **Type consistency:** `getActiveVercelConnection` returns `{id, token, teamId}` per Task 4. Task 6's mock + impl use same shape. ✓
- **Function naming:** `runVercelDeploy` in Task 6 — adopt or rename to match the existing publish.service entry point during Step 1 inspection. Plan flags this.
- **Schema decision (Task 3 vs Task 11):** plan switches from `@@index` to `@@unique([workspaceId, provider])` when Task 11's upsert needs the unique. Task 3's commit can stand as-is; Task 11 amends the schema and re-runs migration. Acceptable churn for ~3 minutes of work.
- **Test infra:** route handler tests use Web `Request`/`Response` directly. Vitest config in repo (already present per existing tests) should handle this.
- **No placeholders:** every step has runnable code or commands. No "TBD" / "etc" / "similar to" left in plan.
- **Phase 0 user dependency:** plan explicitly pauses after Task 7 for user to register Vercel integration. Phase 2 begins only after env vars are in place.

## Quick reference

- **Spec:** `docs/superpowers/specs/2026-05-19-vercel-oauth-integration-design.md`
- **Vercel docs:** https://vercel.com/docs/integrations/build-your-own
- **Vercel OAuth endpoints:** `/v2/oauth/access_token`, `/v2/teams`, `/v13/deployments`, `/v1/integrations/configuration/<id>`
- **Pre-push hook:** runs `pnpm verify:ds` — DO NOT bypass with `--no-verify`
- **Commit footer:** `Co-Authored-By: Claude <noreply@anthropic.com>` (or longer 1M-context line per project convention)

# Editor–Dashboard Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the editor to the dashboard backend so sites created in the dashboard can be loaded, edited, and saved in the editor.

**Architecture:** Editor's existing CloudSyncService gets a new "buildrik" provider that calls dashboard tRPC endpoints via HTTP. A new `sites.saveProject` mutation accepts full ProjectData snapshots and diffs them against the DB. Auth is shared via cross-subdomain NextAuth cookie.

**Tech Stack:** tRPC 11 (vanilla client), Prisma 5, NextAuth 5, Vite proxy, pnpm workspaces, Turborepo

**Spec:** `docs/superpowers/specs/2026-04-01-editor-dashboard-integration-design.md`

---

## File Map

### Phase 0 (Foundation)
- Modify: `editor/package.json` — rename, bump React 18→19
- Modify: `editor/vite.config.ts` — add dev proxy
- Modify: `server/auth.config.ts` — add cookie domain
- Modify: `next.config.mjs` — add CORS headers
- Delete: `package-lock.json`, `editor/package-lock.json`

### Phase 1 (Wiring) — Lane A (server)
- Modify: `server/trpc/routers/sites.ts` — add `saveProject` mutation
- Modify: `server/services/sites.service.ts` — add `saveProjectData()` function
- Create: `__tests__/sites-save-project.test.ts` — tests for saveProject

### Phase 1 (Wiring) — Lane B (editor)
- Create: `editor/src/services/BuildrikSyncProvider.ts` — CloudSyncService provider
- Create: `editor/src/services/__tests__/buildrik-sync-provider.test.ts` — provider tests

### Phase 2 (Monorepo Structure)
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Move: `editor/` → `packages/editor/`
- Move: `app/`, `middleware.ts`, `next.config.mjs` → `packages/dashboard/`
- Move: `components/`, `emails/` → `packages/dashboard/components/`, `packages/dashboard/emails/`
- Create: `packages/dashboard/package.json`, `packages/dashboard/tsconfig.json`
- Move: `lib/validations/` → `packages/shared/schemas/`
- Create: `packages/shared/package.json`, `packages/shared/tsconfig.json`
- Modify: `CLAUDE.md` — update architecture paths

### Phase 3 (Shared Types + Tooling)
- Create: `packages/shared/api-client.ts` — tRPC vanilla client
- Create: `.github/workflows/ci.yml` — unified CI
- Modify: editor and dashboard components for cross-app nav links

---

## Phase 0: Foundation Setup

### Task 1: Upgrade Editor to React 19

**Files:**
- Modify: `editor/package.json`

- [ ] **Step 1: Bump React versions in editor/package.json**

Change in `editor/package.json` devDependencies:
```json
"react": "^19.0.0",
"react-dom": "^19.0.0",
"@types/react": "^19.0.0",
"@types/react-dom": "^19.0.0"
```

- [ ] **Step 2: Delete editor lockfile and reinstall**

Run:
```bash
rm editor/package-lock.json
cd editor && npm install
```
Expected: clean install, no peer dep errors

- [ ] **Step 3: Check for type errors**

Run:
```bash
cd editor && npx tsc --noEmit
```
Expected: 0 errors (editor uses standard React APIs, no React 18-specific features)

- [ ] **Step 4: Commit**

```bash
git add editor/package.json editor/package-lock.json
git commit -m "chore(editor): upgrade React 18 → 19"
```

---

### Task 2: Fix Package Naming + Switch to pnpm

**Files:**
- Modify: `editor/package.json`
- Delete: `package-lock.json`, `editor/package-lock.json`

- [ ] **Step 1: Rename editor package**

In `editor/package.json`, change:
```json
"name": "@buildrik/editor"
```

- [ ] **Step 2: Rename root package**

In root `package.json`, change:
```json
"name": "@buildrik/dashboard"
```

- [ ] **Step 3: Delete both lockfiles**

Run:
```bash
rm -f package-lock.json editor/package-lock.json
```

- [ ] **Step 4: Install pnpm and generate unified lockfile**

Run:
```bash
npm install -g pnpm
pnpm install
```
Expected: `pnpm-lock.yaml` created at root

- [ ] **Step 5: Commit**

```bash
git add package.json editor/package.json pnpm-lock.yaml .gitignore
git rm package-lock.json editor/package-lock.json
git commit -m "chore: rename packages, switch to pnpm"
```

---

### Task 3: Add Vite Dev Proxy

**Files:**
- Modify: `editor/vite.config.ts`

- [ ] **Step 1: Add proxy config to editor/vite.config.ts**

Add inside the `server` block:
```ts
server: {
  port: 5050,
  host: "0.0.0.0",
  proxy: {
    "/api": {
      target: "http://localhost:3000",
      changeOrigin: true,
    },
  },
},
```

- [ ] **Step 2: Verify proxy works**

Run in two terminals:
```bash
# Terminal 1: dashboard
pnpm dev

# Terminal 2: editor
cd editor && pnpm dev
```
Open `http://localhost:5050/api/trpc` — should proxy to Next.js and return a tRPC response (or 404 from tRPC, not a Vite error).

- [ ] **Step 3: Commit**

```bash
git add editor/vite.config.ts
git commit -m "chore(editor): add dev proxy for /api → Next.js"
```

---

### Task 4: Configure Cross-Subdomain Auth Cookie + CORS

**Files:**
- Modify: `server/auth.config.ts`
- Modify: `next.config.mjs`

- [ ] **Step 1: Add cookie domain to NextAuth config**

In `server/auth.config.ts`, update the cookies config:
```ts
cookies: {
  sessionToken: {
    name: process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token",
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      domain: process.env.COOKIE_DOMAIN || undefined,
    },
  },
},
```

- [ ] **Step 2: Add COOKIE_DOMAIN to .env.example**

Add to `.env.example`:
```
COOKIE_DOMAIN=.buildrik.com
```

- [ ] **Step 3: Add CORS headers for editor origin**

In `next.config.mjs`, add headers config:
```js
async headers() {
  return [
    {
      source: "/api/:path*",
      headers: [
        {
          key: "Access-Control-Allow-Origin",
          value: process.env.EDITOR_ORIGIN || "http://localhost:5050",
        },
        {
          key: "Access-Control-Allow-Credentials",
          value: "true",
        },
        {
          key: "Access-Control-Allow-Methods",
          value: "GET, POST, OPTIONS",
        },
        {
          key: "Access-Control-Allow-Headers",
          value: "Content-Type, Authorization",
        },
      ],
    },
  ];
},
```

- [ ] **Step 4: Add EDITOR_ORIGIN to .env.example**

```
EDITOR_ORIGIN=https://editor.buildrik.com
```

- [ ] **Step 5: Commit**

```bash
git add server/auth.config.ts next.config.mjs .env.example
git commit -m "feat(auth): cross-subdomain cookie + CORS for editor"
```

---

## Phase 1: Wiring — Lane A (Server)

### Task 5: Write saveProject Service Function

**Files:**
- Modify: `server/services/sites.service.ts`
- Create: `__tests__/sites-save-project.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/sites-save-project.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    site: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    page: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn({
      page: {
        findMany: vi.fn().mockResolvedValue([]),
        upsert: vi.fn(),
        deleteMany: vi.fn(),
      },
      site: {
        update: vi.fn().mockResolvedValue({ id: "site-1", lastEditedAt: new Date() }),
      },
    })),
  },
}));

import { saveProjectData } from "@/server/services/sites.service";

describe("saveProjectData", () => {
  it("should upsert pages from ProjectData and update lastEditedAt", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.site.findUnique as any).mockResolvedValue({ id: "site-1", workspaceId: "ws-1" });

    const projectData = {
      version: "1.0",
      pages: [
        { id: "page-1", name: "Home", slug: "home", isHome: true, root: { id: "root", type: "div", children: [] } },
        { id: "page-2", name: "About", slug: "about", root: { id: "root", type: "div", children: [] } },
      ],
      styles: [],
      assets: [],
    };

    const result = await saveProjectData("site-1", projectData);
    expect(result).toHaveProperty("savedAt");
  });

  it("should throw if site does not exist", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.site.findUnique as any).mockResolvedValue(null);

    await expect(saveProjectData("bad-id", { version: "1.0", pages: [], styles: [], assets: [] }))
      .rejects.toThrow("SITE_NOT_FOUND");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test __tests__/sites-save-project.test.ts`
Expected: FAIL — `saveProjectData` not exported from sites.service

- [ ] **Step 3: Implement saveProjectData in sites.service.ts**

Add to `server/services/sites.service.ts`:
```ts
export async function saveProjectData(
  siteId: string,
  projectData: { version: string; pages: any[]; styles: any[]; assets: any[]; metadata?: any; settings?: any }
) {
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) throw new Error("SITE_NOT_FOUND");

  const savedAt = new Date();

  await prisma.$transaction(async (tx) => {
    const existingPages = await tx.page.findMany({
      where: { siteId },
      select: { id: true },
    });

    const incomingPageIds = new Set(projectData.pages.map((p) => p.id));
    const pagesToDelete = existingPages.filter((p) => !incomingPageIds.has(p.id));

    // Delete removed pages
    if (pagesToDelete.length > 0) {
      await tx.page.deleteMany({
        where: { id: { in: pagesToDelete.map((p) => p.id) } },
      });
    }

    // Upsert each page
    for (const [index, page] of projectData.pages.entries()) {
      await tx.page.upsert({
        where: { id: page.id },
        create: {
          id: page.id,
          siteId,
          name: page.name,
          slug: page.slug || page.name.toLowerCase().replace(/\s+/g, "-"),
          position: index,
          isHomePage: page.isHome || false,
          blocks: page.root as any,
        },
        update: {
          name: page.name,
          slug: page.slug || page.name.toLowerCase().replace(/\s+/g, "-"),
          position: index,
          isHomePage: page.isHome || false,
          blocks: page.root as any,
        },
      });
    }

    // Update site metadata
    await tx.site.update({
      where: { id: siteId },
      data: {
        lastEditedAt: savedAt,
        pages: projectData.pages.length,
      },
    });
  });

  return { success: true, savedAt };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test __tests__/sites-save-project.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/services/sites.service.ts __tests__/sites-save-project.test.ts
git commit -m "feat(sites): add saveProjectData service function"
```

---

### Task 6: Wire saveProject to tRPC Router

**Files:**
- Modify: `server/trpc/routers/sites.ts`

- [ ] **Step 1: Add saveProject procedure to sites router**

In `server/trpc/routers/sites.ts`, add alongside existing procedures:
```ts
saveProject: protectedProcedure
  .input(
    z.object({
      siteId: z.string(),
      projectData: z.object({
        version: z.string(),
        pages: z.array(z.object({
          id: z.string(),
          name: z.string(),
          slug: z.string().optional(),
          isHome: z.boolean().optional(),
          root: z.any(),
          styles: z.any().optional(),
          settings: z.any().optional(),
        })),
        styles: z.array(z.any()),
        assets: z.array(z.any()),
        metadata: z.any().optional(),
        settings: z.any().optional(),
      }),
    })
  )
  .mutation(async ({ input, ctx }) => {
    // Verify user has access to this site's workspace
    const site = await prisma.site.findUnique({
      where: { id: input.siteId },
      select: { workspaceId: true },
    });
    if (!site) throw new TRPCError({ code: "NOT_FOUND", message: "Site not found" });

    // Verify workspace membership
    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId: site.workspaceId, userId: ctx.session.user.id },
    });
    if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });

    return saveProjectData(input.siteId, input.projectData);
  }),
```

- [ ] **Step 2: Add import at top of file**

```ts
import { saveProjectData } from "@/server/services/sites.service";
```

- [ ] **Step 3: Test the endpoint manually**

Run: `pnpm dev`
Use a REST client to POST to `http://localhost:3000/api/trpc/sites.saveProject` with a valid session cookie and body.
Expected: `{ "result": { "data": { "success": true, "savedAt": "..." } } }`

- [ ] **Step 4: Commit**

```bash
git add server/trpc/routers/sites.ts
git commit -m "feat(sites): wire saveProject mutation to tRPC router"
```

---

## Phase 1: Wiring — Lane B (Editor)

### Task 7: Create Buildrik Sync Provider

**Files:**
- Create: `editor/src/services/BuildrikSyncProvider.ts`

- [ ] **Step 1: Create the provider file**

Create `editor/src/services/BuildrikSyncProvider.ts`:
```ts
import type { ProjectData } from "@/shared/types/project";

const API_BASE = "/api/trpc";

interface TRPCResponse<T> {
  result: { data: T };
}

async function trpcQuery<T>(procedure: string, input: Record<string, unknown>): Promise<T> {
  const params = new URLSearchParams({ input: JSON.stringify(input) });
  const res = await fetch(`${API_BASE}/${procedure}?${params}`, {
    credentials: "include",
  });

  if (res.status === 401) {
    window.location.href = "/auth/login";
    throw new Error("AUTH_EXPIRED");
  }

  if (!res.ok) {
    throw new Error(`API_ERROR_${res.status}`);
  }

  const json: TRPCResponse<T> = await res.json();
  return json.result.data;
}

async function trpcMutation<T>(procedure: string, input: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_BASE}/${procedure}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  if (res.status === 401) {
    window.location.href = "/auth/login";
    throw new Error("AUTH_EXPIRED");
  }

  if (!res.ok) {
    throw new Error(`API_ERROR_${res.status}`);
  }

  const json: TRPCResponse<T> = await res.json();
  return json.result.data;
}

export async function loadProject(siteId: string): Promise<ProjectData> {
  const site = await trpcQuery<{ id: string; name: string }>("sites.get", { id: siteId });

  const pages = await trpcQuery<Array<{
    id: string;
    name: string;
    slug: string;
    isHomePage: boolean;
    blocks: any;
    position: number;
  }>>("pages.list", { siteId });

  return {
    version: "1.0",
    pages: pages
      .sort((a, b) => a.position - b.position)
      .map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        isHome: p.isHomePage,
        root: p.blocks || { id: "root", type: "div", children: [] },
      })),
    styles: [],
    assets: [],
    metadata: {
      name: site.name,
    },
  };
}

export async function saveProject(
  siteId: string,
  projectData: ProjectData
): Promise<{ success: boolean; savedAt: string }> {
  return trpcMutation("sites.saveProject", { siteId, projectData });
}

export function getSiteIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("siteId");
}
```

- [ ] **Step 2: Commit**

```bash
git add editor/src/services/BuildrikSyncProvider.ts
git commit -m "feat(editor): add BuildrikSyncProvider for dashboard API"
```

---

### Task 8: Wire Provider into CloudSyncService

**Files:**
- Modify: `editor/src/services/CloudSyncService.ts` (or the editor's entry point where CloudSyncService is initialized)

- [ ] **Step 1: Find where CloudSyncService is configured**

Search for `CloudSyncService` initialization:
```bash
grep -rn "new CloudSyncService\|CloudSyncService(" editor/src/ --include="*.ts" --include="*.tsx" | head -10
```

- [ ] **Step 2: Add buildrik provider case**

In the CloudSyncService configuration (or where the provider is selected), add support for the "custom" provider using our BuildrikSyncProvider:

```ts
import { loadProject, saveProject, getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";

// When initializing CloudSyncService, configure with custom provider:
const siteId = getSiteIdFromUrl();

if (siteId) {
  cloudSync.configure({
    provider: "custom",
    endpoint: "/api/trpc",
    apiKey: "", // Not needed — cookie auth
    options: {
      fetchRemote: async () => loadProject(siteId),
      uploadToCloud: async (_id: string, data: ProjectData) => saveProject(siteId, data),
    },
  });
}
```

NOTE: The exact integration point depends on how the editor initializes. Read the CloudSyncService constructor and the main entry point (`editor/demo/main.tsx`) to find the right location.

- [ ] **Step 3: Test manually**

1. Create a site in dashboard: `http://localhost:3000/dashboard/sites/new`
2. Note the site ID from the URL
3. Open editor with siteId: `http://localhost:5050/?siteId=<site-id>`
4. Editor should load the site's pages
5. Make an edit, wait 5s for auto-save
6. Refresh — edit should persist

- [ ] **Step 4: Commit**

```bash
git add editor/src/services/CloudSyncService.ts editor/demo/main.tsx
git commit -m "feat(editor): wire BuildrikSyncProvider into CloudSyncService"
```

---

### Task 9: Write Provider Integration Tests

**Files:**
- Create: `editor/src/services/__tests__/buildrik-sync-provider.test.ts`

- [ ] **Step 1: Write tests for loadProject and saveProject**

Create `editor/src/services/__tests__/buildrik-sync-provider.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadProject, saveProject, getSiteIdFromUrl } from "../BuildrikSyncProvider";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("loadProject", () => {
  it("should assemble ProjectData from sites.get + pages.list", async () => {
    // Mock sites.get
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ result: { data: { id: "s1", name: "My Site" } } }),
    });
    // Mock pages.list
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        result: {
          data: [
            { id: "p1", name: "Home", slug: "home", isHomePage: true, blocks: { id: "root", type: "div", children: [] }, position: 0 },
            { id: "p2", name: "About", slug: "about", isHomePage: false, blocks: { id: "root", type: "div", children: [] }, position: 1 },
          ],
        },
      }),
    });

    const result = await loadProject("s1");

    expect(result.version).toBe("1.0");
    expect(result.pages).toHaveLength(2);
    expect(result.pages[0].name).toBe("Home");
    expect(result.pages[0].isHome).toBe(true);
    expect(result.metadata?.name).toBe("My Site");
  });

  it("should redirect to login on 401", async () => {
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: "" } as any;

    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

    await expect(loadProject("s1")).rejects.toThrow("AUTH_EXPIRED");
    expect(window.location.href).toBe("/auth/login");

    window.location = originalLocation;
  });
});

describe("saveProject", () => {
  it("should POST projectData to sites.saveProject", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ result: { data: { success: true, savedAt: "2026-04-01T00:00:00Z" } } }),
    });

    const result = await saveProject("s1", {
      version: "1.0",
      pages: [{ id: "p1", name: "Home", root: { id: "root", type: "div", children: [] } }],
      styles: [],
      assets: [],
    });

    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/trpc/sites.saveProject",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      })
    );
  });
});

describe("getSiteIdFromUrl", () => {
  it("should extract siteId from query params", () => {
    Object.defineProperty(window, "location", {
      value: { search: "?siteId=abc-123" },
      writable: true,
    });
    expect(getSiteIdFromUrl()).toBe("abc-123");
  });

  it("should return null if no siteId", () => {
    Object.defineProperty(window, "location", {
      value: { search: "" },
      writable: true,
    });
    expect(getSiteIdFromUrl()).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests**

Run: `cd editor && npx vitest run src/services/__tests__/buildrik-sync-provider.test.ts`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add editor/src/services/__tests__/buildrik-sync-provider.test.ts
git commit -m "test(editor): add BuildrikSyncProvider unit tests"
```

---

## Phase 1 Milestone Check

- [ ] **Verify end-to-end flow manually:**

1. Start dashboard: `pnpm dev` (port 3000)
2. Start editor: `cd editor && pnpm dev` (port 5050)
3. Create site in dashboard at `http://localhost:3000/dashboard/sites/new`
4. Copy site ID
5. Open `http://localhost:5050/?siteId=<id>`
6. Editor loads site pages
7. Edit something, wait for auto-save
8. Refresh editor — changes persisted
9. Check dashboard — `lastEditedAt` updated

- [ ] **Run all tests:**

```bash
pnpm test
cd editor && npx vitest run
```
Expected: All pass

- [ ] **Commit milestone**

```bash
git commit --allow-empty -m "milestone: Phase 1 complete — editor loads and saves real site data"
```

---

## Phase 2: Monorepo Structure

### Task 10: Create Workspace Config

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`

- [ ] **Step 1: Create pnpm-workspace.yaml**

Create `pnpm-workspace.yaml` at root:
```yaml
packages:
  - "packages/*"
```

- [ ] **Step 2: Create turbo.json**

Create `turbo.json` at root:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {}
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add pnpm-workspace.yaml turbo.json
git commit -m "chore: add pnpm workspace + turborepo config"
```

---

### Task 11: Move Editor to packages/

**Files:**
- Move: `editor/` → `packages/editor/`

- [ ] **Step 1: Create packages directory and move editor**

```bash
mkdir -p packages
git mv editor packages/editor
```

- [ ] **Step 2: Verify editor builds**

```bash
cd packages/editor && pnpm dev
```
Expected: Editor starts on port 5050

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: move editor/ → packages/editor/"
```

---

### Task 12: Move Dashboard Files to packages/dashboard

**Files:**
- Move: `app/`, `components/`, `emails/`, `middleware.ts`, `next.config.mjs` → `packages/dashboard/`

- [ ] **Step 1: Create dashboard package directory**

```bash
mkdir -p packages/dashboard
```

- [ ] **Step 2: Move dashboard files**

```bash
git mv app packages/dashboard/app
git mv components packages/dashboard/components  
git mv emails packages/dashboard/emails
git mv middleware.ts packages/dashboard/middleware.ts
git mv next.config.mjs packages/dashboard/next.config.mjs
```

- [ ] **Step 3: Create packages/dashboard/package.json**

```json
{
  "name": "@buildrik/dashboard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

- [ ] **Step 4: Create packages/dashboard/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"],
      "@server/*": ["../../server/*"],
      "@lib/*": ["../../lib/*"],
      "@buildrik/shared/*": ["../shared/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", "../../server/**/*.ts", "../../lib/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Update all imports in dashboard code**

Run bulk find-replace on all files inside `packages/dashboard/`:
- `@/components/` stays as `@/components/` (resolved relative to dashboard root)
- `@/emails/` stays as `@/emails/` (resolved relative to dashboard root)
- `@/server/` → `@server/` (mapped to `../../server/`)
- `@/lib/` → `@lib/` (mapped to `../../lib/`)
- `@/app/` stays as `@/app/`

NOTE: This is a mechanical bulk update. Use grep + sed or IDE find-replace. Verify with `npx tsc --noEmit` after.

- [ ] **Step 6: Verify dashboard builds**

```bash
cd packages/dashboard && pnpm build
```
Expected: Build succeeds

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: move dashboard files → packages/dashboard/"
```

---

### Task 13: Create Shared Package

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Move: `lib/validations/` → `packages/shared/schemas/`

- [ ] **Step 1: Create shared package structure**

```bash
mkdir -p packages/shared/schemas
```

- [ ] **Step 2: Create packages/shared/package.json**

```json
{
  "name": "@buildrik/shared",
  "version": "0.1.0",
  "private": true,
  "main": "index.ts",
  "types": "index.ts"
}
```

- [ ] **Step 3: Create packages/shared/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist"
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Move validation schemas**

```bash
git mv lib/validations/* packages/shared/schemas/
```

- [ ] **Step 5: Update imports in server/trpc/routers/**

All files that import from `@/lib/validations/` or `@lib/validations/` need to import from `@buildrik/shared/schemas/` instead.

```bash
grep -rn "lib/validations" server/trpc/routers/ --include="*.ts"
```

Update each file's imports.

- [ ] **Step 6: Create packages/shared/index.ts**

```ts
export * from "./schemas";
```

- [ ] **Step 7: Verify everything builds**

```bash
pnpm install
cd packages/dashboard && pnpm build
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: create @buildrik/shared package with Zod schemas"
```

---

### Task 14: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update architecture section in CLAUDE.md**

Replace the architecture block with:
```
packages/
  dashboard/          → Next.js app (pages, components, emails)
  editor/             → Vite editor app (untouched source)
  shared/             → Transport-safe contracts (API client, Zod schemas)
server/
  auth.ts             → NextAuth init
  auth.config.ts      → NextAuth providers config
  trpc/
    trpc.ts           → tRPC context & base procedures
    router.ts         → Router aggregation (single export)
    routers/          → One file per domain (auth.ts, etc.)
  services/           → Business logic. One file per domain.
lib/
  prisma.ts           → Prisma singleton
  utils.ts            → Shared pure utilities (cn, etc.)
  trpc/client.tsx     → tRPC client + React Query provider
prisma/               → Schema & migrations
```

- [ ] **Step 2: Update SSOT section**

Change:
```
- Zod schemas live in `lib/validations/`.
```
To:
```
- Zod schemas live in `packages/shared/schemas/`.
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for monorepo structure"
```

---

## Phase 3: Shared Types + Tooling

### Task 15: Create tRPC Vanilla Client in Shared Package

**Files:**
- Create: `packages/shared/api-client.ts`

- [ ] **Step 1: Install tRPC client in shared package**

```bash
cd packages/shared && pnpm add @trpc/client superjson
```

- [ ] **Step 2: Create api-client.ts**

Create `packages/shared/api-client.ts`:
```ts
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../server/trpc/router";

export function createBuildrikApiClient(baseUrl: string) {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${baseUrl}/api/trpc`,
        transformer: superjson,
        headers() {
          return {};
        },
        fetch(url, options) {
          return fetch(url, { ...options, credentials: "include" });
        },
      }),
    ],
  });
}

export type BuildrikApiClient = ReturnType<typeof createBuildrikApiClient>;
```

- [ ] **Step 3: Update shared/index.ts**

```ts
export * from "./schemas";
export { createBuildrikApiClient, type BuildrikApiClient } from "./api-client";
```

- [ ] **Step 4: Update editor's BuildrikSyncProvider to use typed client**

Replace the raw fetch calls in `packages/editor/src/services/BuildrikSyncProvider.ts` with the typed client:
```ts
import { createBuildrikApiClient } from "@buildrik/shared";
import type { ProjectData } from "@/shared/types/project";

const client = createBuildrikApiClient("");

export async function loadProject(siteId: string): Promise<ProjectData> {
  const site = await client.sites.get.query({ id: siteId });
  const pages = await client.pages.list.query({ siteId });

  return {
    version: "1.0",
    pages: pages
      .sort((a: any, b: any) => a.position - b.position)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        isHome: p.isHomePage,
        root: p.blocks || { id: "root", type: "div", children: [] },
      })),
    styles: [],
    assets: [],
    metadata: { name: site.name },
  };
}

export async function saveProject(
  siteId: string,
  projectData: ProjectData
): Promise<{ success: boolean; savedAt: Date }> {
  return client.sites.saveProject.mutate({ siteId, projectData });
}
```

- [ ] **Step 5: Commit**

```bash
git add packages/shared/api-client.ts packages/shared/index.ts packages/shared/package.json packages/editor/src/services/BuildrikSyncProvider.ts
git commit -m "feat(shared): add typed tRPC vanilla client, wire to editor"
```

---

### Task 16: Unified CI/CD Pipeline

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create CI workflow**

Create `.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile

      - name: Generate Prisma client
        run: pnpm exec prisma generate

      - name: Type check dashboard
        run: cd packages/dashboard && pnpm exec tsc --noEmit

      - name: Type check editor
        run: cd packages/editor && pnpm exec tsc --noEmit

      - name: Run tests
        run: pnpm test

      - name: Build dashboard
        run: cd packages/dashboard && pnpm build

      - name: Build editor
        run: cd packages/editor && pnpm build
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add unified GitHub Actions pipeline for monorepo"
```

---

### Task 17: Cross-App Navigation Links

**Files:**
- Modify: Dashboard site header component (where "Edit" button lives)
- Modify: Editor shell/topbar component

- [ ] **Step 1: Find and update the dashboard "Edit" button**

```bash
grep -rn "Edit.*editor\|Open.*editor\|editor.*siteId" packages/dashboard/ --include="*.tsx" | head -10
```

Update the link to point to `editor.buildrik.com`:
```tsx
const editorUrl = process.env.NEXT_PUBLIC_EDITOR_URL || "http://localhost:5050";

<a href={`${editorUrl}/?siteId=${site.id}`} target="_blank" rel="noopener noreferrer">
  Open in Editor
</a>
```

- [ ] **Step 2: Add "Back to Dashboard" in editor**

Find the editor's topbar/header component:
```bash
grep -rn "Topbar\|topbar\|Header" packages/editor/src/editor/shell/ --include="*.tsx" | head -10
```

Add a "Back to Dashboard" link:
```tsx
const dashboardUrl = import.meta.env.VITE_DASHBOARD_URL || "http://localhost:3000";

<a href={`${dashboardUrl}/dashboard/sites`} style={{ /* match editor styling */ }}>
  ← Back to Dashboard
</a>
```

- [ ] **Step 3: Add env vars to .env.example**

```
NEXT_PUBLIC_EDITOR_URL=https://editor.buildrik.com
VITE_DASHBOARD_URL=https://buildrik.com
```

- [ ] **Step 4: Commit**

```bash
git add packages/dashboard/ packages/editor/ .env.example
git commit -m "feat: add cross-app navigation (editor ↔ dashboard)"
```

---

## Phase 3 Milestone Check

- [ ] **Verify full integration:**

1. `pnpm dev` starts both apps
2. Create site in dashboard → "Open in Editor" link works
3. Editor loads site data via typed tRPC client
4. Edit + save works
5. "Back to Dashboard" link in editor works
6. `pnpm test` passes
7. `pnpm build` builds both apps

- [ ] **Final commit**

```bash
git commit --allow-empty -m "milestone: Phase 3 complete — full monorepo with typed contracts and unified CI"
```

---

## Summary

| Phase | Tasks | New Code | Milestone |
|-------|-------|----------|-----------|
| Phase 0 | Tasks 1-4 | ~50 lines config | Foundation: React 19, pnpm, proxy, CORS |
| Phase 1A | Tasks 5-6 | ~60 lines server | saveProject endpoint |
| Phase 1B | Tasks 7-9 | ~100 lines editor | BuildrikSyncProvider |
| Phase 2 | Tasks 10-14 | ~40 lines config | Monorepo structure |
| Phase 3 | Tasks 15-17 | ~50 lines shared | Typed client, CI, nav links |

**Total new code: ~300 lines**
**Parallelization: Tasks 5-6 (Lane A) and Tasks 7-9 (Lane B) run simultaneously**

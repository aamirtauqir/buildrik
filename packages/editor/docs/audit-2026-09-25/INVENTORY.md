# Repository inventory and application boundaries

Date: 2026-09-25. Repository: `/Users/shahg/Desktop/pencil/buildrik`.

This is the initial whole-repository discovery and selected architecture trace for the supplied Complete Codebase Audit Multi-Agent Playbook. It is **not** a completed engineering, security, persistence, or release audit. **NOT RUNTIME VERIFIED.** No test suite, browser flow, database migration, deployment, or external API was run for this inventory. Local secret environment values were not opened or copied.

## Method and coverage

- Listed repository root, tracked paths, relevant hidden configuration, and directory structure across `packages`, `server`, `lib`, `src`, `prisma`, `scripts`, `types`, `video`, `archive`, `learn`, and `scratchpad_audit` before forming architecture conclusions.
- Read applicable `server/AGENTS.md`, `packages/dashboard/AGENTS.md`, `packages/editor/src/editor/AGENTS.md`, and `packages/editor/src/engine/AGENTS.md`. No applicable `AGENTS.md` was found in ancestor directories or the editor documentation subtree.
- Source-inspected workspace/package configuration, Next/Vite/test configuration, CI workflow commands, the production and demo editor entrypoints, the tRPC mount/context/router, auth initialization/configuration, editor API client, project load/save branching, the server save adapter/transaction, and storage dispatch.
- Other route/service/model/test names below are **inventoried**, not individually behavior-audited. File presence, test filename counts, and comments do not establish implemented correctness or passing coverage.
- `repository-files.txt` is the companion discovery snapshot. Tracked counts below are a separate `git ls-files -z` snapshot, including already staged user changes and excluding untracked files. Generated outputs, dependencies, screenshots, and local working artifacts exist outside that tracked census.
- Existing user changes observed: staged media library/delete-modal/types/test changes and `pnpm-workspace.yaml`; untracked prior audit material/screenshots, review archives, and `learn/`. This inventory does not alter or attribute those changes.

### Reproducible tracked census

Run from repository root; this reads the index and does not traverse dependency symlinks:

```sh
node - <<'NODE'
const { execFileSync } = require('node:child_process');
const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const group = (entries, key) => entries.reduce((counts, file) => {
  const name = key(file);
  counts[name] = (counts[name] || 0) + 1;
  return counts;
}, {});
console.log(JSON.stringify({
  total: files.length,
  root: group(files, file => file.split('/')[0]),
  packages: group(files.filter(file => file.startsWith('packages/')), file => file.split('/')[1]),
  tests: group(files.filter(file => /\.(test|spec)\.[cm]?[jt]sx?$/.test(file)), file => file.split('/').slice(0, file.startsWith('packages/') ? 2 : 1).join('/')),
  manifests: files.filter(file => file.endsWith('package.json')),
}, null, 2));
NODE
```

Snapshot total: **6,735 tracked files**. Documentation produced during this audit is untracked and therefore does not change this count until added to the index.

| Area | Tracked files | Discovery scope |
| --- | ---: | --- |
| `packages/editor` | 3,804 | Editor source, demo, scripts, tests, design/conformance fixtures and documentation |
| `packages/dashboard` | 429 | Next application, components, email templates, browser tests/configuration |
| `packages/shared` | 41 | Manifest, TS configuration, schema barrel, 38 schema-tree files including tests |
| `server` | 190 | Auth, 33 top-level domain router source files, services and tests |
| `lib` | 42 | Prisma/tRPC clients, publish helpers, encryption, hooks, constants and tests |
| `prisma` | 59 | Schema, seed files, 55 SQL migrations and migration lock |
| `__tests__` | 92 | 91 named test files plus TS configuration |
| `scripts` | 277 | Includes 191 Figma scripts, 49 baseline artifacts/scripts, 3 audit scripts |
| `docs` | 1,596 | Product/design/planning/audit/reference material; listed, not trusted as implementation proof |
| `archive` | 101 | Historical documentation/PRD/reports; listed only |
| `.agents` | 58 | Repository skill material; listed only |
| `.github` | 3 | Three workflows, commands inspected |
| `.render`, `.superpowers` | 3, 5 | Support scripts/material; listed only |
| `src` | 3 | Separate root-level editor-named files; runtime import reachability not established |
| `types`, `video` | 2, 7 | Shared type augmentation and showcase artifacts; listed only |

Other tracked paths are root files such as the manifests/lockfile/configuration and documentation. Actual filesystem root also contains local `.next`, `node_modules`, `.pnpm-store`, `.gstack`, `.walk`, `.board-diff`, `.worktrees`, `scratchpad_audit`, `learn`, and `undefined` directories. Their presence is not evidence of additional workspaces or deployed applications.

## Workspace and build ownership

Exactly four tracked `package.json` files were found: root and three workspace packages. `pnpm-workspace.yaml:1` selects `packages/*`; there is no inventoried `apps/` workspace. Both root and dashboard manifests name themselves `@buildrik/dashboard`; use the explicit working directory when running commands.

| Owner | Source evidence | Responsibility established here |
| --- | --- | --- |
| Root package | `package.json:5`, `package.json:80` | Next commands, root Vitest, Prisma generate/push/seed, environment and smoke scripts |
| Dashboard application | `packages/dashboard/package.json:5`, `packages/dashboard/next.config.mjs:69` | Next App Router host; standalone output; editor source transpilation |
| Editor package | `packages/editor/package.json:6`, `packages/editor/src/index.ts:39` | Exports TS source and `AquibraStudio`; Vite demo, engine/chrome and local verification commands |
| Shared contracts | `packages/shared/index.ts:1`, `packages/shared/package.json:1` | Schema barrel; editor declares `@buildrik/shared` workspace dependency at `packages/editor/package.json:54` |
| Server services/API | `server/trpc/router.ts:36`, `server/auth.ts:4` | Imported into Next host; not a separately inventoried server package or standalone HTTP listener |
| Database access | `lib/prisma.ts:7`, `prisma/schema.prisma:10` | Prisma client singleton and PostgreSQL datasource |

Configuration inventory:

- Dependency graph: `pnpm-lock.yaml`, `pnpm-workspace.yaml`; `turbo.json:3` defines dev/build/test/lint tasks, including dependency builds and `.next`/`dist` outputs. Presence of Turbo configuration does not prove deployment uses Turbo.
- TypeScript: root `tsconfig.json`, `__tests__/tsconfig.json`, and `packages/{dashboard,editor,shared}/tsconfig.json`. Dashboard source aliases explicitly reach root `server`/`lib` and editor source (`packages/dashboard/tsconfig.json:25`); editor aliases reach its own source and root server/lib (`packages/editor/tsconfig.json:22`).
- Build: dashboard `next.config.mjs`, `postcss.config.mjs`, `.flowbite-react` configuration/init; editor `vite.config.ts`, `.flowbite-react` configuration/init; root `vite.config.ts` also exists and points at `./demo` (`vite.config.ts:11`), while the actual inventoried demo is `packages/editor/demo`. Do not assume root Vite commands select the editor package.
- Lint/style generation: `packages/editor/eslint.config.mjs`, custom `eslint-rules`, design-system scripts, `scripts/tokens/generate.mjs`, generated-token checking, Flowbite class-list generation, Figma conformance extraction/measurement. Editor script definitions are at `packages/editor/package.json:11`.
- No tracked Prettier configuration, Dockerfile/docker-compose, Terraform, Fly or Render deployment manifest was found by configuration filename discovery. This is a repository discovery result, not proof those systems do not exist externally.
- Environment: root `.env.example` and `.env.local.example` are tracked; local `.env*` files exist. Their secret values were not inspected. Vite reads environment from monorepo root (`packages/editor/vite.config.ts:18`). Editor `packages/editor/src/shared/utils/runtimeEnv.ts:44` bridges explicit `NEXT_PUBLIC_*` reads and Vite flags; dashboard URL selection starts at `packages/editor/src/shared/utils/runtimeEnv.ts:73`.
- Deployment: dashboard emits standalone output and traces from monorepo root (`packages/dashboard/next.config.mjs:69`), externalizes Prisma/bcrypt/DOMPurify/OpenAI (`:78`), and transpiles `@buildrik/editor` (`:79`). `vercel.json:2` declares 18 cron schedules. Actual hosting, release automation, applied migrations, scheduler registration and worker execution remain unverified.

## Production entry and demo distinction

The implementation-backed application chain is:

```text
Next dashboard application
  app/layout.tsx → providers and global styles
  /edit/[siteId] server page → auth() → userCanEditSite()
  EditorClient → dynamic import @buildrik/editor (SSR disabled)
  editor src/index.ts → AquibraStudio → shell + Composer hooks
  site ID resolved from /edit/:id, then legacy ?siteId= fallback

Vite editor demo (separate entry)
  demo/index.html → demo/main.tsx → AquibraStudio licenseKey="DEMO"
  Vite /api proxy → dashboard localhost:3000
```

Evidence:

- `packages/dashboard/app/layout.tsx:67` mounts ThemeInit; `:69` mounts tRPC, toast and global providers. `lib/trpc/client.tsx:117` sets the dashboard API URL to `/api/trpc` and `:128` mounts SessionProvider.
- `packages/dashboard/app/edit/[siteId]/page.tsx:15` calls `auth`; `:17` redirects unauthenticated requests; `:20` calls `userCanEditSite`; `:21` returns not-found when denied. `server/services/sites.service.ts:795` implements this helper and calls `checkSiteRole(..., "EDITOR")` at `:802`.
- `packages/dashboard/components/editor-route/EditorClient.tsx:8` dynamically loads the editor with `ssr: false`; `:64` keys the studio by site ID.
- `packages/editor/package.json:7` exposes `src/index.ts`; `packages/editor/src/index.ts:39` exports `AquibraStudio`. The barrel's historical introductory comment is not used as proof of package consumption.
- `packages/editor/src/services/BuildrikSyncProvider.ts:590` resolves pathname site ID before query parameter fallback. The route component does not pass a site-ID prop into AquibraStudio; the editor resolves it from location.
- `packages/editor/demo/main.tsx:42` mounts the same studio with demo license. `packages/editor/vite.config.ts:13` selects `./demo`, `:36` selects port 5050, and `:43` proxies `/api` to port 3000.
- `packages/dashboard/middleware.ts:129` matches API/auth/dashboard/onboarding paths. The `/edit` gate is established by its server page, not inferred from the middleware matcher.

Successful demo navigation would therefore not verify production auth, workspace/site permissions, database persistence or the Next bundle.

## API, authentication and persistence boundaries

### API mount and domain aggregation

The actual tRPC HTTP mount is `packages/dashboard/app/api/trpc/[trpc]/route.ts:57`, with endpoint `/api/trpc`, `appRouter`, request headers passed to `createTRPCContext`, and GET/POST exports at `:71`. POST origin handling is implemented at `:28`; OPTIONS is at `:67`. This inventory establishes locations and wiring, not security correctness.

`server/trpc/router.ts:36` aggregates 33 top-level domains: auth, dashboard, sites, siteDetail, templates, team, billing, account, help, learn, notifications, onboarding, pages, forms, upload, ai, media, apiTokens, integrations/vercel, actions, features, clients, reviews, handover, clientReview, comments, webhooks, cms, theme, siteVersions, siteComponents, userTemplates and marketplace.

37 Next API `route.ts` files were inventoried. In addition to tRPC and NextAuth, these include asset upload, session creation/logout, collaborative ops, 18 cron endpoints, Vercel authorize/callback, public form submission/tracking, share password verification, thumbnails, three SSE surfaces, upload retrieval, Stripe webhook and AI/publish worker routes. Those route bodies were not all read; router existence is not endpoint verification.

### Identity and authorization

- NextAuth route delegates GET/POST to `server/auth` (`packages/dashboard/app/api/auth/[...nextauth]/route.ts:1`); `server/auth.ts:4` initializes NextAuth with `authConfig`.
- Config declares Google and GitHub providers at `server/auth.config.ts:31`, JWT session strategy at `:41`, and JWT/session callbacks at `:121`/`:204`. Workspace and session-version logic exists; complete auth behavior was not audited.
- `server/trpc/trpc.ts:16` builds context from `auth()` and optional bearer verification. The effective session selection is at `:52`.
- `protectedProcedure` requires a session and rejects bearer use (`server/trpc/trpc.ts:105`); `scopedProcedure` checks a named scope (`:127`). Site/workspace authorization is an additional domain boundary, not established merely by these base procedures.
- `server/trpc/routers/sites.ts:268` validates the editor save schema, checks EDITOR permission at `:273`, then invokes the save service at `:280`.

### Editor save/load path

```text
useComposerInit / useSaveCallback
  site ID present → BuildrikSyncProvider → credentialed tRPC client
    /api/trpc → sites.saveProject → role check → saveProjectFromEditor
      saveProjectData → Prisma transaction → Page and Site records
  no site ID → Composer save/load → StorageAdapter dispatch
```

- Startup loads remote project when a site ID exists (`packages/editor/src/editor/shell/hooks/useComposerInit.ts:150`, `:186`); no-site branch loads engine storage at `:345`. Autosave uses the same remote/local choice at `:524`.
- Manual save selects remote `saveProject(siteId, composer.exportProject())` or `composer.saveProject()` at `packages/editor/src/editor/shell/hooks/useSaveCallback.ts:116`.
- `packages/editor/src/services/api-client.ts:20` creates the typed client; `:24` sets `${baseUrl}/api/trpc`, `:30` sends credentials. `AppRouter` is a type-only import at `:18`.
- `packages/editor/src/services/BuildrikSyncProvider.ts:298` loads `sites.get`, `pages.list`, and site settings; `:398` saves the project and separately mirrors site-column settings. `:402` checks that the site was loaded; `:411` sends the project and baseline edit timestamp.
- `server/services/sites.service.ts:489` maps the editor snapshot to canonical save input and invokes `saveProjectData` at `:535`. `:594` checks site existence, `:603` compares an optional edit timestamp, `:612` enters a transaction, `:638` deletes omitted pages when applicable, `:689` upserts pages, and `:736` persists project settings alongside styles/assets and `lastEditedAt`. This is a traced write path, not verification of concurrency/transaction semantics.
- `packages/editor/src/engine/storage/StorageAdapter.ts:80` and `:111` dispatch local/session/IndexedDB/remote/none/custom load and save behavior. A storage adapter supporting a mode does not establish that mode is selected in every editor entry.

71 Prisma models were counted from `^model ` declarations; 55 migration SQL files were inventoried. Domain groups include identity/workspaces, sites/pages/domains, CMS, media/folders/versions, comments/reviews, billing, notifications/activity, analytics/forms, AI jobs/usage, templates/components/theme snapshots, publishing/scheduling, integrations/tokens/webhooks and collaboration. Representative persistence definitions: `prisma/schema.prisma:319` Site, `:580` Page, `:1025` MediaAsset, `:1127` SiteVersion, `:1193` AIGenerationJob, `:1395` PublishBuildJob and `:1515` CollabOperation. Migration application and production schema parity remain unverified.

## Source-area coverage map

Editor source tracked-path counts: `editor` 1,408; `engine` 327; `shared` 260; `blocks` 85; `assets` 78; `services` 47; `themes` 24; `templates` 6; `styles` 3; plus entry, setup, stub, declarations, two source-root tests and one tracked hidden support file. Counts include tests/assets and are not counts of production modules.

Dashboard `app` tracked-path inventory includes `api` 42, `auth` 34, `dashboard` 58, `onboarding` 15, `edit` 3, `review` 5 and `share` 3, plus root pages/layout/styles and maintenance/privacy/terms/transfer/dev. API count here includes tests; the API route-file count above is 37. Components and emails are inventoried as separate domains; individual feature ownership needs later UI-to-handler traces.

73 non-test files under `server/services` were inventoried, including service modules and helpers/clients. All major domain names were discovered before selecting the sites persistence trace. No blanket claim that every router uses only services is made; actual boundary compliance is a later engineering audit.

The separate root `src` holds `editor/sidebar/tabs/settings/screens/ExportScreen.tsx`, `editor/wizard/PageWizard.tsx`, and `editor/wizard/sectionData.ts`. They are recorded as unclassified until import reachability is checked; they must not be conflated with the similarly named active editor package paths.

## Tests, checks and CI inventory

**1,165 tracked files** match `\.(test|spec)\.[cm]?[jt]sx?$`: editor 926, dashboard 54, server 76, root `__tests__` 91, lib 14, shared 4. This mixes unit/integration/browser/script tests, excludes test files with other naming conventions, and says nothing about test-case totals or pass rates.

| Check | Command and working directory | Scope and prerequisites |
| --- | --- | --- |
| Targeted editor unit tests | `npx vitest run <test-path>` in `packages/editor` | Installed dependencies; jsdom/setup; can target a behavior without full infrastructure when mocked |
| Editor-config suite | `npm test` in `packages/editor` | Also includes dashboard and server test globs; not editor-only |
| Root-config suite | `pnpm vitest run` at repo root | Includes root/lib/editor/shared/server/dashboard sources; distinct aliases/config from editor |
| Type check | `npm run typecheck` in editor | `tsc --noEmit`; package includes source/demo/e2e and root type augmentations |
| Editor build | `npm run build` in editor | Runs `tsc && vite build`; CI's `npx vite build` is a different command |
| Coverage | `npm run test:coverage` in editor | V8 reports for editor `src/**/*.{ts,tsx}`, excluding tests/declarations/preview/stubs |
| Design/lint gates | `npm run verify:ds`, `npm run lint` in editor | Several commands/baselines, including pnpm subcommands; these were inventoried, not executed |
| Editor browser parity | `npm run test:parity` in editor | Local Chromium, Vite package-root probe on port 5051; config guards BrowserStack environment |
| Figma conformance | `node scripts/conformance/measure.mjs --all`, then `diff.mjs --all` in editor | Requires demo/probe servers and existing specs; extracting new specs has separate tooling prerequisites |
| Dashboard browser smoke | `pnpm exec playwright test --project=chromium e2e/dashboard.spec.ts` in dashboard | Next app, Chromium, database/auth fixture; browser setup can mutate fixture data |

Scope evidence: `packages/editor/vitest.config.ts:14` includes editor/scripts plus dashboard/server tests; `:41` configures V8 coverage with no configured percentage threshold. Root globs are at `vitest.config.ts:17`. Editor browser config starts package-root Vite at `packages/editor/playwright.config.ts:70`; dashboard browser config starts `pnpm dev` at `packages/dashboard/playwright.config.ts:50` and has auth fixture dependencies. Browser tests are not interchangeable with isolated unit tests.

CI files and implementation observed:

- `.github/workflows/editor-ci.yml:112`: editor Vite build, DS gates, blocking ESLint, editor and root Vitest. Separate browser job at `:199`, parity at `:236`, target-size test at `:247`, conformance at `:273`. Uses Node 22/pnpm 9. Workflow presence does not establish its latest result.
- `.github/workflows/dashboard-tests.yml:29`: root Vitest with Prisma generation; separate PostgreSQL 16 smoke service at `:59`; migrate/seed at `:96`; dashboard smoke at `:106`. Uses Node 22/pnpm 10.
- `.github/workflows/editor-dashboard-build.yml:14`: Next dashboard build; Prisma generation marked `continue-on-error` at `:36`; editor feature environment set at `:42`. Uses Node 22/pnpm 10.

The inventory does not certify branch-protection enforcement, latest CI status, browser installation, database reachability, coverage percentage, cloud credentials, production worker/cron execution, or end-to-end application health. Those remain explicit verification work for the appropriate playbook phases.

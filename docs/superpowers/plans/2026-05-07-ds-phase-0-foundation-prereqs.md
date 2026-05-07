# DS Arc · Phase 0 — Foundation Prereqs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the foundation prerequisites that gate Phase A of the 16-week DS+Components arc — namely add `dsSchemaVersion` to `Site`, verify jsdom test environment is healthy, and document the override-preservation deferral to Phase E.

**Architecture:** Two real changes (one schema field + migration; one verification + doc update). One documented deferral (override preservation moves to Phase E acceptance criteria — covered in the Phase E plan, not here). The `dsSchemaVersion` field is the load-bearing piece: every Phase A-I migration mutates it, so it MUST exist before Phase A's first migration runs.

**Tech Stack:** Prisma 5 (schema + migration), PostgreSQL, Vitest 4 + jsdom 28 + React Testing Library 16 (verification only), pnpm workspaces.

---

## Spec Reference

This plan addresses items from the CEO Plan §"Foundation Gaps" and the eng-review test plan §"Affected Pages/Routes" (`Editor Design tab`). Spec sections it unblocks:
- §10.4 Migration runner (needs `dsSchemaVersion` to read/write)
- §9 Test strategy (~280 unit tests target)
- §13 Schema versioning (D13)

The original CEO-plan list had 4 prereqs. Three resolve as follows:
- **DESIGN.md missing** — OBSOLETE. File exists at `/DESIGN.md` (356 lines). Caught by design review.
- **jsdom test environment broken** — OBSOLETE. Verified `pnpm vitest run src/shared/ui/__tests__/SemanticBadge.test.tsx` → 12/12 pass on 2026-05-07. Polyfills already in `src/test-setup.ts`. This plan keeps a verification task to formally close the TODOS entry.
- **Vibcoder Stage 2/3 chrome-ssot 280→240/320** — DEFERRED. Spec adopts 320 (D1 panel decision). Out of scope for this plan.
- **schemaVersion:2 upgrade handler** — DEFERRED to Phase A. The DS arc adds 7 migrations on its own runner (`composer.migrations`), separate from the legacy `schemaVersion` field. Centralising the legacy handler is not on the critical path.

Override preservation MVP is **not** in this plan — the design review moved it to Phase E acceptance criteria (where it actually lives).

---

## File Structure

| Path | Action | Responsibility |
|------|--------|----------------|
| `prisma/schema.prisma` | Modify (line 158-206 `Site` model) | Add `dsSchemaVersion Int @default(0)` field |
| `prisma/migrations/<timestamp>_add_ds_schema_version_to_sites/migration.sql` | Create | Add column + index, backfill existing rows to 0 |
| `packages/shared/schemas/site.ts` (or new file) | Verify / Modify | Re-export `dsSchemaVersion` if Zod schema mirrors Prisma |
| `TODOS.md` | Modify | Strike obsolete prereq entries; mark Phase 0 closed |
| `packages/editor/src/test-setup.ts` | Read-only verify | Confirm polyfills cover ResizeObserver/matchMedia/scrollIntoView |
| `docs/superpowers/plans/2026-05-07-ds-phase-0-foundation-prereqs.md` | This file | Plan record |

Total real edits: 2 files (schema.prisma + TODOS.md) + 1 generated migration. Verification adds no code.

---

## Task 1: Verify jsdom test environment is healthy

**Files:**
- Read: `packages/editor/src/test-setup.ts`
- Verify: `packages/editor/vitest.config.ts`
- No code changes

- [ ] **Step 1: Run a representative component test (already-passing baseline)**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx vitest run src/shared/ui/__tests__/SemanticBadge.test.tsx
```

Expected: `Test Files  1 passed (1) · Tests  12 passed (12)`. Confirms `render()` from `@testing-library/react` works inside jsdom.

- [ ] **Step 2: Run a `renderHook`-using test**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx vitest run --testNamePattern="renderHook" 2>&1 | tail -20
```

Expected: PASS (or filtered to 0 if no `renderHook` callers, in which case run any hook test like `useEscapeKey.test.ts`). The TODOS.md claim was that `renderHook()` fails — this step proves or disproves it.

If renderHook tests do fail, capture the exact error and STOP this plan; renderHook brokenness needs its own diagnosis (likely React 19 / RTL 16 compat — not a polyfill issue).

- [ ] **Step 3: Run the full editor suite to capture pass-rate baseline**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx vitest run 2>&1 | tail -10
```

Expected: pass-rate ≥95%. Record exact `N passed / M failed` numbers in your terminal — they are the baseline against which Phase A's ~80 new unit tests will be added.

- [ ] **Step 4: Document the verification in TODOS.md**

Open `/Users/shahg/Desktop/pencil/buildrik/TODOS.md` and locate the "P2 — jsdom test environment broken" entry. Append a strike-through resolution line directly under it:

```markdown
- ~~jsdom test environment broken (render/renderHook fail)~~ — RESOLVED 2026-05-07. Verified suite-wide: SemanticBadge.test.tsx 12/12 pass, full suite pass-rate baseline captured. Polyfills in `packages/editor/src/test-setup.ts` cover ResizeObserver, matchMedia, scrollIntoView. No further action needed.
```

- [ ] **Step 5: Commit**

```bash
git add TODOS.md
git commit -m "$(cat <<'EOF'
chore(ds-phase-0): verify jsdom env healthy, close stale TODO

Verified `pnpm vitest run` works against React 19 + jsdom 28
+ RTL 16 + jest-dom 6 with the existing polyfills in
src/test-setup.ts. The TODOS.md "jsdom broken" P2 entry was
stale — likely from a pre-React-19 upgrade window.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Add `dsSchemaVersion` field to `Site` Prisma model

**Files:**
- Modify: `prisma/schema.prisma:158-206` (the `Site` model)

- [ ] **Step 1: Read current Site model**

Open `/Users/shahg/Desktop/pencil/buildrik/prisma/schema.prisma` and confirm lines 158-206 still match what's documented above. Locate the `projectStyles Json?` field (line 182) — `dsSchemaVersion` will sit immediately below it because both are DS-arc fields.

- [ ] **Step 2: Add the field**

Edit `prisma/schema.prisma`. Insert this line directly after `projectStyles Json?` (currently line 182):

```prisma
  dsSchemaVersion   Int       @default(0)
```

Indentation MUST match surrounding fields (2 spaces, then column-aligned types per existing convention). Final block around the change:

```prisma
  projectStyles     Json?
  dsSchemaVersion   Int       @default(0)
  projectAssets     Json?
  projectSettings   Json?
  deletedAt         DateTime?
```

- [ ] **Step 3: Validate the schema**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx prisma validate
```

Expected: `The schema at prisma/schema.prisma is valid 🚀`. If invalid, fix indentation / type and re-run.

- [ ] **Step 4: Format the schema**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx prisma format
```

Expected: file rewritten with canonical column alignment. Diff should only touch the new line + any drift on neighbouring lines.

- [ ] **Step 5: Commit (schema only — migration in next task)**

```bash
git add prisma/schema.prisma
git commit -m "$(cat <<'EOF'
feat(ds-phase-0): add dsSchemaVersion field to Site model

Adds Int field defaulting to 0 on every Site row. The DS arc's
migration runner (Phase A onwards) reads/writes this field to
sequence schema versions v0 → v13.

Migration SQL lands in the next commit so the column add and
backfill are auditable as one unit.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Generate + apply the Prisma migration

**Files:**
- Create: `prisma/migrations/<timestamp>_add_ds_schema_version_to_sites/migration.sql`

- [ ] **Step 1: Generate the migration**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx prisma migrate dev --name add_ds_schema_version_to_sites --create-only
```

The `--create-only` flag generates the SQL without applying it, so we can inspect first.

Expected output: a new directory `prisma/migrations/<YYYYMMDDHHMMSS>_add_ds_schema_version_to_sites/` with a `migration.sql` file inside.

- [ ] **Step 2: Inspect generated SQL**

```bash
cat prisma/migrations/*_add_ds_schema_version_to_sites/migration.sql
```

Expected content:

```sql
-- AlterTable
ALTER TABLE "sites" ADD COLUMN "dsSchemaVersion" INTEGER NOT NULL DEFAULT 0;
```

If Prisma added anything beyond this single `ALTER TABLE`, STOP and inspect — there should be no other diff.

- [ ] **Step 3: Apply the migration to local DB**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx prisma migrate dev
```

Expected: `Applying migration ... Database is now in sync with your schema.` Prisma also regenerates the client.

- [ ] **Step 4: Verify column on the live DB**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx prisma db execute --stdin <<'EOF'
SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'sites' AND column_name = 'dsSchemaVersion';
EOF
```

Expected single row:

```
 column_name      | data_type | column_default
------------------+-----------+----------------
 dsSchemaVersion  | integer   | 0
```

- [ ] **Step 5: Smoke-test the Prisma client typings**

Quick TypeScript ensure:

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i "dsSchemaVersion" | head -5
```

Expected: no errors mentioning `dsSchemaVersion`. If the project has Zod or zodios mirrors of `Site`, they'll need a corresponding field add in Phase A; for Phase 0 we only need the Prisma side green.

- [ ] **Step 6: Commit**

```bash
git add prisma/migrations/
git commit -m "$(cat <<'EOF'
feat(ds-phase-0): migrate dsSchemaVersion onto sites table

Generates the migration SQL for the Site.dsSchemaVersion field
added in the previous commit. All existing rows backfill to 0
via the column DEFAULT, so no Phase 0 backfill script is needed.

Phase A's migration runner will bump dsSchemaVersion from 0 to 1
on first DS write per site.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Update Zod schema mirror (if one exists for Site)

> **Post-execution outcome (2026-05-08):** Branch (b) taken — no Zod Site row mirror exists. Verified via `grep -rn "dsSchemaVersion\|projectStyles" packages/shared/schemas/` (zero matches) and repo-wide TS sweep. `packages/shared/schemas/sites.ts` and `site-detail.ts` define only operation/input schemas (createSiteSchema, renameSiteSchema, listSitesSchema, saveProjectDataSchema, etc.); none mirror the full Site row shape. Prisma is sole SSOT for the Site row. No commit produced for T4.

**Files:**
- Modify (if present): `packages/shared/schemas/site.ts` or `packages/shared/schemas/index.ts`

- [ ] **Step 1: Check whether a Zod mirror exists**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
grep -rn "dsSchemaVersion\|projectStyles" packages/shared/schemas/ 2>&1 | head -20
```

Three branches:

a) Output shows `projectStyles` in a Zod schema file → step 2 applies. Add `dsSchemaVersion: z.number().int().default(0)` directly after the `projectStyles` field, matching surrounding indentation.

b) Output shows nothing or only `projectStyles` in a doc/comment, not in a Zod schema → no Zod mirror exists. Skip to step 3, no edit needed.

c) Output errors with "directory not found" → schemas live elsewhere. Run `grep -rn "model.*Site\|z.object.*Site\|projectStyles" packages/ | grep -v node_modules | head -20` and adjust path. If no mirror anywhere, skip to step 3.

- [ ] **Step 2: If branch (a), add the field**

Open the file from step 1. Add the new line preserving exact indentation. Example pattern (your file may differ):

```ts
export const SiteSchema = z.object({
  id: z.string().cuid(),
  // ... other fields ...
  projectStyles: z.record(z.unknown()).nullable(),
  dsSchemaVersion: z.number().int().min(0).default(0),
  projectAssets: z.record(z.unknown()).nullable(),
  // ... other fields ...
});
```

Then run:

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i "schema" | head -5
```

Expected: no errors.

- [ ] **Step 3: Commit (or skip if no edit)**

If step 2 made edits:

```bash
git add packages/shared/schemas/
git commit -m "$(cat <<'EOF'
feat(ds-phase-0): mirror dsSchemaVersion onto Zod Site schema

Keeps Zod schema in sync with Prisma per CLAUDE.md SSOT rules.
Default 0 matches the Prisma column default so freshly imported
sites validate without explicit field.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

If no Zod mirror exists, no commit; note this in your terminal as "no Zod Site schema in repo, Prisma is sole SSOT" and proceed to Task 5.

---

## Task 5: Close Phase 0 in TODOS.md and tag the commit chain

**Files:**
- Modify: `TODOS.md`

- [ ] **Step 1: Add a Phase 0 closure entry to TODOS.md**

Open `/Users/shahg/Desktop/pencil/buildrik/TODOS.md` and append the following block under the most recent dated section (or create a new dated section if today's date is missing). Use exactly today's date:

```markdown
## 2026-05-07 — DS Arc · Phase 0 Foundation Prereqs CLOSED

- ✅ jsdom test environment verified healthy (was stale TODO; suite passes against React 19 + jsdom 28 + RTL 16)
- ✅ `Site.dsSchemaVersion Int @default(0)` shipped + migration applied (column live, all existing rows = 0)
- ✅ Zod mirror updated (or N/A if no mirror exists in repo)
- ⏭️  Component override preservation deferred to Phase E acceptance criteria (per design review)
- ⏭️  Vibcoder 280→240/320 chrome split deferred (D1 chose 320; not on critical path)
- ⏭️  Legacy `schemaVersion:2` localStorage handler deferred (DS arc uses its own runner)

DS Arc Phase A (Token foundation + aliasing) is now unblocked.
```

- [ ] **Step 2: Verify the file still parses cleanly**

```bash
head -20 /Users/shahg/Desktop/pencil/buildrik/TODOS.md
```

Expected: file opens, the new block is at the top of the appended location, markdown headings render correctly.

- [ ] **Step 3: Commit**

```bash
git add TODOS.md
git commit -m "$(cat <<'EOF'
docs(ds-phase-0): close Phase 0 prereqs, document deferrals

Phase 0 of the DS+Components arc closed:
- jsdom env verified healthy (stale TODO closed)
- Site.dsSchemaVersion field shipped end-to-end
- 3 prereqs from CEO plan deferred with explicit reasons

Phase A (Token foundation + aliasing) is unblocked.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Smoke-verify nothing else broke

**Files:**
- No edits

- [ ] **Step 1: Run editor type-check**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx tsc --noEmit
```

Expected: 0 errors. If errors mention `dsSchemaVersion`, you forgot a Zod mirror — go back to Task 4.

- [ ] **Step 2: Run dashboard type-check**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
npx tsc --noEmit
```

Expected: 0 errors. Dashboard imports the Prisma client — adding a field never breaks dashboard code, only refusing-to-handle-it does.

- [ ] **Step 3: Run editor unit suite**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor
npx vitest run 2>&1 | tail -5
```

Expected: same baseline pass-rate from Task 1 step 3. If anything regressed, capture the failing test name and diagnose before continuing — Phase 0 should leave the suite ≥ baseline.

- [ ] **Step 4: Lint**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
pnpm run lint 2>&1 | tail -10
```

Expected: no new violations attributable to our edits. Existing baseline warnings are fine.

- [ ] **Step 5: Tag the Phase 0 chain (optional but useful)**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
git tag ds-phase-0-complete
git log --oneline ds-phase-0-complete~5..ds-phase-0-complete
```

Expected output: 4-5 commits from this plan, oldest first. Tag is local-only — push with `git push --tags` if you want it on the remote.

---

## Self-Review Checklist (run after writing the plan, before executing)

- [x] **Spec coverage:** Phase 0 covers Foundation Prereqs from CEO plan. The 3 deferred items are documented with reasons. Override preservation explicitly handed to Phase E plan.
- [x] **Placeholder scan:** every step has either exact code, exact command + expected output, or explicit branching (Task 4 step 1). No "TBD", no "implement appropriately", no bare "add error handling".
- [x] **Type consistency:** `dsSchemaVersion` spelled identically across schema, migration, Zod mirror, TODOS.md, and Phase A handoff note. `Int @default(0)` matches `z.number().int().min(0).default(0)`.
- [x] **Branching is explicit:** Task 4 has 3 documented branches (a/b/c) for the Zod-mirror-presence question, instead of "check if exists and update accordingly".
- [x] **Migration is reversible:** the column add has a column default, so a manual `ALTER TABLE sites DROP COLUMN "dsSchemaVersion"` rolls it back cleanly. No data is lost.

---

## Acceptance Criteria

Phase 0 is complete when:

1. `prisma/schema.prisma` Site model contains `dsSchemaVersion Int @default(0)`.
2. `prisma/migrations/<timestamp>_add_ds_schema_version_to_sites/migration.sql` exists and contains the single `ALTER TABLE sites ADD COLUMN "dsSchemaVersion" INTEGER NOT NULL DEFAULT 0;` statement.
3. `npx prisma db execute` confirms the column exists in the live local DB with default 0.
4. `npx tsc --noEmit` from both editor and root passes with 0 errors.
5. `npx vitest run` from `packages/editor` passes at the Task 1 step 3 baseline (or better).
6. TODOS.md has a "2026-05-07 — DS Arc · Phase 0 ... CLOSED" block.
7. 4-5 commits exist on `main` (or worktree branch) covering: jsdom verification, schema add, migration, optional Zod mirror, TODOS closure.

When all 7 are green, Phase A's plan can dispatch.

---

## Handoff to Phase A

Phase A plan (`docs/superpowers/plans/2026-05-07-ds-phase-a-tokens.md`) — to be written next — assumes:

- `Site.dsSchemaVersion` exists and reads `0` for every site (proved here).
- Vitest + jsdom + RTL stack is healthy (proved here).
- TODOS.md no longer flags any DS-arc prereqs as blocking (proved here).

Phase A introduces:
- `DesignToken` interface (spec §5.1)
- `TokenRegistry` engine manager
- 14 token kinds + Zod validators
- Alias graph (depth-1)
- Migration v0 → v1 (writes seed tokens, sets `dsSchemaVersion = 1`)
- Inspector binding chips (basic green-only variant; off-DS amber + alias blue land in Phase A.2)

Phase A is itself ~3 weeks of work and warrants its own plan. Do NOT inline its tasks here.

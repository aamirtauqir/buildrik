# Codebase Cleanup Design

**Date:** 2026-04-01  
**Scope:** Main buildrik root only — `editor/` untouched

---

## Goal

Remove non-code clutter from the root of the buildrik repo. Move stale docs/reports to a structured `archive/`, scripts to `scripts/`, and delete generated artifacts (screenshots, build output).

---

## New Folder Structure

```
buildrik/
  archive/
    prd/        ← product spec pages (75+), fully implemented
    reports/    ← code review reports, audits, analysis
    docs/       ← stale one-off docs, ux audits, debug notes
  scripts/      ← Python automation scripts (one-off tooling)
  [all source code unchanged]
```

---

## File Actions

### Move to `archive/prd/`
- `prd/` (entire folder — 75+ product spec pages, all implemented)

### Move to `archive/reports/`
- `code_review_report.md`
- `code_review_report_v2.md`
- `code_review_report_v2.1.md`
- `code_review_report_v2.2.md`
- `codebase_analysis.md`
- `AUDIT.md`
- `REVIEW.md`
- `prd-analysis.json`

### Move to `archive/docs/`
- `issue.md`
- `systematic-debugging yeah error a raha h.md`
- `baseline-load.png`
- `A 3D rendering of an anthropomorphic lig.sty`
- `Untitled-4.sty`
- `docs/cleanup-prompt.md`
- `docs/runtime-verification/` (phase1 checklist)
- `docs/ux-audit-analytics.md`
- `docs/editor-system-prompt.md`

### Move to `scripts/`
- All 20 Python scripts from root:
  - `capture_screenshots.py` and all variants (15 files)
  - `finalize_manifest.py`
  - `fix_errors.py`, `fix_errors_2.py`
  - `migrate.py`

### Delete
- `latest-screenshots/` — 340 generated PNG files, not for git
- `dist/` — compiled build output, not for git

### Untouched
- `CLAUDE.md`, `app/`, `components/`, `server/`, `lib/`, `emails/`, `prisma/`, `__tests__/`, `types/`, `src/`
- `middleware.ts`, all config files (`next.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `vite.config.ts`, `postcss.config.mjs`, `vercel.json`, `package.json`, `package-lock.json`)
- `.env`, `.env.example`, `.env.local`, `.env.local.example`
- `docs/designs/`, `docs/plans/` — active design specs and plans
- `editor/` — separate sub-project, not in scope
- `.gstack/`, `.playwright-mcp/` — hidden tooling folders

---

## What Does NOT Change

- No source code is touched
- No imports, references, or configs are affected
- `.gitignore` may need `dist/` and `latest-screenshots/` added to prevent re-generation

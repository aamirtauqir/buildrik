#!/usr/bin/env bash
# The repo's checks. Exit 0 only when the branch is fit to review.
#
# The gate runs this script from the main checkout with the job's worktree as
# the working directory. Keep it fast, deterministic and non-interactive: no
# watch modes, no prompts, nothing that rewrites files.
#
# Mirrors the CI jobs that decide a merge (editor-ci.yml, dashboard-tests.yml):
# install, Prisma client, ESLint, the tsc error baseline, the root vitest run
# (which includes the editor). DB tests, Playwright and `next build` stay in CI.
# The full vitest run is the slow step (~14 min on CI).
set -euo pipefail

wt="$(pwd)"
main="$(cd "$(git rev-parse --git-common-dir)/.." && pwd)"

# Env files are gitignored, so a fresh worktree has none. Reuse the main
# checkout's. Never commit them.
[ -f "$wt/.env.local" ] || { [ -f "$main/.env.local" ] && cp "$main/.env.local" "$wt/.env.local"; }
[ -f "$wt/packages/dashboard/.env" ] || { [ -f "$main/packages/dashboard/.env" ] && cp "$main/packages/dashboard/.env" "$wt/packages/dashboard/.env"; }

echo "▶ install"
pnpm install --frozen-lockfile --prefer-offline --reporter=silent

echo "▶ prisma generate"
pnpm db:generate

echo "▶ lint"
pnpm lint

echo "▶ tsc baseline (editor + dashboard)"
pnpm --filter @buildrik/editor run gate:tsc

echo "▶ vitest"
pnpm test

echo "✓ factory/checks.sh: all checks passed"

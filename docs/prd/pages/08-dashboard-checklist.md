# Dashboard Activation Checklist

> **Route:** `/dashboard` (floating card) — final onboarding stage
> **Source:** `components/.../dashboard-checklist.tsx` · `onboarding.service.ts` completeDashboardTask/dismiss

## Overview
After the first site exists, onboarding continues as a dismissible checklist on the dashboard. Completing all tasks — or dismissing — ends onboarding. Rendered only while `!completed && !dismissed`.

## Tasks

**Full variant — 7 tasks (all required for auto-complete):**
1. Add a text block
2. Upload an image
3. Change the site name
4. Add a second page
5. Preview the site
6. Invite a team member
7. Publish the site

(The 8th defined task id, `edit-page`, belongs to the invited variant only.)

**Invited variant — 3 tasks:** edit page, preview site, invite team member.
⚠ Currently orphaned: the dashboard mounts the checklist without a `variant` prop, so invited members also see the 7-task owner list (gaps register).

## Interactions
- Task done → `onboarding.completeDashboardTask {taskId}` (enum-validated, 8 ids) → appended to `dashboardTasks`; progress shows `n/7` + percent bar.
- All 7 full tasks → `step=COMPLETED, completed=true` — checklist disappears for good.
- Dismiss (X) → `onboarding.dismiss` → `dismissed=true` — same effect, without completion. Invited users are *expected* to finish via dismiss (only the full 7 auto-complete).

## Business rules
- Completion state is per-user (`OnboardingState`), not per-workspace.
- No resume-cap or snooze logic exists (v3 spec's "resume ≤1, never re-show after 2 skips" is unimplemented).

## Page relationships
- **In:** read-repair jump from SITE_CREATION once a live site exists.
- **Out:** none — terminal stage.

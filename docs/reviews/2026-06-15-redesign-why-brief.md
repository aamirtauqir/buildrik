# Redesign — the WHY (founder interview, 2026-06-15)

Captured from a structured interview with the founder. This is the north star the wireframes + rebuild must serve. Supersedes the implicit beginner-first assumption of the earlier wireframe arc.

## One-line why
Pro/agency users (who pay + gave feedback) keep getting lost because **the same thing lives in too many places**; the product + code are tangled so features can't ship cleanly. Redesign to give every thing **one home**, serve the **agency workflow**, and lock the design as a **contract for a clean rebuild**.

## Answers (verbatim intent)
- **Trigger:** can't ship features cleanly (IA + code fight back).
- **Audience:** **Pro / agency** — the payers. (Flips the beginner-first lean.)
- **Evidence:** direct feedback from users/friends.
- **Success metric:** fewer "how do I / where is X" moments — people stop getting lost.
- **The complaint (worst dups):**
  1. **Editor ↔ Dashboard** — SEO/settings/domains reachable from both; no clear home.
  2. **Settings scattered** — site vs workspace vs account overlap.
  3. **Styling: 3+ ways** — element style vs class vs token vs preset.
- **Mess location:** both product (screens/IA) AND code (architecture), tangled.
- **What Pro/agency need (weak today):** reuse across sites · multi-client management · white-label · faster repetitive workflow · flexible/fast tool.
- **Sequencing:** **lock design → then rebuild** code to match. Design is the contract.

## Strategic implications
1. **Re-weight Pro-first.** Keep progressive disclosure so beginners aren't shut out, but the **Pro surface must be excellent** and is the priority. The paying agency is the design center, not the first-time hobbyist.
2. **Dedup is the core job, not a side-fix.** "One home for every thing" is THE success lever (fewer "how do I"). Three explicit consolidations required:
   - Editor↔Dashboard boundary (started: §3 + boundary wireframes) — finish + prove.
   - Settings consolidation — a single settings model: what is site- vs workspace- vs account-scoped, stated once, never duplicated.
   - Styling model — collapse/clarify the overlap (element → class → component → token → preset) into one legible ladder (the §6.5 scope work is the seed; extend to a single "how do I change how this looks" story).
3. **Agency capabilities are the missing wireframe layer** (beginner set is ~done):
   - Cross-site **shared design system + component/template library** (build once, reuse across client sites).
   - **Multi-client management** (many workspaces/sites, handoff, per-client access, agency dashboard).
   - **White-label** (remove Buildrik branding, agency domain on editor/share/published).
   - **Speed** (keyboard-first, bulk, duplication, fewer clicks — power workflow).
4. **Design-as-contract.** Finish wireframes → tight spec → THEN rebuild. No code until the design is locked. This is also the answer to "can't ship cleanly": a stable contract stops the decision-churn.

## Next moves (proposed)
- Close the **agency/Pro wireframe gap**: shared-DS-library, multi-client dashboard, white-label settings, power-speed affordances.
- Add explicit **dedup wireframes**: a single settings map + a single "change how this looks" model — show there is ONE home for each.
- Then: turn the locked wireframes into a build spec, Pro-first.

## Validation — PASSED (2026-06-15)
- **Signal size: 5+ agencies** gave the "too many places" feedback independently → real pattern, not one taste.
- **Revenue: paying now.** Real money on the table → redesign protects + grows revenue, not a pre-PMF guess.
- **Killer feature: all of them** (reuse + white-label + multi-client + speed) → agencies want the full power tool.
- **Switch trigger: yes, a specific ask exists** (the exact thing that would make someone move off Webflow/Framer → Buildrik). **← capture verbatim; this is the wedge + decides build order.**

**Verdict: commit Pro/agency-first.** The bet is de-risked — paying agencies, 5+ consistent voices, a named switch trigger. Proceed to close the agency + dedup wireframe gaps, then a Pro-first build spec.

## Sequencing input still needed
- The **exact switch-ask** (verbatim) — sets which agency feature ships first.

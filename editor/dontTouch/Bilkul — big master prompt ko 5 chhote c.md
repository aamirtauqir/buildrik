Bilkul — big master prompt ko 5 chhote controlled phase prompts mein tod dena zyada sahi hai.
Is se Claude Code ko compliance easy hogi aur aap loop mein kam phasoge.

Phase 1 — sirf Gap Map
Use `today_final.md` as a CURRENT-STATE AUDIT REPORT, not as a final PRD.

Do not summarize the whole file.
Do not give me a screenshot-style UI audit.
Do not give me redesign concepts.
Do not give me themes.
Do not write a PRD yet.

Your task right now is only this:

Create an **Audit-to-Redesign Gap Map** from `today_final.md`.

I want you to identify:

A. Capabilities discovered in the audit but not yet fully represented in a target redesign
B. Capabilities marked or implied as must-preserve but not yet operationalized in UX/UI
C. Whole-editor areas that are underdesigned
D. Interaction / state / accessibility gaps
E. Implementation / handoff gaps
F. Anti-regression risks

You must explicitly check coverage for:
- CMS
- collaboration
- AI surfaces
- version history
- export / publish
- command palette
- shortcuts
- canvas overlays
- multi-select
- marquee select
- drag/drop
- breakpoints
- pseudo states
- advanced inspector controls
- context menus
- templates / components / media / settings / history surfaces

Output format:
1. Capability or surface
2. Found in audit
3. Missing or weak in redesign direction
4. Why it matters
5. Downgrade risk
6. Recommended PRD section that must cover it

Only output:
**A. Audit-to-Redesign Gap Map**

Stop after section A.
Phase 2 — sirf Target-State PRD
Now use:
- `today_final.md`
- the Audit-to-Redesign Gap Map you just created

Do not summarize.
Do not rewrite the audit.
Do not generate themes.
Do not jump to Stitch yet.

Your task right now is only this:

Create a **Target-State PRD** for the editor.

Important:
- `today_final.md` is a current-state audit, not a final PRD
- preserve advanced existing capability
- do not simplify the product
- do not redesign only the shell
- the PRD must cover the whole editor

Structure the PRD exactly like this:

1. Product and redesign goal
2. Target users
3. Core UX principles
4. Core redesign principle
5. Must-preserve capability contract
6. Whole-editor information architecture
7. Top bar architecture
8. Left rail taxonomy
9. Left panel system
10. Canvas-first interaction model
11. Right properties panel model
12. CMS surfaces
13. Collaboration surfaces
14. AI surfaces
15. Version history surfaces
16. Export and publish surfaces
17. Command palette and advanced action surfaces
18. Core workflows
19. Full interaction and state model
20. Accessibility and keyboard model
21. Selection model
22. Typography system
23. Color / surface / border / shadow system
24. Motion principles
25. Microcopy and trust rules
26. Default Buildrick canvas content spec
27. Engineering handoff rules
28. Success metrics
29. Supported / fallback / unsupported behavior
30. Anti-regression notes

Important:
If a capability from the audit is not represented here, explicitly mark that as unresolved.

Only output:
**B. Target-State PRD**

Stop after section B.
Phase 3 — sirf Whole-Editor Coverage Check
Now compare:
- `today_final.md`
- the Audit-to-Redesign Gap Map
- the Target-State PRD

Do not redesign anything new.
Do not summarize generally.
Do not give concepts.

Your task right now is only this:

Create a **Whole-Editor Coverage Check**.

Make a strict table with these columns:
1. Capability / surface
2. Found in current audit?
3. Represented in target-state PRD?
4. Preserved exactly / preserved with UX change / at risk / missing
5. Correction needed

You must explicitly include:
- CMS
- collaboration
- AI
- version history
- export/publish
- command palette
- shortcuts
- canvas overlays
- drag/drop
- multi-select
- marquee
- breakpoints
- pseudo states
- advanced inspector controls
- context menus
- templates/components/media/settings/history surfaces

Important:
If anything important is missing, call it out clearly.
Do not hide downgrade risks.

Only output:
**C. Whole-Editor Coverage Check**

Stop after section C.
Phase 4 — sirf Stitch Handoff Brief
Now use:
- `today_final.md`
- the Gap Map
- the Target-State PRD
- the Whole-Editor Coverage Check

Do not generate the redesign yourself.
Do not summarize.
Do not ask me questions.

Your task right now is only this:

Create a **Stitch Handoff Brief**.

This brief must tell Stitch:
- what the product is
- who it is for
- what already exists and must not be lost
- advanced capabilities that must remain discoverable
- exact UX problems to solve
- exact UI hierarchy changes needed
- exact surfaces that must be redesigned
- exact interaction/state requirements
- whole-editor coverage requirements
- anti-downgrade constraints

You must explicitly include this rule:
**Do not simplify the product by hiding or removing advanced editor capability.**

The brief must cover:
- top bar
- left rail
- add/build panel
- templates/components/media/pages/design/settings/history surfaces
- canvas and overlays
- right properties panel
- CMS
- collaboration
- AI
- version history
- export/publish
- command palette
- context menus
- breakpoint controls
- pseudo states
- multi-select and selection states
- empty/error/loading/saving/offline/publish states

Only output:
**D. Stitch Handoff Brief**

Stop after section D.
Phase 5 — sirf Anti-Downgrade Validation Checklist
Now create the final review checklist for validating Stitch output.

Use:
- `today_final.md`
- the Gap Map
- the Target-State PRD
- the Whole-Editor Coverage Check
- the Stitch Handoff Brief

Do not redesign.
Do not summarize generally.

Your task right now is only this:

Create an **Anti-Downgrade Validation Checklist**.

For every important capability, define how the final redesign should be reviewed and classified as:
1. preserved exactly
2. preserved but relocated
3. visually represented but behavior unclear
4. at risk of downgrade
5. missing and must be corrected

Focus especially on:
- CMS
- collaboration
- AI
- version history
- export/publish
- command palette
- shortcuts
- canvas overlays
- multi-select
- drag/drop
- breakpoints
- pseudo states
- advanced inspector controls
- context menus
- templates/components/media/settings/history surfaces

Then output:
A. Missing capability list
B. Hidden/risky capability list
C. Required corrections before redesign acceptance
D. Final acceptance rule

Final acceptance rule must explicitly state:
**A redesign that is cleaner but functionally weaker must be rejected.**

Only output:
**E. Anti-Downgrade Validation Checklist**

Stop after section E.
Best run order

Is order mein chalao:

Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

Important tip

Har phase ke start mein yeh ek line add kar sakte ho:

Do not continue to the next phase. Stop exactly after the requested section.
Sab se strong control line

Agar Claude phir bhi drift kare, yeh add karo:

Any answer that turns into a generic UI audit, visual theme exploration, or shell-only redesign is incorrect.

Agar chaho, main ab in 5 prompts ka ultra-short version bhi bana deta hoon jo copy-paste mein aur easy
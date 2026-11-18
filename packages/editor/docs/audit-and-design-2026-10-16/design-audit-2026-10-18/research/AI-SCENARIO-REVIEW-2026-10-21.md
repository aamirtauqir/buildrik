# First-run AI scenario review

Date: 2026-10-21 · Status: **PROPOSAL — synthetic desk review, not user research**

## Authorization and evidence

The owner asked the assistant to conduct interviews itself, then reiterated “ni tum khud sae hi kar lo” after being asked to provide participants. This record delivers an AI scenario review without further participant coordination. No real people were interviewed; there are no participant responses, quotations, observed task outcomes or measured completion times. The five scenarios below are deliberately constructed analytical lenses, not five independent opinions or a representative sample.

Sources inspected:

- [Interview plan](INTERVIEW-PLAN.md), screener, discussion guide and consent template.
- [Strategy hypotheses](../../panels/00-STRATEGY.md), especially sections 1–7.
- [First-run specification](../../panels/16-FIRST-RUN.md), especially sections 4–10.
- [Current product brief](../../PRODUCT-DESIGN-BRIEF.md).

Scope: first-run entry, learning progress, permissions, interruptions and handoff. This is a specification walkthrough; no Figma playback, source-code verification, participant study or accessibility execution was performed. No product behavior or approved requirement is changed. R1's real-interview evidence remains absent; this report does not satisfy that gate or mark onboarding validated.

## Five synthetic perspectives

### S1 — Independent designer beginning with a template

Constructed situation: a new account opens an empty client site and wants a useful first draft.

Walkthrough: empty Home → named template card → that template's preview → Replace page → edit actual content → Preview.

Existing protection: P16 §4.1 requires the selected card's exact preview, and §4.3 counts a committed apply rather than merely opening the picker. Applying a template does not end onboarding.

Hypothesis to test: presenting familiar starter content could make the first edit easier. It could also add work if the starter is unrelated to the client's needs; this review cannot establish which outcome is common.

Check to retain: cancel from template preview returns to the same empty page without completion credit. Apply failure leaves a recoverable state and no success tick. Preview earns credit only after rendering.

Unresolved research question: what did a designer actually open first on their most recent client project, and when did the work first feel useful?

### S2 — Independent designer working from an existing design

Constructed situation: an experienced designer has a layout in mind and wants to build without replacing the page with a template.

Walkthrough: empty Home → Start blank / Add a section → insert a section → edit → Preview; optionally hide Getting started and reopen it from Help.

Existing protection: P16 §§4.1 and 5.3 preserve the alternative entry, per-page blank choice, immediate checklist dismissal and replay with prior progress.

Hypothesis to test: template-first hierarchy may help some beginners but frustrate people recreating an existing layout. Keep the approved secondary paths discoverable; do not infer that all users prefer templates.

Check to retain: Start blank opens Add as specified; reload does not restore the dismissed prompt for that user/page. Reopening Getting started does not reset content or completed steps.

Unresolved research question: is a template, existing design, reusable site or blank canvas the usual starting point? No preference count is available.

### S3 — Independent designer maintaining an existing client site

Constructed situation: a new account opens an already populated site to make a small change.

Walkthrough: existing page → silent checklist seeding → edit relevant content → Preview → return to the same editing context.

Existing protection: P16 §§4.3–4.4 distinguish silent historical seeding from a new achievement, prohibit focus-stealing congratulations, and keep learning progress separate from launch readiness.

Potential specification ambiguity: learning history is described as user-scoped, while some steps are seeded from site content. Before implementation, explicitly define what a new user on an existing site sees, and what a returning user on a second site sees. This is a question for contract reconciliation, not a newly reproduced defect.

Check to retain: preexisting content does not generate a burst of achievement messages. A completed checklist does not imply that the current site's latest changes are saved or published.

Unresolved research question: how much work is maintenance, and who performs it after launch?

### S4 — Designer in a small agency with limited permissions

Constructed situation: a teammate can edit content but another person controls publishing.

Walkthrough: open assigned site → perform eligible edit → Preview → inspect an unavailable Publish step and its reason.

Existing protection: P16 §4.3 excludes ineligible steps from the count, explains unavailable steps and hides onboarding entirely for a viewer. Persona descriptions never grant permissions.

Hypothesis to test: a linear checklist could be read as an instruction to do another teammate's job. Existing permission explanations should make ownership understandable without creating a second approval system.

Check to retain: use effective permissions for both action availability and the eligible denominator. A role change cannot leave a working Publish action behind. A zero-eligible state shows neither 0/0 nor a celebration.

Unresolved research question: which people actually design, review, approve and publish on a recent agency project?

### S5 — Small-agency designer preparing client handoff

Constructed situation: the designer wants client feedback but must distinguish learning progress from real delivery status.

Walkthrough: edit → Preview → existing Review task → confirmed send → return; later use the existing Publish workflow when eligible.

Existing protection: P16 uses confirmed REVIEW_SENT and successful publish outcomes, while client review and publishing remain owned by their existing modules.

Hypothesis to test: checklist completion language could be mistaken for client approval or a live site if the scope is unclear. The existing distinction should be retained in all specimens.

Check to retain: opening Review or starting a send does not mark it sent; failure offers recovery without false completion. Finishing all eligible learning steps says Getting started is finished, and says the site is live only following actual publish success.

Unresolved research question: how do clients currently give usable feedback, who can approve, and what help do they need? This simulated designer perspective cannot answer for clients.

## Synthesis and recommended priorities

These are analyst recommendations based on the written contracts, not participant findings:

1. **Preserve the approved template → edit → Preview path as a hypothesis.** Keep Add a section and Start blank available; this review supplies no evidence for removing them or declaring one path universally preferred.
2. **Make skip and return reliable.** Retain immediate dismissal and Help → Getting started with history intact. This is already specified, not a newly discovered missing feature.
3. **Show progress only for completed outcomes.** Apply, render, send and publish success must remain distinct from button clicks, pending operations and historical content.
4. **Resolve user-versus-site progress semantics before implementation.** Add explicit acceptance examples for a new user on an existing site, the same user on a second site, and account switching. Reconcile with the governing shared contract rather than inventing a new storage scope here.
5. **Keep learning, permission and delivery status separate.** Onboarding must not grant access, block legitimate publishing, or imply approval/readiness.

Existing design checks to exercise when first-run specimens are authorized: empty and populated entry; exact template preview/cancel/failure; Start blank persistence; silent seeding; hide/replay; denied or revoked permission; failed Preview/send/publish; account/site switching; keyboard and focus; 1280×720 and 1440×900 composition; one coaching surface at a time.

## Hypothesis disposition

| Original hypothesis | Result of this desk review |
|---|---|
| H1 — solo designer is primary | Untested. Constructing three solo scenarios and two agency scenarios cannot validate the target audience. |
| H2 — template → edit → Preview activates users | Untested. Plausible main route with a deliberately retained alternative; no observed behavior or timing. |
| H3 — build → review → publish → change fits work | Untested. Maintenance and divided responsibilities are useful counter-scenarios, not evidence of frequency. |
| H4 — clients review without training | Untested. Requires real client evidence and the separate non-designer usability study. |

Delivered: five explicit hypothetical walkthroughs and a prioritized check list. No interviews completed, no synthesis counts fabricated, no Figma or application changes. Readiness remains **PROPOSAL**; this report makes no DESIGN READY or runtime claim.

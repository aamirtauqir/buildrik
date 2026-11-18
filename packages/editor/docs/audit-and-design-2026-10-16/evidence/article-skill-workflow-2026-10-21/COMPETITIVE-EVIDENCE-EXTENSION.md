# Competitive evidence extension — 21 October 2026

The public-source research pass is expanded. It adds 40 included customer-review entries (41 read; one explicit noncustomer excluded), current job listings, and an assessment across all twelve rubric dimensions. **This is desk research, not a validated product ranking.** Some dimensions remain unscored because their necessary evidence is unavailable. Buildrick production capability and customer satisfaction are not inferred from a Figma prototype.

Use alongside [the original capability/pricing comparison](COMPETITIVE-TEARDOWN.md) and [the review sample and exclusions](PUBLIC-REVIEW-SAMPLE.md). Each competitor has pricing, help, careers, reviews, enterprise, trust/security, status and release sources. Dates are the collection snapshot, not a claim of timeless availability.

## Hiring signals

| Competitor | Public listings | Category breakdown | Source |
|---|---:|---|---|
| Webflow | 18 | Engineering 6; Sales 6; Product 4; Customer Education 1; Information Technology 1 | [Current careers page](https://webflow.com/company/careers), [linked Ashby board](https://jobs.ashbyhq.com/webflow), [public posting API](https://api.ashbyhq.com/posting-api/job-board/webflow) |
| Framer | 8 | Engineering 6; Growth 1; Product 1 | [Current careers page](https://www.framer.com/careers/) |

Webflow's current careers page points to Ashby. The old Greenhouse board returns zero and was rejected as stale. Webflow listings include cloud/backend infrastructure and product governance. Framer listings include backend engineering, site reliability, product engineering, analytics engineering and product design. These are **open listing counts**, not headcount, funded positions or proof of future roadmap commitments. The normalized [hiring snapshot](hiring-snapshot.json) preserves the listing data used.

Inference: both companies continue recruiting engineering roles; Webflow's governance listing warrants monitoring enterprise controls, and Framer's reliability listing warrants monitoring its platform operations. A single snapshot cannot establish hiring velocity or growth.

## Twelve-dimension assessment

Numbers are provisional analyst assessments of public evidence, using a 1–5 scale: 1 weak, 2 limited, 3 established, 4 strong, 5 unusually broad evidence. This adapted desk-research use of the upstream rubric does not turn documentation into observed task success. **N/E = insufficient evidence to score; never zero.** Confidence concerns evidence coverage, not whether vendor claims have been independently audited.

| Dimension | Webflow | Framer | Evidence and limit |
|---|---|---|---|
| Features | 4 / medium | 4 / medium | Documented creation, CMS, publishing, staging and recovery in the original comparison; equivalent-task breadth not exhaustively inventoried. |
| Pricing | N/E | N/E | Public entry tiers collected, but no equivalent seats/CMS/traffic/usage basket. Low sticker price alone is not value. [Webflow](https://webflow.com/pricing), [Framer](https://www.framer.com/pricing). |
| UX | N/E | N/E | Reviews identify investigation topics; no comparable first-use or experienced-user task study. |
| Performance | N/E | N/E | Status pages concern availability, not editor responsiveness. No controlled latency or load measurement. |
| Docs | 4 / medium | 4 / medium | Searchable, categorized help centers cover core authoring/publishing tasks. Task findability not tested. [Webflow Help](https://help.webflow.com/hc/en-us), [Framer Help](https://www.framer.com/help/). |
| Support | N/E | N/E | Complaint samples are biased; no comparable support request, response-time evidence or resolution audit. |
| Integrations | 4 / medium | 4 / medium | Webflow published a 300-app milestone in April 2025; Framer has a public plugin marketplace and integrations category. Ecosystem existence is observed; present totals and integration quality are not normalized. [Webflow milestone](https://webflow.com/updates/over-300-apps-now-available-on-webflow-marketplace), [Framer plugins](https://www.framer.com/marketplace/plugins/), [integration category](https://www.framer.com/marketplace/plugins/categories/integrations/). |
| Security | 4 / medium | 4 / medium | Vendor material states SOC 2 Type II and ISO 27001 coverage/compliance. Full audit reports, scope exceptions and technical controls not independently reviewed. [Webflow trust](https://trust.webflow.com/), [Framer security](https://www.framer.com/legal/security). |
| Scalability | 4 / medium | 4 / medium | Enterprise governance, permissions and higher-capacity offerings documented. No throughput, limit or reliability load test. [Webflow Enterprise](https://webflow.com/enterprise), [Framer Enterprise](https://www.framer.com/enterprise/). |
| Brand | N/E | N/E | Official positioning is visible; unaided awareness, preference and independent brand strength not measured. |
| Community | 3 / low | 3 / low | Public community/creator destinations exist; active membership and helpfulness not measured. [Webflow community](https://community.webflow.com/), [Framer community updates](https://www.framer.com/updates/community/). |
| Innovation | 4 / medium | 4 / medium | Multiple dated releases observed; usefulness/adoption unknown. [Webflow updates](https://webflow.com/updates), [Framer updates](https://www.framer.com/updates). |

Seven dimensions receive provisional desk scores and five remain N/E for each competitor. **No aggregate score or winner is calculated.** Identical provisional scores mean this evidence does not establish a difference at the selected resolution. All twelve dimensions have dispositions; a fully validated numerical scorecard is still incomplete.

Buildrick receives no production score in this table. Its current evidence is editable design coverage and sampled prototype transitions, with actual participant research still unavailable.

## Availability and release observations

[Webflow status](https://status.webflow.com/) showed operational services during collection and a 90-day reporting window. [Framer status](https://www.framerstatus.com/) showed online services, with a 30-day editor value of 99.908% and site availability of 100%. Different windows and service definitions prevent a fair numerical ranking. Neither establishes smooth editor interaction on the same machine.

The Webflow update feed includes October 7/13/15/20 entries for shared styles, element tags, integrations and campaigns. Framer's feed includes September 22 Skills and October 1 Firewall. These establish recent publication activity, not delivered customer benefit. Hiring signals do not prove which features will ship.

## Decision use

- Preserve exact scope, draft/recovery and review-snapshot boundaries in Buildrick. These remain hypotheses about user value; prototype playback only checks navigation.
- Test the existing C01 and C02 critique limitations before unguided participant tasks; this research pass does not silently redesign those specimens.
- Make an equivalent-plan basket before pricing conclusions. Confirm Webflow's help/pricing disagreement on publishing-workflow eligibility.
- Later compare the same task, device, dataset and connection to assess UX and performance. Recruit the intended five participants when available; public competitor reviews cannot replace them.
- Do not introduce AI functionality from competitor trends: the current Buildrick owner scope excludes it.

## Battlecard cautions

Against Webflow, emphasize Buildrick's proposed exact-target recovery and review scope only as demonstrated prototype behavior. Webflow already documents controlled publishing, so “safe publishing is unique” is unsupported.

Against Framer, demonstrate the proposed distinction between a frozen review snapshot and later edits. Framer already documents versions/staging; no evidence here establishes that its client-review workflow lacks equivalent controls.

The original bounded SWOT and positioning hypotheses remain applicable. No market share, revenue, customer count, win/loss rate or market-leader claim is inferred.


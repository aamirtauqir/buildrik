# Phase 6 reopened — product design expansion
Date: 12 October 2026

## Correction and authority
The user rejected the previous bounded prototype as an incomplete product design. Phase 6 is reopened. The former completion report proves only its finite tested scenarios; it does not establish complete product coverage. Phase 7 is deferred. This work changes Figma and design documents, not application code.

User direction: make AI scope, agents and collaboration visible and coherent; redesign the inspector toward Webflow-level authoring depth. The recommended approach preserves Buildrick branding and separates immediate AI assistance from planned agent runs. A superficial restyle would not resolve workflow gaps. Rebuilding the entire shell around a chat window would weaken precise manual authoring.

## Figma organization
File: g4GzQFqzNYz5sosz1QtZXC
New page: 8463:2 — 04 — PRODUCT DESIGN / Phase 6 reopened.
Earlier AS-IS and TO-BE journeys are retained as historical and supplementary designs.
The new screen inventory is a product proposal, with sample data and explicit service dependencies. Native controls and prototype navigation do not prove backend functionality.

## Inspector specification
- 352px right workspace with compact property rows. Selection identity and breadcrumb remain visible.
- Style / Settings / Interactions are distinct. This revises the prior Style / Content / Effects proposal in response to the user's Webflow direction. Migration must map every old property; do not duplicate ownership.
- Style starts with a selector (class, combo class, usage count), breakpoint and pseudo-state. Show whether edits target a shared class or an element override.
- Sections: display/layout, flex or grid, spacing box model, sizing/constraints, position, typography, layered backgrounds, border/radius, shadows/filters/transforms, transitions.
- Values retain units: px, %, rem, em, ch, vw/vh, auto, min/max and fr where eligible. Unit conversion must preserve intent rather than silently treating numeric text as pixels.
- Origin states: local, inherited, token, overridden, mixed, locked, invalid. Do not communicate origin with color alone.
- Reset removes only the declaration at the selected selector/breakpoint/pseudo-state. Show the resulting inherited value before/after.
- Shared class edits show usage and impacted pages. Offer an element override when the user does not intend global changes.
- Grid has track/child controls and a visible two-column result; spacing exposes linked sides and per-side editing.
- Settings owns content, CMS source/fallback, HTML semantics, IDs and custom attributes. Eligibility remains tied to selected element capability.
- Interactions owns event, target, action, duration, easing, reduced motion, replay and cancellation.
- Mixed selection uses the intersection of editable properties and excludes locked targets explicitly.
- Canvas zoom is separate from authored breakpoint width. Mobile states must represent actual reflow, not a shrunk desktop screenshot.
- Full type coverage remains required across the 55-type registry: heading/text, image/media, container/flex/grid, forms, CMS bindings, components/instances, mixed/locked/fallback. Existing type-specific frames remain references; new shared structure needs integration across them.

## AI product scope
Immediate conversational assistance:
1. Selected element: explicit identity, editable properties, current revision.
2. Page: named page and its included sections; excluded pages remain visible.
3. Site: named pages and Brand context; review expanded impact.
4. Workspace configuration: provider, model policy, allowance and user permissions; credentials never shown in plain text.

Journey: prompt + context → generate/cancel → before/after proposal → scope/revision validation → explicit apply/discard → applied result + Undo. Preserve prompts on error. Stale proposals cannot overwrite newer edits; regenerate against current revision. Quota exhaustion, provider failures and conversation history are separate visible states.

AI may propose content, layout, accessible labels and metadata. Publishing, member access, billing and credentials are not implicit permissions of an AI request. Successful AI generation is a proposed design state, not a claim that a paid provider request was exercised.

## Agent product scope
Agents are tasks with explicit lifecycle, not decorative avatars.
- Library: responsive layout, content/SEO and accessibility audit presets.
- Task definition: objective, allowed pages/breakpoints, allowed actions, protected content/tokens, budget cap and maximum actions.
- Plan: ordered steps, exact read/write scope, proposed outputs and explicit approval.
- Run: current step, elapsed time, budget/usage, cancel, partial logs, failure and retry.
- Results: per-target diffs, selected changes, dependencies, validation status and current baseline.
- Commit: human-approved draft transaction, actor attribution and one scoped undo action.
- Audit: requester, agent, plan version, approvals, actual use, changes and outcome.
- Stale baseline invalidates approval. Failed/unknown checks cannot become passed badges.
- Read-only site audit has its own plan and report; it must not inherit write permissions from a page-layout task.
- Partial approval demonstrates two selected hero changes, leaving grid changes unapplied.
- Publish remains a distinct human-authorized product workflow.

The old PRD calls the fully wired agent confirmation loop future expansion. These screens are proposed product scope; runtime implementation and permission enforcement remain required.

## Collaboration product scope
- Presence: member identity, role, page/element location, connectivity and stale presence state.
- Permissions: workspace membership and per-site grants are distinct. Reviewer, designer and publisher capabilities must be explicit; invites are confirmed before sending.
- Comments: page/element anchors, thread/reply, mentions, assignment, resolved/reopened state.
- Activity: human and agent operations are attributed, with target revision.
- Review: immutable version, recipient, link expiry, comments, approve/request changes; sign-off is tied to the reviewed revision and does not publish.
- Connection loss: keep local edits, show unsynced status, reconcile after reconnect.
- Conflicts: show baseline/local/server values, allow keep-server or explicit reapply, preserve unrelated edits.
- Personal undo must not reverse another collaborator's unrelated operations.
- Removed targets, role revocation, invitation expiry/revoke, notification delivery, loading/empty states and large-team pagination need state specifications and further product QA; do not hide them under an all-done claim.
- Concurrency algorithm, durable queues and authorization are engineering decisions. The visual proposal does not prove multiplayer convergence.

## Prototype contract and completion
The expansion inventory contains 62 named states: 19 inspector, 12 AI, 15 agents, 16 collaboration. Connected scenario actions must navigate to the matching outcome and retain scope consistency. All four workspaces must be reachable from the main header. Existing media/CMS/Brand/publish journeys are linked as supplementary legacy designs.

Acceptance requires native editable structure, shared components/tokens, readable value origins, no unintended clipping, valid destinations, and explicit evidence for tested journeys. Count screens separately from implemented functions and browser-tested interactions. Do not close Phase 6 merely because these new screens exist: a full-product inventory reconciliation and user design review remain necessary.

## Webflow references
- Style panel and selectors: https://help.webflow.com/hc/en-us/articles/33961362040723-Style-panel-overview
- Selector manager: https://help.webflow.com/hc/en-us/articles/33961365722899-Style-selectors-panel
- AI overview: https://help.webflow.com/hc/en-us/articles/34297897805715-Webflow-AI-overview
- Real-time collaboration: https://help.webflow.com/hc/en-us/articles/43232037920275-Real-time-collaboration
- Share and roles: https://help.webflow.com/hc/en-us/articles/33961254829843-Invite-new-Workspace-members-or-share-a-sandbox-site-link

These references inform interaction organization, not a promise of exact Webflow parity. Buildrick's source-supported and future capabilities stay distinguished.


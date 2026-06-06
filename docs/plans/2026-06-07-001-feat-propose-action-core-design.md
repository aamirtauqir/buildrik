---
title: "Propose-action core — design"
type: feat
status: design-draft
date: 2026-06-07
origin: docs/plans/2026-06-06-001-feat-privileged-ai-action-platform-design.md (Section 7.3)
review: codex challenge pending
---

# Propose-action core — design

Step 2 of the privileged-action arc — the actual build phase. Step 1 was
the platform-shape design (`2026-06-06-001`). Section 6 publish-path
prereqs closed 2026-06-07 (5 commits, see
`project_publish_path_prereq_arc_20260607` memory). This doc specs
the three thin pieces Section 7.3 calls for, grounded in current code.

## 0. What we're adding (Section 7.3 scope, verbatim)

> one new `ai.ts` intent + `actions.confirm` mutation + the server
> confirmation-token util + the central trust-policy module. Wraps the
> (now-fixed) `sites.publish` as the first + only `actionId`.

Out of 7.3 scope:
- Confirm-with-consequences UI (Section 7.4 — separate phase)
- Any second `actionId` (Section 7.5 — chosen by adoption data)
- Compensation/inverse actions (deferred per parent §8 decision #4)
- Cost metering beyond what publish already has (none here)

## 1. Ground in code (current state)

| Surface | File:line | Status |
|---|---|---|
| AI intent enum | `server/trpc/routers/ai.ts:132` (`["text","style-command","plan"]`) | needs no change — propose is a separate mutation, not a streamPrompt intent (one-shot, not streamed) |
| sites.publish mutation | `server/trpc/routers/sites.ts:276–296` | unchanged; we call it from actions.confirm after token validation |
| publishInputSchema | `packages/shared/schemas/publish.ts:37` | reused verbatim as the descriptor's `schema` |
| isSafeSrcValue / UNSAFE_HREF | `server/services/ai.service.ts:663,674` | migrates into the central trust-policy module |
| allowedTokens / allowedAssetUrls patterns | `server/services/ai.service.ts:689,960,1126` | generalized as `assertCapabilityScoped` in the trust-policy module |

The agent loop (P4) already emits per-step results to the editor via
`streamPrompt`'s subscription. Adding a `{type: "action", proposal}` step
type is the smallest integration point — see §5.

## 2. Three pieces + their files

```
server/services/
  ai-trust-policy.ts            NEW — single home for URL policy, capability-
                                      scoped IDs, prompt-injection escaping
  action-token.service.ts       NEW — sign/verify confirmation tokens (JWT)
  action-registry.ts            NEW — actionId → ActionProposal descriptor
server/trpc/routers/
  ai.ts                         + proposeAction mutation (one-shot)
  actions.ts                    NEW — actions.confirm mutation
```

Five new files, one modified file. No DB migration. No new env var.

## 3. Decisions (locked unless codex flips them)

**D1 — Signing key source.** Reuse `NEXTAUTH_SECRET`. Same trust domain as
session integrity; rotated by deploy. Avoids a new ops surface.
*Deferred:* dedicated `AI_ACTION_SIGNING_KEY` if/when we want isolation
(e.g. signing-key compromise without session compromise).

**D2 — Token format.** Standard JWT (HS256 over NEXTAUTH_SECRET) via
`jose` if already in tree, else `jsonwebtoken`. Don't roll our own
HMAC string format — handling clock skew, base64url, exp parsing
correctly is the library's job.

**D3 — Token claims.**
```ts
{
  actorId: string,    // session user id
  siteId: string,     // site the action targets
  actionId: string,   // e.g. "site.publish"
  argsHash: string,   // sha256(canonicalJSON(args))
  exp: number         // unix seconds, propose + 60s
}
```
At execute time the client sends `(token, args)`; server re-hashes args
and compares to `token.argsHash`. Mismatch = reject. Keeps the token
small (no embedded HTML pages) and tamper-evident.

**D4 — Expiry.** 60 seconds. Confirm flow is in-editor, sub-minute.
Idle users re-propose at no cost. Far-future / far-past rejected via
JWT lib's `exp` claim.

**D5 — argsHash algorithm.** SHA-256 over canonical JSON: sorted keys,
no whitespace, fixed encoding. Tiny `canonicalJson` helper in
`action-token.service.ts`; same canonicalizer used both sides.

**D6 — actionId naming.** Dot-namespaced lower-kebab: `site.publish`,
`site.redirect.create`, `site.settings.update`. First segment = domain;
last segment = verb. Surface mappings live in `action-registry.ts`.

**D7 — Propose lives on aiRouter, execute lives on actionsRouter.**
- `aiRouter.proposeAction` is AI-shaped (could in future stream a series of
  proposed actions; today one-shot).
- `actionsRouter.confirm` is AI-agnostic — a human "Publish" button could
  in principle go through the same path (consistency). v1 ships only AI
  call site, but the seam is named for the future.

**D8 — Trust-policy module surface.**
```ts
// server/services/ai-trust-policy.ts
export type UrlSurface =
  | "form-action" | "social-link" | "canonical"
  | "redirect-target" | "image-src" | "commerce-url" | "locale-path";

export function validateUrl(value: string, surface: UrlSurface): true | string;
// returns true on pass; reason string on reject.

export function assertCapabilityScoped<T>(
  value: T,
  allowed: ReadonlySet<T>,
  label: string,
): void;
// throws InvalidArg if value not in allowed list.

export function fenceInventoryString(s: string): string;
// Treats s as attacker-controlled data (asset names, CMS titles, etc.).
// Strips control chars, caps length, no markdown/HTML brackets.
```
Migration of `isSafeSrcValue` / `UNSAFE_HREF` into `validateUrl` happens
in the same commit; `ai.service.ts` switches its imports.

**D9 — First actionId descriptor.**
```ts
// action-registry.ts
const sitePublish: ActionProposal<PublishInput> = {
  actionId: "site.publish",
  schema: publishInputSchema, // reused, capped + sanitized already
  describe: () => ({
    title: "Publish this site",
    consequence:
      "This deploys the live site to your host. Cmd+Z can't undo a publish.",
    undoable: false,
  }),
  execute: async (args, ctx) =>
    startPublish(args.siteId, ctx.workspaceId, ctx.userId, args.pages),
};
```
`execute` is a thin shim into the existing `startPublish`. No new
authorization layer — `sites.publish` mutation's `checkSiteRole("ADMIN")`
already enforces it, and `actions.confirm` re-asserts it before calling
execute (defense-in-depth).

**D10 — Agent loop integration.** `streamPrompt` already emits step
types. Add one:
```ts
yield { type: "action" as const, proposal: { actionId, args, token, descriptor } };
```
Agent step rules:
- Seam-A (edit-command) steps may auto-apply when the toggle is on.
- Seam-B (action) steps NEVER auto-apply. Confirm is always explicit
  regardless of the toggle. The token's 60s expiry is the safety net
  even if a buggy auto-apply path tries to skip the gate.

**D11 — No DB migration.** Tokens are signed strings, not rows. No
`PrivilegedAction` table per parent §8 decision #1 (per-surface tables
only; publish reuses PublishBuildJob).

**D12 — Audit trail.** Re-use `recordForSite` from
`activity-log.service.ts` (parent §3 reuse map). One call after the
existing-mutation returns. Action = `"ai.action.confirmed"`,
metadata = `{actionId, jobId?, argsHash}`.

**D13 — Per-action quota.** None for publish (no extra cost beyond what
the existing flow accrues). The hook is `ai-trust-policy.ts`
`assertActionCostBudget(actionId, ctx)` — no-op for `site.publish`,
called from `actions.confirm` for forward-compatibility. Translation /
CMS / commerce surfaces will populate it in later phases.

## 4. Flow (concrete sequence)

```
[1] AI emits next agent step
    streamPrompt → { type: "action", proposal: { actionId, args, token, descriptor } }

[2] Server-side BEFORE [1] is sent:
    a. aiRouter.proposeAction validates args against actionRegistry[actionId].schema
    b. ai-trust-policy runs canonical checks (URLs, capability-scoped IDs)
    c. actionTokenService.sign({ actorId, siteId, actionId, argsHash, exp })
    d. descriptor returned alongside token

[3] Editor renders confirm-with-consequences gate (Section 7.4 — NOT this phase)
    For 7.3 dev: a CLI / debug button submits actions.confirm with the token.

[4] Editor calls actionsRouter.confirm({ token, args })
    a. actionTokenService.verify(token) → claims or REJECT
    b. session.userId === claims.actorId or REJECT (token theft)
    c. canonicalJson(args) hash === claims.argsHash or REJECT (tamper)
    d. actionRegistry[claims.actionId].execute(args, ctx)
    e. recordForSite({ ... action: "ai.action.confirmed", metadata: { actionId, argsHash } })
    f. return execute's result (e.g. publish jobId)

[5] Existing UI takes over (publishStatus polling, toast on completion).
```

## 5. Phasing (small commits)

1. **Trust-policy module** — `ai-trust-policy.ts` + migrate existing
   `isSafeSrcValue`/`UNSAFE_HREF` callers. No new behavior; one
   commit, low-risk.
2. **Action-token util** — `action-token.service.ts` + unit tests
   (sign+verify+reject expired+reject tampered+canonicalJson stability).
3. **Action registry + first descriptor** — `action-registry.ts` with
   only `site.publish`. Tests over descriptor `execute` shim.
4. **proposeAction mutation** — `aiRouter.proposeAction` + tests
   (valid args → token; blocked by trust-policy → 400; non-existent
   actionId → 400).
5. **actions.confirm mutation** — `actionsRouter.confirm` + tests
   (full happy path; reject tampered/expired/wrong-actor).
6. **Agent loop wire** — `streamPrompt` emits `{type:"action",…}`;
   call sites in editor's agent loop add the new branch (no UI gate
   yet — debug only).

Each commit type-checks + tests + lints + ships standalone. Step 6 is
behind `FEATURE_PROPOSE_ACTION` flag (new) until the 7.4 UI lands.

## 6. Test surface

| Test | Asserts |
|---|---|
| `action-token.sign+verify` | round-trip with valid claims passes |
| `action-token.expired` | exp < now rejects |
| `action-token.tampered-payload` | flipped claim rejects (signature mismatch) |
| `action-token.tampered-signature` | flipped signature rejects |
| `canonicalJson stability` | same object → same hash regardless of key order |
| `proposeAction valid` | returns token + descriptor |
| `proposeAction blocked URL` | trust-policy reject surfaces as 400 |
| `proposeAction unknown actionId` | 400 |
| `actions.confirm happy path` | calls execute, records activity, returns result |
| `actions.confirm token theft` | session.userId ≠ claims.actorId rejects |
| `actions.confirm args drift` | re-hash mismatch rejects |
| `actions.confirm expired token` | rejects |
| Live-verify | end-to-end one publish via debug button; verify activity log entry exists |

## 7. Codex challenge prep — what to attack

Volunteering the weak spots:

1. **D1 NEXTAUTH_SECRET reuse.** If the editor leaks the token (XSS,
   shoulder-surfing), attacker can replay until `exp`. With a dedicated
   key we'd rotate without nuking sessions. Is 60s expiry small enough
   to make reuse moot, or do we need a separate key from day 1?
2. **D3 argsHash over canonical JSON.** Subtle attack: if canonicalizer
   silently drops a key (extra field), attacker can add fields to the
   args at execute time that propose never saw. Specify: unknown keys
   in args = canonicalize FAILS, not silently included.
3. **D7 propose on aiRouter vs separate router.** Codex may want propose
   AI-agnostic too (a human "Publish" goes through propose first). v1
   pragmatically wires only AI; ok or no?
4. **D10 auto-apply blocking.** What stops a future contributor from
   adding a `force=true` skip-confirm path on actions.confirm? Server
   should have no such bypass; the 60s expiry + session check is the
   floor, not the ceiling.
5. **D12 audit best-effort.** parent §8 residual gap — for privileged
   actions, do we need transactional audit (audit row written in the
   same tx as the mutation), or accept the best-effort limit?
6. **Trust-policy migration scope.** Are we migrating ALL existing URL
   validators in one commit, or just the ones publish needs? Partial
   migration leaves drift.

## 8. NOT in scope

- Building the confirm-with-consequences UI (Section 7.4).
- Second wrapped action (Section 7.5 — adoption-gated).
- Compensation / inverse actions (parent §8).
- Per-action cost budgets beyond the hook (forward-compat only).
- Shared async-job polling refactor (parent §8 residual — defer until
  the 2nd async surface arrives).

## 9. Open env-var question (only "ops" footprint)

`FEATURE_PROPOSE_ACTION` (Vite + Next.js both) — keeps step-6 wire
behind a flag until 7.4 ships. Default `false`. Mirrors the existing
`FEATURE_PUBLISH` pattern in `runtimeEnv.ts`. Add to CLAUDE.md env
table.

---

Codex pass next. Then phase 5.1 (trust-policy module).

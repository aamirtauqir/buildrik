# F-A5 · AI edit pipeline · F-A8 · Sync fan-out — walk record (PARTIAL)

Walked 2026-08-24 · localhost:3000, real session.

## F-A5 — surface walked, **no AI call fired**

A hard guard aborted every `ai.*` / `streamPrompt` / `agent.*` request for the
whole probe, and the counter read **0**: nothing tried to fire, because nothing
was submitted. Firing a paid generation is off-limits without the founder, and
the guard is there so an accidental keystroke could not have done it either.

| # | leg | result |
|---|---|---|
| 1 | doors | **PASS** — ⌘K offers **"Open AI panel · I"** and **"Open AI Assistant · ctrl+shift+a"** |
| 2 | scope chip | **PASS** — the panel header reads **`Scope: Whole page`** |
| 3 | the copy | **PASS, and it is the best line in the editor** — *"AI proposes a diff and never writes directly. **Apply lands as one undo step.**"* It states the limit of the AI's authority and the escape hatch in one sentence, before anything is typed. |
| 4 | suggestions | **PASS** — concrete, not generic: *"Make the hero warmer"*, *"Write alt text for every image"*, *"Shorten the menu descriptions"*, plus a `DRAFT` row *"✦ Draft a new section from a brief ›"* |

**Noted, not filed:** the prompt textarea has **no `maxLength`** (reads `-1`)
while the contract says *"prompt ≤5000"*. The server validates, so this is not a
hole — but the input does not stop you, and a 6000-character paste finds that
out only after a round trip.

**Not walked:** everything past the prompt — the streamed edit-command batch and
its 14 command types, the server-side allow-list validation, the accept/reject/
regenerate diff UI, the one-transaction apply, adoption logging, the Agent mode's
≤8-step plan, the 403 → UpgradeModal quota path, the privileged-action confirm
with its single-use 5-minute token, and the client transport guards (30 req/60 s,
timeout 30 s, retry ×2, concurrency 3, 5-minute cache).

## F-A8 — **code-verified, not walked**

These are background mirrors with no UI of their own, so this is a file-level
check and is recorded as such rather than dressed up as a walk.

| mirror | file | retry/queue refs | tests |
|---|---|---|---|
| `cmsSync` | ✓ | 25 | 1 |
| `componentSync` | ✓ | 12 | 1 |
| `versionSync` | ✓ | 12 | 1 |
| `templateSync` | ✓ | 11 | 1 |
| `MediaVersionService` | ✓ | 0 | 1 |

The contract's *"`online` auto-retry"* is real and lives in one place:
`services/syncRetryQueue.ts:30` — `window.addEventListener("online", () => void this.retry())`.

`MediaVersionService` shows **zero** retry/queue references, which matches the
contract: its row names a server-side plan cap (5/25/100), not an offline queue.

What this check does **not** establish: that any mirror actually recovers after
a disconnect. That needs a walk with the network cut mid-mutation, and it was
not done.

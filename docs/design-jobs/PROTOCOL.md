# Design jobs — coordination protocol

One job per screen. Nothing is "done" until it is observed in the running app
AND matches its Figma board, with the measurement recorded. Founder rule
(2026-09-02): job-based, multi-agent, coordinated, do not stop until every
screen is done.

## Files (all in this directory, all committed)

| file | what | who writes |
|---|---|---|
| `jobs.json` | the queue — one row per active board + missing-screen + harness + decision job | coordinator only (agents never edit it) |
| `LEDGER.jsonl` | append-only findings, one JSON object per line | every agent, append only, never rewrite |
| `BLOCKERS.md` | the short list of everything that stops a job — grouped by class, each with an owner | the Blockers agent rewrites it from the ledger; coordinator merges |
| `PROTOCOL.md` | this file | coordinator |

## Roles

| role | reads | writes | may touch Figma | may touch code/git |
|---|---|---|---|---|
| **Coordinator** (main session) | everything | `jobs.json`, code, Figma, git | yes — the ONLY writer | yes — the ONLY committer |
| **Verifier** (per family) | board via Figma READ, live app, census | `LEDGER.jsonl` | read-only | no |
| **Baseline** | conformance harness (`measure.mjs`, `diff.mjs`, `.conformance-baseline.json`) | `LEDGER.jsonl` | read-only | no (may run measure/diff) |
| **Requirements** | `docs/prd/editor/*.md`, `docs/PRODUCT-OVERVIEW.md`, `DESIGN.md`, boards, code | `LEDGER.jsonl` | read-only | no |
| **Duplicates** | Figma page 1:3 (read), `boards.json`, code | `LEDGER.jsonl` | read-only | no |
| **Blockers** | `LEDGER.jsonl` | `BLOCKERS.md` | no | no |
| **Skill lens** (design-review / a11y / flow-audit) | a job's board + live surface | `LEDGER.jsonl` | read-only | no |

Why one writer: the Figma file is one document with shared components (16:16
Section header, 17:6 Card/media, 9:18 Button); a wrong write is invisible until
rendered; the MCP rate-limits. Parallel writers raced these on 2026-09-02 and
were rejected. Code/git is single-writer because gates and the 955-file suite
describe ONE tree.

## Ledger schema (one line, no reformatting)

```json
{"ts":"2026-09-02T10:00:00Z","agent":"verifier-pages","job":"J-141:207","kind":"measure|drift|blocker|duplicate|requirement|baseline|proposal","verdict":"match|drift|unreachable|blocked|duplicate|assumption|ok","evidence":"numbers + node ids + file:line — never prose alone","proposal":"optional: exact change (a use_figma script, or file:line + new value)","severity":"P1|P2|P3"}
```

Rules: `evidence` must carry a measurement (px, ratio, node id, file:line) or
the line is discarded. `proposal` is what the coordinator applies; agents do
not apply it themselves. A `blocker` line names the class from BLOCKERS.md.

## Job lifecycle

`todo` → `measuring` (owner set) → one of:
- `done` — measured, matches board, evidence in ledger
- `fix-code` / `fix-figma` — measured, proposal in ledger, coordinator applies, then back to `measuring`
- `decide` — needs the founder; parked with the question written in BLOCKERS.md
- `unbuildable` — board draws a state the product cannot produce (no producer / static data / by-design); listed in BLOCKERS.md class A

A job is never moved to `done` on a note. It moves on a ledger line with numbers.

## Blocker classes (BLOCKERS.md sections)

- **A** product cannot produce the state (unreachable by construction)
- **B** feature SHAPE differs between board and code (product decision)
- **C** board contradicts another board / the prototype is unwired
- **D** board contradicts the PRD or asks the product to lie
- **E** design-ahead — no code exists
- **F** harness / tooling (stale raw cache, fixture width, rate limit, contention)
- **G** founder decision pending
- **H** duplicate (two boards or two code paths for one thing)

## Do-not list (learned, in memory)

- No `git stash`, no editing source while a suite runs, no live probes during a
  suite. No `pkill -f`. Read the full MCP response, never the first line.
- Gate 14 greps text: write "48-pixel", use `tw:h-80` not `tw:h-[320px]`.
- A parent `resize()` in the Figma sandbox does not relayout child instances —
  bump a padding. `saveVersionHistoryAsync` is unsupported.
- Bash `while read` drops a last line with no trailing newline. Count in, count out.

# Gate C — the pack

> **The only gate from the original plan that has never been run**, and the ship
> plan calls it the highest-value hour in the project. It is founder-only and
> cannot be delegated, so this file exists to make it a one-sitting job rather
> than a project.
>
> Written 2026-07-21, when the design side stopped being the blocker.

---

## What Gate C actually is

Put `S5.5` — the client review page — in front of **a real agency's real client**.
Not the agency. Their client. The wedge runs on the person who has never heard of
us and never will again.

One agency. One link. One honest reaction.

---

## The three questions, and nothing else

Ask these. Do not explain the screen first — the explanation is the thing being
tested.

1. **Opening the link, without being told** — can they say what this is and what is
   being asked of them?
2. **Name and email before commenting** — necessary, or a wall?
3. **Pressing Approve** — do they know what they just agreed to?

Question 3 is the one that decides something. The page shows a snapshot **frozen at
send** (contracts §1.6). If they believe they approved "the website" rather than
"this version", the frozen-snapshot decision has not landed and the copy changes
before anything else gets built on it.

---

## Two ways to run it, and what each proves

| | Proves | Costs |
|---|---|---|
| **A · Figma walkthrough** — click through the 14 S5.5 frames on a laptop | comprehension, copy, whether Approve reads as versioned | nothing. Runnable today. |
| **B · Real link** — client opens `/review/<token>` on their own machine | all of the above **plus** that the loop actually closes | blocked on one line — see below |

**Run A this week.** It answers all three questions, and every failure it finds is
a copy failure, which is the cheapest thing in the project to change. Do not wait
for B to learn something A can tell you.

**B is worth doing after A passes**, because "she understood it in a meeting with
you present" and "she understood it alone, on her own laptop, on a Tuesday" are
different claims, and the product only sells the second.

---

## What blocks B — ~~one argument~~ one flag

**The argument is fixed** (commit `d147664d`). `submitForReview` now takes and
forwards `clientEmail`, the compose popover has the field, and the tests assert
the address specifically rather than the call shape — the old test passed while
the feature was dead, which is how it survived.

Everything downstream was always ready (ship plan §1): `submitReviewInput`
accepts `clientEmail`; `submitReview` **always mints (and on re-send replaces) a
review token** (`review.service.ts:54`), and *when a `clientEmail` is supplied* it
additionally records the invited address and sends the `/review/<token>` invite
email (`review.service.ts:60`). The page renders, identifies, comments and approves
against the real database.

**What remains is one founder decision:** `reviews.submit` is gated on the
`agency_layer` flag (`reviews.ts:32`). Turn it on for the pilot workspace, or
lift the gate. Client review is deliberately *not* gated, so a legitimately
issued link keeps working either way.

Until that flag is decided, nothing has changed in production — the code is
ready and inert.

### The no-email path, described honestly

`clientEmail` is **optional** — consistently, in three places: the schema
(`reviews.ts:20`), the shipped compose field (*"leave blank to keep it
internal"*), and the current S5.1 drawing, which no longer marks it required.
There is no contradiction to resolve; the earlier "required vs optional" framing
is retired.

**What actually happens with no email — precisely, because a founder will assume
"internal = nothing exists":**

- `submitReview` **still mints a token** (`review.service.ts:54`) — a review record
  with a live `/review/<token>` exists.
- But **no invite email is sent** (`review.service.ts:60`), so nobody is handed the
  link.
- And if someone did reach the page, `identifyReviewer` rejects them `NOT_INVITED`
  (`client-review.service.ts:173`) because no address was invited.

Net: with no email it is **effectively internal** — no client can get in — but a
tokenised record does exist. It is *not* "no link is ever issued." (Earlier
drafts of this pack and the `ReviewService` comment said that; both corrected.)

If the founder wants **invite-only** — every submit must name a client — that is a
product choice, not a bug fix, and it would remove the internal-queue path the
schema currently documents.

---

## It is a clickable prototype now — press ▶ Present

The S5.5 client journey is wired as a Figma prototype (11 reactions, reviewed).
Open the **👤 Client review** page and hit **Present** — you can click the real
flow in front of the client instead of scrolling frames. Two flow entries:

- **"Client review — Gate C (valid path)"** — starts at A0, the client's real
  journey: identity → Start reviewing → the site → **Approve** (→ post-approval,
  read-only) *or* **Request changes** (→ send → the read-only "asked for changes"
  state) *or* **Comment** (place a pin → exit). This is the walk that tests all
  three questions.
- **"Gate C — bad-email path"** — starts at A0 typing → Start → validation-error,
  which **cannot proceed** (a wrong address is blocked). Use this to test
  question 2: does the identity step help or wall?

Wired so the frozen-snapshot story holds: after **Approve → View site** you land
on `post-approval-unchanged` (read-only), never back on the editable-looking
landing — so pressing Approve visibly means "I signed *this version*."

Edge/system states are **not** in the click-through (show them by hand if asked):
`post-approval-edited-since` (a later revisit), `expired-token`, `load-error`,
`loading`, and the two `brand-colour` variants.

## The frames to walk, in order

All on page **👤 Client review**, all 1280×900. (The prototype above walks the
interactive subset; this is the full state list for reference.)

```
S5.5 · loading                  the agency's name renders first
S5.5 · A0 · empty               who are you — no password, ever
S5.5 · A0 · typing
S5.5 · A0 · validation-error    wrong address, link still fine
S5.5 · landing-viewing          the site, and both exits
S5.5 · commenting               pin + composer
S5.5 · request-changes          what should Ali fix?
S5.5 · changes-requested        sent — read-only, her pins still visible
S5.5 · approved                 ← QUESTION 3 LIVES HERE
S5.5 · post-approval-unchanged
S5.5 · post-approval-edited-since   approval STANDS, marked stale
S5.5 · expired-token
S5.5 · load-error
S5.5 · A0 · returning-visitor   round 2 does not ask again
```

Plus the two brand variants, if the pilot agency has a brand colour set:
`S5.5 · brand-colour` and `S5.5 · brand-colour-fails-contrast`.

---

## What to write down

Not a score. Three sentences, in her words:

- what she thought the page was, before you said anything
- what she thought Approve meant, in her own words
- the first moment she hesitated

**The hesitation is the finding.** Everything else is confirmation.

---

## What a failure looks like, and what it costs

| If she… | Then | Cost to fix |
|---|---|---|
| cannot say what the page is | the header and the ask are wrong | copy — hours |
| resents the name/email step | identity capture moves after first comment, or goes optional | small; contracts §1.1 would need reopening |
| thinks Approve covers future work | **the frozen-snapshot contract has not landed** | copy first; if copy cannot fix it, the model is wrong and that is expensive |
| approves without reading | the page is too easy, not too hard — add friction at Approve | small |

The third row is the one that justifies the whole exercise. It is also the only
one that gets more expensive the longer it goes unasked.

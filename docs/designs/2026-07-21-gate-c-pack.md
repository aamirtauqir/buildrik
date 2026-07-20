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

## What blocks B, precisely

One argument.

```ts
// packages/editor/src/services/ReviewService.ts:20
export async function submitForReview(note?: string, changeSummary?: string) {
  await client.reviews.submit.mutate({ siteId, note, changeSummary });
  //                                                              ^
  //                                            clientEmail is never passed
}
```

Everything downstream already works and is walked end to end (ship plan §1):
`submitReviewInput` accepts `clientEmail`, `submitReview` mints a token when it
gets one, the invite email sends, and `/review/<token>` renders, identifies,
comments and approves against the real database.

Also needed for B: **decide the `agency_layer` flag** (`reviews.ts:32`) — turn it
on for the pilot workspace, or lift the gate. Client review is deliberately not
gated, so a legitimately issued link keeps working either way.

Neither is design work. Both are small. Neither is done.

---

## The frames to walk, in order

All on page **👤 Client review**, all 1280×900.

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

# The 45 large overprints are not 45 accidents. They are six templates.

The page-wide sweep found 94 OVERPRINT pairs. 49 are ≤60px — the classic
title/meta collision, handed to the automated fixer. The other 45 were held back
for a human read on the grounds that an overlap that large is more likely two
nodes that genuinely stack.

Reading them gives a better answer than that. **The overlaps cluster on exact
values, and an exact value repeated across sibling boards is one layout cloned,
not N mistakes.**

## The clusters

| overlap | count | boards |
|---|---|---|
| **248px** | **12** | `Media · grid`, `· filtered`, `· folder-scoped`, `· uploading`, `· upload-failed`, `· quota-warn`, `· quota-full`, `· empty`, `· load-error`, `· loading`, `· no-results`, `· 145:250` |
| 72px | 3 | `Media · drill-in · asset-detail` and its two variants |
| 268px | 3 | `Inspector · findability — search` variants |
| 256px | 2 | `[not-implemented] Media · local-only` |
| 96px | 2 | `Shell · Issues joins the grid` |
| 62px | 2 | `[not-implemented] Preview · access` |

**Twelve of the forty-five are one Media panel, cloned across every state it
has.** Fix the template's gutter once and twelve boards follow. Treating them as
twelve independent repairs would be twelve chances to diverge — and would produce
twelve boards that no longer agree with each other, which is worse than the
overlap.

## The singletons, worst first

```
380px  2476:11987  Canvas · empty page — first run
360px  1738:8394   Media · stock · search-failed
320px  2846:21575  AI · placement — what earns a door
214px  158:2       Review panel · re-send-confirm
178px  171:136     AI · not-configured
150px  2865:22206  Inspector · MOTION · one section
140px  2474:12031  Canvas · drop feedback — anatomy
135px  157:2       Review panel · detached-present
119px  1124:4562   S3.6 · media · optimise (drill-in)
107px  151:46      [not-implemented] Content · data-source
106px  158:105     Review panel · revoke-confirm
100px  2846:21667  AI · error-provider
```

At 300–380px on a panel board these are almost certainly a full-width heading
lying across a full-width body — two stacked paragraphs, not a missing gutter —
and shrinking the upper one to "the gap" would compute a negative width. The
fixer's floor would refuse them, correctly and uninformatively.

## Recommendation

1. **One decision on the Media panel template**, applied to all 12 state boards
   together. This is the single highest-value item in the whole 413 and it is one
   layout question, not twelve.
2. The 12 singletons above need a look at 1440×900 each — they are the boards
   where "what is actually on top of what" cannot be inferred from two ids and a
   number.
3. Nothing here goes through the automated fixer. It was written for a title with
   a timestamp beside it, and none of these is that.

**Not done in this arc.** Recorded with the node ids so it is one measurement
away from actionable, and explicitly NOT counted as repaired anywhere in
`COVERAGE.md`.

---

# Addendum — the one regression, and why no resize could fix it

The 49-pair repair regressed exactly one node, and chasing it produced a better
finding than the repair did.

`2866:21840` on board `2865:22227` (Inspector · multi-select) had a 6px
horizontal overlap. Narrowing it to clear that made it wrap, and it then stood
12px outside its parent — a bigger defect than the one removed. So far, an
ordinary bad trade, now prevented by a revert guard in the fixer.

**Then the revert failed too**, and reading the geometry says why:

```
parent   2866:21839  FRAME 300x20   layout=NONE  clipsContent=false
title    2866:21840  TEXT  16,0  266x32  "3 ELEMENTS SELECTED   [not-implemented]"
chevron  2866:21841  TEXT  276,0   6x12  "v"
```

The parent is a **20px row**. The chevron sits at x276, so the widest the title
may be without touching it is **248px** — and at 248 that string wraps to two
lines and stands 32px tall inside a 20px row.

**There is no width that both clears the chevron and fits on one line.** The
string is too long for the row, and no resize fixes that. My first revert
computed a width from the reported overlap and restored 266 — which kept the
wrap *and* the overlap, the worst of both.

The correct revert is not a width at all: restore `WIDTH_AND_HEIGHT`, exactly
what the chevron sibling uses, so the node sizes itself back to one line and the
pre-existing 6px touch returns. A 6px overlap with a chevron is the smaller
defect.

## The actual defect is editorial, not geometric

`[not-implemented]` was appended to a **20px row label**. That marker convention
works on a board name and in a caption; inside a row header it makes the string
longer than the row can hold, and every geometric repair after that is choosing
which symptom to show.

**Recorded, not fixed.** Moving the marker out of the row label is a decision
about where markers live, and this arc has already learned what happens when a
tool guesses at an editorial question — it painted a swatch accent blue and made
it contradict its own caption.

Worth checking whether other row labels carry the same marker; the census is not
done.

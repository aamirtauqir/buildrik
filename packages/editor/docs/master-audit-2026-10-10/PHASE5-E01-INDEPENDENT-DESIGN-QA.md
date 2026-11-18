# E01 independent design review

10 October 2026. Read-only review of [E01, node 8317:297](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8317-297), the current 1440×900 editor proposal. The removed 8315:2 is not reviewed. Evidence: [native bounds and typography](evidence/phase5-e01-native-review.json), [numerical token contrast](evidence/phase5-kit-contrast.json), screenshot `/tmp/buildrick-tobe-E01-review.png`, and shared helper `/tmp/buildrick-tobe-kit.js`. No Figma, browser or application mutation occurred. This is one screen review, not Phase 5 closure or accessibility certification.

## Confirmed

The native stage is 800px wide, matching 1440−60−280−300. The paper is 752px wide with 24px stage gutters. Its labelled 1200 CSS pixels therefore use scale 0.6266667. The hero's native 45.12px font equals 72 CSS px × scale; its line height is 115%. Inspector Size is 72px and Line height is 1.15. The displayed 63% is rounded, not a claim of exact 0.63 scale. The earlier 100%/1200 mismatch is absent from this reviewed frame.

The screenshot shows legible hierarchy, visible Style / Content / Effects tabs, device and Base-state context, and a clear bound token entry. Header, selection badge, toolbar, page tabs and current properties fit without visible glyph clipping. Inspector properties `8317:436` are explicitly clipped with VERTICAL overflow: 300×693, with current visible content ending around 597px. This is a deliberate scroll container, not accidental off-screen fields. The five-row Layers example fits its drawer; its current drawer overflow is NONE, so it does not demonstrate long-tree scrolling.

No canvas or paper content exceeds its current height. Page-content scrolling and long documents are not established by this static specimen. A native button's oversized text rectangle is also not automatically visible text clipping; the screenshot is the decisive check for these short labels.

## Three actionable concerns

| Concern | Evidence and scope | Proposed action before shared-kit closure |
|---|---|---|
|Field boundary contrast|The only visible rectangular boundary of white property inputs on a white panel uses `line #E4E8EF`, 1.229:1 against white. This is separate from decorative dividers, which need not carry input identity.|Introduce a stronger control-border token for default interactive inputs, or provide another sufficiently contrasting visual treatment that identifies the input area. Retain the pale token for decorative separators. Check focus/error/disabled separately.|
|Subtle token misuse risk|`subtle #98A2B3` is 2.575:1 against white and 2.379:1 against `bg #F4F6F9`. Current E01 meaningful labels use muted, so this is a kit restriction rather than a claim every E01 label fails. The faint image glyph accompanies readable Image text.|Restrict subtle to decoration/inactive controls; do not use it for meaningful metadata or available actions. Recheck workspace/helper `row(..., meta)` uses before mass reuse.|
|Button sizing resilience|Header and zoom instances keep 160px centered text frames inside 52–88px buttons, with negative local x positions and `clipsContent=false`. Example command button text x=−54, width160 in width52; screenshot glyphs currently fit. Selection pill also has a text frame extending beyond its clipped parent, though Heading glyphs fit.|Use intrinsic text width with minimum padding or a properly constrained FILL text node in the shared component. Otherwise explicitly validate each long/localized label and corresponding hit area. Do not count these frame overflows as seven observed clipped labels.|

WCAG's minimum text contrast is 4.5:1 for ordinary text, with exceptions including inactive controls; essential control-identifying visuals use 3:1 against adjacent colors. Apply these criteria to the actual role, not every separator. Sources retrieved 10 October 2026: [W3C text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [W3C non-text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

## Token checks

| Pair | Calculated ratio | Interpretation |
|---|---:|---|
|Ink / white|16.268|Ordinary text passes numerical threshold|
|Muted / white|4.975|Ordinary text passes|
|Muted / background|4.595|Ordinary text passes, with little margin|
|Canonical blue #1A56DB / white|6.180|Blue text and white button text pass|
|Blue / blue-soft|5.679|Active text passes|
|Green / green-soft|5.072|Status text passes|
|Red / red-soft|6.047|Error text passes|
|Amber / amber-soft|5.363|Warning text passes|
|Purple / white|6.620|Text passes|

Ratios derive from opaque sRGB token values, not screenshot antialiasing. This does not establish contrast for every composition, state or transparency in forthcoming screens.

## Critical design coverage still to verify

The interaction spec correctly treats resize conversion, finite keyboard resize, transaction-local Cancel, permission checks, provider assurance and persistence as engineering dependencies. Keep that distinction in native annotations: a good-looking handle, saved badge, masked key or retry button is not evidence those contracts are implemented. Preview remains a visual/content review under current sandbox boundaries. Proposed Style / Content / Effects is a relocation, with no new reverse-animation or commerce capabilities implied.

Before Phase 5 closure, use the forthcoming frames to verify a few material contracts: (1) 1024 single-dock/temporary chooser and 1280 long-content fit, including focus return; (2) mixed/locked/inherited/component examples and a reachable destination for each existing advanced control; (3) visible failed/unknown/local-only/backend-denied states and safe cancel/return. The all-55 type matrix records capability categories, not every field relocation or successful action. The all-60 finding matrix still needs actual native references and review status. These are pending design evidence, not reasons to invent new screens beyond the agreed families.

E01's current geometry and scale are suitable for continued composition. Resolve the shared-kit issues and review the forthcoming states before declaring the design complete. Native scroll flags alone do not prove usable prototype scrolling, and this review does not claim keyboard, focus, gestures or services were executed.

## Follow-up checkpoint

The stronger white-background input outline and FILL button labels were independently verified in the current native E01. See [the follow-up gate review](PHASE5-INDEPENDENT-GATE-REVIEW.md) for closure evidence, the remaining subtle-token restriction and expanded responsive review. The initial observations above remain as historical evidence.

# Native-tag support and Inspector route matrix

**120/120 shared allowlist entries classified.** This includes HTML and SVG, not120 catalog blocks. Source: `packages/shared/schemas/element-markup.ts:21`, `src/shared/utils/html/typeMapping.ts:30`, `src/engine/elements/manager/HTMLParser.ts:226`, `src/shared/utils/html/sanitization.ts:160–250`. Runtime:38 unique tags in registered block trees; other entries remain source-only. No claim of a specialized editor or import/output test for every tag.

## Resolver and preservation contract

BIC-C01–05 govern all entries. Actual native tag/namespace/input subtype/compound role qualifies internal ElementType; the parser falls back to container for many meaningful native tags. Preserve valid original markup and show its semantic label. Direct content/Attributes and Layers remain available where already supported, with explicit semantics/nesting guards proposed here. Read-only or deferred means the specialized authoring extension is deferred, not deletion of existing native edits. Never convert an imported valid native node just to fit the Inspector.

Inline phrasing can be stored as parent `content`, not independent engine nodes. In that case open the parent text editor at the inline range; do not invent a child ID. Node and inline-content routes must serialize the same safe native semantics. Unknown or forbidden tags follow current shared sanitizer (tree unknown tag→div with content retained; HTML sanitizer may strip unsafe markup), with import warnings proposed for material changes; never widen executable support.

All attributes use the shared allowed-name/URL/CSS boundary. Reserved module references require dedicated relationship editor/validation; free text changes cannot bypass linked IDs. Native labels are viewable even when the specialized operation is unavailable. New native control values rely on the approved field-specific design and native validity rules, not a universal numeric/string converter.

## Route contracts

### N12 — Links

B69-link; Content label/text, Behaviour destination/target/rel, actual safe URL/page/section reference and same source writer. Nested interactive content is guarded; native link stays distinct from button action.

### N01 — Text and phrasing

Content → actual text/inline editor, semantic tag/allowed attributes; Style → applicable typography. Preserve inline markup and language/direction/time/cite values. Complex ruby editing is preserved native content, not a new phonetic authoring tool.

### N02 — Headings

B69-heading; heading level is native tag, same content/ID retained; no responsive heading-level setting.

### N03 — Structural landmarks

B69-container/section/navbar/footer as actual native semantics warrant; Content → children/attributes. Figure and quote associations remain real child structure. Specialized landmark/publishing behavior is not inferred from generic container type.

### N04 — Lists

B69-list for ordered/unordered items; dt/dd association preserved as semantic pair and generic native tree edit. No auto-conversion of description lists into li; native list style/number attrs where applicable.

### N05 — Native forms

B69 form/native field resolver; options target select/optgroup; fieldset/legend retain group identity. Datalist and output preserve native attrs/children; bespoke calculation/suggestions builder deferred. No fictitious output calculation API.

### N06 — Media and sources

B69-image/video/audio; source/track attributes belong to exact node in enclosing media/picture, not arbitrary layout children. Picture source selection and srcset preserved; responsive picture visual source authoring deferred, native editing remains.

### N07 — Tables

B69-table; row/cell/header/column semantics qualify generic container family. Preserve spans/headers/scope/caption and valid native structure; complex imported spans use specified guard, not flattening.

### N08 — Native disclosure and dialog

Content native attrs/text and actual children; details open is authored initial state, preview toggle is temporary. Summary stays associated first summary; no free invalid reorder. Native dialog is not assumed to be Buildrick Modal; B69-modal linkage only on proof. Authoring open/close targets beyond preserved native attrs requires that contract, no automatic runtime wiring.

### N09 — Native metrics

Content value/min/max and supporting native attrs on actual node; meter low/high/optimum kept. Native progress uses max/value; omitting value is indeterminate. B69-progress compound only where structure proved. No percent wrapper mutation for generic native element.

### N10 — Void separators

B69-divider for hr; br/wbr semantic break, no content/children controls. Preserve break location in parent inline content; no padding/drop UI pretending a container.

### N11 — SVG subtree

B69-svg/icon representation resolver. SVG namespace qualifies text/title. Content → native attributes; Preserve viewBox, geometry/paint paths, fragment references and content. Dedicated vector/gradient/filter graph editor deferred; generic HTML layout/nesting controls suppressed. SVG resources are local native nodes, not automatically Brand tokens.

## Every allowlisted entry

| Native tag | Contract | Evidence |
|---|---|---|
|`a`|N12|Observed in registered fixture model|
|`abbr`|N01|Not exercised by registry survey; source allowlisted only|
|`address`|N03|Not exercised by registry survey; source allowlisted only|
|`article`|N03|Observed in registered fixture model|
|`aside`|N03|Not exercised by registry survey; source allowlisted only|
|`audio`|N06|Observed in registered fixture model|
|`b`|N01|Not exercised by registry survey; source allowlisted only|
|`bdi`|N01|Not exercised by registry survey; source allowlisted only|
|`bdo`|N01|Not exercised by registry survey; source allowlisted only|
|`blockquote`|N03|Observed in registered fixture model|
|`br`|N10|Not exercised by registry survey; source allowlisted only|
|`button`|N05|Observed in registered fixture model|
|`caption`|N07|Not exercised by registry survey; source allowlisted only|
|`cite`|N01|Observed in registered fixture model|
|`code`|N01|Not exercised by registry survey; source allowlisted only|
|`col`|N07|Not exercised by registry survey; source allowlisted only|
|`colgroup`|N07|Not exercised by registry survey; source allowlisted only|
|`data`|N01|Not exercised by registry survey; source allowlisted only|
|`datalist`|N05|Not exercised by registry survey; source allowlisted only|
|`dd`|N04|Not exercised by registry survey; source allowlisted only|
|`del`|N01|Not exercised by registry survey; source allowlisted only|
|`details`|N08|Not exercised by registry survey; source allowlisted only|
|`dfn`|N01|Not exercised by registry survey; source allowlisted only|
|`dialog`|N08|Not exercised by registry survey; source allowlisted only|
|`div`|N03|Observed in registered fixture model|
|`dl`|N04|Not exercised by registry survey; source allowlisted only|
|`dt`|N04|Not exercised by registry survey; source allowlisted only|
|`em`|N01|Not exercised by registry survey; source allowlisted only|
|`fieldset`|N05|Not exercised by registry survey; source allowlisted only|
|`figcaption`|N03|Not exercised by registry survey; source allowlisted only|
|`figure`|N03|Not exercised by registry survey; source allowlisted only|
|`footer`|N03|Observed in registered fixture model|
|`form`|N05|Observed in registered fixture model|
|`h1`|N02|Observed in registered fixture model|
|`h2`|N02|Observed in registered fixture model|
|`h3`|N02|Observed in registered fixture model|
|`h4`|N02|Not exercised by registry survey; source allowlisted only|
|`h5`|N02|Not exercised by registry survey; source allowlisted only|
|`h6`|N02|Not exercised by registry survey; source allowlisted only|
|`header`|N03|Not exercised by registry survey; source allowlisted only|
|`hgroup`|N03|Not exercised by registry survey; source allowlisted only|
|`hr`|N10|Observed in registered fixture model|
|`i`|N01|Not exercised by registry survey; source allowlisted only|
|`img`|N06|Observed in registered fixture model|
|`input`|N05|Observed in registered fixture model|
|`ins`|N01|Not exercised by registry survey; source allowlisted only|
|`kbd`|N01|Not exercised by registry survey; source allowlisted only|
|`label`|N05|Observed in registered fixture model|
|`legend`|N05|Not exercised by registry survey; source allowlisted only|
|`li`|N04|Observed in registered fixture model|
|`main`|N03|Not exercised by registry survey; source allowlisted only|
|`mark`|N01|Not exercised by registry survey; source allowlisted only|
|`menu`|N04|Not exercised by registry survey; source allowlisted only|
|`meter`|N09|Not exercised by registry survey; source allowlisted only|
|`nav`|N03|Observed in registered fixture model|
|`ol`|N04|Not exercised by registry survey; source allowlisted only|
|`optgroup`|N05|Not exercised by registry survey; source allowlisted only|
|`option`|N05|Observed in registered fixture model|
|`output`|N05|Not exercised by registry survey; source allowlisted only|
|`p`|N01|Observed in registered fixture model|
|`picture`|N06|Not exercised by registry survey; source allowlisted only|
|`pre`|N01|Not exercised by registry survey; source allowlisted only|
|`progress`|N09|Observed in registered fixture model|
|`q`|N01|Not exercised by registry survey; source allowlisted only|
|`rp`|N01|Not exercised by registry survey; source allowlisted only|
|`rt`|N01|Not exercised by registry survey; source allowlisted only|
|`ruby`|N01|Not exercised by registry survey; source allowlisted only|
|`s`|N01|Not exercised by registry survey; source allowlisted only|
|`samp`|N01|Not exercised by registry survey; source allowlisted only|
|`search`|N03|Not exercised by registry survey; source allowlisted only|
|`section`|N03|Observed in registered fixture model|
|`select`|N05|Observed in registered fixture model|
|`small`|N01|Not exercised by registry survey; source allowlisted only|
|`source`|N06|Observed in registered fixture model|
|`span`|N01|Observed in registered fixture model|
|`strong`|N01|Observed in registered fixture model|
|`sub`|N01|Not exercised by registry survey; source allowlisted only|
|`summary`|N08|Not exercised by registry survey; source allowlisted only|
|`sup`|N01|Not exercised by registry survey; source allowlisted only|
|`table`|N07|Observed in registered fixture model|
|`tbody`|N07|Observed in registered fixture model|
|`td`|N07|Observed in registered fixture model|
|`textarea`|N05|Observed in registered fixture model|
|`tfoot`|N07|Not exercised by registry survey; source allowlisted only|
|`th`|N07|Observed in registered fixture model|
|`thead`|N07|Observed in registered fixture model|
|`time`|N01|Not exercised by registry survey; source allowlisted only|
|`tr`|N07|Observed in registered fixture model|
|`track`|N06|Not exercised by registry survey; source allowlisted only|
|`u`|N01|Not exercised by registry survey; source allowlisted only|
|`ul`|N04|Observed in registered fixture model|
|`var`|N01|Not exercised by registry survey; source allowlisted only|
|`video`|N06|Observed in registered fixture model|
|`wbr`|N10|Not exercised by registry survey; source allowlisted only|
|`svg`|N11|Observed in registered fixture model|
|`circle`|N11|Observed in registered fixture model|
|`ellipse`|N11|Not exercised by registry survey; source allowlisted only|
|`line`|N11|Not exercised by registry survey; source allowlisted only|
|`path`|N11|Observed in registered fixture model|
|`polygon`|N11|Not exercised by registry survey; source allowlisted only|
|`polyline`|N11|Not exercised by registry survey; source allowlisted only|
|`rect`|N11|Not exercised by registry survey; source allowlisted only|
|`g`|N11|Not exercised by registry survey; source allowlisted only|
|`defs`|N11|Not exercised by registry survey; source allowlisted only|
|`use`|N11|Not exercised by registry survey; source allowlisted only|
|`symbol`|N11|Not exercised by registry survey; source allowlisted only|
|`text`|N11|Not exercised by registry survey; source allowlisted only|
|`tspan`|N11|Not exercised by registry survey; source allowlisted only|
|`title`|N11|Not exercised by registry survey; source allowlisted only|
|`desc`|N11|Not exercised by registry survey; source allowlisted only|
|`lineargradient`|N11|Not exercised by registry survey; source allowlisted only|
|`radialgradient`|N11|Not exercised by registry survey; source allowlisted only|
|`stop`|N11|Not exercised by registry survey; source allowlisted only|
|`mask`|N11|Not exercised by registry survey; source allowlisted only|
|`clippath`|N11|Not exercised by registry survey; source allowlisted only|
|`filter`|N11|Not exercised by registry survey; source allowlisted only|
|`fegaussianblur`|N11|Not exercised by registry survey; source allowlisted only|
|`feoffset`|N11|Not exercised by registry survey; source allowlisted only|
|`femerge`|N11|Not exercised by registry survey; source allowlisted only|
|`femergenode`|N11|Not exercised by registry survey; source allowlisted only|

## Acceptance / exceptions

- T-NATIVE-01: every allowlist entry has exactly one route; SVG text is not misclassified as HTML text.
- T-NATIVE-02: import table spans, picture/source/track, select/optgroup, details/summary, fieldset/legend, SVG defs/use and inline ruby. Open/close Inspector without changes must preserve IDs/native attrs/content; no extra container defaults.
- T-NATIVE-03: selected option/source/tr/path uses named semantic owner and permitted attributes, with no invalid generic insert targets. Existing valid raw/native editing is retained.
- T-NATIVE-04: unknown/forbidden tag ingestion is reported accurately; safe-tree fallback never claims full custom element execution.
- T-NATIVE-05: imported primitive dialog is not guessed into the Buildrick Modal pair; existing props remain visible, explicit repair must identify actual trigger.

Only T-NATIVE-01 source enumeration was checked in this task. Native import/edit/save/output acceptance remains NOT RUN. These tests must be added/executed during implementation; no app code changed.

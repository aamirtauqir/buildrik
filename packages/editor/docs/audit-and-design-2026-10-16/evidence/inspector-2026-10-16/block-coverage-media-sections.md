# BIC-01 — Media and section block specifications

Normative annex to FD-INS-03. All edits below are selected design proposals, not implemented corrections. BIC-C01–05 and FD-INS-02 IC/II contracts apply, including dimensions, draft timing, permissions, source/reset and Undo. Runtime evidence is limited to registered insertion/selection/default panel; external assets, playback and output not exercised.

## B69-image

Source: `src/blocks/Media/Image.tsx` (block config/build symbol). **Builder and related consumers located in code. Registered insert, returned target and default Inspector observed in block-runtime-survey.json; proposed edits/output not runtime verified.**

**Existing architecture:** img root; initial alt="Image", no src. Empty source intentionally opens Assets pick flow. mediaBodies.tsx:65–76 and SourceRow.tsx:79–117; binding remains M07 image binding.

**Gap and consequence:** An empty alt can mean intentional decoration or unfinished description; old hint treats both alike. Asset replacement must not change shared file or erase per-usage alt/binding.

**Decision:** Move + Redesign. **Owner:** Selected image owns src, alt, loading/decoding and CMS binding. Asset record owns file/metadata; local alt stays local.

**Exact editing home:** Content → Image/source, accessibility and loading; Style → Fit/size; Behaviour → existing applicable actions.

**Controls and validation:**

- Source: existing image Assets picker or safe existing URL through Attributes; empty is no file, not a successful image. Preserve image srcset/sizes on replacement; show responsive sources present and require explicit review before replacing the full source set.
- Accessibility mode: Described / Decorative / Unset. Infer Described from nonempty alt, Decorative from existing empty alt, Unset from absent alt; do not rewrite existing files on opening. Proposed decorative switch sets alt=""; disable description while retaining session draft. Described requires nonblank text on commit; unavailable description remains visibly Unset without blocking unrelated style edits.
- Loading: Browser default (remove attr), Lazy, Eager. Decoding through existing advanced attributes (auto/async/sync); do not fabricate a new existing control. Fit cover/contain/fill plus preserved custom CSS; no unit conversion.

**End-to-end flow:** Select image → Content → Choose/Replace → exact filtered Assets picker labelled For <image> → choose confirmed asset → revalidate target/permission → one local commit → return focus to Source. Cancel/failed upload retains current src and description; broken-file state offers Retry/Replace with existing reference intact.

**Preservation / compatibility:** Preserve element ID, alt, source-set, binding, crop/fit/styles and all other asset usages. A bound source needs existing binding replacement/disconnect decision; never silently turn binding into static src.

**Acceptance — not yet run against redesign:**

- T-B69-image-1: Pick a new file on one of two usages: only that local src changes; Undo restores source/presence.
- T-B69-image-2: Absent alt, empty alt and meaningful alt remain distinct through reopen; selecting Decorative changes only alt.
- T-B69-image-3: Stale picker return, failed asset fetch and locked target cause no mutation; keep original binding.

**Shared states/interaction:** BIC-C01–05: loading/empty/error are distinct; live valid commit, retained invalid draft, stale-request guard, real owner/ancestor locks, stable return/focus, explicit same-shape batch eligibility; structural edits single compound target and one atomic Undo. Missing preview/service parity stays unverified.

## B69-video

Source: `src/blocks/Media/Video.tsx` (block config/build symbol). **Builder and related consumers located in code. Registered insert, returned target and default Inspector observed in block-runtime-survey.json; proposed edits/output not runtime verified.**

**Existing architecture:** video > source(type=video/mp4, empty src). SourceRow reads parent src then first source; attributeWriter.ts:125–143 writes parent and first source. mediaBodies.tsx:93–120 controls playback and poster.

**Gap and consequence:** A replacement can leave stale source MIME and inconsistent fallback sources. Native source/track descendants are container types and cannot be treated as ordinary layout containers.

**Decision:** Move + Fix. **Owner:** Video owns playback/poster; each native source owns URL/MIME/media query, each track owns captions. No duplicate independent parent/child sources.

**Exact editing home:** Content → Video/Source, Poster, Advanced sources/tracks; Behaviour → Playback; Style → Fit/size.

**Controls and validation:**

- Primary source choice preserves legacy representation on read. For the simple one-source preset, replacement atomically updates parent src and first source src and MIME from trusted asset metadata (remove stale MIME if unknown). Never infer MIME from a filename. Multiple source or track children switch Source to “Multiple sources” with child rows; parent src continues to take precedence if present and is explicitly identified.
- Sources rows: src URL, optional MIME type, optional media condition; existing raw custom values preserved. Add/reorder/remove via BIC-C02 with no automatic codec conversion. Parent src remove is a separate “Use source list” action with impact preview; no false claim fallback sources currently drive playback.
- Poster: image URL/picker, Clear removes poster only. Playback: Autoplay, Muted, Loop, Show controls, Plays inline; absence off, controls starts on in preset. Boolean off removes native attribute (not string false). Warn when autoplay has sound; browser may refuse playback. Preload none/metadata/auto/absent in Content advanced attributes.
- Caption track editing through native Attributes: src, kind(subtitles/captions/descriptions/chapters/metadata), srclang, label, default boolean. Keep other tracks. No invented caption-upload service.

**End-to-end flow:** Choose video → inspect source name/error → choose poster independently → configure Playback → explicitly preview output → stop preview restores editor context and playhead is not saved content. Choosing source/track child opens its native content fields and Back to Video; failed request keeps previous file.

**Preservation / compatibility:** Keep fallback text, all source/track IDs and ordering, poster and CMS/custom attrs. Replace-one-source is one Undo. Clearing media source never deletes the asset. Native-tag-aware controls are proposed extension.

**Acceptance — not yet run against redesign:**

- T-B69-video-1: Replace mp4 with different trusted MIME and Undo restores both src and type.
- T-B69-video-2: A two-source+captions import is not flattened by opening or changing poster.
- T-B69-video-3: Toggle each native boolean off: exported attr absent; edit mode never autoplay-submits or navigates.

**Shared states/interaction:** BIC-C01–05: loading/empty/error are distinct; live valid commit, retained invalid draft, stale-request guard, real owner/ancestor locks, stable return/focus, explicit same-shape batch eligibility; structural edits single compound target and one atomic Undo. Missing preview/service parity stays unverified.

## B69-audio

Source: `src/blocks/Media/Audio.tsx` (block config/build symbol). **Builder and related consumers located in code. Registered insert, returned target and default Inspector observed in block-runtime-survey.json; proposed edits/output not runtime verified.**

**Existing architecture:** audio controls > source(type=audio/mpeg, empty src) plus fallback text. Audio uses same SourceRow and handleVideoSrcChange as video.

**Gap and consequence:** Shared source writer needs audio-specific MIME and all-source preservation; no poster/visual fit required.

**Decision:** Move + Fix. **Owner:** Audio and its source children, same native media ownership as B69-video.

**Exact editing home:** Content → Audio/source/fallback text/preload; Behaviour → Playback; Style → element box.

**Controls and validation:**

- Choose audio filtered asset picker; source list contract equals video with audio-compatible files. Existing fallback text remains editable as its actual child, not replacement of entire audio subtree.
- Show controls, Loop, Autoplay; absent flag off and native off removes attr. Optional existing muted attr preserved in Advanced even where no current Audio toggle exists. Preload none/metadata/auto/absent. No poster control.

**End-to-end flow:** Select audio → choose confirmed file → verify source reference → set playback flags → preview with user-initiated Play. Stop/Cancel returns same selection and draft. Source failure keeps file reference with Retry/Replace, not misleading No file.

**Preservation / compatibility:** Preserve MIME/source fallback, track children if present, content and custom attrs. No conversion or new hosted audio service.

**Acceptance — not yet run against redesign:**

- T-B69-audio-1: New audio file updates source MIME atomically; Undo matches original.
- T-B69-audio-2: Audio controls never show video poster or icon stroke.
- T-B69-audio-3: Fallback text and multiple sources survive file inspection, cancel and reopen.

**Shared states/interaction:** BIC-C01–05: loading/empty/error are distinct; live valid commit, retained invalid draft, stale-request guard, real owner/ancestor locks, stable return/focus, explicit same-shape batch eligibility; structural edits single compound target and one atomic Undo. Missing preview/service parity stays unverified.

## B69-svg

Source: `src/blocks/Media/SVG.tsx` (block config/build symbol). **Builder and related consumers located in code. Registered insert, returned target and default Inspector observed in block-runtime-survey.json; proposed edits/output not runtime verified.**

**Existing architecture:** svg root contains circle child; inline editable vector markup. SourceRow.tsx:99–107 removes shapes and changes native tag to img when choosing an SVG asset, while ElementType remains svg.

**Gap and consequence:** Existing Replace can silently destroy inline vector structure. A file-backed SVG with type=svg still needs image alt fields; a type-only switch is inadequate.

**Decision:** Redesign + Fix. **Owner:** Inline SVG owns native subtree and vector attrs; file-backed img owns src/alt. Asset is a separate shared object.

**Exact editing home:** Content → SVG/source and representation; Style → box; native SVG child attributes in Content → Attributes.

**Controls and validation:**

- Representation readout: Inline SVG / SVG image. Inline → Choose file opens explicit “Replace inline drawing with SVG image” impact showing descendant count, styles/references and Undo availability. Actions Keep inline / Replace with file. No mutation until confirmed asset is ready; ambiguous external refs block replacement and offer inspect usages.
- For img representation expose image alt/accessibility/loading contract; for inline expose existing viewBox/role/aria-labelledby/title via attributes/child selection. Decorative inline is explicit aria-hidden=true; do not apply img-only alt to svg.
- Unknown valid vector paths/transforms preserved. Vector-node/path authoring and file→inline conversion are deferred; current native Attributes remain accessible with sanitizer rules, and no silent conversion.

**End-to-end flow:** Select SVG → Content identifies actual representation → inspect native shape via Layers or choose file → review impact → commit complete subtree replacement in one Undo → return same element identity. Cancel/error keeps exact original shapes. Back to SVG restores context from shape.

**Preservation / compatibility:** Retain root ID, surrounding layout and nonconflicting attributes. One Undo restores tag, content, child IDs and references; no partial removal on failed fetch. This documents correction to current destructive behavior, not implemented fix.

**Acceptance — not yet run against redesign:**

- T-B69-svg-1: Inline circle→asset Cancel yields byte-equivalent document; confirmed replacement→Undo restores all children.
- T-B69-svg-2: A legacy ElementType=svg/tag=img exposes alt and source; opening does not convert it again.
- T-B69-svg-3: Referencing use/mask/title IDs cannot be orphaned by replacement.

**Shared states/interaction:** BIC-C01–05: loading/empty/error are distinct; live valid commit, retained invalid draft, stale-request guard, real owner/ancestor locks, stable return/focus, explicit same-shape batch eligibility; structural edits single compound target and one atomic Undo. Missing preview/service parity stays unverified.

## B69-icon

Source: `src/blocks/Media/Icon.tsx` (block config/build symbol). **Builder and related consumers located in code. Registered insert, returned target and default Inspector observed in block-runtime-survey.json; proposed edits/output not runtime verified.**

**Existing architecture:** Icon build creates icon span with inline SVG string; data-icon-name/library/size/color/stroke. Default star32px, stroke2, white. mediaBodies.tsx:123–173 + attributeWriter icon functions.

**Gap and consequence:** One body also serves SVG; icon-only actions must check actual target subtype. Glyph replacement currently targets primary element only; batch promises must be explicit.

**Decision:** Move + Fix. **Owner:** Icon element owns glyph/config and local appearance. Icon library is source catalog, not component definition.

**Exact editing home:** Content → Icon/Change icon + accessible name; Style → Icon size, stroke, colour and box.

**Controls and validation:**

- Change icon uses existing supported library picker. Preserve existing library/name identity; unavailable glyph reports unavailable with retained markup.
- Size finite presets16/20/24/32/48/64px; stroke1/1.5/2/2.5/3 unitless. Custom saved values remain Custom, not auto-rounded. Keep existing config writer as authoritative and synchronize rendered SVG size/stroke/style; no independent CSS field with conflicting effective meaning.
- Single icon glyph replacement initially supported; multi-selection appearance permitted only for actual icons with compatible writers. SVG+icon mixed selection never receives icon data attrs. Accessible name/decorative state uses span/svg relationships; icon inside labelled button may be decorative without clearing button text.

**End-to-end flow:** Select actual icon → Change icon → existing picker opens current choice → choose → root identity/config preserved, SVG replaced → return. Cancel/stale request no change; selected unavailable glyph keeps old drawing until explicit replacement.

**Preservation / compatibility:** Preserve role/name/decorative attrs and surrounding link/button. Do not treat repeated SVG markup as shared component edit. Default white icon low contrast is a preset validation issue; show contrast against actual surface, do not silently recolour saved icons.

**Acceptance — not yet run against redesign:**

- T-B69-icon-1: Replace star and Undo restores exact SVG+config.
- T-B69-icon-2: Custom size, unknown library and icon+SVG mixed selection are represented honestly.
- T-B69-icon-3: Changing size/stroke updates intended rendered glyph and survives reopen without double size source.

**Shared states/interaction:** BIC-C01–05: loading/empty/error are distinct; live valid commit, retained invalid draft, stale-request guard, real owner/ancestor locks, stable return/focus, explicit same-shape batch eligibility; structural edits single compound target and one atomic Undo. Missing preview/service parity stays unverified.

## B69-lottie

Source: `src/blocks/Media/Lottie.tsx` (block config/build symbol). **Builder and related consumers located in code. Registered insert, returned target and default Inspector observed in block-runtime-survey.json; proposed edits/output not runtime verified.**

**Existing architecture:** Marked div with data-lottie-src and placeholder span. embedBodies.tsx:100–104; parseEmbedUrl.ts:154–172 supports lottie.host UUID/(json|lottie) only; generated iframe is output, not stored child.

**Gap and consequence:** Generic “Animation URL” implies arbitrary JSON hosting. Current provider is narrower; placeholder child must not masquerade as animation timeline.

**Decision:** Move + Fix. **Owner:** Element data-lottie-src; provider owns playback; Buildrick owns outer box and saved source.

**Exact editing home:** Content → Animation/source; Style → size; Behaviour only existing applicable visibility/interactions.

**Controls and validation:**

- Label “LottieFiles URL”; accept exactly current parseEmbedUrl lottie rules, max2048 characters, optional https scheme normalization through parser. Unsupported hosts/paths show “Use a supported lottie.host file link”; retain draft and prior preview until valid commit.
- No new speed, frame range or autoplay controls: provider iframe has no traced authoring API. Preserve unknown saved attrs; do not claim raw local JSON upload. Clear source removes attr explicitly and returns placeholder, not a successful player.

**End-to-end flow:** Select animation → paste supported link → identified provider → commit → generated frame loads or shows external-player failure with Retry. Return from Preview restores editor selection; provider internal playback state is not project content.

**Preservation / compatibility:** Keep placeholder children and outer style; generated iframe is not selectable saved tree content. Native source and empty vs unavailable states persist distinctly.

**Acceptance — not yet run against redesign:**

- T-B69-lottie-1: Supported link generates allowed provider frame in canvas/preview/export.
- T-B69-lottie-2: Unsupported/raw JSON URL produces local error and no unsafe iframe; Cancel retains old source.
- T-B69-lottie-3: No controls imply unsupported playback/timeline capability.

**Shared states/interaction:** BIC-C01–05: loading/empty/error are distinct; live valid commit, retained invalid draft, stale-request guard, real owner/ancestor locks, stable return/focus, explicit same-shape batch eligibility; structural edits single compound target and one atomic Undo. Missing preview/service parity stays unverified.

## B69-gallery

Source: `src/blocks/Media/ImageGallery.tsx` (block config/build symbol). **Builder and related consumers located in code. Registered insert, returned target and default Inspector observed in block-runtime-survey.json; proposed edits/output not runtime verified.**

**Existing architecture:** Gallery root > .buildrick-gallery-grid > three img children. Each img has its own src/alt; capability table treats gallery as container and live default panel is generic Layout.

**Gap and consequence:** Root family coverage does not provide image ordering, item target or grid-owner clarity. No traced lightbox/gallery service in inspected paths.

**Decision:** Extend + Redesign. **Owner:** Root owns gallery container; inner grid owns layout; image children own source/alt/bindings.

**Exact editing home:** Content → Images; Style → Gallery layout (explicit target inner grid); actual image Inspector via Edit image.

**Controls and validation:**

- Images rows display thumbnail, local alt/name, stable target ID; select one to reveal Edit image, Move up/down, Duplicate, Remove. Add images opens existing image picker multi-pick only if supported; otherwise repeat Add image, no invented asset API. Insert image child into proven grid only.
- Empty images → Add image; search no results distinct from asset failure. No array mirror: list derived from actual tree, including linked/custom wrappers as preserved advanced items.
- Columns/gap remain actual grid CSS via common Style writer and active breakpoint; current generated grid has no specialized data count. No hardcoded 3 fallback on read. No lightbox/timeline proposed.

**End-to-end flow:** Select gallery → Images row → Edit image opens child Inspector with Gallery › Image breadcrumb → source/alt → Back to Gallery restores list row/scroll. Reorder one ID atomically; remove reports affected bindings/references and Undo restores position. Unknown structures keep native children navigation until explicit safe adapter proof.

**Preservation / compatibility:** Never flatten image wrappers or unrelated gallery children. Grid layout shortcut names real owner and uses same writer as direct grid selection; changing child source remains local.

**Acceptance — not yet run against redesign:**

- T-B69-gallery-1: Reorder image2 before1 preserves alt and ID, Undo restores original order.
- T-B69-gallery-2: Parent gap writes grid owner at active breakpoint, not gallery root.
- T-B69-gallery-3: Custom linked gallery image remains intact; broken/missing asset gives correct state.

**Shared states/interaction:** BIC-C01–05: loading/empty/error are distinct; live valid commit, retained invalid draft, stale-request guard, real owner/ancestor locks, stable return/focus, explicit same-shape batch eligibility; structural edits single compound target and one atomic Undo. Missing preview/service parity stays unverified.

## B69-video-embed

Source: `src/blocks/Media/VideoEmbed.tsx` (block config/build symbol). **Builder and related consumers located in code. Registered insert, returned target and default Inspector observed in block-runtime-survey.json; proposed edits/output not runtime verified.**

**Existing architecture:** Marked div with placeholder children and legacy padding-bottom:56.25%/height0. Saved data-embed-url and ratio/player flags. embedBodies.tsx:64–93; embedFrameHTML.ts generates allowed iframe.

**Gap and consequence:** Ratio currently clears legacy base layout; layout/layer correction must be atomic and never destroy custom box. URL parse failure currently uses broad message for unrelated providers.

**Decision:** Move + Fix. **Owner:** Element saved embed attrs own provider/flags/ratio; iframe is derived output. Outer CSS owns placement.

**Exact editing home:** Content → Video URL; Style → Embed ratio; Behaviour → Playback.

**Controls and validation:**

- URL supports current YouTube/watch/embed/short/live and Vimeo/public/unlisted parser forms; max2048; preserve Vimeo hash. Invalid input message specific to YouTube/Vimeo. Do not fetch arbitrary iframe HTML.
- Ratio16:9/4:3/1:1 stored data-embed-ratio applies across breakpoints; show “All breakpoints” even in Style because model is attribute. Unknown stored ratio preserved Custom and not coerced on focus. Legacy padding/height removed only when exact legacy box is proved, in same transaction; unrelated author styles remain.
- Autoplay/Muted default off; controls default on. Data boolean off representation must match parser: remove autoplay/muted, controls false explicitly; empty autoplay/muted means on. Warning sound autoplay may be blocked. No loop switch without parser support.

**End-to-end flow:** Paste → provider detected → commit → render frame; change ratio shows scope and preserves current selection → preview explicitly; failure keeps accepted URL and allows Retry. Clearing URL is separate explicit action restoring existing placeholder. Stop preview returns context.

**Preservation / compatibility:** Preserve source URL identity/hash, fallback children, custom dimensions and flags. All writers use parseEmbedUrl/embedFrameHTML shared output; no duplicated provider resolver.

**Acceptance — not yet run against redesign:**

- T-B69-video-embed-1: YouTube/Vimeo ratio and flags produce matching canvas/preview/export config.
- T-B69-video-embed-2: Autoplay off removes data attr, not empty on-value.
- T-B69-video-embed-3: Legacy box cleanup and ratio one Undo; custom padding/height not deleted.

**Shared states/interaction:** BIC-C01–05: loading/empty/error are distinct; live valid commit, retained invalid draft, stale-request guard, real owner/ancestor locks, stable return/focus, explicit same-shape batch eligibility; structural edits single compound target and one atomic Undo. Missing preview/service parity stays unverified.

## B69-map-embed

Source: `src/blocks/Media/MapEmbed.tsx` (block config/build symbol). **Builder and related consumers located in code. Registered insert, returned target and default Inspector observed in block-runtime-survey.json; proposed edits/output not runtime verified.**

**Existing architecture:** Marked div, height400px, placeholder content. data-embed-url accepts address, coordinates or supported Google Maps link; parseEmbedUrl.ts:100–151 truncates query at200.

**Gap and consequence:** Current parser can silently shorten location. No zoom/style/geocoding precision control traced.

**Decision:** Move + Fix. **Owner:** Element location string owns generated map target; third-party map owns interaction.

**Exact editing home:** Content → Location; Style → size; no untraced map settings.

**Controls and validation:**

- Label “Address, coordinates or Google Maps link”. Preserve raw source up to2048; for every decoded extracted query (plain address, URL q/query, place/search path or coordinates) longer200 reject commit with “Use an address of 200 characters or fewer” instead of silent truncation. Existing longer values read as Legacy value with exact text preserved until explicit correction; do not auto-rewrite on open.
- Coordinate form if explicitly entered as lat,lng: finite numbers latitude−90…90, longitude−180…180. Noncoordinate address remains text; unsupported/short provider link says use full supported Google Maps link. Google Maps pb embed payload follows URL2048 limit separately and is not treated as a200-character query. No pretend location validation from client parser.
- Clear restores placeholder. No API key, pins, multiple locations, zoom or paid service added.

**End-to-end flow:** Enter location → validate supported syntax → identify Google Maps → commit → third-party load/failure; Retry retains location. Returning to canvas keeps breakpoint/zoom. Result correctness requires user preview, no geocoding success claim.

**Preservation / compatibility:** Preserve iframe-generation boundary and custom dimensions. New validation is a proposed correction; shared parser must enforce same constraints across writers without deleting old data.

**Acceptance — not yet run against redesign:**

- T-B69-map-embed-1: 201-character plain query and decoded supported URL q/query/place/search query blocked without silent truncation; valid pb embed payload is not truncated;2049 URL blocked.
- T-B69-map-embed-2: lat,lng bounds and unsupported host produce precise local feedback.
- T-B69-map-embed-3: Load error distinct from empty source; saved location unchanged.

**Shared states/interaction:** BIC-C01–05: loading/empty/error are distinct; live valid commit, retained invalid draft, stale-request guard, real owner/ancestor locks, stable return/focus, explicit same-shape batch eligibility; structural edits single compound target and one atomic Undo. Missing preview/service parity stays unverified.

## B69-hero

Source: `src/blocks/Sections/HeroSection.tsx` (block config/build symbol). **Builder and related consumers located in code. Registered insert, returned target and default Inspector observed in block-runtime-survey.json; proposed edits/output not runtime verified.**

**Existing architecture:** section.hero > content div > h1,p,a. Config declares attributes metadata title/subtitle/buttonText/buttonUrl/background/height, but insertBlock HTML branch does not materialize that metadata as editable properties.

**Gap and consequence:** Metadata must not be presented as authoritative values disconnected from child content.

**Decision:** Keep + Regroup. **Owner:** Actual section/native descendants own their properties. Section presets are not automatically shared component definitions.

**Exact editing home:** Content → Children: Heading, Description, Link; Style root Fill/spacing, inner container layout; child Link Behaviour for destination.

**Controls and validation:**

- Children shortcuts resolve actual stable IDs, not child position. Heading level H1–H6 at child; description text at p; label/destination at link. Root background colour/image in Style through existing fill writer.
- Custom or missing child becomes “Not present” with Select in Layers or existing Add path; do not regenerate preset on editing title. No new root title/buttonUrl store.

**End-to-end flow:** Select Hero → Children → Heading → edit text/level → Back to Hero → Link → destination → Back. Child deletion is ordinary scoped deletion, not whole section. Reordering uses actual wrapper rules.

**Preservation / compatibility:** Preserve tree IDs, classes, custom attrs, binding/style layers and content. No duplicated root property bag mirroring descendants. 

**Acceptance — not yet run against redesign:**

- T-B69-hero-1: Change headline preserves link and child IDs; no root title divergence.
- T-B69-hero-2: Set CTA internal page link then reorder Hero: link reference preserved.
- T-B69-hero-3: Legacy metadata and extra children survive opening/editing.

**Shared states/interaction:** BIC-C01–05: loading/empty/error are distinct; live valid commit, retained invalid draft, stale-request guard, real owner/ancestor locks, stable return/focus, explicit same-shape batch eligibility; structural edits single compound target and one atomic Undo. Missing preview/service parity stays unverified.

## B69-features

Source: `src/blocks/Sections/Features.tsx` (block config/build symbol). **Builder and related consumers located in code. Registered insert, returned target and default Inspector observed in block-runtime-survey.json; proposed edits/output not runtime verified.**

**Existing architecture:** section.features contains three item divs, each h3+p. Description promises icons, but current markup contains no icon.

**Gap and consequence:** Do not expose icon controls for nonexistent children or imply icon insertion already happened.

**Decision:** Keep + Regroup + Fix. **Owner:** Actual section/native descendants own their properties. Section presets are not automatically shared component definitions.

**Exact editing home:** Content → Feature items; child heading/description; Style root grid/flex + item appearance.

**Controls and validation:**

- Rows identify actual feature item containers; Select/Edit, Duplicate, Move up/down, Remove per BIC-C02. Add item duplicates selected item structure only after ID/reference remap; if no items use existing container + heading/paragraph insertion.
- Optional icon uses existing Add Icon into selected item and then B69-icon; no phantom icon slot/value. Preset description corrected to actual generated content until icons are explicitly added.

**End-to-end flow:** Select root → choose Feature2 → edit heading/description via actual child → return → duplicate/reorder whole item preserving nested text. Removing populated item shows content impact and Undo.

**Preservation / compatibility:** Preserve tree IDs, classes, custom attrs, binding/style layers and content. No duplicated root property bag mirroring descendants. Preset description wording correction is implementation work; no existing capability removed.

**Acceptance — not yet run against redesign:**

- T-B69-features-1: Duplicate feature creates unique IDs and retains style; edit clone independent.
- T-B69-features-2: No icon field appears unless actual icon target exists.
- T-B69-features-3: Reorder moves item with both heading and paragraph.

**Shared states/interaction:** BIC-C01–05: loading/empty/error are distinct; live valid commit, retained invalid draft, stale-request guard, real owner/ancestor locks, stable return/focus, explicit same-shape batch eligibility; structural edits single compound target and one atomic Undo. Missing preview/service parity stays unverified.

## B69-menu-grid

Source: `src/blocks/Sections/MenuGrid.tsx` (block config/build symbol). **Builder and related consumers located in code. Registered insert, returned target and default Inspector observed in block-runtime-survey.json; proposed edits/output not runtime verified.**

**Existing architecture:** Generic section > h2 + grid div >3 dish divs each h3+p. Description promises images/prices; markup has neither.

**Gap and consequence:** Static dish text is not commerce data; title and description alone do not justify product fields.

**Decision:** Keep + Regroup + Fix. **Owner:** Actual section/native descendants own their properties. Section presets are not automatically shared component definitions.

**Exact editing home:** Content → Children → Menu title or Dish item; Style actual grid layout; optional image via Add.

**Controls and validation:**

- Item row label derives heading; edit heading/description on selected native child. Price if user adds one is plain text unless explicitly bound via existing CMS; no currency/catalog claim.
- Duplicate/reorder/remove whole dish wrappers; actual grid repeat/gap in Style. Missing image Add Image is explicit insert, not file slot that overwrites text.

**End-to-end flow:** Menu grid → choose dish → edit text → return → reorder item → set mobile grid at actual inner owner. New image goes in chosen dish with Alt flow, not menu root.

**Preservation / compatibility:** Preserve tree IDs, classes, custom attrs, binding/style layers and content. No duplicated root property bag mirroring descendants. Correct misleading preset description; preserve original static menu and no automatic ecommerce migration.

**Acceptance — not yet run against redesign:**

- T-B69-menu-grid-1: No price/image is claimed existing by panel.
- T-B69-menu-grid-2: Dish deletion preserves unrelated items, Undo restores exact children.
- T-B69-menu-grid-3: Grid breakpoint changes do not rewrite content.

**Shared states/interaction:** BIC-C01–05: loading/empty/error are distinct; live valid commit, retained invalid draft, stale-request guard, real owner/ancestor locks, stable return/focus, explicit same-shape batch eligibility; structural edits single compound target and one atomic Undo. Missing preview/service parity stays unverified.

## B69-testimonials-section

Source: `src/blocks/Sections/TestimonialsSection.tsx` (block config/build symbol). **Builder and related consumers located in code. Registered insert, returned target and default Inspector observed in block-runtime-survey.json; proposed edits/output not runtime verified.**

**Existing architecture:** Generic section > h2 + grid div >2 blockquote nodes; each p + cite. Native cite currently falls back to container.

**Gap and consequence:** Selecting cite must offer text/native attributes without generic layout mutation; quotes are not the testimonials component.

**Decision:** Keep + Regroup. **Owner:** Actual section/native descendants own their properties. Section presets are not automatically shared component definitions.

**Exact editing home:** Content → Quotes; quote → text + attribution child; Style grid/root and typography at respective targets.

**Controls and validation:**

- Quote and author are actual p/cite content, no root string copies. Preserve cite/blockquote semantics. Add/duplicate moves whole blockquote with author; source URL through existing cite attr in Advanced, not replacing author display.
- Section and Testimonials component labels show their context/preset identity in catalog; no forced conversion between them.

**End-to-end flow:** Select section → Quote2 → quote text → attribution → Back to Quotes → move/remove with paired content. Current item focus persists on return.

**Preservation / compatibility:** Preserve tree IDs, classes, custom attrs, binding/style layers and content. No duplicated root property bag mirroring descendants. 

**Acceptance — not yet run against redesign:**

- T-B69-testimonials-section-1: Editing attribution does not change quote; native cite preserved.
- T-B69-testimonials-section-2: Reorder quote keeps p+cite as one item.
- T-B69-testimonials-section-3: Existing custom quote descendants survive author edit.

**Shared states/interaction:** BIC-C01–05: loading/empty/error are distinct; live valid commit, retained invalid draft, stale-request guard, real owner/ancestor locks, stable return/focus, explicit same-shape batch eligibility; structural edits single compound target and one atomic Undo. Missing preview/service parity stays unverified.

## B69-cta

Source: `src/blocks/Sections/CTA.tsx` (block config/build symbol). **Builder and related consumers located in code. Registered insert, returned target and default Inspector observed in block-runtime-survey.json; proposed edits/output not runtime verified.**

**Existing architecture:** section.cta >h2,p,button. Brand CSS vars on root/button; default button is not anchor.

**Gap and consequence:** Do not show button destination as known link; button action must be explicit.

**Decision:** Keep + Regroup. **Owner:** Actual section/native descendants own their properties. Section presets are not automatically shared component definitions.

**Exact editing home:** Content child label/text; Style root Fill and typography; Behaviour selected Button/action.

**Controls and validation:**

- Select actual button for label, type and existing link/action capabilities. A navigation conversion must follow shared button/link contract with preserved identity/attrs and explain tag semantics; never fabricate href-only navigation on native button.
- Brand token shown as source; local override versus Edit source returns to exact selected child/root. No global Brand edits disguised as CTA colour.

**End-to-end flow:** CTA root → button child → label/action → Preview; return restores selectedbutton. Edit root shared-token source through Brand exact resource only if permitted; cancel returns same context.

**Preservation / compatibility:** Preserve tree IDs, classes, custom attrs, binding/style layers and content. No duplicated root property bag mirroring descendants. 

**Acceptance — not yet run against redesign:**

- T-B69-cta-1: CTA label edit leaves heading and token references intact.
- T-B69-cta-2: Button action behavior tested in preview/output; no success just because href exists.
- T-B69-cta-3: Undo local colour restores token reference, not copied computed colour.

**Shared states/interaction:** BIC-C01–05: loading/empty/error are distinct; live valid commit, retained invalid draft, stale-request guard, real owner/ancestor locks, stable return/focus, explicit same-shape batch eligibility; structural edits single compound target and one atomic Undo. Missing preview/service parity stays unverified.

## B69-contact

Source: `src/blocks/Sections/Contact.tsx` (block config/build symbol). **Builder and related consumers located in code. Registered insert, returned target and default Inspector observed in block-runtime-survey.json; proposed edits/output not runtime verified.**

**Existing architecture:** Generic section > two-column div. First child contact headings/paragraphs; second child empty low-opacity bordered div. There is no form in this preset.

**Gap and consequence:** Catalog description says short message form but source creates placeholder only. A form field panel cannot be invented for it.

**Decision:** Keep + Regroup + Fix. **Owner:** Actual section/native descendants own their properties. Section presets are not automatically shared component definitions.

**Exact editing home:** Content → Contact details and Form area; actual details children; empty container exposes proposed Add contact form action to the existing registered contact-form builder (not a currently verified static Add entry).

**Controls and validation:**

- Form area shows “Empty container” and “Add contact form” proposed contextual insertion; this exposes the existing registered builder absent from the static Add catalog. Insert existing contact-form into validated target. Preserve placeholder styles until user changes them, but show that opacity/border apply to this wrapper and may affect contents.
- Email is currently paragraph text; explicitly select/add Link to make mailto. Do not imply delivery/setup from text alone. After form insertion use B69-contact-form; built-in service setup separate.

**End-to-end flow:** Select section → form area → Add contact form → select newly inserted form → Fields + Submission configuration → return to section. Cancel insertion leaves empty area; service failure retains form content with actionable setup notice.

**Preservation / compatibility:** Preserve tree IDs, classes, custom attrs, binding/style layers and content. No duplicated root property bag mirroring descendants. Correct preset description to contact details + empty form area, or explicitly insert form in a later approved default update; no silent upgrade of saved placeholders.

**Acceptance — not yet run against redesign:**

- T-B69-contact-1: Initial preset has no form fields; panel accurately says empty.
- T-B69-contact-2: Adding form preserves contact-details column and root layout.
- T-B69-contact-3: Existing form/config and reference links survive Undo/reopen.

**Shared states/interaction:** BIC-C01–05: loading/empty/error are distinct; live valid commit, retained invalid draft, stale-request guard, real owner/ancestor locks, stable return/focus, explicit same-shape batch eligibility; structural edits single compound target and one atomic Undo. Missing preview/service parity stays unverified.

## B69-footer

Source: `src/blocks/Sections/Footer.tsx` (block config/build symbol). **Builder and related consumers located in code. Registered insert, returned target and default Inspector observed in block-runtime-survey.json; proposed edits/output not runtime verified.**

**Existing architecture:** footer root with copyright p only. Description says name/links, but preset has no links and fixed2024 text.

**Gap and consequence:** Do not expose navigation-list or automatic year behavior as implemented.

**Decision:** Keep + Regroup + Fix. **Owner:** Actual section/native descendants own their properties. Section presets are not automatically shared component definitions.

**Exact editing home:** Content → Children/copyright; Style footer Fill/spacing; any actual links via child Behaviour.

**Controls and validation:**

- Copyright is literal editable text; no automatic year substitution. Add links through existing Add Link into a validated group; no global footer synchronization inferred.
- Save as component uses approved Add/Saved components workflow; existing local footers remain independent unless user creates/inserts shared component.

**End-to-end flow:** Select footer → copyright paragraph → edit → Back. If reuse requested invoke existing component creation, disclose definition/instance scope then return; no hidden propagation to other pages.

**Preservation / compatibility:** Preserve tree IDs, classes, custom attrs, binding/style layers and content. No duplicated root property bag mirroring descendants. Correct description to actual simple copyright footer; richer default optional, existing routes retained.

**Acceptance — not yet run against redesign:**

- T-B69-footer-1: Text change affects this footer only unless genuine shared definition edit.
- T-B69-footer-2: Saved2024/custom copyright never autochanges on open.
- T-B69-footer-3: Added link IDs and component references preserved.

**Shared states/interaction:** BIC-C01–05: loading/empty/error are distinct; live valid commit, retained invalid draft, stale-request guard, real owner/ancestor locks, stable return/focus, explicit same-shape batch eligibility; structural edits single compound target and one atomic Undo. Missing preview/service parity stays unverified.

## B69-navbar

Source: `src/blocks/Sections/Navbar.tsx` (block config/build symbol). **Builder and related consumers located in code. Registered insert, returned target and default Inspector observed in block-runtime-survey.json; proposed edits/output not runtime verified.**

**Existing architecture:** nav navbar root > logo text div + link group div with4 anchors. ElementManager.ts:258–304 addPageToNavigation copies last link in first all-link descendant group, stores #page:id.

**Gap and consequence:** Logo text is not image; responsive hamburger/menu automation not traced. Page navigation dependency is real and must be preserved.

**Decision:** Keep + Regroup. **Owner:** Actual section/native descendants own their properties. Section presets are not automatically shared component definitions.

**Exact editing home:** Content → Navigation links + Logo child; Behaviour per-link destination; Style actual nav/group responsive layout.

**Controls and validation:**

- Links rows derived from actual group; label+destination edits hit same anchor as direct child selection. Supported destination types existing Link contract; current # means unset destination, not valid Home page mapping.
- Move/duplicate/remove acts on link node with remapped internal IDs; Page → Add to site navigation uses same owner. Do not add duplicate #page:id; display affected nav count on page action. Existing hand-authored URLs stay unchanged.
- No automatic mobile menu toggle promised. Preserve authored breakpoint visibility/layout; optional responsive menu authoring remains outside this coverage. Logo image requires explicit Add/Replace content decision.

**End-to-end flow:** Select Navbar → Links → About → choose internal page → return to link list. Page creation Add to navigation returns to original page context and updates eligible group only; deleted page link shows missing reference, Choose page/Clear with Undo.

**Preservation / compatibility:** Preserve tree IDs, classes, custom attrs, binding/style layers and content. No duplicated root property bag mirroring descendants. 

**Acceptance — not yet run against redesign:**

- T-B69-navbar-1: Link direct edit and row edit always read same ID/href.
- T-B69-navbar-2: Create page integration avoids duplicates and preserves existing groups.
- T-B69-navbar-3: Mobile layout edit does not delete links or pretend hamburger functionality.

**Shared states/interaction:** BIC-C01–05: loading/empty/error are distinct; live valid commit, retained invalid draft, stale-request guard, real owner/ancestor locks, stable return/focus, explicit same-shape batch eligibility; structural edits single compound target and one atomic Undo. Missing preview/service parity stays unverified.


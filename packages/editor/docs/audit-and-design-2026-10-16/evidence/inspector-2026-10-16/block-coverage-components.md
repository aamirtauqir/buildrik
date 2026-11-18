# Individual block handoff — Components and Ecommerce

**BIC-01-COMPONENTS-ECOMMERCE · 2026-10-16 ·18 blocks · design specifications; not implementation acceptance**

Supporting design annex to FD-INS-02/BIC-01. Current four-tab IA stays selected. No application code/data/test changes; no Figma. Parent controls canonical incorporation and closure status.

Parent block-runtime-survey verifies insertion/returned selection/native tree/default Inspector only for18/18. Source consumers and controls traced here. All new flows, visitor behavior, control mutation, persistence/reopen and output acceptance remain untested.

This is the individual-block annex, not a second Inspector IA. **FD-INS-02 remains selected: Content / Style / Behaviour / Effects with persistent target header.** The Components source folder contains contact-form, whose configuration category is Forms. Commerce authoring stays deferred; data preservation and truthful generic editing remain required.

## Shared evidence and reading rules

- src/blocks/blockRegistry.ts:239–273 validates declared root parent and calls insertOne; builder may create multiple nodes
- src/blocks/blockRegistry.ts:364–390 chooses builder or sanitized HTML; source defaults applied only to HTML inserted roots
- src/engine/elements/manager/HTMLParser.ts:157–303 parses children/native attrs, preserves mixed text, refines legacy types
- src/shared/utils/html/typeMapping.ts:31–76 maps descendant tags; unknown tags may be container type while keeping native tag
- src/engine/elements/Element.ts:122 preserves allowed non-div native tags
- src/shared/constants/elementCapabilities.ts:158–187 maps generic families; generic type does not prove compound relationship support

Use FD-INS-02 precedence: II integration contracts refine IC-01–13; per-block controls extend unique semantics only. No parallel draft/permission/history implementation.

Each control below states its own special values/eligibility/reset behavior; IC/II contracts supply drafts, exact source readback, focus, history and latest permission checks. Structure operations require one named owner, stable affected IDs and full impact preview where destructive; no all-selected promise for a primary-only handler. Ordinary Style/Effects controls remain available according to exact native/property eligibility, including advanced saved expressions.

### Highest-priority compound corrections

| Block | Specific correction / evidence limit |
|---|---|
| Modal |2 sibling roots; explicit trigger/dialog relation, atomic construction and safe duplicate/delete; no dedicated runtime located by scoped source search |
| Tabs |Parallel button/panel arrays need persistent pair identity and accessible visitor runtime; editing hidden panel must not rewrite initial state |
| Table |Selected nested table differs from inserted wrapper; native row/column/header operations preserve compound cell content and complex spans |
| Switch |First non-input child is visual track; current Edit text target selection can miss actual caption; checked/focus visuals and native switch role need verified correction |
| Contact form |Input-only reorder separates control from sibling label; field unit and label association need canonical ownership |
| Slider / Countdown |Slide list and runtime disagree on eligible children; countdown positional units cannot safely reorder without stable unit identity |
| Ecommerce |Exporter/helper source exists but is not proof of configured product/cart workflows; preserve markers, static content and provider boundaries while deferring authoring |

## B69-card — card

**Evidence:** `src/blocks/Components/Card.tsx:13`. Parent insertion survey: 1 root(s), 5 nodes, selected `card` / `<div>`; native tags: `div`, `h3`, `img`, `p`. Controls/visitor/persistence behavior is not newly runtime verified.

**Current construction and identifiers.** HTML insertion: div typed card → img + inner div → h3 and p. Parser keeps each child as an element; source image dimensions320×180, outer max-width320px; returned/selected root is card. Parent survey confirms5 nodes, not a single flattened card text field. data-buildrick-type establishes root type then parser stores it structurally; child image src/alt, heading tag/content and body paragraph are independent owners. No shared component definition or card ID relation is created merely by inserting this block.

**Current Inspector.** Root generic Layout/Size/Spacing/Fill/Border/Text inside; child Image source/alt and Heading/Text edit routes; eligible root Link is an optional existing behavior, not a generated CTA.

**Consumers and anchors:**
- src/blocks/blockRegistry.ts:364–390: sanitized HTML insertion and root type defaults
- src/engine/elements/manager/HTMLParser.ts:224–303: child/native content preservation
- src/shared/constants/elementCapabilities.ts:158–183: card generic container with link support
- src/editor/inspector/sections/typeBlock/bodies/mediaBodies.tsx:65: child Image controls

**Source findings and consequences:**
- **B69-card-G01:** No card-specific semantic editor is required to retain existing functionality, but generic root selection does not expose which image/title/body is being edited. Treat identification and child targeting as a design gap, not missing content capability. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-card-G02:** Applying a root Link while nesting interactive children must obey existing anchor/nesting rules; a whole-card link must not silently wrap a future child link/button. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)

**Disposition:** Keep generated content and generic style editing; Redesign contextual child targeting; no new card data schema.

**Canonical owners and scope:** Card owns structure/appearance; img owns source/alt; h3 owns level/content; p owns body; root Link applies only to eligible card element. No site/global owner.

**Control specification — proposed destination/behavior unless explicitly labelled existing:**

| ID / home / label | Values, defaults, eligibility and validation | Update, reset and recovery | Owner / evidence status |
|---|---|---|---|
| B69-card-C01 · Content → Card → Content parts · Image / Title / Description | Rows show actual child IDs/names; missing optional part says Not present; locate descendants by explicit IDs, never rewrite all matching tags. | Select exact child; Back to Card restores root/tab/scroll. Links are navigation, no document mutation. Ordinary Add can add a missing part at validated location. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-card-C02 · Style → Card appearance · Layout / Size / Fill / Border; child Image → Fit | Existing CSS units and inherited values; preserve320px max-width as authored; no mandatory image or text length. | Use IC-02/03 for scoped visual edits; do not reset inner padding when root changes. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-card-C03 · Behaviour → Link · Card destination | Existing link types only; reject nesting that would create nested interactive content. | Explicit link removal leaves card contents; ordinary document Undo. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |

**Complete edit flow:**

| Stage | Required behavior |
|---|---|
| entry | Add Card when offered, or Canvas/Layers select existing card; header names root. |
| edit | Content parts → Image/Title/Description exact child → existing native editor; root styling remains on root. |
| add / reorder | Add/duplicate child through current Canvas/Layers commands; move image above/below text container as sibling unit, with valid nesting preview. No detached duplicate content fields. |
| delete | Delete a selected part removes only that child; root Delete summarizes whole subtree. Preserve remaining part IDs. |
| return | Back to Card restores root and prior context; deliberate new selection supersedes automatic return. |
| failure / recovery | Missing/deleted child gives unavailable row and valid root return; cancel no mutation; one Undo restores deletion/structure and original IDs. |

**Preservation, compatibility and dependencies:** Keep image source/alt, heading semantics, body text, authored styles and token refs; optional child navigation uses existing IDs. Structural validation and shared action registry are dependencies; no schema migration.

**Keyboard, batch and permission:** Child rows and move actions keyboard reachable; structural operations single root; compatible visual batch only; lock/conflict/role checked on root and affected children.

**Specific acceptance — specified, not passed:**
- **T-B69-card-01:** Edit title without replacing image/body or root style; Undo restores original text.
- **T-B69-card-02:** Replace image preserves alt and exact Back context.
- **T-B69-card-03:** Move image below text then reopen retains ordering/IDs.
- **T-B69-card-04:** Add nested CTA then attempt root Link cannot create invalid nested links silently.

**Shared contracts:** IC-01, IC-02, IC-03, IC-04, IC-06, IC-13; II-01, II-02, II-08.

## B69-slider — slider

**Evidence:** `src/blocks/Components/Slider.tsx:6`. Parent insertion survey: 1 root(s), 7 nodes, selected `slider` / `<div>`; native tags: `div`, `h3`, `p`. Controls/visitor/persistence behavior is not newly runtime verified.

**Current construction and identifiers.** HTML div.slider → two direct div.buildrick-slide children, each h3+p. Parent survey7 nodes. Runtime injects arrows/dots into DOM; injected controls are not authored child elements. .buildrick-slider identifies runtime; only direct .buildrick-slide children are slides. Root data-autoplay/data-interval/data-arrows/data-dots are playback settings. Runtime data-bk-slider-init and editor shown index are transient.

**Current Inspector.** Current Behaviour has Slides and Playback; root Style generic. Slides add duplicates last child, or creates classed slide if empty; row currently lacks direct edit/select action and keyboard reorder.

**Consumers and anchors:**
- src/engine/export/sliderRuntime.ts:61–177: class-filtered slides, arrows/dots, looping, hover/focus pause, reduced-motion
- src/editor/canvas/hooks/useSliderRuntime.ts:41–62: autoplay false in editor, index memory
- src/editor/inspector/sections/SlidesSection.tsx:96–165: all-child list/add/duplicate/delete/reorder
- src/editor/inspector/sections/SliderPlaybackSection.tsx:50–115: flags/interval writer
- ../../lib/publish-sliders.ts:35; ../../packages/dashboard/app/api/workers/publish/[jobId]/route.ts:363: published runtime injection

**Source findings and consequences:**
- **B69-slider-G01:** SlidesSection lists every root child, whereas runtime filters .buildrick-slide. A non-slide child can count in UI but not play. Source: SlidesSection.tsx:96 versus sliderRuntime.ts:66–69. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-slider-G02:** Add slide duplicates last child including custom data and any identifiers; current child list has drag-only reorder. Source contract does not establish safe remapping of ID references. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-slider-G03:** Changing transient shown index by numeric position can show a different slide after reorder; preserve selected/shown stable slide identity in proposed editor state. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)

**Disposition:** Move Slides→Content; Keep Playback→Behaviour; Fix slide eligibility/count and scope; Redesign precise editing/reorder.

**Canonical owners and scope:** Slider owns ordered authored slide IDs/playback attrs; slide owns contents. Editor shown slide is session state; runtime arrows/dots are output decoration, not persisted children.

**Control specification — proposed destination/behavior unless explicitly labelled existing:**

| ID / home / label | Values, defaults, eligibility and validation | Update, reset and recovery | Owner / evidence status |
|---|---|---|---|
| B69-slider-C01 · Content → Slider → Slides · Slide list / Edit slide / Add / Duplicate / Move up/down / Delete | Only canonical slide children count; non-slide authored children shown separately with explanation and explicit Convert to slide where structurally valid. Add blank slide distinct from Duplicate. | One transaction per operation; Edit slide transiently reveals exact slide and selects it, Back restores slider; no save of display:none from editor reveal. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-slider-C02 · Behaviour → Slider → Playback · Autoplay / Interval / Arrows / Dots | Existing defaults false/5sec/true/true; interval finite1–60sec; explain editor pauses autoplay while editing. | Invalid input retained, no silent clamp; commit root attrs, one Undo. Reset removes attr and shows actual fallback. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-slider-C03 · Content → Slider → Slides · Shown slide in editor | Existing slide ID or none; not the published initial slide setting. | Navigating/editing slide is view-only; after deletion choose nearest surviving slide, after reorder keep same ID. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |

**Complete edit flow:**

| Stage | Required behavior |
|---|---|
| entry | Select slider→Content Slides; list uses same eligibility as renderer. |
| edit | Edit SlideN reveals its content without changing persisted visibility; child edit retains Back to Slider. |
| add / reorder | Add blank or Duplicate named slide; remap internal IDs/references within duplicate, preserve external refs; keyboard/pointer reorder same authored order. |
| delete | Delete slide affects its subtree; deleting last leaves explicit Empty slider with Add slide, runtime controls absent. |
| return | Back restores shown slide ID and root context; playback preview is explicitly temporary. |
| failure / recovery | Invalid child structure remains inspectable; unsupported conversion stays unchanged. Undo restores slide ID/order/content and current view follows surviving identity. |

**Preservation, compatibility and dependencies:** Preserve existing classed slides, custom content and saved playback attrs; do not serialize runtime-injected DOM or authored display changes from view. Reuse one slide resolver across Inspector/runtime; preview/download/publish parity requires separate checks.

**Keyboard, batch and permission:** Add/edit/move/delete keyboard actions; native runtime arrow buttons remain labelled. Structural management single slider; batch playback only explicitly compatible sets, no primary-only promise. Guards include child locks.

**Specific acceptance — specified, not passed:**
- **T-B69-slider-01:** Insert two slides, add non-slide child: displayed authored slide count and runtime count agree or anomaly is explained.
- **T-B69-slider-02:** Edit hidden second slide and Back without writing display styles.
- **T-B69-slider-03:** Reorder active slide preserves identity; one Undo restores order.
- **T-B69-slider-04:** Delete all slides yields honest empty state, no divide-by-zero/phantom controls.
- **T-B69-slider-05:** Autoplay5sec is paused in editing; preview/output honor config and reduced-motion/focus pause.

**Shared contracts:** IC-01, IC-02, IC-03, IC-04, IC-06, IC-13; II-01, II-02, II-08.

## B69-testimonials — testimonials

**Evidence:** `src/blocks/Components/Testimonials.tsx:6`. Parent insertion survey: 1 root(s), 9 nodes, selected `testimonials` / `<div>`; native tags: `div`, `p`, `span`, `strong`. Controls/visitor/persistence behavior is not newly runtime verified.

**Current construction and identifiers.** HTML div.testimonials → div testimonial item → quote p, metadata div(strong author + span role), rating div containing star text. Parent survey9 nodes including parser-created leaf text where needed; strong tag remains strong, not automatically Heading. Classes buildrick-testimonial-item/quote/meta/rating identify existing authored sections; no rating numeric model, carousel state or source-record IDs are generated.

**Current Inspector.** Generic root appearance plus Canvas/Layers native descendants; no dedicated testimonial data editor found in inspected type registry. This is static authored content, not a verified review service.

**Consumers and anchors:**
- src/blocks/Components/Testimonials.tsx:13–20
- src/engine/elements/manager/HTMLParser.ts:249–303: mixed/leaf text preservation
- src/shared/constants/elementCapabilities.ts:170: generic container

**Source findings and consequences:**
- **B69-testimonials-G01:** Root-only family mapping obscures separate quote/author/role/rating descendants. Current rating is literal stars; numeric rating conversion would invent a model. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-testimonials-G02:** Default quote/author sample text and rating need clear edit routes; new repeated items should preserve markup and independent identities rather than duplicate an external-review claim. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)

**Disposition:** Keep static content/native semantics; Redesign item/part navigation; Defer numeric rating/review-service integration.

**Canonical owners and scope:** Testimonial root owns item order/styles; each item owns quote/author/role/rating text. External authenticity/source verification is outside these controls.

**Control specification — proposed destination/behavior unless explicitly labelled existing:**

| ID / home / label | Values, defaults, eligibility and validation | Update, reset and recovery | Owner / evidence status |
|---|---|---|---|
| B69-testimonials-C01 · Content → Testimonials → Items · Item list / Quote / Author / Role / Rating text | Actual child content; rating accepts current text, not assumed0–5 number; missing part explicitly absent. | Exact child edit with Back; text validation/sanitization retains allowed inline markup. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-testimonials-C02 · Content → Testimonials → Items · Duplicate / Move / Remove | Whole testimonial item subtree; preserve strong and quote text semantics; no automatic conversion to blockquote required. | One Undo; internal IDs remapped on duplicate; explicit remove scope. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-testimonials-C03 · Style → Testimonials / selected item · Item layout / Typography / Fill / Border / Effects | Existing CSS and descendant inheritance; rating styles do not change rating content. | Use scoped styles and reset contracts; no new review state. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |

**Complete edit flow:**

| Stage | Required behavior |
|---|---|
| entry | Existing root or offered Add→Content Items. |
| edit | Select item then named part; actual native leaf receives existing inline editor. |
| add / reorder | Duplicate existing complete item; for empty root, Add via ordinary element structure or a declared static starter pattern; do not imply external record creation. Move whole items. |
| delete | Remove one item with its parts; root Delete removes all. |
| return | Back to Item then Testimonials retains item identity/list scroll. |
| failure / recovery | Custom/missing parts remain available in Layers; do not flatten unrecognized markup. Undo restores exact text/IDs/order. |

**Preservation, compatibility and dependencies:** Keep quote formatting, strong author semantics, literal star text/classes and all custom children. Navigation adapters may map known classes but must tolerate arbitrary saved structure.

**Keyboard, batch and permission:** Keyboard item/part navigation and move actions; item management single root; typography batch only eligible selected owners; no mutation with revoked permission.

**Specific acceptance — specified, not passed:**
- **T-B69-testimonials-01:** Edit author preserves strong tag and sibling role.
- **T-B69-testimonials-02:** Edit rating text does not fabricate numeric property or global review score.
- **T-B69-testimonials-03:** Duplicate/reorder/remove complete item retains custom child markup; Undo exact.
- **T-B69-testimonials-04:** Unknown saved testimonial child remains discoverable via Layers.

**Shared contracts:** IC-01, IC-02, IC-03, IC-04, IC-06, IC-13; II-01, II-02, II-08.

## B69-pricing — pricing

**Evidence:** `src/blocks/Components/PricingTable.tsx:6`. Parent insertion survey: 1 root(s), 16 nodes, selected `pricing` / `<div>`; native tags: `a`, `div`, `h3`, `li`, `p`, `ul`. Controls/visitor/persistence behavior is not newly runtime verified.

**Current construction and identifiers.** HTML pricing div → two .buildrick-pricing-card divs; each h3, price p, ul/li features, a CTA. Second has buildrick-featured class. Parent survey16 nodes; this is not a native HTML table or paid subscription model. Card order and featured class are authored visual hierarchy; price strings $19/mo/$49/mo are literal copy; href # is placeholder Link, not checkout integration.

**Current Inspector.** Generic root/item style, nested heading/paragraph/list/link editors; no plan billing editor established. Keep link destination access on exact CTA.

**Consumers and anchors:**
- src/blocks/Components/PricingTable.tsx:13–27
- src/shared/constants/elementCapabilities.ts:158–176
- src/editor/inspector/sections/LinkSection.tsx:42–56,150–197

**Source findings and consequences:**
- **B69-pricing-G01:** A Pricing label must not imply actual billing configuration. Price/currency/period currently one string; splitting into currency arithmetic fields would add unsupported behavior. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-pricing-G02:** Plan feature lists and featured class need stable whole-item movement; arbitrary container operations can lose intended card association if children are moved separately. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)

**Disposition:** Keep static plan markup and CTA links; Redesign plans/parts navigation; Defer subscription/price model.

**Canonical owners and scope:** Pricing root owns plan order; card owns text/feature children and featured membership; CTA owns href/target/rel; external payment destination remains separate.

**Control specification — proposed destination/behavior unless explicitly labelled existing:**

| ID / home / label | Values, defaults, eligibility and validation | Update, reset and recovery | Owner / evidence status |
|---|---|---|---|
| B69-pricing-C01 · Content → Pricing → Plans · Plan / Price text / Features / CTA label | Heading and price are text; feature items preserve li/native list; existing featured class shown in Style Classes. | Exact part selection, no duplicate price field; Enter/escape inline edit contract. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-pricing-C02 · Behaviour → selected plan CTA → Link · Destination | Existing Link types; # placeholder displayed truthfully until changed; no Test purchase action. | One document link mutation; Cancel unchanged; Undo refreshes link. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-pricing-C03 · Content → Pricing → Plans · Duplicate / Move / Remove plan | Whole plan subtree; feature move within its own ul/ol; shared layout unaffected. | One history unit; deletion impact identifies plan/features/CTA. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |

**Complete edit flow:**

| Stage | Required behavior |
|---|---|
| entry | Select Pricing root→Plans. |
| edit | Plan→name/price/features/CTA exact native editor. Feature row can select native li text; link destination goes Behaviour. |
| add / reorder | Duplicate plan as independent static card; move complete plan; add/remove/reorder feature through valid list commands. |
| delete | Plan delete removes own feature list/CTA; deleting feature never touches other plans. |
| return | Back to Plan/Pricing restores root and scroll; after external link resource task returns exact CTA. |
| failure / recovery | Unavailable child retains non-destructive root navigation; Undo restores subtree and original links. |

**Preservation, compatibility and dependencies:** Preserve literal billing copy, CTA links, feature lists, featured class and authored styles. No automatic link-to-checkout/schema migration. External-commerce work deferred.

**Keyboard, batch and permission:** Keyboard plan/feature move; semantic lists retained in output; batch plan text edit requires single target; style batching existing eligibility.

**Specific acceptance — specified, not passed:**
- **T-B69-pricing-01:** Change price text only, no arithmetic/currency rewrite.
- **T-B69-pricing-02:** Move Pro card before Starter preserves class and CTA.
- **T-B69-pricing-03:** Edit feature list retains li semantics; delete/Undo restores IDs.
- **T-B69-pricing-04:** CTA # shown as placeholder, no claim of working billing.

**Shared contracts:** IC-01, IC-02, IC-03, IC-04, IC-06, IC-13; II-01, II-02, II-08.

## B69-progress — progress

**Evidence:** `src/blocks/Components/ProgressBar.tsx:6`. Parent insertion survey: 1 root(s), 9 nodes, selected `progress` / `<div>`; native tags: `div`, `h1`, `h2`, `p`, `progress`, `span`. Controls/visitor/persistence behavior is not newly runtime verified.

**Current construction and identifiers.** Progress div.pb-card → h1 title + div.pb-progress → native progress(value93,max100), .pb-circle label93%, .pb-text h2+p. Parent survey9 nodes. Label display text can be parser-generated descendant span; writer searches it. Native progress attrs own numeric state; pb-circle/pb-label identify percentage display. Title and copy 32 of42 complete are independent static text, not derived automatically.

**Current Inspector.** Existing Value/Maximum/Show label in Style type block; four-tab map moves them Content. Child title/copy retains native editors. Native browser draws bar; no special runtime needed.

**Consumers and anchors:**
- src/editor/inspector/sections/typeBlock/bodies/widgetBodies.tsx:105–181: readProgress/writeProgress/writeLabelShown
- src/shared/constants/defaultStyles.ts:471: progress root defaults include height8px
- src/blocks/blockRegistry.ts:344–390: absent root defaults seeded

**Source findings and consequences:**
- **B69-progress-G01:** Multi Value/Max writer passes primary companion value to every target, already mapped INS-F02; must read each own value/max. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-progress-G02:** Current numeric percentage updates pb-label text but independent heading 32 of42 stays unchanged. UI must not imply those strings are linked. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-progress-G03:** Root default height8px may be unsuitable for compound card with h1/h2/body: source-seeding risk, not measured rendering defect. Preserve saved size and verify inserted composition before altering default. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)

**Disposition:** Move data→Content; Fix per-target writes; Keep independent copy and native progress; validate root default sizing separately.

**Canonical owners and scope:** Widget owns bar/label references; progress child owns numeric attrs; label owns derived percent rendering; title/body own independent text. No CMS progress service assumed.

**Control specification — proposed destination/behavior unless explicitly labelled existing:**

| ID / home / label | Values, defaults, eligibility and validation | Update, reset and recovery | Owner / evidence status |
|---|---|---|---|
| B69-progress-C01 · Content → Progress · Value / Maximum | INS-D11 governs: finite0<=new Value<=each eligible target own Maximum. New Maximum finite>0 and >=every eligible target current valid Value. Reject whole batch if any target fails; do not clamp/copy companion values. Corrupt legacy pairs remain visible with validation and are never rewritten on read. | Commit only changed attr per target; derived label recomputed from each own pair. Max rejection: Maximum must be at least [highest affected current value]; lower those values first. Preserve draft; explicit reset also preflights all resulting pairs before atomic commit. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-progress-C02 · Content → Progress · Show percentage label | Boolean; existing label retained hidden when off; creating missing legacy label/bar is one coordinated operation. | One transaction; turning on does not replace title/copy; Undo restores existence and attrs. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-progress-C03 · Content → Progress → Copy · Title / Supporting heading / Description | Independent text; explicit No automatic relation to Value. | Exact native child edit/back; no schema addition. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |

**Complete edit flow:**

| Stage | Required behavior |
|---|---|
| entry | Select progress root→Content. |
| edit | Numeric change updates native bar + matching percentage; select independent copy separately. |
| add / reorder | Existing semantic structure kept; child content may move through Layers where valid, but bar/label role recognition must remain stable. Do not duplicate numeric bar via ordinary Add without choosing canonical bar. |
| delete | Removing optional label via Show label is preferred reversible visibility; deleting bar directly yields Missing progress bar with Repair existing structure, not silently targeting other progress descendants. |
| return | Child edit→Back to Progress; current numeric source rereads after Undo. |
| failure / recovery | Invalid values retain draft; ambiguous multiple bars require explicit owner choice before repair; one Undo restores generated legacy bar/label. |

**Preservation, compatibility and dependencies:** Preserve older bar-less saved widgets until deliberate first numeric edit/repair; original subtrees retained in history. Need shared recognition and renderer comparison; no published record change.

**Keyboard, batch and permission:** Value/Maximum keyboard input and mixed states; progress output accessible name from explicit label or selected title association as proposed correction; batch numeric changes preserve companion values; guard root+bar.

**Specific acceptance — specified, not passed:**
- **T-B69-progress-01:** Value5 on widgets with max100/max10 preserves respective max; Value20 rejects whole batch with no writes.
- **T-B69-progress-02:** Pairs20/100 and80/100: new Max50 rejected with draft/error, Max90 writes only maxima, one Undo restores100/100; invalid legacy pairs unchanged on read.
- **T-B69-progress-03:** Supporting heading remains independent and labelled so.
- **T-B69-progress-04:** Show label off/on does not destroy text/style or create duplicates.
- **T-B69-progress-05:** Legacy missing bar repairs once and Undo restores original structure.
- **T-B69-progress-06:** Inserted card sizing and native accessible progress output validated at narrow widths.

**Shared contracts:** IC-01, IC-02, IC-03, IC-04, IC-06, IC-13; II-01, II-02, II-08.

## B69-countdown — countdown

**Evidence:** `src/blocks/Components/CountdownTimer.tsx:13`. Parent insertion survey: 1 root(s), 17 nodes, selected `countdown` / `<div>`; native tags: `div`, `h3`, `p`, `span`. Controls/visitor/persistence behavior is not newly runtime verified.

**Current construction and identifiers.** Countdown div → header h3+p and grid of four unit divs; each has value span and label span. Parent survey17 nodes. Builder has sample12/08/45/20 but no data-countdown-end; runtime does not tick until end is configured. Root data-countdown-end/done/message own config. Value spans recognized by class then positional days/hours/minutes/seconds fallback; optional data-countdown-unit explicitly names unit. Rendered digits/message/init markers are runtime state.

**Current Inspector.** Existing Ends at, When done, Message. Labels/header editable through native text nodes; no unit-management UI in inspected registry.

**Consumers and anchors:**
- src/engine/export/countdownRuntime.ts:51–101: target marker, positional/named unit mapping, completion
- src/editor/canvas/hooks/useCountdownRuntime.ts:28: editor dims rather than hides
- src/editor/inspector/sections/typeBlock/bodies/widgetBodies.tsx:44–89: date parsing/writer
- ../../lib/publish-widgets.ts:25–40: conditional runtime injection

**Source findings and consequences:**
- **B69-countdown-G01:** Fresh inserted countdown is sample/static until Ends at exists; show Not scheduled instead of implying a live countdown. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-countdown-G02:** Free reordering unnamed unit spans changes positional semantics. Ensure explicit unit identity before safe unit movement; do not rewrite labels based solely on translated text. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-countdown-G03:** Runtime mutates digits/grid display/completion message; editor view cleanup and export must not persist transient DOM as authored content. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)

**Disposition:** Move data→Content and completion→Behaviour; Fix date feedback and unit identity/reorder; Keep visitor-local time semantics.

**Canonical owners and scope:** Root config is site document data shared across breakpoints; each unit owns stable semantic identity and label text; displayed countdown is runtime output, not directly editable numeric content.

**Control specification — proposed destination/behavior unless explicitly labelled existing:**

| ID / home / label | Values, defaults, eligibility and validation | Update, reset and recovery | Owner / evidence status |
|---|---|---|---|
| B69-countdown-C01 · Content → Countdown · Ends at | YYYY-MM-DD HH:mm in visitor local time; empty means Not scheduled; validate real calendar date/hour/minute; do not add timezone selector without new model. | Valid commit updates data-countdown-end; explicit Remove schedule removes attr; invalid retains draft; Undo exact. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-countdown-C02 · Content → Countdown → Units · Days / Hours / Minutes / Seconds label and order | Four canonical unit IDs; labels editable/localizable; rendered numeric value read-only derived while scheduled. | Reorder preserves identity via explicit data-countdown-unit mapping; existing unmarked ordered4 units can be mapped losslessly on explicit operation; ambiguous saved markup stays unchanged. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-countdown-C03 · Behaviour → Countdown completion · When done / Message | Show message or Hide; current default message; string message; describe editor dim versus published hidden. | Changing mode preserves stored message; reset according to attr absence; preview completion temporary and restores display. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |

**Complete edit flow:**

| Stage | Required behavior |
|---|---|
| entry | Select countdown→Content; Not scheduled notice until configured. |
| edit | Set date or exact header/unit label; numbers shown derived when active, not a conflicting text writer. |
| add / reorder | Reorder existing named units only; additional custom children stay generic and do not masquerade as timer unit. Unit removal states display consequence; remaining identities unchanged. |
| delete | Remove schedule distinct from Delete widget; delete unit retains timer config and shows missing unit in list; Undo recovers unit. |
| return | Child label edit→Countdown; snapshot date/draft preserved through local tabs. |
| failure / recovery | Invalid/missing schedule and runtime failure distinct; Cancel no date write; timers/preview cleaned up on removal/selection transitions without serializing DOM output. |

**Preservation, compatibility and dependencies:** Preserve visitor time semantics, static legacy countdowns, root attrs, translated labels and custom layout. New explicit unit markers are compatible metadata only when identity proven; unknown unit patterns require review.

**Keyboard, batch and permission:** Date input has associated format/error; unit move keyboard alternative; schedule batch only explicit same value, unit structure single root; no runtime motion-only feedback.

**Specific acceptance — specified, not passed:**
- **T-B69-countdown-01:** Fresh insert shows Not scheduled and preserves sample content until date set.
- **T-B69-countdown-02:** Reorder Days/Hours retains correct values even with translated labels.
- **T-B69-countdown-03:** Past date Hide stays selectable in editor and hides only in visitor output.
- **T-B69-countdown-04:** Remove end attr restores authored static structure after transient cleanup.
- **T-B69-countdown-05:** Invalid Feb30 remains draft and last valid date retained.

**Shared contracts:** IC-01, IC-02, IC-03, IC-04, IC-06, IC-13; II-01, II-02, II-08.

## B69-accordion — accordion

**Evidence:** `src/blocks/Components/Accordion.tsx:14`. Parent insertion survey: 1 root(s), 19 nodes, selected `accordion` / `<div>`; native tags: `button`, `div`, `p`, `span`. Controls/visitor/persistence behavior is not newly runtime verified.

**Current construction and identifiers.** Programmatic accordion div → three item divs; each button header → text span, plus content div → inner div → paragraph. First open. Parent survey19 nodes; root return identifies accordion. data-allow-multiple=false root; data-accordion-state open/closed item; accordion-* classes plus structural fallback; runtime aria-expanded/aria-hidden/max-height transient. Builder does not add header/panel ID linkage or explicit button type.

**Current Inspector.** Existing per-item Open/Closed + Allow several open; child text accessible via Layers; item CRUD absent in inspected type block, not absent from whole editor.

**Consumers and anchors:**
- src/blocks/Components/Accordion.tsx:19–133
- src/engine/export/accordionRuntime.ts:44–116: structural fallback and interactive click
- src/editor/canvas/hooks/useAccordionRuntime.ts: uses interactive:false
- src/editor/inspector/sections/typeBlock/bodies/widgetBodies.tsx:189–259: item states and multiple-open

**Source findings and consequences:**
- **B69-accordion-G01:** Authoring closed content needs temporary reveal and exact parent return; changing initial Open solely to edit content would change published behavior. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-accordion-G02:** Builder headers lack type=button; when inserted in form they may submit. Runtime adds aria-expanded but no linked ID/aria-controls and hidden panel focus prevention was not established. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-accordion-G03:** Runtime open panel height measured once per apply; later image/font/content growth can clip until reapply. This is source risk requiring dynamic-content acceptance. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)

**Disposition:** Move item content→Content, initial behavior→Behaviour; Redesign relationship-aware item actions; Fix output button/focus/height semantics.

**Canonical owners and scope:** Accordion root owns item order/multiple-open; item owns initial open attr and header/panel pair; text/inner content local; temporary edit reveal separate from saved initial state.

**Control specification — proposed destination/behavior unless explicitly labelled existing:**

| ID / home / label | Values, defaults, eligibility and validation | Update, reset and recovery | Owner / evidence status |
|---|---|---|---|
| B69-accordion-C01 · Content → Accordion → Items · Edit title / Edit content / Add / Duplicate / Move / Delete | Item ID references stable header and panel; preserve custom descendants. Add starter creates valid pair; cannot treat arbitrary extra child as item silently. | Explicit paired structural commands one Undo; editing closed panel temporarily reveals it, closing edit restores authored initial state. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-accordion-C02 · Behaviour → Accordion · Initial open per item / Allow several open | Open/Closed; false default multiple; on false retain first currently open item and identify other closures before commit. | One transaction for related state changes; reset item default separate from editor reveal; no primary-only multi-root editing. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-accordion-C03 · Content → item → Accessibility · Header label / Panel relationship | Native button type=button; unique IDs and aria-controls/label relationship; actual header text used. | Fix-generated relationships in schema-safe command; preserve custom existing valid IDs; no arbitrary runtime ID overwrite. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |

**Complete edit flow:**

| Stage | Required behavior |
|---|---|
| entry | Select root→Items; existing states visible in Behaviour. |
| edit | Edit content on a closed item reveals in editor only; select child and Back to Item/Accordion. |
| add / reorder | Add/duplicate whole item header+panel; remap internal relationship IDs; keyboard/pointer reorder; do not drag content outside owner by default. |
| delete | Delete item includes its header/panel/content and affected links; last deletion leaves Empty accordion with Add. |
| return | Back restores closed/open authoring view; navigation does not change visitor initial state. |
| failure / recovery | Legacy structural fallback supported; ambiguous custom item requires explicit pair selection; Cancel retains tree; one Undo restores full item/initial states. |

**Preservation, compatibility and dependencies:** Retain old class-based/structural recognition, item attrs, body content and custom style. Adding accessible relationships/button type corrects behavior without flattening; native output and dynamic height need renderer/runtime work.

**Keyboard, batch and permission:** Header native Enter/Space; focus cannot enter closed panel; item list move/delete keyboard; structural management single root; root/header/panel locks enforced.

**Specific acceptance — specified, not passed:**
- **T-B69-accordion-01:** Edit closed item without saving Open.
- **T-B69-accordion-02:** Inside form, expanding header cannot submit form.
- **T-B69-accordion-03:** Duplicate pair remaps aria IDs and retains descendants.
- **T-B69-accordion-04:** Disable multiple closes expected items in one Undo.
- **T-B69-accordion-05:** Long/image-loaded panel expands without clipping; closed focus hidden.

**Shared contracts:** IC-01, IC-02, IC-03, IC-04, IC-06, IC-13; II-01, II-02, II-08.

## B69-social-icons — social-icons

**Evidence:** `src/blocks/Components/SocialIcons.tsx:6`. Parent insertion survey: 1 root(s), 5 nodes, selected `social` / `<div>`; native tags: `a`, `div`. Controls/visitor/persistence behavior is not newly runtime verified.

**Current construction and identifiers.** HTML social div with flex gap → four anchor children containing emoji labels. Parent survey5 nodes. These are Link elements, not IconConfig icon elements or service-connected accounts. Root data type/social class; each anchor href # and inline circle styles. No platform/account identity or icon library reference generated.

**Current Inspector.** Generic root Flex/spacing; each child Link text editing and Behaviour destination; no platform selector in inspected type blocks.

**Consumers and anchors:**
- src/blocks/Components/SocialIcons.tsx:13–19
- src/shared/utils/html/typeMapping.ts:31: a→link
- src/editor/inspector/sections/LinkSection.tsx:42–56; typeBlock/bodies/textBodies.tsx:132

**Source findings and consequences:**
- **B69-social-icons-G01:** Emoji-only anchors and placeholder # destinations give no meaningful accessible destination label. Need per-link accessible name and exact URL, not platform assumption from emoji. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-social-icons-G02:** Root select cannot replace an emoji through Icon picker because these children are links; preserve literal content and offer existing inline edit rather than misleading Change icon. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)

**Disposition:** Keep links and content; Redesign Social links list with exact child navigation; Fix meaningful label validation.

**Canonical owners and scope:** Social root owns ordering/gap; each anchor owns text/icon descendants/href/aria-label and style. External account identity not a shared site setting.

**Control specification — proposed destination/behavior unless explicitly labelled existing:**

| ID / home / label | Values, defaults, eligibility and validation | Update, reset and recovery | Owner / evidence status |
|---|---|---|---|
| B69-social-icons-C01 · Content → Social links · Link items / Edit symbol or label / Accessible name | Actual link child; label string required for icon-only link in output; preserve emoji/inline SVG if later authored. | Text/native attributes canonical; no automatic platform conversion; validation explains missing accessible name. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-social-icons-C02 · Behaviour → selected social link → Link · Destination / Open in / Rel | Existing URL etc; # flagged as placeholder not invalid saved content; target/rel existing contract. | Exact link edit then Back; Undo follows target. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-social-icons-C03 · Content → Social links · Add / Duplicate / Move / Remove | New generic link with explicit label/destination; no OAuth or brand service lookup. | One structure command; preserve other links and styles. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |

**Complete edit flow:**

| Stage | Required behavior |
|---|---|
| entry | Select social root→list of4 links. |
| edit | Row selects exact Link; Content for label, Behaviour for URL. |
| add / reorder | Duplicate or Add Link, edit before describing complete; keyboard movement changes DOM order. |
| delete | Remove selected link only; last removal empty Social links with Add. |
| return | Back to Social links keeps origin/root scroll. |
| failure / recovery | Invalid URL draft keeps prior href; removed target cannot receive late change; Undo restores ID/order/accessible name. |

**Preservation, compatibility and dependencies:** Preserve all link attributes, emoji and authored embedded markup, token refs and spacing. Adding names is output correction; do not invent supported platform enum.

**Keyboard, batch and permission:** Editor move actions keyboard; output links discernible and same order; single link semantic editing, compatible style batch only; locks checked per link/root.

**Specific acceptance — specified, not passed:**
- **T-B69-social-icons-01:** Edit second URL without changing others.
- **T-B69-social-icons-02:** Emoji-only link exposes empty-name warning and usable accessible name input.
- **T-B69-social-icons-03:** Reorder changes keyboard order as shown.
- **T-B69-social-icons-04:** Save/reopen keeps emoji/SVG content and custom rel.

**Shared contracts:** IC-01, IC-02, IC-03, IC-04, IC-06, IC-13; II-01, II-02, II-08.

## B69-contact-form — contact-form

**Evidence:** `src/blocks/Components/ContactForm.tsx:6`. Parent insertion survey: 1 root(s), 11 nodes, selected `form` / `<form>`; native tags: `button`, `div`, `form`, `input`, `label`, `textarea`. Controls/visitor/persistence behavior is not newly runtime verified.

**Current construction and identifiers.** HTML form → three .buildrick-contact-field wrappers, each separate label + input(text fullname/email email) or textarea(message); submit button last. Parent survey11 nodes. Builder labels lack for and fields lack IDs; labels are siblings, not implicit wrappers. Form element ID is publish FormBlock key; field name is submission key; wrapper owns label+control unit; no root action means managed publish wiring path if service available. Current config category Forms despite Components source folder.

**Current Inspector.** Fields lists nested input/textarea correctly; After submit service controls; direct native field/label/submit editors. Static Add catalogue does not explicitly list contact-form; runtime survey used registered insertBlock, not Add discoverability proof.

**Consumers and anchors:**
- src/editor/inspector/sections/FormFieldsSection.tsx:43–146: descendant collection, placeholder writer, input-only reorder
- src/editor/inspector/sections/FormAfterSubmitSection.tsx:74–210: server settings
- ../../lib/publish-forms.ts:54–69,120–165,216: named-field discovery and managed form route
- src/blocks/Components/ContactForm.tsx:13–19

**Source findings and consequences:**
- **B69-contact-form-G01:** Unassociated sibling labels are output accessibility gap on builder path. Preserve text while generating unique field ID/label for on explicit correction/new starter. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-contact-form-G02:** Fields dropOn moves native input into target field parent, leaving original label behind and placing two inputs in another wrapper (FormFieldsSection.tsx:139–146). Reorder logical label+field unit. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-contact-form-G03:** Current Label field writes placeholder and type conversion recreates node with restricted attrs; inherited FD-INS fixes especially affect this wrapped composition. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)

**Disposition:** Move Fields→Content; Keep service behavior→Behaviour; Fix label relationship and wrapper-aware field reorder/type preservation.

**Canonical owners and scope:** Form owns field-unit order/submission transport; each wrapper owns label/control pair; field owns name/type/placeholder/default/required; server FormBlock owns delivery/after-submit; submit button owns label/type.

**Control specification — proposed destination/behavior unless explicitly labelled existing:**

| ID / home / label | Values, defaults, eligibility and validation | Update, reset and recovery | Owner / evidence status |
|---|---|---|---|
| B69-contact-form-C01 · Content → Contact form → Fields · Label / Name / Placeholder / Type / Default / Required | Label uses associated label text; Name fullname/email/message independent; placeholder optional; type existing supported fields; unique ID page-wide. | Direct field selection and list use same native field; label association preserved during conversion; no forced rename of submission keys. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-contact-form-C02 · Content → Contact form → Fields · Move up/down / Duplicate / Remove | Move wrapper unit when uniquely owns label+field; if complex shared-label structure, explain and use explicit grouping selection instead of guessing. | Preserve submit last unless deliberate move; duplicate generates unique IDs/for and new editable name; one Undo. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-contact-form-C03 · Behaviour → Form → After submit / Submission → Advanced · Message/Redirect; recipient/spam; action/method/encoding | Existing service values/permissions, including Send to restriction; native action distinct from managed route; no promise editor preview sends real submission. | Actual service save/Retry; document Undo only native attrs; managed service operation has its own recovery. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |

**Complete edit flow:**

| Stage | Required behavior |
|---|---|
| entry | Select existing inserted form→Content Fields; registration does not assert visible Add entry. |
| edit | Choose Name row→exact native field and associated label; Back to form; submit text via its own child. |
| add / reorder | Add logical labelled field before submit; move entire known wrapper; preserve name/id and service discovery. |
| delete | Remove unit shows label/control removal; server stored submissions retained; deleting form does not silently delete historical records. |
| return | Native child/back and service destination/back retain form ID and context. |
| failure / recovery | No site/service→explicit unavailable delivery state, retain local form; save failure retains draft; one Undo restores document units without pretending to undo sent submissions. |

**Preservation, compatibility and dependencies:** Keep form ID, field names, wrapper styles, labels/placeholder independently, submit semantics, native transport and server record association. ID/for enhancement needs compatibility-safe generation; no production submit occurs in audit.

**Keyboard, batch and permission:** Keyboard Fields reorder; actual output labels programmatically related; required/invalid/submit accessible; structure single form, field batch contract only; root+field+service authorization.

**Specific acceptance — specified, not passed:**
- **T-B69-contact-form-01:** Move Email before Name retains Email label/control wrapper and respective names.
- **T-B69-contact-form-02:** Label edit does not change placeholder; conversion preserves ID/for/style/bindings.
- **T-B69-contact-form-03:** Duplicate field remaps ID/for, prompts unique submission key without corrupting original.
- **T-B69-contact-form-04:** No-site editor never claims delivery saved; failed service request retains draft.
- **T-B69-contact-form-05:** Published successful form submission flow tested separately; historical submissions survive document deletion.

**Shared contracts:** IC-01, IC-02, IC-03, IC-04, IC-06, IC-13; II-01, II-02, II-08.

## B69-stack — stack

**Evidence:** `src/blocks/Components/Stack.tsx:13`. Parent insertion survey: 1 root(s), 7 nodes, selected `stack` / `<div>`; native tags: `div`, `p`. Controls/visitor/persistence behavior is not newly runtime verified.

**Current construction and identifiers.** Programmatic stack div display:flex flex-direction:column gap token →3 .stack-item div children each paragraph. Parent survey7 nodes; no separate stack-specific serialized layout model. Element type stack; class stack-item currently identifies starter children; flex styles are canonical; no position-index data necessary. Native DOM order differs from flex visual order/reverse.

**Current Inspector.** Existing Stack type body reuses FlexControls; Text inside etc generic style; child editing via Canvas/Layers.

**Consumers and anchors:**
- src/blocks/Components/Stack.tsx:14–57
- src/editor/inspector/sections/typeBlock/bodies/layoutBodies.tsx:42–58
- src/editor/inspector/sections/layout/FlexControls.tsx:159–219
- src/engine/migration/refineElementTypes.ts:57: class proof for legacy stack

**Source findings and consequences:**
- **B69-stack-G01:** Column preset is an initial value, not an invariant: existing FlexControls can use Row/Reverse/Wrap. Do not constrain saved stack to vertical-only on redesign. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-stack-G02:** Reorder must clarify DOM order versus style order/reverse; rearranging visible list while reverse active should not silently write contradictory flex order. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)

**Disposition:** Keep flex model and full controls; Redesign child navigation/order clarity; no specialized new workspace.

**Canonical owners and scope:** Root styles own layout, children own content; DOM order structural and order property per child separate.

**Control specification — proposed destination/behavior unless explicitly labelled existing:**

| ID / home / label | Values, defaults, eligibility and validation | Update, reset and recovery | Owner / evidence status |
|---|---|---|---|
| B69-stack-C01 · Style → Children layout · Direction / Reverse / Align / Wrap / Gap | Existing Row/Column, reverse and wrap; gap px/rem/em/%/token; initial column and space-4 token retained. | Responsive CSS write; reset reveals fallback; direction change preserves unrelated child attributes. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-stack-C02 · Content → Stack → Children · Edit / Add / Move / Remove item | Actual direct child IDs incl custom non-stack-item; displayed document order; notice if visual flex order differs. | Existing valid structure commands; Add generic container/text; no automatic class conversion. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |

**Complete edit flow:**

| Stage | Required behavior |
|---|---|
| entry | Select stack→Style layout or Content child route. |
| edit | Exact child/paragraph; Back to Stack. |
| add / reorder | Add valid child; move document-order unit via keyboard/drag; explain reverse/order visual result. |
| delete | Delete item subtree or root; no root-to-row type conversion required. |
| return | Restore root/layer/tab; child selection is intentional. |
| failure / recovery | Invalid nesting blocks with reason; Undo restores order and styles independently. |

**Preservation, compatibility and dependencies:** Preserve stack type/class recognition, existing row-oriented/reversed/wrapped stacks, child IDs and tokens; same Flex writer as other flex containers.

**Keyboard, batch and permission:** Keyboard movement; output focus follows DOM not visual CSS; structure single root; explicit style batch per parent eligibility; root/child locks.

**Specific acceptance — specified, not passed:**
- **T-B69-stack-01:** Change Column→Row then reset without losing children/gap.
- **T-B69-stack-02:** Move item while Reverse active preserves stated DOM order and one Undo.
- **T-B69-stack-03:** Unknown custom child still editable.
- **T-B69-stack-04:** Saved legacy stack refines type without restyling.

**Shared contracts:** IC-01, IC-02, IC-03, IC-04, IC-06, IC-13; II-01, II-02, II-08.

## B69-switch — switch

**Evidence:** `src/blocks/Components/Switch.tsx:13`. Parent insertion survey: 1 root(s), 5 nodes, selected `switch` / `<label>`; native tags: `input`, `label`, `span`. Controls/visitor/persistence behavior is not newly runtime verified.

**Current construction and identifiers.** Programmatic label.switch-wrapper(type switch) → input[type=checkbox].switch-input, span.switch-track→span.switch-thumb, text span label. Parent survey confirms this5-node order; hidden input has width/height0 opacity0. Native input owns checked/name/value/required and form submission; wrapper label implicit association; track/thumb visual children; visible label is third child, not first non-input. Builder input type input prevents switch default role from being injected automatically.

**Current Inspector.** Choice body Name/Checked/Required and Edit text; nested input Default/value via Layers; planned Submission value facade per FD-INS. No checked/focus visual CSS consumer found for switch-* selectors in scoped editor src/lib search.

**Consumers and anchors:**
- src/editor/inspector/sections/typeBlock/bodies/formBodies.tsx:102–137: innerText first non-input and nested attr writer
- src/blocks/Components/Switch.tsx:30–91: exact construction
- src/shared/utils/html/typeMapping.ts:222–235: default role applies only to matching switch native tag
- src/engine/migration/refineElementTypes.ts:41–49: class-aware wrapper recognition

**Source findings and consequences:**
- **B69-switch-G01:** Current Edit text targets track span before actual label, so request goes to decorative container (formBodies.tsx:102). Native child shape runtime-confirmed, click behavior not tested. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-switch-G02:** No source-located checked/focus rule changes track/thumb; role=switch not authored on native input and hidden0-size focus needs visual reflection. Native checkbox remains functional but full switch experience not established. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-switch-G03:** Removing native input or decorative track independently can orphan wrapper semantics; proposed content/appearance paths must preserve pair. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)

**Disposition:** Fix label target and visible checked/focus semantics; Keep native checkbox form model; Redesign compound part targeting.

**Canonical owners and scope:** Native input owns on/off/default submission state; wrapper owns label association; visible text owns content; track/thumb own visual styling; visitor current state is runtime, defaultChecked authored.

**Control specification — proposed destination/behavior unless explicitly labelled existing:**

| ID / home / label | Values, defaults, eligibility and validation | Update, reset and recovery | Owner / evidence status |
|---|---|---|---|
| B69-switch-C01 · Content → Switch · Label / Name / Submission value / Checked by default / Required | Exact text-bearing caption, not decorative track; input value string incl intentional empty; booleans mixed; native checkbox value absence means native default, not empty. | Use actual inner input attrs and caption ID; one root-scoped command; reset removes attr, not forced false/default. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-switch-C02 · Style → Switch appearance · Track / Thumb / Label | Part selector navigates actual child and retains ordinary supported style fields/states only; preserve dimensions44×24 track,20px thumb and saved custom styles. No Checked or Focus-visible authoring selector, cross-element style rule editor or new PseudoStateId is added. | Bounded renderer/runtime correction supplies native checked thumb/track feedback and visible keyboard focus for recognized structure. These are component behavior/accessibility requirements, not editable new state-style UI. Existing normal/hover/focus/active/disabled authoring retains actual supported semantics; visitor state never serialized. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-switch-C03 · Behaviour → Switch · Preview on/off | Editor-only demonstration; no backend action/webhook assumed. | Preview restores original native state on exit; does not toggle authored checked unless user edits Checked by default. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |

**Complete edit flow:**

| Stage | Required behavior |
|---|---|
| entry | Select wrapper→Content Switch; header names compound control. |
| edit | Edit label resolves third text child; advanced native input entry available with Back. |
| add / reorder | Switch moves as complete label/input/track/caption unit; internal part reorder only validated and explicit, never free whole-item text replacement. |
| delete | Whole switch delete removes compound unit; deleting input separately warns semantic loss and leaves repair/Undo; no silent recreation on selection. |
| return | Part edit→Back to Switch restores wrapper/context. |
| failure / recovery | Legacy wrappers recognized by structure; missing/ambiguous input/caption yields repair selection, not first-child guess; Undo restores reference/structure. |

**Preservation, compatibility and dependencies:** Preserve native checkbox name/value/checked, caption, track/thumb custom styling; add role/focus wiring only through coordinated correction; no new server action model.

**Keyboard, batch and permission:** Output Space toggles focused native input; focus visible on track; role and checked semantics correct; editor part actions keyboard; semantic batch reads own inner input, root/child locks enforced.

**Specific acceptance — specified, not passed:**
- **T-B69-switch-01:** Edit label requests actual text child, never switch-track.
- **T-B69-switch-02:** Checked/default value round-trip; preview toggles do not persist default.
- **T-B69-switch-03:** Keyboard focus visible and Space changes visual/native checked together.
- **T-B69-switch-04:** Submission value parent and nested field stay identical.
- **T-B69-switch-05:** Delete/Undo whole switch restores all5 nodes/attrs.

**Shared contracts:** IC-01, IC-02, IC-03, IC-04, IC-06, IC-13; II-01, II-02, II-08.

## B69-tabs — tabs

**Evidence:** `src/blocks/Components/Tabs.tsx:13`. Parent insertion survey: 1 root(s), 14 nodes, selected `tabs` / `<div>`; native tags: `button`, `div`, `p`, `span`. Controls/visitor/persistence behavior is not newly runtime verified.

**Current construction and identifiers.** Programmatic tabs div → div.tabs-nav[role=tablist] containing3 buttons[role=tab] each text span, plus3 sibling panels[role=tabpanel] each paragraph. Parent survey14 nodes; first active/display:block, others none. Button/panel relationship currently positional parallel arrays; aria-selected and active class authored on buttons, display styles on panels. No generated ID/aria-controls/aria-labelledby mapping, initial-active ID or button type.

**Current Inspector.** Generic container Style and child button/text editors; Layers can reach hidden panels. No pair-aware Tabs controls in inspected Inspector registry; no dedicated visitor runtime located by marker search.

**Consumers and anchors:**
- src/blocks/Components/Tabs.tsx:27–103
- src/shared/constants/elementCapabilities.ts:171: generic tabs container
- src/engine/migration/refineElementTypes.ts:58: legacy class/tablist type detection
- Scoped search editor src + root lib/server: tab-button/tab-panel/tabs-nav only builder; no dedicated interaction consumer located

**Source findings and consequences:**
- **B69-tabs-G01:** Independent button and panel arrays can diverge when generic reorder/delete edits one side; active styles do not establish an accessible or persisted relationship. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-tabs-G02:** Switching hidden content for editing currently has no dedicated transient flow; must not require saving display:block or changing initial active state. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-tabs-G03:** No source-located click/arrow-key activation/focus/ARIA linkage; do not label Tabs fully functional from root default-panel survey. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)

**Disposition:** Redesign compound Tabs content/relationship controls; Fix pairing, visitor keyboard/runtime and output semantics; Keep existing markup/data.

**Canonical owners and scope:** Tabs root owns ordered tab pairs and initial active pair; each pair references stable button/panel element IDs; text/content lives on actual descendants. Editor inspected pair is temporary state separate from initial active pair.

**Control specification — proposed destination/behavior unless explicitly labelled existing:**

| ID / home / label | Values, defaults, eligibility and validation | Update, reset and recovery | Owner / evidence status |
|---|---|---|---|
| B69-tabs-C01 · Content → Tabs → Tabs · Tab list / Label / Edit panel / Add / Duplicate / Move / Delete | Each row is explicit button-ID+panel-ID pair; labels arbitrary sanitized text; minimum0 allowed empty state; unpaired existing nodes shown Unlinked, never guessed by label. | Pair-aware commands update both structures atomically. Legacy read view lists buttons/panels separately; Repair requires explicit labelled Tab→Panel selection and Apply/Cancel. No guessed/index pairing writes, including equal-length arrays. Unchanged generic/native routes remain available. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-tabs-C02 · Behaviour → Tabs · Initial tab / Activation | Initial tab references pair ID; proposal default first valid pair for new block. Visitor activation on Enter/Space; Left/Right/Home/End moves focus with manual activation, predictable and keyboard-safe. | Choosing initial tab authored; edit-view navigation never saves it. Deleting initial pair selects nearest surviving pair with impact summary in same command; reset first valid pair explicit. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-tabs-C03 · Content → Tabs → Relationships · Tab button / Panel / Link pair | Buttons type=button; unique native IDs, aria-controls, panel aria-labelledby; one canonical panel per pair within root. | Validate targets exist/within root/not already paired; missing relation stays visible and blocks pair-destructive command, not unrelated styling. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |

**Complete edit flow:**

| Stage | Required behavior |
|---|---|
| entry | Root→Content Tabs lists actual pairs/anomalies; generic Layers remains alternate. |
| edit | Edit panel temporarily reveals it and selects child; no authored display or initial tab mutation. Label action selects text span. |
| add / reorder | Add/duplicate complete pair; remap internal IDs; move paired button+panel consistently; preserve external references and show impacts. |
| delete | Delete tab pair identifies its panel subtree and references; Cancel default for populated panel; one Undo restores both and initial selection. Orphan-only deletion explicitly targets orphan. |
| return | Back to Tabs restores inspected pair/list focus; leaving restores visitor initial-state view. |
| failure / recovery | Broken/multiple relationships are repairable via explicit Link pair; legacy data remains until confirmed operation; no automatic deletion/flattening. Runtime initialization must fail locally without hiding unrelated content. |

**Preservation, compatibility and dependencies:** Need explicit relationship serialization and migration plan preserving existing engine/native IDs/styles; existing custom markup remains generic if not recognized. Paired runtime shared by editor-preview/publish; ordinary editing must suppress visitor activation. No tab data stored only in array index.

**Keyboard, batch and permission:** Editor list move alternatives; output tablist roving tabindex, manual keyboard activation and named panels; inactive panels not focusable; buttons type=button in form. Structure single Tabs owner, no mixed-pair batch.

**Specific acceptance — specified, not passed:**
- **T-B69-tabs-01:** Three pairs reorder/duplicate/delete with labels/panels/IDs matched and one Undo.
- **T-B69-tabs-02:** Open second panel for editing leaves published initial first unchanged.
- **T-B69-tabs-03:** Keyboard Right→Enter selects correct panel; focus and aria-selected agree.
- **T-B69-tabs-04:** Nested Tabs roots remain isolated.
- **T-B69-tabs-05:** Legacy mismatched button/panel arrays show repair state, no silent positional reassignment.

**Exact persisted relationship proposal:** PROPOSED additive ElementData.attributes contract, version1; not implemented

| Stored field | Value / meaning |
|---|---|
| `tabs root data-buildrick-tabs-version` | String "1" for structures explicitly created/repaired by the new command. |
| `tab button data-buildrick-tab-panel-id` | Engine ElementData.id of its single owned panel; canonical forward link. Each target panel may have only one owning tab in that Tabs root. |
| `tabs root data-buildrick-tabs-initial-tab-id` | Engine ElementData.id of initial tab button, or attribute absent when no pairs exist. Tab order is actual tablist child order; do not store a second copied array. |

**Validation:** All references must resolve on current page, within this root and outside nested Tabs roots. Referenced button role=tab and panel role=tabpanel must be compatible. One tablist owner; no duplicate panel claim/cycle. Broken links remain Missing panel, not relinked by class/label/index.

**Native output:** Renderer/export resolves engine IDs to native HTML IDs. Preserve explicit valid user id; otherwise generate deterministic collision-free bk-tab-/bk-panel- ID. Emit button type=button, aria-controls and panel aria-labelledby from the canonical link. aria-selected, tabindex and panel hidden state derive from chosen initial/runtime state, not a second independent persisted source.

**Migration:** No automatic pairing by index, even for equal-length legacy arrays. Read-only legacy view lists actual buttons/panels separately. Repair opens explicit labelled Tab→Panel pickers with preview and Apply/Cancel; user-confirmed mapping is one transaction, preserving all IDs/content/styles. Custom/ambiguous structure retains generic routes and original runtime/custom scripts until reconciled.

**Reference lifecycle:** Add creates pair and initial first ID when empty. Duplicate remaps internal engine IDs and forward refs; root duplication remaps initial-tab ID. Reorder moves existing paired nodes without changing IDs. Delete active pair updates initial ref to stated nearest survivor in same transaction; if none remove initial attribute. Undo restores exact attrs/nodes/order. External references are separately reported and retained or explicitly repaired; never silently retarget.

**Compatibility gate:** Shared schema/attribute validators, sanitizer, server persistence, clone/remap commands, importer, editor preview and published runtime must understand these reserved keys before enabling authoring. Field names are proposed contract, not a claim keys currently exist.

**Shared contracts:** IC-01, IC-02, IC-03, IC-04, IC-06, IC-13; II-01, II-02, II-08.

## B69-modal — modal

**Evidence:** `src/blocks/Components/Modal.tsx:13`. Parent insertion survey: 2 root(s), 10 nodes, selected `button` / `<button>`; native tags: `button`, `div`, `h3`, `p`, `span`. Controls/visitor/persistence behavior is not newly runtime verified.

**Current construction and identifiers.** Programmatic builder inserts two siblings: button.modal-trigger with span; separate container div.modal-overlay[role=dialog aria-modal=true display:none]→content div→header div(h3+close button/span)+body div/p. Returns trigger ID. Parent survey confirms2 roots/10 nodes and default Button Inspector. No persisted trigger→overlay relation or unique dialog/title IDs written. Modal overlay is appended to parent rather than nested under trigger. Trigger and close lack explicit type=button; class names alone ambiguous with multiple dialogs.

**Current Inspector.** Selected returned trigger has Button Content/Style/Link/Effects; sibling hidden overlay available via Layers and generic styling. Default panel presence does not establish dialog open/close.

**Consumers and anchors:**
- src/blocks/Components/Modal.tsx:14–61,96–155
- src/blocks/blockRegistry.ts:239–273,364: validation uses declared button and builder returns one ID
- src/engine/elements/manager/ElementCRUD.ts:146–159: generic deletion removes selected subtree, not unrelated sibling
- Scoped editor src + root lib/server marker search found modal-trigger/overlay/close only builder; no dedicated modal runtime located

**Source findings and consequences:**
- **B69-modal-G01:** Trigger delete/duplicate applies to one subtree unless a specific relationship command exists; sibling overlay survives or is not duplicated. No relationship identified on builder path. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-modal-G02:** Declared button insertion validates parent for trigger only; fixed overlay sibling may be invalid in button/link/phrasing-specific parent. Need compound placement validation before any mutation. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-modal-G03:** No source-located open/close/focus-trap/return/background interaction runtime. Visible close × lacks accessible label and dialog title lacks aria-labelledby link. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)

**Disposition:** Redesign explicit trigger/dialog relationship and authoring view; Fix compound insertion/recovery and visitor semantics; preserve sibling architecture until deliberate compatible migration.

**Canonical owners and scope:** Trigger owns label and dialog reference; overlay owns content/title/close behavior and visual layout; parent placement owns sibling roots. Engine relationship IDs not guessed DOM order. Editor reveal is temporary, visitor open state never authored as display override.

**Control specification — proposed destination/behavior unless explicitly labelled existing:**

| ID / home / label | Values, defaults, eligibility and validation | Update, reset and recovery | Owner / evidence status |
|---|---|---|---|
| B69-modal-C01 · Content → Modal trigger → Dialog · Linked dialog / Edit dialog / Link existing dialog | One dialog element ID or Missing/unlinked; only valid dialog within current page; new insert creates explicit pair; existing ambiguous siblings require explicit selection. Page-local references cannot be authored inside a shared component definition or through an unsupported instance override. Existing links remain inspectable and preserved; relationship mutation is unavailable with reason: This dialog belongs to one page; a shared component cannot store its reference. Explicit alternative: Insert local modal at page root. | Link commit guarded/Undoable; no auto nearest-overlay guess. Edit dialog reveals temporary overlay and selects body with Back to trigger. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-modal-C02 · Content → Dialog · Title / Body / Close button label | Actual heading/body/close node; visible × can remain but accessible name Close dialog; dialog labelled by title or explicit string. | Native child edits preserve IDs; role/aria relation fixed through canonical command; no duplicate hidden content editor. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-modal-C03 · Behaviour → Dialog · Close on Escape / Backdrop click / Initial state | PROPOSED basic supported runtime policy: initially closed, Escape closes, backdrop closes only true backdrop target; default both true for new dialog. Preserve legacy unknown behavior without asserting existing support. | Author once per dialog; transient Preview open has no document write; focus trap/background inertness always semantic runtime requirement, not optional style toggle. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-modal-C04 · Content → Modal actions · Duplicate modal / Delete trigger only / Delete dialog and linked triggers | Compound duplication clones both and remaps links; ordinary trigger duplicate can intentionally reference same dialog with explicit label. Whole-dialog deletion summarizes every linked trigger and descendant. | Default Cancel on destructive shared dialog operation; trigger-only deletion preserves dialog; one transaction for pair operations and correct Undo. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |

**Complete edit flow:**

| Stage | Required behavior |
|---|---|
| entry | Select inserted trigger→Content Modal relationship; selecting overlay offers Back to named trigger(s), choose when multiple. |
| edit | Edit dialog temporarily reveals; edit title/body/close then Back restores original canvas view and trigger focus; Preview runtime separate from editing. |
| add / reorder | NEW modal decision: before placement, resolve document versus shared-component ownership. Refuse creation or linking of a page-local dialog from a shared component definition, and refuse component-owned instance mutations that would require a new reference override model. Do not detach, change instance schema, or save a page reference into the definition. Show Insert local modal at page root as an explicit user action; activation validates page edit permission, creates BOTH local trigger and overlay at current page root outside the component, preserves the originating component context for Back, and never changes its definition or instance. Cancel performs no mutation. In a valid local-document context, trigger enters validated requested parent/drop index; overlay always appends as direct child of current page root, visibly named Dialog in Layers. Insertion preview says Dialog will be added at page root. Validate trigger parent AND page-root overlay before atomic commit. If trigger placement invalid, reject with reason and explicit Insert modal at page root alternative; never silently relocate. Existing overlays remain where saved until explicit Move dialog to page root. Move trigger retains target ID; Duplicate modal clones overlay at page root and remaps links. |
| delete | Generic Delete trigger means trigger only with dialog retained and accessible from Layers; modal-specific Delete dialog and linked triggers names full impact. Removing overlay leaves linked trigger Missing dialog, never points at another overlay. |
| return | Close authoring view returns origin trigger/context; missing trigger returns surviving page/Layers with explanation; visitor close returns focus to opener. |
| failure / recovery | Any insertion failure rolls back both roots. Broken link repair requires explicit valid target. Cancel no content mutation. One Undo restores compound identity, all links and positions. |

**Preservation, compatibility and dependencies:** Engineering dependency: persistent relationship representation, sanitizer/export support, duplicate/delete reference handling and shared accessible runtime. A portable shared-component modal/instance-reference model is outside this closure; no schema or detach workaround is implied. Existing shared-definition links stay inspectable and unchanged; new page-local relationship writes are guarded at the canonical command boundary as well as in UI. Do not infer active dialogs from classes or implement destructive migration automatically. Existing root IDs/content/styles/sibling positions preserved unless explicit move.

**Keyboard, batch and permission:** Editor relationship chooser/reveal keyboard; output dialog focus trap/Escape/background inertness and focus return; type=button trigger/close in forms. Compound operations single dialog, no primary-only multi. Guard trigger, dialog, parent and linked triggers.

**Specific acceptance — specified, not passed:**
- **T-B69-modal-01:** Two inserted modals link each trigger to its own overlay, independent of sibling order.
- **T-B69-modal-02:** Edit hidden dialog then Back saves no display override.
- **T-B69-modal-03:** Delete trigger only preserves its overlay; Delete dialog reports all triggers; Undo restores references.
- **T-B69-modal-04:** Duplicate modal clones both roots and IDs; no cross-opening original.
- **T-B69-modal-05:** Failure inserting overlay leaves no partial trigger.
- **T-B69-modal-06:** Visitor keyboard open/close/focus return and nested form non-submit behavior verified before functional release.
- **T-B69-modal-07:** From shared-definition edit mode, Insert modal and Link existing dialog cannot write a page-local reference or detach an instance. Cancel leaves definition and document unchanged. Explicit Insert local modal at page root creates both roots outside the component only after page permission validation; Back restores originating component context. Existing shared links remain inspectable and unchanged; unsupported instance-reference writes are also refused.

**Exact persisted relationship proposal:** PROPOSED additive ElementData.attributes contract, version1; not implemented

| Stored field | Value / meaning |
|---|---|
| `dialog overlay data-buildrick-dialog-version` | String "1" for explicitly created/repaired dialog. |
| `trigger data-buildrick-dialog-target-id` | Engine ElementData.id of target dialog overlay on same page. Multiple triggers may reference one dialog; no inferred sibling/nearest-class match. |
| `dialog overlay data-buildrick-dialog-close-escape` | String "true" or "false"; new dialog default true. Legacy missing remains unspecified until explicit repair, not a claim of existing behavior. |
| `dialog overlay data-buildrick-dialog-close-backdrop` | String "true" or "false"; new dialog default true; click must originate on actual backdrop, never descendant content. |
| `close control data-buildrick-dialog-close` | String "true" marks a close control within its owning dialog; no cross-dialog target when nesting exists. |
| `dialog overlay data-buildrick-dialog-label-id` | Engine ElementData.id of chosen existing title node; alternatively existing aria-label provides explicit label. No duplicate text copy. |

**Validation:** Resolve canonical ownership before writes: this version supports page-local trigger/dialog references only. Reject a new page-local reference inside a shared definition and any component-owned instance edit requiring an unsupported override model; never detach or change instance schema implicitly. Existing saved references remain inspectable and preserved, even when new authoring is restricted. Explicit Insert local modal at page root creates both local roots outside the component under current page permissions; it is not an automatic fallback. Trigger and overlay exist on same page; target has dialog role and belongs to no unrelated unresolved relationship; title is within target. Trigger cannot target itself/ancestor cycle. Close controls belong to nearest explicitly owned dialog. Validate both roots/placement and current permissions before atomic command.

**Native output:** Resolve overlay/title engine refs to valid unique native HTML IDs, preserving existing explicit ids. Otherwise use deterministic collision-free bk-dialog-/bk-dialog-title- ids. Derive trigger aria-controls/aria-haspopup=dialog and dialog aria-labelledby. New trigger/close button type=button. Runtime controls open state, focus, aria visibility and background inertness; editor reveal never writes display override or open attribute.

**Migration:** Existing trigger and overlay stay unrelated until explicit Link existing dialog selection with ID-based preview and Apply/Cancel. Do not auto-pair by order, proximity or matching class. Link/label/close-control repair is one reversible command and never deletes extra overlays or moves siblings silently.

**Reference lifecycle:** Duplicate modal clones both roots and remaps target/title/internal IDs; plain Duplicate trigger keeps same explicit dialog ref and states that shared target. Delete trigger only preserves dialog. Explicit Delete dialog and linked triggers removes the named dialog and every listed referencing trigger atomically after confirmation. Generic overlay deletion preserves referencing triggers and their now-unresolved reference as Missing dialog for explicit repair; it never silently deletes triggers or retargets them. Undo restores original roots/order/refs.

**Compatibility gate:** Reserved key/schema validation, serializer/sanitizer, server and export, clone/remap/delete reference index, compound transaction rollback and shared visitor runtime must ship together. Existing plain button/overlay generic editing remains safe until integration passes.

**Shared contracts:** IC-01, IC-02, IC-03, IC-04, IC-06, IC-13; II-01, II-02, II-08.

## B69-table — table

**Evidence:** `src/blocks/Components/Table.tsx:19`. Parent insertion survey: 1 root(s), 46 nodes, selected `table` / `<table>`; native tags: `button`, `div`, `span`, `table`, `tbody`, `td`, `th`, `thead`, `tr`. Controls/visitor/persistence behavior is not newly runtime verified.

**Current construction and identifiers.** Builder inserts outer div.table-wrapper with overflow-x:auto; nested table.data-table is returned/selected. table→thead→tr→four th each text span; tbody→three tr each four td containing text/status span subtree/action button. Parent survey1 root but46 nodes, selected nested table. Native thead/tbody/tr/th/td tags stored as container descendants; semantic roles come from native tags, not ordinary container freedom. No caption/scope/headers generated. Row action Edit button is sample button, not record editor.

**Current Inspector.** Generic table appearance and descendant Layers selection; no row/column/cell-specific editor in inspected registry. Wrapper can be selected via breadcrumb for overflow.

**Consumers and anchors:**
- src/blocks/Components/Table.tsx:20–48,51–91,99–208
- src/engine/elements/Element.ts:122: preserves native allowed tags; table wrapper stays div
- src/shared/utils/html/typeMapping.ts:42: table type
- src/shared/constants/elementCapabilities.ts:173: table generic container

**Source findings and consequences:**
- **B69-table-G01:** Generic container operations on tr/th/td need native nesting/relationship rules. A root family mapping alone does not preserve rectangular rows or merged cells. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-table-G02:** Deleting selected table leaves wrapper unless explicitly handled; root insertion return is not inserted subtree root. Never silently delete a nonempty custom wrapper. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-table-G03:** Headers have no scope/caption relationship; Edit buttons have no special data action. Existing meaningful styling and cell children must remain, not flattened to plain strings. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)

**Disposition:** Redesign Content Table structure/cell navigation; Fix valid native operation boundaries and accessible header controls; Keep wrapper and arbitrary cell content.

**Canonical owners and scope:** Table owns row groups/column structure, caption and header associations; row owns cells, each cell owns arbitrary content/styles; outer wrapper owns scrolling/width, separately selectable.

**Control specification — proposed destination/behavior unless explicitly labelled existing:**

| ID / home / label | Values, defaults, eligibility and validation | Update, reset and recovery | Owner / evidence status |
|---|---|---|---|
| B69-table-C01 · Content → Table → Structure · Rows / Columns / Add / Duplicate / Move / Delete | Simple rectangular grid only: Add row creates same cell count as adjacent compatible row in same row group, copying native th/td type and appearance styles/classes only; all cells blank, no child buttons/links/status/content, IDs, bindings or event/action attrs copied. Add column creates blank th(scope=col) in header rows and blank td in body rows, using adjacent appearance. Duplicate explicitly copies full chosen row with reference remapping. | Atomic cross-row column command; header/body row operations stay in own row group. Any rowspan/colspan other than effective1, ragged/custom header associations or unresolved grid disables unsafe rectangular operation with explanation; safe native/cell content editing remains. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-table-C02 · Content → Table → Cell · Edit cell content / Header type / Scope / Native spans | Select actual cell; th vs td explicit; scope auto/col/row/colgroup/rowgroup only for th. Existing native colspan accepts integers1–1000; rowspan accepts0–65534, where0 spans to end of current row group. Missing span means1; Remove span removes attr, Set1 authors1, neither equals0. Preserve out-of-range/custom legacy attrs on read with error; do not normalize. No merged-cell authoring UI is introduced. | Tag/scope/native-attr change validates resulting table; unsupported destructive span conversion stays unchanged. Ordinary content edit preserves all span/header attrs and nested button/status markup; no flattening. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-table-C03 · Content → Table → Accessibility · Caption / Header associations | Optional visible caption native element; empty removes only caption by explicit action; IDs/headers references preserved for custom complex tables. | One structural command; native semantics not simulated with div roles. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-table-C04 · Style → Table; breadcrumb → Scroll wrapper · Table appearance / Wrapper overflow | Table border-collapse and existing styles; wrapper overflow-x:auto, independent size; no cell-grid CSS conversion. | Reset correct selected owner; Delete table offers optional remove empty generated wrapper, never automatic custom wrapper removal. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |

**Complete edit flow:**

| Stage | Required behavior |
|---|---|
| entry | Select returned table→Content Structure; header breadcrumb exposes wrapper. |
| edit | Row/column coordinates locate native cell, then its content child; Back to cell/table restores coordinates and stable IDs. |
| add / reorder | Add/move complete row within own thead/tbody; column operation updates every compatible row atomically. Complex merged tables show unsupported operation and retain safe native editing. |
| delete | Delete row/column explains affected cells/content/header refs; Delete table retains wrapper unless explicitly chosen empty generated wrapper cleanup. Cancel preserves tree. |
| return | Native child→cell→table; wrapper style entry returns exact table. |
| failure / recovery | Invalid ragged/span operation shows affected coordinates and does nothing; one Undo restores groups/cells/IDs/header refs; preserve complex saved tables rather than normalize on read. |

**Preservation, compatibility and dependencies:** Need native table-aware structural commands and grid analysis; no CSV/CMS/table-data engine assumed. Preserve wrapper, semantic tags, all cell content/action elements, styles and custom merged cells; stable returned target remains table.

**Keyboard, batch and permission:** Editor row/column/cell navigation and reorder keyboard; output native headers/caption meaningful; button sample type/action explicit; structural single table, cell style batch only compatible set with no hidden semantic changes.

**Specific acceptance — specified, not passed:**
- **T-B69-table-01:** Inserted native table remains table inside div; no nested-table wrapper regression.
- **T-B69-table-02:** Move body row preserves all four cells and action children; Undo exact. Add row produces blank cells with appearance only; Duplicate explicitly preserves/remaps full cell subtrees.
- **T-B69-table-03:** Delete populated column reports all rows and preserves remaining alignment.
- **T-B69-table-04:** Merged/ragged table rejects unsupported bulk operation without data loss; rowspan0 preserved through content edit/reopen, Remove span differs from Set1 and from0; exact colspan/rowspan bounds validated.
- **T-B69-table-05:** Delete table does not delete unrelated wrapper siblings; optional empty-wrapper cleanup explicit.
- **T-B69-table-06:** Sample Edit button never represented as working record editor.

**Shared contracts:** IC-01, IC-02, IC-03, IC-04, IC-06, IC-13; II-01, II-02, II-08.

## B69-product-card — product-card

**Evidence:** `src/blocks/Ecommerce/ProductCard.tsx:15`. Parent insertion survey: 1 root(s), 11 nodes, selected `product-card` / `<div>`; native tags: `button`, `div`, `h3`, `img`, `p`, `span`. Controls/visitor/persistence behavior is not newly runtime verified.

**Current construction and identifiers.** HTML div.product-card marker→image wrapper(img+stock badge), content div(category p,name h3,description p, footer price span+Add button). Parent survey11 nodes; no product record ID/payment link generated. data-product-card; child data-bind image/category/name/description/price; data-add-to-cart on button. Binding marker alone is not a stored CMSBindingManager record. Source text In Stock is static.

**Current Inspector.** Registered construction and generic editing preserved; specialized product/checkout authoring remains DEFERRED by M07-68/FD-INS-02. Existing raw attributes/config preserved but not promoted to verified commerce. No live checkout or external payment action performed. Static Add catalogue does not include this ID in inspected catalogue. Child image/text and button routes exist.

**Consumers and anchors:**
- src/engine/export/StripeInjector.ts:207–230: data-add-to-cart ancestor card, DOM field reading, generated fallback productId
- src/engine/export/StripeInjector.ts:249–263: requires enabled+publishableKey
- src/engine/export/ExportEngine.ts:654: optional injection
- src/engine/cms/DataBindResolver.ts:28–110 and index.ts:15: helpers exported; no active caller located in scoped src search
- src/shared/constants/elementCapabilities.ts:183: commerce generic until later arc

**Source findings and consequences:**
- **B69-product-card-G01:** No productId/paymentLink in generated card; injector falls back to SKU text or Date.now ID and parses displayed price text. Real identity/pricing/checkout correctness not established. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-product-card-G02:** data-bind helper exists but registration/association to an actual collection/item is not established by block insertion. Do not show Connected to Products merely from attribute. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-product-card-G03:** Runtime Added! resets button textContent and can destroy custom button descendants if used; preserve such markup and defer active transaction promise. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)

**Disposition:** Keep static product presentation/markers; Defer specialized product binding/cart authoring; Fix existing generic control preservation.

**Canonical owners and scope:** Document owns static tree/attrs/styles; actual CMS records/bindings require explicit CMS owner; commerce provider/config owns transactions. A price string is not authoritative server price.

**Control specification — proposed destination/behavior unless explicitly labelled existing:**

| ID / home / label | Values, defaults, eligibility and validation | Update, reset and recovery | Owner / evidence status |
|---|---|---|---|
| B69-product-card-C01 · Content → Product card → Content parts · Image / Name / Description / Category / Price text / Stock text | Existing child text/source; read-only Commerce setup not verified status when markers exist without confirmed config; data-bind attributes preserved. | Edit static child only; no auto-create Product record. Existing explicit CMS Binding route can bind supported child field under IC-07. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-product-card-C02 · Behaviour → Product action → Status · Existing Add-to-cart marker | Show recognized saved marker and setup unavailable/unverified reason; no fake enabled checkout/test transaction. | Keep serialized data untouched; ordinary Link cannot silently erase commerce marker or claim equivalent commerce. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-product-card-C03 · Style → Product card / selected child · Presentation | Existing layout/image-fit/line-clamp and typography; no price formatting control beyond literal text. | Scope styles per normal contract; reset leaves data markers. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |

**Complete edit flow:**

| Stage | Required behavior |
|---|---|
| entry | Select existing/registered-inserted product card; no assumed Add catalogue exposure. |
| edit | Content parts route to image/text; CMS edits only through verified canonical binding operations, explicitly named. |
| add / reorder | Generic child order/duplicate permitted within existing nesting; card duplicate preserves presentation and markers but must not silently generate or claim a new product record. |
| delete | Delete card removes document subtree only, never CMS inventory/provider product. |
| return | Child/CMS source task returns same card/field; revoked source access keeps current binding. |
| failure / recovery | Unconfigured marker state explicit; missing resource/source keeps previous content and recovery; Undo local tree only, never cart/payment transaction. |

**Preservation, compatibility and dependencies:** Registered construction and generic editing preserved; specialized product/checkout authoring remains DEFERRED by M07-68/FD-INS-02. Existing raw attributes/config preserved but not promoted to verified commerce. No live checkout or external payment action performed. Revisit only after actual product identity, currency minor-unit/server price, stock, binding, provider configuration, cart/publish gates and service recovery defined. Preserve data-bind/product/payment attrs; no migration to display-text pricing.

**Keyboard, batch and permission:** Keyboard static editing; accessible image/name/button labels retained; commerce operations no batch authoring until separately specified; document and CMS/provider permissions independent.

**Specific acceptance — specified, not passed:**
- **T-B69-product-card-01:** Insert keeps all markers and static children; no connected/working claim.
- **T-B69-product-card-02:** Edit price copy cannot mutate authoritative provider/CMS price implicitly.
- **T-B69-product-card-03:** Duplicate/delete retains references/presentation without creating/deleting product records.
- **T-B69-product-card-04:** Configured export regression later checks stable IDs and custom button descendants, unconfigured output truthful.

**Shared contracts:** IC-01, IC-02, IC-04, IC-05, IC-07, IC-13; II-02, II-08; M07-68.

## B69-product-grid — product-grid

**Evidence:** `src/blocks/Ecommerce/ProductGrid.tsx:20`. Parent insertion survey: 1 root(s), 1 nodes, selected `product-grid` / `<div>`; native tags: `div`. Controls/visitor/persistence behavior is not newly runtime verified.

**Current construction and identifiers.** Programmatic product-grid div with display:grid repeat(auto-fill,minmax(280px,1fr)), gap/padding tokens; no children/template created. Parent survey confirms1 node only. data-cms-collection="products", data-cms-template="true" attrs; no canonical collection binding call in builder. These attribute strings are not proof of real collection ID/source.

**Current Inspector.** Registered construction and generic editing preserved; specialized product/checkout authoring remains DEFERRED by M07-68/FD-INS-02. Existing raw attributes/config preserved but not promoted to verified commerce. No live checkout or external payment action performed. Generic grid styling applies; no type-specific Collection section because product-grid generic, not collection-list.

**Consumers and anchors:**
- src/blocks/Ecommerce/ProductGrid.tsx:26–43
- src/engine/cms/CMSBindingManager.ts:329–355: canonical bindCollection/bindCollectionList requires record in manager
- src/engine/cms/RepeaterRenderer.ts:158–179: consumes canonical binding
- Scoped src and root lib/server search found data-cms-collection/template only builder

**Source findings and consequences:**
- **B69-product-grid-G01:** Builder comment claims CMS-bound grid, but writes marker attrs without children or manager binding; runtime survey confirms empty generated structure. Functional repetition not established. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-product-grid-G02:** Do not automatically transform product-grid into collection-list or manufacture Products collection; this would alter saved resource ownership and references. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)

**Disposition:** Keep generic grid/content and marker data; Defer specialized commerce repeater authoring; explicit empty/unconfigured state.

**Canonical owners and scope:** Document root styles/children/marker attrs; CMS collection/query/template owner only when explicit canonical binding exists. No record data owned by grid.

**Control specification — proposed destination/behavior unless explicitly labelled existing:**

| ID / home / label | Values, defaults, eligibility and validation | Update, reset and recovery | Owner / evidence status |
|---|---|---|---|
| B69-product-grid-C01 · Content → Product grid → Content/status · Children / Saved source marker | Empty state explains No item template / commerce binding not established; marker products shown as saved configuration, not live collection name; existing children editable. | No record creation on selection; Add generic allowed child remains static. Canonical collection-list is separate user-chosen block, not silent conversion. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-product-grid-C02 · Style → Children layout → Grid · Tracks / Gap / Padding | Preserve auto-fill minmax280px expression as Custom/advanced; existing units/token refs; no default3-column coercion. | Scoped style edit lossless; reset current override only. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-product-grid-C03 · Content → Product grid → Source details · Open existing CMS reference if resolvable | Only stable actual collection ID resolves; unresolved products marker shows unresolved. | Read-only source inspection; no unsafe match-by-name binding. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |

**Complete edit flow:**

| Stage | Required behavior |
|---|---|
| entry | Select existing product-grid root; visible empty template state. |
| edit | Existing static child via Layers/Content; root grid tracks via Style. |
| add / reorder | Existing valid product-card/container children may be added/reordered as static document children; explain not dynamic records. |
| delete | Root/child deletion does not delete CMS records or Products collection; Undo document tree. |
| return | CMS view return to exact grid; deliberate new selection supersedes old return. |
| failure / recovery | Unknown/deleted source never auto-binds nearest collection; retain attrs/children; no spinner pretending load is pending indefinitely. |

**Preservation, compatibility and dependencies:** Registered construction and generic editing preserved; specialized product/checkout authoring remains DEFERRED by M07-68/FD-INS-02. Existing raw attributes/config preserved but not promoted to verified commerce. No live checkout or external payment action performed. Revisit with explicit product collection ID/query/item-template binding and shared repeater integration. Schema/renderer migration requires snapshots of existing markers/custom children.

**Keyboard, batch and permission:** Keyboard empty-state and child operations; generic style multi only; source/structure single root; no permission creation through fallback.

**Specific acceptance — specified, not passed:**
- **T-B69-product-grid-01:** Empty inserted grid explicitly has no item template/binding proof.
- **T-B69-product-grid-02:** Change gap preserves auto-fill/minmax tracks.
- **T-B69-product-grid-03:** Saved custom children/markers round-trip unchanged.
- **T-B69-product-grid-04:** Unknown products marker does not create/select arbitrary collection or claim data loading.

**Shared contracts:** IC-01, IC-02, IC-03, IC-07, IC-13; II-01, II-02, II-08; M07-68.

## B69-product-detail — product-detail

**Evidence:** `src/blocks/Ecommerce/ProductDetail.tsx:15`. Parent insertion survey: 1 root(s), 13 nodes, selected `product-detail` / `<article>`; native tags: `article`, `button`, `div`, `h1`, `img`, `p`, `span`. Controls/visitor/persistence behavior is not newly runtime verified.

**Current construction and identifiers.** HTML article typed product-detail → image wrapper img, detail div(category span,name h1,description p,price div/span, metadata div with SKU/stock nested spans, plain Add button). Parent survey13 nodes confirms article root and native children. data-product-detail root; data-bind image/category/name/description/price/sku/inventory descendants. Add button lacks data-add-to-cart; root lacks data-product-card expected by current cart injector.

**Current Inspector.** Registered construction and generic editing preserved; specialized product/checkout authoring remains DEFERRED by M07-68/FD-INS-02. Existing raw attributes/config preserved but not promoted to verified commerce. No live checkout or external payment action performed. Generic article styling and native child Content/Link/Attributes routes remain; no validated product-detail transaction workflow.

**Consumers and anchors:**
- src/blocks/Ecommerce/ProductDetail.tsx:21–37
- src/engine/export/StripeInjector.ts:207–218: only data-add-to-cart + data-product-card selector
- src/engine/cms/DataBindResolver.ts:28–110: helper model, active hookup not established
- src/shared/constants/elementCapabilities.ts:183–187

**Source findings and consequences:**
- **B69-product-detail-G01:** Add to Cart visible label is static button; inspected exported cart selector would not bind it. Do not merely add marker: injector also requires product-card ancestor and trusted product identity. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-product-detail-G02:** SKU/stock static strings can imply real availability; status must distinguish authored sample content from connected data. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-product-detail-G03:** Builder describes image gallery but generates one image; do not claim missing gallery feature solely from comment or create replacement gallery silently. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)

**Disposition:** Keep article structure/static details and existing data markers; Defer transactional product-detail authoring; label setup state truthfully.

**Canonical owners and scope:** Document owns displayed copy/image; actual product/stock record owner external CMS/provider; binding config local only if canonical record exists; checkout separate.

**Control specification — proposed destination/behavior unless explicitly labelled existing:**

| ID / home / label | Values, defaults, eligibility and validation | Update, reset and recovery | Owner / evidence status |
|---|---|---|---|
| B69-product-detail-C01 · Content → Product detail → Content parts · Image / Product name / Description / Price text / SKU / Stock text | Exact native descendants; preserve H1/article; strings not live commerce values unless real binding shown. | Existing child editor; structured data binding only explicit IC-07, no auto provider update. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-product-detail-C02 · Behaviour → Product button → Action status · Unconfigured product action | Read-only explanation current static action lacks verified commerce connection; allow normal button semantics without claiming add-to-cart. | Do not silently convert to product-card model or configure checkout; save markers as-is. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-product-detail-C03 · Style → Product detail → Layout · Columns / Image fit / responsive arrangement | Existing two-column grid and1200px max-width; source CSS responsive overrides retained. | Lossless layout changes; underlying product data untouched. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |

**Complete edit flow:**

| Stage | Required behavior |
|---|---|
| entry | Existing product-detail/article→Content parts. |
| edit | Native child fields, name level and source; describe whether static or actually bound. |
| add / reorder | Move image/detail region as generic valid siblings; add static extra image through normal media insertion, not implicit product gallery relation. |
| delete | Delete article/part is document-only; no product/stock deletion. |
| return | Resource picker/CMS task returns exact image/text; body editor returns article. |
| failure / recovery | Missing source keeps prior bound/static value; Undo restores exact article tree; no recovery claim for payments. |

**Preservation, compatibility and dependencies:** Registered construction and generic editing preserved; specialized product/checkout authoring remains DEFERRED by M07-68/FD-INS-02. Existing raw attributes/config preserved but not promoted to verified commerce. No live checkout or external payment action performed. Future action unification must map stable product identity and card/detail selectors together, not one marker hotfix. Preserve article/H1, SKU/stock markers and arbitrary existing descendants.

**Keyboard, batch and permission:** Keyboard/native child editing; meaningful product image alt and heading; interaction authoring single target; provider rights remain separate; no live transaction preview.

**Specific acceptance — specified, not passed:**
- **T-B69-product-detail-01:** Article/H1 and all data-bind attrs survive edit/Undo/reopen.
- **T-B69-product-detail-02:** Button labelled Add to Cart not represented as verified action.
- **T-B69-product-detail-03:** Static stock edit cannot change inventory service.
- **T-B69-product-detail-04:** Rearrange responsive layout preserves product references and source image.

**Shared contracts:** IC-01, IC-02, IC-04, IC-05, IC-07, IC-13; II-02, II-08; M07-68.

## B69-cart-button — cart-button

**Evidence:** `src/blocks/Ecommerce/CartButton.tsx:13`. Parent insertion survey: 1 root(s), 8 nodes, selected `button` / `<button>`; native tags: `button`, `circle`, `path`, `span`, `svg`. Controls/visitor/persistence behavior is not newly runtime verified.

**Current construction and identifiers.** HTML button[data-checkout] contains SVG(circle/circle/path), text Cart (, span[data-cart-count]0, text ) - Checkout. Actual parser creates separate text spans for mixed text; parent survey8 nodes confirms two label fragments plus count/SVG. data-checkout identifies checkout button; data-cart-count is runtime output slot; SVG namespace/tags/attributes must remain. No authored cart item/session/provider config in block.

**Current Inspector.** Registered construction and generic editing preserved; specialized product/checkout authoring remains DEFERRED by M07-68/FD-INS-02. Existing raw attributes/config preserved but not promoted to verified commerce. No live checkout or external payment action performed. Current root Button Edit text targets a compound root; safe child text routing required to avoid removing SVG/count. Static catalogue does not include cart-button ID.

**Consumers and anchors:**
- src/engine/elements/manager/HTMLParser.ts:256–281: preserves mixed text as child elements
- src/engine/export/StripeInjector.ts:116–140,232–263: count display, checkout path and gating
- src/engine/export/ExportEngine.ts:654: optional cart script
- src/blocks/Ecommerce/CartButton.tsx:19–24

**Source findings and consequences:**
- **B69-cart-button-G01:** Button content includes live count slot and SVG: replacing root text or generic type conversion could discard functional marker/graphic; Edit label should target literal fragments only. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-cart-button-G02:** Exported payment-links checkout redirects first item only; API mode requires endpoint and provider config. Runtime card/count API source present does not prove enabled/configured checkout. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)
- **B69-cart-button-G03:** Builder omits type=button; inside form checkout click must not submit unrelated form, even when commerce script absent. (Located in source / source-inferred risk; runtime behavior not tested unless explicitly stated.)

**Disposition:** Keep saved button/count/SVG markup; Fix safe label targeting/native non-submit semantics; Defer new checkout configuration authoring.

**Canonical owners and scope:** Document owns literal label/icon/marker; runtime cart owns count and visitor items; provider/site configuration owns checkout. Editor sample count is view state, not inventory or authored cart.

**Control specification — proposed destination/behavior unless explicitly labelled existing:**

| ID / home / label | Values, defaults, eligibility and validation | Update, reset and recovery | Owner / evidence status |
|---|---|---|---|
| B69-cart-button-C01 · Content → Cart button → Label parts · Before count / After count / Icon | Actual text fragments; count read-only derived; SVG existing source/appearance preserved; no whole-root replace-to-text. | Edit exact fragment; if custom markup, show child navigation rather than flattening. Clear label cannot remove count marker unless explicit Remove count display. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-cart-button-C02 · Content → Cart button → Count display · Show count display | Existing slot presence; proposed hide preserves slot/data (or explicit remove with Undo); no editable cart quantity. | Document presentation only; temporary preview count never saved. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |
| B69-cart-button-C03 · Behaviour → Cart button → Action status · Checkout configuration status | Existing configuration absent/unverified/recognized; no success state without tested actual provider; no live checkout execution in editor preview. | Preserve marker; native type=button is explicit correction; configuration entry only actual existing owner route, otherwise deferred explanation. | selected element/owned child document data; PROPOSED placement/flow; existing primitive retained; IC-01, IC-04, IC-06, IC-13; II-02 |

**Complete edit flow:**

| Stage | Required behavior |
|---|---|
| entry | Select existing cart button→Content parts/status. |
| edit | Label fragment or icon exact child; count marked runtime-derived. |
| add / reorder | Reorder literal/icon/count children only preserving markers and namespace; duplicate button references same site cart, not new cart. |
| delete | Delete document button/count display does not clear visitor cart or cancel purchase; default root Delete removes subtree only. |
| return | Icon/resource return restores origin button/fragment; no external payment navigation during editor preview. |
| failure / recovery | Unconfigured/empty/failed checkout belongs actual runtime/service; preserve button/data and explain limitation; Undo local markup only. |

**Preservation, compatibility and dependencies:** Registered construction and generic editing preserved; specialized product/checkout authoring remains DEFERRED by M07-68/FD-INS-02. Existing raw attributes/config preserved but not promoted to verified commerce. No live checkout or external payment action performed. Preserve SVG paths/viewBox, mixed text, count slot and data-checkout. Future checkout integration must define identity/currency/quantity/empty cart/error/cancel/return and service recovery; no backend entitlement inferred.

**Keyboard, batch and permission:** Keyboard button and accessible composed label; count update announced appropriately without spam; type=button prevents form submit; no cart state batch editing; document/provider permissions separate.

**Specific acceptance — specified, not passed:**
- **T-B69-cart-button-01:** Edit prefix/suffix preserves SVG and data-cart-count node.
- **T-B69-cart-button-02:** Duplicate button shares runtime count, does not create new cart.
- **T-B69-cart-button-03:** Inside form button cannot submit form even with scripts disabled.
- **T-B69-cart-button-04:** Unconfigured editor has truthful status, no fake Checkout ready.
- **T-B69-cart-button-05:** Visitor empty/failure/cancel paths verified only when commerce integration explicitly enabled.

**Shared contracts:** IC-01, IC-02, IC-04, IC-05, IC-13; II-02, II-08; M07-68.

## Remaining verification and implementation boundaries

- Parent runtime proof covers construction, native trees, returned selection and default Inspector only. No per-control behavior, actual user-visible Add discoverability, form submission, live payment, save/reopen or visitor interaction pass is implied.
- Marker searches inspected editor `src`, root `lib`/`server` and dashboard entry areas. Failure to locate Tabs/Modal/Switch selectors is scoped evidence, not proof that every possible custom script or imported page lacks behavior. Saved custom behavior must remain until explicitly reconciled.
- Modal/tab relationship serialization, pair-aware commands, native table analysis, wrapped-field movement, runtime focus/visibility and safe reference remapping need engineering work. They are functional dependencies, not a few Inspector labels. No migration is authorized by this report.
- Existing generic Canvas/Layers and child inspectors remain available while compound controls are implemented; no module is disabled or removed solely because its authoring flow is incomplete. Ambiguous legacy structure stays inspectable and is not normalized on selection.
- Ecommerce provider configuration, catalog data, stock, currency, payment identity/security, cart/error/cancel and output paths need a separate commerce handoff before enabling new authoring. The four commerce blocks still have explicit preservation/edit/recovery contracts here.

For every block: preserve IDs/native tags/attrs/references through edit→Undo→Redo→save/reopen, then compare canvas/preview/download/publish where supported; do not infer parity from insertion. Keyboard and permission assertions use IC-13 and actual service rules.

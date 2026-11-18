# Inspector element/block coverage reconciliation — 2026-10-16

User asked whether their 60+ HTML elements/tags are all covered. These are different counting units; do not equate them. This table preserves the original source-level reconciliation, not new runtime evidence. **Subsequent closure:** [FD-INS-03 / BIC-01](block-coverage.md) now completes the written 69-block design coverage; its independent review and bounded runtime evidence are separate below.

| Unit | Current count / meaning |
|---|---|
|Registered block configurations|69 unique definitions in `src/blocks/blockRegistry.ts`; not proof every block is currently offered in Add or fully functional|
|Internal ElementType union|55; all 55 have current capability entries and a named family in the Inspector preservation map|
|Registered root types|50; multiple block configs share one root type; builders may create other child types|
|Static Add catalogue|54 entries; site/feature eligibility can reduce the visible set|
|Inspector audit rows|122 feature/control/history rows; not 122 HTML tags|
|HTML design specimen|13 representative scenarios; not 69 fully designed/tested block screens|

## Coverage conclusion

The completed FD-INS-02 handoff covers the indexed M07 Inspector feature families and shared contracts. This reconciliation confirms every registered block root maps to one of those type families. It does **not** certify every block-specific behavior, generated descendant, native HTML tag, service/output path or saved-project round trip. A block can have an ordinary root type and still need a unique flow. For example Modal config declares `button` and its builder creates a separate dialog/trigger structure; checking Button alone cannot prove Modal targeting, open/close and child-editing continuity. Tabs, Table, Gallery, complex forms and commerce similarly need their own composite-flow trace. These are unverified questions, not newly asserted missing features.

Existing generic Canvas/Layers and applicable Inspector routes remain preserved. Four-tab ownership is unchanged. **BIC-01 is now DESIGN CLOSED under FD-INS-03:** 69 individual block records, 120 native support routes, native/compound controls, child return, preservation and 229 per-block acceptance cases are specified. Independent review found no remaining design blocker for that written scope. [Coverage HTML](block-coverage-design.html) contains all 69 review records; the original interactive specimen still has 13 representative shared scenarios. Runtime survey verifies insertion/selection/default Inspector for 69, not editing/save/output. The original six defects and partial-source labels remain unchanged; application implementation/acceptance is NOT RUN.

The subsequent extension uses this acceptance unit: block ID → generated root/children/tags → special attributes/relationships → exact Content/Style/Behaviour/Effects controls or deliberate generic route → preserved values → verified/proposed/deferred gap → insert/select/edit/undo/reopen/output evidence. The table below supplies only the first root/family cross-reference; the full downstream records are in the linked BIC-01 annexes, not retroactively established by this original root map.

## Registered block → root → existing Inspector-family map

| Block ID | Root ElementType | M07 family | Config source |
|---|---|---|---|
|container|container|M07-48h|`src/blocks/Basic/Container.tsx`|
|text|text|M07-48a|`src/blocks/Basic/Text.tsx`|
|heading|heading|M07-48a|`src/blocks/Basic/Heading.tsx`|
|paragraph|paragraph|M07-48a|`src/blocks/Basic/Paragraph.tsx`|
|button|button|M07-48b|`src/blocks/Basic/Button.tsx`|
|link|link|M07-48a|`src/blocks/Basic/Link.tsx`|
|list|list|M07-48h|`src/blocks/Basic/List.tsx`|
|divider|divider|M07-48e|`src/blocks/Basic/Divider.tsx`|
|row|columns|M07-48g|`src/blocks/Basic/Row.tsx`|
|column|container|M07-48h|`src/blocks/Basic/Column.tsx`|
|spacer|spacer|M07-48e|`src/blocks/Basic/Spacer.tsx`|
|theme-toggle|container|M07-48h|`src/blocks/Basic/ThemeToggle.ts`|
|image|image|M07-48d|`src/blocks/Media/Image.tsx`|
|video|video|M07-48d|`src/blocks/Media/Video.tsx`|
|audio|audio|M07-48d|`src/blocks/Media/Audio.tsx`|
|svg|svg|M07-48d|`src/blocks/Media/SVG.tsx`|
|lottie|lottie|M07-48d|`src/blocks/Media/Lottie.tsx`|
|icon|icon|M07-48d|`src/blocks/Media/Icon.tsx`|
|gallery|gallery|M07-48h|`src/blocks/Media/ImageGallery.tsx`|
|video-embed|video-embed|M07-48d|`src/blocks/Media/VideoEmbed.tsx`|
|map-embed|map-embed|M07-48d|`src/blocks/Media/MapEmbed.tsx`|
|section|section|M07-48h|`src/blocks/Layout/Section.tsx`|
|columns|columns|M07-48g|`src/blocks/Layout/Columns.tsx`|
|columns3|columns|M07-48g|`src/blocks/Layout/Columns.tsx`|
|grid|grid|M07-48g|`src/blocks/Layout/Grid.tsx`|
|flex|flex|M07-48g|`src/blocks/Layout/Flex.tsx`|
|collection-list|collection-list|M07-48j|`src/blocks/Layout/CollectionList.tsx`|
|form|form|M07-48j|`src/blocks/Forms/Form.tsx`|
|input|input|M07-48c|`src/blocks/Forms/Input.tsx`|
|textarea|textarea|M07-48c|`src/blocks/Forms/Textarea.tsx`|
|select|select|M07-48c|`src/blocks/Forms/Select.tsx`|
|checkbox|checkbox|M07-48c|`src/blocks/Forms/Checkbox.tsx`|
|radio|radio|M07-48c|`src/blocks/Forms/Radio.tsx`|
|file|input|M07-48c|`src/blocks/Forms/FileInput.tsx`|
|date|input|M07-48c|`src/blocks/Forms/DateInput.tsx`|
|time|input|M07-48c|`src/blocks/Forms/TimeInput.tsx`|
|email|input|M07-48c|`src/blocks/Forms/EmailInput.tsx`|
|password|input|M07-48c|`src/blocks/Forms/PasswordInput.tsx`|
|number|input|M07-48c|`src/blocks/Forms/NumberInput.tsx`|
|range|input|M07-48c|`src/blocks/Forms/RangeInput.tsx`|
|color|input|M07-48c|`src/blocks/Forms/ColorInput.tsx`|
|label|label|M07-48a|`src/blocks/Forms/Label.tsx`|
|submit|button|M07-48b|`src/blocks/Forms/SubmitButton.tsx`|
|hero|hero|M07-48h|`src/blocks/Sections/HeroSection.tsx`|
|features|features|M07-48h|`src/blocks/Sections/Features.tsx`|
|menu-grid|section|M07-48h|`src/blocks/Sections/MenuGrid.tsx`|
|testimonials-section|section|M07-48h|`src/blocks/Sections/TestimonialsSection.tsx`|
|cta|cta|M07-48h|`src/blocks/Sections/CTA.tsx`|
|contact|section|M07-48h|`src/blocks/Sections/Contact.tsx`|
|footer|footer|M07-48h|`src/blocks/Sections/Footer.tsx`|
|navbar|navbar|M07-48h|`src/blocks/Sections/Navbar.tsx`|
|card|card|M07-48h|`src/blocks/Components/Card.tsx`|
|slider|slider|M07-48j|`src/blocks/Components/Slider.tsx`|
|testimonials|testimonials|M07-48h|`src/blocks/Components/Testimonials.tsx`|
|pricing|pricing|M07-48h|`src/blocks/Components/PricingTable.tsx`|
|progress|progress|M07-48f|`src/blocks/Components/ProgressBar.tsx`|
|countdown|countdown|M07-48f|`src/blocks/Components/CountdownTimer.tsx`|
|accordion|accordion|M07-48f|`src/blocks/Components/Accordion.tsx`|
|social-icons|social|M07-48h|`src/blocks/Components/SocialIcons.tsx`|
|contact-form|form|M07-48j|`src/blocks/Components/ContactForm.tsx`|
|stack|stack|M07-48g|`src/blocks/Components/Stack.tsx`|
|switch|switch|M07-48c|`src/blocks/Components/Switch.tsx`|
|tabs|tabs|M07-48h|`src/blocks/Components/Tabs.tsx`|
|modal|button|M07-48b|`src/blocks/Components/Modal.tsx`|
|table|table|M07-48h|`src/blocks/Components/Table.tsx`|
|product-card|product-card|M07-48h|`src/blocks/Ecommerce/ProductCard.tsx`|
|product-grid|product-grid|M07-48h|`src/blocks/Ecommerce/ProductGrid.tsx`|
|product-detail|product-detail|M07-48h|`src/blocks/Ecommerce/ProductDetail.tsx`|
|cart-button|button|M07-48b|`src/blocks/Ecommerce/CartButton.tsx`|

Original table: source inspection only. Subsequent BIC-01 survey/test evidence is recorded in its annex. No application code, saved project content, test source or deployment changed.

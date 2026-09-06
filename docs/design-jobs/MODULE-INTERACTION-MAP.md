# Module Interaction Map

The founder's format, one line per chain:

```
MODULE → ENTITY → FIELD → ACTION → TRIGGER → CONNECTED MODULE → RESULT
```

**151 chains, measured from the code, every one with a `file:line` in its
finding.** They are grouped by the module that OWNS the entity, and within each
group the broken ones are listed separately — because a chain that fires and
reaches nobody is the thing this map exists to make visible, and burying it
among the working ones is how it stayed invisible.

The board `Module Interaction Map · Collections → Publish` (section `862:6859`)
draws the founder's example chain hop by hop with a verdict per hop. This file is
the full set behind it.

**How to read a broken chain.** The `RESULT` column says what the USER loses, not
what the code fails to do. "no listener" is a fact about a program; "the canvas
keeps showing the draft value until an unrelated edit or a reload" is the same
fact stated so a designer can decide what to draw.

---


## Content / CMS  ·  25 chains


### Critical

- `MOD-A-01` **CMS -> CMSCollectionBinding -> bind a repeater to a collection -> CMS_COLLECTION_BOUND -> Canvas/Inspector/Export -> nothing: no UI can create the binding, so no element ever repeats**
- `MOD-A-02` **CMS -> CMSContentItem[] -> expand a repeater -> (never invoked) -> Canvas + ExportEngine -> a bound list renders as a single static template element on canvas and in the published page**
- `MOD-A-03` **CMS -> CMSElementBinding -> bind a text element to a field -> (no snapshot write) -> Save/Load/Publish -> reload the editor and every binding is gone; the next publish deploys the pre-binding placeholder copy with no warning**
- `MOD-A-04` **CMS -> CMSContentItem -> publish a record -> CMS_CONTENT_PUBLISHED -> Canvas (useCMSPreview) + CMSBindingManager.reapplyAll -> neither listens; the canvas keeps the draft value until an unrelated edit or a reload**
- `MOD-A-07` **CMS -> CMSContentItem -> edit and publish a record -> (no dirty flag, no lastEditedAt bump) -> Topbar/Publish -> the site reads 'no unpublished changes' and the visitor keeps seeing the old record**
- `MOD-A-09` **CMS -> CMSCollection.pageSlugPattern -> set a URL pattern -> (no event, no query) -> Pages panel -> the pages a collection will generate appear in no page list, no page tree and no preview until they show up on the live site**
- `MOD-A-10` **CMS -> CMSCollection.pageTemplatePath -> type a template path -> appendDynamicPagesToPublish -> Publish -> the find() misses, the loop continues, and the publish silently deploys zero of the promised pages**

### Major and minor

- `MOD-A-05` CMS -> CMSCollection -> delete a collection -> CMS_COLLECTION_DELETED -> CMSBindingManager + Inspector BindingBanner -> no listener: the inspector still shows 'bound to <deleted collection>' and the page publishes stale placeholder copy
- `MOD-A-06` CMS -> CMSField -> delete a field -> CMS_COLLECTION_UPDATED -> CMSBindingManager + Content/Fields screen -> no listener and no reverse index: bound elements fall back to empty and nobody is told
- `MOD-A-08` CMS -> CMSContentItem -> edit a record after sign-off -> (no lastEditedAt bump) -> Review / client sign-off -> the approval is reported fresh over content the client never saw
- `MOD-A-11` CMS -> dynamic pages -> click Publish -> runPrePublishChecks -> Publish panel -> the checklist passes green over a collection that will emit nothing
- `MOD-A-12` CMS -> generated pages -> publish -> appendDynamicPagesToPublish -> SEO / sitemap.xml -> the routes exist on the deployment but appear in no sitemap, and the deployment has no sitemap to appear in
- `MOD-A-13` CMS -> pageSeoTitle/pageSeoDescription -> publish -> generateDynamicPages -> SEO -> two <title> tags per generated page, no canonical/OG, and no way to edit the patterns after creation
- `MOD-A-14` CMS -> CMSElementBinding.itemId -> bind to an older record -> resolveBinding -> Canvas + Export -> the element shows its fallback (usually empty), and the export skips it, so the placeholder ships
- `MOD-A-15` CMS -> CMSContentItem(status=draft) -> publish the site -> CMSExportResolver.resolveStatic -> Published site -> unfinished draft copy is live, with no warning at publish time
- `MOD-A-16` CMS -> CMSCollection/CMSContentItem -> edit on device A -> cms.entries.upsert (server) -> device B's hydrate -> the id is already local so the row is skipped: device B shows stale content for the life of the store
- `MOD-A-17` CMS -> CMSContentItem -> open a second site in the same browser -> (no site scope on entries) -> Content panel -> an unscoped legacy collection and all of its records list under a site that never created them
- `MOD-A-18` CMS -> CMSContentItem.status -> archive a record -> content:updated + status mapped to DRAFT -> Publish -> the record silently leaves the live site under an event that says nothing changed
- `MOD-A-19` CMS -> CMSCollection(products) -> insert a product block before hydrate settles -> ELEMENT_INSERTED handler -> Ecommerce setup modal + cmsSync -> a second Products collection is created locally and mirrored to the server
- `MOD-A-20` CMS -> CMSCollection/CMSField -> delete -> (no usage query exists) -> Inspector/Canvas -> bindings dangle silently; the user finds out when the published page is blank
- `MOD-A-21` CMS -> CMSContentItem -> add a record -> two divergent editors -> Content panel / records modal -> behaviour depends on which door the user found, and the popover names the door with no visible entry point
- `MOD-A-22` CMS -> data-bind attributes -> import HTML with data-bind markers -> (no caller) -> CMSBindingManager -> the attributes are inert; the only working path is the inspector popover
- `MOD-A-23` CMS -> repeater binding -> toggle 'Repeat with collection' -> (registry entry with no renderer) -> Inspector -> the control appears in no panel; the registry describes a feature the UI does not have
- `MOD-A-24` CMS -> published entries -> queued sync failure -> (count read locally) -> Dynamic pages screen -> 'Generates 4 pages' over entries the server has never received
- `MOD-A-25` CMS -> collections/entries hydrated from the server -> CMS_STORE_REFRESHED -> Canvas preview + inspector popover -> only the Content panel reacts; bound elements keep rendering their fallback until an unrelated content event

## Pages & routing  ·  28 chains


### Critical

- `MOD-B-01` **Pages -> PageData -> deletePage -> (no event scans element hrefs) -> Inspector/LinkSection + ExportEngine -> every inbound internal link silently navigates to the home page on the published site**
- `MOD-B-02` **Pages -> PageData.root -> RecoveryManager.ensurePageRootExists -> emits PAGE_RECOVERED -> nobody -> page content replaced by an empty div and autosaved over the real content**
- `MOD-B-03` **Pages -> PageData.slug -> addPage -> (no uniqueness check) -> sites.saveProject -> Prisma @@unique([siteId,slug]) -> every autosave 500s until the user finds and renames the duplicate**
- `MOD-B-04` **Pages -> active page -> setActivePage emits PROJECT_CHANGED(page:activated) -> HistoryManager records a non-empty patch -> user presses ⌘Z after browsing pages and nothing visible happens**
- `MOD-B-13` **Pages -> PageData -> addPage -> sites.saveProject full snapshot -> saveProjectData upserts unbounded -> a FREE workspace ships 50 pages on a 10-page plan and the guard that exists is never reached**

### Major and minor

- `MOD-B-05` Pages -> PageData.slugHistory -> updatePage(slug) -> (no consumer) -> Publish / Redirects -> the old URL 404s and the recorded history is dead weight
- `MOD-B-06` Publish -> SITE_PUBLISHED -> (only onboarding listens) -> Pages/page-settings -> publishedUrl stays null until reload -> the destructive slug warning stays silent on a site that IS live
- `MOD-B-07` Pages -> SlugChange -> written {slug,changedAt} -> validated as {slug,timestamp} in collaboration import, typed as {fromSlug,toSlug,changedAt} on the server -> any redirect generator built on the type reads undefined
- `MOD-B-08` Pages -> PageSEO.metaTitle -> saved into Page.settings JSON -> runPrePublishChecks reads Site.metaTitleTemplate instead -> the SEO check answers a question about the site while claiming to describe the pages
- `MOD-B-09` Pages -> FolderItem -> useFolders -> localStorage only -> a teammate or a second device sees a flat, unorganised page list with no explanation
- `MOD-B-10` Pages -> PageRouter routes -> maintained on every mutation -> read by one fallback-covered label -> export invents a second, independent slug->filename map
- `MOD-B-11` Pages -> ProjectData.pagesOrder -> written on load only -> dropped by exportProject -> order in fact carried by Page.position; the declared ordering field is dead
- `MOD-B-12` Pages -> PageData -> deletePage -> (no comment cleanup, no FK) -> Review/Comments -> a client's open feedback survives as a row headed by a raw cuid, attached to a page nobody can open
- `MOD-B-14` Pages -> PageData -> editor mutations -> exportProject snapshot -> sites.saveProject (optimistic concurrency on Site.lastEditedAt) -> second device gets SAVE_CONFLICT for the whole project even when it touched a different page
- `MOD-B-15` Pages -> Page.translations -> full server API + Localization screen -> no writer, no locale-aware export -> an enabled locale changes nothing a visitor can see
- `MOD-B-16` Pages -> PageSettings.visibility -> unset -> panel badge says Draft, ExportEngine.isPageLive says live -> the user sees 'Draft' on a page that is publicly served
- `MOD-B-17` Pages -> PageSettings.visibility -> AdvancedTab -> user reads 'left out of the deploy' and 'reachable via direct URL' in the same panel
- `MOD-B-18` Pages -> #page:<id> internal link -> Composer.exportHTML (preview / copy HTML) -> no resolution -> clicking an internal link in Preview appends a hash and goes nowhere
- `MOD-B-19` Pages -> isHome -> setHomePage -> emits page:home -> nothing rewrites links or nav -> the site root changes and every internal link keeps pointing where it did, with a toast telling the user to fix it by hand
- `MOD-B-20` Pages -> active page -> setActivePage / deletePage -> (no selection reset) -> Inspector / canvas overlays -> style edits land on an element the user cannot see, or on one whose page was just deleted
- `MOD-B-21` Pages -> PageData.slug -> slug change -> CmsCollection.pageTemplatePath (a filename) no longer matches -> publish emits zero dynamic pages, with no warning on either surface
- `MOD-B-22` Pages -> PageData -> delete or set Hidden -> next publish uploads a file set without it -> the live URL 404s with no redirect and no pre-publish warning
- `MOD-B-23` Pages -> PAGE_CREATED / PAGE_TEMPLATE_ATTACHED / PAGE_TEMPLATE_DETACHED -> no emitter, no listener -> the next consumer subscribes to the documented name and silently receives nothing
- `MOD-B-24` Pages -> PageMeta.appliedTemplates -> duplicatePage -> meta not copied -> Templates panel shows the copy as using no template
- `MOD-B-25` Pages -> PageData.slug -> copyPageLink -> reads metadata.domain only -> a published site with no custom domain is told to publish
- `MOD-B-26` Pages -> PageSEO.canonicalUrl / structuredData / twitter* -> no input in any tab -> the exporter's support for them can never be exercised
- `MOD-B-27` Pages -> PageStatus -> four members with no writer -> a guard in setHomepage that is unreachable and a badge vocabulary that promises states the product does not have
- `MOD-B-28` Pages -> PROJECT_CHANGED payload types -> mockComposer emits six names the engine never emits -> a test-green consumer that filters by exact type would be dead in the product

## Publish, Export & Preview  ·  20 chains


### Critical

- `MOD-C-01` **Publish -> StripeConfig -> generateStripeScripts -> (no call in exportPageToHtml) -> Published page -> cart runtime absent, Add-to-Cart button inert**
- `MOD-C-17` **Publish -> MediaAsset.src (blob:) -> isSafeAttrValue allows blob: for src -> published HTML -> visitor's browser -> broken image, no request, no warning, no pre-publish check**

### Major and minor

- `MOD-C-02` Export -> ExportConfig -> Download HTML vs Download .zip -> ExportEngine -> two different documents from one modal
- `MOD-C-03` Publish -> ProjectData.assets -> exportProject() -> server save / version restore -> Media library -> library empty on reload while page images still reference the URLs
- `MOD-C-04` Publish -> PublishBuildJob COMPLETED -> SITE_PUBLISHED -> History panel (Published view) -> PublishHistory.load() -> new version row appears and the live-version banner is correct
- `MOD-C-05` Publish -> PublishBuildJob FAILED -> (no event) -> History / Review / Pages -> panels show 'never published' over a site whose publish just failed
- `MOD-C-06` Export -> ZIP produced -> (no event) -> History / onboarding -> no record that the user ever exported
- `MOD-C-07` Publish -> ReviewRequest APPROVED -> SITE_PUBLISHED -> Review panel -> round marked shipped instead of sitting on 'Approved' forever
- `MOD-C-08` Publish -> form element -> ExportEngine (no action) -> dashboard worker planFormWiring -> live form works; same element -> Download .zip -> no rescue -> form posts nowhere
- `MOD-C-09` Export -> asset URLs -> bundleAssets errors -> (discarded at ExportEngine.ts:1109) -> Export modal -> 'Export complete' over an archive with broken images
- `MOD-C-10` Publish -> pre-publish checks -> prisma.page (saved) vs exportPublishPages (live) -> Publish panel -> checklist grades a different site from the one that deploys
- `MOD-C-11` Publish -> CMS bindings + collections -> CMSExportResolver (static) + appendDynamicPagesToPublish -> Published site -> entries and detail pages present
- `MOD-C-12` Publish -> designTokens + animation styles -> siteTokensCSS / collectUsedKeyframes -> Published site -> brand colours, fonts and animations render
- `MOD-C-13` Publish -> SiteSEO.metaTitleTemplate -> BuildrikSyncProvider patch -> Site column -> runPrePublishChecks + SEOInjector -> Published page title and the check agree
- `MOD-C-14` Publish -> Interaction[] on element.data -> data-buildrick-interactions + buildInteractionRuntimeScript -> Published site -> configured triggers play
- `MOD-C-15` Export -> ExportConfig.cssStyle external -> Download all -> two identical stylesheet links, CSS delivered by a timer
- `MOD-C-16` Publish -> screen states -> already filed in W-D / W-H / W-N / W-P -> this file adds the data-flow layer only
- `MOD-C-18` Publish -> optimised MediaAsset.src (data:) -> updateAsset without re-upload -> page HTML -> publishPageSchema 2MB refine -> publish rejected with a raw zod message
- `MOD-C-19` Publish -> stock photo URL -> element src (never repointed) -> published site -> images served by a third-party CDN, breakable outside the customer's control
- `MOD-C-20` Publish -> asset upload fails -> (ASSET_* never emitted; MEDIA_EVENTS is a separate bus) -> Publish panel -> no pre-publish signal that media is local-only

## Media  ·  9 chains


### Critical

- `MOD-E-01` **Media -> MediaAsset -> exportProject -> (nothing) -> Project snapshot -> library absent from every project export, version and restore**
- `MOD-E-04` **Media -> MediaAsset -> deleteAsset -> del(blob) -> Publish/Pages -> every published <img> 404s, on a site nobody edited**
- `MOD-E-05` **Media -> MediaAsset.altText -> insertMediaAt -> (nothing) -> Canvas/Export/Publish -> every published <img> has no alt; SEO and a11y both blind**

### Major and minor

- `MOD-E-06` Media -> localOnly asset -> Publish -> runPrePublishChecks -> Publish tab -> 'ready' shown over a site that will ship broken images
- `MOD-E-09` Media -> replaceAcross partial failure -> REPLACE_PARTIAL -> (no listener) -> Canvas/Toast -> user is told the replace succeeded while N elements still show the old image
- `MOD-E-10` Media -> storage quota -> QUOTA_EXCEEDED -> (no listener) -> StorageQuotaBar -> the banner that exists to explain the failure never opens
- `MOD-E-11` Media -> MediaFolder -> renameFolder -> FOLDER_UPDATED -> (no listener) -> folder rail -> the old name stays on screen until the panel remounts
- `MOD-E-18` Brand/Settings -> favicon + ogImage -> set value -> (no media library edge) -> Media -> user retypes a URL for a file already in their library
- `MOD-E-19` Content -> CMS image field -> renderField -> (no media library edge) -> Media -> a collection whose whole point is images is filled by pasting URLs

## Brand  ·  7 chains


### Critical

- `MOD-F-01` **Brand -> DesignToken -> Apply -> (theme.capture/push) -> Dashboard agency theme -> Client sites' tokens change**
- `MOD-F-02` **Brand -> StyleEngine rules -> theme.push -> Client site -> that site's breakpoint + hover styles are deleted**
- `MOD-F-03` **Brand -> copy -> user follows it -> capture still fails -> agency theme never captured**
- `MOD-F-05` **Brand -> DesignToken -> project load -> MigrationManager -> a token record is injected into projectStyles and StyleEngine drops it**

### Major and minor

- `MOD-F-04` Brand -> dsSchemaVersion -> theme.push -> Editor (open session) -> nothing reacts -> next autosave reverts the push
- `MOD-F-10` Brand -> DesignToken -> apply starter -> Canvas + preview + export -> whole site repaints, per-token undo gone
- `MOD-F-15` Brand -> DesignToken -> Apply -> BRAND_APPLIED -> Save/autosave -> tokens reach the server on their own

## Components  ·  6 chains


### Critical

- `MOD-F-16` **Components -> ComponentInstance -> instantiate/detach/sync -> COMPONENT_INSTANTIATED / INSTANCE_DETACHED / INSTANCE_SYNCED -> Components panel + Brand summary + Inspector -> counts and the instance band update**
- `MOD-F-18` **Components -> ComponentVariant -> addVariant -> (no caller) -> Inspector VariantSection + panel Swap-variant -> nothing ever selectable**

### Major and minor

- `MOD-F-17` Components -> ComponentDefinition -> Update from selection -> COMPONENT_LIST_UPDATED -> Components panel -> the detail screen shows the new master and version
- `MOD-F-22` Components -> ComponentDefinition -> update on device A -> siteComponents.upsert -> device B hydrate -> skipped, B keeps v1 forever
- `MOD-F-23` Components -> ComponentDefinition -> Delete -> siteComponents.usage -> Delete confirm -> the user sees which sites and pages break
- `MOD-F-25` Components -> ComponentInstance -> syncedVersion < version -> INSTANCE_SYNCED / an out-of-date badge -> Inspector instance band -> user can re-sync one copy without losing its edits

## History, versions, recovery & storage  ·  12 chains


### Critical

- `MOD-G-02` **Versions -> NamedVersion.snapshot -> restoreVersion -> importProject -> CMS / Media / Components -> dangling ids silently survive the restore, with no listener reconciling them**
- `MOD-G-08` **Recovery -> PageData.root -> ensurePageRootExists recreates an empty root -> PAGE_RECOVERED -> (nothing listens) -> autosave writes the empty page to the server and the user's page contents are gone with no warning**
- `MOD-G-09` **Recovery -> CrashRecord -> handleRuntimeFault -> RUNTIME_FAULT_CAUGHT -> (nothing listens) -> the tab keeps autosaving through a broken state and the crash sentinel is the only trace, so the next load claims 'Recovered your work' over work nobody kept**
- `MOD-G-10` **Storage -> ProjectData -> autoSave -> STORAGE_ERROR -> (nothing listens) -> Topbar keeps reading 'Saved' while nothing has been written locally**
- `MOD-G-15` **History -> HistoryEntry -> restoreEntry -> (no VERSION_CREATED, no safety snapshot) -> Versions -> everything after the scrub point is unrecoverable, while the sibling restore promises on screen that nothing is lost**
- `MOD-G-16` **History -> HistoryDisplayEntry.id (= stack index) -> trimHistory / PROJECT_LOADED reset -> restoreEntry -> Canvas -> the editor jumps to a point the user did not pick and the steps between are truncated**

### Major and minor

- `MOD-G-11` Versions -> VersionHistoryExport -> exportVersions / importVersions -> VERSION_EXPORTED / VERSION_IMPORTED -> (nothing listens) -> a 50-version import lands or fails with the panel saying nothing either way
- `MOD-G-12` History -> HistoryEntry -> trimHistory -> HISTORY_CAPACITY_WARNING (never emitted) -> Versions / MilestoneSuggestionBanner -> the user is never told to save a milestone before the oldest hundred edits become unreachable
- `MOD-G-13` History -> HistoryEntry.patch -> undo / redo -> (no event on the diverged-patch bail) -> useHistoryFeedback -> Cmd+Z does nothing and says nothing, three keystrokes in a row
- `MOD-G-14` History -> HistoryEntry -> restoreEntry -> false -> (return discarded at HistoryTab.tsx:197) -> Time-Travel drawer closes as if it succeeded and the canvas is unchanged
- `MOD-G-29` Versions -> NamedVersion -> autoCheckpoint -> unhandled rejection -> Recovery -> RUNTIME_FAULT_CAUGHT + crash sentinel -> the next load shows a recovery banner for a storage error
- `MOD-G-34` Storage -> browser quota -> getStorageQuota (0 callers) -> STORAGE_QUOTA_WARNING / _CRITICAL (never emitted) -> Versions / Media / CMS -> the first symptom the user sees is a version that would not save

## engine/forms  ·  9 chains


### Critical

- `MOD-D-01` **forms -> FormConfig -> configure a form -> (no trigger: no mounted surface) -> inspector -> user cannot set an action, webhook, success message or redirect on any form**
- `MOD-D-02` **forms -> FormConfig.webhookUrl -> set a Formspree/custom endpoint -> (no writer reachable) -> engine/export FormspreeInjector -> every published form ships with no action attribute and posts nowhere**
- `MOD-D-03` **forms -> FormSubmission -> submit a form in the editor -> reload -> (nothing) -> the submission is gone, and getSubmissions returns an empty array for a form that had rows a second ago**

### Major and minor

- `MOD-D-04` forms -> FormSubmission -> a visitor submits a published form -> (no action attribute, no FormBlock row) -> Settings · Forms inbox -> the inbox can only ever render 'No forms yet'
- `MOD-D-05` forms -> FormState -> submitForm() succeeds -> FORM_SUBMITTED -> editor/shell toasts + Settings·Forms inbox -> no confirmation anywhere; the user cannot tell a submit from a no-op
- `MOD-D-06` forms -> FormConfig.action='email' -> user picks 'Send Email' -> settings.integrations.email -> services/EmailService -> nothing is ever sent and no error is shown, because the guard returns silently
- `MOD-D-07` forms -> FormState.isSubmitting -> submitForm() sets it -> (no reader) -> canvas -> a form gives no pending, success or error feedback while submitting
- `MOD-D-08` forms -> FormConfig -> configure a form -> mount FormSettingsSection -> Gate 24 -> the mount that fixes MOD-D-01 fails the pre-push gate unless the file is rebuilt first
- `MOD-D-09` forms -> FormSettings.provider -> choose a form provider -> (drawn on 640:3135, no field anywhere) -> engine/export FormspreeInjector -> provider is inferred by substring-matching a URL the user cannot enter

## engine/interactions  ·  8 chains


### Critical

- `MOD-D-10` **interactions -> Interaction[] -> add/edit/remove an interaction in the inspector -> ElementOperations.setInteractions -> (InteractionManager bypassed) -> all 6 INTERACTION_* CRUD events are unreachable from any user action**
- `MOD-D-11` **interactions -> InteractionRuntime -> author a hover/click interaction -> startRuntime() (no caller) -> editor/canvas -> nothing animates on the canvas itself; the interaction is only observable in the Preview overlay's exported document**

### Major and minor

- `MOD-D-12` interactions -> InteractionAnimationConfig.easing -> populate the easing dropdown -> GSAPEngine.EASINGS -> gsap package -> the whole GSAP library ships in the editor bundle to supply a ten-entry string→string map
- `MOD-D-13` interactions -> InteractionAnimationConfig.preset -> pick an animation preset -> three catalogues (PRESET_TIMELINES, ANIMATION_KEYFRAMES, INTERACTION_PRESET_KEYFRAMES) -> canvas + preview + published page -> a preset can be present in one and absent in another, which has shipped twice (20 missing keyframes, 22 missing published presets)
- `MOD-D-14` interactions -> Interaction.trigger -> press Preview on a 'Scroll into view' interaction -> handleInteractionPreview (trigger discarded) -> canvas -> the animation fires immediately on click, which is the one thing the configured trigger does not do
- `MOD-D-15` interactions -> runtime lifecycle -> enter preview -> INTERACTIONS_RUNTIME_STARTED -> editor/canvas overlays -> selection rings, badges and guides stay drawn over a 'preview' that never starts
- `MOD-D-16` interactions -> Interaction[] -> add an interaction via InteractionManager -> markDirty() only -> engine/HistoryManager + canvas -> the change is not one undo step and the canvas does not repaint
- `MOD-D-17` interactions -> Interaction -> add an interaction -> the inspector's Interactions section (drawn only collapsed) -> Figma page 1:3 -> the only authoring surface for the feature is undrawn, so nobody can review it against a board

## engine/fonts  ·  6 chains


### Critical

- `MOD-D-18` **fonts -> Font -> any font operation -> composer.fonts.* (never called) -> the whole editor -> FontManager is constructed on every session and does nothing but register six system fonts into a Map nobody reads**
- `MOD-D-19` **fonts -> CustomFont -> upload a .woff2 to the media library -> the toast's 'Inspector → Font → My Fonts' -> editor/inspector FontPicker -> the named destination does not exist; the uploaded font can never be applied to anything**
- `MOD-D-20` **fonts -> CustomFont -> drag a font asset onto selected text -> ElementManager.insertMediaAt 'font' branch -> engine/styles -> the element gets font-family:<url>, the text does not change, and a success event (INSERT_SUCCEEDED) is emitted anyway**

### Major and minor

- `MOD-D-21` fonts -> CustomFont + favourites -> upload a font / favourite a family -> reload -> ProjectData -> both are gone, and the published site would have had no @font-face for the upload either way
- `MOD-D-22` fonts -> GoogleFont catalogue -> search for a family -> GoogleFontsService static array -> editor/inspector FontPicker -> a family Google added after the last build is unreachable, and FontManager's live fetch that would have it is dead
- `MOD-D-23` fonts -> Font.loaded -> load a Google or custom font -> FONT_LOADED -> editor/canvas + toast -> text that uses a still-loading family renders in the fallback with no repaint and no error when the load fails

## engine/drag  ·  5 chains


### Major and minor

- `MOD-D-24` drag -> DragOperation -> drag an element on the canvas -> composer.canvas.drag.start/move/end -> (no reader) -> the engine records a full drag state machine that influences nothing; the canvas answers every question from its own React session
- `MOD-D-25` drag -> DragOperation -> drag a block from the Insert panel onto the canvas -> start() is never called -> DragManager -> the drop lands correctly but the engine emits no DRAG_START/END and DROP_ZONE_DROP never fires for the most common drag in the product
- `MOD-D-26` drag -> DragCancelPayload.reason -> drop on an invalid target -> DRAG_CANCEL -> editor/shell toasts -> the reason is discarded; the drag just snaps back with no explanation
- `MOD-D-27` drag -> DragOperation -> any drag -> end/cancel -> (no store) -> correct by design: nothing should survive the gesture
- `MOD-D-28` drag -> DragOperation -> begin a panel drag during a pending canvas drag -> start() (not called for panels) -> DragManager -> the stale canvas operation is never auto-cancelled and end(success) attributes the panel drop to it

## engine/templates  ·  6 chains


### Major and minor

- `MOD-D-29` templates -> Template -> browse/apply a template -> useTemplateManager (no caller since 2026-07-25) -> engine/templates -> the engine store is superseded; every live template action goes through a different path
- `MOD-D-30` templates -> Template -> 'Save as Template' -> useStudioHandlers.handleSaveTemplate -> localStorage MY_TEMPLATES + templateSync -> composer.templates never learns the template exists, so its fetchTemplates() 'local' source is permanently empty
- `MOD-D-31` templates -> Template -> save a template -> reload -> localStorage + server userTemplates -> the live path survives and the engine Map does not, which is why the engine store is invisible even to its own fetchTemplates
- `MOD-D-32` templates -> Template -> apply a template -> TEMPLATE_LOADED on a private emitter -> panel:templates / editor:shell -> unreachable by construction; the live panel uses TEMPLATE_APPLIED on the shared bus instead
- `MOD-D-33` templates -> ProjectData -> apply a template with replace -> composer.importProject -> engine/HistoryManager -> the whole project is swapped with no undo entry, so Cmd+Z cannot get the previous site back
- `MOD-D-34` templates -> TemplateFilter -> filter the gallery by category -> the panel's own filter (broken per W-F-26) -> panel:templates -> the engine's parallel, working applyFilters is not consulted, because nothing can reach it

## engine/collaboration  ·  7 chains


### Major and minor

- `MOD-D-35` collaboration -> CollaborationEvent -> a peer moves their cursor -> COLLAB_CURSOR_UPDATE (subscribed as the literal "cursor:update") -> editor/canvas RemoteCursorsOverlay -> works today; the graph reports it as an orphan because the constant name never appears at the listener
- `MOD-D-36` collaboration -> OTOperation -> two peers edit the same element -> OT_DIVERGENCE_DETECTED -> (no listener) -> editor/shell -> the session diverges with no banner, no reload prompt and no telemetry — the exact failure mode the 6 known P1 bugs produce
- `MOD-D-37` collaboration -> cleanup timer -> open the editor with collab OFF -> CollaborationManager constructor -> every editor session -> a 10s timer runs forever over two empty Maps, and a cursor overlay subscribes to a manager that will never connect
- `MOD-D-38` collaboration -> CollaborationRoom -> start a session -> startSession(siteId) -> server op log at /api/collab/:siteId/ops -> the room is the site and is permanent; leaving only disconnects this client
- `MOD-D-39` collaboration -> ElementLock -> a peer starts editing an element -> COLLAB_LOCK_ACQUIRED -> editor/canvas selection + panel:layers -> no lock badge, no dimming, no 'X is editing' — two people edit the same element and last write wins silently
- `MOD-D-40` collaboration -> CollaborationState -> the SSE connection drops mid-session -> COLLAB_CONNECTION_LOST -> editor/shell StudioHeader -> the presence chip keeps reading 'connected' while the user's edits reach nobody
- `MOD-D-41` collaboration -> CollaborationUser -> a peer joins -> COLLAB_USER_JOIN -> editor/shell PresenceIndicators -> the code path works and no board draws its output, so the one shipped collab surface cannot be reviewed

## cross-module  ·  3 chains


### Major and minor

- `MOD-D-42` cross-module -> EVENTS constants -> emit from a manager -> the manager's own EventEmitter -> any composer.on() subscriber -> the subscription silently never fires, and the event graph reports the event as an orphan
- `MOD-D-43` cross-module -> module wiring -> the '6 fully isolated modules' measurement -> checking direct calls as well as events -> the dependency map -> 3 genuine gaps, 1 correct isolation, 1 deletion, 1 false positive
- `MOD-D-44` cross-module -> module entities -> author anything in fonts or engine-templates -> reload -> ProjectData -> the work is gone, because neither module has a field in the project snapshot or a sync service of its own

---

**151 chains across 14 modules.**


## The six modules that exchange nothing

Measured on the composer event bus across 891 source files: **collaboration,
drag, fonts, forms, interactions, templates** emit and receive nothing across
module lines.

One caution belongs beside that list, because it was nearly filed as a seventh:
`panel:content` also reads as isolated and is NOT. It reads
`composer.cms.collections` directly, and `ContentTab.tsx:89` says so in as many
words. **Isolation on the bus is a question, not a verdict** — a module can be
perfectly well connected through direct calls or its own emitter.

Two more traps that produced false readings before they were caught, and that
any future pass over this map must apply:

- `composer?.emit?.(EVENTS.X)` is invisible to a `.emit(` search. It produced a
  false "no emitter" for `BRAND_DIRTY_CHANGED`, which IS emitted.
- A listener registered by RAW STRING is invisible to a search by constant.
  `UI_TOGGLE_TEMPLATES` was filed as dead; it is listened for at
  `useComposerInit.ts:452`. **Search for the constant AND the literal.**

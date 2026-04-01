# Module 04 — CMS & Data Binding

## Problem

The engine has a complete CMS system: CollectionManager (367 LOC), CMSBindingManager (270 LOC), and 3 binding types — StyleDataBinding (1,569 LOC), TextDataBinding (1,378 LOC), TraitDataBinding (2,044 LOC). Plus CollectionStorage, RepeaterRenderer, CMSExportResolver, and ProductCollectionService.

The UI has almost nothing. Users cannot:
- Create or manage collections visually
- Add/edit/delete records in a collection
- Bind element properties to collection fields through the inspector
- Preview content with actual CMS data
- See which elements are data-bound

This is the biggest gap between engine capability and UI surface.

## Requirements

### Collection Management
- Create collection: name + field schema (field name, field type, required toggle)
- Field types: Text, Image, Number, Boolean, Date, URL, Richtext, Reference
- Edit collection schema after creation (add/remove/reorder fields)
- Delete collection (with confirmation — affects all bound elements)
- View list of all collections

### Record Management
- Add records to a collection (form with fields matching schema)
- Edit existing records
- Delete records (with confirmation)
- Import data (CSV at minimum)
- View records in a table or card layout

### Data Binding (Inspector Integration)
- Chain icon next to bindable inspector fields (text content, image src, style properties)
- Click chain → dropdown showing available collections → fields
- Only compatible fields shown (text property → text/richtext/URL fields; image → image fields)
- Bound state: field shows "CollectionName.fieldName" badge, becomes read-only
- Unbind: click chain icon on bound field → confirm → field becomes editable again

### CMS Preview
- When CMS-bound elements exist on canvas, show record navigator
- Record navigator: "Record 1 of N" with prev/next arrows
- Canvas renders actual data from selected record
- Subtle "CMS" badge on bound elements

### CMS Entry Points
- Build tab: "Data" category contains CMS elements (CMS List, CMS Item)
- Settings tab: "Integrations" sub-screen has CMS collection management
- Inspector: chain icon on bindable fields opens binding dropdown
- No dedicated CMS rail icon — CMS is accessed through Build (elements) and Settings (management)

### CMS List Element
- Draggable from Build tab (in a "Data" category)
- Dropping onto canvas triggers Collection Setup if no collections exist
- Or shows collection picker if collections exist
- Renders child elements repeated per record

## Flows

### Create First CMS Page
1. Open Build tab → scroll to "Data" category → drag "CMS List" onto canvas
2. No collections exist → Collection Setup opens automatically
3. Name collection "Blog Posts" → add fields (Title: Text, Body: Richtext, Cover: Image, Date: Date)
4. Click "Create" → collection created → CMS List bound to it
5. Add a few records via record management UI
6. Inside CMS List, add a Heading element → click chain icon on text → bind to "Blog Posts.Title"
7. Add Image element → bind src to "Blog Posts.Cover"
8. Record navigator appears: "Record 1 of 3" → click next → content updates
9. Publish → all records rendered on published site

### Bind Existing Element to CMS
1. Select any text element on canvas
2. Inspector → find text content field → click chain icon
3. Binding dropdown: shows collections → fields (filtered to compatible types)
4. Select "Blog Posts.Title"
5. Element text replaced with actual data from record 1
6. Chain icon turns active color, field shows "BlogPosts.Title" badge

### Unbind
1. Click active chain icon on bound field
2. Confirm "Unbind from BlogPosts.Title?"
3. Field returns to editable state with placeholder text

## Engine APIs

| Surface | API | Key Methods |
|---------|-----|------------|
| Collection CRUD | `composer.cmsManager` | createCollection(), getCollections(), updateSchema(), deleteCollection() |
| Record CRUD | `composer.cmsManager` | addRecord(), updateRecord(), deleteRecord(), getRecords() |
| Binding management | `composer.cmsBindings` | bind(), unbind(), getBindings() |
| Text binding | `composer.textBindings` | bind text content to collection field |
| Style binding | `composer.styleBindings` | bind CSS properties to collection field |
| Trait binding | `composer.traitBindings` | bind HTML attributes to collection field |
| CMS rendering | RepeaterRenderer | render CMS List with bound data |
| Export | CMSExportResolver | resolve bindings during export |

## Constraints

- Binding dropdown must only show compatible field types for the target property
- CMS preview must not affect the actual element content — it's a preview overlay
- All CMS data persisted via CollectionStorage (IndexedDB / server sync)
- CMS List must support nested elements (heading + image + text inside repeater)
- Record navigator only visible when CMS-bound elements exist on canvas

## Reference

- **Webflow CMS:** The gold standard — collection setup, binding flow, preview mode, CMS list element
- **Airtable:** Record management UI (table view for records)

## States (Loading, Error, Empty)

- **Loading:** Skeleton shimmer placeholders for collection list, record table rows, and binding dropdown options while data is being fetched
- **Error (failed save/create/bind):** Inline error message below the failed action with a "Retry" button. Example: "Failed to create collection. Retry"
- **Empty — no collections:** Centered illustration + "No collections yet" message + primary CTA button "Create your first collection"
- **Empty — no records:** Table header visible with empty body + "No records yet" message + "Add record" button
- **Empty — no bindable fields:** Binding dropdown shows "No compatible fields" with a link to "Edit collection schema"

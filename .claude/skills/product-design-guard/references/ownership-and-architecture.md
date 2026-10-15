## Ownership, information architecture and feature placement

### 1. Resolve ownership before choosing a panel

Ownership has several independent meanings. For each new or changed property/action,
resolve these dimensions with evidence:

| Dimension | Required decision |
|---|---|
| User task | What outcome is being attempted, and in which context? |
| Value owner | Which element, component, asset, collection, page, site or workspace owns the data? |
| Canonical UI home | Where does a user normally inspect and manage that value? |
| Source of truth | Which actual state/model/command owns updates? |
| Scope | Which objects and output will change? |
| Eligibility | Which selections, object types, modes and roles can use it? |
| Source/precedence | Local, inherited, bound, shared, computed or overridden? |
| Permission | Who can view/apply/edit/delete/publish the resource? |
| Reset semantics | Remove override, restore default, detach link, revert draft, or something else? |
| Commit boundary | Immediate preview, explicit apply, saved draft, history entry, published output? |

Do not use account ownership as a substitute for property ownership. Do not use the
current computed value as proof of where it is stored. Do not invent a universal
precedence order: inspect Buildrick's actual resolution and override behavior.

Give an action one authoritative update model, not necessarily one visible button.
A quick color control and the full style panel can coexist if both edit the same target
and show consistent source, scope, restrictions, feedback and undo behavior.

### 2. Candidate homes, not unverified product facts

The following is a semantic starting model to compare with the real product. It does
not assert that these modules or labels exist and does not require creating them.
Retain approved terminology and architecture where coherent; identify conflicts first.

| Capability or responsibility | Candidate canonical home | Contextual relationship |
|---|---|---|
| Selected element's visual appearance | Inspector / Style | Local controls may apply shared tokens or classes |
| Content, link target, element semantics, accessibility attributes | Inspector / Settings or Content | Visual styling remains a separate responsibility |
| Triggers, actions, animation configuration | Interactions surface | Selected element can expose a relevant shortcut |
| Shared visual values and brand tokens | Brand / Theme / Design tokens | Inspector applies tokens and links to their exact source |
| Page name, slug, SEO/social metadata | Page settings | Page-specific entry remains tied to that page |
| Site-wide configuration and integrations | Site settings | Do not disguise a site change as a local element change |
| Assets, organization, replacement and metadata | Media / Asset manager | A picker applies an asset to a selected field |
| Content schema, records and collection management | CMS/data surface | Selected elements bind to fields contextually |
| Reusable definitions and shared structure | Components/library | Instances expose supported properties and overrides |
| Reusable primitives or composed sections | Add/catalog surface | Distinguish insertion from definition management |
| Team roles and workspace-wide resources | Workspace/team settings | Do not mix access management with visual styling |
| Zoom, panel width, UI density and tool visibility | Editor/workspace preferences | These are not automatically authored page properties |

Where the product distinguishes Elements, Blocks and Components, preserve the meaning:
primitives, composed sections, and reusable definitions. Do not create overlapping
catalog categories with different names for the same resource. Keep site versus
workspace library scope explicit when both exist.

### 3. Distinguish manage, apply and override

A shared resource often has separate tasks:

- Manage: create, rename, organize, version or delete the shared source.
- Apply: choose that resource for a local element or field.
- Override: change a supported local aspect without silently changing the source.

Do not put the entire resource manager into every property's panel. Conversely, do not
send the user to a generic global manager to perform a simple local application.
Provide a contextual picker and an exact "Edit source" destination when appropriate.
Return to the original target, showing the applied result.

If the action affects multiple instances/pages, show the shared scope before commit.
Distinguish "reset override" from "reset shared value" and "detach" from "delete".
Do not imply a local edit when changing the master definition. Do not expose shared
write controls to a role that may apply a resource but cannot edit its definition.

### 4. Decide placement through task relationships

For each candidate placement assess semantic fit, user frequency evidence, co-editing
needs, selection dependency, breadth of effect, number of items, search/filter needs,
spatial cost, discoverability, accessibility, and existing conventions.

Questions that must have answers:

1. What does the user select or open before needing this capability?
2. Which existing settings are normally used immediately before or after it?
3. Must the canvas or another panel remain visible while editing it?
4. Is this one value, a group of tightly related values, or resource management?
5. Does its scope match its surrounding controls?
6. Would the placement imply a false relationship or hide a meaningful one?
7. Can the user find and return from it without losing work or selection?

Do not group by engineering file, implementation history, available empty space, or
"new features" as a permanent category. Avoid overlapping labels such as Basic,
General, Advanced and More without clear boundaries. Keep a capability's conceptual
home stable even when it has useful secondary entry points.

### 5. Select the integration approach

| Approach | Choose when | Reject or revise when |
|---|---|---|
| Existing row/section | Same target, scope and task; content remains legible | It creates unrelated controls or buries a core action |
| Reorganized section | Same task, but order/grouping no longer supports it | Reordering merely hides unresolved ownership |
| Progressive disclosure | Optional detail follows a clear primary decision | Required or active settings become undiscoverable |
| Scoped subview or tab | Distinct, coherent aspect of the same object | Users must constantly switch to compare/edit coupled settings |
| Picker/popover | Short, contextual selection or bounded value editing | It requires a lengthy workflow, deep navigation or fragile scrolling |
| Contextual drawer/detail view | Complex detail benefits from space and a preserved parent context | It blocks essential canvas feedback or creates unbounded overlay stacks |
| Existing panel redesign | Accumulated capability invalidates current hierarchy or geometry | The change needlessly replaces unrelated modules |
| Dedicated workspace | A separate sustained task needs its own tools and space | It is a workaround for a single poorly grouped control |

A tab is not free space: define its title, scope, entry, retained context, selected
state, empty state and return behavior. Do not create a permanent top-level tab for
every new feature. A modal is not overflow storage: use it for a bounded task that
actually benefits from interruption and a clear completion boundary.

For structural changes compare at least two plausible approaches and the current
baseline. State trade-offs and evidence; do not fabricate precise weighted scores.
Select one recommendation instead of leaving an unexplained list of alternatives.

### 6. Explicit redesign triggers

Re-evaluate the affected panel when any of these is observed:

- Required controls cannot fit legibly under the current width/height strategy.
- A common task repeatedly crosses unrelated tabs or panels.
- Duplicate controls disagree about values, ownership or scope.
- Shared, local and responsive settings are visually indistinguishable.
- New functionality creates multiple independent scroll regions or hidden actions.
- A new resource type needs sustained management, not one more field.
- Reused components no longer cover the necessary interactions coherently.
- The current structure prevents preserving existing capabilities in a usable form.

Do not use an arbitrary number of controls as a universal threshold. Diagnose the
actual task and layout failure. Expand the redesign only to the smallest connected
area needed to solve it, and verify the resulting boundary with adjacent workflows.

### 7. Navigation migration and discoverability

Map old to new destinations. Keep shortcuts, deep links, command search, onboarding
and documentation aligned where relevant. Retire redundant entry points intentionally
rather than maintaining two conflicting systems. Document any transition support
needed for users of the old path; do not invent a requirement for permanent duplication.

A discoverability claim needs at least a concrete walk-through; a claimed user-tested
improvement needs actual users or recorded study evidence. A design review can support
"this path is explicit", not "users are 40% faster" without measurement.

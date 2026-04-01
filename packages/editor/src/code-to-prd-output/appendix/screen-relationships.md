# Screen Relationships & Navigation Map

> **Generated:** 2026-03-25

## Navigation Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                        STUDIO SHELL                             │
│  [Header: File | Undo/Redo | Save | Device | Zoom | AI | Export]│
│  [Page Tab Bar: Home | About | Contact]                        │
├────────┬──────────┬─────────────────────────┬──────────────────┤
│  RAIL  │ SIDEBAR  │       CANVAS            │   INSPECTOR      │
│  56px  │  280px   │                         │    280px         │
│        │          │                         │                  │
│  [A]───┤ Add Tab  │                         │ [Layout Tab]     │
│  [T]───┤ Templates│  ┌─────────────────┐    │ [Appearance Tab] │
│  [Z]───┤ Layers   │  │ Element editing  │    │ [Effects Tab]    │
│  [P]───┤ Pages    │  │ surface with     │    │                  │
│  [⇧A]──┤ Comps    │  │ overlays         │    │ ┌──────────┐    │
│  [J]───┤ Media    │  │                  │    │ │ Sections │    │
│        │          │  └─────────────────┘    │ │ for      │    │
│  [D]───┤ Design   │                         │ │ selected │    │
│  [S]───┤ Settings │  [Context Menu]         │ │ element  │    │
│  [U]───┤ Publish  │  [Command Palette]      │ └──────────┘    │
│  [H]───┤ History  │  [Quick Actions]        │                  │
├────────┴──────────┴─────────────────────────┴──────────────────┤
│                     OVERLAY LAYER                               │
│  [Export Modal] [Welcome Modal] [Spotlight] [Toasts]           │
│  [Block Picker] [Icon Picker] [Image Editor] [Keyboard Help]  │
│  [CMS Setup Modal] [Conflict Modal] [Upgrade Modal]           │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Between Screens

### Selection Flow (Bidirectional)
```
Canvas ←→ Layers Tab ←→ Inspector
  │            │            │
  └── SelectionManager ─────┘
      (single source of truth)
```
- Selecting on Canvas highlights in Layers and shows properties in Inspector
- Selecting in Layers highlights on Canvas and shows properties in Inspector
- Inspector edits reflect immediately on Canvas

### Element Creation Flow
```
Add Tab ──drag──→ Canvas ──creates──→ ElementManager
                     │                      │
                     └── updates ──→ Layers Tab (tree refresh)
                     └── selects ──→ Inspector (show properties)
```

### Style Editing Flow
```
Inspector ──change──→ StyleEngine ──emits──→ Canvas (re-render)
     │                     │                     │
     │                     └── records ──→ HistoryManager
     │                                          │
     └────────────────────────────────── History Tab (new entry)
```

### Page Navigation Flow
```
Pages Tab ──switch──→ PageRouter ──activates──→ Canvas (re-render page)
     │                     │                        │
Page Tab Bar ──switch──→   │                   Layers Tab (new tree)
                           │                   Inspector (clear selection)
                           └── emits ──→ All sidebar tabs (page context)
```

### Template Apply Flow
```
Templates Tab ──apply──→ Composer.beginTransaction()
       │                     │
       │                     ├── ElementManager (clear + create)
       │                     ├── StyleEngine (new styles)
       │                     └── Composer.endTransaction()
       │                              │
       └── updates ──→ Canvas, Layers, Inspector (full refresh)
                       HistoryManager (single undo entry)
```

### Export Flow
```
Export Modal ──generate──→ ExportEngine
      │                       │
      ├── reads ──→ ElementManager (all pages)
      ├── reads ──→ StyleEngine (all styles)
      ├── reads ──→ MediaManager (assets to bundle)
      ├── reads ──→ GlobalStyleManager (design tokens)
      ├── reads ──→ ProjectSettings (analytics, integrations)
      ├── reads ──→ CMSBindingManager (resolve data)
      │                       │
      └── output ──→ ZIP download / clipboard
```

### Save/Sync Flow
```
Auto-save trigger ──→ Composer.saveProject()
      │                     │
      ├── SerializeProject() ──→ StorageAdapter (local)
      │                                │
      └── if sync enabled ──→ SyncManager ──→ Cloud
                                  │
                                  └── CollaborationManager (broadcast)
```

### CMS Binding Flow
```
Inspector (Binding Popover) ──bind──→ CMSBindingManager
      │                                    │
CollectionManager ──provides──→ Data      │
      │                                    │
      └── resolves ──→ Canvas element (shows CMS data)
                       CMS Preview Bar (content switcher)
```

## Cross-Screen Data Coupling

| Shared State | Source of Truth | Consumers |
|-------------|----------------|-----------|
| Selected element(s) | SelectionManager | Canvas, Layers, Inspector |
| Element tree | ElementManager | Canvas, Layers, Components Tab |
| Style properties | StyleEngine | Canvas, Inspector |
| Active page | PageRouter | All screens |
| Undo/redo stack | HistoryManager | Header (undo/redo buttons), History Tab |
| Design tokens | GlobalStyleManager | Canvas, Inspector (color pickers), Export |
| Media assets | MediaManager | Media Tab, Canvas (images), Export |
| CMS data | CollectionManager | CMS Preview Bar, Canvas (bound elements), Export |
| Component definitions | ComponentManager | Components Tab, Canvas, Inspector |
| Collaboration presence | CollaborationManager | Header (avatars), Canvas (cursors) |
| Save/dirty state | Composer | Header (save indicator) |
| Device/zoom | Viewport | Header (device selector, zoom), Canvas |
| Project settings | Composer | Settings Tab, Export, Publish |

## Modal Trigger Map

| Modal | Triggered From | Purpose |
|-------|---------------|---------|
| Export Modal | Header export button | Generate and download code |
| Welcome Modal | Auto on first launch | Onboarding introduction |
| Block Picker | Add Tab, Canvas insert | Browse pre-built blocks |
| Icon Picker | Media Tab, Inspector | Select icons |
| Image Editor | Media Tab | Crop, resize, filter images |
| Keyboard Shortcut Help | Canvas (? key) | Show all shortcuts |
| Command Palette | Ctrl+K | Search and execute commands |
| CMS Collection Setup | Settings, Inspector binding | Create CMS collection |
| Conflict Modal | SyncManager (auto) | Resolve merge conflicts |
| Delete Confirmation | Various (delete actions) | Confirm destructive action |
| Upgrade Modal | Feature gates | Prompt plan upgrade |
| Template Preview | Templates Tab | Full-size template preview |
| Page Settings | Pages Tab (drill-in) | SEO and page metadata |

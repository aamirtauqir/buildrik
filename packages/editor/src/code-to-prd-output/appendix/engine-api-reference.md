# Engine API Reference

> **Generated:** 2026-03-25

Complete inventory of the Composer engine's 30 managers and their public APIs.

---

## Composer (Central Orchestrator)

### Project Operations
| Method | Returns | Description |
|--------|---------|-------------|
| `loadProject(id?)` | `Promise<void>` | Load project from storage |
| `saveProject()` | `Promise<void>` | Save current project |
| `importProject(data)` | `void` | Import project data (clear + rebuild) |
| `exportProject()` | `ProjectData` | Serialize entire project |
| `exportHTML(options?)` | `ExportResult` | Generate HTML+CSS |
| `exportJSON()` | `string` | Serialize as JSON string |

### State & Config
| Method | Returns | Description |
|--------|---------|-------------|
| `getState()` | `ComposerState` | Immutable copy of state |
| `getConfig()` | `ComposerConfig` | Configuration copy |
| `isReady()` | `boolean` | Initialization complete? |
| `isDirty()` | `boolean` | Unsaved changes? |
| `markDirty()` | `void` | Flag project as modified |

### Project Settings
| Method | Returns | Description |
|--------|---------|-------------|
| `setProjectSettings(settings)` | `void` | Apply project settings |
| `getProjectSettings()` | `ProjectSettings` | Get settings |
| `updateProjectMetadata(metadata)` | `void` | Update name, author, timestamps |
| `getProjectMetadata()` | `ProjectMetadata` | Get metadata copy |

### Transactions
| Method | Returns | Description |
|--------|---------|-------------|
| `beginTransaction(label?)` | `void` | Start grouped operation |
| `endTransaction()` | `void` | End transaction, emit changes |
| `rollbackTransaction()` | `void` | Discard transaction changes |
| `isTransactionActive()` | `boolean` | In transaction? |

### Viewport
| Method | Returns | Description |
|--------|---------|-------------|
| `setDevice(device)` | `void` | Switch responsive preview |
| `setZoom(zoom)` | `void` | Set canvas zoom (10-500%) |
| `setSnapToGrid(enabled)` | `void` | Toggle grid snapping |
| `setGridSize(size)` | `void` | Set grid cell size (1-100) |

### Preview
| Method | Returns | Description |
|--------|---------|-------------|
| `setPreviewMode(enabled)` | `void` | Start/stop interaction runtime |
| `isPreviewMode()` | `boolean` | In preview mode? |

### Lifecycle
| Method | Returns | Description |
|--------|---------|-------------|
| `destroy()` | `Promise<void>` | Cleanup all managers and listeners |

---

## ElementManager

| Method | Description |
|--------|-------------|
| `createElement(type, options?)` | Create new element |
| `getElementById(id)` | Get element by ID |
| `getAll()` | Get all elements |
| `addChild(parentId, element, index?)` | Add element as child |
| `removeChild(parentId, childId)` | Remove child element |
| `deleteElement(id)` | Delete element and children |
| `duplicate(id)` | Clone element (deep copy) |

### PageManager (via ElementManager)
| Method | Description |
|--------|-------------|
| `createPage(options?)` | Create new page |
| `deletePage(pageId)` | Delete page |
| `getActivePage()` | Get current page |
| `setActivePage(pageId)` | Switch active page |

### HTMLParser (via ElementManager)
| Method | Description |
|--------|-------------|
| `parseHTML(html)` | Convert HTML string to element tree |

---

## SelectionManager

| Method | Description |
|--------|-------------|
| `select(element)` | Select single element |
| `addToSelection(element)` | Add to multi-selection |
| `removeFromSelection(element)` | Remove from selection |
| `clearSelection()` | Clear all selection |
| `getSelected()` | Get primary selected element |
| `getMultiSelected()` | Get all selected elements |
| `selectParent()` | Select parent of current |
| `selectFirstChild()` | Select first child |
| `selectNextSibling()` | Select next sibling |
| `getSelectedBounds()` | Get combined bounding box |
| `reselect()` | Force re-emit selection events |

---

## StyleEngine

| Method | Description |
|--------|-------------|
| `setRule(selector, properties, options?)` | Set CSS rule (supports mediaQuery, pseudo) |
| `getRule(selector)` | Get CSS rule |
| `removeRule(selector)` | Remove CSS rule |
| `getAllRules()` | Get all rules |

---

## HistoryManager

| Method | Description |
|--------|-------------|
| `undo()` | Undo last action |
| `redo()` | Redo undone action |
| `canUndo()` | Has undo entries? |
| `canRedo()` | Has redo entries? |
| `record(label?, snapshot?)` | Record history entry |
| `startTransaction(label?)` | Begin grouped history |
| `endTransaction()` | End grouped history |
| `clear()` | Clear all history |
| `getEntries()` | Get history stack |

---

## VersionHistoryManager

| Method | Description |
|--------|-------------|
| `saveVersion(label?)` | Create named version snapshot |
| `loadVersion(versionId)` | Restore to version |
| `deleteVersion(versionId)` | Delete version |
| `getVersions()` | List all versions |
| `exportVersions()` | Export version data |
| `importVersions(data)` | Import version data |

---

## ComponentManager

| Method | Description |
|--------|-------------|
| `createComponent(elementIds)` | Create component from selection |
| `deleteComponent(componentId)` | Delete component (detaches instances) |
| `instantiate(componentId, parentId)` | Create instance of component |
| `detachInstance(instanceId)` | Convert instance to regular elements |
| `syncInstance(instanceId)` | Apply main component changes to instance |
| `getComponent(id)` | Get component definition |
| `getAllComponents()` | List all components |

---

## CollectionManager (CMS)

| Method | Description |
|--------|-------------|
| `createCollection(name, slug, description?)` | Create CMS collection |
| `deleteCollection(collectionId)` | Delete collection |
| `getCollection(id)` | Get collection |
| `getAllCollections()` | List collections |
| `createContent(collectionId, data)` | Add content item |
| `updateContent(collectionId, itemId, data)` | Edit content item |
| `deleteContent(collectionId, itemId)` | Remove content item |
| `queryContent(collectionId, filters?)` | Query with filter/sort/paginate |
| `validateFieldValue(field, value)` | Validate field data |

---

## CMSBindingManager

| Method | Description |
|--------|-------------|
| `bindToField(elementId, collectionId, itemId, fieldSlug, property)` | Bind element property to CMS field |
| `unbind(elementId, property)` | Remove binding |
| `getBindings(elementId)` | Get all bindings for element |
| `resolveBindings()` | Resolve all bindings to current values |

---

## MediaManager

| Method | Description |
|--------|-------------|
| `uploadAsset(file)` | Upload media file |
| `deleteAsset(assetId)` | Delete asset |
| `getAsset(id)` | Get asset by ID |
| `queryAssets(filters?)` | Search/filter assets |
| `createFolder(name)` | Create media folder |
| `deleteFolder(folderId)` | Delete folder |

---

## CollaborationManager

| Method | Description |
|--------|-------------|
| `joinRoom(roomId)` | Join collaboration session |
| `leaveRoom()` | Leave session |
| `broadcastCursor(position)` | Send cursor position |
| `updateSelection(elementIds)` | Broadcast selection |
| `acquireLock(elementId)` | Request element lock |
| `releaseLock(elementId)` | Release lock |
| `getActiveUsers()` | List connected users |
| `isConnected()` | Connection status |

---

## CommandCenter

| Method | Description |
|--------|-------------|
| `register(command)` | Register command with optional keybinding |
| `unregister(id)` | Remove command |
| `run(id, options?)` | Execute command |
| `stop(id)` | Stop running command |
| `getAll()` | List all commands |
| `get(id)` | Get command by ID |
| `isActive(id)` | Is command running? |

---

## DragManager

| Method | Description |
|--------|-------------|
| `startDrag(data, source, position)` | Begin drag operation |
| `updateDrag(position, target?)` | Update drag position |
| `endDrag()` | Complete drop |
| `cancelDrag()` | Cancel drag |
| `isDragging()` | Is drag in progress? |

---

## InteractionManager

| Method | Description |
|--------|-------------|
| `addInteraction(elementId, interaction)` | Add element interaction |
| `updateInteraction(elementId, interactionId, updates)` | Edit interaction |
| `removeInteraction(elementId, interactionId)` | Delete interaction |
| `toggleInteraction(elementId, interactionId)` | Enable/disable |
| `startRuntime()` | Activate interaction runtime (preview mode) |
| `stopRuntime()` | Deactivate runtime |
| `isRuntimeActive()` | Is runtime running? |

---

## TimelineManager (Animations)

| Method | Description |
|--------|-------------|
| `createTimeline(config)` | Create animation timeline |
| `deleteTimeline(timelineId)` | Remove timeline |
| `addTrack(timelineId, elementId, property)` | Add animation track |
| `addKeyframe(trackId, time, value, easing?)` | Add keyframe |
| `play(timelineId)` | Play animation |
| `pause(timelineId)` | Pause animation |
| `stop(timelineId)` | Stop animation |

---

## FontManager

| Method | Description |
|--------|-------------|
| `registerFont(font)` | Register font |
| `loadFont(fontFamily)` | Load font files |
| `uploadCustomFont(file)` | Upload custom font |
| `getSystemFonts()` | List system fonts |
| `getGoogleFonts(search?)` | Search Google Fonts |

---

## GlobalStyleManager

| Method | Description |
|--------|-------------|
| `setToken(id, value)` | Set design token |
| `getToken(id)` | Get token value |
| `removeToken(id)` | Delete token |
| `getAllTokens()` | List all tokens |

---

## DataManager

| Method | Description |
|--------|-------------|
| `registerSource(source)` | Register data source |
| `unregisterSource(sourceId)` | Remove source |
| `resolveBinding(binding)` | Resolve binding to value |
| `getSource(id)` | Get source by ID |

---

## PageRouter

| Method | Description |
|--------|-------------|
| `register(path, pageId)` | Map path to page |
| `resolve(path)` | Get pageId for path |
| `getPath(pageId)` | Get path for page |
| `getAllRoutes()` | List all routes |
| `unregister(path)` | Remove route |

---

## SyncManager

| Method | Description |
|--------|-------------|
| `startSync()` | Begin auto-sync |
| `stopSync()` | Stop auto-sync |
| `syncNow()` | Force immediate sync |
| `isOnline()` | Network status |
| `getQueueSize()` | Pending operations count |

---

## StorageAdapter

| Method | Description |
|--------|-------------|
| `save(data)` | Persist project data |
| `load(id?)` | Load project data |
| `delete(id)` | Delete project |
| `list()` | List saved projects |

---

## PluginManager

| Method | Description |
|--------|-------------|
| `register(plugin)` | Register plugin |
| `unregister(pluginId)` | Remove plugin |
| `getPlugin(id)` | Get plugin |
| `getAll()` | List all plugins |
| `isLoaded(pluginId)` | Is plugin active? |

---

## RecoveryManager

| Method | Description |
|--------|-------------|
| `validateState()` | Check state integrity |
| `repair()` | Fix invalid state |
| `forceResync()` | Force canvas re-sync |

---

## Viewport

| Method | Description |
|--------|-------------|
| `setDevice(device)` | Switch device preview |
| `getDevice()` | Current device |
| `setZoom(zoom)` | Set zoom level |
| `getZoom()` | Current zoom |
| `getDimensions()` | Canvas dimensions |

---

## ExportEngine

| Method | Description |
|--------|-------------|
| `exportHTML(options?)` | Generate HTML output |
| `exportReact(options?)` | Generate React components |
| `exportVue(options?)` | Generate Vue SFCs |
| `exportNextJS(options?)` | Generate Next.js pages |
| `exportZIP(options?)` | Generate ZIP bundle |

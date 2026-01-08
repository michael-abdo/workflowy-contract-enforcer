# Workflowy API Schema (Chrome Extension Access)

This documents the internal Workflowy API accessible via Chrome extension running in page context.

## Core Access Methods

```javascript
WF.getItemById(id)      // Get any item by ID
WF.rootItem()           // Get root/Home item
WF.User.data.user       // User data including dateJoined
```

## Item Data Properties (`item.data`)

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | UUID (or "None" for root) |
| `nm` | string | Name/title (HTML string) |
| `no` | string | Note (HTML string) |
| `ct` | number | Created timestamp (relative seconds since dateJoined) |
| `lm` | number | Last modified timestamp (relative seconds) |
| `cp` | number | Completed timestamp (if completed) |
| `ch` | array | Children array of item objects |
| `pa` | object | Parent reference |
| `expanded` | boolean | Expansion state |
| `metadata` | object | Contains mirror, calendar data |
| `cb` | unknown | Unknown purpose |
| `version` | number | Item version |

## Mirror Creation (Undocumented API)

```javascript
// Create a mirror of sourceItem under parentItem at given priority
// parentItem.data.mirrorUnder(arrayOfSourceItemData, priority)
const parentItem = WF.getItemById('parent-id');
const sourceItem = WF.getItemById('source-id');
const result = parentItem.data.mirrorUnder([sourceItem.data], 0);
// Returns array of created mirror items
```

**Note**: This is an internal Workflowy API discovered by examining `wf-base.js`.
It creates true linked mirrors (with diamond icon) that stay synced with the original.

## Mirror/Backlink Detection

```javascript
// Check if item is a mirror (diamond icon)
item.data.metadata?.mirror?.mirrorRootIds  // Returns {originalId: true}

// Mirror-specific properties (exist only on mirror items):
item.data.reactToOriginalMarkChanged       // Function - exists if this is a mirror
item.data.reactToOriginalSetChildren       // Function
item.data._cachedOriginalItem              // Cached reference to original item
item.data.mirroringMetadata                // Mirroring metadata
item.data.lastOriginalItemVersion          // Version tracking
```

### Finding Original from Mirror
```javascript
const mirrorRootIds = item.data.metadata?.mirror?.mirrorRootIds;
if (mirrorRootIds) {
  // IMPORTANT: mirrorRootIds may contain the item's own ID - filter it out!
  const ids = Object.keys(mirrorRootIds).filter(id => id !== item.data.id);
  const originalId = ids[0];
  if (originalId) {
    const originalItem = WF.getItemById(originalId);
    console.log("Original item:", originalItem.data.nm);
  }
}
```

**Gotcha**: `mirrorRootIds` is an object that can contain multiple IDs including the mirror item's own ID. Always filter out self-references when looking for the original.

## Timestamp Conversion

Workflowy stores timestamps as **seconds since user's dateJoined**.

```javascript
// Get user's join date
const dateJoined = new Date(WF.User.data.user.dateJoined);
// Example: "2020-10-01T18:28:12.748"

// Convert relative timestamp to actual date
function toActualDate(relativeTimestamp) {
  const dateJoined = new Date(WF.User.data.user.dateJoined);
  return new Date(dateJoined.getTime() + (relativeTimestamp * 1000));
}

// Usage
const createdDate = toActualDate(item.data.ct);
const modifiedDate = toActualDate(item.data.lm);
```

## All Discovered Data Keys

### item.data keys (29)
- `getProjectReference` - function
- `getProjectTree` - function
- `id` - UUID string
- `inLeftBar` - boolean
- `priorityBeforeDeleted` - number
- `ch` - children array
- `nm` - name/title
- `no` - note
- `ct` - created timestamp
- `metadata` - metadata object
- `lm` - last modified timestamp
- `pa` - parent reference
- `expanded` - expansion state
- `events` - event handlers
- `nameContent` - parsed name content
- `noteContent` - parsed note content
- `tag_mgr` - tag manager
- `expansion` - expansion data
- `version` - item version
- `cb` - unknown
- `cachedVisibleState` - visibility cache
- `cachedShowCompleted` - show completed cache
- `in_dom` - DOM presence flag
- `reactToOriginalMarkChanged` - mirror function
- `reactToOriginalSetChildren` - mirror function
- `itemMetadata` - item metadata
- `mirroringMetadata` - mirror metadata
- `_cachedOriginalItem` - cached original
- `lastOriginalItemVersion` - version tracking

### metadata keys (2)
- `mirror` - contains `mirrorRootIds` object
- `calendar` - calendar integration data

### Root item metadata keys (15)
- `searchForChangesAfter`
- `slash`
- `starring`
- `latestColor`
- `timeFormat`
- `conversations`
- `_recentlySavedTo`
- `ai`
- `mirrors`
- `inbox_id`
- `changelog`
- `shortcut`
- `calendar`
- `cmd_metrics`
- `dupe`

## DOM Selectors for Finding Items

```javascript
// Find mirror nodes (diamond icon)
document.querySelector('.mirrorDiamondIcon')

// Find nodes that have mirrors pointing to them
document.querySelector('.hasMirrors')

// Get item ID from DOM element
const projectEl = element.closest('[projectid]');
const itemId = projectEl.getAttribute('projectid');
```

## WF Global Object Methods

```javascript
// Core item access
WF.rootItem()           // Get root item
WF.getItemById(id)      // Get item by UUID
WF.focusedItem()        // Get currently focused item
WF.currentItem()        // Get current item

// Item manipulation
WF.createItem(parent, priority)     // Create new item
WF.deleteItem(item)                 // Delete item
WF.duplicateItem(item)              // Duplicate item
WF.completeItem(item)               // Mark complete
WF.setItemName(item, name)          // Set item name
WF.setItemNote(item, note)          // Set item note
WF.moveItems(items, parent, priority) // Move items
WF.expandItem(item)                 // Expand item
WF.collapseItem(item)               // Collapse item

// Navigation
WF.zoomTo(item)         // Zoom to item
WF.zoomIn()             // Zoom in
WF.zoomOut()            // Zoom out

// Utilities
WF.undo()               // Undo last action
WF.redo()               // Redo action
WF.save()               // Force save
WF.editGroup(fn)        // Batch edits together
```

## Item Wrapper Methods (item from WF.getItemById)

```javascript
// These are on the item wrapper object returned by WF.getItemById()
item.getId()
item.getName()
item.getNameInPlainText()
item.getNote()
item.getNoteInPlainText()
item.isExpanded()
item.isCompleted()
item.isShared()
item.getParent()
item.getAncestors()
item.getChildren()
item.getVisibleChildren()
item.getNextVisibleSibling()
item.getPreviousVisibleSibling()
item.getPriority()
item.isMainDocumentRoot()
item.getUrl()
item.equals(otherItem)
item.getSharedUrl()
item.getLastModifiedByUserId()
item.getLastModifiedDate()
item.getCompletedDate()
item.getNumDescendants()
item.getElement()
item.isReadOnly()
item.isEmbedded()
item.getSharedInfo()
item.isAddedSubtreePlaceholder()
item.getTagManager()
item.containsAddedSubtreePlaceholder()
item.hasSharedAncestor()
item.isWithinCompleted()
```

## Item Data Prototype Methods (item.data)

The `item.data` object has a rich prototype with 128+ methods. Key ones:

```javascript
// Mirror operations
item.data.mirrorUnder([sourceItems], priority)  // Create mirrors under this item
item.data.mirrorProjectTree()                    // Get mirror project tree
item.data.isMirror()                             // Check if this is a mirror

// Duplication
item.data.duplicateUnder([items], priority)     // Duplicate items under this
item.data.duplicateProjectTree()                 // Get duplicate project tree

// Tree operations
item.data.createUnder(projectTrees, priority)   // Create items under this
item.data.moveUnder(items, priority)            // Move items under this
item.data.pasteUnder(items, priority)           // Paste items under this

// Navigation
item.data.toDestination()                       // Convert to destination format
item.data.toSource()                            // Convert to source format
item.data.toViewable()                          // Convert to viewable format

// Metadata
item.data.setMetadata(metadata)                 // Set item metadata
item.data.mergeMetadataWith(metadata)           // Merge metadata

// Tree traversal
item.data.parent()                              // Get parent
item.data.children()                            // Get children
item.data.getAncestors()                        // Get ancestors
item.data.forEachItemInSubtree(fn)              // Iterate subtree
item.data.countItemsInSubtree()                 // Count items in subtree

// State
item.data.isExpanded()
item.data.isReadOnly()
item.data.isDeletable()
item.data.valid()
item.data.focused()
```

## Project Reference Object (item.data.projectReferenceOrThrow)

```javascript
const ref = item.data.projectReferenceOrThrow;

// Key methods (48 total)
ref.getId()
ref.getItem()
ref.getName()
ref.getNameInPlainText()
ref.getNote()
ref.getParent()
ref.getAncestors()
ref.getChildren()
ref.getPotentiallyVisibleChildren()
ref.getVisibleChildren()
ref.getPriority()
ref.isReadOnly()
ref.isShared()
ref.setMetadata(metadata)
ref.setExpanded(bool)
ref.applyLocalEdit(editData)
ref.applyLocalBulkCreateChildren(priority, projectTrees)
ref.navigateTo()
```

## Key Findings for Contract Validation

1. **Timestamps available** - Both `ct` (created) and `lm` (lastModified) accessible
2. **Mirrors detectable** - `metadata.mirror.mirrorRootIds` links mirror to original
3. **Mirrors distinguishable** - Mirror items have `isMirrorRoot: true` in metadata, empty `nm` field
4. **Children traversable** - `item.data.ch` array contains child item objects
5. **No rate limits** - Chrome extension has full DOM/API access
6. **Real-time access** - No polling needed, direct WF global access
7. **Tag detection** - Parse `nm` and `no` for #hashtags

## Advantages Over Official API

| Feature | Official Beta API | Chrome Extension |
|---------|------------------|------------------|
| Rate Limit | 1 req/min | None |
| Mirrors/Backlinks | No | Yes |
| Timestamps | Yes | Yes |
| Real-time | No (polling) | Yes (direct access) |
| Write Access | Yes | Yes (via WF methods) |

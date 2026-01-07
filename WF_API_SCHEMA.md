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
  const originalId = Object.keys(mirrorRootIds)[0];
  const originalItem = WF.getItemById(originalId);
  console.log("Original item:", originalItem.data.nm);
}
```

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

## Key Findings for Contract Validation

1. **Timestamps available** - Both `ct` (created) and `lm` (lastModified) accessible
2. **Mirrors detectable** - `metadata.mirror.mirrorRootIds` links mirror to original
3. **Children traversable** - `item.data.ch` array contains child item objects
4. **No rate limits** - Chrome extension has full DOM/API access
5. **Real-time access** - No polling needed, direct WF global access
6. **Tag detection** - Parse `nm` and `no` for #hashtags

## Advantages Over Official API

| Feature | Official Beta API | Chrome Extension |
|---------|------------------|------------------|
| Rate Limit | 1 req/min | None |
| Mirrors/Backlinks | No | Yes |
| Timestamps | Yes | Yes |
| Real-time | No (polling) | Yes (direct access) |
| Write Access | Yes | Yes (via WF methods) |

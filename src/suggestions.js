/**
 * Suggestions Module - Keyboard handling and suggestion acceptance
 *
 * Provides:
 * - Keyboard listener for Cmd+` to accept suggestions
 * - Logic to insert suggestion text into Workflowy nodes
 * - Field node detection
 */

console.log('[Contract Suggestions] Script loading...');

/**
 * Find the current field node based on the active suggestion
 * @param {Object} idea - The idea object
 * @param {string} field - The field name to find
 * @returns {Object|null} The Workflowy item for the field, or null
 */
function findFieldNode(idea, field) {
  if (!idea || !field) return null;
  if (!window.ContractParser) {
    console.warn('[Suggestions] ContractParser not available');
    return null;
  }

  // Get the contract item
  const contractItem = window.ContractParser.getItemById(idea.id);
  if (!contractItem) {
    console.warn('[Suggestions] Contract item not found:', idea.id);
    return null;
  }

  // Find the field child
  const fieldItem = window.ContractParser.findFieldChild(contractItem, field);
  return fieldItem;
}

/**
 * Get the insertion priority based on cursor position
 * @param {Object} contractItem - The contract item to insert under
 * @returns {number} Priority for insertion (after cursor, or bottom if no cursor)
 */
function getCursorInsertPriority(contractItem) {
  try {
    const focused = WF.focusedItem();
    if (focused) {
      // Check if cursor is within the contract (focused item's parent is the contract)
      const parent = focused.getParent();
      if (parent && parent.getId() === contractItem.getId()) {
        // Insert after the cursor position
        return focused.getPriority() + 1;
      }
    }
  } catch (e) {
    console.warn('[Suggestions] Could not get cursor position:', e);
  }

  // Default to bottom - get child count
  try {
    const children = contractItem.getChildren ? contractItem.getChildren() : [];
    return children.length; // Insert at end
  } catch (e) {
    return 999; // Fallback to high number (bottom)
  }
}

/**
 * Create a mirror of a source item under a parent
 * @param {Object} parentItem - Parent item to create mirror under
 * @param {number} priority - Position priority
 * @param {string} sourceId - ID of the source item to mirror
 * @returns {Object|null} Created mirror item or null
 */
function createMirrorNode(parentItem, priority, sourceId) {
  try {
    const sourceItem = WF.getItemById(sourceId);
    if (!sourceItem) {
      console.warn('[Suggestions] Source item not found for mirror:', sourceId);
      return null;
    }

    // Use the internal mirrorUnder API on item.data
    if (parentItem.data && typeof parentItem.data.mirrorUnder === 'function' && sourceItem.data) {
      const result = parentItem.data.mirrorUnder([sourceItem.data], priority);
      if (result && result.length > 0) {
        console.log('[Suggestions] Created mirror via mirrorUnder API');
        return result[0];
      }
    }

    // Fallback: Create regular item with source text (not a true mirror)
    console.warn('[Suggestions] mirrorUnder not available, falling back to text copy');
    const childItem = WF.createItem(parentItem, priority);
    if (childItem) {
      const sourceName = sourceItem.getName ? sourceItem.getName() : '';
      WF.setItemName(childItem, sourceName);
      console.log('[Suggestions] Created text copy:', sourceName);
      return childItem;
    }
  } catch (e) {
    console.error('[Suggestions] Error creating mirror:', e);
  }
  return null;
}

/**
 * Create a new field node under the contract if it doesn't exist
 * @param {Object} idea - The idea object
 * @param {string} field - The field name
 * @param {string|Object[]} value - Text value or array of {text, id} items
 * @returns {boolean} True if successful
 */
function createOrUpdateField(idea, field, value) {
  if (!idea || !field || !value) return false;

  // Get the contract item
  const contractItem = window.ContractParser?.getItemById(idea.id);
  if (!contractItem) {
    console.warn('[Suggestions] Contract item not found');
    return false;
  }

  // Format field label (capitalize first letter of each word)
  const fieldLabels = {
    intent: 'Intent',
    stakeholders: 'Stakeholders',
    owner: 'Owner',
    system_ref: 'System Reference',
    qa_doc: 'QA Document',
    update_set: 'Update Set',
    qa_results: 'QA Results'
  };
  const fieldLabel = fieldLabels[field] || field;

  // Check if field already exists
  let fieldItem = findFieldNode(idea, field);

  // Handle both string values and item arrays
  let items;
  if (typeof value === 'string') {
    // Legacy string format - split into lines with no IDs
    items = value.split('\n')
      .filter(line => line.trim() !== '')
      .map(text => ({ text: text.trim(), id: null }));
  } else if (Array.isArray(value)) {
    // Array of {text, id} objects
    items = value;
  } else {
    console.warn('[Suggestions] Invalid value type:', typeof value);
    return false;
  }

  if (fieldItem) {
    // Update existing field - add children at cursor position
    try {
      if (typeof WF !== 'undefined' && WF.createItem) {
        const insertPriority = getCursorInsertPriority(fieldItem);
        // Create a child node for each item (as mirror if has ID, else text)
        items.forEach((item, index) => {
          if (item.id) {
            // Create mirror
            createMirrorNode(fieldItem, insertPriority + index, item.id);
          } else {
            // Create text node
            const childItem = WF.createItem(fieldItem, insertPriority + index);
            if (childItem) {
              WF.setItemName(childItem, item.text);
            }
          }
        });
        console.log('[Suggestions] Added', items.length, 'children to existing field');
        return true;
      }
    } catch (e) {
      console.error('[Suggestions] Error updating field:', e);
    }
  } else {
    // Check if cursor is on an empty node within the contract that we can reuse
    try {
      if (typeof WF !== 'undefined' && WF.createItem) {
        const focused = WF.focusedItem();
        const isEmptyNode = focused && focused.getName().trim() === '';
        const parent = focused?.getParent();
        const isChildOfContract = parent && parent.getId() === contractItem.getId();

        if (isEmptyNode && isChildOfContract) {
          // Reuse the empty node as the field
          WF.setItemName(focused, fieldLabel);
          // Create a child node for each item
          items.forEach((item, index) => {
            if (item.id) {
              createMirrorNode(focused, index, item.id);
            } else {
              const childItem = WF.createItem(focused, index);
              if (childItem) {
                WF.setItemName(childItem, item.text);
              }
            }
          });
          console.log('[Suggestions] Converted empty node to field with', items.length, 'children');
          return true;
        } else {
          // Create new field under contract with suggestion as children
          const insertPriority = getCursorInsertPriority(contractItem);

          // Create the field with label as name
          const newItem = WF.createItem(contractItem, insertPriority);
          if (newItem) {
            WF.setItemName(newItem, fieldLabel);
            // Create a child node for each item
            items.forEach((item, index) => {
              if (item.id) {
                createMirrorNode(newItem, index, item.id);
              } else {
                const childItem = WF.createItem(newItem, index);
                if (childItem) {
                  WF.setItemName(childItem, item.text);
                }
              }
            });
            console.log('[Suggestions] Created field with', items.length, 'children at position:', insertPriority);
            return true;
          }
        }
      }
    } catch (e) {
      console.error('[Suggestions] Error creating field:', e);
    }
  }

  return false;
}

/**
 * Accept the current suggestion and insert it into the field
 * @param {number|null} itemIndex - Index of specific item to insert (1-based), null for all items
 * @returns {boolean} True if suggestion was accepted successfully
 */
function acceptSuggestion(itemIndex = null) {
  const UI = window.ContractUI;
  if (!UI) {
    console.warn('[Suggestions] ContractUI not available');
    return false;
  }

  const suggestion = UI.getCurrentSuggestion();
  if (!suggestion || !suggestion.idea || !suggestion.field) {
    console.log('[Suggestions] No active suggestion to accept');
    return false;
  }

  const items = suggestion.items || [];
  let itemsToInsert;
  let itemCount;

  if (itemIndex === null || items.length === 0) {
    // Insert all items
    itemsToInsert = items.length > 0 ? items : suggestion.text;
    itemCount = items.length || 1;
    console.log('[Suggestions] Accepting ALL items for', suggestion.field);
  } else {
    // Insert specific item (1-based index)
    const idx = itemIndex - 1;
    if (idx < 0 || idx >= items.length) {
      console.warn('[Suggestions] Invalid item index:', itemIndex);
      return false;
    }
    // Pass as array with single item to preserve {text, id} structure
    itemsToInsert = [items[idx]];
    itemCount = 1;
    console.log('[Suggestions] Accepting item', itemIndex, 'for', suggestion.field);
  }

  if (!itemsToInsert || (Array.isArray(itemsToInsert) && itemsToInsert.length === 0)) {
    console.warn('[Suggestions] No items to insert');
    return false;
  }

  // Create or update the field with the items (will create mirrors if items have IDs)
  const success = createOrUpdateField(suggestion.idea, suggestion.field, itemsToInsert);

  if (success) {
    // Hide the suggestion overlay
    UI.hideSuggestion();

    // Show success toast
    const itemText = itemIndex === null ? `${itemCount} items` : `item ${itemIndex}`;
    UI.showSuccess('Suggestion Accepted', `${suggestion.field}: ${itemText} inserted`);

    return true;
  } else {
    UI.showError('Failed to Accept', 'Could not insert suggestion into field');
    return false;
  }
}

/**
 * Initialize keyboard listener for suggestion acceptance
 * Listens for Ctrl+1 through Ctrl+9 for numbered item selection
 * Listens for Ctrl+F to focus search input in tree mode
 * Supports both flat mode (static numbers) and tree mode (dynamic visible items)
 */
function initKeyboardListener() {
  document.addEventListener('keydown', (event) => {
    // Only handle Ctrl + keys
    if (!event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
      return;
    }

    // Only trigger if there's an active suggestion visible
    const suggestion = window.ContractUI?.getCurrentSuggestion();
    const hasSuggestion = suggestion && suggestion.idea && suggestion.field;

    if (!hasSuggestion) {
      return;
    }

    // Handle Ctrl+F for search focus (tree mode only)
    if (event.key === 'f' || event.key === 'F') {
      const searchInput = document.querySelector('.contract-suggestion-search-input');
      if (searchInput) {
        event.preventDefault();
        event.stopPropagation();
        searchInput.focus();
        searchInput.select();
        console.log('[Suggestions] Focused search input (Ctrl+F)');
        return;
      }
    }

    // Check for number keys 1-9
    const keyNum = parseInt(event.key, 10);
    if (isNaN(keyNum) || keyNum < 1 || keyNum > 9) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    // Check if we're in tree mode (has visibleItems array)
    const visibleItems = suggestion.visibleItems;
    if (visibleItems && visibleItems.length > 0) {
      // Tree mode - use dynamic numbering from visible items
      const allItemsNum = visibleItems.length + 1;

      if (keyNum === allItemsNum) {
        // Insert all items (from full tree, not just visible)
        console.log('[Suggestions] Tree mode: Ctrl+' + keyNum + ' - Insert All');
        acceptSuggestion(null);
      } else if (keyNum <= visibleItems.length) {
        // Insert specific visible item by its ID
        const item = visibleItems[keyNum - 1];
        console.log('[Suggestions] Tree mode: Ctrl+' + keyNum + ' - Insert item:', item.text);
        acceptTreeItem(item.id);
      } else {
        console.log('[Suggestions] Invalid item number:', keyNum, '(only', visibleItems.length, 'visible items)');
      }
    } else {
      // Flat mode - use static index numbering
      const items = suggestion.items || [];
      const allItemsNum = items.length + 1;

      if (keyNum === allItemsNum) {
        // Insert all items
        console.log('[Suggestions] Flat mode: Ctrl+' + keyNum + ' - Insert All');
        acceptSuggestion(null);
      } else if (keyNum <= items.length) {
        // Insert specific item by index (1-based)
        console.log('[Suggestions] Flat mode: Ctrl+' + keyNum);
        acceptSuggestion(keyNum);
      } else {
        console.log('[Suggestions] Invalid item number:', keyNum, '(only', items.length, 'items available)');
      }
    }
  }, true); // Use capture phase to get event before Workflowy

  console.log('[Suggestions] Keyboard listener initialized (Ctrl + 1-9, Ctrl+F)');
}

/**
 * Get custom text lines from the textarea as items
 * @returns {Array<{text: string, id: null}>} Array of text items
 */
function getCustomTextItems() {
  const textarea = document.querySelector('.contract-suggestion-custom-input');
  if (!textarea || !textarea.value) return [];

  return textarea.value.split('\n')
    .map(line => line.trim())
    .filter(line => line !== '')
    .map(text => ({ text, id: null }));
}

/**
 * Clear the custom text textarea
 */
function clearCustomTextInput() {
  const textarea = document.querySelector('.contract-suggestion-custom-input');
  if (textarea) textarea.value = '';
}

/**
 * Accept the currently selected items (multi-select) combined with custom text
 * Inserts all checked items plus any custom text lines from the textarea
 * @returns {boolean} True if items were accepted successfully
 */
function acceptSelectedItems() {
  const UI = window.ContractUI;
  if (!UI) {
    console.warn('[Suggestions] ContractUI not available');
    return false;
  }

  const suggestion = UI.getCurrentSuggestion();
  if (!suggestion || !suggestion.idea || !suggestion.field) {
    console.log('[Suggestions] No active suggestion to accept');
    return false;
  }

  const selectedIndices = UI.getSelectedIndices();
  const items = suggestion.items || [];

  // Collect selected items in order (as {text, id} objects)
  const selectedItems = selectedIndices
    .sort((a, b) => a - b)
    .map(idx => items[idx])
    .filter(item => item);

  // Get custom text items from textarea
  const customItems = getCustomTextItems();

  // Combine selected items + custom text
  const allItems = [...selectedItems, ...customItems];

  if (allItems.length === 0) {
    console.log('[Suggestions] No items selected and no custom text');
    return false;
  }

  console.log('[Suggestions] Accepting', selectedItems.length, 'selected +', customItems.length, 'custom items for', suggestion.field);

  // Create or update the field with all items (will create mirrors if items have IDs)
  const success = createOrUpdateField(suggestion.idea, suggestion.field, allItems);

  if (success) {
    // Hide the suggestion overlay
    UI.hideSuggestion();

    // Show success toast
    UI.showSuccess('Suggestion Accepted', `${suggestion.field}: ${allItems.length} items inserted`);

    return true;
  } else {
    UI.showError('Failed to Accept', 'Could not insert selected items');
    return false;
  }
}

/**
 * Accept a single tree item by ID (used by keyboard shortcuts in tree mode)
 * @param {string} id - Item ID to insert
 * @returns {boolean} True if successful
 */
function acceptTreeItem(id) {
  const UI = window.ContractUI;
  if (!UI) {
    console.warn('[Suggestions] ContractUI not available');
    return false;
  }

  const suggestion = UI.getCurrentSuggestion();
  if (!suggestion || !suggestion.idea || !suggestion.field) {
    console.log('[Suggestions] No active suggestion to accept');
    return false;
  }

  // Find item in tree by ID
  function findInTree(nodes, targetId) {
    for (const node of nodes) {
      if (node.id === targetId) return node;
      if (node.children && node.children.length > 0) {
        const found = findInTree(node.children, targetId);
        if (found) return found;
      }
    }
    return null;
  }

  const tree = suggestion.tree || [];
  const item = findInTree(tree, id);

  if (!item) {
    console.warn('[Suggestions] Tree item not found:', id);
    return false;
  }

  console.log('[Suggestions] Accepting tree item:', item.text, 'id:', item.id);

  // Create single item array with text and id for mirror creation
  const itemToInsert = [{ text: item.text, id: item.id }];
  const success = createOrUpdateField(suggestion.idea, suggestion.field, itemToInsert);

  if (success) {
    UI.hideSuggestion();
    UI.showSuccess('Suggestion Accepted', `${suggestion.field}: 1 item inserted`);
    return true;
  } else {
    UI.showError('Failed to Accept', 'Could not insert item');
    return false;
  }
}

/**
 * Accept the currently selected tree items (multi-select in tree mode) combined with custom text
 * Inserts all checked items plus any custom text lines from the textarea
 * @returns {boolean} True if successful
 */
function acceptSelectedTreeItems() {
  const UI = window.ContractUI;
  if (!UI) {
    console.warn('[Suggestions] ContractUI not available');
    return false;
  }

  const suggestion = UI.getCurrentSuggestion();
  if (!suggestion || !suggestion.idea || !suggestion.field) {
    console.log('[Suggestions] No active suggestion to accept');
    return false;
  }

  const selectedIds = suggestion.selectedIds || new Set();

  // Find all selected items in tree by ID
  function findInTree(nodes, targetId) {
    for (const node of nodes) {
      if (node.id === targetId) return node;
      if (node.children && node.children.length > 0) {
        const found = findInTree(node.children, targetId);
        if (found) return found;
      }
    }
    return null;
  }

  const tree = suggestion.tree || [];
  const selectedItems = [];

  for (const id of selectedIds) {
    const item = findInTree(tree, id);
    if (item) {
      selectedItems.push({ text: item.text, id: item.id });
    }
  }

  // Get custom text items from textarea
  const customItems = getCustomTextItems();

  // Combine selected items + custom text
  const allItems = [...selectedItems, ...customItems];

  if (allItems.length === 0) {
    console.log('[Suggestions] No tree items selected and no custom text');
    return false;
  }

  console.log('[Suggestions] Accepting', selectedItems.length, 'selected +', customItems.length, 'custom items for', suggestion.field);

  const success = createOrUpdateField(suggestion.idea, suggestion.field, allItems);

  if (success) {
    UI.hideSuggestion();
    UI.showSuccess('Suggestion Accepted', `${suggestion.field}: ${allItems.length} items inserted`);
    return true;
  } else {
    UI.showError('Failed to Accept', 'Could not insert selected items');
    return false;
  }
}

/**
 * Insert custom text as child node(s) of the current field
 * Each line becomes a separate child node
 * @param {string} text - The text to insert (may contain newlines)
 * @returns {boolean} True if successful
 */
function insertCustomText(text) {
  const UI = window.ContractUI;
  if (!UI) {
    console.warn('[Suggestions] ContractUI not available');
    return false;
  }

  const suggestion = UI.getCurrentSuggestion();
  if (!suggestion || !suggestion.idea || !suggestion.field) {
    console.log('[Suggestions] No active suggestion to insert custom text');
    return false;
  }

  if (!text || text.trim() === '') {
    console.log('[Suggestions] No text to insert');
    return false;
  }

  // Split by newlines and filter empty lines
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line !== '');

  if (lines.length === 0) {
    console.log('[Suggestions] No valid lines to insert');
    return false;
  }

  console.log('[Suggestions] Inserting', lines.length, 'custom text item(s) for', suggestion.field);

  // Convert lines to items (text-only, no ID, so they won't be mirrors)
  const items = lines.map(line => ({ text: line, id: null }));

  const success = createOrUpdateField(suggestion.idea, suggestion.field, items);

  if (success) {
    const message = lines.length === 1
      ? `Added to ${suggestion.field}`
      : `Added ${lines.length} items to ${suggestion.field}`;
    UI.showSuccess('Text Added', message);
    return true;
  } else {
    UI.showError('Failed to Add', 'Could not insert custom text');
    return false;
  }
}

// Export for use in other modules
window.ContractSuggestions = {
  findFieldNode,
  createOrUpdateField,
  acceptSuggestion,
  acceptSelectedItems,
  acceptTreeItem,
  acceptSelectedTreeItems,
  insertCustomText,
  initKeyboardListener
};

console.log('[Contract Suggestions] Loaded');

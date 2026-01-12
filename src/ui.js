/**
 * UI Module - Toast notifications and visual feedback
 *
 * Provides:
 * - Toast notifications for errors and status
 * - Next field prompts
 * - State indicator display
 * - Visual feedback for validation
 */

// Toast container ID
const TOAST_CONTAINER_ID = 'contract-toast-container';
const PROMPT_CONTAINER_ID = 'contract-prompt-container';
const SUGGESTION_CONTAINER_ID = 'contract-suggestion-container';

// Toast types
const TOAST_TYPES = {
  ERROR: 'error',
  WARNING: 'warning',
  SUCCESS: 'success',
  INFO: 'info'
};

// State colors
const STATE_COLORS = {
  raw: '#9ca3af',       // Gray
  wanting: '#f59e0b',   // Amber
  planning: '#3b82f6',  // Blue
  implementing: '#8b5cf6', // Purple
  done: '#10b981'       // Green
};

/**
 * Inject CSS styles into the page
 */
function injectStyles() {
  if (document.getElementById('contract-ui-styles')) {
    return; // Already injected
  }

  const styles = document.createElement('style');
  styles.id = 'contract-ui-styles';
  styles.textContent = `
    /* Toast Container */
    #${TOAST_CONTAINER_ID} {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }

    /* Toast Base */
    .contract-toast {
      padding: 12px 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      max-width: 350px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      pointer-events: auto;
      animation: slideIn 0.3s ease-out;
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }

    .contract-toast.closing {
      animation: slideOut 0.2s ease-in forwards;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }

    /* Toast Types */
    .contract-toast.error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }

    .contract-toast.warning {
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
    }

    .contract-toast.success {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
    }

    .contract-toast.info {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
    }

    /* Toast Icon */
    .contract-toast-icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
    }

    /* Toast Content */
    .contract-toast-content {
      flex: 1;
    }

    .contract-toast-title {
      font-weight: 600;
      margin-bottom: 2px;
    }

    .contract-toast-message {
      opacity: 0.9;
    }

    /* Toast Close Button */
    .contract-toast-close {
      flex-shrink: 0;
      background: none;
      border: none;
      cursor: pointer;
      opacity: 0.5;
      padding: 2px;
      transition: opacity 0.2s;
    }

    .contract-toast-close:hover {
      opacity: 1;
    }

    /* Prompt Container */
    #${PROMPT_CONTAINER_ID} {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999998;
      pointer-events: none;
    }

    /* Next Field Prompt - Minimal, just the question */
    .contract-prompt {
      background: rgba(0, 0, 0, 0.75);
      padding: 10px 14px;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      pointer-events: auto;
      max-width: 280px;
      color: white;
    }

    .contract-prompt-question {
      line-height: 1.4;
    }

    .contract-prompt-field {
      opacity: 0.6;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    /* State Badge (inline) */
    .contract-state-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      color: white;
      margin-left: 4px;
    }

    /* Suggestion Container */
    #${SUGGESTION_CONTAINER_ID} {
      position: fixed;
      bottom: 90px;
      right: 20px;
      z-index: 999997;
      pointer-events: none;
    }

    /* Suggestion Overlay */
    .contract-suggestion {
      background: rgba(59, 130, 246, 0.95);
      padding: 12px 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      pointer-events: auto;
      max-width: 320px;
      color: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      animation: slideIn 0.2s ease-out;
    }

    .contract-suggestion-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .contract-suggestion-field {
      opacity: 0.8;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .contract-suggestion-shortcut {
      background: rgba(255, 255, 255, 0.2);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-family: monospace;
    }

    .contract-suggestion-question {
      font-size: 13px;
      line-height: 1.4;
      margin-bottom: 8px;
      opacity: 0.95;
    }

    .contract-suggestion-text {
      font-style: italic;
      opacity: 0.85;
      line-height: 1.5;
      white-space: pre-wrap;
      background: rgba(0, 0, 0, 0.15);
      padding: 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    .contract-suggestion.closing {
      animation: slideOut 0.2s ease-in forwards;
    }

    /* Suggestion Items (numbered) */
    .contract-suggestion-items {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .contract-suggestion-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      background: rgba(0, 0, 0, 0.15);
      padding: 6px 10px;
      border-radius: 4px;
    }

    .contract-suggestion-key {
      background: rgba(255, 255, 255, 0.25);
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
      font-family: monospace;
      font-weight: 600;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .contract-suggestion-value {
      font-size: 12px;
      line-height: 1.4;
      opacity: 0.95;
    }

    .contract-suggestion-all {
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      margin-top: 4px;
      padding-top: 10px;
    }

    .contract-suggestion-all .contract-suggestion-value {
      font-weight: 600;
    }

    /* Checkbox styles for multi-select */
    .contract-suggestion-item {
      cursor: pointer;
      transition: background 0.15s;
    }

    .contract-suggestion-item:hover {
      background: rgba(0, 0, 0, 0.25);
    }

    .contract-suggestion-item.selected {
      background: rgba(255, 255, 255, 0.15);
    }

    .contract-suggestion-checkbox {
      width: 16px;
      height: 16px;
      margin-right: 4px;
      cursor: pointer;
      accent-color: white;
      flex-shrink: 0;
    }

    /* Insert Selected button */
    .contract-suggestion-actions {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      display: flex;
      gap: 8px;
    }

    .contract-suggestion-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      color: white;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .contract-suggestion-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .contract-suggestion-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .contract-suggestion-btn-primary {
      background: rgba(255, 255, 255, 0.3);
      font-weight: 600;
    }

    /* Custom text input row */
    .contract-suggestion-custom-row {
      display: flex;
      gap: 8px;
      margin-bottom: 10px;
      align-items: flex-start;
    }

    .contract-suggestion-custom-input {
      flex: 1;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 4px;
      padding: 6px 10px;
      color: white;
      font-size: 12px;
      font-family: inherit;
      outline: none;
      resize: vertical;
      min-height: 32px;
      max-height: 120px;
    }

    .contract-suggestion-custom-input:focus {
      border-color: rgba(255, 255, 255, 0.5);
      background: rgba(0, 0, 0, 0.4);
    }

    .contract-suggestion-custom-input::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }

    /* Tree structure styles */
    .contract-suggestion-tree {
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-height: 400px;
      overflow-y: auto;
    }

    .contract-suggestion-tree-node {
      display: flex;
      flex-direction: column;
    }

    .contract-suggestion-tree-row {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .contract-suggestion-tree-row:hover {
      background: rgba(0, 0, 0, 0.2);
    }

    .contract-suggestion-tree-row.selected {
      background: rgba(255, 255, 255, 0.15);
    }

    .contract-suggestion-tree-toggle {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: rgba(255, 255, 255, 0.7);
      flex-shrink: 0;
      user-select: none;
    }

    .contract-suggestion-tree-toggle.has-children {
      cursor: pointer;
    }

    .contract-suggestion-tree-toggle.has-children:hover {
      color: white;
    }

    .contract-suggestion-tree-checkbox {
      width: 14px;
      height: 14px;
      cursor: pointer;
      accent-color: white;
      flex-shrink: 0;
    }

    .contract-suggestion-tree-key {
      background: rgba(255, 255, 255, 0.25);
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 9px;
      font-family: monospace;
      font-weight: 600;
      white-space: nowrap;
      flex-shrink: 0;
      min-width: 32px;
      text-align: center;
    }

    .contract-suggestion-tree-text {
      font-size: 12px;
      line-height: 1.3;
      opacity: 0.95;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }

    .contract-suggestion-tree-children {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-left: 20px;
      border-left: 1px solid rgba(255, 255, 255, 0.15);
      padding-left: 8px;
    }

    .contract-suggestion-tree-children.collapsed {
      display: none;
    }

    /* Search input styles */
    .contract-suggestion-search {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      padding: 6px 10px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 6px;
    }

    .contract-suggestion-search-icon {
      color: rgba(255, 255, 255, 0.5);
      font-size: 12px;
      flex-shrink: 0;
    }

    .contract-suggestion-search-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: white;
      font-size: 12px;
      font-family: inherit;
    }

    .contract-suggestion-search-input::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }

    .contract-suggestion-search-count {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.5);
      white-space: nowrap;
    }

    .contract-suggestion-search-clear {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.5);
      cursor: pointer;
      padding: 2px;
      font-size: 12px;
      line-height: 1;
    }

    .contract-suggestion-search-clear:hover {
      color: white;
    }

    /* Search highlight styles */
    .contract-suggestion-tree-text mark {
      background: rgba(255, 220, 0, 0.5);
      color: white;
      padding: 0 2px;
      border-radius: 2px;
    }

    .contract-suggestion-tree-row.search-match {
      background: rgba(255, 220, 0, 0.15);
    }

    .contract-suggestion-tree-row.search-match:hover {
      background: rgba(255, 220, 0, 0.25);
    }

    /* Hidden rows when filtering */
    .contract-suggestion-tree-node.search-hidden {
      display: none;
    }
  `;

  document.head.appendChild(styles);
  console.log('[UI] Styles injected');
}

/**
 * Create toast container if it doesn't exist
 * @returns {HTMLElement} Toast container
 */
function getToastContainer() {
  let container = document.getElementById(TOAST_CONTAINER_ID);

  if (!container) {
    container = document.createElement('div');
    container.id = TOAST_CONTAINER_ID;
    document.body.appendChild(container);
  }

  return container;
}

/**
 * Create prompt container if it doesn't exist
 * @returns {HTMLElement} Prompt container
 */
function getPromptContainer() {
  let container = document.getElementById(PROMPT_CONTAINER_ID);

  if (!container) {
    container = document.createElement('div');
    container.id = PROMPT_CONTAINER_ID;
    document.body.appendChild(container);
  }

  return container;
}

/**
 * Create suggestion container if it doesn't exist
 * @returns {HTMLElement} Suggestion container
 */
function getSuggestionContainer() {
  let container = document.getElementById(SUGGESTION_CONTAINER_ID);

  if (!container) {
    container = document.createElement('div');
    container.id = SUGGESTION_CONTAINER_ID;
    document.body.appendChild(container);
  }

  return container;
}

// Store current suggestion state
let currentSuggestion = {
  idea: null,
  field: null,
  text: null,
  items: [],  // Array of individual items for numbered selection (flat)
  tree: null,  // Tree structure for collapsible UI
  selectedIds: new Set(),  // Set of selected item IDs (for tree mode)
  selectedIndices: new Set(),  // Set of selected item indices (for flat mode, 0-based)
  visibleItems: []  // Array of currently visible items in DOM order [{id, text, node}]
};

/**
 * Parse suggestion text into individual items
 * @param {string} text - Suggestion text (may be newline-separated)
 * @returns {string[]} Array of individual items
 */
function parseSuggestionItems(text) {
  if (!text) return [];
  // Split by newlines and clean up
  return text.split('\n')
    .map(line => line.trim())
    .filter(line => line !== '');
}

/**
 * Toggle selection of an item by index
 * @param {number} index - 0-based index of the item
 */
function toggleItemSelection(index) {
  if (currentSuggestion.selectedIndices.has(index)) {
    currentSuggestion.selectedIndices.delete(index);
  } else {
    currentSuggestion.selectedIndices.add(index);
  }
  updateSelectionUI();
}

/**
 * Update the UI to reflect current selection state
 */
function updateSelectionUI() {
  const container = document.getElementById(SUGGESTION_CONTAINER_ID);
  if (!container) return;

  // Update item selected states
  const items = container.querySelectorAll('.contract-suggestion-item[data-index]');
  items.forEach(item => {
    const index = parseInt(item.dataset.index, 10);
    const checkbox = item.querySelector('.contract-suggestion-checkbox');
    if (currentSuggestion.selectedIndices.has(index)) {
      item.classList.add('selected');
      if (checkbox) checkbox.checked = true;
    } else {
      item.classList.remove('selected');
      if (checkbox) checkbox.checked = false;
    }
  });

  // Update Insert Selected button
  const insertBtn = container.querySelector('.contract-suggestion-btn-insert');
  if (insertBtn) {
    const count = currentSuggestion.selectedIndices.size;
    insertBtn.textContent = count > 0 ? `Insert Selected (${count})` : 'Insert Selected';
    insertBtn.disabled = count === 0;
  }
}

/**
 * Toggle selection of a tree item by ID
 * @param {string} id - Item ID
 */
function toggleTreeItemSelection(id) {
  if (currentSuggestion.selectedIds.has(id)) {
    currentSuggestion.selectedIds.delete(id);
  } else {
    currentSuggestion.selectedIds.add(id);
  }
  updateTreeSelectionUI();
}

/**
 * Update tree selection UI (checkboxes and button count)
 */
function updateTreeSelectionUI() {
  const container = document.getElementById(SUGGESTION_CONTAINER_ID);
  if (!container) return;

  // Update checkboxes
  const rows = container.querySelectorAll('.contract-suggestion-tree-row[data-id]');
  rows.forEach(row => {
    const id = row.dataset.id;
    const checkbox = row.querySelector('.contract-suggestion-tree-checkbox');
    if (currentSuggestion.selectedIds.has(id)) {
      row.classList.add('selected');
      if (checkbox) checkbox.checked = true;
    } else {
      row.classList.remove('selected');
      if (checkbox) checkbox.checked = false;
    }
  });

  // Update Insert Selected button
  const insertBtn = container.querySelector('.contract-suggestion-btn-insert');
  if (insertBtn) {
    const count = currentSuggestion.selectedIds.size;
    insertBtn.textContent = count > 0 ? `Insert Selected (${count})` : 'Insert Selected';
    insertBtn.disabled = count === 0;
  }
}

/**
 * Toggle expand/collapse of a tree node
 * @param {string} id - Node ID
 */
function toggleTreeNode(id) {
  const container = document.getElementById(SUGGESTION_CONTAINER_ID);
  if (!container) return;

  const node = container.querySelector(`.contract-suggestion-tree-node[data-id="${id}"]`);
  if (!node) return;

  const children = node.querySelector('.contract-suggestion-tree-children');
  const toggle = node.querySelector('.contract-suggestion-tree-toggle');

  if (children) {
    const isCollapsed = children.classList.contains('collapsed');
    if (isCollapsed) {
      children.classList.remove('collapsed');
      if (toggle) toggle.textContent = '▼';
    } else {
      children.classList.add('collapsed');
      if (toggle) toggle.textContent = '▶';
    }

    // Renumber visible items after expand/collapse
    renumberVisibleItems();
  }
}

/**
 * Renumber all visible items in the tree with dynamic Ctrl+N shortcuts
 */
function renumberVisibleItems() {
  const container = document.getElementById(SUGGESTION_CONTAINER_ID);
  if (!container) return;

  currentSuggestion.visibleItems = [];
  let num = 1;

  // Find all visible rows (not inside collapsed containers)
  const allRows = container.querySelectorAll('.contract-suggestion-tree-row[data-id]');

  allRows.forEach(row => {
    // Check if this row is visible (not inside a collapsed parent or search-hidden)
    let isVisible = true;
    let parent = row.parentElement;

    while (parent && parent.id !== SUGGESTION_CONTAINER_ID) {
      if (parent.classList.contains('collapsed') || parent.classList.contains('search-hidden')) {
        isVisible = false;
        break;
      }
      parent = parent.parentElement;
    }

    // Also check if the row's own node is search-hidden
    const nodeEl = row.closest('.contract-suggestion-tree-node');
    if (nodeEl && nodeEl.classList.contains('search-hidden')) {
      isVisible = false;
    }

    const keyEl = row.querySelector('.contract-suggestion-tree-key');
    if (isVisible) {
      if (keyEl) keyEl.textContent = `Ctrl+${num}`;
      currentSuggestion.visibleItems.push({
        id: row.dataset.id,
        text: row.dataset.text,
        num: num
      });
      num++;
    } else {
      if (keyEl) keyEl.textContent = '';
    }
  });

  // Update "Insert All" button with next number
  const allBtn = container.querySelector('.contract-suggestion-btn-all');
  if (allBtn) {
    allBtn.textContent = `Insert All (Ctrl+${num})`;
  }

  console.log('[UI] Renumbered', currentSuggestion.visibleItems.length, 'visible items');
}

/**
 * Search the tree and expand/highlight matching nodes
 * @param {string} query - Search query
 */
function searchTree(query) {
  const container = document.getElementById(SUGGESTION_CONTAINER_ID);
  if (!container) return;

  const tree = currentSuggestion.tree;
  if (!tree) return;

  const normalizedQuery = query.toLowerCase().trim();

  // Clear previous search state
  clearSearchHighlights();

  if (!normalizedQuery) {
    // Empty search - show all, collapse all
    collapseAllNodes();
    renumberVisibleItems();
    updateSearchCount(0, 0);
    return;
  }

  // Find all matching node IDs and their ancestors
  const matchIds = new Set();
  const ancestorIds = new Set();

  function findMatches(nodes, ancestors = []) {
    for (const node of nodes) {
      const text = node.text.toLowerCase();
      const isMatch = text.includes(normalizedQuery);

      if (isMatch) {
        matchIds.add(node.id);
        // Mark all ancestors to be expanded
        ancestors.forEach(id => ancestorIds.add(id));
      }

      if (node.children && node.children.length > 0) {
        findMatches(node.children, [...ancestors, node.id]);
      }
    }
  }

  findMatches(tree);

  // Expand ancestor nodes and highlight matches
  const allNodes = container.querySelectorAll('.contract-suggestion-tree-node[data-id]');

  allNodes.forEach(nodeEl => {
    const id = nodeEl.dataset.id;
    const row = nodeEl.querySelector('.contract-suggestion-tree-row');
    const childrenEl = nodeEl.querySelector('.contract-suggestion-tree-children');
    const toggleEl = nodeEl.querySelector('.contract-suggestion-tree-toggle');

    if (matchIds.has(id)) {
      // This is a match - highlight it
      row.classList.add('search-match');
      highlightText(row, normalizedQuery);
      nodeEl.classList.remove('search-hidden');
    } else if (ancestorIds.has(id)) {
      // This is an ancestor of a match - expand it
      nodeEl.classList.remove('search-hidden');
      if (childrenEl) {
        childrenEl.classList.remove('collapsed');
        if (toggleEl) toggleEl.textContent = '▼';
      }
    } else {
      // Not a match or ancestor - check if any descendant matches
      const hasMatchingDescendant = hasDescendantMatch(nodeEl, matchIds);
      if (!hasMatchingDescendant) {
        nodeEl.classList.add('search-hidden');
      } else {
        nodeEl.classList.remove('search-hidden');
      }
    }
  });

  // Renumber visible items after search
  renumberVisibleItems();
  updateSearchCount(matchIds.size, allNodes.length);

  console.log('[UI] Search found', matchIds.size, 'matches for:', query);
}

/**
 * Check if a node element has any descendant that matches
 * @param {HTMLElement} nodeEl - Node element
 * @param {Set} matchIds - Set of matching IDs
 * @returns {boolean}
 */
function hasDescendantMatch(nodeEl, matchIds) {
  const descendantNodes = nodeEl.querySelectorAll('.contract-suggestion-tree-node[data-id]');
  for (const desc of descendantNodes) {
    if (matchIds.has(desc.dataset.id)) {
      return true;
    }
  }
  return false;
}

/**
 * Clear all search highlights and hidden states
 */
function clearSearchHighlights() {
  const container = document.getElementById(SUGGESTION_CONTAINER_ID);
  if (!container) return;

  // Remove match highlighting
  const matchedRows = container.querySelectorAll('.search-match');
  matchedRows.forEach(row => row.classList.remove('search-match'));

  // Remove hidden state
  const hiddenNodes = container.querySelectorAll('.search-hidden');
  hiddenNodes.forEach(node => node.classList.remove('search-hidden'));

  // Remove text highlighting - restore original text
  const textEls = container.querySelectorAll('.contract-suggestion-tree-text');
  textEls.forEach(el => {
    const row = el.closest('.contract-suggestion-tree-row');
    if (row && row.dataset.text) {
      el.textContent = row.dataset.text;
    }
  });
}

/**
 * Highlight matching text within a row
 * @param {HTMLElement} row - Row element
 * @param {string} query - Search query (lowercase)
 */
function highlightText(row, query) {
  const textEl = row.querySelector('.contract-suggestion-tree-text');
  if (!textEl) return;

  const originalText = row.dataset.text || textEl.textContent;
  const lowerText = originalText.toLowerCase();
  const index = lowerText.indexOf(query);

  if (index === -1) return;

  // Build highlighted HTML
  const before = escapeHtml(originalText.substring(0, index));
  const match = escapeHtml(originalText.substring(index, index + query.length));
  const after = escapeHtml(originalText.substring(index + query.length));

  textEl.innerHTML = `${before}<mark>${match}</mark>${after}`;
}

/**
 * Collapse all tree nodes
 */
function collapseAllNodes() {
  const container = document.getElementById(SUGGESTION_CONTAINER_ID);
  if (!container) return;

  const childrenEls = container.querySelectorAll('.contract-suggestion-tree-children');
  childrenEls.forEach(el => el.classList.add('collapsed'));

  const toggleEls = container.querySelectorAll('.contract-suggestion-tree-toggle.has-children');
  toggleEls.forEach(el => el.textContent = '▶');
}

/**
 * Update search count display
 * @param {number} matchCount - Number of matches
 * @param {number} totalCount - Total number of nodes
 */
function updateSearchCount(matchCount, totalCount) {
  const container = document.getElementById(SUGGESTION_CONTAINER_ID);
  if (!container) return;

  const countEl = container.querySelector('.contract-suggestion-search-count');
  if (countEl) {
    if (matchCount > 0) {
      countEl.textContent = `${matchCount} found`;
    } else {
      countEl.textContent = '';
    }
  }
}

/**
 * Render a tree node recursively
 * @param {Object} node - Tree node {text, id, children, collapsed}
 * @param {number} depth - Current depth
 * @returns {HTMLElement} Node element
 */
function renderTreeNode(node, depth = 0) {
  const nodeEl = document.createElement('div');
  nodeEl.className = 'contract-suggestion-tree-node';
  nodeEl.dataset.id = node.id;

  const hasChildren = node.children && node.children.length > 0;
  const isCollapsed = node.collapsed !== false; // Default to collapsed

  // Row element
  const rowEl = document.createElement('div');
  rowEl.className = 'contract-suggestion-tree-row';
  rowEl.dataset.id = node.id;
  rowEl.dataset.text = node.text;

  // Toggle arrow
  const toggleEl = document.createElement('span');
  toggleEl.className = 'contract-suggestion-tree-toggle' + (hasChildren ? ' has-children' : '');
  toggleEl.textContent = hasChildren ? (isCollapsed ? '▶' : '▼') : '·';
  if (hasChildren) {
    toggleEl.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTreeNode(node.id);
    });
  }
  rowEl.appendChild(toggleEl);

  // Checkbox
  const checkboxEl = document.createElement('input');
  checkboxEl.type = 'checkbox';
  checkboxEl.className = 'contract-suggestion-tree-checkbox';
  checkboxEl.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleTreeItemSelection(node.id);
  });
  rowEl.appendChild(checkboxEl);

  // Keyboard shortcut key (will be filled by renumberVisibleItems)
  const keyEl = document.createElement('span');
  keyEl.className = 'contract-suggestion-tree-key';
  keyEl.textContent = ''; // Will be set by renumberVisibleItems
  rowEl.appendChild(keyEl);

  // Text
  const textEl = document.createElement('span');
  textEl.className = 'contract-suggestion-tree-text';
  textEl.textContent = node.text;
  textEl.title = node.text; // Show full text on hover
  rowEl.appendChild(textEl);

  // Click on row to toggle selection
  rowEl.addEventListener('click', () => {
    toggleTreeItemSelection(node.id);
  });

  nodeEl.appendChild(rowEl);

  // Children container
  if (hasChildren) {
    const childrenEl = document.createElement('div');
    childrenEl.className = 'contract-suggestion-tree-children' + (isCollapsed ? ' collapsed' : '');

    for (const child of node.children) {
      childrenEl.appendChild(renderTreeNode(child, depth + 1));
    }

    nodeEl.appendChild(childrenEl);
  }

  return nodeEl;
}

/**
 * Render the full suggestion tree
 * @param {Object[]} tree - Array of tree nodes
 * @returns {HTMLElement} Tree container element
 */
function renderSuggestionTree(tree) {
  const treeEl = document.createElement('div');
  treeEl.className = 'contract-suggestion-tree';

  for (const node of tree) {
    treeEl.appendChild(renderTreeNode(node));
  }

  return treeEl;
}

/**
 * Show a combined prompt + suggestion overlay for a field
 * Displays numbered items with Ctrl+1, Ctrl+2, etc. shortcuts
 * Supports click-to-select and multi-select with checkboxes
 * Supports tree structure with collapsible nodes
 * @param {Object} idea - Current idea object
 * @param {string} field - Field name (e.g., 'intent')
 * @param {Object|string} suggestion - Suggestion object {text, tree, items} or legacy string
 */
function showSuggestion(idea, field, suggestion) {
  injectStyles();
  const container = getSuggestionContainer();

  // Handle both new object format and legacy string format
  let suggestionText, items, tree;
  if (typeof suggestion === 'object' && suggestion !== null) {
    suggestionText = suggestion.text;
    tree = suggestion.tree || null;
    // Items from project have {text, id}, fallback templates have null
    items = suggestion.items || parseSuggestionItems(suggestion.text).map(text => ({ text, id: null }));
  } else {
    // Legacy string format
    suggestionText = suggestion;
    tree = null;
    items = parseSuggestionItems(suggestion).map(text => ({ text, id: null }));
  }

  // Hide the separate prompt since we're combining them
  hideNextField();

  // Clear existing suggestion
  container.innerHTML = '';

  // Get the prompt question for this field
  const prompt = window.ContractIntegrity?.get_field_prompt(field) || `Provide ${field}`;

  const suggestionEl = document.createElement('div');
  suggestionEl.className = 'contract-suggestion';

  // Check if we have tree structure - use tree rendering
  if (tree && tree.length > 0) {
    // Store current state for acceptance with tree mode (use selectedIds for tree)
    currentSuggestion = {
      idea,
      field,
      text: suggestionText,
      items,
      tree,
      selectedIds: new Set(),
      selectedIndices: new Set(), // For backward compat
      visibleItems: []
    };

    // Build tree UI
    const treeEl = renderSuggestionTree(tree);

    // Custom text input row
    const customRowEl = document.createElement('div');
    customRowEl.className = 'contract-suggestion-custom-row';
    customRowEl.innerHTML = `
      <textarea class="contract-suggestion-custom-input" placeholder="Type custom text (Shift+Enter for new line)..." rows="1"></textarea>
      <button class="contract-suggestion-btn contract-suggestion-btn-primary contract-suggestion-btn-add">Add</button>
    `;

    // Actions row - "Insert All" number will be updated by renumberVisibleItems
    const actionsEl = document.createElement('div');
    actionsEl.className = 'contract-suggestion-actions';
    actionsEl.innerHTML = `
      <button class="contract-suggestion-btn contract-suggestion-btn-insert" disabled>Insert Selected</button>
      <button class="contract-suggestion-btn contract-suggestion-btn-primary contract-suggestion-btn-all">Insert All</button>
    `;

    // Create search input
    const searchEl = document.createElement('div');
    searchEl.className = 'contract-suggestion-search';
    searchEl.innerHTML = `
      <span class="contract-suggestion-search-icon">🔍</span>
      <input type="text" class="contract-suggestion-search-input" placeholder="Search..." />
      <span class="contract-suggestion-search-count"></span>
      <button class="contract-suggestion-search-clear" title="Clear search">✕</button>
    `;

    suggestionEl.innerHTML = `
      <div class="contract-suggestion-header">
        <div class="contract-suggestion-field">${formatFieldName(field)}</div>
      </div>
      <div class="contract-suggestion-question">${escapeHtml(prompt)}</div>
    `;
    suggestionEl.appendChild(searchEl);
    suggestionEl.appendChild(treeEl);
    suggestionEl.appendChild(customRowEl);
    suggestionEl.appendChild(actionsEl);

    container.appendChild(suggestionEl);

    // Renumber visible items (all top-level initially visible)
    renumberVisibleItems();

    // Attach custom text input handlers
    const customInput = suggestionEl.querySelector('.contract-suggestion-custom-input');
    const addBtn = suggestionEl.querySelector('.contract-suggestion-btn-add');

    const insertCustomText = () => {
      const text = customInput?.value?.trim();
      if (text && window.ContractSuggestions?.insertCustomText) {
        window.ContractSuggestions.insertCustomText(text);
        customInput.value = '';
      }
    };

    if (customInput) {
      customInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          if (e.shiftKey) {
            // Shift+Enter: insert newline at cursor position
            const start = customInput.selectionStart;
            const end = customInput.selectionEnd;
            const value = customInput.value;
            customInput.value = value.substring(0, start) + '\n' + value.substring(end);
            customInput.selectionStart = customInput.selectionEnd = start + 1;
          } else {
            // Enter alone: submit
            insertCustomText();
          }
        }
      });
    }

    if (addBtn) {
      addBtn.addEventListener('click', insertCustomText);
    }

    // Attach search input handler
    const searchInput = suggestionEl.querySelector('.contract-suggestion-search-input');
    if (searchInput) {
      let searchTimeout = null;
      searchInput.addEventListener('input', (e) => {
        // Debounce search for performance
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          searchTree(e.target.value);
        }, 150);
      });

      // Focus search on Ctrl+F when suggestion is visible
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          searchInput.value = '';
          searchTree('');
          searchInput.blur();
        }
      });
    }

    // Attach clear button handler
    const clearBtn = suggestionEl.querySelector('.contract-suggestion-search-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          searchTree('');
        }
      });
    }

    // Attach click handler to Insert Selected button
    const insertBtn = suggestionEl.querySelector('.contract-suggestion-btn-insert');
    if (insertBtn) {
      insertBtn.addEventListener('click', () => {
        if (window.ContractSuggestions?.acceptSelectedTreeItems) {
          window.ContractSuggestions.acceptSelectedTreeItems();
        }
      });
    }

    // Attach click handler to Insert All button
    const allBtn = suggestionEl.querySelector('.contract-suggestion-btn-all');
    if (allBtn) {
      allBtn.addEventListener('click', () => {
        if (window.ContractSuggestions?.acceptSuggestion) {
          window.ContractSuggestions.acceptSuggestion(null);
        }
      });
    }

    console.log('[UI] Showing tree suggestion with', tree.length, 'root nodes for', field);
  } else {
    // Flat items mode (legacy)
    // Store current state for acceptance (reset selection)
    currentSuggestion = { idea, field, text: suggestionText, items, selectedIndices: new Set() };

    // Build numbered items HTML with checkboxes
    let itemsHtml = '';
    items.forEach((item, index) => {
      const num = index + 1;
      const displayText = typeof item === 'object' ? item.text : item;
      itemsHtml += `
        <div class="contract-suggestion-item" data-index="${index}">
          <input type="checkbox" class="contract-suggestion-checkbox" />
          <span class="contract-suggestion-key">Ctrl+${num}</span>
          <span class="contract-suggestion-value">${escapeHtml(displayText)}</span>
        </div>
      `;
    });

    // Custom text input row
    const customRowHtml = `
      <div class="contract-suggestion-custom-row">
        <textarea class="contract-suggestion-custom-input" placeholder="Type custom text (Shift+Enter for new line)..." rows="1"></textarea>
        <button class="contract-suggestion-btn contract-suggestion-btn-primary contract-suggestion-btn-add">Add</button>
      </div>
    `;

    // Add actions row with Insert All and Insert Selected
    const actionsHtml = items.length > 0 ? `
      <div class="contract-suggestion-actions">
        <button class="contract-suggestion-btn contract-suggestion-btn-insert" disabled>Insert Selected</button>
        <button class="contract-suggestion-btn contract-suggestion-btn-primary contract-suggestion-btn-all">Insert All (Ctrl+${items.length + 1})</button>
      </div>
    ` : '';

    suggestionEl.innerHTML = `
      <div class="contract-suggestion-header">
        <div class="contract-suggestion-field">${formatFieldName(field)}</div>
      </div>
      <div class="contract-suggestion-question">${escapeHtml(prompt)}</div>
      <div class="contract-suggestion-items">${itemsHtml}</div>
      ${customRowHtml}
      ${actionsHtml}
    `;

    container.appendChild(suggestionEl);

    // Attach click handlers to items
    const itemEls = suggestionEl.querySelectorAll('.contract-suggestion-item[data-index]');
    itemEls.forEach(itemEl => {
      itemEl.addEventListener('click', (e) => {
        // Prevent double-toggle if clicking directly on checkbox
        if (e.target.classList.contains('contract-suggestion-checkbox')) {
          e.stopPropagation();
        }
        const index = parseInt(itemEl.dataset.index, 10);
        toggleItemSelection(index);
      });

      // Handle checkbox direct clicks
      const checkbox = itemEl.querySelector('.contract-suggestion-checkbox');
      if (checkbox) {
        checkbox.addEventListener('click', (e) => {
          e.stopPropagation();
          const index = parseInt(itemEl.dataset.index, 10);
          toggleItemSelection(index);
        });
      }
    });

    // Attach click handler to Insert Selected button
    const insertBtn = suggestionEl.querySelector('.contract-suggestion-btn-insert');
    if (insertBtn) {
      insertBtn.addEventListener('click', () => {
        if (window.ContractSuggestions?.acceptSelectedItems) {
          window.ContractSuggestions.acceptSelectedItems();
        }
      });
    }

    // Attach click handler to Insert All button
    const allBtn = suggestionEl.querySelector('.contract-suggestion-btn-all');
    if (allBtn) {
      allBtn.addEventListener('click', () => {
        if (window.ContractSuggestions?.acceptSuggestion) {
          window.ContractSuggestions.acceptSuggestion(null);
        }
      });
    }

    // Attach custom text input handlers
    const customInput = suggestionEl.querySelector('.contract-suggestion-custom-input');
    const addBtn = suggestionEl.querySelector('.contract-suggestion-btn-add');

    const insertCustomText = () => {
      const text = customInput?.value?.trim();
      if (text && window.ContractSuggestions?.insertCustomText) {
        window.ContractSuggestions.insertCustomText(text);
        customInput.value = '';
      }
    };

    if (customInput) {
      customInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          if (e.shiftKey) {
            // Shift+Enter: insert newline at cursor position
            const start = customInput.selectionStart;
            const end = customInput.selectionEnd;
            const value = customInput.value;
            customInput.value = value.substring(0, start) + '\n' + value.substring(end);
            customInput.selectionStart = customInput.selectionEnd = start + 1;
          } else {
            // Enter alone: submit
            insertCustomText();
          }
        }
      });
    }

    if (addBtn) {
      addBtn.addEventListener('click', insertCustomText);
    }

    console.log('[UI] Showing', items.length, 'flat suggestion items for', field);
  }
}

/**
 * Hide the suggestion overlay
 */
function hideSuggestion() {
  const container = document.getElementById(SUGGESTION_CONTAINER_ID);
  if (container) {
    const suggestion = container.querySelector('.contract-suggestion');
    if (suggestion) {
      suggestion.classList.add('closing');
      setTimeout(() => {
        container.innerHTML = '';
      }, 200);
    }
  }
  currentSuggestion = { idea: null, field: null, text: null, items: [], tree: null, selectedIndices: new Set(), selectedIds: new Set(), visibleItems: [] };
}

/**
 * Get the current suggestion state
 * @returns {Object} Current suggestion { idea, field, text, items, selectedIndices }
 */
function getCurrentSuggestion() {
  return currentSuggestion;
}

/**
 * Get the currently selected item indices
 * @returns {number[]} Array of selected indices (0-based)
 */
function getSelectedIndices() {
  return Array.from(currentSuggestion.selectedIndices);
}

/**
 * Get icon SVG for toast type
 * @param {string} type - Toast type
 * @returns {string} SVG string
 */
function getToastIcon(type) {
  const icons = {
    error: `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>`,
    warning: `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`,
    success: `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`,
    info: `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>`
  };

  return icons[type] || icons.info;
}

/**
 * Create a toast notification element
 * @param {string} type - Toast type (error, warning, success, info)
 * @param {string} title - Toast title
 * @param {string} message - Toast message
 * @param {number} duration - Duration in ms (0 for no auto-dismiss)
 * @returns {HTMLElement} Toast element
 */
function createToast(type, title, message, duration = 5000) {
  const toast = document.createElement('div');
  toast.className = `contract-toast ${type}`;

  toast.innerHTML = `
    <div class="contract-toast-icon">${getToastIcon(type)}</div>
    <div class="contract-toast-content">
      <div class="contract-toast-title">${escapeHtml(title)}</div>
      <div class="contract-toast-message">${escapeHtml(message)}</div>
    </div>
    <button class="contract-toast-close" title="Close">
      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
      </svg>
    </button>
  `;

  // Close button handler
  const closeBtn = toast.querySelector('.contract-toast-close');
  closeBtn.addEventListener('click', () => dismissToast(toast));

  // Auto-dismiss
  if (duration > 0) {
    setTimeout(() => dismissToast(toast), duration);
  }

  return toast;
}

/**
 * Dismiss a toast with animation
 * @param {HTMLElement} toast - Toast element
 */
function dismissToast(toast) {
  toast.classList.add('closing');
  setTimeout(() => {
    toast.remove();
  }, 200);
}

/**
 * Show a toast notification
 * @param {string} type - Toast type
 * @param {string} title - Toast title
 * @param {string} message - Toast message
 * @param {number} duration - Duration in ms
 */
function showToast(type, title, message, duration = 5000) {
  injectStyles();
  const container = getToastContainer();
  const toast = createToast(type, title, message, duration);
  container.appendChild(toast);
}

/**
 * Show an error toast
 * @param {string} title - Error title
 * @param {string} message - Error message
 */
function showError(title, message) {
  showToast(TOAST_TYPES.ERROR, title, message, 7000);
}

/**
 * Show a warning toast
 * @param {string} title - Warning title
 * @param {string} message - Warning message
 */
function showWarning(title, message) {
  showToast(TOAST_TYPES.WARNING, title, message, 5000);
}

/**
 * Show a success toast
 * @param {string} title - Success title
 * @param {string} message - Success message
 */
function showSuccess(title, message) {
  showToast(TOAST_TYPES.SUCCESS, title, message, 3000);
}

/**
 * Show an info toast
 * @param {string} title - Info title
 * @param {string} message - Info message
 */
function showInfo(title, message) {
  showToast(TOAST_TYPES.INFO, title, message, 4000);
}

/**
 * Show the next field prompt
 * @param {Object} idea - Idea object
 * @param {Object} validation - Validation result
 */
function showNextField(idea, validation) {
  injectStyles();

  const container = getPromptContainer();

  // Clear existing prompt
  container.innerHTML = '';

  if (!validation.next_field) {
    return; // All fields resolved
  }

  const nextField = validation.next_field;
  const prompt = window.ContractIntegrity?.get_field_prompt(nextField) || `Provide ${nextField}`;

  const promptEl = document.createElement('div');
  promptEl.className = 'contract-prompt';

  // Just the question - pure signal
  promptEl.innerHTML = `
    <div class="contract-prompt-field">${formatFieldName(nextField)}</div>
    <div class="contract-prompt-question">${escapeHtml(prompt)}</div>
  `;

  container.appendChild(promptEl);
}

/**
 * Hide the next field prompt
 */
function hideNextField() {
  const container = document.getElementById(PROMPT_CONTAINER_ID);
  if (container) {
    container.innerHTML = '';
  }
}

/**
 * Show validation errors for an idea
 * @param {Object} idea - Idea object
 * @param {Array<string>} errors - Validation errors
 */
function showValidationErrors(idea, errors) {
  if (errors.length === 0) return;

  const title = `Validation Error: ${idea.title}`;
  const message = errors.join('\n');

  showError(title, message);
}

/**
 * Show validation warnings for an idea
 * @param {Object} idea - Idea object
 * @param {Array<string>} warnings - Validation warnings
 */
function showValidationWarnings(idea, warnings) {
  if (warnings.length === 0) return;

  const title = `Warning: ${idea.title}`;
  const message = warnings.join('\n');

  showWarning(title, message);
}

/**
 * Show state change notification
 * @param {Object} idea - Idea object
 * @param {string} oldState - Previous state
 * @param {string} newState - New state
 */
function showStateChange(idea, oldState, newState) {
  const title = idea.title;
  const message = `State: ${oldState || 'none'} → ${newState}`;

  if (newState === 'done') {
    showSuccess(title, message);
  } else {
    showInfo(title, message);
  }
}

/**
 * Block #done tag attempt - show error
 * @param {Object} idea - Idea object
 * @param {string} missingField - The missing required field
 */
function blockDoneTag(idea, missingField) {
  showError(
    'Cannot Mark as Done',
    `"${idea.title}" is missing: ${formatFieldName(missingField)}`
  );
}

/**
 * Format field name for display
 * @param {string} field - Field name (e.g., 'qa_doc')
 * @returns {string} Formatted name (e.g., 'QA Document')
 */
function formatFieldName(field) {
  const names = {
    intent: 'Intent',
    stakeholders: 'Stakeholders',
    owner: 'Owner',
    system_ref: 'System Reference',
    qa_doc: 'QA Document',
    update_set: 'Update Set',
    qa_results: 'QA Results'
  };

  return names[field] || field;
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Create a state badge element
 * @param {string} state - State name
 * @returns {HTMLElement} Badge element
 */
function createStateBadge(state) {
  const badge = document.createElement('span');
  badge.className = 'contract-state-badge';
  badge.style.background = STATE_COLORS[state] || '#6b7280';
  badge.textContent = state.toUpperCase();
  return badge;
}

// Export for use in other modules
window.ContractUI = {
  // Initialization
  injectStyles,

  // Toast notifications
  showToast,
  showError,
  showWarning,
  showSuccess,
  showInfo,

  // Prompts
  showNextField,
  hideNextField,

  // Suggestions
  showSuggestion,
  hideSuggestion,
  getCurrentSuggestion,
  getSelectedIndices,

  // Validation feedback
  showValidationErrors,
  showValidationWarnings,
  showStateChange,
  blockDoneTag,

  // Utilities
  formatFieldName,
  escapeHtml,
  createStateBadge,

  // Constants
  TOAST_TYPES,
  STATE_COLORS
};

console.log('[Contract UI] Loaded');

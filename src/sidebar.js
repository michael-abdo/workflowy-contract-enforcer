/**
 * Sidebar Module - AI Proposal Panel
 *
 * Provides:
 * - Side panel UI for viewing/editing AI proposals
 * - WorkFlowy-matching tree rendering
 * - Current vs Proposed comparison view
 * - Edit capability for proposed content
 * - Approve/Cancel actions
 */

console.log('[Contract Sidebar] Script loading...');

// Constants
const SIDEBAR_CONTAINER_ID = 'contract-sidebar-container';
const SIDEBAR_STYLES_ID = 'contract-sidebar-styles';
const SIDEBAR_TOGGLE_ID = 'contract-sidebar-toggle';

// Sidebar state
let sidebarState = {
  isVisible: false,
  currentIdea: null,
  currentField: null,
  currentItems: [],      // Current content (array of {text, id})
  proposedItems: [],     // Proposed content (array of {text, id})
  editedItems: [],       // User-edited content
  isEditing: false
};

/**
 * Inject sidebar-specific styles
 */
function injectSidebarStyles() {
  if (document.getElementById(SIDEBAR_STYLES_ID)) {
    return; // Already injected
  }

  const styles = document.createElement('style');
  styles.id = SIDEBAR_STYLES_ID;
  styles.textContent = `
    /* Sidebar Container */
    #${SIDEBAR_CONTAINER_ID} {
      position: fixed;
      top: 0;
      right: 0;
      width: 380px;
      height: 100vh;
      background: var(--wf-background, #1e1e1e);
      border-left: 1px solid var(--wf-border-default, #333);
      z-index: 999990;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.25s ease-out;
      font-family: inherit;
    }

    #${SIDEBAR_CONTAINER_ID}.visible {
      transform: translateX(0);
    }

    /* Push main content when sidebar is open */
    body.contract-sidebar-open .page {
      margin-right: 380px;
      transition: margin-right 0.25s ease-out;
    }

    body:not(.contract-sidebar-open) .page {
      transition: margin-right 0.25s ease-out;
    }

    /* Sidebar Header */
    .contract-sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--wf-space-m, 12px) var(--wf-space-l, 16px);
      border-bottom: 1px solid var(--wf-border-default, #333);
      background: var(--wf-background-secondary, #252525);
      flex-shrink: 0;
    }

    .contract-sidebar-title {
      font-size: var(--wf-font-size-base, 14px);
      font-weight: var(--wf-font-weight-semibold, 600);
      color: var(--wf-text-primary, #e0e0e0);
      margin: 0;
    }

    .contract-sidebar-field {
      font-size: var(--wf-font-size-s, 12px);
      color: var(--wf-text-helper, #888);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }

    .contract-sidebar-close {
      background: none;
      border: none;
      color: var(--wf-icon-tertiary, #666);
      cursor: pointer;
      padding: var(--wf-space-s, 8px);
      border-radius: var(--wf-radius-s, 4px);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, color 0.15s;
    }

    .contract-sidebar-close:hover {
      background: var(--wf-background-inverse-transparent, rgba(255,255,255,0.1));
      color: var(--wf-text-primary, #e0e0e0);
    }

    /* Sidebar Body */
    .contract-sidebar-body {
      flex: 1;
      overflow-y: auto;
      padding: var(--wf-space-m, 12px);
    }

    /* Section styling */
    .contract-sidebar-section {
      margin-bottom: var(--wf-space-l, 16px);
    }

    .contract-sidebar-section-header {
      font-size: var(--wf-font-size-xs, 11px);
      font-weight: var(--wf-font-weight-semibold, 600);
      color: var(--wf-text-helper, #888);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: var(--wf-space-s, 8px);
      padding-bottom: var(--wf-space-xs, 4px);
      border-bottom: 1px solid var(--wf-border-default, #333);
    }

    .contract-sidebar-section-header.current {
      color: var(--wf-text-helper, #888);
    }

    .contract-sidebar-section-header.proposed {
      color: var(--wf-highlight, #6eb5ff);
    }

    /* Tree structure - matches WorkFlowy */
    .contract-sidebar-tree {
      font-size: var(--wf-font-size-base, 14px);
      line-height: var(--wf-line-height-base, 1.5);
      color: var(--wf-text-primary, #e0e0e0);
    }

    .contract-sidebar-project {
      position: relative;
      padding-left: 24px;
    }

    .contract-sidebar-name {
      display: flex;
      align-items: flex-start;
      padding: 2px 0;
      min-height: 24px;
    }

    .contract-sidebar-bullet {
      position: absolute;
      left: 0;
      top: 6px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--wf-text-primary, #e0e0e0);
      opacity: 0.6;
    }

    .contract-sidebar-bullet.has-children {
      background: transparent;
      border: 1.5px solid var(--wf-text-primary, #e0e0e0);
      opacity: 0.6;
    }

    .contract-sidebar-content {
      flex: 1;
    }

    .contract-sidebar-innerContent {
      display: inline;
      word-wrap: break-word;
    }

    .contract-sidebar-children {
      margin-left: 0;
    }

    /* Proposed section styling */
    .contract-sidebar-section.proposed .contract-sidebar-tree {
      background: var(--wf-background-inverse-transparent, rgba(110, 181, 255, 0.08));
      border-radius: var(--wf-radius-s, 4px);
      padding: var(--wf-space-s, 8px);
      border: 1px solid var(--wf-highlight, rgba(110, 181, 255, 0.3));
    }

    /* Editable state */
    .contract-sidebar-tree.editable {
      cursor: text;
    }

    .contract-sidebar-tree.editable:focus {
      outline: none;
      background: var(--wf-background-inverse-transparent, rgba(110, 181, 255, 0.12));
    }

    .contract-sidebar-tree.editable .contract-sidebar-innerContent {
      min-width: 10px;
      display: inline-block;
    }

    /* Edit hint */
    .contract-sidebar-edit-hint {
      font-size: var(--wf-font-size-xs, 11px);
      color: var(--wf-text-helper, #666);
      margin-top: var(--wf-space-xs, 4px);
      font-style: italic;
    }

    /* Empty state */
    .contract-sidebar-empty {
      font-size: var(--wf-font-size-s, 12px);
      color: var(--wf-text-helper, #666);
      font-style: italic;
      padding: var(--wf-space-m, 12px);
    }

    /* Actions bar */
    .contract-sidebar-actions {
      display: flex;
      gap: var(--wf-space-m, 12px);
      padding: var(--wf-space-m, 12px) var(--wf-space-l, 16px);
      border-top: 1px solid var(--wf-border-default, #333);
      background: var(--wf-background-secondary, #252525);
      flex-shrink: 0;
    }

    .contract-sidebar-btn {
      flex: 1;
      padding: var(--wf-space-s, 8px) var(--wf-space-m, 12px);
      border-radius: var(--wf-radius-s, 4px);
      font-size: var(--wf-font-size-s, 12px);
      font-weight: var(--wf-font-weight-semibold, 600);
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
      border: none;
    }

    .contract-sidebar-btn:active {
      transform: scale(0.98);
    }

    .contract-sidebar-btn-approve {
      background: var(--wf-button-background-primary, #4a9eff);
      color: var(--wf-text-on-color, #fff);
    }

    .contract-sidebar-btn-approve:hover {
      background: var(--wf-button-background-primary-hover, #3a8eef);
    }

    .contract-sidebar-btn-cancel {
      background: var(--wf-button-background-secondary, #333);
      color: var(--wf-text-primary, #e0e0e0);
    }

    .contract-sidebar-btn-cancel:hover {
      background: var(--wf-button-background-secondary-hover, #444);
    }

    /* Completed item styling */
    .contract-sidebar-innerContent.completed {
      text-decoration: line-through;
      opacity: 0.6;
    }

    /* Diff highlighting */
    .contract-sidebar-added {
      background: rgba(46, 160, 67, 0.2);
      border-radius: 2px;
    }

    .contract-sidebar-removed {
      background: rgba(248, 81, 73, 0.2);
      text-decoration: line-through;
      border-radius: 2px;
    }

    /* Toggle button on right edge */
    #${SIDEBAR_TOGGLE_ID} {
      position: fixed;
      top: 50%;
      right: 0;
      transform: translateY(-50%);
      width: 24px;
      height: 48px;
      background: var(--wf-background-secondary, #252525);
      border: 1px solid var(--wf-border-default, #333);
      border-right: none;
      border-radius: 6px 0 0 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999991;
      transition: background 0.15s, width 0.15s;
      color: var(--wf-icon-tertiary, #888);
    }

    #${SIDEBAR_TOGGLE_ID}:hover {
      background: var(--wf-background-inverse-transparent, rgba(255,255,255,0.1));
      color: var(--wf-text-primary, #e0e0e0);
      width: 28px;
    }

    #${SIDEBAR_TOGGLE_ID} svg {
      transition: transform 0.25s ease-out;
    }

    body.contract-sidebar-open #${SIDEBAR_TOGGLE_ID} {
      right: 380px;
    }

    body.contract-sidebar-open #${SIDEBAR_TOGGLE_ID} svg {
      transform: rotate(180deg);
    }
  `;

  document.head.appendChild(styles);
  console.log('[Sidebar] Styles injected');

  // Also create the toggle button
  createToggleButton();
}

/**
 * Create and inject the toggle button
 */
function createToggleButton() {
  if (document.getElementById(SIDEBAR_TOGGLE_ID)) {
    return; // Already exists
  }

  const toggle = document.createElement('button');
  toggle.id = SIDEBAR_TOGGLE_ID;
  toggle.title = 'Toggle AI Panel';
  toggle.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
    </svg>
  `;

  toggle.addEventListener('click', () => {
    if (sidebarState.isVisible) {
      hide();
    } else {
      // Try to show with current contract context
      showWithCurrentContext();
    }
  });

  document.body.appendChild(toggle);
  console.log('[Sidebar] Toggle button created');
}

/**
 * Show sidebar with current contract context (if available)
 */
function showWithCurrentContext() {
  // Try to get from current focused contract
  if (window.ContractParser && window.ContractObserver && window.ContractIntegrity) {
    const focused = window.ContractParser.getFocusedItem();
    if (focused) {
      const idea = window.ContractObserver.getIdea(focused.data.id);
      if (idea) {
        const validation = window.ContractIntegrity.validate_idea(
          window.ContractObserver.ideaStore,
          idea
        );
        const suggestion = window.ContractIntegrity.get_field_suggestion(validation.next_field, idea);
        show(idea, validation.next_field, suggestion);
        return;
      }
    }
  }

  // No context available - show empty sidebar with message
  sidebarState = {
    isVisible: true,
    currentIdea: null,
    currentField: null,
    currentItems: [],
    proposedItems: [],
    editedItems: [],
    isEditing: false
  };

  const container = getSidebarContainer();
  container.innerHTML = `
    <div class="contract-sidebar-header">
      <div>
        <h3 class="contract-sidebar-title">AI Panel</h3>
        <div class="contract-sidebar-field">No contract selected</div>
      </div>
      <button class="contract-sidebar-close" title="Close sidebar">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
      </button>
    </div>
    <div class="contract-sidebar-body">
      <div class="contract-sidebar-empty">
        Select a contract node (#contract) to see suggestions here.
      </div>
    </div>
  `;
  container.classList.add('visible');
  document.body.classList.add('contract-sidebar-open');

  // Attach close handler
  const closeBtn = container.querySelector('.contract-sidebar-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => hide());
  }
}

/**
 * Get or create sidebar container
 * @returns {HTMLElement}
 */
function getSidebarContainer() {
  let container = document.getElementById(SIDEBAR_CONTAINER_ID);

  if (!container) {
    container = document.createElement('div');
    container.id = SIDEBAR_CONTAINER_ID;
    document.body.appendChild(container);
  }

  return container;
}

/**
 * Render sidebar HTML structure
 * @returns {string} HTML string
 */
function renderSidebarHTML() {
  const fieldLabel = formatFieldName(sidebarState.currentField);
  const ideaTitle = sidebarState.currentIdea?.title || 'Untitled';

  return `
    <div class="contract-sidebar-header">
      <div>
        <h3 class="contract-sidebar-title">${escapeHtml(ideaTitle)}</h3>
        <div class="contract-sidebar-field">${fieldLabel}</div>
      </div>
      <button class="contract-sidebar-close" title="Close sidebar">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
      </button>
    </div>
    <div class="contract-sidebar-body">
      <div class="contract-sidebar-section current">
        <div class="contract-sidebar-section-header current">Current</div>
        <div class="contract-sidebar-tree" id="sidebar-current-tree">
          ${renderTreeItems(sidebarState.currentItems, false)}
        </div>
      </div>
      <div class="contract-sidebar-section proposed">
        <div class="contract-sidebar-section-header proposed">Proposed</div>
        <div class="contract-sidebar-tree editable" id="sidebar-proposed-tree" contenteditable="true">
          ${renderTreeItems(sidebarState.proposedItems, true)}
        </div>
        <div class="contract-sidebar-edit-hint">Click to edit proposed content</div>
      </div>
    </div>
    <div class="contract-sidebar-actions">
      <button class="contract-sidebar-btn contract-sidebar-btn-cancel">Cancel</button>
      <button class="contract-sidebar-btn contract-sidebar-btn-approve">Approve</button>
    </div>
  `;
}

/**
 * Render tree items as HTML
 * @param {Array<{text: string, id: string|null}>} items - Items to render
 * @param {boolean} editable - Whether items are in editable section
 * @returns {string} HTML string
 */
function renderTreeItems(items, editable = false) {
  if (!items || items.length === 0) {
    return '<div class="contract-sidebar-empty">No content</div>';
  }

  return items.map((item, index) => {
    const text = typeof item === 'object' ? item.text : item;
    const itemId = typeof item === 'object' ? item.id : null;

    // Check if item is completed
    let completedClass = '';
    if (itemId && typeof WF !== 'undefined') {
      try {
        const wfItem = WF.getItemById(itemId);
        if (wfItem && wfItem.isCompleted()) {
          completedClass = ' completed';
        }
      } catch (e) {
        // Ignore
      }
    }

    return `
      <div class="contract-sidebar-project" data-index="${index}" data-id="${itemId || ''}">
        <div class="contract-sidebar-name">
          <div class="contract-sidebar-bullet"></div>
          <div class="contract-sidebar-content">
            <span class="contract-sidebar-innerContent${completedClass}">${escapeHtml(text)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Escape HTML special characters
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Format field name for display
 * @param {string} field
 * @returns {string}
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
  return names[field] || field || 'Field';
}

/**
 * Show the sidebar with content
 * @param {Object} idea - Current idea object
 * @param {string} field - Field name
 * @param {Object} suggestion - Suggestion object {items, tree, text}
 */
function show(idea, field, suggestion) {
  injectSidebarStyles();

  // Parse current content from the idea's field
  const currentItems = getCurrentFieldItems(idea, field);

  // Parse proposed content from suggestion
  let proposedItems = [];
  if (suggestion) {
    if (suggestion.items && suggestion.items.length > 0) {
      proposedItems = suggestion.items;
    } else if (suggestion.text) {
      // Legacy text format
      proposedItems = suggestion.text.split('\n')
        .filter(line => line.trim())
        .map(text => ({ text: text.trim(), id: null }));
    }
  }

  // Update state
  sidebarState = {
    isVisible: true,
    currentIdea: idea,
    currentField: field,
    currentItems: currentItems,
    proposedItems: proposedItems,
    editedItems: [...proposedItems],
    isEditing: false
  };

  // Render sidebar
  const container = getSidebarContainer();
  container.innerHTML = renderSidebarHTML();
  container.classList.add('visible');
  document.body.classList.add('contract-sidebar-open');

  // Attach event handlers
  attachEventHandlers(container);

  console.log('[Sidebar] Shown for field:', field);
}

/**
 * Get current field items from idea
 * @param {Object} idea
 * @param {string} field
 * @returns {Array<{text: string, id: string|null}>}
 */
function getCurrentFieldItems(idea, field) {
  if (!idea || !field) return [];

  // Try to get from the idea's resolved fields
  const fieldKey = field + '_local';
  const localValue = idea[fieldKey];

  if (Array.isArray(localValue)) {
    return localValue.map(item => {
      if (typeof item === 'string') {
        return { text: item, id: null };
      }
      return item;
    });
  }

  if (typeof localValue === 'string' && localValue.trim()) {
    return [{ text: localValue, id: null }];
  }

  // Try to get from WF node directly
  if (idea.id && typeof WF !== 'undefined' && window.ContractParser) {
    const contractItem = window.ContractParser.getItemById(idea.id);
    if (contractItem) {
      const fieldItem = window.ContractParser.findFieldChild(contractItem, field);
      if (fieldItem) {
        const children = fieldItem.getChildren();
        return children.map(child => ({
          text: child.getNameInPlainText(),
          id: child.getId()
        }));
      }
    }
  }

  return [];
}

/**
 * Hide the sidebar
 */
function hide() {
  const container = document.getElementById(SIDEBAR_CONTAINER_ID);
  if (container) {
    container.classList.remove('visible');
  }
  document.body.classList.remove('contract-sidebar-open');

  sidebarState.isVisible = false;
  console.log('[Sidebar] Hidden');
}

/**
 * Toggle sidebar visibility
 */
function toggle() {
  if (sidebarState.isVisible) {
    hide();
  } else if (sidebarState.currentIdea && sidebarState.currentField) {
    show(sidebarState.currentIdea, sidebarState.currentField, {
      items: sidebarState.proposedItems
    });
  }
}

/**
 * Attach event handlers to sidebar elements
 * @param {HTMLElement} container
 */
function attachEventHandlers(container) {
  // Close button
  const closeBtn = container.querySelector('.contract-sidebar-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => hide());
  }

  // Cancel button
  const cancelBtn = container.querySelector('.contract-sidebar-btn-cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => hide());
  }

  // Approve button
  const approveBtn = container.querySelector('.contract-sidebar-btn-approve');
  if (approveBtn) {
    approveBtn.addEventListener('click', () => handleApprove());
  }

  // Editable proposed tree
  const proposedTree = container.querySelector('#sidebar-proposed-tree');
  if (proposedTree) {
    proposedTree.addEventListener('input', () => handleEdit(proposedTree));
    proposedTree.addEventListener('focus', () => {
      sidebarState.isEditing = true;
    });
    proposedTree.addEventListener('blur', () => {
      sidebarState.isEditing = false;
      // Parse edited content
      parseEditedContent(proposedTree);
    });
  }
}

/**
 * Handle edit events in proposed tree
 * @param {HTMLElement} treeEl
 */
function handleEdit(treeEl) {
  // Mark as editing
  sidebarState.isEditing = true;
}

/**
 * Parse edited content from the contenteditable tree
 * @param {HTMLElement} treeEl
 */
function parseEditedContent(treeEl) {
  const projectEls = treeEl.querySelectorAll('.contract-sidebar-project');
  const editedItems = [];

  projectEls.forEach(projectEl => {
    const innerContent = projectEl.querySelector('.contract-sidebar-innerContent');
    if (innerContent) {
      const text = innerContent.textContent.trim();
      const id = projectEl.dataset.id || null;
      if (text) {
        editedItems.push({ text, id: id || null });
      }
    }
  });

  // If no structured items found, treat entire content as text
  if (editedItems.length === 0) {
    const text = treeEl.textContent.trim();
    if (text) {
      // Split by newlines
      const lines = text.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        editedItems.push({ text: line.trim(), id: null });
      });
    }
  }

  sidebarState.editedItems = editedItems;
  console.log('[Sidebar] Parsed edited items:', editedItems.length);
}

/**
 * Handle approve button click
 */
function handleApprove() {
  const { currentIdea, currentField, editedItems, proposedItems } = sidebarState;

  if (!currentIdea || !currentField) {
    console.warn('[Sidebar] No idea or field to approve');
    return;
  }

  // Use edited items if available, otherwise proposed
  const itemsToInsert = editedItems.length > 0 ? editedItems : proposedItems;

  if (itemsToInsert.length === 0) {
    console.warn('[Sidebar] No items to insert');
    return;
  }

  console.log('[Sidebar] Approving', itemsToInsert.length, 'items for', currentField);

  // Use the existing createOrUpdateField from suggestions module
  if (window.ContractSuggestions?.createOrUpdateField) {
    const success = window.ContractSuggestions.createOrUpdateField(
      currentIdea,
      currentField,
      itemsToInsert
    );

    if (success) {
      hide();
      if (window.ContractUI) {
        window.ContractUI.showSuccess('Changes Applied', `${formatFieldName(currentField)}: ${itemsToInsert.length} items inserted`);
      }
    } else {
      if (window.ContractUI) {
        window.ContractUI.showError('Failed to Apply', 'Could not insert items');
      }
    }
  } else {
    console.error('[Sidebar] ContractSuggestions.createOrUpdateField not available');
  }
}

/**
 * Check if sidebar is currently visible
 * @returns {boolean}
 */
function isVisible() {
  return sidebarState.isVisible;
}

/**
 * Get current sidebar state
 * @returns {Object}
 */
function getState() {
  return { ...sidebarState };
}

// Export module
window.ContractSidebar = {
  show,
  hide,
  toggle,
  isVisible,
  getState,
  injectStyles: injectSidebarStyles
};

console.log('[Contract Sidebar] Loaded');

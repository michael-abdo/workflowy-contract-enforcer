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
const OPENAI_MODEL = 'gpt-4o-mini';
const OPENAI_API_KEY_STORAGE = 'contract_enforcer_openai_key';

// Sidebar state
let sidebarState = {
  isVisible: false,
  currentIdea: null,
  currentField: null,
  currentItems: [],      // Current content (array of {text, id})
  proposedItems: [],     // Proposed content (array of {text, id})
  editedItems: [],       // User-edited content
  isEditing: false,
  isLoading: false,      // AI request in progress
  currentWFItem: null,
  apiKey: null           // Cached API key
};

// Pending OpenAI requests
const pendingRequests = new Map();

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

    /* Edit textarea for generated content */
    .contract-sidebar-edit-textarea {
      width: 100%;
      min-height: 200px;
      padding: var(--wf-space-m, 12px);
      border: 1px solid var(--wf-highlight, rgba(110, 181, 255, 0.3));
      border-radius: var(--wf-radius-s, 4px);
      background: var(--wf-background-inverse-transparent, rgba(110, 181, 255, 0.08));
      color: var(--wf-text-primary, #e0e0e0);
      font-family: inherit;
      font-size: var(--wf-font-size-base, 14px);
      line-height: var(--wf-line-height-base, 1.5);
      resize: vertical;
    }

    .contract-sidebar-edit-textarea:focus {
      outline: none;
      border-color: var(--wf-highlight, #6eb5ff);
      background: var(--wf-background-inverse-transparent, rgba(110, 181, 255, 0.12));
    }

    .contract-sidebar-edit-textarea::placeholder {
      color: var(--wf-text-helper, #666);
    }

    /* Empty state */
    .contract-sidebar-empty {
      font-size: var(--wf-font-size-s, 12px);
      color: var(--wf-text-helper, #666);
      font-style: italic;
      padding: var(--wf-space-m, 12px);
    }

    /* Placeholder text */
    .contract-sidebar-placeholder {
      font-size: var(--wf-font-size-s, 12px);
      color: var(--wf-text-helper, #555);
      font-style: italic;
    }

    .contract-sidebar-tree.editable:empty::before {
      content: attr(data-placeholder);
      color: var(--wf-text-helper, #555);
      font-style: italic;
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

    /* AI Chatbox */
    .contract-sidebar-chatbox {
      display: flex;
      flex-direction: column;
      gap: var(--wf-space-s, 8px);
      padding: var(--wf-space-m, 12px);
      border-bottom: 1px solid var(--wf-border-default, #333);
      background: var(--wf-background-secondary, #252525);
    }

    .contract-sidebar-chatbox-label {
      font-size: var(--wf-font-size-xs, 11px);
      font-weight: var(--wf-font-weight-semibold, 600);
      color: var(--wf-text-helper, #888);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .contract-sidebar-chatbox-input {
      width: 100%;
      min-height: 60px;
      padding: var(--wf-space-s, 8px);
      border: 1px solid var(--wf-border-default, #444);
      border-radius: var(--wf-radius-s, 4px);
      background: var(--wf-background, #1e1e1e);
      color: var(--wf-text-primary, #e0e0e0);
      font-family: inherit;
      font-size: var(--wf-font-size-s, 12px);
      resize: vertical;
    }

    .contract-sidebar-chatbox-input:focus {
      outline: none;
      border-color: var(--wf-highlight, #6eb5ff);
    }

    .contract-sidebar-chatbox-input::placeholder {
      color: var(--wf-text-helper, #666);
    }

    .contract-sidebar-chatbox-actions {
      display: flex;
      gap: var(--wf-space-s, 8px);
      align-items: center;
    }

    .contract-sidebar-btn-ai {
      flex: 1;
      padding: var(--wf-space-s, 8px) var(--wf-space-m, 12px);
      border-radius: var(--wf-radius-s, 4px);
      font-size: var(--wf-font-size-s, 12px);
      font-weight: var(--wf-font-weight-semibold, 600);
      cursor: pointer;
      border: none;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      transition: opacity 0.15s, transform 0.1s;
    }

    .contract-sidebar-btn-ai:hover {
      opacity: 0.9;
    }

    .contract-sidebar-btn-ai:active {
      transform: scale(0.98);
    }

    .contract-sidebar-btn-ai:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .contract-sidebar-btn-settings {
      padding: var(--wf-space-s, 8px);
      border-radius: var(--wf-radius-s, 4px);
      background: var(--wf-button-background-secondary, #333);
      border: none;
      color: var(--wf-icon-tertiary, #888);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .contract-sidebar-btn-settings:hover {
      background: var(--wf-button-background-secondary-hover, #444);
      color: var(--wf-text-primary, #e0e0e0);
    }

    /* Loading spinner */
    .contract-sidebar-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--wf-space-l, 16px);
      color: var(--wf-text-helper, #888);
      font-size: var(--wf-font-size-s, 12px);
    }

    .contract-sidebar-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid var(--wf-border-default, #444);
      border-top-color: var(--wf-highlight, #6eb5ff);
      border-radius: 50%;
      animation: sidebar-spin 0.8s linear infinite;
      margin-right: var(--wf-space-s, 8px);
    }

    @keyframes sidebar-spin {
      to { transform: rotate(360deg); }
    }

    /* Error state */
    .contract-sidebar-error {
      padding: var(--wf-space-m, 12px);
      background: rgba(248, 81, 73, 0.1);
      border: 1px solid rgba(248, 81, 73, 0.3);
      border-radius: var(--wf-radius-s, 4px);
      color: #f85149;
      font-size: var(--wf-font-size-s, 12px);
      margin: var(--wf-space-s, 8px) 0;
    }

    /* API Key modal */
    .contract-sidebar-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
    }

    .contract-sidebar-modal-content {
      background: var(--wf-background, #1e1e1e);
      border: 1px solid var(--wf-border-default, #333);
      border-radius: var(--wf-radius-m, 8px);
      padding: var(--wf-space-l, 16px);
      width: 320px;
      max-width: 90vw;
    }

    .contract-sidebar-modal-title {
      font-size: var(--wf-font-size-base, 14px);
      font-weight: var(--wf-font-weight-semibold, 600);
      color: var(--wf-text-primary, #e0e0e0);
      margin-bottom: var(--wf-space-m, 12px);
    }

    .contract-sidebar-modal-input {
      width: 100%;
      padding: var(--wf-space-s, 8px);
      border: 1px solid var(--wf-border-default, #444);
      border-radius: var(--wf-radius-s, 4px);
      background: var(--wf-background-secondary, #252525);
      color: var(--wf-text-primary, #e0e0e0);
      font-family: inherit;
      font-size: var(--wf-font-size-s, 12px);
      margin-bottom: var(--wf-space-m, 12px);
    }

    .contract-sidebar-modal-actions {
      display: flex;
      gap: var(--wf-space-s, 8px);
      justify-content: flex-end;
    }
  `;

  document.head.appendChild(styles);
  console.log('[Sidebar] Styles injected');

  // Also create the toggle button
  createToggleButton();

  // Set up URL change detection
  setupUrlChangeDetection();
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
 * Show sidebar with current node context (any node, not just contracts)
 */
function showWithCurrentContext() {
  // Get the currently focused/zoomed item in WorkFlowy
  const currentItem = getCurrentItem();

  if (currentItem) {
    const itemName = currentItem.getNameInPlainText() || 'Untitled';
    const itemId = currentItem.getId();
    const children = currentItem.getChildren() || [];

    // Build items from children
    const childItems = children.map(child => ({
      text: child.getNameInPlainText(),
      id: child.getId()
    }));

    // Update state
    sidebarState = {
      isVisible: true,
      currentIdea: { title: itemName, id: itemId },
      currentField: 'children',
      currentItems: childItems,
      proposedItems: [],  // Empty until AI provides suggestions
      editedItems: [],
      isEditing: false,
      currentWFItem: currentItem  // Store reference to WF item
    };

    const container = getSidebarContainer();
    container.innerHTML = renderSidebarForNode(itemName, childItems);
    container.classList.add('visible');
    document.body.classList.add('contract-sidebar-open');

    // Attach event handlers
    attachEventHandlers(container);
    console.log('[Sidebar] Showing for node:', itemName);
    return;
  }

  // No node available - show empty sidebar
  showEmptySidebar();
}

/**
 * Get the current WorkFlowy item (zoomed or focused)
 * @returns {Object|null} WorkFlowy item or null
 */
function getCurrentItem() {
  if (typeof WF === 'undefined') return null;

  try {
    // First try to get the currently zoomed item
    const currentItem = WF.currentItem();
    if (currentItem) return currentItem;

    // Fallback to root
    return WF.rootItem();
  } catch (e) {
    console.error('[Sidebar] Error getting current item:', e);
    return null;
  }
}

/**
 * Render sidebar HTML for a generic node (not contract-specific)
 * @param {string} nodeName - Name of the current node
 * @param {Array} children - Current children of the node
 * @returns {string} HTML string
 */
function renderSidebarForNode(nodeName, children) {
  const hasChildren = children && children.length > 0;

  return `
    <div class="contract-sidebar-header">
      <div>
        <h3 class="contract-sidebar-title">${escapeHtml(nodeName)}</h3>
        <div class="contract-sidebar-field">${hasChildren ? children.length + ' children' : 'No children'}</div>
      </div>
      <button class="contract-sidebar-close" title="Close sidebar">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
      </button>
    </div>
    <div class="contract-sidebar-chatbox">
      <div class="contract-sidebar-chatbox-label">Ask AI</div>
      <textarea class="contract-sidebar-chatbox-input" id="sidebar-chat-input" placeholder="What would you like to add? (e.g., 'Break this into subtasks' or 'Add pros and cons')"></textarea>
      <div class="contract-sidebar-chatbox-actions">
        <button class="contract-sidebar-btn-ai" id="sidebar-ask-ai-btn">
          <span>Generate</span>
        </button>
        <button class="contract-sidebar-btn-settings" id="sidebar-settings-btn" title="API Settings">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="contract-sidebar-body">
      <div class="contract-sidebar-section proposed">
        <div class="contract-sidebar-section-header proposed">Generated Content</div>
        <textarea class="contract-sidebar-edit-textarea" id="sidebar-proposed-tree" placeholder="- Item 1&#10;  - Sub-item&#10;    - Nested item&#10;- Item 2&#10;&#10;WorkFlowy format: dash + 2-space indents">${sidebarState.proposedItems.length > 0 ? sidebarState.proposedItems.map(item => typeof item === 'object' ? item.text : item).join('\n') : ''}</textarea>
        <div class="contract-sidebar-edit-hint">0 items • WorkFlowy format with nested support</div>
      </div>
    </div>
    <div class="contract-sidebar-actions">
      <button class="contract-sidebar-btn contract-sidebar-btn-cancel">Cancel</button>
      <button class="contract-sidebar-btn contract-sidebar-btn-approve">Insert</button>
    </div>
  `;
}

/**
 * Show empty sidebar when no node context available
 */
function showEmptySidebar() {
  sidebarState = {
    isVisible: true,
    currentIdea: null,
    currentField: null,
    currentItems: [],
    proposedItems: [],
    editedItems: [],
    isEditing: false,
    currentWFItem: null
  };

  const container = getSidebarContainer();
  container.innerHTML = `
    <div class="contract-sidebar-header">
      <div>
        <h3 class="contract-sidebar-title">AI Panel</h3>
        <div class="contract-sidebar-field">Navigate to a node</div>
      </div>
      <button class="contract-sidebar-close" title="Close sidebar">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
      </button>
    </div>
    <div class="contract-sidebar-body">
      <div class="contract-sidebar-empty">
        Zoom into a node to add content here.
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
 * Update sidebar when URL changes (navigation)
 */
function onUrlChange() {
  if (sidebarState.isVisible) {
    // Refresh the sidebar with new context
    console.log('[Sidebar] URL changed, refreshing...');
    showWithCurrentContext();
  }
}

/**
 * Set up URL change detection
 */
function setupUrlChangeDetection() {
  let lastHash = window.location.hash;

  // Check for hash changes periodically (WorkFlowy uses hash navigation)
  setInterval(() => {
    const currentHash = window.location.hash;
    if (currentHash !== lastHash) {
      lastHash = currentHash;
      onUrlChange();
    }
  }, 300);

  // Also listen for popstate
  window.addEventListener('popstate', () => {
    setTimeout(onUrlChange, 100);
  });

  console.log('[Sidebar] URL change detection active');
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
      <div class="contract-sidebar-section proposed">
        <div class="contract-sidebar-section-header proposed">Suggested Content</div>
        <div class="contract-sidebar-tree editable" id="sidebar-proposed-tree" contenteditable="true">
          ${renderTreeItems(sidebarState.proposedItems, true)}
        </div>
        <div class="contract-sidebar-edit-hint">Click to edit before approving</div>
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

  // Editable textarea - update item count on input
  const textarea = container.querySelector('#sidebar-proposed-tree');
  const editHint = container.querySelector('.contract-sidebar-edit-hint');
  if (textarea && editHint) {
    textarea.addEventListener('input', () => {
      const lines = textarea.value.split('\n').filter(line => line.trim());
      editHint.textContent = `${lines.length} items • Edit freely, one per line`;
    });
  }

  // Ask AI button
  const askAiBtn = container.querySelector('#sidebar-ask-ai-btn');
  if (askAiBtn) {
    askAiBtn.addEventListener('click', () => handleAskAI());
  }

  // Settings button
  const settingsBtn = container.querySelector('#sidebar-settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => handleSettingsClick());
  }

  // Chat input - Enter to submit (Shift+Enter for newline)
  const chatInput = container.querySelector('#sidebar-chat-input');
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleAskAI();
      }
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
 * Build context string from all visible/expanded nodes
 * @param {Object} item - WF item to start from
 * @param {number} indent - Current indentation level
 * @returns {string} WorkFlowy-format text of visible tree
 */
function buildVisibleContext(item, indent = 0) {
  if (!item) return '';

  const lines = [];
  const prefix = '  '.repeat(indent);
  const name = item.getNameInPlainText ? item.getNameInPlainText() : '';

  // Add this item (skip root if it has no name)
  if (name || indent > 0) {
    lines.push(`${prefix}- ${name}`);
  }

  // Recursively add children if this node is expanded
  const isExpanded = item.isExpanded ? item.isExpanded() : true;
  if (isExpanded) {
    const children = item.getChildren ? item.getChildren() : [];
    for (const child of children) {
      lines.push(buildVisibleContext(child, name ? indent + 1 : indent));
    }
  }

  return lines.filter(line => line.trim()).join('\n');
}

/**
 * Parse WorkFlowy format text into a tree structure
 * @param {string} text - Text in WorkFlowy format (- item with 2-space indents)
 * @returns {Array} Tree structure [{text, children: [...]}]
 */
function parseWorkflowyFormat(text) {
  const lines = text.split('\n').filter(line => line.trim());
  const root = { children: [] };
  const stack = [{ node: root, indent: -1 }];

  for (const line of lines) {
    // Count leading spaces
    const match = line.match(/^(\s*)-\s*(.*)/);
    if (!match) continue;

    const indent = match[1].length;
    const content = match[2].trim();

    if (!content) continue;

    const newNode = { text: content, children: [] };

    // Find parent (last item with smaller indent)
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    // Add to parent's children
    stack[stack.length - 1].node.children.push(newNode);

    // Push onto stack for potential children
    stack.push({ node: newNode, indent });
  }

  return root.children;
}

/**
 * Recursively insert tree items into WorkFlowy
 * @param {Object} parent - WF parent item
 * @param {Array} items - Array of {text, children} items
 */
function insertTreeItems(parent, items) {
  items.forEach(item => {
    const newItem = WF.createItem(parent, 0); // 0 = insert at end
    WF.setItemName(newItem, item.text);

    if (item.children && item.children.length > 0) {
      insertTreeItems(newItem, item.children);
    }
  });
}

/**
 * Count total items in tree (including nested)
 * @param {Array} items
 * @returns {number}
 */
function countTreeItems(items) {
  let count = 0;
  for (const item of items) {
    count++;
    if (item.children) {
      count += countTreeItems(item.children);
    }
  }
  return count;
}

/**
 * Handle approve/insert button click
 */
function handleApprove() {
  const textarea = document.querySelector('#sidebar-proposed-tree');
  const { currentWFItem } = sidebarState;

  const text = textarea ? textarea.value.trim() : '';
  if (!text) {
    console.warn('[Sidebar] No items to insert');
    if (window.ContractUI) {
      window.ContractUI.showWarning('Nothing to Insert', 'Enter some content first');
    }
    return;
  }

  // Parse WorkFlowy format into tree structure
  const tree = parseWorkflowyFormat(text);

  if (tree.length === 0) {
    // Fallback: treat as plain text (one item per line)
    const lines = text.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      tree.push({ text: line.replace(/^[-•*]\s*/, '').trim(), children: [] });
    });
  }

  const totalItems = countTreeItems(tree);

  if (totalItems === 0) {
    if (window.ContractUI) {
      window.ContractUI.showWarning('Nothing to Insert', 'Enter some content first');
    }
    return;
  }

  // Get the target node
  const targetItem = currentWFItem || getCurrentItem();

  if (!targetItem) {
    console.error('[Sidebar] No target node available');
    if (window.ContractUI) {
      window.ContractUI.showError('Error', 'No target node found');
    }
    return;
  }

  console.log('[Sidebar] Inserting', totalItems, 'items (tree) into', targetItem.getNameInPlainText());

  // Insert items using WF API
  try {
    WF.editGroup(() => {
      insertTreeItems(targetItem, tree);
    });

    hide();
    if (window.ContractUI) {
      window.ContractUI.showSuccess('Inserted', `${totalItems} item${totalItems === 1 ? '' : 's'} added`);
    }
  } catch (e) {
    console.error('[Sidebar] Error inserting items:', e);
    if (window.ContractUI) {
      window.ContractUI.showError('Insert Failed', e.message);
    }
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

// ==================== OpenAI Integration ====================

/**
 * Get stored API key
 * @returns {Promise<string|null>}
 */
async function getApiKey() {
  if (sidebarState.apiKey) {
    return sidebarState.apiKey;
  }

  return new Promise((resolve) => {
    const handler = (event) => {
      if (event.data?.type === 'CONTRACT_ENFORCER_STORAGE_RESULT' &&
          event.data?.payload?.key === OPENAI_API_KEY_STORAGE) {
        window.removeEventListener('message', handler);
        const key = event.data.payload.value || null;
        sidebarState.apiKey = key;
        resolve(key);
      }
    };
    window.addEventListener('message', handler);

    window.postMessage({
      type: 'CONTRACT_ENFORCER_STORAGE_GET',
      payload: { key: OPENAI_API_KEY_STORAGE }
    }, '*');

    // Timeout after 2 seconds
    setTimeout(() => {
      window.removeEventListener('message', handler);
      resolve(null);
    }, 2000);
  });
}

/**
 * Store API key
 * @param {string} key
 */
function storeApiKey(key) {
  sidebarState.apiKey = key;
  window.postMessage({
    type: 'CONTRACT_ENFORCER_STORAGE_SET',
    payload: { key: OPENAI_API_KEY_STORAGE, value: key }
  }, '*');
}

/**
 * Show API key modal
 * @returns {Promise<string|null>}
 */
function showApiKeyModal() {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'contract-sidebar-modal';
    modal.innerHTML = `
      <div class="contract-sidebar-modal-content">
        <div class="contract-sidebar-modal-title">Enter OpenAI API Key</div>
        <input type="password" class="contract-sidebar-modal-input" placeholder="sk-..." id="sidebar-api-key-input">
        <div class="contract-sidebar-modal-actions">
          <button class="contract-sidebar-btn contract-sidebar-btn-cancel" id="sidebar-api-key-cancel">Cancel</button>
          <button class="contract-sidebar-btn contract-sidebar-btn-approve" id="sidebar-api-key-save">Save</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const input = modal.querySelector('#sidebar-api-key-input');
    const saveBtn = modal.querySelector('#sidebar-api-key-save');
    const cancelBtn = modal.querySelector('#sidebar-api-key-cancel');

    input.focus();

    const cleanup = () => {
      modal.remove();
    };

    saveBtn.addEventListener('click', () => {
      const key = input.value.trim();
      if (key) {
        storeApiKey(key);
        cleanup();
        resolve(key);
      }
    });

    cancelBtn.addEventListener('click', () => {
      cleanup();
      resolve(null);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveBtn.click();
      } else if (e.key === 'Escape') {
        cancelBtn.click();
      }
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cancelBtn.click();
      }
    });
  });
}

/**
 * Call OpenAI API
 * @param {string} prompt - User prompt
 * @param {string} context - Page context
 * @returns {Promise<string>}
 */
async function callOpenAI(prompt, context) {
  let apiKey = await getApiKey();

  if (!apiKey) {
    apiKey = await showApiKeyModal();
    if (!apiKey) {
      throw new Error('API key required');
    }
  }

  const requestId = Date.now().toString();

  const systemPrompt = `You are a helpful assistant that generates structured content for WorkFlowy, an outliner app.

The user is currently viewing a node with this content:
"""
${context}
"""

Based on the user's request, generate a hierarchical list of items to add as children to this node.

IMPORTANT: Return as a plain text list that can be directly imported into WorkFlowy. Use exactly this format:
- Parent item
  - Child item (2 space indent)
    - Grandchild item (4 space indent)
      - Great-grandchild (6 space indent)

Rules:
1. Every line starts with "- " (dash space)
2. Use 2 spaces per indent level
3. Only indent as deep as the content actually requires
4. For hyperlinks, use this format: [Link Text](https://url.com)
5. No numbering, no bullet variations, just "- "

Example:
- Research phase
  - Gather requirements
    - Interview stakeholders
    - Review existing docs
  - Analyze competitors
- Development phase
  - Design system architecture
  - Implement core features`;

  return new Promise((resolve, reject) => {
    const handler = (event) => {
      if (event.data?.type === 'CONTRACT_ENFORCER_OPENAI_RESULT' &&
          event.data?.payload?.requestId === requestId) {
        window.removeEventListener('message', handler);

        if (event.data.payload.success) {
          const content = event.data.payload.data.choices?.[0]?.message?.content;
          if (content) {
            resolve(content);
          } else {
            reject(new Error('No response content'));
          }
        } else {
          reject(new Error(event.data.payload.error || 'API call failed'));
        }
      }
    };
    window.addEventListener('message', handler);

    // Store pending request
    pendingRequests.set(requestId, { resolve, reject, handler });

    window.postMessage({
      type: 'CONTRACT_ENFORCER_OPENAI_CALL',
      payload: {
        requestId,
        apiKey,
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      }
    }, '*');

    // Timeout after 30 seconds
    setTimeout(() => {
      window.removeEventListener('message', handler);
      pendingRequests.delete(requestId);
      reject(new Error('Request timed out'));
    }, 30000);
  });
}

/**
 * Handle Ask AI button click
 */
async function handleAskAI() {
  const chatInput = document.querySelector('#sidebar-chat-input');
  const textarea = document.querySelector('#sidebar-proposed-tree');
  const askBtn = document.querySelector('#sidebar-ask-ai-btn');
  const editHint = document.querySelector('.contract-sidebar-edit-hint');

  if (!chatInput || !textarea) return;

  const prompt = chatInput.value.trim();
  if (!prompt) {
    if (window.ContractUI) {
      window.ContractUI.showWarning('Empty Prompt', 'Enter a message for the AI');
    }
    return;
  }

  // Get current node context (all visible/expanded nodes)
  const currentItem = getCurrentItem();
  const context = currentItem ? buildVisibleContext(currentItem) : '';
  console.log('[Sidebar] Context for AI:', context.split('\n').length, 'lines');

  // Show loading state
  sidebarState.isLoading = true;
  if (askBtn) {
    askBtn.disabled = true;
    askBtn.innerHTML = '<span>Thinking...</span>';
  }
  textarea.placeholder = 'Generating...';
  textarea.disabled = true;

  try {
    const response = await callOpenAI(prompt, context);

    // Keep the WorkFlowy format intact (preserve dashes and indentation)
    const lines = response.split('\n').filter(line => line.trim());
    const itemCount = lines.filter(line => line.trim().startsWith('-')).length;

    // Put response directly in textarea (preserving format)
    textarea.value = response.trim();

    // Update hint
    if (editHint) {
      editHint.textContent = `${itemCount} items • WorkFlowy format (copy/paste or Insert)`;
    }

    console.log('[Sidebar] AI generated', itemCount, 'items');

  } catch (e) {
    console.error('[Sidebar] AI error:', e);
    textarea.value = '';
    textarea.placeholder = `Error: ${e.message}\n\nType or paste content here...`;

    if (window.ContractUI) {
      window.ContractUI.showError('AI Error', e.message);
    }
  } finally {
    sidebarState.isLoading = false;
    textarea.disabled = false;
    textarea.placeholder = '- Item 1\n  - Sub-item\n- Item 2\n\nWorkFlowy format with 2-space indents';
    if (askBtn) {
      askBtn.disabled = false;
      askBtn.innerHTML = '<span>Generate</span>';
    }
  }
}

/**
 * Handle settings button click
 */
async function handleSettingsClick() {
  await showApiKeyModal();
}

// ==================== End OpenAI Integration ====================

// Export module
window.ContractSidebar = {
  show,
  hide,
  toggle,
  isVisible,
  getState,
  injectStyles: injectSidebarStyles,
  askAI: handleAskAI,
  setApiKey: storeApiKey
};

console.log('[Contract Sidebar] Loaded');
